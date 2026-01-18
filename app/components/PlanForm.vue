<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { planSchema, type PlanSchema } from '~/schemas/plans'
import type { Plan } from '~/types/plan';
import { PlanType } from '~/types/plan';

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
  price: props.plan?.price || 0,
  type: props.plan?.type || PlanType.PUBLIC,
  features: {
    maxBuildings: props.plan?.features?.maxBuildings || 1,
    maxUnits: props.plan?.features?.maxUnits || 10,
    maxManagers: props.plan?.features?.maxManagers || 1,
    premiumFeatures: props.plan?.features?.premiumFeatures || [],
  },
})

const newFeature = ref('')

const typeOptions = [
  { label: 'Public (Visible to all users)', value: PlanType.PUBLIC },
  { label: 'Custom (Admin assigns only)', value: PlanType.CUSTOM },
]

function addFeature() {
  if (newFeature.value.trim()) {
    state.features.premiumFeatures.push(newFeature.value.trim())
    newFeature.value = ''
  }
}

function removeFeature(index: number) {
  state.features.premiumFeatures.splice(index, 1)
}

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
      <UFormField label="Price (Yearly)" name="price" required>
        <UInput v-model.number="state.price" type="number" placeholder="0" size="lg" :ui="{ root: 'w-full' }">
          <template #leading>
            <span class="text-gray-500">$</span>
          </template>
        </UInput>
      </UFormField>

      <UFormField label="Plan Type" name="type" required>
        <USelectMenu v-model="state.type" :items="typeOptions" placeholder="Select type" size="lg" class="w-full"
          value-key="value" />
      </UFormField>
    </div>

    <div class="border-t pt-4 border-gray-300">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Feature Limits</h3>

      <div class="grid grid-cols-3 gap-4">
        <UFormField label="Max Buildings" name="features.maxBuildings" required>
          <UInput v-model.number="state.features.maxBuildings" type="number" placeholder="1" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Max Units" name="features.maxUnits" required>
          <UInput v-model.number="state.features.maxUnits" type="number" placeholder="10" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Max Managers" name="features.maxManagers" required>
          <UInput v-model.number="state.features.maxManagers" type="number" placeholder="1" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>
      </div>
    </div>

    <div class="border-t pt-4 border-gray-300">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Premium Features</h3>

      <div class="flex gap-2 mb-3">
        <UInput v-model="newFeature" placeholder="e.g., hr_module, advanced_reports" size="lg" class="flex-1"
          @keydown.enter.prevent="addFeature" />
        <UButton color="primary" @click="addFeature">Add</UButton>
      </div>

      <div v-if="state.features.premiumFeatures.length > 0" class="space-y-2">
        <div v-for="(feature, index) in state.features.premiumFeatures" :key="index"
          class="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span class="text-sm">{{ feature }}</span>
          <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-x-mark" @click="removeFeature(index)" />
        </div>
      </div>
      <p v-else class="text-xs text-gray-500">No premium features added</p>
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