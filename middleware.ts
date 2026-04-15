export { auth as middleware } from '@/auth';

// On définit sur quelles routes le middleware doit s'activer
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
