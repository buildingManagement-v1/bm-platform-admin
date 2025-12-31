<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: false,
})

const { changePassword, user, userType } = useAuth()
const router = useRouter()
const toast = useToast()

const isFirstTime = computed(() => {
  return userType.value === 'manager' && user.value && 'mustChangePassword' in user.value && user.value.mustChangePassword
})

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const state = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const loading = ref(false)

const handleChangePassword = async () => {
  loading.value = true
  try {
    await changePassword(state.currentPassword, state.newPassword)
    toast.add({ title: 'Password changed successfully', color: 'success' })
    router.push('/')
  } catch (error: any) {
    toast.add({
      title: 'Failed to change password',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isFirstTime ? 'Set New Password' : 'Change Password' }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ isFirstTime ? 'You must change your password on first login' : 'Update your password' }}
          </p>
        </div>
      </template>

      <UForm :schema="schema" :state="state" @submit="handleChangePassword" class="space-y-4">
        <UFormField label="Current Password" name="currentPassword" required>
          <UInput v-model="state.currentPassword" type="password" placeholder="Enter current password"
            icon="i-heroicons-lock-closed" size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="New Password" name="newPassword" required description="Minimum 8 characters">
          <UInput v-model="state.newPassword" type="password" placeholder="Enter new password" icon="i-heroicons-key"
            size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Confirm New Password" name="confirmPassword" required>
          <UInput v-model="state.confirmPassword" type="password" placeholder="Confirm new password"
            icon="i-heroicons-key" size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UButton type="submit" block size="lg" :loading="loading">
          {{ isFirstTime ? 'Set Password' : 'Change Password' }}
        </UButton>

        <UButton v-if="!isFirstTime" color="neutral" variant="ghost" block @click="router.push('/')">
          Cancel
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>