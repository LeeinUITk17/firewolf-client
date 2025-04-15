<template>
    <div>
        <h1 class="text-2xl font-semibold text-white mb-6">Dashboard Overview</h1>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div class="bg-gray-900 overflow-hidden shadow rounded-lg border border-gray-700">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <BeakerIcon class="h-6 w-6 text-orange-500" aria-hidden="true" />
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-400 truncate">Active Sensors</dt>
                                <dd>
                                    <div class="text-lg font-medium text-white">
                                        {{ sensorStats.active }}/{{ sensorStats.total }}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-gray-900 overflow-hidden shadow rounded-lg border border-red-500">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <BellAlertIcon class="h-6 w-6 text-red-500" aria-hidden="true" />
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-400 truncate">Pending Alerts</dt>
                                <dd>
                                    <div class="text-lg font-medium text-red-400">
                                        {{ alertStats.pending }}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-gray-900 overflow-hidden shadow rounded-lg border border-gray-700">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <VideoCameraIcon class="h-6 w-6 text-blue-500" aria-hidden="true" />
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-400 truncate">Total Cameras</dt>
                                <dd>
                                    <div class="text-lg font-medium text-white">
                                        {{ cameraStats.total }}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-gray-900 overflow-hidden shadow rounded-lg border border-gray-700">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <ChartBarIcon class="h-6 w-6 text-green-500" aria-hidden="true" />
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-400 truncate">Average Temperature</dt>
                                <dd>
                                    <div class="text-lg font-medium text-white">
                                        {{ avgTemp !== null ? avgTemp.toFixed(1) + '°C' : 'N/A' }}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div class="bg-gray-900 p-4 rounded-lg shadow border border-gray-700">
                <h3 class="text-lg font-medium text-white mb-4">Recent Temperature (Sensor X)</h3>
                <p class="text-gray-500">Temperature chart will be displayed here...</p>
            </div>

            <div class="bg-gray-900 p-4 rounded-lg shadow border border-gray-700">
                <h3 class="text-lg font-medium text-white mb-4">Recent Alerts</h3>
                <p class="text-gray-500">List of the latest alerts...</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import {
    BeakerIcon,
    BellAlertIcon,
    VideoCameraIcon,
    ChartBarIcon,
} from '@heroicons/vue/24/outline';

definePageMeta({
    layout: 'default',
    middleware: 'auth'
});

const sensorStats = ref({ active: 0, total: 0 });
const alertStats = ref({ pending: 0 });
const cameraStats = ref({ total: 0 });
const avgTemp = ref<number | null>(null);

const fetchDashboardData = async () => {
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        sensorStats.value = { active: 15, total: 20 };
        alertStats.value = { pending: 2 };
        cameraStats.value = { total: 8 };
        avgTemp.value = 23.5;
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
    }
};

onMounted(() => {
    fetchDashboardData();
});
</script>

<style scoped>
</style>
