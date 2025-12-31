<script setup lang="ts">
const { user } = useAuth()

const stats = [
  {
    label: 'Total Users',
    value: '1,234',
    icon: 'i-heroicons-users',
    color: 'primary' as const,
    change: '+12%',
    changeType: 'increase' as const,
  },
  {
    label: 'Active Buildings',
    value: '567',
    icon: 'i-heroicons-building-office',
    color: 'success' as const,
    change: '+8%',
    changeType: 'increase' as const,
  },
  {
    label: 'Subscription Plans',
    value: '3',
    icon: 'i-heroicons-currency-dollar',
    color: 'warning' as const,
    change: '0%',
    changeType: 'neutral' as const,
  },
  {
    label: 'Platform Admins',
    value: '12',
    icon: 'i-heroicons-shield-check',
    color: 'error' as const,
    change: '+2',
    changeType: 'increase' as const,
  },
]

const quickActions = [
  {
    label: 'Create Admin',
    icon: 'i-heroicons-user-plus',
    to: '/admins',
    color: 'primary' as const,
  },
  {
    label: 'View Users',
    icon: 'i-heroicons-users',
    to: '/users',
    color: 'primary' as const,
  },
  {
    label: 'Manage Plans',
    icon: 'i-heroicons-currency-dollar',
    to: '/plans',
    color: 'primary' as const,
  },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Welcome back, {{ user?.name }}! 👋</h1>
      <p class="text-gray-600 mt-1">Here's what's happening with your platform today.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard v-for="stat in stats" :key="stat.label">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="text-sm text-gray-600">{{ stat.label }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ stat.value }}</p>
            <div class="flex items-center gap-1 mt-2">
              <UBadge :color="stat.changeType === 'increase' ? 'success' : 'neutral'" variant="subtle" size="xs">
                {{ stat.change }}
              </UBadge>
              <span class="text-xs text-gray-500">vs last month</span>
            </div>
          </div>
          <div :class="[
            'p-3 rounded-lg',
            `bg-${stat.color}-50`
          ]">
            <UIcon :name="stat.icon" :class="[
              'w-6 h-6',
              `text-${stat.color}-600`
            ]" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick Actions -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Quick Actions</h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UButton v-for="action in quickActions" :key="action.to" :to="action.to" :color="action.color" variant="outline"
          size="lg" block>
          <template #leading>
            <UIcon :name="action.icon" />
          </template>
          {{ action.label }}
        </UButton>
      </div>
    </UCard>

    <!-- Recent Activity (Placeholder) -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Recent Activity</h2>
      </template>

      <div class="text-center py-8 text-gray-500">
        <UIcon name="i-heroicons-clock" class="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>No recent activity to display</p>
      </div>
    </UCard>
  </div>
</template>