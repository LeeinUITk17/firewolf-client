import { useAuth } from '~/composables/useAuth';
import { navigateTo } from '#app';

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, isAuthenticated, fetchUser } = useAuth();

  if (process.client) {
    if (!user.value) {
      await fetchUser();
    }

    if (isAuthenticated.value) {
      return navigateTo('/dashboard', { replace: true });
    }
  }
});
