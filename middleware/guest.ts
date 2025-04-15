import { useAuth } from '~/composables/useAuth'; 

export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated.value) {
    console.log('[Middleware: Guest] Authenticated. Redirecting to /dashboard');
    return navigateTo('/dashboard', { replace: true });
  }
   console.log('[Middleware: Guest] Not authenticated. Allowing access to', to.path);
});