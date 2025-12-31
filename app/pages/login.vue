<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { loginSchema, type LoginSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const { login } = useAuth()
const router = useRouter()
const toast = useToast()

const state = reactive({
  email: '',
  password: '',
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<LoginSchema>) {
  loading.value = true
  try {
    await login(event.data.email, event.data.password)
    toast.add({ title: 'Login successful', color: 'success' })
    router.push('/')
  } catch (error: any) {
    toast.add({
      title: 'Login failed',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <UCard class="w-full max-w-md shadow-xl">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">Platform Admin</h1>
          <p class="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>
      </template>

      <UForm :schema="loginSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="admin@example.com" icon="i-heroicons-envelope"
            size="lg" :ui="{
              root: 'w-full'
            }" />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput v-model="state.password" type="password" placeholder="Enter your password"
            icon="i-heroicons-lock-closed" size="lg" :ui="{
              root: 'w-full'
            }" />
        </UFormField>

        <div class="flex items-center justify-between text-sm">
          <UCheckbox label="Remember me" />
          <NuxtLink to="/forgot-password" class="text-primary hover:underline">
            Forgot password?
          </NuxtLink>
        </div>

        <UButton type="submit" color="primary" block size="lg" :loading="loading">
          Sign In
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>