<template>
    <div>
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-semibold text-white">Zone Management</h1>
            <button
                @click="openCreateModal"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500"
            >
                <PlusIcon class="h-5 w-5 mr-2" />
                Add New Zone
            </button>
        </div>

        <ZonesZoneTable :zones="zones" :loading="loading" @edit="openEditModal" @delete="openDeleteModal" />

        <div v-if="errorMessage" class="mt-4 rounded-md bg-red-50 p-4 border border-red-200">
            <div class="flex">
                <div class="flex-shrink-0">
                    <XCircleIcon class="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
                </div>
            </div>
        </div>

        <AppModal :is-open="showFormModal" @close="closeFormModal">
            <template #title>{{ isEditMode ? 'Edit Zone' : 'Add New Zone' }}</template>
            <template #content>
                <ZonesZoneForm
                    :initial-data="zoneToEdit"
                    :is-submitting="isSubmitting"
                    @submit="handleSubmitZone"
                    @cancel="closeFormModal"
                />
            </template>
            <template #footer><div></div></template>
        </AppModal>

        <AppModal :is-open="showDeleteConfirm" @close="cancelDelete">
            <template #title>Confirm Zone Deletion</template>
            <template #content>
                <p class="text-sm text-gray-400">
                    Are you sure you want to delete the zone <strong class="text-white">{{ zoneToDelete?.name }}</strong>? All related sensors and cameras will also be affected (or need reassignment). This action cannot be undone.
                </p>
            </template>
            <template #footer>
                <button @click="confirmDelete" :disabled="deleting" class="... bg-red-600 ...">
                    <AppSpinner v-if="deleting" class="w-4 h-4 mr-2" /> {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
                <button @click="cancelDelete" ref="cancelButtonRef" class="ml-3 ... bg-gray-700 ...">Cancel</button>
            </template>
        </AppModal>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useNuxtApp } from '#app';
import ZonesZoneTable from '~/components/zones/ZoneTable.vue';
import ZonesZoneForm from '~/components/zones/ZoneForm.vue';
import AppModal from '~/components/ui/AppModal.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import { XCircleIcon, PlusIcon } from '@heroicons/vue/20/solid';
import type { Zone } from '~/types/api';
import type { $Fetch } from 'ofetch';

definePageMeta({
    layout: 'default',
    middleware: ['auth'],
});

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;

const zones = ref<Zone[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const showFormModal = ref(false);
const zoneToEdit = ref<Zone | null>(null);
const isSubmitting = ref(false);
const showDeleteConfirm = ref(false);
const zoneToDelete = ref<Zone | null>(null);
const deleting = ref(false);

const isEditMode = computed(() => !!zoneToEdit.value);

const fetchZones = async () => {
    loading.value = true;
    errorMessage.value = null;
    try {
        const data = await $api<Zone[]>('/zones', { method: 'GET' });
        zones.value = data || [];
    } catch (error: any) {
        errorMessage.value = error?.data?.message || 'Unable to load zones.';
        zones.value = [];
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    zoneToEdit.value = null;
    showFormModal.value = true;
};

const openEditModal = (zone: Zone) => {
    zoneToEdit.value = { ...zone };
    showFormModal.value = true;
};

const closeFormModal = () => {
    showFormModal.value = false;
    zoneToEdit.value = null;
};

const openDeleteModal = (zone: Zone) => {
    zoneToDelete.value = zone;
    showDeleteConfirm.value = true;
};

const cancelDelete = () => {
    showDeleteConfirm.value = false;
    setTimeout(() => {
        zoneToDelete.value = null;
    }, 200);
};

const handleSubmitZone = async (formData: Partial<Zone>) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    const apiUrl = isEditMode.value ? `/zones/${formData.id}` : '/zones';
    const apiMethod = isEditMode.value ? 'PATCH' : 'POST';

    try {
        if (isEditMode.value && formData.id) {
            const updatedZone = await $api<Zone>(apiUrl, { method: apiMethod, body: formData });
            const index = zones.value.findIndex((z) => z.id === updatedZone.id);
            if (index !== -1) {
                zones.value[index] = { ...zones.value[index], ...updatedZone };
            }
        } else {
            const newZone = await $api<Zone>(apiUrl, { method: apiMethod, body: formData });
            zones.value.push(newZone);
        }
        closeFormModal();
    } catch (error: any) {
        errorMessage.value = error?.data?.message || `Unable to ${isEditMode.value ? 'update' : 'add'} zone.`;
    } finally {
        isSubmitting.value = false;
    }
};

const confirmDelete = async () => {
    if (!zoneToDelete.value) return;
    deleting.value = true;
    errorMessage.value = null;
    try {
        await $api(`/zones/${zoneToDelete.value.id}`, { method: 'DELETE' });
        zones.value = zones.value.filter((z) => z.id !== zoneToDelete.value!.id);
        cancelDelete();
    } catch (error: any) {
        errorMessage.value =
            error?.data?.message || `Unable to delete zone ${zoneToDelete.value.name}. It may have linked sensors/cameras.`;
    } finally {
        deleting.value = false;
    }
};

onMounted(() => {
    fetchZones();
});
</script>
