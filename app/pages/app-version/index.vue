<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { appVersionSchema, type AppVersionSchema } from '~/schemas/app-version'
import type { AppVersionConfig } from '~/types/app-version'
import type { ApiResponse } from '~/types/api'

const { api } = useApi()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)

const state = reactive({
  androidMinimumVersion: '',
  androidLatestVersion: '',
  iosMinimumVersion: '',
  iosLatestVersion: '',
  versionDescription: '',
  lastForceUpdateVersion: '',
  isOptional: true,
})

function applyConfig(config: AppVersionConfig) {
  state.androidMinimumVersion = config.androidMinimumVersion
  state.androidLatestVersion = config.androidLatestVersion
  state.iosMinimumVersion = config.iosMinimumVersion
  state.iosLatestVersion = config.iosLatestVersion
  state.versionDescription = config.versionDescription
  state.lastForceUpdateVersion = config.lastForceUpdateVersion
  state.isOptional = config.isOptional
}

async function fetchConfig() {
  loading.value = true
  try {
    const response = await api<ApiResponse<AppVersionConfig>>('/v1/platform/app-version')
    applyConfig(response.data)
  } catch (error) {
    toast.add({ title: 'Failed to fetch app version config', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<AppVersionSchema>) {
  saving.value = true
  try {
    const response = await api<ApiResponse<AppVersionConfig>>('/v1/platform/app-version', {
      method: 'PATCH',
      body: event.data,
    })
    applyConfig(response.data)
    toast.add({ title: 'App version config updated successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed to update app version config', color: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">App Version</h1>
      <p class="text-gray-600 mt-1">Control the minimum and latest mobile app versions used to prompt or force updates</p>
    </div>

    <UCard>
      <UForm :schema="appVersionSchema" :state="state" class="space-y-4" :disabled="loading" @submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-4 rounded-lg border border-gray-200 p-4">
            <p class="text-sm font-medium text-gray-700">Android</p>

            <UFormField label="Minimum version" name="androidMinimumVersion" required>
              <UInput v-model="state.androidMinimumVersion" placeholder="1.0.0" size="lg" :ui="{ root: 'w-full' }" />
            </UFormField>

            <UFormField label="Latest version" name="androidLatestVersion" required>
              <UInput v-model="state.androidLatestVersion" placeholder="1.4.0" size="lg" :ui="{ root: 'w-full' }" />
            </UFormField>
          </div>

          <div class="space-y-4 rounded-lg border border-gray-200 p-4">
            <p class="text-sm font-medium text-gray-700">iOS</p>

            <UFormField label="Minimum version" name="iosMinimumVersion" required>
              <UInput v-model="state.iosMinimumVersion" placeholder="1.0.0" size="lg" :ui="{ root: 'w-full' }" />
            </UFormField>

            <UFormField label="Latest version" name="iosLatestVersion" required>
              <UInput v-model="state.iosLatestVersion" placeholder="1.4.0" size="lg" :ui="{ root: 'w-full' }" />
            </UFormField>
          </div>
        </div>

        <UFormField label="Last force-update version" name="lastForceUpdateVersion" required
          hint="Last version that required a mandatory update">
          <UInput v-model="state.lastForceUpdateVersion" placeholder="1.2.0" size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Version description" name="versionDescription" hint="Changelog text shown in the update prompt">
          <UTextarea v-model="state.versionDescription" :rows="3" placeholder="Bug fixes and performance improvements"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField name="isOptional">
          <UCheckbox v-model="state.isOptional" label="Update prompt is dismissible"
            description="If unchecked, users below the minimum version will be blocked until they update" />
        </UFormField>

        <div class="flex justify-end pt-4">
          <UButton type="submit" color="primary" :loading="saving">
            Save changes
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>
