<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useApiBaseUrl } from '~/composables/useApiBaseUrl'
import { forgotPasswordSchema, type ForgotPasswordSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const apiBaseUrl = useApiBaseUrl()
const router = useRouter()
const toast = useToast()

const state = reactive({
  email: '',
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<ForgotPasswordSchema>) {
  loading.value = true
  try {
    await $fetch(`${apiBaseUrl}/v1/platform/auth/forgot-password`, {
      method: 'POST',
      body: { email: event.data.email },
    })

    toast.add({
      title: 'OTP sent',
      description: 'Check your email for the reset code',
      color: 'success'
    })

    router.push(`/reset-password?email=${encodeURIComponent(event.data.email)}`)
  } catch (error: any) {
    toast.add({
      title: 'Failed to send OTP',
      description: error.data?.message || 'Please try again',
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
          <h1 class="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p class="text-sm text-gray-500 mt-1">Enter your email to receive a reset code</p>
        </div>
      </template>

      <UForm :schema="forgotPasswordSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="admin@example.com" icon="i-heroicons-envelope"
            size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UButton type="submit" color="primary" block size="lg" :loading="loading">
          Send Reset Code
        </UButton>
      </UForm>

      <template #footer>
        <div class="text-center text-sm">
          Remember your password?
          <NuxtLink to="/login" class="text-primary hover:underline ml-1">
            Sign in
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>