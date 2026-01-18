<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Plan } from '~/types/plan'
import type { ApiResponse } from '~/types/api'

const { api } = useApi()
const toast = useToast()

const plans = ref<Plan[]>([])
const loading = ref(false)
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedPlan = ref<Plan | null>(null)

const columns: TableColumn<Plan>[] = [
  { accessorKey: 'name', header: 'Plan Name' },
  { accessorKey: 'price', header: 'Price (Yearly)' },
  { accessorKey: 'features', header: 'Limits' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: 'Actions' },
]

async function fetchPlans() {
  loading.value = true
  try {
    const response = await api<ApiResponse<Plan[]>>('/v1/platform/plans')
    plans.value = response.data
  } catch (error) {
    toast.add({ title: 'Failed to fetch plans', color: 'error' })
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  isCreateModalOpen.value = true
}

function openEditModal(plan: Plan) {
  selectedPlan.value = plan
  isEditModalOpen.value = true
}

async function toggleStatus(plan: Plan) {
  try {
    const newStatus = plan.status === 'active' ? 'inactive' : 'active'
    await api(`/v1/platform/plans/${plan.id}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    toast.add({ title: 'Plan status updated', color: 'success' })
    fetchPlans()
  } catch (error) {
    toast.add({ title: 'Failed to update status', color: 'error' })
  }
}

async function deletePlan(id: string) {
  if (!confirm('Are you sure you want to delete this plan?')) return

  try {
    await api(`/v1/platform/plans/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Plan deleted successfully', color: 'success' })
    fetchPlans()
  } catch (error) {
    toast.add({ title: 'Failed to delete plan', color: 'error' })
  }
}

function handleSuccess() {
  isCreateModalOpen.value = false
  isEditModalOpen.value = false
  selectedPlan.value = null
  fetchPlans()
}

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p class="text-gray-600 mt-1">Manage subscription plans and pricing</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openCreateModal">
        Create Plan
      </UButton>
    </div>

    <UCard>
      <UTable :data="plans" :columns="columns" :loading="loading">
        <template #price-cell="{ row }">
          ${{ row.original.price }}/year
        </template>

        <template #features-cell="{ row }">
          <div class="text-sm">
            {{ row.original.features.maxBuildings }} buildings,
            {{ row.original.features.maxUnits }} units,
            {{ row.original.features.maxManagers }} managers
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'active' ? 'success' : 'error'" variant="subtle">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" color="neutral" variant="ghost" @click="openEditModal(row.original)">
              Edit
            </UButton>
            <UButton size="xs" :color="row.original.status === 'active' ? 'warning' : 'success'" variant="ghost"
              @click="toggleStatus(row.original)">
              {{ row.original.status === 'active' ? 'Deactivate' : 'Activate' }}
            </UButton>
            <UButton size="xs" color="error" variant="ghost" @click="deletePlan(row.original.id)">
              Delete
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isCreateModalOpen" title="Create New Plan">
      <template #body>
        <PlanForm mode="create" @success="handleSuccess" @cancel="isCreateModalOpen = false" />
      </template>
    </UModal>

    <UModal v-model:open="isEditModalOpen" title="Edit Plan">
      <template #body>
        <PlanForm v-if="selectedPlan" mode="edit" :plan="selectedPlan" @success="handleSuccess"
          @cancel="isEditModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>