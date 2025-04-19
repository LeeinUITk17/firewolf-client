<template>
    <div class="p-4 sm:p-6 lg:p-8">
        <div class="mb-6">
            <NuxtLink to="/sensors" class="text-sm text-orange-400 hover:underline flex items-center">
                <ArrowLeftIcon class="h-4 w-4 mr-1" /> Back to Sensor List
            </NuxtLink>
            <h1 class="text-2xl font-semibold text-white mt-2">
                {{ isEditMode ? 'Edit Sensor' : 'Add New Sensor' }}
            </h1>
            <p v-if="isEditMode && sensorData" class="text-sm text-gray-400">
                ID: <span class="font-mono">{{ sensorId }}</span>
            </p>
        </div>

        <div v-if="loading" class="text-center py-10">
            <AppSpinner class="w-8 h-8 inline-block" />
            <p class="text-gray-400 mt-2">
                {{ isEditMode ? 'Loading sensor data...' : 'Loading zone data...' }}
            </p>
        </div>

        <div v-else-if="errorMessage" class="rounded-md bg-red-900/40 border border-red-700/50 p-4 text-red-300 mb-6">
            <p class="font-medium">Error!</p>
            <p>{{ errorMessage }}</p>
            <button @click="isEditMode ? fetchSensorData() : fetchZones()" class="mt-2 text-xs text-orange-300 hover:underline">
                Retry
            </button>
        </div>

        <div v-else class="max-w-2xl">
            <SensorsSensorForm
                :initial-data="sensorData"
                :available-zones="availableZones"
                :is-submitting="isSubmitting"
                :initial-error="submitError"
                @submit="handleSubmit"
                @cancel="navigateTo('/sensors')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter, useNuxtApp, navigateTo } from '#app';
import SensorsSensorForm from '~/components/sensors/SensorForm.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import { ArrowLeftIcon } from '@heroicons/vue/20/solid';
import type { Sensor, Zone } from '~/types/api';
import type { $Fetch } from 'ofetch';

definePageMeta({
    layout: 'default',
    middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();
const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;

const sensorId = computed(() => route.query.edit as string | undefined);
const isEditMode = computed(() => !!sensorId.value);

const sensorData = ref<Sensor | null>(null);
const availableZones = ref<Pick<Zone, 'id' | 'name'>[]>([]);
const loading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const submitError = ref<string | null>(null);

const fetchZones = async () => {
    loading.value = true;
    errorMessage.value = null;
    try {
        const zones = await $api<Pick<Zone, 'id' | 'name'>[]>('/zones', {
            params: { fields: 'id,name' },
        });
        availableZones.value = zones || [];
    } catch (error: any) {
        errorMessage.value = error?.data?.message || 'Unable to load zone list.';
        availableZones.value = [];
    }
};

const fetchSensorData = async () => {
    if (!isEditMode.value || !sensorId.value) {
        loading.value = false;
        return;
    }
    loading.value = true;
    errorMessage.value = null;
    try {
        sensorData.value = await $api<Sensor>(`/sensors/${sensorId.value}`);
    } catch (error: any) {
        errorMessage.value = error?.data?.message || 'Unable to load sensor data.';
        sensorData.value = null;
    } finally {
        loading.value = false;
    }
};

const handleSubmit = async (formData: Partial<Sensor>) => {
    isSubmitting.value = true;
    submitError.value = null;
    const apiUrl = isEditMode.value ? `/sensors/${sensorId.value}` : '/sensors';
    const apiMethod = isEditMode.value ? 'PATCH' : 'POST';

    try {
        await $api<Sensor>(apiUrl, { method: apiMethod, body: formData });
        navigateTo('/sensors');
    } catch (error: any) {
        submitError.value =
            error?.data?.message || `Error while ${isEditMode.value ? 'updating' : 'creating'} sensor.`;
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(async () => {
    loading.value = true;
    await fetchZones();
    if (isEditMode.value) {
        await fetchSensorData();
    }
    loading.value = false;
});
</script>
