<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { resetPasswordSchema, type ResetPasswordSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const state = reactive({
  email: (route.query.email as string) || '',
  otp: '',
  newPassword: '',
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<ResetPasswordSchema>) {
  loading.value = true
  try {
    await $fetch(`${config.public.apiUrl}/v1/platform/auth/reset-password`, {
      method: 'POST',
      body: event.data,
    })

    toast.add({
      title: 'Password reset successful',
      description: 'You can now login with your new password',
      color: 'success'
    })

    router.push('/login')
  } catch (error: any) {
    toast.add({
      title: 'Reset failed',
      description: error.data?.message || 'Invalid or expired code',
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
          <h1 class="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p class="text-sm text-gray-500 mt-1">Enter the code sent to your email</p>
        </div>
      </template>

      <UForm :schema="resetPasswordSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="admin@example.com" icon="i-heroicons-envelope"
            size="lg" :ui="{ root: 'w-full' }" disabled />
        </UFormField>

        <UFormField label="Reset Code" name="otp" required>
          <UInput v-model="state.otp" placeholder="Enter 6-digit code" icon="i-heroicons-key" size="lg"
            :ui="{ root: 'w-full' }" maxlength="6" />
        </UFormField>

        <UFormField label="New Password" name="newPassword" required>
          <UInput v-model="state.newPassword" type="password" placeholder="Enter new password"
            icon="i-heroicons-lock-closed" size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UButton type="submit" color="primary" block size="lg" :loading="loading">
          Reset Password
        </UButton>
      </UForm>

      <template #footer>
        <div class="text-center text-sm">
          <NuxtLink to="/login" class="text-primary hover:underline">
            Back to login
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>