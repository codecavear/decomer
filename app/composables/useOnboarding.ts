/**
 * useOnboarding — gestiona el estado y la progresión del onboarding de DeComer.
 * Persiste datos en localStorage; se limpia al completar.
 */

export type OnboardingPlan = 'unico' | 'basic' | 'full' | 'premium'

const STORAGE_KEY_PLAN = 'decomer_selected_plan'
const STORAGE_KEY_ADDRESS = 'decomer_address'
const STORAGE_KEY_DONE = 'decomer_onboarding_done'
const TOTAL_STEPS = 5

// Step indices
export const STEP_WELCOME = 0
export const STEP_HOW_IT_WORKS = 1
export const STEP_PLAN = 2
export const STEP_ZONE = 3
export const STEP_ACCOUNT = 4

export function useOnboarding() {
  const step = useState<number>('onboarding:step', () => 0)
  const direction = useState<'forward' | 'back'>('onboarding:direction', () => 'forward')
  const selectedPlan = useState<OnboardingPlan | null>('onboarding:plan', () => null)
  const address = useState<string>('onboarding:address', () => '')

  const progress = computed(() => ((step.value + 1) / TOTAL_STEPS) * 100)
  const isFirst = computed(() => step.value === 0)
  const isLast = computed(() => step.value === TOTAL_STEPS - 1)

  const canAdvance = computed(() => {
    if (step.value === STEP_PLAN) return !!selectedPlan.value
    if (step.value === STEP_ZONE) return address.value.trim().length > 5
    return true
  })

  function next() {
    if (step.value < TOTAL_STEPS - 1) {
      direction.value = 'forward'
      step.value++
    }
  }

  function back() {
    if (step.value > 0) {
      direction.value = 'back'
      step.value--
    }
  }

  function goTo(index: number) {
    direction.value = index > step.value ? 'forward' : 'back'
    step.value = Math.max(0, Math.min(index, TOTAL_STEPS - 1))
  }

  function save() {
    if (!import.meta.client) return
    if (selectedPlan.value) localStorage.setItem(STORAGE_KEY_PLAN, selectedPlan.value)
    if (address.value) localStorage.setItem(STORAGE_KEY_ADDRESS, address.value)
    localStorage.setItem(STORAGE_KEY_DONE, '1')
  }

  function reset() {
    step.value = 0
    direction.value = 'forward'
    selectedPlan.value = null
    address.value = ''
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY_PLAN)
      localStorage.removeItem(STORAGE_KEY_ADDRESS)
      localStorage.removeItem(STORAGE_KEY_DONE)
    }
  }

  function isDone(): boolean {
    if (!import.meta.client) return false
    return !!localStorage.getItem(STORAGE_KEY_DONE)
  }

  return {
    // state
    step,
    direction,
    selectedPlan,
    address,
    // computed
    progress,
    isFirst,
    isLast,
    canAdvance,
    totalSteps: TOTAL_STEPS,
    // actions
    next,
    back,
    goTo,
    save,
    reset,
    isDone,
    // constants
    STEP_WELCOME,
    STEP_HOW_IT_WORKS,
    STEP_PLAN,
    STEP_ZONE,
    STEP_ACCOUNT
  }
}
