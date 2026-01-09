<script setup lang="ts">
import type { Subscription } from '~/types/subscription'
import type { Plan } from '~/types/plan'
import type { ApiResponse } from '~/types/api'

const props = defineProps<{
  subscription: Subscription
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

const loading = ref(false)
const calculating = ref(false)
const plans = ref<Plan[]>([])
const prorating = ref<any>(null)

const form = reactive({
  newPlanId: '',
  newBuildingCount: props.subscription.buildingCount,
  newManagerCount: props.subscription.managerCount,
})

const planOptions = computed(() =>
  plans.value
    .filter(p => p.id !== props.subscription.planId)
    .map(p => ({
      label: p.name,
      value: p.id
    }))
)

const selectedPlan = computed(() =>
  plans.value.find(p => p.id === form.newPlanId)
)

const canCalculate = computed(() =>
  form.newPlanId && form.newBuildingCount > 0
)

async function fetchPlans() {
  try {
    const response = await api<ApiResponse<Plan[]>>('/v1/platform/plans')
    plans.value = response.data.filter(p => p.status === 'active')
  } catch (error) {
    toast.add({ title: 'Failed to fetch plans', color: 'error' })
  }
}

async function calculateProrating() {
  if (!canCalculate.value) return

  calculating.value = true
  prorating.value = null

  try {
    const response = await api<ApiResponse<any>>(`/v1/platform/subscriptions/${props.subscription.id}/calculate-upgrade`, {
      method: 'POST',
      body: form,
    })
    prorating.value = response.data
  } catch (error: any) {
    toast.add({
      title: 'Failed to calculate',
      description: error.message,
      color: 'error'
    })
  } finally {
    calculating.value = false
  }
}

async function confirmUpgrade() {
  if (!prorating.value) {
    await calculateProrating()
    return
  }

  loading.value = true
  try {
    await api(`/v1/platform/subscriptions/${props.subscription.id}/upgrade`, {
      method: 'POST',
      body: form,
    })
    toast.add({ title: 'Subscription upgraded successfully', color: 'success' })
    emit('success')
  } catch (error: any) {
    toast.add({
      title: 'Failed to upgrade',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch([() => form.newPlanId, () => form.newBuildingCount, () => form.newManagerCount], () => {
  prorating.value = null
})

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold mb-2">Current Subscription</h3>
      <div class="p-4 bg-gray-50 rounded-lg space-y-1 text-sm">
        <div><span class="font-medium">Plan:</span> {{ subscription.plan?.name }}</div>
        <div><span class="font-medium">Buildings:</span> {{ subscription.buildingCount }}</div>
        <div><span class="font-medium">Managers:</span> {{ subscription.managerCount }}</div>
        <div><span class="font-medium">Current Cost:</span> ${{ subscription.totalAmount }}/year</div>
      </div>
    </div>

    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">New Plan *</label>
        <USelectMenu v-model="form.newPlanId" :items="planOptions" placeholder="Select new plan" size="lg"
          class="w-full" value-key="value" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Building Count *</label>
          <UInput v-model.number="form.newBuildingCount" type="number" min="1" size="lg" class="w-full" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Manager Count *</label>
          <UInput v-model.number="form.newManagerCount" type="number" min="0" size="lg" class="w-full" />
        </div>
      </div>

      <UButton v-if="!prorating" color="primary" variant="outline" block :loading="calculating"
        :disabled="!canCalculate" @click="calculateProrating">
        Calculate Prorated Amount
      </UButton>
    </div>

    <div v-if="prorating" class="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      <h4 class="font-semibold text-blue-900">Prorating Breakdown</h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Days Remaining:</span>
          <span class="font-medium">{{ prorating.daysRemaining }} / {{ prorating.totalDays }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Current Plan (Unused):</span>
          <span class="font-medium text-green-600">-${{ prorating.oldUnused }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">New Plan (Remaining Time):</span>
          <span class="font-medium">+${{ prorating.newCost }}</span>
        </div>
        <div class="border-t pt-2 flex justify-between">
          <span class="font-semibold text-gray-900">Amount to Charge:</span>
          <span class="text-xl font-bold text-blue-600">${{ prorating.proratedAmount }}</span>
        </div>
        <div class="text-xs text-gray-500 mt-2">
          New yearly total: ${{ prorating.newTotal }}/year
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t">
      <UButton color="neutral" variant="ghost" @click="emit('cancel')" :disabled="loading">
        Cancel
      </UButton>
      <UButton color="primary" :loading="loading" :disabled="!canCalculate" @click="confirmUpgrade">
        {{ prorating ? 'Confirm Upgrade' : 'Calculate & Upgrade' }}
      </UButton>
    </div>
  </div>
</template>