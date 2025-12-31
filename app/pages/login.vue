<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { login, user } = useAuth()
const router = useRouter()
const toast = useToast()

const state = reactive({
  email: '',
  password: '',
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    await login(state.email, state.password)

    // Check if admin needs to reset password
    if (user.value && 'mustResetPassword' in user.value && user.value.mustResetPassword) {
      router.push('/change-password')
      return
    }

    toast.add({ title: 'Login successful', color: 'success' })
    router.push('/')
  } catch (error: any) {
    const message = error.data?.message || error.message || 'Login failed'
    toast.add({
      title: 'Login failed',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-slate-100">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">BMS Login</h1>
          <p class="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormField label="Email" required>
          <UInput v-model="state.email" type="email" placeholder="your@email.com" icon="i-heroicons-envelope" size="lg"
            required :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Password" required>
          <UInput v-model="state.password" type="password" placeholder="Enter your password"
            icon="i-heroicons-lock-closed" size="lg" required :ui="{ root: 'w-full' }" />
        </UFormField>

        <div class="flex items-center justify-end text-sm">
          <NuxtLink to="/forgot-password" class="text-primary-600 hover:text-primary-700">
            Forgot password?
          </NuxtLink>
        </div>

        <UButton type="submit" block size="lg" :loading="loading">
          Sign In
        </UButton>
      </form>
    </UCard>
  </div>
</template>