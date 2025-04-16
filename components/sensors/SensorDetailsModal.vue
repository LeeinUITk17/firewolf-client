<template>
    <AppModal :is-open="isOpen" @close="$emit('close')">
        <template #title>
            Sensor Details: {{ sensor?.name }}
        </template>

        <template #content>
            <div v-if="loading" class="text-center py-10">
                <AppSpinner class="inline-block w-8 h-8" />
                <p class="text-gray-400 mt-2">Loading details...</p>
            </div>
            <div v-else-if="error" class="text-red-400 bg-red-900 bg-opacity-30 p-3 rounded border border-red-700">
                {{ error }}
            </div>
            <div v-else-if="sensor" class="space-y-4 text-sm">
                <div class="grid grid-cols-3 gap-x-4 gap-y-2">
                    <dt class="text-gray-400">ID:</dt>
                    <dd class="col-span-2 text-gray-200 font-mono">{{ sensor.id }}</dd>

                    <dt class="text-gray-400">Type:</dt>
                    <dd class="col-span-2 text-gray-200">{{ sensor.type }}</dd>

                    <dt class="text-gray-400">Location:</dt>
                    <dd class="col-span-2 text-gray-200">{{ sensor.location }}</dd>

                    <dt class="text-gray-400">Zone:</dt>
                    <dd class="col-span-2 text-gray-200">{{ sensor.zone?.name || 'N/A' }}</dd>

                    <dt class="text-gray-400">Status:</dt>
                    <dd class="col-span-2">
                        <SensorsSensorStatusBadge :status="sensor.status" />
                    </dd>

                    <dt class="text-gray-400">Threshold:</dt>
                    <dd class="col-span-2 text-gray-200">
                        {{ sensor.threshold != null ? sensor.threshold.toFixed(1) : '-' }}
                        <span v-if="sensor.threshold !== null">°C</span>
                    </dd>

                    <dt class="text-gray-400">Sensitivity:</dt>
                    <dd class="col-span-2 text-gray-200">{{ sensor.sensitivity ?? 'Not set' }}</dd>

                    <dt class="text-gray-400">Created At:</dt>
                    <dd class="col-span-2 text-gray-200">{{ formatDateTime(sensor.createdAt) }}</dd>
                </div>

                <div class="mt-6 pt-4 border-t border-gray-700">
                    <h4 class="text-base font-medium text-white mb-3">Recent Logs</h4>
                    <div class="overflow-x-auto max-h-60 border border-gray-700 rounded">
                        <table class="min-w-full divide-y divide-gray-600">
                            <thead class="bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                                    <th scope="col" class="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Temperature (°C)</th>
                                    <th scope="col" class="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Humidity (%)</th>
                                </tr>
                            </thead>
                            <tbody class="bg-gray-800 divide-y divide-gray-600">
                                <tr v-if="!sensor.logs || sensor.logs.length === 0">
                                    <td colspan="3" class="px-3 py-3 text-center text-sm text-gray-500">No logs available.</td>
                                </tr>
                                <tr v-for="log in sensor.logs" :key="log.id">
                                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-400">{{ formatDateTime(log.createdAt) }}</td>
                                    <td class="px-3 py-2 whitespace-nowrap text-xs text-center" :class="{'text-white': log.temperature !== null, 'text-gray-600': log.temperature === null}">
                                        {{ log.temperature?.toFixed(1) ?? '-' }}
                                    </td>
                                    <td class="px-3 py-2 whitespace-nowrap text-xs text-center" :class="{'text-white': log.humidity !== null, 'text-gray-600': log.humidity === null}">
                                        {{ log.humidity?.toFixed(0) ?? '-' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <button
                type="button"
                class="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                @click="$emit('close')"
            >
                Close
            </button>
        </template>
    </AppModal>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useNuxtApp } from '#app';
import AppModal from '~/components/ui/AppModal.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import SensorsSensorStatusBadge from '~/components/sensors/SensorStatusBadge.vue';
import type { Sensor, SensorLog, Zone } from '~/types/api';
import type { $Fetch } from 'ofetch';

interface SensorWithLogs extends Sensor {
    logs?: SensorLog[];
    zone?: Zone;
}

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true,
    },
    sensorId: {
        type: String,
        default: null,
    },
});

const emit = defineEmits(['close']);

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;

const sensor = ref<SensorWithLogs | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

watch(() => props.sensorId, async (newId) => {
    if (newId && props.isOpen) {
        await fetchSensorDetails(newId);
    } else {
        sensor.value = null;
        error.value = null;
    }
}, { immediate: true });

watch(() => props.isOpen, (newValue) => {
    if (newValue && props.sensorId && !sensor.value) {
        fetchSensorDetails(props.sensorId);
    }
});

const fetchSensorDetails = async (id: string) => {
    loading.value = true;
    error.value = null;
    sensor.value = null;
    try {
        const data = await $api<SensorWithLogs>(`/sensors/${id}`, {
            method: 'GET',
        });
        sensor.value = data;
    } catch (err: any) {
        error.value = err?.data?.message || `Unable to load sensor details (ID: ${id}).`;
    } finally {
        loading.value = false;
    }
};

const formatDateTime = (dateTimeString: string | Date): string => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-US', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        });
    } catch {
        return 'Invalid Date';
    }
};
</script>

<style scoped>
.max-h-60 {
    max-height: 15rem;
}
.max-h-60::-webkit-scrollbar {
    width: 6px;
}
.max-h-60::-webkit-scrollbar-track {
    background: #4a5568;
    border-radius: 3px;
}
.max-h-60::-webkit-scrollbar-thumb {
    background: #718096;
    border-radius: 3px;
}
.max-h-60::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
}
</style>
