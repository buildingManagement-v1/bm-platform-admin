<script setup lang="ts">
import type { ApiResponse, PlatformSetting } from '~/types'
import { errorMessage } from '~/types/api'

const { api } = useApi()
const toast = useToast()

const settings = ref<PlatformSetting[]>([])
const values = reactive<Record<string, string>>({})
const loading = ref(false)
const saving = ref(false)

const changed = computed(() =>
  settings.value.filter(s => s.canEdit && (values[s.key] ?? '') !== s.value)
)

function apply(list: PlatformSetting[]) {
  settings.value = list
  for (const s of list) values[s.key] = s.value
}

async function load() {
  loading.value = true
  try {
    apply((await api<ApiResponse<PlatformSetting[]>>('/v1/platform/settings')).data)
  } catch (error) {
    toast.add({ title: 'Failed to load settings', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!changed.value.length) return
  saving.value = true
  try {
    const res = await api<ApiResponse<PlatformSetting[]>>('/v1/platform/settings', {
      method: 'PATCH',
      body: { values: Object.fromEntries(changed.value.map(s => [s.key, values[s.key] ?? ''])) },
    })
    apply(res.data)
    toast.add({ title: 'Settings saved', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Could not save', description: errorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-600 mt-1">Platform-wide values shown to owners</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <UCard v-else>
      <div class="space-y-6">
        <UFormField v-for="s in settings" :key="s.key" :label="s.label" :description="s.description"
          :hint="s.isDefault ? 'Using default' : undefined">
          <UTextarea v-if="s.maxLength > 200" v-model="values[s.key]" :rows="4" :maxlength="s.maxLength"
            :disabled="!s.canEdit" class="w-full" />
          <UInput v-else v-model="values[s.key]" :maxlength="s.maxLength" :disabled="!s.canEdit" class="w-full" />
        </UFormField>
      </div>
      <div class="flex justify-end mt-6">
        <UButton color="primary" :disabled="!changed.length" :loading="saving" @click="save">
          Save changes
        </UButton>
      </div>
    </UCard>
  </div>
</template>
