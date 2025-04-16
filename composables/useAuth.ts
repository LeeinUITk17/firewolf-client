import { ref, computed } from 'vue';
import { navigateTo, useNuxtApp, useState } from '#app';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export const useAuth = () => {
    const user = useState<AuthUser | null>('user', () => null);
    const { $api } = useNuxtApp();

    const isAuthenticated = computed(() => !!user.value);
    const isAdmin = computed(() => user.value?.role === 'ADMIN');

    const fetchUser = async () => {
        try {
            const fetchedUser = await $api<AuthUser>('/auth/profile', {
                method: 'GET',
                ignoreResponseError: true,
            });
            user.value = fetchedUser && fetchedUser.id ? fetchedUser : null;
        } catch (error: any) {
            user.value = null;
        }
    };

    const login = async (credentials: { identifier: string; password: string }) => {
        const loginData = { email: credentials.identifier, password: credentials.password };
        try {
            await $api<{ message: string }>('/auth/login', {
                method: 'POST',
                body: loginData,
            });
            await fetchUser();
            return { success: true };
        } catch (error: any) {
            user.value = null;
            return { success: false, error: error?.data?.message || 'Login failed.' };
        }
    };

    const signup = async (signupData: { name: string; email: string; password: string; phone?: string }) => {
        try {
            await $api<{ message: string }>('/auth/signup', {
                method: 'POST',
                body: signupData,
            });
            await fetchUser();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error?.data?.message || 'Signup failed.' };
        }
    };

    const logout = async () => {
        try {
            await $api<{ message: string }>('/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error(error);
        } finally {
            user.value = null;
        }
    };

    return { user, isAuthenticated, isAdmin, login, signup, logout, fetchUser };
};
