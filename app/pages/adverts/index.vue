<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AdvertAudience, ApiResponse, LoginAdvert } from '~/types'
import { errorMessage } from '~/types/api'

const { api } = useApi()
const toast = useToast()
const config = useRuntimeConfig()

const adverts = ref<LoginAdvert[]>([])
const loading = ref(false)
const saving = ref(false)
const modalOpen = ref(false)
const editing = ref<LoginAdvert | null>(null)
const image = ref<File | null>(null)

const state = reactive({
  title: '',
  description: '',
  linkUrl: '',
  audience: 'all' as AdvertAudience,
  isActive: true,
  startsAt: '',
  endsAt: '',
  sortOrder: 0,
})

const audienceOptions = [
  { value: 'all', label: 'Everyone' },
  { value: 'owner', label: 'Owners' },
  { value: 'manager', label: 'Managers' },
  { value: 'tenant', label: 'Tenants' },
]

const columns: TableColumn<LoginAdvert>[] = [
  { accessorKey: 'imageUrl', header: '' },
  { accessorKey: 'title', header: 'Advert' },
  { accessorKey: 'audience', header: 'Shown to' },
  { accessorKey: 'isActive', header: 'Status' },
  { accessorKey: 'startsAt', header: 'Window' },
  { accessorKey: 'sortOrder', header: 'Order' },
  { id: 'actions', header: '' },
]

const imageSrc = (a: LoginAdvert) => `${config.public.apiUrl}${a.imageUrl}?v=${encodeURIComponent(a.updatedAt)}`
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null)
const isLive = (a: LoginAdvert) => {
  const now = Date.now()
  return a.isActive && (!a.startsAt || Date.parse(a.startsAt) <= now) && (!a.endsAt || Date.parse(a.endsAt) >= now)
}

async function load() {
  loading.value = true
  try {
    adverts.value = (await api<ApiResponse<LoginAdvert[]>>('/v1/platform/login-adverts')).data
  } catch (error) {
    toast.add({ title: 'Failed to load adverts', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  image.value = null
  Object.assign(state, { title: '', description: '', linkUrl: '', audience: 'all', isActive: true, startsAt: '', endsAt: '', sortOrder: 0 })
  modalOpen.value = true
}

function openEdit(a: LoginAdvert) {
  editing.value = a
  image.value = null
  Object.assign(state, {
    title: a.title,
    description: a.description ?? '',
    linkUrl: a.linkUrl ?? '',
    audience: a.audience,
    isActive: a.isActive,
    startsAt: a.startsAt?.slice(0, 10) ?? '',
    endsAt: a.endsAt?.slice(0, 10) ?? '',
    sortOrder: a.sortOrder,
  })
  modalOpen.value = true
}

function onImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (file && !file.type.startsWith('image/')) {
    toast.add({ title: 'Choose an image (JPG, PNG, WEBP or GIF)', color: 'error' })
    image.value = null
    return
  }
  image.value = file
}

async function save() {
  if (!state.title.trim()) {
    toast.add({ title: 'Title is required', color: 'warning' })
    return
  }
  if (!editing.value && !image.value) {
    toast.add({ title: 'Upload a banner image', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const form = new FormData()
    form.append('title', state.title.trim())
    form.append('description', state.description.trim())
    form.append('linkUrl', state.linkUrl.trim())
    form.append('audience', state.audience)
    form.append('isActive', String(state.isActive))
    form.append('startsAt', state.startsAt)
    form.append('endsAt', state.endsAt)
    form.append('sortOrder', String(state.sortOrder ?? 0))
    if (image.value) form.append('image', image.value)
    await api(editing.value ? `/v1/platform/login-adverts/${editing.value.id}` : '/v1/platform/login-adverts', {
      method: editing.value ? 'PATCH' : 'POST',
      body: form,
    })
    toast.add({ title: editing.value ? 'Advert updated' : 'Advert created', color: 'success' })
    modalOpen.value = false
    load()
  } catch (error) {
    toast.add({ title: 'Could not save advert', description: errorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function toggle(a: LoginAdvert) {
  try {
    const form = new FormData()
    form.append('isActive', String(!a.isActive))
    await api(`/v1/platform/login-adverts/${a.id}`, { method: 'PATCH', body: form })
    load()
  } catch (error) {
    toast.add({ title: 'Could not update advert', description: errorMessage(error), color: 'error' })
  }
}

async function remove(a: LoginAdvert) {
  if (!confirm(`Delete "${a.title}"?`)) return
  try {
    await api(`/v1/platform/login-adverts/${a.id}`, { method: 'DELETE' })
    toast.add({ title: 'Advert deleted', color: 'success' })
    load()
  } catch (error) {
    toast.add({ title: 'Could not delete advert', description: errorMessage(error), color: 'error' })
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Login adverts</h1>
        <p class="text-gray-600 mt-1">Banners shown on the web and mobile sign-in screens</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openCreate">New advert</UButton>
    </div>

    <UCard>
      <UTable :data="adverts" :columns="columns" :loading="loading">
        <template #imageUrl-cell="{ row }">
          <img :src="imageSrc(row.original)" :alt="row.original.title" class="w-24 h-14 object-cover rounded">
        </template>
        <template #title-cell="{ row }">
          <p class="font-medium">{{ row.original.title }}</p>
          <p v-if="row.original.description" class="text-xs text-gray-500 max-w-xs truncate">{{ row.original.description }}</p>
          <a v-if="row.original.linkUrl" :href="row.original.linkUrl" target="_blank" rel="noopener noreferrer"
            class="text-xs text-primary-600">{{ row.original.linkUrl }}</a>
        </template>
        <template #audience-cell="{ row }">
          {{ audienceOptions.find(o => o.value === row.original.audience)?.label }}
        </template>
        <template #isActive-cell="{ row }">
          <UBadge :color="isLive(row.original) ? 'success' : row.original.isActive ? 'warning' : 'neutral'" variant="subtle">
            {{ isLive(row.original) ? 'Live' : row.original.isActive ? 'Scheduled / ended' : 'Off' }}
          </UBadge>
        </template>
        <template #startsAt-cell="{ row }">
          <span class="text-sm">{{ day(row.original.startsAt) ?? 'Now' }} → {{ day(row.original.endsAt) ?? 'No end' }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton size="xs" variant="ghost" @click="toggle(row.original)">{{ row.original.isActive ? 'Turn off' : 'Turn on' }}</UButton>
            <UButton size="xs" color="neutral" variant="ghost" @click="openEdit(row.original)">Edit</UButton>
            <UButton size="xs" color="error" variant="ghost" @click="remove(row.original)">Delete</UButton>
          </div>
        </template>
        <template #empty>
          <p class="text-center py-8 text-gray-500">No adverts yet</p>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="modalOpen" :title="editing ? 'Edit advert' : 'New advert'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Title" required>
            <UInput v-model="state.title" maxlength="120" :ui="{ root: 'w-full' }" />
          </UFormField>
          <UFormField label="Description" hint="Optional">
            <UInput v-model="state.description" maxlength="300" :ui="{ root: 'w-full' }" />
          </UFormField>
          <UFormField label="Link" hint="Optional, https://…">
            <UInput v-model="state.linkUrl" type="url" :ui="{ root: 'w-full' }" />
          </UFormField>
          <UFormField :label="editing ? 'Replace image' : 'Banner image'" :required="!editing" hint="Max 3 MB">
            <UInput type="file" accept="image/*" :ui="{ root: 'w-full' }" @change="onImage" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Shown to">
              <USelectMenu v-model="state.audience" :items="audienceOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Order" hint="Lower first">
              <UInput v-model.number="state.sortOrder" type="number" min="0" :ui="{ root: 'w-full' }" />
            </UFormField>
            <UFormField label="Starts" hint="Optional">
              <UInput v-model="state.startsAt" type="date" :ui="{ root: 'w-full' }" />
            </UFormField>
            <UFormField label="Ends" hint="Optional">
              <UInput v-model="state.endsAt" type="date" :min="state.startsAt || undefined" :ui="{ root: 'w-full' }" />
            </UFormField>
          </div>
          <UCheckbox v-model="state.isActive" label="Active" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="() => { modalOpen = false }">Cancel</UButton>
          <UButton color="primary" :loading="saving" @click="save">{{ editing ? 'Save' : 'Create' }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
