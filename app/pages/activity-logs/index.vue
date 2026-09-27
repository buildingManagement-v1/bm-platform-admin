<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { ActivityEntityType, type PlatformActivityLog, type ActivityAction } from '~/types/activity-log'
import type { PageInfo, PaginatedResponse } from '~/types'
import { errorMessage } from '~/types/api'

function formatEntityType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const { api } = useApi()
const toast = useToast()

const logs = ref<PlatformActivityLog[]>([])
const loading = ref(false)

const startDate = ref('')
const endDate = ref('')
const selectedEntityType = ref<ActivityEntityType | ''>('')
const selectedAction = ref<ActivityAction | ''>('')

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
]

const entityTypeOptions = [
  { value: '', label: 'All Types' },
  ...Object.values(ActivityEntityType).map(value => ({ value, label: formatEntityType(value) })),
]

const columns: TableColumn<PlatformActivityLog>[] = [
  { accessorKey: 'createdAt', header: 'Date' },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'entityType', header: 'Type' },
  { accessorKey: 'adminName', header: 'Admin' },
  { accessorKey: 'details', header: 'Details' },
]

const selectedActionOption = computed({
  get: () => actionOptions.find(a => a.value === selectedAction.value),
  set: (val: { value: string; label: string } | undefined) => {
    selectedAction.value = (val?.value as ActivityAction) || ''
  }
})

const selectedEntityOption = computed({
  get: () => entityTypeOptions.find(e => e.value === selectedEntityType.value),
  set: (val: { value: string; label: string } | undefined) => {
    selectedEntityType.value = (val?.value as ActivityEntityType) || ''
  }
})

const search = ref('')
const page = ref(1)
const limit = 50
const pageInfo = ref<PageInfo | null>(null)

async function fetchLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String((page.value - 1) * limit) })
    if (search.value.trim()) params.append('q', search.value.trim())
    if (startDate.value) params.append('startDate', startDate.value)
    if (endDate.value) params.append('endDate', endDate.value)
    if (selectedEntityType.value) params.append('entityType', selectedEntityType.value)
    if (selectedAction.value) params.append('action', selectedAction.value)

    const response = await api<PaginatedResponse<PlatformActivityLog[]>>(
      `/v1/platform/activity-logs?${params.toString()}`
    )
    logs.value = response.data
    pageInfo.value = response.meta.page_info
  } catch (error) {
    toast.add({ title: 'Failed to fetch activity logs', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}


/** Readable "key: value" pairs for the details column */
function detailEntries(details: Record<string, unknown> | null) {
  if (!details) return []
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => ({
      key: k.replace(/([A-Z])/g, ' $1').toLowerCase(),
      value: typeof v === 'object' ? JSON.stringify(v) : String(v),
    }))
}

function applyFilters() {
  page.value = 1
  fetchLogs()
}

function getActionColor(action: string) {
  switch (action) {
    case 'create': return 'success'
    case 'update': return 'primary'
    case 'delete': return 'error'
    case 'status_change': return 'warning'
    default: return 'neutral'
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Activity Logs</h1>
      <p class="text-gray-600 mt-1">Track all platform administrative actions</p>
    </div>

    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Filters</h3>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <UFormField label="Search">
          <UInput v-model="search" placeholder="Admin name or record id" @keyup.enter="applyFilters" />
        </UFormField>
        <UFormField label="Start Date">
          <UInput v-model="startDate" type="date" />
        </UFormField>

        <UFormField label="End Date">
          <UInput v-model="endDate" type="date" />
        </UFormField>

        <UFormField label="Action">
          <USelectMenu v-model="selectedActionOption" :items="actionOptions" />
        </UFormField>

        <UFormField label="Entity Type">
          <USelectMenu v-model="selectedEntityOption" :items="entityTypeOptions" />
        </UFormField>
      </div>

      <div class="flex justify-end mt-4">
        <UButton :loading="loading" @click="applyFilters">Apply Filters</UButton>
      </div>
    </UCard>

    <UCard>
      <UTable :data="logs" :columns="columns" :loading="loading">
        <template #createdAt-cell="{ row }">
          <span class="text-sm">{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #action-cell="{ row }">
          <UBadge :color="getActionColor(row.original.action)" variant="subtle" class="capitalize">
            {{ row.original.action }}
          </UBadge>
        </template>

        <template #entityType-cell="{ row }">
          <span class="text-sm">{{ formatEntityType(row.original.entityType) }}</span>
        </template>

        <template #adminName-cell="{ row }">
          <p class="font-medium text-sm">{{ row.original.adminName }}</p>
        </template>

        <template #details-cell="{ row }">
          <div v-if="detailEntries(row.original.details).length" class="text-xs text-gray-600 max-w-md space-y-0.5">
            <div v-for="d in detailEntries(row.original.details)" :key="d.key" class="truncate" :title="d.value">
              <span class="text-gray-400">{{ d.key }}:</span> {{ d.value }}
            </div>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No activity logs</p>
            <p class="text-gray-500">No logs found for the selected filters</p>
          </div>
        </template>
      </UTable>
      <div v-if="pageInfo && pageInfo.total_pages > 1" class="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>{{ pageInfo.total_count }} entries</span>
        <UPagination v-model:page="page" :total="pageInfo.total_count" :items-per-page="limit" @update:page="fetchLogs" />
      </div>
    </UCard>
  </div>
</template>