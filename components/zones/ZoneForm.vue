<template>
    <form @submit.prevent="submitForm" class="space-y-4">
        <div v-if="localError" class="rounded-md bg-red-50 p-3 border border-red-200 mb-4">
            <p class="text-sm font-medium text-red-800">{{ localError }}</p>
        </div>

        <div>
            <label for="zone-name" class="block text-sm font-medium text-gray-300 mb-1">Zone Name <span class="text-red-500">*</span></label>
            <input
                type="text"
                id="zone-name"
                v-model="formData.name"
                required
                placeholder="Example: Floor 1 - Rack Area A"
                class="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
        </div>

        <div>
            <label for="zone-description" class="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
                id="zone-description"
                v-model="formData.description"
                rows="3"
                placeholder="Detailed description of the zone..."
                class="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            ></textarea>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Location Type</label>
            <select v-model="locationType" class="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                <option value="city">City</option>
                <option value="coords">Coordinates</option>
            </select>
        </div>

        <div v-if="locationType === 'city'">
            <label for="zone-city" class="block text-sm font-medium text-gray-300 mb-1">City</label>
            <input
                type="text"
                id="zone-city"
                v-model="formData.city"
                placeholder="Example: Ho Chi Minh City"
                :required="locationType === 'city'"
                class="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
        </div>

        <div v-if="locationType === 'coords'" class="grid grid-cols-2 gap-4">
            <div>
                <label for="zone-latitude" class="block text-sm font-medium text-gray-300 mb-1">Latitude</label>
                <input
                    type="number"
                    step="any"
                    id="zone-latitude"
                    v-model.number="formData.latitude"
                    placeholder="Example: 10.7769"
                    :required="locationType === 'coords'"
                    class="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
            </div>
            <div>
                <label for="zone-longitude" class="block text-sm font-medium text-gray-300 mb-1">Longitude</label>
                <input
                    type="number"
                    step="any"
                    id="zone-longitude"
                    v-model.number="formData.longitude"
                    placeholder="Example: 106.7009"
                    :required="locationType === 'coords'"
                    class="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
            </div>
        </div>

        <div class="pt-2 flex justify-end">
            <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500 disabled:opacity-50"
            >
                <AppSpinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
                {{ isEditMode ? 'Update Zone' : 'Add Zone' }}
            </button>
            <button
                type="button"
                @click="$emit('cancel')"
                class="ml-3 inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
            >
                Cancel
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, defineProps, defineEmits } from 'vue';
import type { Zone } from '~/types/api';
import AppSpinner from '~/components/ui/AppSpinner.vue';
import { useNuxtApp } from '#app';
import type { $Fetch } from 'ofetch';

const props = defineProps({
    initialData: {
        type: Object as () => Zone | null,
        default: null,
    },
    isSubmitting: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['submit', 'cancel']);

const nuxtApp = useNuxtApp();
const $api = nuxtApp.$api as $Fetch;

const formData = reactive<Partial<Zone>>({
    id: undefined,
    name: '',
    description: '',
    city: '',
    latitude: null,
    longitude: null,
});
const locationType = ref<'city' | 'coords'>('city');
const localError = ref<string | null>(null);

const isEditMode = computed(() => !!props.initialData?.id);

watch(
    () => props.initialData,
    (newData) => {
        if (newData) {
            formData.id = newData.id;
            formData.name = newData.name || '';
            formData.description = newData.description || '';
            formData.city = newData.city || '';
            formData.latitude = newData.latitude ?? null;
            formData.longitude = newData.longitude ?? null;

            if (newData.latitude !== null && newData.longitude !== null) {
                locationType.value = 'coords';
                formData.city = '';
            } else {
                locationType.value = 'city';
                formData.latitude = null;
                formData.longitude = null;
            }
        } else {
            formData.id = undefined;
            formData.name = '';
            formData.description = '';
            formData.city = '';
            formData.latitude = null;
            formData.longitude = null;
            locationType.value = 'city';
        }
    },
    { immediate: true }
);

watch(locationType, (newType) => {
    if (newType === 'city') {
        formData.latitude = null;
        formData.longitude = null;
    } else {
        formData.city = '';
    }
});

const submitForm = () => {
    localError.value = null;

    if (!formData.name) {
        localError.value = 'Zone name is required.';
        return;
    }
    if (locationType.value === 'city' && !formData.city) {
        localError.value = 'City name is required.';
        return;
    }
    if (locationType.value === 'coords' && (formData.latitude === null || formData.longitude === null)) {
        localError.value = 'Latitude and Longitude are required.';
        return;
    }

    const dataToSubmit: Partial<Zone> = { ...formData };
    if (!isEditMode.value) {
        delete dataToSubmit.id;
    }
    if (locationType.value === 'city') {
        dataToSubmit.latitude = null;
        dataToSubmit.longitude = null;
    } else {
        dataToSubmit.city = '';
    }

    emit('submit', dataToSubmit);
};
</script>
