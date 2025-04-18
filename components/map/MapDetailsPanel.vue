<template>
    <Transition
        enter-active-class="transform transition ease-in-out duration-300 sm:duration-500"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transform transition ease-in-out duration-300 sm:duration-500"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
    >
        <aside v-if="selectedItem" class="fixed top-16 right-0 bottom-0 w-80 lg:w-96 bg-gray-900 border-l border-gray-700 shadow-lg z-40 p-5 text-sm">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                <h3 class="text-lg font-semibold text-white truncate" :title="panelTitle">{{ panelTitle }}</h3>
                <button @click="$emit('close')" class="ml-2 p-1 rounded-full text-gray-500 hover:bg-gray-700 hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
                    <XMarkIcon class="h-5 w-5" />
                    <span class="sr-only">Close</span>
                </button>
            </div>

            <div class="h-[calc(100%-4rem)] overflow-y-auto pr-1 custom-scrollbar">
                <div v-if="loading" class="text-center py-16">
                    <AppSpinner class="inline-block w-8 h-8" />
                    <p class="text-gray-400 mt-2">Loading details...</p>
                </div>
                <div v-else-if="error" class="text-red-300 bg-red-900/40 p-3 rounded border border-red-700/50">
                    <p class="font-medium mb-1">Error!</p>
                    <p class="text-xs">{{ error }}</p>
                    <button @click="retryFetch" class="mt-2 text-xs text-orange-400 hover:underline">Retry</button>
                </div>

                <div v-else-if="details" class="space-y-5 pb-4">
                    <section v-if="itemType === 'Zone'" aria-labelledby="zone-details-title">
                        <h4 id="zone-details-title" class="sr-only">Zone Details</h4>
                        <dl class="space-y-1.5">
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">ID:</dt> <dd class="text-gray-200 font-mono text-xs break-all">{{ details.id }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Description:</dt> <dd class="text-gray-200">{{ (details as Zone).description || '-' }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Location:</dt> <dd class="text-gray-200">{{ formatLocation(details as Zone) }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Sensors:</dt> <dd class="text-gray-200">{{ (details as ZoneWithDetails).sensors?.length ?? 'N/A' }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Cameras:</dt> <dd class="text-gray-200">{{ (details as ZoneWithDetails).cameras?.length ?? 'N/A' }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Created At:</dt> <dd class="text-gray-200">{{ formatDateTime(details.createdAt) }}</dd></div>
                        </dl>
                    </section>

                    <section v-if="itemType === 'Sensor'" aria-labelledby="sensor-details-title">
                        <h4 id="sensor-details-title" class="sr-only">Sensor Details</h4>
                        <dl class="space-y-1.5">
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">ID:</dt> <dd class="text-gray-200 font-mono text-xs break-all">{{ details.id }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Type:</dt> <dd class="text-gray-200">{{ (details as Sensor).type }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Location:</dt> <dd class="text-gray-200">{{ (details as Sensor).location }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Coordinates:</dt> <dd class="text-gray-200">{{ formatCoordinates(details as Sensor) }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Zone:</dt> <dd class="text-gray-200">{{ (details as SensorWithDetails).zone?.name || 'N/A' }}</dd></div>
                            <div class="flex items-center"><dt class="text-gray-400 w-24 flex-shrink-0">Status:</dt> <dd><SensorsSensorStatusBadge :status="(details as Sensor).status" /></dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Threshold:</dt> <dd class="text-gray-200">{{ formatThreshold(details as Sensor) }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Sensitivity:</dt> <dd class="text-gray-200">{{ (details as Sensor).sensitivity ?? 'Not Set' }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Created At:</dt> <dd class="text-gray-200">{{ formatDateTime(details.createdAt) }}</dd></div>
                        </dl>

                        <div v-if="(details as SensorWithDetails).activeAlert" class="mt-4 pt-3 border-t border-red-700 bg-red-900 bg-opacity-20 p-3 rounded space-y-1">
                            <h5 class="text-red-400 font-semibold flex items-center">
                                <BellAlertIcon class="h-4 w-4 mr-1.5" /> Active Alert
                            </h5>
                            <p class="text-gray-200 text-xs">{{ (details as SensorWithDetails).activeAlert!.message }}</p>
                            <p class="text-xs text-gray-500">{{ formatDateTime((details as SensorWithDetails).activeAlert!.createdAt) }}</p>
                            <NuxtLink :to="`/alerts/${(details as SensorWithDetails).activeAlert!.id}`" class="text-xs text-orange-400 hover:underline block mt-1">View Alert Details</NuxtLink>
                        </div>

                        <div class="mt-4 pt-3 border-t border-gray-700">
                            <h5 class="text-base font-medium text-white mb-2">Recent Logs</h5>
                            <div class="overflow-x-auto max-h-60 border border-gray-700 rounded bg-gray-850 custom-scrollbar-small">
                                <table class="min-w-full divide-y divide-gray-600">
                                    <thead class="bg-gray-700 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                                            <th scope="col" class="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Temperature (°C)</th>
                                            <th scope="col" class="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Humidity (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-gray-800 divide-y divide-gray-600">
                                        <tr v-if="!(details as SensorWithDetails).logs || (details as SensorWithDetails).logs!.length === 0">
                                            <td colspan="3" class="px-3 py-3 text-center text-sm text-gray-500 italic">No recent logs available.</td>
                                        </tr>
                                        <tr v-for="log in (details as SensorWithDetails).logs" :key="log.id">
                                            <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-400">{{ formatDateTimeShort(log.createdAt) }}</td>
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
                            <NuxtLink v-if="(details as SensorWithDetails).logs && (details as SensorWithDetails).logs!.length > 0" :to="`/sensors/${details.id}/logs`" class="text-xs text-orange-400 hover:underline block mt-2 text-right">View Full Logs</NuxtLink>
                        </div>
                    </section>

                    <section v-if="itemType === 'Camera'" aria-labelledby="camera-details-title">
                        <h4 id="camera-details-title" class="sr-only">Camera Details</h4>
                        <dl class="space-y-1.5">
                            <div class="flex"><dt class="text-gray-400 w-20 flex-shrink-0">ID:</dt> <dd class="text-gray-200 font-mono text-xs break-all">{{ details.id }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-20 flex-shrink-0">Coordinates:</dt> <dd class="text-gray-200">{{ formatCoordinates(details as Camera) }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-20 flex-shrink-0">Zone:</dt> <dd class="text-gray-200">{{ (details as CameraWithDetails).zone?.name || 'N/A' }}</dd></div>
                            <div class="flex"><dt class="text-gray-400 w-20 flex-shrink-0">URL:</dt> <dd><a :href="(details as Camera).url" target="_blank" class="text-orange-400 hover:underline break-all">{{ (details as Camera).url }}</a></dd></div>
                            <div class="flex"><dt class="text-gray-400 w-20 flex-shrink-0">Created At:</dt> <dd class="text-gray-200">{{ formatDateTime(details.createdAt) }}</dd></div>
                        </dl>
                        <div class="mt-4 pt-3 border-t border-gray-700">
                            <h5 class="text-base font-medium text-white mb-2">Live View / Snapshot</h5>
                            <div class="aspect-video bg-black rounded flex items-center justify-center border border-gray-700">
                                <p class="text-gray-500 italic text-xs px-4 text-center">Stream/Snapshot display area (Feature not implemented).</p>
                            </div>
                        </div>
                    </section>
                </div>

                <div v-else-if="!loading && !error" class="text-center py-10 text-gray-500">
                    No details available to display.
                </div>
            </div>
        </aside>
    </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { XMarkIcon, BellAlertIcon } from '@heroicons/vue/24/outline';
import { useNuxtApp } from '#app';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import SensorsSensorStatusBadge from '~/components/sensors/SensorStatusBadge.vue';
import type { Zone, Sensor, Camera, ZoneWithDetails, SensorWithDetails, CameraWithDetails } from '~/types/api';
import type { $Fetch } from 'ofetch';

type SelectedItem = { id: string; type: 'Zone' | 'Sensor' | 'Camera'; name: string; };

const props = defineProps({
    selectedItem: {
        type: Object as () => SelectedItem | null,
        default: null,
    },
});
const emit = defineEmits(['close']);

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;

type ItemDetails = ZoneWithDetails | SensorWithDetails | CameraWithDetails;
const details = ref<ItemDetails | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);


const clearDetails = () => {
    details.value = null;
    error.value = null;
    loading.value = false;
};


const itemType = computed(() => props.selectedItem?.type);
const panelTitle = computed(() => props.selectedItem?.name ? `${props.selectedItem.type}: ${props.selectedItem.name}` : `Details`);

watch(() => props.selectedItem, (newItem, oldItem) => {
    if (newItem && (newItem.id !== oldItem?.id || newItem.type !== oldItem?.type)) {
        fetchDetails(newItem.id, newItem.type);
    } else if (!newItem) {
        clearDetails();
    }
}, { immediate: true });

const fetchDetails = async (id: string, type: 'Zone' | 'Sensor' | 'Camera') => {
    if (loading.value && details.value?.id === id) return;

    loading.value = true;
    error.value = null;
    details.value = null;
    const endpoint = `/${type.toLowerCase()}s/${id}`;

    try {
        const fetchedData = await $api<ItemDetails>(endpoint, { method: 'GET' });
        details.value = fetchedData;
    } catch (err: any) {
        error.value = err?.data?.message || `Unable to load ${type} details.`;
    } finally {
        loading.value = false;
    }
};

const retryFetch = () => {
    if (props.selectedItem) {
        fetchDetails(props.selectedItem.id, props.selectedItem.type);
    }
};

const formatDateTime = (dateTimeString: string | Date | undefined | null): string => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
        return 'Invalid Date';
    }
};

const formatDateTimeShort = (dateTimeString: string | Date | undefined | null): string => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
        return 'Err';
    }
};

const formatLocation = (zone: Zone): string => {
    if (zone.city) return zone.city;
    if (zone.latitude !== null && zone.longitude !== null) return `Lat: ${zone.latitude?.toFixed(4)}, Lon: ${zone.longitude?.toFixed(4)}`;
    return 'Unknown';
};

const formatCoordinates = (item: Sensor | Camera): string => {
    if (item.latitude !== null && item.longitude !== null) return `Lat: ${item.latitude?.toFixed(5)}, Lon: ${item.longitude?.toFixed(5)}`;
    return 'Not Set';
};

const formatThreshold = (sensor: Sensor): string => {
    if (sensor.threshold === null || sensor.threshold === undefined) return 'Not Set';
    return `${sensor.threshold.toFixed(1)}°C`;
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #374151;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

.max-h-60 {
    max-height: 15rem;
}
.custom-scrollbar-small::-webkit-scrollbar {
    width: 5px;
}
.custom-scrollbar-small::-webkit-scrollbar-track {
    background: #4b5563;
    border-radius: 2.5px;
}
.custom-scrollbar-small::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 2.5px;
}
.custom-scrollbar-small::-webkit-scrollbar-thumb:hover {
    background: #d1d5db;
}

dl dt {
    flex-shrink: 0;
}
dl dd {
    word-break: break-word;
}
</style>