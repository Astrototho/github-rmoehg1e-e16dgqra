/**
 * Adresse de retour après connexion : uniquement un chemin interne
 * ("/..." mais pas "//..." ni "/\..."), sinon l'accueil. Évite les
 * redirections ouvertes vers un autre site.
 */
export function safeCallbackUrl(value: unknown, allowedOrigin?: string): string {
  if (typeof value !== 'string' || value.length > 300) return '/';
  let path = value;
  // Le middleware Auth.js transmet une URL absolue : on n'en garde le chemin
  // que si elle pointe vers notre propre site.
  if (allowedOrigin && path.startsWith(allowedOrigin + '/')) {
    path = path.slice(allowedOrigin.length);
  }
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return '/';
  return path;
}

/** Identifiant de sortie si l'adresse de retour pointe vers une sortie. */
export function activityIdFromCallback(url: string): string | null {
  const match = /^\/activities\/([0-9a-f-]{36})$/.exec(url);
  return match ? match[1] : null;
}
