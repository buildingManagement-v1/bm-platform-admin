<script setup lang="ts">
import type { AnalyticsOverview, ApiResponse } from '~/types'
import { errorMessage } from '~/types/api'

const { api } = useApi()
const { user } = useAuth()
const toast = useToast()

const overview = ref<AnalyticsOverview | null>(null)
const loading = ref(false)

const etb = (n: number) => `ETB ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

const kpis = computed(() => {
  const o = overview.value
  if (!o) return []
  return [
    { label: 'Owners', value: o.owners.total.toLocaleString(), sub: `${o.owners.newThisMonth} new this month`, icon: 'i-heroicons-users' },
    { label: 'Annual recurring revenue', value: etb(o.subscriptions.arr), sub: `${etb(o.subscriptions.mrr)} / month`, icon: 'i-heroicons-banknotes' },
    { label: 'Paid plans', value: o.subscriptions.paid.toLocaleString(), sub: `${o.subscriptions.trials} on free trial`, icon: 'i-heroicons-credit-card' },
    { label: 'Pending plan requests', value: o.subscriptions.pendingRequests.toLocaleString(), sub: 'awaiting payment check', icon: 'i-heroicons-clock' },
    { label: 'Buildings', value: o.portfolio.buildings.toLocaleString(), sub: `${o.portfolio.units.toLocaleString()} units`, icon: 'i-heroicons-building-office-2' },
    { label: 'Occupancy', value: `${o.portfolio.occupancyRate}%`, sub: `${o.portfolio.vacantUnits} vacant units`, icon: 'i-heroicons-home' },
    { label: 'Active tenants', value: o.portfolio.activeTenants.toLocaleString(), sub: `${o.portfolio.activeManagers} managers`, icon: 'i-heroicons-user-group' },
    { label: 'Rent processed this month', value: etb(o.portfolio.rentCollectedThisMonth), sub: 'recorded by owners', icon: 'i-heroicons-arrow-trending-up' },
  ]
})

const maxSignups = computed(() => Math.max(1, ...(overview.value?.trends.map(t => t.signups) ?? [1])))
const maxBilled = computed(() => Math.max(1, ...(overview.value?.trends.map(t => t.billed) ?? [1])))
const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })

async function load() {
  loading.value = true
  try {
    const res = await api<ApiResponse<AnalyticsOverview>>('/v1/platform/analytics/overview')
    overview.value = res.data
  } catch (error) {
    toast.add({ title: 'Failed to load dashboard', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Welcome back, {{ user?.name }}</p>
      </div>
      <UButton color="neutral" variant="outline" icon="i-heroicons-arrow-path" :loading="loading" @click="load">
        Refresh
      </UButton>
    </div>

    <div v-if="loading && !overview" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <template v-else-if="overview">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <UCard v-for="kpi in kpis" :key="kpi.label">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-600">{{ kpi.label }}</p>
              <p class="text-2xl font-bold text-gray-900 mt-2">{{ kpi.value }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ kpi.sub }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <UIcon :name="kpi.icon" class="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </UCard>
      </div>

      <UAlert v-if="overview.subscriptions.pendingRequests > 0" color="warning" variant="subtle"
        icon="i-heroicons-clock" :title="`${overview.subscriptions.pendingRequests} plan request(s) waiting for review`"
        :actions="[{ label: 'Review', to: '/billing', color: 'warning' }]" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UCard class="lg:col-span-2">
          <template #header>
            <h2 class="font-semibold text-gray-900">Last 12 months</h2>
          </template>
          <div class="space-y-6">
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">New owners</p>
              <div class="flex items-end gap-2 h-28">
                <div v-for="t in overview.trends" :key="t.month" class="flex-1 flex flex-col items-center gap-1">
                  <span class="text-[10px] text-gray-500">{{ t.signups || '' }}</span>
                  <div class="w-full rounded-t bg-primary-400" :style="{ height: `${(t.signups / maxSignups) * 80}px` }" />
                  <span class="text-[10px] text-gray-500">{{ monthLabel(t.month) }}</span>
                </div>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">Plan payments approved (ETB)</p>
              <div class="flex items-end gap-2 h-28">
                <div v-for="t in overview.trends" :key="t.month" class="flex-1 flex flex-col items-center gap-1"
                  :title="etb(t.billed)">
                  <div class="w-full rounded-t bg-emerald-400" :style="{ height: `${(t.billed / maxBilled) * 90}px` }" />
                  <span class="text-[10px] text-gray-500">{{ monthLabel(t.month) }}</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-gray-900">Plan mix</h2>
          </template>
          <div class="space-y-3">
            <div v-for="p in overview.subscriptions.planMix" :key="p.plan">
              <div class="flex justify-between text-sm">
                <span class="font-medium">{{ p.plan }}</span>
                <span class="text-gray-500">{{ p.owners }}</span>
              </div>
              <div class="h-2 rounded bg-gray-100 mt-1">
                <div class="h-2 rounded bg-primary-500"
                  :style="{ width: `${(p.owners / Math.max(1, overview.subscriptions.active)) * 100}%` }" />
              </div>
            </div>
            <p v-if="!overview.subscriptions.planMix.length" class="text-sm text-gray-500">No active plans</p>
            <div class="border-t pt-3 text-sm space-y-1 text-gray-600">
              <div class="flex justify-between"><span>Owners without a plan (read-only)</span><span>{{ overview.owners.withoutActivePlan }}</span></div>
              <div class="flex justify-between"><span>Pending deletion</span><span>{{ overview.owners.pendingDeletion }}</span></div>
              <div class="flex justify-between"><span>Inactive owners</span><span>{{ overview.owners.inactive }}</span></div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>
