<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { planSchema, type PlanSchema } from '~/schemas/plans'
import type { Plan } from '~/types/plan';

const props = defineProps<{
  plan?: Plan
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

const state = reactive({
  name: props.plan?.name || '',
  buildingPrice: props.plan?.buildingPrice || 0,
  managerPrice: props.plan?.managerPrice || 0,
  features: {
    maxBuildings: props.plan?.features?.maxBuildings || undefined,
    maxManagers: props.plan?.features?.maxManagers || undefined,
    maxUnits: props.plan?.features?.maxUnits || undefined,
  },
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<PlanSchema>) {
  loading.value = true
  try {
    const url = props.mode === 'create'
      ? '/v1/platform/plans'
      : `/v1/platform/plans/${props.plan?.id}`

    await api(url, {
      method: props.mode === 'create' ? 'POST' : 'PATCH',
      body: event.data,
    })

    toast.add({
      title: `Plan ${props.mode === 'create' ? 'created' : 'updated'} successfully`,
      color: 'success'
    })
    emit('success')
  } catch (error) {
    toast.add({
      title: `Failed to ${props.mode} plan`,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :schema="planSchema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField label="Plan Name" name="name" required>
      <UInput v-model="state.name" placeholder="e.g., Basic, Pro, Enterprise" size="lg" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Building Price (Yearly)" name="buildingPrice" required>
        <UInput v-model.number="state.buildingPrice" type="number" placeholder="0" size="lg" :ui="{ root: 'w-full' }">
          <template #leading>
            <span class="text-gray-500">$</span>
          </template>
        </UInput>
      </UFormField>

      <UFormField label="Manager Price (Yearly)" name="managerPrice" required>
        <UInput v-model.number="state.managerPrice" type="number" placeholder="0" size="lg" :ui="{ root: 'w-full' }">
          <template #leading>
            <span class="text-gray-500">$</span>
          </template>
        </UInput>
      </UFormField>
    </div>

    <div class="border-t pt-4 border-gray-300">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Feature Limits</h3>

      <div class="grid grid-cols-3 gap-4">
        <UFormField label="Max Buildings" name="features.maxBuildings">
          <UInput v-model.number="state.features.maxBuildings" type="number" placeholder="Unlimited" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Max Managers" name="features.maxManagers">
          <UInput v-model.number="state.features.maxManagers" type="number" placeholder="Unlimited" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Max Units" name="features.maxUnits">
          <UInput v-model.number="state.features.maxUnits" type="number" placeholder="Unlimited" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>
      </div>

      <p class="text-xs text-gray-500 mt-2">Leave empty for unlimited</p>
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <UButton color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        {{ mode === 'create' ? 'Create Plan' : 'Update Plan' }}
      </UButton>
    </div>
  </UForm>
</template>