<template>
  <div>
    <AlertsAlertFilter @filter="applyFilters" />
    <AlertsAlertTable
      :alerts="alerts"
      :loading="loading"
      @view-details="handleViewDetails"
      @update-status="handleUpdateStatusRequest"
    />
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
    <AlertsAlertDetailsModal
      :is-open="showDetailsModal"
      :alert-id="computedAlertId"
      @close="closeDetailsModal"
      @updated="handleAlertUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useNuxtApp, useRoute, useRouter } from '#app';
import AlertsAlertTable from '~/components/alerts/AlertTable.vue';
import AlertsAlertFilter from '~/components/alerts/AlertFilter.vue';
import UiPaginationControls from '~/components/ui/PaginationControls.vue';
import AlertsAlertDetailsModal from '~/components/alerts/AlertDetailsModal.vue';
import { XCircleIcon } from '@heroicons/vue/20/solid';
import { type AlertWithRelations, type PaginatedResponse, AlertStatus } from '~/types/api';
import type { $Fetch } from 'ofetch';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

const nuxtApp = useNuxtApp();
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

const showDetailsModal = ref(false);
const selectedAlertId = ref<string | null>(null);
const computedAlertId = computed(() => selectedAlertId.value ?? undefined);

const updatingStatusId = ref<string | null>(null);

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

const handleViewDetails = (alertId: string) => {
  selectedAlertId.value = alertId;
  showDetailsModal.value = true;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedAlertId.value = null;
};

const handlePageChange = (newPage: number) => {
  queryParams.page = newPage;
  router.push({ query: { ...queryParams } });
};

const handleUpdateStatusRequest = async (payload: { id: string; status: AlertStatus }) => {
  if (updatingStatusId.value) return;

  const { id, status } = payload;
  updatingStatusId.value = id;
  errorMessage.value = null;

  try {
    const updatedAlert = await $api<AlertWithRelations>(`/alerts/${id}/status`, {
      method: 'PATCH',
      body: { status: status },
    });
    handleAlertUpdated(updatedAlert);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || 'Error updating alert status.';
  } finally {
    updatingStatusId.value = null;
  }
};

const handleAlertUpdated = (updatedAlert: AlertWithRelations) => {
  const index = alerts.value.findIndex((a) => a.id === updatedAlert.id);
  if (index !== -1) {
    alerts.value[index] = updatedAlert;
    if (queryParams.status === AlertStatus.PENDING && updatedAlert.status !== AlertStatus.PENDING) {
      totalAlerts.value = Math.max(0, totalAlerts.value - 1);
    }
  }
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
