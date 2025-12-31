<script setup lang="ts">
import type { Admin, AdminRole } from '~/types'
import type { CreateAdminInput } from '~/schemas/admin'
import { createAdminSchema, updateAdminSchema } from '~/schemas/admin'

const props = defineProps<{
  mode: 'create' | 'edit'
  admin?: Admin
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

const state = reactive<CreateAdminInput>({
  name: props.admin?.name || '',
  email: props.admin?.email || '',
  roles: props.admin?.roles || ['user_manager'],
  password: '',
})

type RoleOption = {
  value: AdminRole
  label: string
}

const roleOptions: RoleOption[] = [
  { value: 'super_admin' as AdminRole, label: 'Super Admin' },
  { value: 'user_manager' as AdminRole, label: 'User Manager' },
  { value: 'analytics_viewer' as AdminRole, label: 'Analytics Viewer' },
  { value: 'system_manager' as AdminRole, label: 'System Manager' },
  { value: 'billing_manager' as AdminRole, label: 'Billing Manager' },
]

// Convert between AdminRole[] and RoleOption[] for USelectMenu
const selectedRoles = computed({
  get: () => roleOptions.filter(r => state.roles.includes(r.value)),
  set: (val: RoleOption[]) => { state.roles = val.map(r => r.value) }
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    if (props.mode === 'create') {
      await api('/v1/platform/auth/admins', {
        method: 'POST',
        body: state,
      })
      toast.add({ title: 'Admin created successfully', color: 'success' })
    } else {
      const { password, ...updateData } = state
      await api(`/v1/platform/auth/admins/${props.admin?.id}`, {
        method: 'PATCH',
        body: updateData,
      })
      toast.add({ title: 'Admin updated successfully', color: 'success' })
    }
    emit('success')
  } catch (error: any) {
    toast.add({
      title: props.mode === 'create' ? 'Failed to create admin' : 'Failed to update admin',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :schema="mode === 'create' ? createAdminSchema : updateAdminSchema" :state="state" @submit="onSubmit"
    class="space-y-4">
    <UFormField label="Name" name="name" required>
      <UInput v-model="state.name" placeholder="Enter admin name" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Email" name="email" required>
      <UInput v-model="state.email" type="email" placeholder="admin@example.com" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Roles" name="roles" required description="Select one or more roles">
      <USelectMenu v-model="selectedRoles" :items="roleOptions" multiple class="w-full" />
    </UFormField>

    <UFormField v-if="mode === 'create'" label="Password" name="password" required description="Minimum 8 characters">
      <UInput v-model="state.password" type="password" placeholder="Enter password" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="flex gap-2 justify-end pt-4">
      <UButton color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" :loading="loading">
        {{ mode === 'create' ? 'Create Admin' : 'Update Admin' }}
      </UButton>
    </div>
  </UForm>
</template>