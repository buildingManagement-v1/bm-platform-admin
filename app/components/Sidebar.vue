<script setup lang="ts">
const route = useRoute()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const navigation = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/' },
  { label: 'Admins', icon: 'i-heroicons-shield-check', to: '/admins' },
  { label: 'Users', icon: 'i-heroicons-users', to: '/users' },
  { label: 'Plans', icon: 'i-heroicons-currency-dollar', to: '/plans' },
]
</script>

<template>
  <aside :class="[
    'fixed inset-y-0 left-0 bg-white border-r border-gray-200 transition-all duration-300 z-40',
    isOpen ? 'w-64' : 'w-20'
  ]">
    <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200">
      <div v-if="isOpen" class="flex items-center gap-2">
        <UIcon name="i-heroicons-building-office-2" class="w-8 h-8 text-primary-600" />
        <span class="text-xl font-bold text-gray-900">BMS Admin</span>
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