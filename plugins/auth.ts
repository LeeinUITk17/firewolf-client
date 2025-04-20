import { defineNuxtPlugin } from '#app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin((nuxtApp) => {
    const authReadyPromise = (async () => {
        if (process.client) {
            const { fetchUser } = useAuth();
            try {
                await fetchUser();
            } catch (e) {
                console.error('[Auth Plugin] Initial user fetch failed during await.', e);
            }
        }
    })();

    nuxtApp.provide('authPluginInitialized', authReadyPromise);
});
