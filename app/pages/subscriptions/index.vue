<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Subscription } from '~/types/subscription'
import type { ApiResponse } from '~/types/api'

const { api } = useApi()
const toast = useToast()

const subscriptions = ref<Subscription[]>([])
const loading = ref(false)
const isAssignModalOpen = ref(false)
const isUpgradeModalOpen = ref(false)
const selectedSubscription = ref<Subscription | null>(null)

const columns: TableColumn<Subscription>[] = [
  { accessorKey: 'user.name', header: 'User' },
  { accessorKey: 'plan.name', header: 'Plan' },
  { accessorKey: 'buildingCount', header: 'Buildings' },
  { accessorKey: 'managerCount', header: 'Managers' },
  { accessorKey: 'totalAmount', header: 'Yearly Amount' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'billingCycleEnd', header: 'Expires' },
  { id: 'actions', header: 'Actions' },
]

function openUpgradeModal(subscription: Subscription) {
  selectedSubscription.value = subscription
  isUpgradeModalOpen.value = true
}

function handleUpgradeSuccess() {
  isUpgradeModalOpen.value = false
  selectedSubscription.value = null
  fetchSubscriptions()
}

async function fetchSubscriptions() {
  loading.value = true
  try {
    // TODO: We need an endpoint to get all subscriptions
    // For now, this is a placeholder
    const response = await api<ApiResponse<Subscription[]>>('/v1/platform/subscriptions/all')
    subscriptions.value = response.data
  } catch (error) {
    toast.add({ title: 'Failed to fetch subscriptions', color: 'error' })
  } finally {
    loading.value = false
  }
}

function openAssignModal() {
  isAssignModalOpen.value = true
}

async function toggleStatus(subscription: Subscription) {
  try {
    const newStatus = subscription.status === 'active' ? 'cancelled' : 'active'
    await api(`/v1/platform/subscriptions/${subscription.id}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    toast.add({ title: 'Subscription status updated', color: 'success' })
    fetchSubscriptions()
  } catch (error) {
    toast.add({ title: 'Failed to update status', color: 'error' })
  }
}

function handleSuccess() {
  isAssignModalOpen.value = false
  fetchSubscriptions()
}

async function downloadInvoice(subscriptionId: string) {
  try {
    const response = await api(
      `/v1/platform/subscriptions/${subscriptionId}/download`,
      { responseType: 'blob' }
    )

    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `subscription-invoice-${subscriptionId}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.add({ title: 'Invoice downloaded', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Failed to download invoice', description: error.message, color: 'error' })
  }
}

onMounted(() => {
  fetchSubscriptions()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">User Subscriptions</h1>
        <p class="text-gray-600 mt-1">Manage user subscriptions and billing</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openAssignModal">
        Assign Subscription
      </UButton>
    </div>

    <UCard>
      <UTable :data="subscriptions" :columns="columns" :loading="loading">
        <template #plan.name-cell="{ row }">
          {{ row.original.plan?.name || 'N/A' }}
        </template>

        <template #totalAmount-cell="{ row }">
          ${{ row.original.totalAmount }}/year
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'active' ? 'success' : row.original.status === 'expired' ? 'warning' : 'error'"
            variant="subtle">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #billingCycleEnd-cell="{ row }">
          {{ new Date(row.original.billingCycleEnd).toLocaleDateString() }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" color="neutral" variant="ghost" @click="downloadInvoice(row.original.id)">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
            </UButton>
            <UButton v-if="row.original.status === 'active'" size="xs" color="primary" variant="ghost"
              @click="openUpgradeModal(row.original)">
              Upgrade
            </UButton>
            <UButton size="xs" :color="row.original.status === 'active' ? 'warning' : 'success'" variant="ghost"
              @click="toggleStatus(row.original)">
              {{ row.original.status === 'active' ? 'Cancel' : 'Activate' }}
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isAssignModalOpen" title="Assign Subscription">
      <template #body>
        <SubscriptionForm @success="handleSuccess" @cancel="isAssignModalOpen = false" />
      </template>
    </UModal>

    <UModal v-model:open="isUpgradeModalOpen" title="Upgrade Subscription">
      <template #body>
        <UpgradeSubscriptionModal v-if="selectedSubscription" :subscription="selectedSubscription"
          @success="handleUpgradeSuccess" @cancel="isUpgradeModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>