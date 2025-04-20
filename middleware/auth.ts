import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#app';

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, isAuthenticated, fetchUser } = useAuth();

  if (process.client) {
    if (!user.value) {
      await fetchUser();
    }

    if (!isAuthenticated.value) {
      const redirectPath = to.fullPath !== '/' ? to.fullPath : '/dashboard';
      return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
    }
  }

  console.log('[Middleware: Auth] Allowing navigation to', to.path);
});
