import { useAuth } from '~/composables/useAuth';
import { useNuxtApp, navigateTo } from '#app';

export default defineNuxtRouteMiddleware(async (to) => {
  const nuxtApp = useNuxtApp();
  const { isAuthenticated } = useAuth();

  await nuxtApp.$authPluginInitialized;

  if (isAuthenticated.value) {
    return navigateTo('/dashboard', { replace: true });
  }
});
