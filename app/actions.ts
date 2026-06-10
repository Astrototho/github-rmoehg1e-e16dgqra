'use server';
import { MOCK_USERS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/session';
import { setGlobalUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function switchUserAction(userId: string) {
  // 1. On change l'utilisateur au niveau global du serveur
  setGlobalUser(userId);
  
  // 2. On demande à Next.js de vider son cache pour rafraîchir l'affichage
  revalidatePath('/', 'layout');
  
  return { success: true };
}

const currentUser = getCurrentUser();

export async function createActivity(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
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

    const { error } = await supabase.from('activities').insert([
      {
        title,
        type,
        start_date,
        location,
        distance,
        elevation,
        description,
        organizer_id: currentUser.id,
        organizer_name: 'Thomas (Test)',
        organizer_avatar: 'https://github.com/shadcn.png',
      },
    ]);

    if (error) {
      console.error('Erreur Supabase:', error);
      return {
        success: false,
        error: "Impossible d'enregistrer la sortie dans la base de données.",
      };
    }

    // On renvoie simplement un succès au lieu de rediriger depuis le serveur
    return { success: true };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return { success: false, error: 'Une erreur inattendue est survenue.' };
  }
}

// --- AJOUT POUR LA PAGE MES SORTIES ---

export async function getMyActivities() {
  try {
    const currentUser = await getCurrentUser();
    const now = new Date().toISOString();

    // 1. On récupère les sorties créées par l'utilisateur
    const { data: organizedData, error: orgError } = await supabase
      .from('activities')
      .select('*')
      .eq('organizer_id', currentUser.id);

    // 2. On récupère les participations de l'utilisateur (avec les détails de la sortie associée)
    const { data: participationsData, error: partError } = await supabase
      .from('participations')
      .select(
        `
        status,
        activities (*)
      `
      )
      .eq('user_id', currentUser.id);

    if (orgError || partError) {
      console.error('Erreur Supabase:', orgError, partError);
      return { success: false, error: 'Impossible de charger les données.' };
    }

    // 3. On trie toutes ces données dans nos 4 catégories
    const myActivities = {
      // Mes sorties créées à venir
      'mes-sorties': organizedData?.filter((a) => (a as any).start_date >= now) || [],

      // Mes participations validées à venir
      validees:
        participationsData
          ?.filter(
            (p) =>
              p.status === 'approved' &&
              p.activities &&
              (p.activities as any).start_date >= now
          )
          .map((p) => p.activities) || [],

      // Mes participations en attente à venir
      'en-cours':
        participationsData
          ?.filter(
            (p) =>
              p.status === 'pending' &&
              p.activities &&
              (p.activities as any).start_date >= now
          )
          .map((p) => p.activities) || [],

      // L'historique (toutes mes sorties créées ou participations validées qui sont passées)
      passees: [
        ...(organizedData?.filter((a) => (a as any).start_date < now) || []),
        ...(participationsData
          ?.filter(
            (p) =>
              p.status === 'approved' &&
              p.activities &&
              (p.activities as any).start_date < now
          )
          .map((p) => p.activities) || []),
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

// --- AJOUT POUR LA MESSAGERIE ---

export async function getConversation(contactId: string) {
  try {
    // 1. On récupère l'utilisateur actuellement choisi dans le sélecteur
    const currentUser = await getCurrentUser();

    // 2. On cherche les messages entre MOI (currentUser.id) et LUI (contactId)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Erreur getConversation:', err);
    return { success: false, error: 'Impossible de charger les messages.' };
  }
}

export async function sendMessage(receiverId: string, content: string) {
  try {
    // 1. On récupère l'utilisateur actif
    const currentUser = await getCurrentUser();

    // 2. On insère avec ses vraies infos
    const { error } = await supabase.from('messages').insert([
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
