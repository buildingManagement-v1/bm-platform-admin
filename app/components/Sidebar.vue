<script setup lang="ts">
import { AdminRole, type Admin } from '~/types'

const route = useRoute()
const { user } = useAuth()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const allNavigation: Array<{ label: string; icon: string; to: string; requiredRoles: AdminRole[] }> = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/', requiredRoles: [] },
  { label: 'Admins', icon: 'i-heroicons-shield-check', to: '/admins', requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.USER_MANAGER] },
  { label: 'Plans', icon: 'i-heroicons-currency-dollar', to: '/plans', requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.USER_MANAGER, AdminRole.ANALYTICS_VIEWER, AdminRole.SYSTEM_MANAGER, AdminRole.BILLING_MANAGER] },
]

const navigation = computed(() => {
  const admin = user.value as Admin | null
  if (!admin) return []

  return allNavigation.filter(item => {
    // Dashboard is visible to all
    if (item.requiredRoles.length === 0) return true

    // Check if user has any of the required roles
    return item.requiredRoles.some(role => admin.roles.includes(role))
  })
})
</script>

<template>
  <aside :class="[
    'fixed inset-y-0 left-0 bg-white border-r border-gray-200 transition-all duration-300 z-40',
    isOpen ? 'w-64' : 'w-20'
  ]">
    <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200">
      <div v-if="isOpen" class="flex items-center gap-2">
        <UIcon name="i-heroicons-building-office-2" class="w-8 h-8 text-primary-600" />
        <span class="text-xl font-bold text-gray-900">BMS</span>
      </div>
      <UIcon v-else name="i-heroicons-building-office-2" class="w-8 h-8 text-primary-600 mx-auto" />
    </div>

    <nav class="p-4 space-y-2">
      <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="[
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        route.path === item.to
          ? 'bg-primary-50 text-primary-600'
          : 'text-gray-700 hover:bg-gray-100',
      ]">
        <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="isOpen" class="font-medium">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="absolute bottom-4 left-0 right-0 px-4">
      <UButton color="neutral" variant="ghost" block
        :icon="isOpen ? 'i-heroicons-chevron-left' : 'i-heroicons-chevron-right'" @click="emit('toggle')">
        <span v-if="isOpen">Collapse</span>
      </UButton>
    </div>
  </aside>
</template>