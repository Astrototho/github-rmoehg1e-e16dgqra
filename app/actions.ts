'use server';

// Server Actions appelées depuis les composants client. Chaque action est un
// point d'entrée HTTP public : elle revérifie la session, valide tous ses
// arguments et renvoie { success, data?, error? } au lieu de lever une erreur.
// Les lectures faites pendant le rendu des pages serveur vivent dans lib/.

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { signOut } from '@/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUser } from '@/lib/session';
import { getActivityByIdFromDb } from '@/lib/activities';
import { getUserParticipation, getParticipantIdsToNotify } from '@/lib/participations';
import { getMatchPercentages } from '@/lib/feed';
import { MATCHING_VERSION } from '@/lib/matching';
import { getUserById } from '@/lib/users';
import { getConversationMessages } from '@/lib/conversations';
import { markConversationAsRead } from '@/lib/messages';
import {
  createNotification,
  createNotifications,
  markNotificationsByRelatedId,
} from '@/lib/notifications';
import {
  deleteSavedPlace,
  renameSavedPlace,
  upsertSavedPlace,
} from '@/lib/saved-places';
import { getValidStravaAccessToken } from '@/lib/strava-tokens';
import { deauthorizeStrava } from '@/lib/strava';
import { isRateLimited } from '@/lib/rate-limit';
import { runInBackground } from '@/lib/background';
import {
  deletePushSubscriptionForUser,
  isAllowedPushEndpoint,
  savePushSubscriptionForUser,
  sendPushToUsers,
} from '@/lib/push';
import { parisLocalToUtc, formatLongDate, formatTime } from '@/lib/dates';
import {
  EDIT_CUTOFF_MS,
  canEditActivity,
  isOpen,
  isPast,
  isValidNewStartDate,
} from '@/lib/activity-rules';
import {
  activityFormSchema,
  buildDefaultTitle,
  firstErrorMessage,
  formDataToObject,
  isValidUserId,
  isValidUuid,
  messageContentSchema,
  placeNameSchema,
  reportSchema,
  type ActivityFormValues,
} from '@/lib/validation';
import type { Activity, AppUser, Message } from '@/lib/types';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const admin = () => createAdminClient();

const UNIQUE_VIOLATION = '23505';

function authError() {
  return {
    success: false as const,
    error: 'Connecte-toi avec Strava pour continuer.',
  };
}

function fail(error: string) {
  return { success: false as const, error };
}

function revalidateActivity(activityId: string) {
  revalidatePath('/');
  revalidatePath('/activities');
  revalidatePath(`/activities/${activityId}`);
}

// -----------------------------------------------------------------------------
// Sorties
// -----------------------------------------------------------------------------

type ParsedActivityForm =
  | { ok: true; values: ActivityFormValues; startDate: Date; title: string }
  | { ok: false; error: string };

function parseActivityForm(formData: FormData): ParsedActivityForm {
  const parsed = activityFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, error: firstErrorMessage(parsed.error) };

  const values = parsed.data;
  const startDate = parisLocalToUtc(values.date, values.time);
  if (!startDate) {
    return { ok: false, error: "Le format de la date ou de l'heure est invalide." };
  }

  return {
    ok: true,
    values,
    startDate,
    title: values.title ?? buildDefaultTitle(values),
  };
}

function activityRow(parsed: Extract<ParsedActivityForm, { ok: true }>) {
  const { values, startDate, title } = parsed;
  return {
    title,
    type: values.type,
    start_date: startDate.toISOString(),
    location: values.location,
    latitude: values.latitude,
    longitude: values.longitude,
    distance: values.distance,
    elevation: values.elevation,
    description: values.description,
  };
}

export async function createActivity(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const parsed = parseActivityForm(formData);
    if (!parsed.ok) return fail(parsed.error);
    if (parsed.startDate.getTime() <= Date.now()) {
      return fail('La date de la sortie doit être dans le futur.');
    }
    if (await isRateLimited('activities', currentUser.id)) {
      return fail("Tu as publié beaucoup de sorties aujourd'hui, réessaie demain.");
    }

    const { data, error } = await admin()
      .from('activities')
      .insert({
        ...activityRow(parsed),
        organizer_id: currentUser.id,
        organizer_name: currentUser.name,
        organizer_avatar: currentUser.avatar,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur createActivity:', error);
      return fail("Impossible d'enregistrer la sortie.");
    }

    await upsertSavedPlace(currentUser.id, {
      name: parsed.values.location,
      latitude: parsed.values.latitude,
      longitude: parsed.values.longitude,
    });

    revalidateActivity(data.id);
    revalidatePath('/settings');
    return { success: true, data: { id: data.id } };
  } catch (err) {
    console.error('Erreur inattendue createActivity:', err);
    return fail('Une erreur inattendue est survenue.');
  }
}

/** Liste lisible des changements notables, pour la notification envoyée. */
function describeChanges(before: Activity, after: ReturnType<typeof activityRow>) {
  const changes: string[] = [];
  if (new Date(before.start_date).getTime() !== new Date(after.start_date).getTime()) {
    changes.push(
      `nouvelle date : ${formatLongDate(after.start_date)} à ${formatTime(after.start_date)}`
    );
  }
  if (
    before.location !== after.location ||
    Number(before.latitude) !== after.latitude ||
    Number(before.longitude) !== after.longitude
  ) {
    changes.push(`départ : ${after.location}`);
  }
  if (
    Number(before.distance) !== after.distance ||
    Number(before.elevation) !== after.elevation
  ) {
    changes.push(`parcours : ${after.distance} km / ${after.elevation} m D+`);
  }
  if (before.type !== after.type) changes.push('sport modifié');
  if (before.title !== after.title || (before.description ?? null) !== after.description) {
    changes.push('description mise à jour');
  }
  return changes;
}

async function loadEditableActivity(
  activityId: string,
  currentUser: AppUser
): Promise<{ ok: true; activity: Activity } | { ok: false; error: string }> {
  const activity = await getActivityByIdFromDb(activityId);
  if (!activity) return { ok: false, error: 'Sortie introuvable.' };
  if (activity.organizer_id !== currentUser.id) {
    return { ok: false, error: 'Action non autorisée.' };
  }
  if (activity.status === 'cancelled') {
    return { ok: false, error: 'Cette sortie a été annulée.' };
  }
  if (!canEditActivity(activity)) {
    return {
      ok: false,
      error: "Une sortie ne peut plus être modifiée ni annulée moins d'1 h avant le départ.",
    };
  }
  return { ok: true, activity };
}

export async function updateActivity(
  activityId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();
    if (!isValidUuid(activityId)) return fail('Sortie introuvable.');

    const loaded = await loadEditableActivity(activityId, currentUser);
    if (!loaded.ok) return fail(loaded.error);

    const parsed = parseActivityForm(formData);
    if (!parsed.ok) return fail(parsed.error);
    if (!isValidNewStartDate(parsed.startDate)) {
      return fail('La nouvelle date doit être au moins 1 h dans le futur.');
    }

    const row = activityRow(parsed);
    // Les conditions sont répétées dans la requête : si la sortie a été
    // annulée ou a dépassé la limite entre-temps, aucune ligne n'est modifiée.
    const cutoff = new Date(Date.now() + EDIT_CUTOFF_MS).toISOString();
    const { data, error } = await admin()
      .from('activities')
      .update({
        ...row,
        organizer_name: currentUser.name,
        organizer_avatar: currentUser.avatar,
      })
      .eq('id', activityId)
      .eq('organizer_id', currentUser.id)
      .eq('status', 'active')
      .gt('start_date', cutoff)
      .select('id');

    if (error) {
      console.error('Erreur updateActivity:', error);
      return fail('Impossible de modifier la sortie.');
    }
    if (!data || data.length === 0) {
      return fail("Une sortie ne peut plus être modifiée moins d'1 h avant le départ.");
    }

    await upsertSavedPlace(currentUser.id, {
      name: parsed.values.location,
      latitude: parsed.values.latitude,
      longitude: parsed.values.longitude,
    });

    const changes = describeChanges(loaded.activity, row);
    if (changes.length > 0) {
      const participantIds = await getParticipantIdsToNotify(activityId);
      await createNotifications(
        participantIds.map((userId) => ({
          userId,
          type: 'activity_updated' as const,
          title: 'Sortie modifiée',
          body: `"${row.title}" a été modifiée : ${changes.join(', ')}.`,
          link: `/activities/${activityId}`,
        }))
      );
    }

    revalidateActivity(activityId);
    revalidatePath('/settings');
    return { success: true, data: { id: activityId } };
  } catch (err) {
    console.error('Erreur inattendue updateActivity:', err);
    return fail('Une erreur inattendue est survenue.');
  }
}

export async function cancelActivity(activityId: string): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();
    if (!isValidUuid(activityId)) return fail('Sortie introuvable.');

    const loaded = await loadEditableActivity(activityId, currentUser);
    if (!loaded.ok) return fail(loaded.error);

    const cutoff = new Date(Date.now() + EDIT_CUTOFF_MS).toISOString();
    const { data, error } = await admin()
      .from('activities')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', activityId)
      .eq('organizer_id', currentUser.id)
      .eq('status', 'active')
      .gt('start_date', cutoff)
      .select('id');

    if (error) {
      console.error('Erreur cancelActivity:', error);
      return fail("Impossible d'annuler la sortie.");
    }
    if (!data || data.length === 0) {
      return fail("Une sortie ne peut plus être annulée moins d'1 h avant le départ.");
    }

    // Les demandes en attente n'ont plus à être traitées : on retire les
    // notifications "participation_request" correspondantes de la cloche.
    const { data: pending } = await admin()
      .from('participations')
      .select('id')
      .eq('activity_id', activityId)
      .eq('status', 'pending');
    await markNotificationsByRelatedId((pending ?? []).map((p) => p.id as string));

    const participantIds = await getParticipantIdsToNotify(activityId);
    await createNotifications(
      participantIds.map((userId) => ({
        userId,
        type: 'activity_cancelled' as const,
        title: 'Sortie annulée',
        body: `"${loaded.activity.title}" prévue le ${formatLongDate(
          loaded.activity.start_date
        )} a été annulée par l'organisateur.`,
        link: `/activities/${activityId}`,
      }))
    );

    revalidateActivity(activityId);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Erreur inattendue cancelActivity:', err);
    return fail('Une erreur inattendue est survenue.');
  }
}

// -----------------------------------------------------------------------------
// Participations
// -----------------------------------------------------------------------------

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

export async function requestParticipation(activityId: string): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();
    if (!isValidUuid(activityId)) return fail('Sortie introuvable.');

    const activity = await getActivityByIdFromDb(activityId);
    if (!activity) return fail('Sortie introuvable.');
    if (activity.organizer_id === currentUser.id) {
      return fail("Tu es déjà l'organisateur de cette sortie.");
    }
    if (!isOpen(activity)) {
      return fail("Cette sortie n'accepte plus de demandes.");
    }

    // % de match affiché au moment de la demande : donnée d'entraînement du
    // futur modèle de matching (cf. CLAUDE.md).
    const matchMap = await getMatchPercentages(currentUser, [activity]);
    const matchLog = {
      match_percentage: matchMap[activity.id] ?? null,
      matching_version: MATCHING_VERSION,
    };

    const existing = await getUserParticipation(activityId, currentUser.id);
    if (existing?.status === 'pending') return fail('Ta demande est déjà en attente.');
    if (existing?.status === 'approved') return fail('Tu participes déjà à cette sortie.');

    let participationId: string;
    if (existing?.status === 'rejected') {
      const { error } = await admin()
        .from('participations')
        .update({ status: 'pending', ...matchLog })
        .eq('id', existing.id)
        .eq('status', 'rejected');
      if (error) throw error;
      participationId = existing.id;
    } else {
      const { data: inserted, error } = await admin()
        .from('participations')
        .insert({
          user_id: currentUser.id,
          activity_id: activityId,
          status: 'pending',
          ...matchLog,
        })
        .select('id')
        .single();
      if (error?.code === UNIQUE_VIOLATION) return fail('Ta demande est déjà en attente.');
      if (error) throw error;
      participationId = inserted.id;
    }

    await notifyOrganizerOfRequest(activity, currentUser.name, participationId);

    revalidateActivity(activityId);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Erreur requestParticipation:', err);
    return fail("Impossible d'envoyer la demande.");
  }
}

const participationDecisionSchema = z.enum(['approved', 'rejected']);

export async function updateParticipationStatus(
  participationId: string,
  status: 'approved' | 'rejected'
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();
    if (!isValidUuid(participationId)) return fail('Demande introuvable.');
    if (!participationDecisionSchema.safeParse(status).success) {
      return fail('Action non autorisée.');
    }

    const { data: participation, error: fetchError } = await admin()
      .from('participations')
      .select('id, user_id, activity_id, status, activities(organizer_id, title, status)')
      .eq('id', participationId)
      .maybeSingle();

    if (fetchError || !participation) return fail('Demande introuvable.');

    const activityInfo = participation.activities as unknown as {
      organizer_id: string;
      title: string;
      status: string;
    } | null;

    if (activityInfo?.organizer_id !== currentUser.id) {
      return fail('Action non autorisée.');
    }
    if (activityInfo.status === 'cancelled') {
      return fail('Cette sortie a été annulée.');
    }

    const { data: updated, error } = await admin()
      .from('participations')
      .update({ status })
      .eq('id', participationId)
      .eq('status', 'pending')
      .select('id');

    if (error) throw error;
    if (!updated || updated.length === 0) {
      return fail('Cette demande a déjà été traitée.');
    }

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

    revalidateActivity(participation.activity_id);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Erreur updateParticipationStatus:', err);
    return fail('Impossible de mettre à jour la demande.');
  }
}

// -----------------------------------------------------------------------------
// Messages
// -----------------------------------------------------------------------------

export async function getConversation(
  contactId: string
): Promise<ActionResult<Message[]>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();
    if (!isValidUserId(contactId) || contactId === currentUser.id) {
      return fail('Conversation introuvable.');
    }

    const messages = await getConversationMessages(currentUser.id, contactId);

    // Rafraîchit le badge "Messages" de la barre de navigation uniquement s'il
    // y avait des messages non lus (cette action est appelée en boucle).
    const markedAsRead = await markConversationAsRead(currentUser.id, contactId);
    if (markedAsRead > 0) revalidatePath('/', 'layout');

    return { success: true, data: messages };
  } catch (err) {
    console.error('Erreur getConversation:', err);
    return fail('Impossible de charger les messages.');
  }
}

export async function sendMessage(
  receiverId: string,
  content: string
): Promise<ActionResult<Message>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();
    if (!isValidUserId(receiverId) || receiverId === currentUser.id) {
      return fail('Destinataire invalide.');
    }

    const parsed = messageContentSchema.safeParse(content);
    if (!parsed.success) return fail(firstErrorMessage(parsed.error));

    if (!(await getUserById(receiverId))) return fail('Destinataire introuvable.');
    if (await isRateLimited('messages', currentUser.id)) {
      return fail('Tu envoies trop de messages, patiente une minute.');
    }

    const { data, error } = await admin()
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_avatar: currentUser.avatar,
        receiver_id: receiverId,
        content: parsed.data,
      })
      .select('id, created_at, sender_id, sender_name, sender_avatar, receiver_id, content')
      .single();

    if (error) throw error;

    runInBackground('push nouveau message', () =>
      sendPushToUsers([receiverId], {
        title: `Message de ${currentUser.name}`,
        body: parsed.data.length > 140 ? `${parsed.data.slice(0, 140)}…` : parsed.data,
        url: `/messages/${currentUser.id}`,
        tag: `message-${currentUser.id}`,
      })
    );

    return { success: true, data: data as Message };
  } catch (err) {
    console.error('Erreur sendMessage:', err);
    return fail("Impossible d'envoyer le message.");
  }
}

// -----------------------------------------------------------------------------
// Retour sur le matching et signalements
// -----------------------------------------------------------------------------

/**
 * Après une sortie, un participant accepté indique si le % de matching avec
 * l'organisateur correspondait à la réalité. La personne notée est toujours
 * l'organisateur (déterminé côté serveur, jamais fourni par le client).
 */
export async function submitMatchFeedback(
  activityId: string,
  accurate: boolean
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();
    if (!isValidUuid(activityId) || typeof accurate !== 'boolean') {
      return fail('Données invalides.');
    }

    const activity = await getActivityByIdFromDb(activityId);
    if (!activity || activity.status === 'cancelled' || !isPast(activity)) {
      return fail("Le retour n'est possible qu'après la sortie.");
    }

    const participation = await getUserParticipation(activityId, currentUser.id);
    if (participation?.status !== 'approved') return fail('Action non autorisée.');

    const { error } = await admin().from('match_feedback').upsert(
      {
        activity_id: activityId,
        rater_id: currentUser.id,
        rated_id: activity.organizer_id,
        accurate,
      },
      { onConflict: 'activity_id,rater_id' }
    );

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Erreur submitMatchFeedback:', err);
    return fail("Impossible d'enregistrer ton retour.");
  }
}

export async function reportUser(params: {
  activityId?: string;
  reportedId: string;
  reason: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const parsed = reportSchema.safeParse(params);
    if (!parsed.success) return fail(firstErrorMessage(parsed.error));
    if (parsed.data.reportedId === currentUser.id) return fail('Action non autorisée.');

    if (!(await getUserById(parsed.data.reportedId))) {
      return fail('Utilisateur introuvable.');
    }
    if (await isRateLimited('reports', currentUser.id)) {
      return fail("Tu as envoyé beaucoup de signalements aujourd'hui.");
    }

    const { error } = await admin().from('user_reports').insert({
      activity_id: parsed.data.activityId ?? null,
      reporter_id: currentUser.id,
      reported_id: parsed.data.reportedId,
      reason: parsed.data.reason,
      description: parsed.data.description,
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Erreur reportUser:', err);
    return fail("Impossible d'envoyer le signalement.");
  }
}

// -----------------------------------------------------------------------------
// Profil, lieux enregistrés, compte
// -----------------------------------------------------------------------------

const profileLocationSchema = z.object({
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().max(120).nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function updateProfileLocation(params: {
  city: string;
  country: string | null;
  latitude: number;
  longitude: number;
}): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return authError();

    const parsed = profileLocationSchema.safeParse(params);
    if (!parsed.success) return fail('Position invalide.');

    const { error } = await admin()
      .from('profiles')
      .update(parsed.data)
      .eq('id', currentUser.id);

    if (error) throw error;

    revalidatePath('/profile');
    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Erreur updateProfileLocation:', err);
    return fail('Impossible de mettre à jour ta ville.');
  }
}

export async function renameSavedPlaceAction(
  placeId: string,
  name: string
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return authError();
  if (!isValidUuid(placeId)) return fail('Lieu introuvable.');

  const parsed = placeNameSchema.safeParse(name);
  if (!parsed.success) return fail(firstErrorMessage(parsed.error));

  const result = await renameSavedPlace(currentUser.id, placeId, parsed.data);
  if (!result.success) return fail(result.error ?? 'Impossible de renommer ce lieu.');

  revalidatePath('/settings');
  return { success: true };
}

export async function deleteSavedPlaceAction(placeId: string): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return authError();
  if (!isValidUuid(placeId)) return fail('Lieu introuvable.');

  const result = await deleteSavedPlace(currentUser.id, placeId);
  if (!result.success) return fail(result.error ?? 'Impossible de supprimer ce lieu.');

  revalidatePath('/settings');
  return { success: true };
}

// -----------------------------------------------------------------------------
// Notifications push (PWA)
// -----------------------------------------------------------------------------

const base64UrlKey = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .regex(/^[A-Za-z0-9_-]+={0,2}$/);

const pushSubscriptionSchema = z.object({
  endpoint: z
    .string()
    .max(1000)
    .refine(isAllowedPushEndpoint, 'Service de notification non reconnu.'),
  keys: z.object({ p256dh: base64UrlKey(200), auth: base64UrlKey(100) }),
});

export async function savePushSubscription(
  subscription: unknown,
  userAgent?: string
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return authError();

  const parsed = pushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) return fail(firstErrorMessage(parsed.error));

  const saved = await savePushSubscriptionForUser(
    currentUser.id,
    {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    typeof userAgent === 'string' ? userAgent.slice(0, 300) : null
  );
  return saved
    ? { success: true }
    : fail("Impossible d'activer les notifications sur cet appareil.");
}

export async function deletePushSubscription(endpoint: unknown): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return authError();
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return fail('Données invalides.');

  await deletePushSubscriptionForUser(currentUser.id, endpoint);
  return { success: true };
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

export async function deleteAccountAction(): Promise<ActionResult | void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return fail('Non authentifié.');

  // Révocation de l'accès Strava (au mieux : la suppression du compte ne doit
  // pas échouer si Strava ne répond pas).
  try {
    const accessToken = await getValidStravaAccessToken(currentUser.id);
    if (accessToken) await deauthorizeStrava(accessToken);
  } catch (err) {
    console.error('Erreur révocation Strava (suppression de compte):', err);
  }

  const { error } = await admin().from('profiles').delete().eq('id', currentUser.id);
  if (error) {
    console.error('Erreur deleteAccountAction:', error);
    return fail('Impossible de supprimer ton compte.');
  }

  // Les activités, participations, messages, notifications, lieux, tokens
  // Strava et profils de performance de l'utilisateur sont supprimés en
  // cascade par les contraintes de clé étrangère.
  await signOut({ redirectTo: '/' });
}
