<template>
    <div class="flex h-[calc(100vh-4rem)] relative">
        <div v-if="loading || errorMessage" class="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-30 pointer-events-none">
            <div v-if="loading" class="text-center">
                <AppSpinner class="w-10 h-10 inline-block" />
                <p class="text-gray-400 mt-3">Loading map data...</p>
            </div>
            <div v-if="errorMessage && !loading" class="bg-red-900 border border-red-700 text-red-300 px-6 py-4 rounded shadow-lg text-center pointer-events-auto">
                <p class="font-semibold mb-2">Error!</p>
                <p>{{ errorMessage }}</p>
                <button @click="fetchData" class="mt-3 px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-white text-sm">Retry</button>
            </div>
        </div>

        <ClientOnly>
            <MapLeaflet
                v-if="initialCoords"
                :sensors="sensors"
                :cameras="cameras"
                :active-alerts="activeAlerts"
                :initial-center="initialCoords"
                :initial-zoom="16"
                @item-select="selectItem"
                class="flex-1 transition-all duration-300 ease-in-out"
                :class="{ 'mr-80 lg:mr-96': !!selectedItem }"
            />
            <div v-else-if="!errorMessage" class="flex-1 flex items-center justify-center bg-gray-800 text-gray-500">
                Determining map center...
            </div>
            <template #fallback>
                <div class="flex-1 flex items-center justify-center bg-gray-800">
                    <AppSpinner class="w-10 h-10" />
                </div>
            </template>
        </ClientOnly>

        <MapDetailsPanel :selected-item="selectedItem" @close="clearSelection" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import MapLeaflet from '~/components/map/MapLeaflet.vue';
import MapDetailsPanel from '~/components/map/MapDetailsPanel.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import type { Zone, Sensor, Camera, Alert } from '~/types/api';
import type { $Fetch } from 'ofetch';

definePageMeta({
    layout: 'default',
    middleware: ['auth'],
});

const nuxtApp = useNuxtApp()
const $api = nuxtApp.$api as $Fetch;

const sensors = ref<Sensor[]>([]);
const cameras = ref<Camera[]>([]);
const activeAlerts = ref<Alert[]>([]);
const loading = ref(true);
const errorMessage = ref<string | null>(null);
const initialCoords = ref<[number, number] | null>(null);

type SelectedItem = { id: string; type: 'Zone' | 'Sensor' | 'Camera'; name: string };
const selectedItem = ref<SelectedItem | null>(null);

const fetchData = async () => {
    loading.value = true;
    errorMessage.value = null;
    selectedItem.value = null;

    try {
        const [sensorsRes, camerasRes, alertsRes, zonesRes] = await Promise.allSettled([
            $api<Sensor[]>('/sensors'),
            $api<Camera[]>('/cameras'),
            $api<Alert[]>('/alerts', { params: { status: 'PENDING', includeSensor: true } }),
            $api<Zone[]>('/zones', { params: { limit: 50 } }),
        ]);

        if (sensorsRes.status === 'fulfilled') {
            sensors.value = sensorsRes.value || [];
        }

        if (camerasRes.status === 'fulfilled') {
            cameras.value = camerasRes.value || [];
        }

        if (alertsRes.status === 'fulfilled') {
            activeAlerts.value = alertsRes.value || [];
        }

        if (zonesRes.status === 'fulfilled' && zonesRes.value && zonesRes.value.length > 0) {
            const firstValidZone = zonesRes.value.find(z => z.latitude != null && z.longitude != null);
            initialCoords.value = firstValidZone
                ? [firstValidZone.latitude!, firstValidZone.longitude!]
                : [10.7769, 106.7009];
        } else {
            initialCoords.value = [10.7769, 106.7009];
        }

        if ([sensorsRes, camerasRes].some(res => res.status === 'rejected')) {
            errorMessage.value = 'Failed to load device data for the map.';
        }
    } catch (error: any) {
        errorMessage.value = 'An unknown error occurred while loading map data.';
        sensors.value = [];
        cameras.value = [];
        activeAlerts.value = [];
    } finally {
        loading.value = false;
    }
};

const selectItem = (item: SelectedItem) => {
    selectedItem.value = item;
};

const clearSelection = () => {
    selectedItem.value = null;
};

onMounted(() => {
    fetchData();
});
</script>

<style scoped>
.h-\[calc\(100vh-4rem\)\] {
    height: calc(100vh - 4rem);
}
.transition-all {
    transition-property: all;
}
.ease-in-out {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.duration-300 {
    transition-duration: 300ms;
}
.mr-80 {
    margin-right: 20rem;
}
.lg\:mr-96 {
    margin-right: 24rem;
}
</style>
