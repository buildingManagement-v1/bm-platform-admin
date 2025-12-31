<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Admin } from '~/types'
import type { ApiResponse } from '~/types'

const { api } = useApi()
const toast = useToast()

const admins = ref<Admin[]>([])
const loading = ref(false)
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedAdmin = ref<Admin | null>(null)

const columns: TableColumn<Admin>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'roles', header: 'Roles' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Created At' },
  { id: 'actions', header: 'Actions' },
]

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  user_manager: 'User Manager',
  analytics_viewer: 'Analytics Viewer',
  system_manager: 'System Manager',
  billing_manager: 'Billing Manager',
}

const roleColors: Record<string, "error" | "primary" | "info" | "warning" | "success" | "secondary" | "neutral"> = {
  super_admin: 'error',
  user_manager: 'primary',
  analytics_viewer: 'info',
  system_manager: 'warning',
  billing_manager: 'success',
}

async function fetchAdmins() {
  loading.value = true
  try {
    const response = await api<ApiResponse<Admin[]>>('/v1/platform/auth/admins')
    admins.value = response.data
  } catch (error) {
    toast.add({ title: 'Failed to fetch admins', color: 'error' })
  } finally {
    loading.value = false
  }
}

function openEditModal(admin: Admin) {
  selectedAdmin.value = admin
  isEditModalOpen.value = true
}

async function deleteAdmin(id: string) {
  if (!confirm('Are you sure you want to delete this admin?')) return

  try {
    await api(`/v1/platform/admins/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Admin deleted successfully', color: 'success' })
    fetchAdmins()
  } catch (error) {
    toast.add({ title: 'Failed to delete admin', color: 'error' })
  }
}

function handleSuccess() {
  isCreateModalOpen.value = false
  isEditModalOpen.value = false
  selectedAdmin.value = null
  fetchAdmins()
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(() => {
  fetchAdmins()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Platform Admins</h1>
        <p class="text-gray-600 mt-1">Manage platform administrators and their roles</p>
      </div>

      <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true">
        Create Admin
      </UButton>
    </div>

    <UCard>
      <UTable :data="admins" :columns="columns" :loading="loading">
        <template #roles-cell="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="role in row.original.roles" :key="role" :color="roleColors[role]" variant="subtle" size="xs">
              {{ roleLabels[role] }}
            </UBadge>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" color="neutral" variant="ghost" @click="openEditModal(row.original)">
              Edit
            </UButton>
            <UButton size="xs" color="error" variant="ghost" @click="deleteAdmin(row.original.id)">
              Delete
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model:open="isCreateModalOpen" title="Create New Admin">
      <template #body>
        <AdminForm mode="create" @success="handleSuccess" @cancel="isCreateModalOpen = false" />
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditModalOpen" title="Edit Admin">
      <template #body>
        <AdminForm v-if="selectedAdmin" mode="edit" :admin="selectedAdmin" @success="handleSuccess"
          @cancel="isEditModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>