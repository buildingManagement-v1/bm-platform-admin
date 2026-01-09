<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { refDebounced } from '@vueuse/core'
import { subscriptionSchema, type SubscriptionSchema } from '~/schemas/subscriptions'
import type { Plan } from '~/types/plan'
import type { ApiResponse } from '~/types/api'

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

const loading = ref(false)
const searchingUsers = ref(false)
const plans = ref<Plan[]>([])
const userOptions = ref<{ label: string; value: string }[]>([])

const state = reactive({
  userId: '',
  planId: '',
  buildingCount: 1,
  managerCount: 0,
  billingCycleStart: new Date().toISOString().split('T')[0],
})

// User search with debounce
const userSearchTerm = ref('')
const userSearchDebounced = refDebounced(userSearchTerm, 300)

// Watch debounced search term
watch(userSearchDebounced, async (newValue) => {
  if (!newValue || newValue.length < 2) {
    userOptions.value = []
    return
  }

  searchingUsers.value = true
  try {
    const response = await api<ApiResponse<any[]>>(`/v1/platform/users?search=${encodeURIComponent(newValue)}`)
    userOptions.value = response.data.map(u => ({
      label: `${u.name} (${u.email})`,
      value: u.id
    }))
  } catch (error) {
    toast.add({ title: 'Failed to search users', color: 'error' })
    userOptions.value = []
  } finally {
    searchingUsers.value = false
  }
})

const selectedPlan = computed(() =>
  plans.value.find(p => p.id === state.planId)
)

const totalAmount = computed(() => {
  if (!selectedPlan.value) return 0
  const buildingCost = state.buildingCount * Number(selectedPlan.value.buildingPrice)
  const managerCost = state.managerCount * Number(selectedPlan.value.managerPrice)
  return buildingCost + managerCost
})

const planOptions = computed(() =>
  plans.value.map(p => ({
    label: p.name,
    value: p.id
  }))
)

async function fetchPlans() {
  try {
    const response = await api<ApiResponse<Plan[]>>('/v1/platform/plans')
    plans.value = response.data.filter(p => p.status === 'active')
  } catch (error) {
    toast.add({ title: 'Failed to fetch plans', color: 'error' })
  }
}

async function onSubmit(event: FormSubmitEvent<SubscriptionSchema>) {
  loading.value = true
  try {
    await api('/v1/platform/subscriptions', {
      method: 'POST',
      body: event.data,
    })
    toast.add({ title: 'Subscription assigned successfully', color: 'success' })
    emit('success')
  } catch (error: any) {
    toast.add({
      title: 'Failed to assign subscription',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <UForm :schema="subscriptionSchema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField label="User" name="userId" required>
      <USelectMenu v-model="state.userId" v-model:search-term="userSearchTerm" :items="userOptions"
        :loading="searchingUsers" ignore-filter placeholder="Type to search user..." size="lg" class="w-full"
        value-key="value" label-key="label" />
    </UFormField>

    <UFormField label="Plan" name="planId" required>
      <USelectMenu v-model="state.planId" :items="planOptions" placeholder="Select plan" size="lg" class="w-full"
        value-key="value" />
    </UFormField>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Building Count" name="buildingCount" required>
        <UInput v-model.number="state.buildingCount" type="number" min="1" size="lg" class="w-full" />
      </UFormField>

      <UFormField label="Manager Count" name="managerCount" required>
        <UInput v-model.number="state.managerCount" type="number" min="0" size="lg" class="w-full" />
      </UFormField>
    </div>

    <UFormField label="Billing Cycle Start" name="billingCycleStart" required>
      <UInput v-model="state.billingCycleStart" type="date" size="lg" class="w-full" />
    </UFormField>

    <div v-if="selectedPlan" class="p-4 bg-gray-50 rounded-lg">
      <div class="text-sm text-gray-600 mb-2">Calculated Yearly Amount:</div>
      <div class="text-2xl font-bold text-gray-900">${{ totalAmount.toFixed(2) }}</div>
      <div class="text-xs text-gray-500 mt-1">
        ({{ state.buildingCount }} × ${{ selectedPlan.buildingPrice }}) +
        ({{ state.managerCount }} × ${{ selectedPlan.managerPrice }})
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <UButton color="neutral" variant="ghost" @click="emit('cancel')" :disabled="loading">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        Assign Subscription
      </UButton>
    </div>
  </UForm>
</template>