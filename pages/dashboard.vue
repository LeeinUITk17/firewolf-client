<template>
    <div>
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-semibold text-white">System Overview</h1>
            <button @click="fetchDashboardData" :disabled="loading" title="Refresh Data"
                            class="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon class="h-5 w-5" :class="{'animate-spin': loading}" />
            </button>
        </div>

        <div v-if="loading && !initialDataLoaded" class="text-center py-20">
            <AppSpinner class="w-10 h-10 inline-block" />
            <p class="text-gray-400 mt-3">Loading dashboard data...</p>
        </div>

        <div v-if="errorMessage && !loading" class="mb-6 rounded-md bg-red-900 bg-opacity-40 border border-red-700 p-4 text-red-300">
            {{ errorMessage }}
        </div>

        <div v-if="initialDataLoaded" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStatCard
                title="Active Sensors"
                :icon="BeakerIcon"
                icon-color="text-green-400"
                icon-bg-color="bg-green-900/30"
                :border-color="sensorStats.error > 0 ? 'border-yellow-500/60' : 'border-gray-700 hover:border-green-500/50'"
            >
                <template #value>
                    <div class="text-lg font-medium text-white">
                        <span :class="{'text-green-400': sensorStats.active === sensorStats.total && sensorStats.total > 0}">
                            {{ sensorStats.active }}
                        </span> / {{ sensorStats.total }}
                    </div>
                    <div v-if="sensorStats.error > 0 || sensorStats.inactive > 0" class="text-xs mt-1">
                        <span v-if="sensorStats.error > 0" class="text-yellow-400 mr-2">{{ sensorStats.error }} errors</span>
                        <span v-if="sensorStats.inactive > 0" class="text-gray-500">{{ sensorStats.inactive }} inactive</span>
                    </div>
                </template>
            </DashboardStatCard>

            <DashboardStatCard
                title="Pending Alerts"
                :value="alertStats.pending"
                :icon="BellAlertIcon"
                icon-color="text-red-400"
                icon-bg-color="bg-red-900/30"
                :border-color="alertStats.pending > 0 ? 'border-red-500 ring-1 ring-red-500/30' : 'border-gray-700 hover:border-orange-500/50'"
                link="/alerts?status=PENDING"
                link-text="View Alerts"
            >
                <template #value>
                    <div class="text-lg font-medium" :class="alertStats.pending > 0 ? 'text-red-400' : 'text-white'">
                        {{ alertStats.pending }}
                    </div>
                </template>
            </DashboardStatCard>

            <DashboardStatCard
                title="Total Cameras"
                :value="cameraStats.total"
                :icon="VideoCameraIcon"
                icon-color="text-blue-400"
                icon-bg-color="bg-blue-900/30"
                link="/cameras"
                link-text="Manage Cameras"
            />

            <DashboardStatCard
                title="Avg Temp (24h)"
                :value="avgTemp !== null ? avgTemp.toFixed(1) + '°C' : 'N/A'"
                :icon="ChartBarIcon"
                icon-color="text-teal-400"
                icon-bg-color="bg-teal-900/30"
            />
        </div>

        <div v-if="initialDataLoaded" class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div class="bg-gray-850 p-4 rounded-lg shadow border border-gray-700 min-h-[300px]">
                <h3 class="text-lg font-medium text-white mb-4">Temperature Chart (Default Sensor)</h3>
                <ChartsLineChartPlaceholder v-if="chartLoading" />
                <div v-else class="flex items-center justify-center h-full text-gray-500">
                    Temperature chart... (Integration needed)
                </div>
            </div>

            <div class="bg-gray-850 p-4 rounded-lg shadow border border-gray-700 min-h-[300px]">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-white">Recent Alerts (Pending)</h3>
                    <NuxtLink to="/alerts" class="text-sm text-orange-400 hover:underline">View All</NuxtLink>
                </div>
                <AlertsRecentAlertsList :alerts="recentAlerts" :loading="recentAlertsLoading" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useNuxtApp } from '#app';
import type { $Fetch } from 'ofetch';
import DashboardStatCard from '~/components/dashboard/StatCard.vue';
import ChartsLineChartPlaceholder from '~/components/charts/LineChartPlaceholder.vue';
import AlertsRecentAlertsList from '~/components/alerts/RecentAlertsList.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import {
    BeakerIcon, BellAlertIcon, VideoCameraIcon, ArrowPathIcon, ChartBarIcon
} from '@heroicons/vue/24/outline';
import type { AlertWithRelations } from '~/types/api';

definePageMeta({
    layout: 'default',
    middleware: 'auth'
});

const nuxtApp = useNuxtApp()
const $api = nuxtApp.$api as $Fetch;
const loading = ref(true);
const initialDataLoaded = ref(false);
const errorMessage = ref<string | null>(null);

const sensorStats = reactive({ total: 0, active: 0, inactive: 0, error: 0 });
const alertStats = reactive({ pending: 0, resolvedToday: 0, totalToday: 0 });
const cameraStats = reactive({ total: 0 });
const avgTemp = ref<number | null>(null);

const chartLoading = ref(false);
const recentAlertsLoading = ref(false);
const recentAlerts = ref<AlertWithRelations[]>([]);

const fetchDashboardData = async () => {
    loading.value = true;
    errorMessage.value = null;

    try {
        const results = await Promise.allSettled([
            $api<{ total: number; active: number; inactive: number; error: number }>('/sensors/stats'),
            $api<{ pending: number; resolvedToday?: number; totalToday?: number }>('/alerts/stats'),
            $api<{ total: number }>('/cameras/stats'),
            $api<{ averageTemperature: number | null }>('/logs/stats'),
            $api<AlertWithRelations[]>('/alerts', { params: { limit: 5, status: 'PENDING', sortBy: 'createdAt', sortOrder: 'desc' } })
        ]);

        const [sensorsRes, alertsRes, camerasRes, avgTempRes, recentAlertsRes] = results;

        if (sensorsRes.status === 'fulfilled' && sensorsRes.value) {
            Object.assign(sensorStats, sensorsRes.value);
        }

        if (alertsRes.status === 'fulfilled' && alertsRes.value) {
            Object.assign(alertStats, alertsRes.value);
        }

        if (camerasRes.status === 'fulfilled' && camerasRes.value) {
            Object.assign(cameraStats, camerasRes.value);
        }

        if (avgTempRes.status === 'fulfilled' && avgTempRes.value) {
            avgTemp.value = avgTempRes.value.averageTemperature;
        }

        if (recentAlertsRes.status === 'fulfilled' && recentAlertsRes.value) {
            recentAlerts.value = recentAlertsRes.value;
        } else {
            recentAlerts.value = [];
        }

        if (results.slice(0, 4).some(res => res.status === 'rejected')) {
            errorMessage.value = "Failed to load all statistics.";
        }

        initialDataLoaded.value = true;
    } catch (error: any) {
        errorMessage.value = 'An unexpected error occurred while loading dashboard data.';
    } finally {
        loading.value = false;
    }
};

const fetchChartData = async () => {
    chartLoading.value = true;
    try {
        await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (error) {
        console.error("Failed to fetch chart data:", error);
    } finally {
        chartLoading.value = false;
    }
};

onMounted(() => {
    fetchDashboardData();
    fetchChartData();
});
</script>

<style scoped>
</style>
