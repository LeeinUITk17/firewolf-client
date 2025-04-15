import { ref, computed } from 'vue';
import { navigateTo } from '#app';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export const useAuth = () => {
    const user = useState<AuthUser | null>('user', () => null);
    const isAuthenticated = computed(() => !!user.value);
    const isAdmin = computed(() => user.value?.role === 'ADMIN');
    const apiBase = useRuntimeConfig().public.apiBase;

    const fetchUser = async () => {
        try {
            const fetchedUser = await $fetch<AuthUser>(`${apiBase}/auth/profile`, {
                method: 'GET',
                ignoreResponseError: true,
            });

            if (fetchedUser && fetchedUser.id) {
                user.value = fetchedUser;
            } else {
                user.value = null;
            }
        } catch (error: any) {
            user.value = null;
        }
    };

    const login = async (credentials: { identifier: string; password: string }) => {
        const loginData = { email: credentials.identifier, password: credentials.password };
        try {
            await $fetch<{ message: string }>(`${apiBase}/auth/login`, {
                method: 'POST',
                body: loginData,
            });
            await fetchUser();
            return { success: true };
        } catch (error: any) {
            user.value = null;
            return { success: false, error: error?.data?.message || 'Login failed. Please try again.' };
        }
    };

    const signup = async (signupData: { name: string; email: string; password: string; phone?: string }) => {
        try {
            await $fetch<{ message: string }>(`${apiBase}/auth/signup`, {
                method: 'POST',
                body: signupData,
            });
            await fetchUser();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error?.data?.message || 'Signup failed. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            await $fetch<{ message: string }>(`${apiBase}/auth/logout`, {
                method: 'POST',
            });
        } catch (error) {
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
