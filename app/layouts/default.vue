<script setup lang="ts">
const { user, logout } = useAuth()

const links = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/',
  },
  {
    label: 'Admins',
    icon: 'i-heroicons-user-group',
    to: '/admins',
  },
  {
    label: 'Users',
    icon: 'i-heroicons-users',
    to: '/users',
  },
  {
    label: 'Plans',
    icon: 'i-heroicons-currency-dollar',
    to: '/plans',
  },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 class="text-xl font-bold text-primary-600">Platform Admin</h1>
      </div>

      <nav class="p-4 space-y-1">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          active-class="bg-primary-50 text-primary-600 hover:bg-primary-50">
          <UIcon :name="link.icon" class="w-5 h-5" />
          <span class="font-medium">{{ link.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="pl-64">
      <!-- Top Navbar -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div></div>

        <UDropdown :items="[[{ label: 'Logout', icon: 'i-heroicons-arrow-right-on-rectangle', click: logout }]]">
          <UButton color="neutral" variant="ghost" trailing-icon="i-heroicons-chevron-down">
            {{ user?.name }}
          </UButton>
        </UDropdown>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>