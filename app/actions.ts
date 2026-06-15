'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { ACTIVITY_COLUMNS } from '@/lib/activities';
import { getCurrentUser, requireAuth } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { getUserAvatar, getUserName, getUsersByIds } from '@/lib/users';
import {
  createNotification,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markResponseNotificationsAsRead,
  markNotificationsByRelatedId,
} from '@/lib/notifications';
import {
  getUnreadConversationsCount,
  markConversationAsRead,
} from '@/lib/messages';
import type {
  Activity,
  ConversationPreview,
  Participation,
  ParticipationWithUser,
  Profile,
} from '@/lib/types';

const admin = () => createAdminClient();

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100';

async function enrichParticipations(
  participations: Participation[]
): Promise<ParticipationWithUser[]> {
  const userIds = Array.from(new Set(participations.map((p) => p.user_id)));
  const profiles = await getUsersByIds(userIds);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return participations.map((p) => {
    const profile = profileMap.get(p.user_id);
    return {
      ...p,
      user_name: profile?.name ?? 'Utilisateur',
      user_avatar: profile?.avatar_url ?? DEFAULT_AVATAR,
    };
  });
}

function authError() {
  return {
    success: false as const,
    error: 'Connecte-toi avec Strava pour continuer.',
  };
}

export async function createActivity(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const distance = Number(formData.get('distance'));
    const elevation = Number(formData.get('elevation'));
    const description = formData.get('description') as string;

    if (!date || !time || !title) {
      return {
        success: false,
        error: "La date, l'heure et le titre sont obligatoires.",
      };
    }

    const dateTimeString = `${date}T${time}:00`;
    const dateObj = new Date(dateTimeString);

    if (isNaN(dateObj.getTime())) {
      return {
        success: false,
        error: "Le format de la date ou de l'heure est invalide.",
      };
    }

    const start_date = dateObj.toISOString();

    const { error } = await admin().from('activities').insert([
      {
        title,
        type,
        start_date,
        location,
        distance,
        elevation,
        description,
        organizer_id: currentUser.id,
        organizer_name: currentUser.name,
        organizer_avatar: currentUser.avatar,
      },
    ]);

    if (error) {
      console.error('Erreur Supabase:', error);
      return {
        success: false,
        error: "Impossible d'enregistrer la sortie dans la base de données.",
      };
    }

    revalidatePath('/');
    revalidatePath('/activities');
    return { success: true };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return { success: false, error: 'Une erreur inattendue est survenue.' };
  }
}

export async function getMyActivities() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const now = new Date().toISOString();

    const { data: organizedData, error: orgError } = await admin()
      .from('activities')
      .select(ACTIVITY_COLUMNS)
      .eq('organizer_id', currentUser.id);

    const { data: participationsData, error: partError } = await admin()
      .from('participations')
      .select(
        `
        status,
        activities (${ACTIVITY_COLUMNS})
      `
      )
      .eq('user_id', currentUser.id);

    if (orgError || partError) {
      console.error('Erreur Supabase:', orgError, partError);
      return { success: false, error: 'Impossible de charger les données.' };
    }

    type ParticipationRow = {
      status: string;
      activities: Activity | null;
    };

    const rows = (participationsData ?? []) as unknown as ParticipationRow[];

    const myActivities = {
      'mes-sorties':
        organizedData?.filter((a) => (a as Activity).start_date >= now) || [],
      validees:
        rows
          .filter(
            (p) =>
              p.status === 'approved' &&
              p.activities &&
              p.activities.start_date >= now
          )
          .map((p) => p.activities!) || [],
      'en-cours':
        rows
          .filter(
            (p) =>
              p.status === 'pending' &&
              p.activities &&
              p.activities.start_date >= now
          )
          .map((p) => p.activities!) || [],
      passees: [
        ...(organizedData?.filter((a) => (a as Activity).start_date < now) ||
          []),
        ...(rows
          .filter(
            (p) =>
              p.status === 'approved' &&
              p.activities &&
              p.activities.start_date < now
          )
          .map((p) => p.activities!) || []),
      ],
    };

    return { success: true, data: myActivities };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return {
      success: false,
      error: 'Une erreur est survenue lors du chargement.',
    };
  }
}

export async function getConversation(contactId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const { data, error } = await admin()
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true });

    if (error) throw error;

    await markConversationAsRead(currentUser.id, contactId);
    // Rafraîchit le badge "Messages" de la barre de navigation (layout racine).
    revalidatePath('/', 'layout');

    return { success: true, data };
  } catch (err) {
    console.error('Erreur getConversation:', err);
    return { success: false, error: 'Impossible de charger les messages.' };
  }
}

export async function sendMessage(receiverId: string, content: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const { error } = await admin().from('messages').insert([
      {
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_avatar: currentUser.avatar,
        receiver_id: receiverId,
        content: content,
      },
    ]);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('Erreur sendMessage:', err);
    return { success: false, error: "Impossible d'envoyer le message." };
  }
}

export async function getActivityById(id: string) {
  try {
    const { getActivityByIdFromDb } = await import('@/lib/activities');
    const data = await getActivityByIdFromDb(id);
    if (!data) throw new Error('Not found');
    return { success: true, data };
  } catch (err) {
    console.error('Erreur getActivityById:', err);
    return { success: false, error: 'Sortie introuvable.' };
  }
}

export async function getActivityParticipations(activityId: string) {
  try {
    const { data, error } = await admin()
      .from('participations')
      .select('*')
      .eq('activity_id', activityId);

    if (error) throw error;

    const participations = await enrichParticipations(data as Participation[]);
    return {
      success: true,
      data: {
        pending: participations.filter((p) => p.status === 'pending'),
        approved: participations.filter((p) => p.status === 'approved'),
      },
    };
  } catch (err) {
    console.error('Erreur getActivityParticipations:', err);
    return {
      success: false,
      error: 'Impossible de charger les participations.',
    };
  }
}

export async function getMyParticipationForActivity(activityId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: true, data: null };

    const { data, error } = await admin()
      .from('participations')
      .select('*')
      .eq('activity_id', activityId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data: data as Participation | null };
  } catch (err) {
    console.error('Erreur getMyParticipationForActivity:', err);
    return {
      success: false,
      error: 'Impossible de vérifier ta participation.',
    };
  }
}

// Notifie l'organisateur qu'un utilisateur demande à rejoindre sa sortie.
// La notification (type participation_request) s'affiche sur la cloche et
// disparaît dès que l'organisateur accepte ou refuse (cf. related_id).
async function notifyOrganizerOfRequest(
  activity: Activity,
  requesterName: string,
  participationId: string
) {
  await createNotification({
    userId: activity.organizer_id,
    type: 'participation_request',
    title: 'Nouvelle demande de participation',
    body: `${requesterName} souhaite participer à "${activity.title}".`,
    link: `/activities/${activity.id}`,
    relatedId: participationId,
  });
}

export async function requestParticipation(activityId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const activityResult = await getActivityById(activityId);
    if (!activityResult.success || !activityResult.data) {
      return { success: false, error: 'Sortie introuvable.' };
    }

    if (activityResult.data.organizer_id === currentUser.id) {
      return {
        success: false,
        error: "Tu es déjà l'organisateur de cette sortie.",
      };
    }

    const existing = await getMyParticipationForActivity(activityId);
    if (existing.data) {
      if (existing.data.status === 'pending') {
        return { success: false, error: 'Ta demande est déjà en attente.' };
      }
      if (existing.data.status === 'approved') {
        return { success: false, error: 'Tu participes déjà à cette sortie.' };
      }
      if (existing.data.status === 'rejected') {
        const { error } = await admin()
          .from('participations')
          .update({ status: 'pending' })
          .eq('id', existing.data.id);
        if (error) throw error;

        await notifyOrganizerOfRequest(
          activityResult.data,
          currentUser.name,
          existing.data.id
        );

        revalidatePath(`/activities/${activityId}`);
        revalidatePath('/activities');
        revalidatePath('/', 'layout');
        return { success: true };
      }
    }

    const { data: inserted, error } = await admin()
      .from('participations')
      .insert([
        {
          user_id: currentUser.id,
          activity_id: activityId,
          status: 'pending',
        },
      ])
      .select('id')
      .single();

    if (error) throw error;

    await notifyOrganizerOfRequest(
      activityResult.data,
      currentUser.name,
      inserted.id
    );

    revalidatePath(`/activities/${activityId}`);
    revalidatePath('/activities');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Erreur requestParticipation:', err);
    return { success: false, error: "Impossible d'envoyer la demande." };
  }
}

export async function updateParticipationStatus(
  participationId: string,
  status: 'approved' | 'rejected'
) {
  try {
    const currentUser = await requireAuth();

    const { data: participation, error: fetchError } = await admin()
      .from('participations')
      .select('*, activities(organizer_id, title)')
      .eq('id', participationId)
      .single();

    if (fetchError || !participation) {
      return { success: false, error: 'Demande introuvable.' };
    }

    const activityInfo = participation.activities as {
      organizer_id: string;
      title: string;
    };

    if (activityInfo?.organizer_id !== currentUser.id) {
      return { success: false, error: 'Action non autorisée.' };
    }

    const { error } = await admin()
      .from('participations')
      .update({ status })
      .eq('id', participationId);

    if (error) throw error;

    // La demande d'acceptation a été traitée : on retire la notification
    // "participation_request" de la cloche de l'organisateur.
    await markNotificationsByRelatedId(participationId);

    await createNotification({
      userId: participation.user_id,
      type: status === 'approved' ? 'participation_approved' : 'participation_rejected',
      title: status === 'approved' ? 'Demande acceptée' : 'Demande refusée',
      body:
        status === 'approved'
          ? `Ta demande pour participer à "${activityInfo.title}" a été acceptée !`
          : `Ta demande pour participer à "${activityInfo.title}" a été refusée.`,
      link: `/activities/${participation.activity_id}`,
    });

    revalidatePath(`/activities/${participation.activity_id}`);
    revalidatePath('/activities');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Erreur updateParticipationStatus:', err);
    return {
      success: false,
      error: 'Impossible de mettre à jour la demande.',
    };
  }
}

export async function getApprovedParticipantsForActivities(
  activityIds: string[]
) {
  if (activityIds.length === 0) return {};

  try {
    const { data, error } = await admin()
      .from('participations')
      .select('*')
      .in('activity_id', activityIds)
      .eq('status', 'approved');

    if (error) throw error;

    const enriched = await enrichParticipations(data as Participation[]);
    const map: Record<string, ParticipationWithUser[]> = {};
    for (const p of enriched) {
      if (!map[p.activity_id]) map[p.activity_id] = [];
      map[p.activity_id].push(p);
    }
    return map;
  } catch (err) {
    console.error('Erreur getApprovedParticipantsForActivities:', err);
    return {};
  }
}

export async function getCurrentUserAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Non authentifié' };
  return { success: true, data: user };
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'short' });
}

export async function getConversations() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const { data, error } = await admin()
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const seen = new Set<string>();
    const conversations: ConversationPreview[] = [];

    for (const msg of data ?? []) {
      const contactId =
        msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
      if (seen.has(contactId)) continue;
      seen.add(contactId);

      conversations.push({
        contactId,
        contactName: await getUserName(contactId),
        contactAvatar: await getUserAvatar(contactId),
        lastMessage: msg.content,
        time: formatMessageTime(msg.created_at),
      });
    }

    return { success: true, data: conversations };
  } catch (err) {
    console.error('Erreur getConversations:', err);
    return { success: false, error: 'Impossible de charger les messages.' };
  }
}

export async function getContactProfileAction(contactId: string) {
  const profile = await getUsersByIds([contactId]);
  const user = profile[0] as Profile | undefined;
  return {
    success: true,
    data: {
      name: user?.name ?? 'Utilisateur',
      avatar:
        user?.avatar_url ??
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100',
    },
  };
}

export async function getNotifications() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const data = await getNotificationsForUser(currentUser.id);
    return { success: true, data };
  } catch (err) {
    console.error('Erreur getNotifications:', err);
    return { success: false, error: 'Impossible de charger les notifications.' };
  }
}

export async function getNavBadgesAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { unreadMessages: 0, unreadNotifications: 0 };
  }

  // La cloche regroupe désormais les demandes d'acceptation de sortie ET les
  // réponses (participation validée / refusée) : ce sont toutes des lignes
  // non lues de la table notifications.
  const [unreadMessages, unreadNotifications] = await Promise.all([
    getUnreadConversationsCount(currentUser.id),
    getUnreadNotificationCount(currentUser.id),
  ]);

  return { unreadMessages, unreadNotifications };
}

// Appelé à l'ouverture de la page Notifications : les réponses à une demande de
// participation (acceptée / refusée) disparaissent de la cloche. Les demandes
// d'acceptation de sortie restent, elles, jusqu'à ce qu'on accepte ou refuse.
// (Marquage seul, sans revalidate : appelé pendant le rendu de la page.)
export async function getNotificationsAndMarkResponsesRead() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const data = await getNotificationsForUser(currentUser.id);
    await markResponseNotificationsAsRead(currentUser.id);
    return { success: true, data };
  } catch (err) {
    console.error('Erreur getNotificationsAndMarkResponsesRead:', err);
    return { success: false, error: 'Impossible de charger les notifications.' };
  }
}
