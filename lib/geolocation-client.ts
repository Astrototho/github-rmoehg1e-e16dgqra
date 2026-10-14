// Géolocalisation du navigateur avec des messages utiles : en cas de refus,
// le navigateur ne redemande plus l'autorisation tout seul, il faut expliquer
// comment la réactiver.

export interface LocateResult {
  latitude: number;
  longitude: number;
}

export const LOCATION_DENIED_HELP =
  "Localisation bloquée pour PerfConnect. Pour l'autoriser : touche le cadenas (ou « aA ») à côté de l'adresse › Autorisations › Position › Autoriser, puis réessaie. Sur iPhone, vérifie aussi Réglages › Confidentialité › Service de localisation.";

export async function locateUser(): Promise<LocateResult> {
  if (!('geolocation' in navigator)) {
    throw new Error("La géolocalisation n'est pas disponible sur cet appareil.");
  }
  // Refus déjà enregistré : inutile d'appeler le GPS, on explique directement.
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' });
    if (status?.state === 'denied') throw new Error(LOCATION_DENIED_HELP);
  } catch (err) {
    if (err instanceof Error && err.message === LOCATION_DENIED_HELP) throw err;
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? LOCATION_DENIED_HELP
              : 'Position introuvable pour le moment. Vérifie que la localisation du téléphone est activée et réessaie.'
          )
        ),
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 15000 }
    );
  });
}
