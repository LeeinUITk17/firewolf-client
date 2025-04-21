<template>
    <div class="p-4 sm:p-6 lg:p-8">
        <div class="mb-6 pb-3 border-b border-gray-700">
            <NuxtLink to="/cameras" class="text-sm text-orange-400 hover:underline flex items-center mb-1">
                <ArrowLeftIcon class="h-4 w-4 mr-1" /> Back to Camera List
            </NuxtLink>
            <h1 class="text-2xl font-semibold text-white mt-1">
                {{ pageTitle }}
            </h1>
            <p v-if="isEditMode && cameraData" class="text-sm text-gray-400 mt-1">
                ID: <span class="font-mono text-xs">{{ cameraId }}</span>
            </p>
        </div>

        <div v-if="loading" class="text-center py-16">
            <AppSpinner class="w-8 h-8 inline-block" />
            <p class="text-gray-400 mt-2">{{ loadingMessage }}</p>
        </div>

        <div v-else-if="errorMessage" class="error-alert mb-6 flex justify-between items-center">
            <div class="flex items-center">
                <XCircleIcon class="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{{ errorMessage }}</span>
            </div>
            <button @click="reloadData" class="text-sm font-medium text-orange-300 hover:underline">Retry</button>
        </div>

        <div v-else class="max-w-2xl bg-gray-850 p-6 md:p-8 rounded-lg border border-gray-700 shadow-md">
            <CamerasCameraForm
                :initial-data="cameraData"
                :available-zones="availableZones"
                :is-submitting="isSubmitting"
                :initial-error="submitError"
                @submit="handleSubmit"
                @cancel="navigateTo('/cameras')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useNuxtApp, navigateTo } from '#app';
import CamerasCameraForm from '~/components/cameras/CameraForm.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import { ArrowLeftIcon, XCircleIcon } from '@heroicons/vue/20/solid';
import type { Camera, Zone } from '~/types/api';
import type { $Fetch } from 'ofetch';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

definePageMeta({
    layout: 'default',
    middleware: ['auth'],
});

const route = useRoute();
const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;

const cameraId = computed(() => route.query.edit as string | undefined);
const isEditMode = computed(() => !!cameraId.value);

const cameraData = ref<Camera | null>(null);
const availableZones = ref<Pick<Zone, 'id' | 'name'>[]>([]);
const loading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const submitError = ref<string | null>(null);

const pageTitle = computed(() => (isEditMode.value ? 'Edit Camera' : 'Add New Camera'));
const loadingMessage = computed(() => (isEditMode.value ? 'Loading camera data...' : 'Loading zones data...'));

const fetchZones = async () => {
    try {
        const zones = await $api<Pick<Zone, 'id' | 'name'>[]>('/zones', {
            params: { fields: 'id,name', limit: 1000 },
        });
        availableZones.value = zones || [];
    } catch (error: any) {
        console.error('Failed to fetch zones:', error);
        availableZones.value = [];
        throw new Error(error?.data?.message || 'Unable to load zones.');
    }
};

const fetchCameraData = async () => {
    if (!isEditMode.value || !cameraId.value) return;
    try {
        cameraData.value = await $api<Camera>(`/cameras/${cameraId.value}`);
    } catch (error: any) {
        console.error(`Failed to fetch camera ${cameraId.value}:`, error);
        cameraData.value = null;
        throw new Error(error?.data?.message || 'Unable to load camera data.');
    }
};

const reloadData = async () => {
    loading.value = true;
    errorMessage.value = null;
    submitError.value = null;
    cameraData.value = null;

    try {
        const results = await Promise.allSettled([
            fetchZones(),
            isEditMode.value ? fetchCameraData() : Promise.resolve(),
        ]);

        const zoneError = results[0].status === 'rejected' ? results[0].reason?.message : null;
        const cameraError = results[1]?.status === 'rejected' ? results[1].reason?.message : null;

        if (zoneError || cameraError) {
            errorMessage.value = [zoneError, cameraError].filter(Boolean).join(' ');
        }
    } catch (error) {
        console.error('Unexpected error during reloadData:', error);
        errorMessage.value = 'Unexpected error while loading data.';
    } finally {
        loading.value = false;
    }
};

const handleSubmit = async (formData: Partial<Camera>) => {
    isSubmitting.value = true;
    submitError.value = null;
    const apiUrl = isEditMode.value ? `/cameras/${cameraId.value}` : '/cameras';
    const apiMethod = isEditMode.value ? 'PATCH' : 'POST';
    const successMessage = isEditMode.value ? 'Camera updated successfully!' : 'Camera added successfully!';
    const failureMessage = `Error while ${isEditMode.value ? 'updating' : 'adding'} camera.`;

    try {
        await $api<Camera>(apiUrl, { method: apiMethod, body: formData });

        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: successMessage,
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#1f2937',
            color: '#d1d5db',
            customClass: { popup: 'swal2-dark' },
        });

        setTimeout(() => {
            navigateTo('/cameras');
        }, 1500);
    } catch (error: any) {
        console.error(`Failed to ${isEditMode.value ? 'update' : 'create'} camera:`, error);
        submitError.value = error?.data?.message || failureMessage;
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {
    reloadData();
});
</script>

<style scoped>
.input-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #d1d5db;
    margin-bottom: 0.25rem;
}
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
select.input-field {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
}
.error-alert {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-radius: 0.375rem;
    border-width: 1px;
    font-size: 0.875rem;
    line-height: 1.25rem;
    background-color: rgba(191, 27, 27, 0.1);
    border-color: rgba(220, 38, 38, 0.3);
    color: #fca5a5;
}
</style>