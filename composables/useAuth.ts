import { ref, computed } from 'vue';
import { navigateTo, useNuxtApp, useState } from '#app';
import type { $Fetch } from 'ofetch';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export const useAuth = () => {
    const user = useState<AuthUser | null>('authStateUser', () => null);
    const nuxtApp = useNuxtApp();
    const $api = nuxtApp.$api as $Fetch;

    const isAuthenticated = computed(() => !!user.value);
    const isAdmin = computed(() => user.value?.role === 'ADMIN');

    const fetchUser = async () => {
        if (!$api) {
            console.error('[useAuth] $api instance is not available.');
            user.value = null;
            return;
        }
        try {
            console.log('[useAuth] Fetching user...');
            const fetchedUser = await $api<AuthUser | null>('/auth/profile', {
                method: 'GET',
                ignoreResponseError: true,
            });
    
            if (fetchedUser && typeof fetchedUser === 'object' && fetchedUser.id) {
                console.log('[useAuth] User fetched successfully:', fetchedUser);
                user.value = fetchedUser as AuthUser;
            } else {
                console.warn('[useAuth] No user found.');
                user.value = null;
            }
        } catch (error: any) {
            console.error('[useAuth] fetchUser error:', error);
            user.value = null;
        }
    };

    const login = async (credentials: { identifier: string; password: string }) => {
        if (!$api) {
            console.error('[useAuth] $api not available for login.');
            return { success: false, error: 'API client not ready.' };
        }

        const loginData = { email: credentials.identifier, password: credentials.password };
        try {
            await $api<{ message: string }>('/auth/login', {
                method: 'POST',
                body: loginData,
            });
            await fetchUser();
            return { success: true };
        } catch (error: any) {
            console.error('[useAuth] Login error:', error);
            user.value = null;
            return { success: false, error: error?.data?.message || error?.message || 'Login failed.' };
        }
    };

    const signup = async (signupData: { name: string; email: string; password: string; phone?: string }) => {
        if (!$api) {
            console.error('[useAuth] $api not available for signup.');
            return { success: false, error: 'API client not ready.' };
        }
        try {
            await $api<{ message: string }>('/auth/signup', {
                method: 'POST',
                body: signupData,
            });
            await fetchUser();
            return { success: true };
        } catch (error: any) {
            console.error('[useAuth] Signup error:', error);
            return { success: false, error: error?.data?.message || error?.message || 'Signup failed.' };
        }
    };

    const logout = async () => {
        if (!$api) {
            console.error('[useAuth] $api not available for logout.');
            return;
        }
        try {
            await $api<{ message: string }>('/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error('[useAuth] Logout error:', error);
        } finally {
            user.value = null;
        }
    };

    return {
        user,
        isAuthenticated,
        isAdmin,
        login,
        signup,
        logout,
        fetchUser,
    };
};
