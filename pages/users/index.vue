<template>
    <div class="p-4 sm:p-6 lg:p-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-gray-700 gap-4">
            <h1 class="text-2xl font-semibold text-white">User Management</h1>
        </div>

        <div v-if="loading" class="text-center py-20">
            <AppSpinner class="w-10 h-10 inline-block" />
            <p class="text-gray-400 mt-3">Loading user list...</p>
        </div>

        <div v-else-if="error" class="error-alert mb-6 flex justify-between items-center">
            <div class="flex items-center">
                <XCircleIcon class="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{{ error }}</span>
            </div>
            <button @click="fetchUsers" class="text-sm font-medium text-orange-400 hover:underline">Retry</button>
        </div>

        <div v-else class="overflow-x-auto bg-gray-850 border border-gray-700 rounded-lg shadow">
            <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-800">
                    <tr>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name & Email</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                        <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                        <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-gray-850 divide-y divide-gray-700">
                    <tr v-if="users.length === 0">
                        <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-500 italic">No users found.</td>
                    </tr>
                    <tr v-for="usr in users" :key="usr.id" class="hover:bg-gray-800 transition-colors duration-150 ease-in-out">
                        <td class="px-4 py-3 whitespace-nowrap">
                            <div class="text-sm font-medium text-white">{{ usr.name }}</div>
                            <div class="text-xs text-gray-400">{{ usr.email }}</div>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{{ usr.phone || '-' }}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-center text-sm">
                            <span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full"
                                :class="usr.isActive ? 'bg-green-100/10 text-green-400 ring-1 ring-inset ring-green-500/20' : 'bg-red-100/10 text-red-400 ring-1 ring-inset ring-red-500/20'">
                                {{ usr.isActive ? 'Active' : 'Locked' }}
                            </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-300">
                            <select
                                :id="'role-' + usr.id"
                                :value="usr.role"
                                @change="confirmRoleChange(usr, ($event.target as HTMLSelectElement)?.value as Role)"
                                :disabled="usr.id === currentUser?.id || isUpdating === usr.id"
                                class="py-1 px-2 border border-gray-600 bg-gray-700 text-white text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 h-8 disabled:opacity-60 disabled:cursor-not-allowed appearance-none pr-7 bg-no-repeat bg-right bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]"
                                :class="{'opacity-50 animate-pulse': isUpdating === usr.id}"
                                title="Change role">
                                <option v-for="roleValue in roles" :key="roleValue" :value="roleValue">
                                    {{ roleValue }}
                                </option>
                            </select>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button @click="openDetailsModal(usr.id)"
                                class="p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500"
                                title="View details">
                                <EyeIcon class="h-5 w-5" />
                            </button>
                            <button v-if="usr.id !== currentUser?.id" @click="confirmToggleStatus(usr)" :disabled="isUpdating === usr.id"
                                class="p-1 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500 disabled:opacity-50"
                                :class="usr.isActive ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'"
                                :title="usr.isActive ? 'Lock account' : 'Activate account'">
                                <UserMinusIcon v-if="usr.isActive" class="h-5 w-5" />
                                <UserPlusIcon v-else class="h-5 w-5" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <UsersUserDetailsModal
            :is-open="showDetailsModal"
            :user-id="selectedUserId ?? undefined"
            @close="closeDetailsModal"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import type { User, Role } from '~/types/api';
import { Role as RoleEnum } from '~/types/api';
import type { $Fetch } from 'ofetch';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import UsersUserDetailsModal from '~/components/users/UserDetailsModal.vue';
import { EyeIcon, UserMinusIcon, UserPlusIcon, XCircleIcon } from '@heroicons/vue/24/outline';
import { useAuth } from '~/composables/useAuth';

definePageMeta({
    layout: 'default',
    middleware: ['auth']
});

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;
const { user: currentUser } = useAuth();

const users = ref<User[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const isUpdating = ref<string | null>(null);
const showDetailsModal = ref(false);
const selectedUserId = ref<string | null>(null);
const roles = Object.values(RoleEnum);

const fetchUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
        const data = await $api<User[]>('/users');
        users.value = data || [];
    } catch (err: any) {
        error.value = err?.data?.message || "Unable to load user list.";
        users.value = [];
    } finally {
        loading.value = false;
    }
};

const confirmRoleChange = (user: User, newRole: Role) => {
    const selectElement = document.getElementById(`role-${user.id}`) as HTMLSelectElement | null;
    const originalRole = user.role;

    if (selectElement) {
        selectElement.value = originalRole;
    }

    if (newRole === originalRole) return;

    Swal.fire({
        title: `Change role for "${user.name}"?`,
        text: `Are you sure you want to change the role from ${originalRole} to ${newRole}?`,
        icon: 'warning',
        iconColor: '#f97316',
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        background: '#1f2937',
        color: '#d1d5db',
        confirmButtonColor: '#f97316',
        cancelButtonColor: '#4b5563',
        customClass: { popup: 'swal2-dark' }
    }).then((result) => {
        if (result.isConfirmed) {
            executeRoleChange(user.id, newRole, originalRole);
        }
    });
};

const executeRoleChange = async (userId: string, newRole: Role, originalRole: Role) => {
    isUpdating.value = userId;

    try {
        await $api('/auth/rule', {
            method: 'PATCH',
            body: { userId: userId, role: newRole }
        });

        const userIndex = users.value.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users.value[userIndex].role = newRole;
        }

        Swal.fire({
            title: 'Success!',
            text: `Role updated to ${newRole}.`,
            icon: 'success',
            background: '#1f2937',
            color: '#d1d5db',
            confirmButtonColor: '#f97316',
            timer: 2000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
        });
    } catch (err: any) {
        const userIndex = users.value.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users.value[userIndex].role = originalRole;
        }

        Swal.fire({
            title: 'Failed!',
            text: err?.data?.message || "Error updating role.",
            icon: 'error',
            background: '#1f2937',
            color: '#d1d5db',
            confirmButtonColor: '#f97316'
        });
    } finally {
        isUpdating.value = null;
    }
};

const confirmToggleStatus = (user: User) => {
    const actionText = user.isActive ? 'lock' : 'activate';
    const confirmButtonColor = user.isActive ? '#dc2626' : '#22c55e';
    const iconColor = user.isActive ? '#f87171' : '#4ade80';

    Swal.fire({
        title: `Are you sure?`,
        text: `Do you want to ${actionText} the account "${user.name}"?`,
        icon: 'question',
        iconColor: iconColor,
        showCancelButton: true,
        confirmButtonText: `Yes, ${actionText}`,
        cancelButtonText: 'Cancel',
        confirmButtonColor: confirmButtonColor,
        cancelButtonColor: '#4b5563',
        background: '#1f2937',
        color: '#d1d5db',
        customClass: { popup: 'swal2-dark' }
    }).then((result) => {
        if (result.isConfirmed) {
            executeToggleStatus(user);
        }
    });
};

const executeToggleStatus = async (userToToggle: User) => {
    if (isUpdating.value) return;
    isUpdating.value = userToToggle.id;
    const originalStatus = userToToggle.isActive;
    const newStatus = !originalStatus;

    try {
        await $api(`/users/${userToToggle.id}`, {
            method: 'PATCH',
            body: { isActive: newStatus }
        });

        const index = users.value.findIndex(u => u.id === userToToggle.id);
        if (index !== -1) {
            users.value[index].isActive = newStatus;
        }

        Swal.fire({
            title: 'Success!',
            text: `Account "${userToToggle.name}" has been ${newStatus ? 'activated' : 'locked'}.`,
            icon: 'success',
            background: '#1f2937',
            color: '#d1d5db',
            confirmButtonColor: '#f97316',
            timer: 2000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
        });
    } catch (err: any) {
        const index = users.value.findIndex(u => u.id === userToToggle.id);
        if (index !== -1) users.value[index].isActive = originalStatus;

        Swal.fire({
            title: 'Failed!',
            text: err?.data?.message || "Error changing user status.",
            icon: 'error',
            background: '#1f2937',
            color: '#d1d5db',
            confirmButtonColor: '#f97316'
        });
    } finally {
        isUpdating.value = null;
    }
};

const openDetailsModal = (userId: string) => {
    selectedUserId.value = userId;
    showDetailsModal.value = true;
};

const closeDetailsModal = () => {
    showDetailsModal.value = false;
    selectedUserId.value = null;
};

onMounted(() => {
    fetchUsers();
});
</script>

<style scoped>
.error-alert {
    padding: 0.75rem;
    border-radius: 0.375rem;
    border-width: 1px;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    background-color: rgba(191, 27, 27, 0.1);
    border-color: rgba(220, 38, 38, 0.3);
    color: #fca5a5;
}

select:disabled {
    cursor: not-allowed;
}
</style>
