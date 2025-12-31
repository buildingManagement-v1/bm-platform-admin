<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, logout } = useAuth()

const items = computed<DropdownMenuItem[][]>(() => [
  [{ label: user.value?.email || 'User', type: 'label' }],
  [{
    label: 'Logout',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onSelect: () => logout()
  }],
])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton color="neutral" variant="ghost" trailing-icon="i-heroicons-chevron-down">
      <div class="flex items-center gap-2">
        <UAvatar size="xs" :alt="user?.name" />
        <span class="hidden md:block">{{ user?.name }}</span>
      </div>
    </UButton>
  </UDropdownMenu>
</template>