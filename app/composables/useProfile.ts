/**
 * useProfile — composable for user profile state and mutations.
 * Handles personal data, delivery address/hours, allergies, and dietary preferences.
 * Provides optimistic UI updates with toast feedback.
 */
export const useProfile = () => {
  const toast = useToast()
  const { user: sessionUser } = useUserSession()

  const { data: profile, status, refresh } = useFetch('/api/profile', {
    key: 'user-profile'
  })

  const isSaving = ref(false)

  const form = reactive({
    name: '',
    phone: '',
    deliveryAddress: '',
    deliveryNeighborhood: '',
    deliveryNotes: '',
    deliveryHoursFrom: '',
    deliveryHoursTo: '',
    allergies: [] as string[],
    preferences: [] as string[]
  })

  // Sync reactive form when profile data loads
  watch(profile, (p) => {
    if (!p) return
    const data = p as any
    form.name = data.name ?? ''
    form.phone = data.phone ?? ''
    form.deliveryAddress = data.deliveryAddress ?? ''
    form.deliveryNeighborhood = data.deliveryNeighborhood ?? ''
    form.deliveryNotes = data.deliveryNotes ?? ''
    form.deliveryHoursFrom = data.deliveryHoursFrom ?? ''
    form.deliveryHoursTo = data.deliveryHoursTo ?? ''
    form.allergies = (data.allergies as string[]) ?? []
    form.preferences = (data.preferences as string[]) ?? []
  }, { immediate: true })

  const save = async (fields?: Partial<typeof form>) => {
    isSaving.value = true
    const payload = fields ?? { ...form }

    // Optimistic update
    if (profile.value) {
      Object.assign(profile.value as any, payload)
    }

    try {
      await $fetch('/api/profile', {
        method: 'PATCH',
        body: payload
      })
      await refresh()
      toast.add({
        title: 'Perfil actualizado',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    }
    catch (e: any) {
      // Revert optimistic update
      await refresh()
      toast.add({
        title: 'Error al guardar',
        description: e.data?.message || 'Intentá de nuevo',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
    }
    finally {
      isSaving.value = false
    }
  }

  const toggleAllergy = (allergy: string) => {
    const idx = form.allergies.indexOf(allergy)
    if (idx >= 0) {
      form.allergies.splice(idx, 1)
    }
    else {
      form.allergies.push(allergy)
    }
  }

  const togglePreference = (preference: string) => {
    const idx = form.preferences.indexOf(preference)
    if (idx >= 0) {
      form.preferences.splice(idx, 1)
    }
    else {
      form.preferences.push(preference)
    }
  }

  return {
    profile,
    sessionUser,
    form,
    status,
    isSaving,
    save,
    refresh,
    toggleAllergy,
    togglePreference
  }
}
