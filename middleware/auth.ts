import { useAuth } from '~/composables/useAuth'; 

export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated.value) {
    console.log('[Middleware: Auth] Not authenticated. Redirecting to /login');
    const redirectPath = to.fullPath !== '/' ? to.fullPath : '/dashboard';
    return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
  }
  console.log('[Middleware: Auth] Authenticated. Allowing access to', to.path);
});