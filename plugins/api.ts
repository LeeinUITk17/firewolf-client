import { defineNuxtPlugin } from '#app';
import { $fetch } from 'ofetch';

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();

    const apiFetch = $fetch.create({
        baseURL: config.public.apiBase,
        credentials: 'include',
        async onResponseError({ request, response }) {
            console.error('[API Fetch Error]', request, response.status, response.body);
        },
    });

    nuxtApp.provide('api', apiFetch);
});
