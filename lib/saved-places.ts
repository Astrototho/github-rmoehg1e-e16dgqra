import { createAdminClient } from '@/lib/supabase-admin';
import { normalizePlaceName } from '@/lib/places';
import type { SavedPlace } from '@/lib/types';

const UNIQUE_VIOLATION = '23505';

export async function getSavedPlaces(userId: string): Promise<SavedPlace[]> {
  const { data, error } = await createAdminClient()
    .from('saved_places')
    .select('id, name, latitude, longitude')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Erreur getSavedPlaces:', error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  }));
}

/**
 * Enregistre le lieu de départ d'un organisateur. Même nom normalisé = même
 * lieu : on garde le nom d'origine et on remplace seulement le point GPS par
 * le dernier choisi.
 */
export async function upsertSavedPlace(
  userId: string,
  place: { name: string; latitude: number; longitude: number }
) {
  const admin = createAdminClient();
  const nameNormalized = normalizePlaceName(place.name);
  const coords = { latitude: place.latitude, longitude: place.longitude };

  const { data: updated, error: updateError } = await admin
    .from('saved_places')
    .update(coords)
    .eq('user_id', userId)
    .eq('name_normalized', nameNormalized)
    .select('id');

  if (updateError) {
    console.error('Erreur upsertSavedPlace (update):', updateError);
    return;
  }
  if (updated && updated.length > 0) return;

  const { error } = await admin.from('saved_places').insert({
    user_id: userId,
    name: place.name,
    name_normalized: nameNormalized,
    ...coords,
  });
  // Insertion concurrente du même lieu : la ligne existe déjà, rien à faire.
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error('Erreur upsertSavedPlace (insert):', error);
  }
}

export async function renameSavedPlace(
  userId: string,
  placeId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await createAdminClient()
    .from('saved_places')
    .update({ name, name_normalized: normalizePlaceName(name) })
    .eq('id', placeId)
    .eq('user_id', userId);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { success: false, error: 'Tu as déjà un lieu avec ce nom.' };
    }
    console.error('Erreur renameSavedPlace:', error);
    return { success: false, error: 'Impossible de renommer ce lieu.' };
  }
  return { success: true };
}

export async function deleteSavedPlace(userId: string, placeId: string) {
  const { error } = await createAdminClient()
    .from('saved_places')
    .delete()
    .eq('id', placeId)
    .eq('user_id', userId);

  if (error) {
    console.error('Erreur deleteSavedPlace:', error);
    return { success: false, error: 'Impossible de supprimer ce lieu.' };
  }
  return { success: true };
}
