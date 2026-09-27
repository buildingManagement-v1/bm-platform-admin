<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ApiResponse, Broadcast, BroadcastAudience, PageInfo, PaginatedResponse } from '~/types'
import { errorMessage } from '~/types/api'

const { api } = useApi()
const toast = useToast()

const history = ref<Broadcast[]>([])
const pageInfo = ref<PageInfo | null>(null)
const page = ref(1)
const limit = 20
const loading = ref(false)
const sending = ref(false)
const reach = ref<number | null>(null)

const form = reactive({ title: '', message: '', audience: 'owners' as BroadcastAudience, link: '' })

const audienceOptions = [
  { value: 'owners', label: 'Building owners' },
  { value: 'managers', label: 'Managers' },
  { value: 'tenants', label: 'Tenants with an active lease' },
  { value: 'everyone', label: 'Everyone' },
]
const audienceLabel = (a: BroadcastAudience) => audienceOptions.find(o => o.value === a)?.label ?? a

const columns: TableColumn<Broadcast>[] = [
  { accessorKey: 'sentAt', header: 'Sent' },
  { accessorKey: 'title', header: 'Message' },
  { accessorKey: 'audience', header: 'Audience' },
  { accessorKey: 'recipients', header: 'Recipients' },
  { accessorKey: 'sentBy', header: 'By' },
]

async function loadHistory() {
  loading.value = true
  try {
    const res = await api<PaginatedResponse<Broadcast[]>>(`/v1/platform/broadcasts?limit=${limit}&offset=${(page.value - 1) * limit}`)
    history.value = res.data
    pageInfo.value = res.meta.page_info
  } catch (error) {
    toast.add({ title: 'Failed to load broadcasts', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

async function loadReach() {
  reach.value = null
  try {
    reach.value = (await api<ApiResponse<{ recipients: number }>>(`/v1/platform/broadcasts/preview?audience=${form.audience}`)).data.recipients
  } catch {
    reach.value = null
  }
}

async function send() {
  if (!form.title.trim() || !form.message.trim()) {
    toast.add({ title: 'Add a title and a message', color: 'warning' })
    return
  }
  if (!confirm(`Send "${form.title}" to ${reach.value ?? 'all'} ${audienceLabel(form.audience).toLowerCase()}?`)) return
  sending.value = true
  try {
    const res = await api<ApiResponse<{ recipients: number }>>('/v1/platform/broadcasts', {
      method: 'POST',
      body: { ...form, link: form.link.trim() || undefined },
    })
    toast.add({ title: `Sent to ${res.data.recipients} account(s)`, color: 'success' })
    Object.assign(form, { title: '', message: '', link: '' })
    page.value = 1
    loadHistory()
  } catch (error) {
    toast.add({ title: 'Could not send', description: errorMessage(error), color: 'error' })
  } finally {
    sending.value = false
  }
}

watch(() => form.audience, loadReach)
onMounted(() => {
  loadHistory()
  loadReach()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Broadcasts</h1>
      <p class="text-gray-600 mt-1">Send an in-app notice (and push, on mobile) to everyone in a group</p>
    </div>

    <UCard>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Audience" :hint="reach !== null ? `${reach} recipient(s)` : undefined">
            <USelectMenu v-model="form.audience" :items="audienceOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Link" hint="Optional in-app path, e.g. /dashboard/subscriptions">
            <UInput v-model="form.link" placeholder="/dashboard" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Title" required>
          <UInput v-model="form.title" maxlength="120" class="w-full" />
        </UFormField>
        <UFormField label="Message" required>
          <UTextarea v-model="form.message" :rows="3" maxlength="1000" class="w-full" />
        </UFormField>
        <div class="flex justify-end">
          <UButton color="primary" icon="i-heroicons-paper-airplane" :loading="sending" @click="send">Send</UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">Sent</h2></template>
      <UTable :data="history" :columns="columns" :loading="loading">
        <template #sentAt-cell="{ row }">{{ new Date(row.original.sentAt).toLocaleString('en-GB') }}</template>
        <template #title-cell="{ row }">
          <p class="font-medium">{{ row.original.title }}</p>
          <p class="text-xs text-gray-500 max-w-md truncate">{{ row.original.message }}</p>
        </template>
        <template #audience-cell="{ row }">{{ audienceLabel(row.original.audience) }}</template>
        <template #empty><p class="text-center py-6 text-gray-500">Nothing sent yet</p></template>
      </UTable>
      <div v-if="pageInfo && pageInfo.total_pages > 1" class="flex justify-end mt-4">
        <UPagination v-model:page="page" :total="pageInfo.total_count" :items-per-page="limit" @update:page="loadHistory" />
      </div>
    </UCard>
  </div>
</template>
