<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { ApiResponse, PageInfo, PaginatedResponse, Subscription, SubscriptionStatus } from '~/types'
import { errorMessage } from '~/types/api'
import { extendSubscriptionSchema, type ExtendSubscriptionSchema } from '~/schemas/subscriptions'

const { api } = useApi()
const toast = useToast()

const subscriptions = ref<Subscription[]>([])
const pageInfo = ref<PageInfo | null>(null)
const loading = ref(false)
const status = ref<SubscriptionStatus | 'all'>('active')
const search = ref('')
const page = ref(1)
const limit = 20

const isAssignModalOpen = ref(false)
const isUpgradeModalOpen = ref(false)
const isExtendOpen = ref(false)
const selected = ref<Subscription | null>(null)
const extendState = reactive<ExtendSubscriptionSchema>({ months: 1, reason: '' })
const saving = ref(false)

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
]

const columns: TableColumn<Subscription>[] = [
  { accessorKey: 'user', header: 'Owner' },
  { accessorKey: 'plan', header: 'Plan' },
  { accessorKey: 'totalAmount', header: 'Yearly amount' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'billingCycleEnd', header: 'Cycle' },
  { id: 'actions', header: '' },
]

const day = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const isEnded = (s: Subscription) => new Date(s.billingCycleEnd).getTime() < Date.now()
const isTrial = (s: Subscription) => Number(s.plan?.price ?? 0) === 0

async function fetchSubscriptions() {
  loading.value = true
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String((page.value - 1) * limit) })
    if (status.value !== 'all') params.set('status', status.value)
    if (search.value.trim()) params.set('q', search.value.trim())
    const res = await api<PaginatedResponse<Subscription[]>>(`/v1/platform/subscriptions/all?${params}`)
    subscriptions.value = res.data
    pageInfo.value = res.meta.page_info
  } catch (error) {
    toast.add({ title: 'Failed to fetch subscriptions', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

async function setStatus(s: Subscription, next: 'active' | 'cancelled') {
  const question = next === 'cancelled'
    ? `Cancel ${s.user?.name ?? 'this owner'}'s ${s.plan?.name} plan? Their account becomes read-only.`
    : `Reactivate ${s.user?.name ?? 'this owner'}'s ${s.plan?.name} plan?`
  if (!confirm(question)) return
  try {
    const res = await api<ApiResponse<unknown>>(`/v1/platform/subscriptions/${s.id}`, {
      method: 'PATCH',
      body: { status: next },
    })
    toast.add({ title: res.message ?? 'Subscription updated', color: 'success' })
    fetchSubscriptions()
  } catch (error) {
    toast.add({ title: 'Failed to update status', description: errorMessage(error), color: 'error' })
  }
}

function openExtend(s: Subscription) {
  selected.value = s
  Object.assign(extendState, { months: 1, reason: '' })
  isExtendOpen.value = true
}

async function onExtend(event: FormSubmitEvent<ExtendSubscriptionSchema>) {
  if (!selected.value) return
  saving.value = true
  try {
    const res = await api<ApiResponse<unknown>>(`/v1/platform/subscriptions/${selected.value.id}/extend`, {
      method: 'POST',
      body: event.data,
    })
    toast.add({ title: res.message ?? 'Extended', color: 'success' })
    isExtendOpen.value = false
    fetchSubscriptions()
  } catch (error) {
    toast.add({ title: 'Failed to extend', description: errorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function downloadInvoice(subscriptionId: string) {
  try {
    const blob = await api<Blob>(`/v1/platform/subscriptions/${subscriptionId}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `subscription-invoice-${subscriptionId}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    toast.add({ title: 'Failed to download invoice', description: errorMessage(error), color: 'error' })
  }
}

function onChanged() {
  isAssignModalOpen.value = false
  isUpgradeModalOpen.value = false
  selected.value = null
  fetchSubscriptions()
}

watch(status, () => { page.value = 1; fetchSubscriptions() })
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => { page.value = 1; fetchSubscriptions() }, 350)
})
onMounted(fetchSubscriptions)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p class="text-gray-600 mt-1">
          Owners buy plans through Plan Requests. Use this page for offline payments, custom plans and corrections.
        </p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="() => { isAssignModalOpen = true }">
        Assign plan
      </UButton>
    </div>

    <UCard>
      <div class="flex flex-wrap gap-3 mb-4">
        <USelectMenu v-model="status" :items="statusOptions" value-key="value" class="w-40" />
        <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Owner name or email" class="w-72" />
      </div>

      <UTable :data="subscriptions" :columns="columns" :loading="loading">
        <template #user-cell="{ row }">
          <div v-if="row.original.user">
            <p class="font-medium">{{ row.original.user.name }}</p>
            <p class="text-xs text-gray-500">{{ row.original.user.email }}</p>
          </div>
          <span v-else class="text-gray-400">Purged owner</span>
        </template>
        <template #plan-cell="{ row }">
          {{ row.original.plan?.name ?? 'N/A' }}
          <UBadge v-if="row.original.plan?.type === 'custom'" size="xs" variant="subtle" class="ml-1">Custom</UBadge>
        </template>
        <template #totalAmount-cell="{ row }">
          {{ Number(row.original.totalAmount) > 0 ? `ETB ${Number(row.original.totalAmount).toLocaleString()}` : 'Free trial' }}
        </template>
        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'active' && !isEnded(row.original) ? 'success' : row.original.status === 'cancelled' ? 'error' : 'warning'"
            variant="subtle" class="capitalize">
            {{ row.original.status === 'active' && isEnded(row.original) ? 'ended' : row.original.status }}
          </UBadge>
        </template>
        <template #billingCycleEnd-cell="{ row }">
          <span class="text-sm">{{ day(row.original.billingCycleStart) }} – {{ day(row.original.billingCycleEnd) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton v-if="!isTrial(row.original)" size="xs" color="neutral" variant="ghost" icon="i-heroicons-arrow-down-tray"
              title="Invoice" @click="downloadInvoice(row.original.id)" />
            <UButton v-if="row.original.status === 'active' && !isEnded(row.original)" size="xs" variant="ghost"
              @click="() => { selected = row.original; isUpgradeModalOpen = true }">
              Change plan
            </UButton>
            <UButton v-if="row.original.status !== 'cancelled'" size="xs" variant="ghost" @click="openExtend(row.original)">
              Extend
            </UButton>
            <UButton v-if="row.original.status === 'active'" size="xs" color="error" variant="ghost"
              @click="setStatus(row.original, 'cancelled')">
              Cancel
            </UButton>
            <UButton v-else-if="row.original.status === 'cancelled' && !isEnded(row.original)" size="xs" color="success"
              variant="ghost" @click="setStatus(row.original, 'active')">
              Reactivate
            </UButton>
          </div>
        </template>
        <template #empty>
          <p class="text-center py-8 text-gray-500">No subscriptions</p>
        </template>
      </UTable>

      <div v-if="pageInfo && pageInfo.total_pages > 1" class="flex justify-end mt-4">
        <UPagination v-model:page="page" :total="pageInfo.total_count" :items-per-page="limit" @update:page="fetchSubscriptions" />
      </div>
    </UCard>

    <UModal v-model:open="isAssignModalOpen" title="Assign plan">
      <template #body>
        <SubscriptionForm @success="onChanged" @cancel="() => { isAssignModalOpen = false }" />
      </template>
    </UModal>

    <UModal v-model:open="isUpgradeModalOpen" title="Change plan">
      <template #body>
        <UpgradeSubscriptionModal v-if="selected" :subscription="selected" @success="onChanged"
          @cancel="() => { isUpgradeModalOpen = false }" />
      </template>
    </UModal>

    <UModal v-model:open="isExtendOpen" :title="`Extend ${selected?.user?.name ?? ''}'s plan`">
      <template #body>
        <UForm :schema="extendSubscriptionSchema" :state="extendState" class="space-y-4" @submit="onExtend">
          <p v-if="selected" class="text-sm text-gray-600">
            Currently ends {{ day(selected.billingCycleEnd) }}. An ended plan is extended from today.
          </p>
          <UFormField label="Months" name="months" required>
            <UInput v-model.number="extendState.months" type="number" min="1" max="36" class="w-full" />
          </UFormField>
          <UFormField label="Reason" name="reason" required>
            <UInput v-model="extendState.reason" placeholder="e.g. Paid renewal in cash, receipt #123" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="() => { isExtendOpen = false }">Cancel</UButton>
            <UButton type="submit" color="primary" :loading="saving">Extend</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
