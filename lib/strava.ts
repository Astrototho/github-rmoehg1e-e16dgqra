const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export interface StravaActivitySummary {
  id: number;
  type: string;
  sport_type: string;
  distance: number; // mètres
  moving_time: number; // secondes
  elapsed_time: number; // secondes
  total_elevation_gain: number; // mètres
  average_speed: number; // m/s
  start_date: string;
}

export async function fetchStravaActivities(
  accessToken: string,
  perPage = 30
): Promise<StravaActivitySummary[]> {
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?per_page=${perPage}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error(`Strava API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

export interface RefreshedStravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO
}

export async function refreshStravaAccessToken(
  refreshToken: string
): Promise<RefreshedStravaTokens> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH_STRAVA_ID,
      client_secret: process.env.AUTH_STRAVA_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Strava refresh ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000).toISOString(),
  };
}
