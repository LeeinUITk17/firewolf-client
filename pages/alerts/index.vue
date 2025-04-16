<template>
  <div>
    <AlertsAlertFilter @filter="applyFilters" />
    <AlertsAlertTable :alerts="alerts" :loading="loading" />
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
    <UiPaginationControls
      v-if="!loading && totalAlerts > pagination.limit"
      class="mt-4"
      :current-page="pagination.page"
      :items-per-page="pagination.limit"
      :total-items="totalAlerts"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useNuxtApp, useRoute, useRouter } from '#app';
import AlertsAlertTable from '~/components/alerts/AlertTable.vue';
import AlertsAlertFilter from '~/components/alerts/AlertFilter.vue';
import UiPaginationControls from '~/components/ui/PaginationControls.vue';
import { XCircleIcon } from '@heroicons/vue/20/solid';
import type { AlertWithRelations, PaginatedResponse, AlertStatus } from '~/types/api';
import type { $Fetch } from 'ofetch';
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});
const nuxtApp = useNuxtApp()
const $api = nuxtApp.$api as $Fetch;
const route = useRoute();
const router = useRouter();

const alerts = ref<AlertWithRelations[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const totalAlerts = ref(0);

const queryParams = reactive({
  page: 1,
  limit: 10,
  status: '' as AlertStatus | '',
  startDate: '',
  endDate: '',
});

const pagination = reactive({
  get page() {
    return queryParams.page;
  },
  get limit() {
    return queryParams.limit;
  },
});

const fetchAlerts = async () => {
  loading.value = true;
  errorMessage.value = null;

  const params: Record<string, any> = {};
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params[key] = value;
    }
  });

  try {
    const response = await $api<PaginatedResponse<AlertWithRelations>>('/alerts', {
      method: 'GET',
      params: params,
    });

    alerts.value = response.data || [];
    totalAlerts.value = response.total || 0;
  } catch (error: any) {
    errorMessage.value = error?.data?.message || 'Unable to load the alert list.';
    alerts.value = [];
    totalAlerts.value = 0;
  } finally {
    loading.value = false;
  }
};

const applyFilters = (filters: Record<string, string>) => {
  queryParams.page = 1;
  queryParams.status = (filters.status as AlertStatus | '') || '';
  queryParams.startDate = filters.startDate || '';
  queryParams.endDate = filters.endDate || '';
  router.push({ query: { ...queryParams } });
};

const handlePageChange = (newPage: number) => {
  queryParams.page = newPage;
  router.push({ query: { ...queryParams } });
};

watch(
  () => route.query,
  (newQuery) => {
    queryParams.page = parseInt(newQuery.page as string || '1', 10);
    queryParams.limit = parseInt(newQuery.limit as string || '10', 10);
    queryParams.status = (newQuery.status as AlertStatus | '') || '';
    queryParams.startDate = (newQuery.startDate as string) || '';
    queryParams.endDate = (newQuery.endDate as string) || '';
    fetchAlerts();
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
</style>
