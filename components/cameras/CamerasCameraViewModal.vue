<template>
    <AppModal :is-open="isOpen" @close="$emit('close')">
        <template #title>
            View Camera: {{ camera?.name }}
        </template>

        <template #content>
            <div v-if="!camera" class="text-center text-gray-500">No camera information available.</div>
            <div v-else>
                <dl class="text-sm space-y-1 mb-4">
                    <div class="flex">
                        <dt class="text-gray-400 w-20">Zone:</dt>
                        <dd class="text-gray-200">{{ camera.zone?.name || 'N/A' }}</dd>
                    </div>
                    <div class="flex">
                        <dt class="text-gray-400 w-20">URL:</dt>
                        <dd class="text-gray-200 text-xs font-mono break-all">{{ camera.url }}</dd>
                    </div>
                    <div class="flex items-center">
                        <dt class="text-gray-400 w-20">Status:</dt>
                        <dd><CamerasCameraStatusBadge :status="camera.status" /></dd>
                    </div>
                </dl>

                <div class="aspect-video bg-black rounded border border-gray-700 relative overflow-hidden">
                    <div v-if="loadingSnapshot" class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-10">
                        <AppSpinner class="w-8 h-8" />
                        <span class="mt-2 text-xs">Loading snapshot...</span>
                    </div>
                    <div v-else-if="snapshotError" class="absolute inset-0 flex flex-col items-center justify-center text-red-400 z-10 p-4 text-center">
                        <ExclamationTriangleIcon class="w-8 h-8 mb-2" />
                        <p class="text-xs font-medium">Snapshot loading error:</p>
                        <p class="text-xs mt-1">{{ snapshotError }}</p>
                        <button @click="fetchSnapshot" class="mt-3 text-xs text-orange-300 hover:underline">Retry</button>
                    </div>
                    <img v-else-if="snapshotUrl" :src="snapshotUrl" alt="Camera Snapshot" class="absolute inset-0 w-full h-full object-contain" />
                    <div v-else class="absolute inset-0 flex items-center justify-center text-gray-600 italic text-sm">
                        No snapshot available
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-2 text-center">Snapshot captured when this window was opened.</p>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-between w-full items-center">
                <button @click="fetchSnapshot" :disabled="loadingSnapshot" title="Refresh Snapshot" class="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loadingSnapshot }" />
                </button>
                <button type="button" class="btn-secondary" @click="$emit('close')">
                    Close
                </button>
            </div>
        </template>
    </AppModal>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onUnmounted } from 'vue';
import { useNuxtApp } from '#app';
import AppModal from '~/components/ui/AppModal.vue';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import CamerasCameraStatusBadge from '~/components/cameras/CameraStatusBadge.vue';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import type { CameraWithDetails } from '~/types/api';
import type { $Fetch } from 'ofetch';

const props = defineProps({
    isOpen: { type: Boolean, required: true },
    camera: { type: Object as () => CameraWithDetails | null, default: null },
});
const emit = defineEmits(['close']);

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;

const snapshotUrl = ref<string | null>(null);
const loadingSnapshot = ref(false);
const snapshotError = ref<string | null>(null);

const fetchSnapshot = async () => {
    if (!props.camera?.id || loadingSnapshot.value) return;

    loadingSnapshot.value = true;
    snapshotError.value = null;

    if (snapshotUrl.value) {
        URL.revokeObjectURL(snapshotUrl.value);
        snapshotUrl.value = null;
    }

    try {
        // Sử dụng Fetch API trực tiếp để hỗ trợ responseType: "blob"
        const response = await fetch(`/cameras/${props.camera.id}/snapshot`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch snapshot: ${response.statusText}`);
        }

        const blob = await response.blob();
        if (blob.type.startsWith('image/')) {
            snapshotUrl.value = URL.createObjectURL(blob);
        } else {
            throw new Error('Invalid response type. Expected an image blob.');
        }
    } catch (err: any) {
        snapshotError.value = err.message || 'Unable to load snapshot.';
        snapshotUrl.value = null;
    } finally {
        loadingSnapshot.value = false;
    }
};

watch(
    [() => props.isOpen, () => props.camera?.id],
    ([newIsOpen, newCamId], [oldIsOpen, oldCamId]) => {
        if (newIsOpen && newCamId && newCamId !== oldCamId) {
            fetchSnapshot();
        } else if (!newIsOpen && snapshotUrl.value) {
            URL.revokeObjectURL(snapshotUrl.value);
            snapshotUrl.value = null;
            snapshotError.value = null;
        }
    },
    { immediate: true }
);

onUnmounted(() => {
    if (snapshotUrl.value) {
        URL.revokeObjectURL(snapshotUrl.value);
    }
});

const formatDateTime = (dateTimeString: string | Date | undefined | null): string => {
    return '';
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
dl dt {
    flex-shrink: 0;
}
dl dd {
    word-break: break-word;
}
</style>
