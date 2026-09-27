<script setup lang="ts">
import type { ApiResponse, OwnerDetail } from '~/types'
import { errorMessage } from '~/types/api'

const props = defineProps<{ ownerId: string | null }>()
const open = defineModel<boolean>('open', { default: false })

const { api } = useApi()
const toast = useToast()
const detail = ref<OwnerDetail | null>(null)
const loading = ref(false)

const day = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const limits = computed(() => detail.value?.usage.limits ?? null)
const { user } = useAuth()
const canSupport = computed(() => {
  const roles = (user.value as { roles?: string[] } | null)?.roles ?? []
  return roles.includes('super_admin') || roles.includes('user_manager')
})
const sendingReset = ref(false)

async function sendReset() {
  if (!detail.value || !confirm(`Email a password reset code to ${detail.value.email}?`)) return
  sendingReset.value = true
  try {
    const res = await api<ApiResponse<{ message: string }>>(`/v1/platform/users/${detail.value.id}/send-password-reset`, { method: 'POST' })
    toast.add({ title: res.data.message, color: 'success' })
  } catch (error) {
    toast.add({ title: 'Could not send reset', description: errorMessage(error), color: 'error' })
  } finally {
    sendingReset.value = false
  }
}
const over = (used: number, max: number | undefined) => max !== undefined && used > max

watch(() => [open.value, props.ownerId] as const, async ([isOpen, id]) => {
  if (!isOpen || !id) return
  loading.value = true
  detail.value = null
  try {
    detail.value = (await api<ApiResponse<OwnerDetail>>(`/v1/platform/users/${id}`)).data
  } catch (error) {
    toast.add({ title: 'Could not load owner', description: errorMessage(error), color: 'error' })
    open.value = false
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<template>
  <USlideover v-model:open="open" :title="detail?.name ?? 'Owner'" :description="detail?.email" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
      </div>
      <div v-else-if="detail" class="space-y-6 text-sm">
        <div v-if="canSupport && !detail.deletedAt" class="flex justify-end">
          <UButton size="sm" variant="outline" icon="i-heroicons-key" :loading="sendingReset" @click="sendReset">
            Send password reset
          </UButton>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div><p class="text-gray-500">Status</p><p class="font-medium capitalize">{{ detail.deletedAt ? 'Pending deletion' : detail.status }}</p></div>
          <div><p class="text-gray-500">Joined</p><p class="font-medium">{{ day(detail.createdAt) }}</p></div>
          <div><p class="text-gray-500">Last sign-in</p><p class="font-medium">{{ day(detail.lastLoginAt) }}</p></div>
        </div>

        <UCard>
          <template #header><p class="font-semibold">Subscription</p></template>
          <div v-if="detail.subscription" class="space-y-1">
            <p class="text-base font-semibold">{{ detail.subscription.plan?.name }}</p>
            <p class="text-gray-500">{{ day(detail.subscription.billingCycleStart) }} – {{ day(detail.subscription.billingCycleEnd) }}</p>
          </div>
          <p v-else class="text-red-600">No active plan — the account is read-only.</p>
          <div v-if="limits" class="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p class="text-gray-500">Buildings</p>
              <p :class="over(detail.usage.buildings, limits.maxBuildings) ? 'text-red-600 font-semibold' : 'font-medium'">
                {{ detail.usage.buildings }} / {{ limits.maxBuildings }}
              </p>
            </div>
            <div>
              <p class="text-gray-500">Largest building (units)</p>
              <p :class="over(detail.usage.maxUnitsInABuilding, limits.maxUnits) ? 'text-red-600 font-semibold' : 'font-medium'">
                {{ detail.usage.maxUnitsInABuilding }} / {{ limits.maxUnits }}
              </p>
            </div>
            <div>
              <p class="text-gray-500">Managers</p>
              <p :class="over(detail.usage.managers, limits.maxManagers) ? 'text-red-600 font-semibold' : 'font-medium'">
                {{ detail.usage.managers }} / {{ limits.maxManagers }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header><p class="font-semibold">Buildings ({{ detail.buildings.length }})</p></template>
          <div v-if="detail.buildings.length" class="divide-y">
            <div v-for="b in detail.buildings" :key="b.id" class="flex justify-between py-2">
              <div>
                <p class="font-medium">{{ b.name }}</p>
                <p class="text-xs text-gray-500">{{ b.city ?? '—' }} · since {{ day(b.createdAt) }}</p>
              </div>
              <div class="text-right">
                <p>{{ b.occupiedUnits }}/{{ b.units }} units occupied ({{ b.occupancyRate }}%)</p>
                <p class="text-xs text-gray-500">{{ b.activeTenants }} tenants · {{ b.activeLeases }} leases</p>
              </div>
            </div>
          </div>
          <p v-else class="text-gray-500">No buildings yet</p>
        </UCard>

        <UCard>
          <template #header><p class="font-semibold">History</p></template>
          <div class="space-y-2">
            <div v-for="s in detail.subscriptionHistory" :key="s.id" class="flex justify-between">
              <span>{{ s.plan?.name }} <span class="text-gray-500">({{ s.status }})</span></span>
              <span class="text-gray-500">{{ day(s.billingCycleStart) }} – {{ day(s.billingCycleEnd) }}</span>
            </div>
            <div v-for="r in detail.requests" :key="r.id" class="flex justify-between text-xs">
              <span>Request: {{ r.plan.name }} · ETB {{ Number(r.amount).toLocaleString() }}</span>
              <span class="capitalize text-gray-500">{{ r.status }} · {{ day(r.createdAt) }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </USlideover>
</template>
