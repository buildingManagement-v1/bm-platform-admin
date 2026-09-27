<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PageInfo, PaginatedResponse, SubscriptionRequest, SubscriptionRequestStatus } from '~/types'
import { errorMessage } from '~/types/api'

const { api } = useApi()
const toast = useToast()

const requests = ref<SubscriptionRequest[]>([])
const pageInfo = ref<PageInfo | null>(null)
const loading = ref(false)
const status = ref<SubscriptionRequestStatus | 'all'>('pending')
const search = ref('')
const page = ref(1)
const limit = 20

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
]
const statusColor: Record<SubscriptionRequestStatus, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'neutral',
}

const columns: TableColumn<SubscriptionRequest>[] = [
  { accessorKey: 'createdAt', header: 'Submitted' },
  { accessorKey: 'owner', header: 'Owner' },
  { accessorKey: 'plan', header: 'Plan' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'paymentReference', header: 'Reference' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: '' },
]

const formatDate = (d: string) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String((page.value - 1) * limit) })
    if (status.value !== 'all') params.set('status', status.value)
    if (search.value.trim()) params.set('q', search.value.trim())
    const res = await api<PaginatedResponse<SubscriptionRequest[]>>(`/v1/platform/subscription-requests?${params}`)
    requests.value = res.data
    pageInfo.value = res.meta.page_info
  } catch (error) {
    toast.add({ title: 'Failed to load requests', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

// Receipt preview
const receiptOpen = ref(false)
const receiptUrl = ref<string | null>(null)
const receiptIsPdf = ref(false)
const reviewing = ref<SubscriptionRequest | null>(null)

async function openReceipt(r: SubscriptionRequest) {
  try {
    const blob = await api<Blob>(`/v1/platform/subscription-requests/${r.id}/receipt`, { responseType: 'blob' })
    if (receiptUrl.value) URL.revokeObjectURL(receiptUrl.value)
    receiptIsPdf.value = blob.type === 'application/pdf'
    receiptUrl.value = URL.createObjectURL(blob)
    reviewing.value = r
    receiptOpen.value = true
  } catch (error) {
    toast.add({ title: 'Could not load receipt', description: errorMessage(error), color: 'error' })
  }
}

const acting = ref(false)
async function approve(r: SubscriptionRequest) {
  if (!confirm(`Confirm you received ETB ${Number(r.amount).toLocaleString()} from ${r.owner?.name ?? 'this owner'} and activate ${r.plan.name}?`)) return
  acting.value = true
  try {
    await api(`/v1/platform/subscription-requests/${r.id}/approve`, { method: 'POST' })
    toast.add({ title: 'Plan activated', description: 'The owner was notified and emailed an invoice.', color: 'success' })
    receiptOpen.value = false
    load()
  } catch (error) {
    toast.add({ title: 'Could not approve', description: errorMessage(error), color: 'error' })
  } finally {
    acting.value = false
  }
}

const rejectOpen = ref(false)
const rejectReason = ref('')
function openReject(r: SubscriptionRequest) {
  reviewing.value = r
  rejectReason.value = ''
  rejectOpen.value = true
}
async function reject() {
  if (!reviewing.value || !rejectReason.value.trim()) return
  acting.value = true
  try {
    await api(`/v1/platform/subscription-requests/${reviewing.value.id}/reject`, {
      method: 'POST',
      body: { reason: rejectReason.value.trim() },
    })
    toast.add({ title: 'Request rejected', description: 'The owner was notified with your reason.', color: 'success' })
    rejectOpen.value = false
    receiptOpen.value = false
    load()
  } catch (error) {
    toast.add({ title: 'Could not reject', description: errorMessage(error), color: 'error' })
  } finally {
    acting.value = false
  }
}

watch(status, () => { page.value = 1; load() })
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 350)
})
onMounted(load)
onBeforeUnmount(() => { if (receiptUrl.value) URL.revokeObjectURL(receiptUrl.value) })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Plan requests</h1>
      <p class="text-gray-600 mt-1">
        Owners pay by bank transfer and upload the receipt. Check the payment arrived, then approve to activate the plan.
      </p>
    </div>

    <UCard>
      <div class="flex flex-wrap gap-3 mb-4">
        <USelectMenu v-model="status" :items="statusOptions" value-key="value" class="w-44" />
        <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Search owner name or email" class="w-72" />
      </div>

      <UTable :data="requests" :columns="columns" :loading="loading">
        <template #createdAt-cell="{ row }">{{ formatDate(row.original.createdAt) }}</template>
        <template #owner-cell="{ row }">
          <div v-if="row.original.owner">
            <p class="font-medium">{{ row.original.owner.name }}</p>
            <p class="text-xs text-gray-500">{{ row.original.owner.email }}</p>
          </div>
          <span v-else class="text-gray-400">Deleted owner</span>
        </template>
        <template #plan-cell="{ row }">{{ row.original.plan.name }}</template>
        <template #amount-cell="{ row }">
          <span class="font-semibold">ETB {{ Number(row.original.amount).toLocaleString() }}</span>
        </template>
        <template #paymentReference-cell="{ row }">
          <span class="font-mono text-xs">{{ row.original.paymentReference ?? '—' }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="statusColor[row.original.status]" variant="subtle" class="capitalize">
            {{ row.original.status }}
          </UBadge>
          <p v-if="row.original.rejectionReason" class="text-xs text-red-600 mt-1 max-w-48">
            {{ row.original.rejectionReason }}
          </p>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton size="xs" variant="ghost" icon="i-heroicons-document-magnifying-glass" @click="openReceipt(row.original)">
              Receipt
            </UButton>
            <template v-if="row.original.status === 'pending'">
              <UButton size="xs" color="success" variant="soft" :loading="acting" @click="approve(row.original)">Approve</UButton>
              <UButton size="xs" color="error" variant="ghost" @click="openReject(row.original)">Reject</UButton>
            </template>
          </div>
        </template>
        <template #empty>
          <p class="text-center py-8 text-gray-500">No requests</p>
        </template>
      </UTable>

      <div v-if="pageInfo && pageInfo.total_pages > 1" class="flex justify-end mt-4">
        <UPagination v-model:page="page" :total="pageInfo.total_count" :items-per-page="limit" @update:page="load" />
      </div>
    </UCard>

    <UModal v-model:open="receiptOpen" :title="reviewing ? `${reviewing.owner?.name ?? 'Owner'} — ${reviewing.plan.name}` : 'Receipt'"
      :ui="{ content: 'max-w-3xl' }">
      <template #body>
        <div v-if="reviewing" class="space-y-4">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div><p class="text-gray-500">Amount</p><p class="font-semibold">ETB {{ Number(reviewing.amount).toLocaleString() }}</p></div>
            <div><p class="text-gray-500">Reference</p><p class="font-mono">{{ reviewing.paymentReference ?? '—' }}</p></div>
            <div><p class="text-gray-500">Notes</p><p>{{ reviewing.notes ?? '—' }}</p></div>
          </div>
          <template v-if="receiptUrl">
            <iframe v-if="receiptIsPdf" :src="receiptUrl" title="Receipt" class="w-full h-[60vh] rounded border" />
            <img v-else :src="receiptUrl" alt="Receipt" class="max-h-[60vh] mx-auto object-contain">
          </template>
        </div>
      </template>
      <template v-if="reviewing?.status === 'pending'" #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="error" variant="ghost" @click="openReject(reviewing!)">Reject</UButton>
          <UButton color="success" :loading="acting" @click="approve(reviewing!)">Approve and activate</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="rejectOpen" title="Reject plan request">
      <template #body>
        <UFormField label="Reason (sent to the owner)" required>
          <UTextarea v-model="rejectReason" :rows="3" placeholder="e.g. We couldn't find this transfer in our statement"
            :ui="{ root: 'w-full' }" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="() => { rejectOpen = false }">Cancel</UButton>
          <UButton color="error" :disabled="!rejectReason.trim()" :loading="acting" @click="reject">Reject</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
