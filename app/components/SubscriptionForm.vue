<script setup lang="ts">
import { errorMessage } from '~/types/api'
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
  billingCycleStart: new Date().toISOString().split('T')[0],
  durationMonths: 12,
  notes: '',
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
    const response = await api<ApiResponse<Array<{ id: string; name: string; email: string }>>>(`/v1/platform/users?search=${encodeURIComponent(newValue)}`)
    userOptions.value = response.data.map(u => ({
      label: `${u.name} (${u.email})`,
      value: u.id
    }))
  } catch (error) {
    toast.add({ title: 'Failed to search users', description: errorMessage(error), color: 'error' })
    userOptions.value = []
  } finally {
    searchingUsers.value = false
  }
})

const selectedPlan = computed(() =>
  plans.value.find(p => p.id === state.planId)
)

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
    toast.add({ title: 'Failed to fetch plans', description: errorMessage(error), color: 'error' })
  }
}

async function onSubmit(event: FormSubmitEvent<SubscriptionSchema>) {
  loading.value = true
  try {
    const res = await api<ApiResponse<unknown>>('/v1/platform/subscriptions', {
      method: 'POST',
      body: { ...event.data, notes: event.data.notes || undefined },
    })
    toast.add({ title: res.message ?? 'Subscription assigned', color: 'success' })
    emit('success')
  } catch (error) {
    toast.add({
      title: 'Failed to assign subscription',
      description: errorMessage(error),
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
      <UFormField label="Cycle start" name="billingCycleStart" required>
        <UInput v-model="state.billingCycleStart" type="date" size="lg" class="w-full" />
      </UFormField>
      <UFormField label="Length (months)" name="durationMonths" required>
        <UInput v-model.number="state.durationMonths" type="number" min="1" max="36" size="lg" class="w-full" />
      </UFormField>
    </div>

    <UFormField label="Notes" name="notes" hint="e.g. how it was paid">
      <UInput v-model="state.notes" size="lg" class="w-full" />
    </UFormField>

    <div v-if="selectedPlan" class="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
      <div>Plan price (yearly): <span class="font-bold text-gray-900">ETB {{ Number(selectedPlan.price).toLocaleString() }}</span></div>
      <div>An owner on the free trial is moved to this plan. Owners with a paid plan use "Change plan" instead.</div>
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