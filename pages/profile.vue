<template>
    <div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

        <div v-if="loading" class="text-center py-20">
            <AppSpinner class="w-10 h-10 inline-block" />
            <p class="text-gray-400 mt-3">Loading information...</p>
        </div>

        <div v-else-if="error" class="error-alert mb-6">
            <XCircleIcon class="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <span>{{ error }}</span>
            <button @click="fetchProfile" class="ml-auto text-sm font-medium text-orange-400 hover:underline">Retry</button>
        </div>

        <form v-else-if="profileData" @submit.prevent="handleUpdateProfile" class="space-y-8">
            <div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-gray-700">
                <img class="h-24 w-24 rounded-full object-cover border-2 border-gray-600" :src="avatarUrl" alt="User Avatar" />
                <div class="text-center sm:text-left">
                    <h2 class="text-xl font-medium text-white">{{ editableProfile.name || 'No Name' }}</h2>
                    <p class="text-sm text-gray-400">{{ profileData.email }}</p>
                    <p class="text-xs text-gray-500 mt-1">Role: <span class="font-medium text-gray-300">{{ profileData.role }}</span></p>
                </div>
            </div>

            <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="updateError" class="error-alert">
                    <XCircleIcon class="h-5 w-5 mr-2" /> {{ updateError }}
                </div>
            </Transition>
            <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="updateSuccess" class="success-alert">
                    <CheckCircleIcon class="h-5 w-5 mr-2" /> Profile updated successfully!
                </div>
            </Transition>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-5">
                    <div>
                        <label for="profile-name" class="input-label">Display Name <span class="text-red-500">*</span></label>
                        <input id="profile-name" type="text" v-model="editableProfile.name" required class="input-field mt-1" />
                    </div>
                    <div>
                        <label for="profile-phone" class="input-label">Phone Number <span class="text-red-500">*</span></label>
                        <input id="profile-phone" type="tel" v-model="editableProfile.phone" required class="input-field mt-1" />
                    </div>
                    <div>
                        <label for="profile-address" class="input-label">Address</label>
                        <textarea id="profile-address" v-model="editableProfile.address" rows="4" class="input-field mt-1"></textarea>
                    </div>
                    <div class="flex justify-end pt-4">
                        <button type="submit" :disabled="isSubmitting || !isProfileChanged" class="inline-flex items-center px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800/50 disabled:cursor-not-allowed border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500">
                            <AppSpinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
                            Save Changes
                        </button>
                    </div>
                </div>

                <div class="lg:col-span-1 space-y-4 lg:border-l lg:border-gray-700 lg:pl-8">
                    <h3 class="text-base font-medium text-gray-300 border-b border-gray-700 pb-2">Account Information</h3>
                    <dl class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <dt class="text-gray-400">Email:</dt>
                            <dd class="text-gray-300 font-mono">{{ profileData.email }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-gray-400">Role:</dt>
                            <dd class="text-gray-300 font-semibold">{{ profileData.role }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-gray-400">Status:</dt>
                            <dd :class="profileData.isActive ? 'text-green-400' : 'text-red-400'">{{ profileData.isActive ? 'Active' : 'Inactive' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-gray-400">Created At:</dt>
                            <dd class="text-gray-300">{{ formatDateTime(profileData.createdAt) }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-gray-400">Last Updated:</dt>
                            <dd class="text-gray-300">{{ formatDateTime(profileData.updatedAt) }}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </form>

        <div v-else-if="!loading && !error" class="text-center py-10 text-gray-500">
            Unable to load personal information.
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useNuxtApp } from '#app';
import { useAuth } from '~/composables/useAuth';
import type { User } from '~/types/api';
import type { $Fetch } from 'ofetch';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import { XCircleIcon, CheckCircleIcon } from '@heroicons/vue/20/solid';

definePageMeta({
    layout: 'default',
    middleware: 'auth'
});

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;
const { user } = useAuth();

const profileData = ref<User | null>(null);
const editableProfile = reactive({
    name: '',
    phone: '',
    address: '' as string | null | undefined,
});

const loading = ref(true);
const isSubmitting = ref(false);
const error = ref<string | null>(null);
const updateError = ref<string | null>(null);
const updateSuccess = ref(false);

const defaultAvatarUrl = 'https://res.cloudinary.com/dbonwxmgl/image/upload/v1744813436/nincpcscjdqufgdfunit.png';
const avatarUrl = computed(() => defaultAvatarUrl);

const isProfileChanged = computed(() => {
    if (!profileData.value) return false;
    const nameChanged = profileData.value.name !== editableProfile.name;
    const phoneChanged = profileData.value.phone !== editableProfile.phone;
    const addressChanged = (profileData.value.address || null) !== (editableProfile.address || null);
    return nameChanged || phoneChanged || addressChanged;
});

const fetchProfile = async () => {
    if (!user.value?.id) {
        error.value = "Unable to identify user. Please log in again.";
        loading.value = false;
        profileData.value = null;
        return;
    }
    loading.value = true;
    error.value = null;
    updateError.value = null;
    updateSuccess.value = false;
    try {
        const data = await $api<User>(`/users/${user.value.id}`);
        profileData.value = data;
        if (data) {
            editableProfile.name = data.name || '';
            editableProfile.phone = data.phone || '';
            editableProfile.address = data.address || null;
        } else {
            profileData.value = null;
            error.value = "User information not found.";
        }
    } catch (err: any) {
        error.value = err?.data?.message || "Unable to load personal information.";
        profileData.value = null;
    } finally {
        loading.value = false;
    }
};

const handleUpdateProfile = async () => {
    if (!user.value?.id || !isProfileChanged.value || isSubmitting.value) return;

    isSubmitting.value = true;
    updateError.value = null;
    updateSuccess.value = false;
    try {
        const dataToUpdate: Partial<Pick<User, 'name' | 'phone' | 'address'>> = {
            name: editableProfile.name?.trim() || undefined,
            phone: editableProfile.phone?.trim() || undefined,
            address: editableProfile.address?.trim() ? editableProfile.address.trim() : null,
        };

        const updatedUser = await $api<User>(`/users/${user.value.id}`, {
            method: 'PATCH',
            body: dataToUpdate
        });

        profileData.value = updatedUser;
        editableProfile.name = updatedUser.name || '';
        editableProfile.phone = updatedUser.phone || '';
        editableProfile.address = updatedUser.address || null;

        updateSuccess.value = true;
        setTimeout(() => updateSuccess.value = false, 3000);
    } catch (err: any) {
        updateError.value = err?.data?.message || "Error updating information.";
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {
    fetchProfile();
});

watch(user, (newUser) => {
    if (newUser && profileData.value?.id !== newUser.id) {
        fetchProfile();
    } else if (!newUser && profileData.value) {
        profileData.value = null;
        editableProfile.name = '';
        editableProfile.phone = '';
        editableProfile.address = null;
    }
}, { immediate: false });

const formatDateTime = (dateTimeString: string | Date | undefined | null): string => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Error';
    }
};
</script>

<style scoped>
.input-field {
    appearance: none;
    position: relative;
    display: block;
    width: 100%;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-width: 1px;
    border-color: #4b5563;
    background-color: #374151;
    color: #ffffff;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.input-field::placeholder {
    color: #6b7280;
}
.input-field:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
    --tw-ring-color: #f97316;
    box-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    border-color: #f97316;
}
.alert-box {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-radius: 0.375rem;
    border-width: 1px;
    font-size: 0.875rem;
    line-height: 1.25rem;
}
.error-alert {
    background-color: rgba(191, 27, 27, 0.1);
    border-color: rgba(220, 38, 38, 0.3);
    color: #fca5a5;
}
.success-alert {
    background-color: rgba(16, 185, 129, 0.1);
    border-color: rgba(5, 150, 105, 0.3);
    color: #6ee7b7;
}
</style>
