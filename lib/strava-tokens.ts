import { createAdminClient } from '@/lib/supabase-admin';
import { decryptSecret, encryptSecret } from '@/lib/crypto';
import { refreshStravaAccessToken } from '@/lib/strava';

// Marge avant expiration à partir de laquelle on rafraîchit le token.
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

export async function saveStravaTokens(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string; // ISO
    scope?: string | null;
  }
): Promise<boolean> {
  try {
    const row: Record<string, unknown> = {
      user_id: userId,
      access_token: encryptSecret(tokens.accessToken),
      refresh_token: encryptSecret(tokens.refreshToken),
      expires_at: tokens.expiresAt,
    };
    // Au rafraîchissement, Strava ne renvoie pas le scope : on garde l'existant.
    if (tokens.scope !== undefined) row.scope = tokens.scope;

    const { error } = await createAdminClient()
      .from('strava_tokens')
      .upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erreur saveStravaTokens:', err);
    return false;
  }
}

/**
 * Token d'accès Strava valide pour l'utilisateur (rafraîchi si besoin), ou
 * null si l'utilisateur n'a pas connecté Strava ou si le rafraîchissement a
 * échoué (accès révoqué...).
 */
export async function getValidStravaAccessToken(
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await createAdminClient()
      .from('strava_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    if (new Date(data.expires_at).getTime() - Date.now() > EXPIRY_MARGIN_MS) {
      return decryptSecret(data.access_token);
    }

    const refreshed = await refreshStravaAccessToken(
      decryptSecret(data.refresh_token)
    );
    await saveStravaTokens(userId, refreshed);
    return refreshed.accessToken;
  } catch (err) {
    console.error('Erreur getValidStravaAccessToken:', err);
    return null;
  }
}
