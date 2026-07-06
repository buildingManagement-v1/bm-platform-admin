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
const canDeleteOwner = computed(() => hasRole(AdminRole.SUPER_ADMIN))
const canSeeManagers = computed(() => hasRole(AdminRole.SUPER_ADMIN) || hasRole(AdminRole.USER_MANAGER))
const canSeeTenants = computed(() => hasRole(AdminRole.SUPER_ADMIN) || hasRole(AdminRole.USER_MANAGER))

// ── Tab state ─────────────────────────────────────────────────────────────
type TabKey = 'owners' | 'managers' | 'tenants'
const activeTab = ref<TabKey>('owners')

// `value` is what UTabs selects/emits; without it Nuxt UI falls back to the
// item index ("0"/"1"/"2"), which would never match TabKey. `key` is kept for
// the content-slot checks in the template.
const tabs = computed(() => {
  const t = [{ key: 'owners', value: 'owners', label: 'Owners', icon: 'i-heroicons-user-circle' }]
  if (canSeeManagers.value) t.push({ key: 'managers', value: 'managers', label: 'Managers', icon: 'i-heroicons-briefcase' })
  if (canSeeTenants.value) t.push({ key: 'tenants', value: 'tenants', label: 'Tenants', icon: 'i-heroicons-home' })
  return t
})

// ── Shared filter state ───────────────────────────────────────────────────
const search = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive' | 'deleted'>('all')
const currentPage = ref(1)
const pageLimit = 20

const statusOptions = computed(() => {
  const options = [
    { label: 'All statuses', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ]
  if (activeTab.value === 'owners') {
    options.push({ label: 'Pending deletion', value: 'deleted' })
  }
  return options
})

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
    if (statusFilter.value === 'deleted') params.set('deleted', 'true')
    else if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
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

// ── Owner deletion ────────────────────────────────────────────────────────
const deleteTarget = ref<Owner | null>(null)
const deleteConfirmEmail = ref('')
const deletingOwner = ref(false)
const restoringOwnerId = ref<string | null>(null)

const deleteConfirmed = computed(
  () => deleteTarget.value !== null && deleteConfirmEmail.value.trim() === deleteTarget.value.email,
)

function openDeleteModal(owner: Owner) {
  deleteTarget.value = owner
  deleteConfirmEmail.value = ''
}

function closeDeleteModal() {
  deleteTarget.value = null
}

async function confirmDeleteOwner() {
  if (!deleteTarget.value || !deleteConfirmed.value) return
  deletingOwner.value = true
  try {
    await api(`/v1/platform/users/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Account scheduled for deletion', description: 'It will be permanently purged after the grace period.', color: 'success' })
    deleteTarget.value = null
    fetchOwners()
  } catch {
    toast.add({ title: 'Failed to delete owner', color: 'error' })
  } finally {
    deletingOwner.value = false
  }
}

async function restoreOwner(owner: Owner) {
  restoringOwnerId.value = owner.id
  try {
    await api(`/v1/platform/users/${owner.id}/restore`, { method: 'POST' })
    toast.add({ title: 'Account restored', color: 'success' })
    fetchOwners()
  } catch {
    toast.add({ title: 'Failed to restore owner', color: 'error' })
  } finally {
    restoringOwnerId.value = null
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
                <div v-if="row.original.deletedAt">
                  <UBadge color="error" variant="subtle">pending deletion</UBadge>
                  <p v-if="row.original.purgeAt" class="text-xs text-gray-400 mt-1">
                    purges {{ formatDate(row.original.purgeAt) }}
                  </p>
                </div>
                <UBadge
                  v-else
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
                <template v-if="row.original.deletedAt">
                  <UButton
                    v-if="canDeleteOwner"
                    size="xs"
                    color="success"
                    variant="ghost"
                    icon="i-heroicons-arrow-uturn-left"
                    :loading="restoringOwnerId === row.original.id"
                    @click="restoreOwner(row.original)"
                  >
                    Restore
                  </UButton>
                </template>
                <div v-else class="flex items-center gap-1">
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
                  <UButton
                    v-if="canDeleteOwner"
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    @click="openDeleteModal(row.original)"
                  >
                    Delete
                  </UButton>
                </div>
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

    <!-- Delete owner confirmation modal -->
    <UModal :open="deleteTarget !== null" @update:open="(v: boolean) => { if (!v) closeDeleteModal() }">
      <template #content>
        <UCard v-if="deleteTarget">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Delete owner account</h3>
          </template>

          <div class="space-y-4">
            <UAlert
              color="error"
              variant="subtle"
              icon="i-heroicons-exclamation-triangle"
              title="This deletes everything the owner manages"
              description="All buildings, units, tenants, leases, payments and managers under this account will be scheduled for deletion. The account is recoverable during the grace period, after which it is permanently purged."
            />
            <p class="text-sm text-gray-600">
              To confirm, type the owner's email
              <span class="font-semibold text-gray-900">{{ deleteTarget.email }}</span> below:
            </p>
            <UInput
              v-model="deleteConfirmEmail"
              placeholder="owner email"
              class="w-full"
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="closeDeleteModal">
                Cancel
              </UButton>
              <UButton
                color="error"
                :disabled="!deleteConfirmed"
                :loading="deletingOwner"
                @click="confirmDeleteOwner"
              >
                Schedule deletion
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
