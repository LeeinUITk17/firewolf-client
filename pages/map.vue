<template>
    <div class="flex flex-col h-[calc(100vh-4rem)]">
        <div class="flex-shrink-0 h-1/3 md:h-2/5 lg:h-1/3 bg-gray-850 border-b border-gray-700 overflow-hidden p-4 flex flex-col">
            <h2 class="text-xl font-semibold text-white mb-3 flex-shrink-0">Details & Status</h2>
            <div class="flex-shrink-0 mb-3 border-b border-gray-700">
                <nav class="-mb-px flex space-x-4" aria-label="Tabs">
                    <button @click="setActiveTab('sensors')" :class="[activeTab === 'sensors' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500', 'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm']">
                        Sensors ({{ sensors.length }})
                        <span v-if="alertedSensorIds.size > 0" class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">{{ alertedSensorIds.size }}</span>
                    </button>
                    <button @click="setActiveTab('cameras')" :class="[activeTab === 'cameras' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500', 'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm']">
                        Cameras ({{ cameras.length }})
                    </button>
                    <button @click="setActiveTab('alerts')" :class="[activeTab === 'alerts' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500', 'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm']">
                        Pending Alerts ({{ activeAlerts.length }})
                    </button>
                    <button @click="fetchData" :disabled="loading" title="Refresh Data" class="ml-auto p-1.5 rounded-full text-gray-500 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <ArrowPathIcon class="h-4 w-4" :class="{'animate-spin': loading}" />
                    </button>
                </nav>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div v-if="loading && !initialDataLoaded" class="text-center py-10 text-gray-500"><AppSpinner class="inline-block"/> Loading...</div>
                <div v-if="errorMessage && !loading" class="text-center py-10 text-red-400">{{ errorMessage }}</div>
                <div v-show="activeTab === 'sensors' && initialDataLoaded">
                    <MapSensorInfoTable
                        :sensors="sensors"
                        :alerted-ids="alertedSensorIds"
                        :selected-id="selectedItem?.type === 'Sensor' ? selectedItem.id : null"
                        @row-click="handleRowClick"
                    />
                </div>
                <div v-show="activeTab === 'cameras' && initialDataLoaded">
                    <MapCameraInfoTable
                        :cameras="cameras"
                        :selected-id="selectedItem?.type === 'Camera' ? selectedItem.id : null"
                        @row-click="handleRowClick"
                    />
                </div>
                <div v-show="activeTab === 'alerts' && initialDataLoaded">
                    <MapAlertInfoTable
                        :alerts="activeAlerts"
                        @row-click="handleRowClick"
                    />
                </div>
            </div>
        </div>
        <div class="flex-1 relative border-t border-gray-700">
            <div v-if="loading || mapError" class="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-20 pointer-events-none">
                <div v-if="loading" class="text-center"><AppSpinner /><p class="text-gray-400 mt-2">Loading map...</p></div>
                <div v-if="mapError && !loading" class="text-red-400">{{ mapError }}</div>
            </div>
            <ClientOnly>
                <MapLeaflet
                    ref="mapLeafletRef"
                    v-if="initialCoords && !mapError"
                    :sensors="sensors"
                    :cameras="cameras"
                    :active-alerts="activeAlerts"
                    :initial-center="initialCoords"
                    :initial-zoom="16"
                    :selected-item-id="selectedItem?.id"
                    @item-select="handleItemSelectFromMap"
                />
                <div v-else-if="!mapError" class="flex items-center justify-center h-full bg-gray-800 text-gray-500">Determining location...</div>
                <template #fallback>
                    <div class="h-full bg-gray-800 flex items-center justify-center"><AppSpinner /></div>
                </template>
            </ClientOnly>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useNuxtApp } from '#app';
import MapLeaflet from '~/components/map/MapLeaflet.vue';
import MapSensorInfoTable from '~/components/map/MapSensorInfoTable.vue';
import MapCameraInfoTable from '~/components/map/MapCameraInfoTable.vue';
import MapAlertInfoTable from '~/components/map/MapAlertInfoTable.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import { ArrowPathIcon } from '@heroicons/vue/20/solid';
import type { Zone, Sensor, Camera, Alert, PaginatedResponse } from '~/types/api';
import type { $Fetch } from 'ofetch';
import type { Map } from 'leaflet';
import L from 'leaflet';

definePageMeta({ layout: 'default', middleware: ['auth'] });

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;
const sensors = ref<Sensor[]>([]);
const cameras = ref<Camera[]>([]);
const activeAlerts = ref<Alert[]>([]);
const zones = ref<Zone[]>([]);
const loading = ref(true);
const initialDataLoaded = ref(false);
const errorMessage = ref<string | null>(null);
const mapError = ref<string | null>(null);
const initialCoords = ref<[number, number] | null>(null);
const mapLeafletRef = ref<{ mapInstance: Map | null } | null>(null);

type SelectedItem = { id: string; type: 'Zone' | 'Sensor' | 'Camera' | 'Alert'; name: string; lat?: number | null; lon?: number | null };
const selectedItem = ref<SelectedItem | null>(null);
const activeTab = ref<'sensors' | 'cameras' | 'alerts'>('sensors');

const alertedSensorIds = computed(() => new Set(activeAlerts.value.map(alert => alert.sensorId)));

const fetchData = async () => {
    loading.value = true;
    errorMessage.value = null;
    mapError.value = null;
    try {
        const [sensorsRes, camerasRes, alertsRes, zonesRes] = await Promise.allSettled([
            $api<Sensor[]>('/sensors'),
            $api<Camera[]>('/cameras'),
            $api<PaginatedResponse<Alert>>('/alerts', { params: { status: 'PENDING', includeSensor: true, limit: 100 } }),
            $api<Zone[]>('/zones', { params: { limit: 50 } })
        ]);

        if (sensorsRes.status === 'fulfilled') sensors.value = sensorsRes.value || [];
        if (camerasRes.status === 'fulfilled') cameras.value = camerasRes.value || [];
        if (alertsRes.status === 'fulfilled' && alertsRes.value) activeAlerts.value = alertsRes.value.data || [];
        if (zonesRes.status === 'fulfilled' && zonesRes.value?.length > 0) {
            const firstValidZone = zonesRes.value.find(z => z.latitude != null && z.longitude != null);
            initialCoords.value = firstValidZone ? [firstValidZone.latitude!, firstValidZone.longitude!] : [10.7769, 106.7009];
        } else {
            initialCoords.value = [10.7769, 106.7009];
        }

        initialDataLoaded.value = true;
    } catch (error: any) {
        errorMessage.value = error.message || 'An error occurred while loading data.';
        sensors.value = [];
        cameras.value = [];
        activeAlerts.value = [];
        zones.value = [];
        initialCoords.value = null;
        mapError.value = "Failed to load map data.";
    } finally {
        loading.value = false;
    }
};

const setActiveTab = (tabName: 'sensors' | 'cameras' | 'alerts') => {
    activeTab.value = tabName;
    clearSelection();
};

const handleItemSelectFromMap = (item: SelectedItem) => {
    selectedItem.value = item;
    if (item.type === 'Sensor') setActiveTab('sensors');
    else if (item.type === 'Camera') setActiveTab('cameras');
};

const handleRowClick = async (item: SelectedItem) => {
    selectedItem.value = item;
    const map = mapLeafletRef.value?.mapInstance;
    await nextTick();

    if (map && item.lat != null && item.lon != null) {
        map.flyTo([item.lat, item.lon], 18, { animate: true, duration: 0.8 });
        setTimeout(() => {
            if (mapLeafletRef.value?.mapInstance) {
                const currentMap = mapLeafletRef.value.mapInstance;
                currentMap.eachLayer(layer => {
                    if (layer instanceof L.CircleMarker && (layer as any).options?.itemId === item.id) {
                        layer.openPopup();
                    } else if (layer instanceof L.Marker && (layer as any).options?.itemId === item.id) {
                        layer.openPopup();
                    }
                });
            }
        }, 900);
    }
};

const clearSelection = () => {
    selectedItem.value = null;
};

onMounted(() => {
    fetchData();
});
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
</style>
