import { defineNuxtPlugin } from '#app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async (nuxtApp) => {
    const authReadyPromise = new Promise<void>(async (resolve) => {
        if (process.client) {
            const { fetchUser } = useAuth();
            try {
                await fetchUser();
            } catch (e) {
                console.error('[Auth Plugin] Initial user fetch failed.', e);
            } finally {
                resolve();
            }
        } else {
            resolve();
        }
    });

    nuxtApp.provide('authPluginInitialized', authReadyPromise);
});
