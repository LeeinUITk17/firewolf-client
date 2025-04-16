<template>
    <div>
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-semibold text-white">Sensor List</h1>
            <NuxtLink
                to="/sensors/config"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500"
            >
                <Cog6ToothIcon class="h-5 w-5 mr-2" />
                Manage / Add New
            </NuxtLink>
        </div>

        <SensorsSensorTable
            :sensors="sensors"
            :loading="loading"
            @delete="handleDeleteSensor"
            @view-details="handleViewDetails"
        />

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

        <AppModal :is-open="showDeleteConfirm" @close="cancelDelete">
            <template #title>Confirm Sensor Deletion</template>
            <template #content>
                <p class="text-sm text-gray-400">
                    Are you sure you want to delete the sensor <strong class="text-white">{{ sensorToDelete?.name }}</strong>? This action cannot be undone.
                </p>
            </template>
            <template #footer>
                <button @click="confirmDelete" :disabled="deleting" class="... bg-red-600 ...">
                    <AppSpinner v-if="deleting" class="w-4 h-4 mr-2" /> {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
                <button @click="cancelDelete" ref="cancelButtonRef" class="ml-3 ... bg-gray-700 ...">Cancel</button>
            </template>
        </AppModal>

        <SensorsSensorDetailsModal
            :is-open="showDetailsModal"
            :sensor-id="computedSensorId"
            @close="closeDetailsModal"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import SensorsSensorTable from '~/components/sensors/SensorTable.vue';
import AppModal from '~/components/ui/AppModal.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import SensorsSensorDetailsModal from '~/components/sensors/SensorDetailsModal.vue';
import { XCircleIcon, Cog6ToothIcon } from '@heroicons/vue/20/solid';
import type { SensorWithDetails } from '~/types/api';
import type { $Fetch } from 'ofetch';

definePageMeta({
    layout: 'default',
    middleware: ['auth'],
});

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;

const sensors = ref<SensorWithDetails[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const showDeleteConfirm = ref(false);
const sensorToDelete = ref<SensorWithDetails | null>(null);
const deleting = ref(false);
const showDetailsModal = ref(false);
const selectedSensorId = ref<string | null>(null);
const computedSensorId = computed(() => selectedSensorId.value ?? undefined);

const fetchSensors = async () => {
    loading.value = true;
    errorMessage.value = null;
    try {
        const data = await $api<SensorWithDetails[]>('/sensors', { method: 'GET' });
        sensors.value = data || [];
    } catch (error: any) {
        errorMessage.value = error?.data?.message || 'Unable to load sensor list.';
        sensors.value = [];
    } finally {
        loading.value = false;
    }
};

const handleDeleteSensor = (sensorId: string) => {
    const sensor = sensors.value.find((s) => s.id === sensorId);
    if (sensor) {
        sensorToDelete.value = sensor;
        showDeleteConfirm.value = true;
    }
};

const cancelDelete = () => {
    showDeleteConfirm.value = false;
    setTimeout(() => {
        sensorToDelete.value = null;
    }, 200);
};

const confirmDelete = async () => {
    if (!sensorToDelete.value) return;
    deleting.value = true;
    errorMessage.value = null;
    try {
        await $api(`/sensors/${sensorToDelete.value.id}`, { method: 'DELETE' });
        sensors.value = sensors.value.filter((s) => s.id !== sensorToDelete.value!.id);
        cancelDelete();
    } catch (error: any) {
        errorMessage.value = error?.data?.message || `Unable to delete sensor ${sensorToDelete.value.name}.`;
    } finally {
        deleting.value = false;
    }
};

const handleViewDetails = (sensorId: string) => {
    selectedSensorId.value = sensorId;
    showDetailsModal.value = true;
};

const closeDetailsModal = () => {
    showDetailsModal.value = false;
    setTimeout(() => {
        selectedSensorId.value = null;
    }, 200);
};

onMounted(() => {
    fetchSensors();
});
</script>
