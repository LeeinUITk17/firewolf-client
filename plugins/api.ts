import { defineNuxtPlugin, useRuntimeConfig, navigateTo } from '#app';
import { $fetch, FetchError, type FetchOptions, type FetchContext, type FetchResponse } from 'ofetch';
import { ref } from 'vue';

const isRefreshing = ref(false);
const failedQueue: Array<{ resolve: Function; reject: Function; options: any }> = [];

function processQueue(error: any) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue.length = 0;
}

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();

    const apiFetch = $fetch.create({
        baseURL: config.public.apiBase,
        credentials: 'include',

        async onResponseError({ request, response, options }: FetchContext & { response: FetchResponse<any> }): Promise<void> {
            const requestUrlString = typeof request === 'string' ? request : request.url;
            const requestUrl = new URL(requestUrlString);
            const requestPath = requestUrl.pathname;

            const originalRequestOptions = options;
            const status = response.status;
            const isAuthEndpoint = requestPath.startsWith('/auth/');

            const opts = originalRequestOptions as FetchOptions & { _retry?: boolean };

            if (status === 401 && !opts._retry && !isAuthEndpoint) {
                if (isRefreshing.value) {
                    await new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject, options: { ...opts, url: requestUrlString } as any });
                    });
                    return;
                }

                opts._retry = true;
                isRefreshing.value = true;

                try {
                    await $fetch('/auth/refresh', {
                        baseURL: config.public.apiBase,
                        credentials: 'include',
                        method: 'POST',
                    });

                    processQueue(null);
                } catch (refreshError: any) {
                    processQueue(refreshError);

                    if (process.client) {
                        await navigateTo('/login', { replace: true });
                    }

                    throw refreshError;
                } finally {
                    isRefreshing.value = false;
                }
                return;
            } else if (status === 401 && isAuthEndpoint) {
                console.warn('401 on auth endpoint, letting error propagate:', requestPath);
            }

            const fetchError = new FetchError(`[${response.status}] ${response.statusText} - ${requestPath}`);
            fetchError.response = response;
            throw fetchError;
        },
    });

    nuxtApp.provide('api', apiFetch);
});
