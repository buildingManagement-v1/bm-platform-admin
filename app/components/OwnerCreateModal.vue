<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { ApiResponse, Owner } from '~/types'
import { errorMessage } from '~/types/api'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ created: [] }>()

const { api } = useApi()
const toast = useToast()

/** Mirrors CreateOwnerDto */
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30).optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Schema>({ name: '', email: '', phone: '' })
const saving = ref(false)

watch(open, (v) => { if (v) Object.assign(state, { name: '', email: '', phone: '' }) })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await api<ApiResponse<Owner>>('/v1/platform/users', {
      method: 'POST',
      body: { ...event.data, phone: event.data.phone || undefined },
    })
    toast.add({ title: 'Owner created', description: 'A temporary password was emailed to them.', color: 'success' })
    open.value = false
    emit('created')
  } catch (error) {
    toast.add({ title: 'Could not create owner', description: errorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Add owner" description="They get the free trial and must set a new password at first sign-in.">
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" :ui="{ root: 'w-full' }" />
        </UFormField>
        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" :ui="{ root: 'w-full' }" />
        </UFormField>
        <UFormField label="Phone" name="phone">
          <UInput v-model="state.phone" type="tel" :ui="{ root: 'w-full' }" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="() => { open = false }">Cancel</UButton>
          <UButton type="submit" color="primary" :loading="saving">Create owner</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
