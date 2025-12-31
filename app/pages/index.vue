<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">Welcome back, {{ user?.name }}!</h2>
      </template>

      <p class="text-gray-600">
        Platform Admin Dashboard - Manage users, admins, and subscription plans.
      </p>
    </UCard>
  </div>
</template>