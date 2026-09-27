<script setup lang="ts">
const route = useRoute()
const isSidebarOpen = ref(true)

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/admins': 'Admins',
  '/users': 'Users',
  '/plans': 'Plans',
  '/activity-logs': 'Activity Logs',
  '/app-version': 'App Version',
  '/subscriptions': 'Subscriptions',
  '/billing': 'Plan Requests',
  '/adverts': 'Login Adverts',
  '/broadcasts': 'Broadcasts',
  '/settings': 'Settings',
  '/change-password': 'Change Password',
}
const pageTitle = computed(() => titles[route.path.replace(/\/$/, '') || '/'] ?? 'Dashboard')

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <div :class="[
      'transition-all duration-300',
      isSidebarOpen ? 'ml-64' : 'ml-20'
    ]">
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
        <div class="flex items-center gap-4">
          <UButton color="neutral" variant="ghost" icon="i-heroicons-bars-3" class="lg:hidden" @click="toggleSidebar" />
          <h2 class="text-lg font-semibold text-gray-900">
            {{ pageTitle }}
          </h2>
        </div>

        <UserMenu />
      </header>

      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>