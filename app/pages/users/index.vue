<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Owner, PlatformManager, PlatformTenant, PaginatedUsersResponse } from '~/types'
import { AdminRole } from '~/types'

const { api } = useApi()
const { user } = useAuth()
const toast = useToast()

// ── Role helpers ──────────────────────────────────────────────────────────
const admin = computed(() => user.value as { roles?: string[] } | null)
const hasRole = (role: string) => admin.value?.roles?.includes(role) ?? false
const canToggleStatus = computed(() => hasRole(AdminRole.SUPER_ADMIN) || hasRole(AdminRole.USER_MANAGER))
const canSeeManagers = computed(() => hasRole(AdminRole.SUPER_ADMIN) || hasRole(AdminRole.USER_MANAGER))
const canSeeTenants = computed(() => hasRole(AdminRole.SUPER_ADMIN) || hasRole(AdminRole.USER_MANAGER))

// ── Tab state ─────────────────────────────────────────────────────────────
type TabKey = 'owners' | 'managers' | 'tenants'
const activeTab = ref<TabKey>('owners')

const tabs = computed(() => {
  const t = [{ key: 'owners', label: 'Owners', icon: 'i-heroicons-user-circle' }]
  if (canSeeManagers.value) t.push({ key: 'managers', label: 'Managers', icon: 'i-heroicons-briefcase' })
  if (canSeeTenants.value) t.push({ key: 'tenants', label: 'Tenants', icon: 'i-heroicons-home' })
  return t
})

// ── Shared filter state ───────────────────────────────────────────────────
const search = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const currentPage = ref(1)
const pageLimit = 20

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

// Reset page on filter change
watch([search, statusFilter, activeTab], () => { currentPage.value = 1 })

// ── Owners ────────────────────────────────────────────────────────────────
const owners = ref<Owner[]>([])
const ownerTotal = ref(0)
const ownerTotalPages = ref(1)
const loadingOwners = ref(false)
const togglingOwnerId = ref<string | null>(null)

const ownerColumns: TableColumn<Owner>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Joined' },
  { id: 'actions', header: 'Actions' },
]

async function fetchOwners() {
  loadingOwners.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
    params.set('page', String(currentPage.value))
    params.set('limit', String(pageLimit))

    const res = await api<PaginatedUsersResponse<Owner>>(`/v1/platform/users?${params}`)
    owners.value = res.data
    ownerTotal.value = res.total
    ownerTotalPages.value = res.totalPages
  } catch {
    toast.add({ title: 'Failed to fetch owners', color: 'error' })
  } finally {
    loadingOwners.value = false
  }
}

async function toggleOwnerStatus(owner: Owner) {
  togglingOwnerId.value = owner.id
  const newStatus = owner.status === 'active' ? 'inactive' : 'active'
  try {
    await api(`/v1/platform/users/${owner.id}/status`, { method: 'PATCH', body: { status: newStatus } })
    toast.add({ title: `Owner ${newStatus === 'active' ? 'activated' : 'deactivated'}`, color: 'success' })
    fetchOwners()
  } catch {
    toast.add({ title: 'Failed to update status', color: 'error' })
  } finally {
    togglingOwnerId.value = null
  }
}

// ── Managers ──────────────────────────────────────────────────────────────
const managers = ref<PlatformManager[]>([])
const managerTotal = ref(0)
const managerTotalPages = ref(1)
const loadingManagers = ref(false)
const togglingManagerId = ref<string | null>(null)

const managerColumns: TableColumn<PlatformManager>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { id: 'buildings', header: 'Buildings' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Joined' },
  { id: 'actions', header: 'Actions' },
]

async function fetchManagers() {
  loadingManagers.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
    params.set('page', String(currentPage.value))
    params.set('limit', String(pageLimit))

    const res = await api<PaginatedUsersResponse<PlatformManager>>(`/v1/platform/managers?${params}`)
    managers.value = res.data
    managerTotal.value = res.total
    managerTotalPages.value = res.totalPages
  } catch {
    toast.add({ title: 'Failed to fetch managers', color: 'error' })
  } finally {
    loadingManagers.value = false
  }
}

async function toggleManagerStatus(manager: PlatformManager) {
  togglingManagerId.value = manager.id
  const newStatus = manager.status === 'active' ? 'inactive' : 'active'
  try {
    await api(`/v1/platform/managers/${manager.id}/status`, { method: 'PATCH', body: { status: newStatus } })
    toast.add({ title: `Manager ${newStatus === 'active' ? 'activated' : 'deactivated'}`, color: 'success' })
    fetchManagers()
  } catch {
    toast.add({ title: 'Failed to update status', color: 'error' })
  } finally {
    togglingManagerId.value = null
  }
}

// ── Tenants ───────────────────────────────────────────────────────────────
const tenants = ref<PlatformTenant[]>([])
const tenantTotal = ref(0)
const tenantTotalPages = ref(1)
const loadingTenants = ref(false)
const togglingTenantId = ref<string | null>(null)

const tenantColumns: TableColumn<PlatformTenant>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { id: 'building', header: 'Building' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Joined' },
  { id: 'actions', header: 'Actions' },
]

async function fetchTenants() {
  loadingTenants.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
    params.set('page', String(currentPage.value))
    params.set('limit', String(pageLimit))

    const res = await api<PaginatedUsersResponse<PlatformTenant>>(`/v1/platform/tenants?${params}`)
    tenants.value = res.data
    tenantTotal.value = res.total
    tenantTotalPages.value = res.totalPages
  } catch {
    toast.add({ title: 'Failed to fetch tenants', color: 'error' })
  } finally {
    loadingTenants.value = false
  }
}

async function toggleTenantStatus(tenant: PlatformTenant) {
  togglingTenantId.value = tenant.id
  const newStatus = tenant.status === 'active' ? 'inactive' : 'active'
  try {
    await api(`/v1/platform/tenants/${tenant.id}/status`, { method: 'PATCH', body: { status: newStatus } })
    toast.add({ title: `Tenant ${newStatus === 'active' ? 'activated' : 'deactivated'}`, color: 'success' })
    fetchTenants()
  } catch {
    toast.add({ title: 'Failed to update status', color: 'error' })
  } finally {
    togglingTenantId.value = null
  }
}

// ── Fetch on tab/page/filter change ──────────────────────────────────────
watch([activeTab, currentPage, statusFilter], () => {
  if (activeTab.value === 'owners') fetchOwners()
  else if (activeTab.value === 'managers') fetchManagers()
  else if (activeTab.value === 'tenants') fetchTenants()
}, { immediate: true })

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    if (activeTab.value === 'owners') fetchOwners()
    else if (activeTab.value === 'managers') fetchManagers()
    else if (activeTab.value === 'tenants') fetchTenants()
  }, 350)
})

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const currentTotal = computed(() => {
  if (activeTab.value === 'owners') return ownerTotal.value
  if (activeTab.value === 'managers') return managerTotal.value
  return tenantTotal.value
})

const currentTotalPages = computed(() => {
  if (activeTab.value === 'owners') return ownerTotalPages.value
  if (activeTab.value === 'managers') return managerTotalPages.value
  return tenantTotalPages.value
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Users</h1>
      <p class="text-gray-600 mt-1">View and manage all platform users</p>
    </div>

    <!-- Tabs -->
    <UTabs
      :items="tabs"
      :default-value="activeTab"
      @update:model-value="(v) => { activeTab = v as TabKey; search = ''; statusFilter = 'all' }"
    >
      <template #content="{ item }">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3 mb-4 mt-4">
          <UInput
            v-model="search"
            placeholder="Search by name or email…"
            icon="i-heroicons-magnifying-glass"
            class="flex-1"
          />
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            class="w-44"
          />
        </div>

        <!-- Results count -->
        <p class="text-sm text-gray-500 mb-3">
          {{ currentTotal }} {{ item.key === 'owners' ? 'owner' : item.key === 'managers' ? 'manager' : 'tenant' }}{{ currentTotal !== 1 ? 's' : '' }} found
        </p>

        <!-- ── Owners table ── -->
        <template v-if="item.key === 'owners'">
          <UCard>
            <UTable :data="owners" :columns="ownerColumns" :loading="loadingOwners">
              <template #phone-cell="{ row }">
                <span class="text-gray-500">{{ row.original.phone ?? '—' }}</span>
              </template>
              <template #status-cell="{ row }">
                <UBadge
                  :color="row.original.status === 'active' ? 'success' : 'neutral'"
                  variant="subtle"
                >
                  {{ row.original.status }}
                </UBadge>
              </template>
              <template #createdAt-cell="{ row }">
                {{ formatDate(row.original.createdAt) }}
              </template>
              <template #actions-cell="{ row }">
                <UButton
                  v-if="canToggleStatus"
                  size="xs"
                  :color="row.original.status === 'active' ? 'error' : 'success'"
                  variant="ghost"
                  :loading="togglingOwnerId === row.original.id"
                  @click="toggleOwnerStatus(row.original)"
                >
                  {{ row.original.status === 'active' ? 'Deactivate' : 'Activate' }}
                </UButton>
              </template>
            </UTable>
          </UCard>
        </template>

        <!-- ── Managers table ── -->
        <template v-else-if="item.key === 'managers'">
          <UCard>
            <UTable :data="managers" :columns="managerColumns" :loading="loadingManagers">
              <template #phone-cell="{ row }">
                <span class="text-gray-500">{{ row.original.phone ?? '—' }}</span>
              </template>
              <template #buildings-cell="{ row }">
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="b in row.original.buildings.slice(0, 2)"
                    :key="b.id"
                    color="info"
                    variant="subtle"
                    size="xs"
                  >
                    {{ b.name }}
                  </UBadge>
                  <UBadge
                    v-if="row.original.buildingCount > 2"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  >
                    +{{ row.original.buildingCount - 2 }} more
                  </UBadge>
                  <span v-if="row.original.buildingCount === 0" class="text-gray-400 text-sm">—</span>
                </div>
              </template>
              <template #status-cell="{ row }">
                <UBadge
                  :color="row.original.status === 'active' ? 'success' : 'neutral'"
                  variant="subtle"
                >
                  {{ row.original.status }}
                </UBadge>
              </template>
              <template #createdAt-cell="{ row }">
                {{ formatDate(row.original.createdAt) }}
              </template>
              <template #actions-cell="{ row }">
                <UButton
                  v-if="canToggleStatus"
                  size="xs"
                  :color="row.original.status === 'active' ? 'error' : 'success'"
                  variant="ghost"
                  :loading="togglingManagerId === row.original.id"
                  @click="toggleManagerStatus(row.original)"
                >
                  {{ row.original.status === 'active' ? 'Deactivate' : 'Activate' }}
                </UButton>
              </template>
            </UTable>
          </UCard>
        </template>

        <!-- ── Tenants table ── -->
        <template v-else-if="item.key === 'tenants'">
          <UCard>
            <UTable :data="tenants" :columns="tenantColumns" :loading="loadingTenants">
              <template #phone-cell="{ row }">
                <span class="text-gray-500">{{ row.original.phone ?? '—' }}</span>
              </template>
              <template #building-cell="{ row }">
                <div class="text-sm">
                  <p class="font-medium text-gray-900">{{ row.original.buildingName }}</p>
                  <p v-if="row.original.buildingCity" class="text-gray-400">{{ row.original.buildingCity }}</p>
                </div>
              </template>
              <template #status-cell="{ row }">
                <UBadge
                  :color="row.original.status === 'active' ? 'success' : 'neutral'"
                  variant="subtle"
                >
                  {{ row.original.status }}
                </UBadge>
              </template>
              <template #createdAt-cell="{ row }">
                {{ formatDate(row.original.createdAt) }}
              </template>
              <template #actions-cell="{ row }">
                <UButton
                  v-if="canToggleStatus"
                  size="xs"
                  :color="row.original.status === 'active' ? 'error' : 'success'"
                  variant="ghost"
                  :loading="togglingTenantId === row.original.id"
                  @click="toggleTenantStatus(row.original)"
                >
                  {{ row.original.status === 'active' ? 'Deactivate' : 'Activate' }}
                </UButton>
              </template>
            </UTable>
          </UCard>
        </template>

        <!-- Pagination -->
        <div v-if="currentTotalPages > 1" class="flex justify-center mt-4">
          <UPagination
            v-model:page="currentPage"
            :total="currentTotal"
            :items-per-page="pageLimit"
          />
        </div>
      </template>
    </UTabs>
  </div>
</template>
