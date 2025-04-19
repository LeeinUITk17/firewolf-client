<template>
    <AppModal :is-open="isOpen" @close="$emit('close')">
        <template #title>
            Alert Details {{ alertId ? `#${alertId.substring(0, 8)}...` : '' }}
        </template>

        <template #content>
            <div v-if="loading" class="text-center py-10">
                <AppSpinner class="inline-block w-8 h-8" />
                <p class="text-gray-400 mt-2">Loading details...</p>
            </div>
            <div v-else-if="error" class="text-red-300 bg-red-900/40 p-3 rounded border border-red-700/50">
                <p class="font-medium mb-1">Error!</p>
                <p class="text-xs">{{ error }}</p>
                <button @click="retryFetch" class="mt-2 text-xs text-orange-400 hover:underline">Retry</button>
            </div>
            <div v-else-if="alertDetail" class="space-y-4 text-sm">
                <dl class="space-y-1.5">
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Time:</dt> <dd class="text-gray-200">{{ formatDateTime(alertDetail.createdAt) }}</dd></div>
                    <div class="flex items-center"><dt class="text-gray-400 w-24 flex-shrink-0">Status:</dt> <dd><AlertStatusBadge :status="alertDetail.status" /></dd></div>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Origin:</dt> <dd class="text-gray-200">{{ formatOrigin(alertDetail.origin) }}</dd></div>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Message:</dt> <dd class="text-gray-100 bg-gray-800 p-2 rounded text-xs whitespace-pre-wrap">{{ alertDetail.message }}</dd></div>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Email Sent:</dt> <dd class="text-gray-200">{{ alertDetail.viaEmail ? 'Yes' : 'No' }}</dd></div>
                </dl>

                <div v-if="alertDetail.sensor" class="mt-3 pt-3 border-t border-gray-700 space-y-1.5">
                    <h4 class="text-base font-medium text-white mb-1">Related Sensor</h4>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Name:</dt> <dd class="text-gray-200">{{ alertDetail.sensor.name }}</dd></div>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Type:</dt> <dd class="text-gray-200">{{ alertDetail.sensor.type }}</dd></div>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Location:</dt> <dd class="text-gray-200">{{ alertDetail.sensor.location }}</dd></div>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Zone:</dt> <dd class="text-gray-200">{{ alertDetail.sensor.zone?.name || 'N/A' }}</dd></div>
                    <div class="flex items-center"><dt class="text-gray-400 w-24 flex-shrink-0">Status:</dt> <dd><SensorsSensorStatusBadge :status="alertDetail.sensor.status" /></dd></div>
                </div>

                <div v-if="alertDetail.user" class="mt-3 pt-3 border-t border-gray-700 space-y-1.5">
                    <h4 class="text-base font-medium text-white mb-1">Handler</h4>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Name:</dt> <dd class="text-gray-200">{{ alertDetail.user.name }}</dd></div>
                    <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Email:</dt> <dd class="text-gray-200">{{ alertDetail.user.email }}</dd></div>
                </div>

                <div v-if="alertDetail.camera || alertDetail.imageUrl" class="mt-3 pt-3 border-t border-gray-700 space-y-2">
                    <h4 class="text-base font-medium text-white mb-1">Related Camera</h4>
                    <div v-if="alertDetail.camera" class="space-y-1.5">
                        <div class="flex"><dt class="text-gray-400 w-24 flex-shrink-0">Camera Name:</dt> <dd class="text-gray-200">{{ alertDetail.camera.name }}</dd></div>
                    </div>
                    <div v-if="alertDetail.imageUrl">
                        <img :src="alertDetail.imageUrl" alt="Alert Image" class="mt-2 max-w-full h-auto rounded-md border border-gray-600">
                    </div>
                </div>
            </div>
            <div v-else-if="!loading && !error" class="text-center py-10 text-gray-500">
                No alert details found.
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end space-x-3">
                <button
                    v-if="alertDetail?.status === AlertStatus.PENDING"
                    @click="updateStatus(AlertStatus.IGNORED)"
                    :disabled="isUpdating"
                    class="inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md text-yellow-200 bg-yellow-600/20 border border-yellow-500/30 hover:bg-yellow-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <AppSpinner v-if="isUpdating && targetStatus === AlertStatus.IGNORED" class="w-4 h-4 mr-2"/>
                    <ArchiveBoxXMarkIcon v-else class="h-4 w-4 mr-1.5"/>
                    Ignore
                </button>
                <button
                    v-if="alertDetail?.status === AlertStatus.PENDING"
                    @click="updateStatus(AlertStatus.RESOLVED)"
                    :disabled="isUpdating"
                    class="inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md text-green-200 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <AppSpinner v-if="isUpdating && targetStatus === AlertStatus.RESOLVED" class="w-4 h-4 mr-2"/>
                    <CheckCircleIcon v-else class="h-4 w-4 mr-1.5"/>
                    Resolved
                </button>
                <button
                    type="button"
                    class="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                    @click="$emit('close')"
                >
                    Close
                </button>
            </div>
            <p v-if="updateError" class="text-xs text-red-400 mt-2 text-right">{{ updateError }}</p>
        </template>
    </AppModal>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useNuxtApp } from '#app';
import AppModal from '~/components/ui/AppModal.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import AlertStatusBadge from '~/components/alerts/AlertStatusBadge.vue';
import SensorsSensorStatusBadge from '~/components/sensors/SensorStatusBadge.vue';
import { CheckCircleIcon, ArchiveBoxXMarkIcon } from '@heroicons/vue/20/solid';
import { AlertOrigin, AlertStatus, type AlertWithDetails } from '~/types/api';
import type { $Fetch } from 'ofetch';

const props = defineProps({
    isOpen: { type: Boolean, required: true },
    alertId: { type: String, default: null },
});
const emit = defineEmits(['close', 'updated']);

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;
const alertDetail = ref<AlertWithDetails | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isUpdating = ref(false);
const updateError = ref<string | null>(null);
const targetStatus = ref<AlertStatus | null>(null);

const clearDetails = () => {
    alertDetail.value = null;
    error.value = null;
    loading.value = false;
    updateError.value = null;
    isUpdating.value = false;
    targetStatus.value = null;
};

const fetchAlertDetail = async () => {
    if (!props.alertId || loading.value) return;

    loading.value = true;
    error.value = null;
    alertDetail.value = null;
    updateError.value = null;

    try {
        alertDetail.value = await $api<AlertWithDetails>(`/alerts/${props.alertId}`);
    } catch (err: any) {
        error.value = err?.data?.message || `Unable to load alert details.`;
    } finally {
        loading.value = false;
    }
};

const retryFetch = () => {
    fetchAlertDetail();
};

const updateStatus = async (newStatus: AlertStatus) => {
    if (!alertDetail.value || isUpdating.value || alertDetail.value.status !== AlertStatus.PENDING) return;

    isUpdating.value = true;
    updateError.value = null;
    targetStatus.value = newStatus;

    try {
        const updated = await $api<AlertWithDetails>(`/alerts/${alertDetail.value.id}/status`, {
            method: 'PATCH',
            body: { status: newStatus },
        });
        alertDetail.value = updated;
        emit('updated', updated);
    } catch (err: any) {
        updateError.value = err?.data?.message || `Error updating status.`;
    } finally {
        isUpdating.value = false;
        targetStatus.value = null;
    }
};

watch([() => props.alertId, () => props.isOpen], ([newId, newIsOpen], [oldId, oldIsOpen]) => {
    if (newIsOpen && newId && (newId !== oldId || !alertDetail.value)) {
        fetchAlertDetail();
    } else if (!newIsOpen) {
        if (alertDetail.value !== null || error.value !== null || loading.value) {
            clearDetails();
        }
    } else if (newIsOpen && !newId) {
        clearDetails();
        error.value = "No alert ID provided.";
    }
}, { immediate: true });

const formatDateTime = (dateTimeString: string | Date | undefined | null): string => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch (e) {
        return 'Invalid Date';
    }
};

const formatOrigin = (origin: AlertOrigin | undefined | null): string => {
    if (!origin) return 'Unknown';
    switch (origin) {
        case AlertOrigin.SENSOR_THRESHOLD: return 'Sensor Threshold Exceeded';
        case AlertOrigin.SENSOR_ERROR: return 'Sensor Error';
        case AlertOrigin.ML_DETECTION: return 'AI Detection';
        case AlertOrigin.MANUAL_INPUT: return 'Manual Input';
    }
    return origin;
};
</script>

<style scoped>
dl dt { flex-shrink: 0; }
dl dd { word-break: break-word; }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #374151; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #6b7280; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
