interface StoreSchedule {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

export function useStoreHours() {
  const isOpen = (schedules: StoreSchedule[] | undefined): boolean => {
    if (!schedules || schedules.length === 0) return false

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    const todaySchedule = schedules.find(s => s.dayOfWeek === currentDay)

    if (!todaySchedule || todaySchedule.isClosed) return false
    if (!todaySchedule.openTime || !todaySchedule.closeTime) return false

    return currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime
  }

  const getOpenStatus = (schedules: StoreSchedule[] | undefined): {
    isOpen: boolean
    label: string
    color: 'success' | '_error' | 'neutral'
  } => {
    if (!schedules || schedules.length === 0) {
      return { isOpen: false, label: 'Sin horarios', color: 'neutral' }
    }

    const open = isOpen(schedules)
    return {
      isOpen: open,
      label: open ? 'Abierto' : 'Cerrado',
      color: open ? 'success' : '_error'
    }
  }

  const getNextOpenTime = (schedules: StoreSchedule[] | undefined): string | null => {
    if (!schedules || schedules.length === 0) return null

    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = now.toTimeString().slice(0, 5)

    // Check today first
    const todaySchedule = schedules.find(s => s.dayOfWeek === currentDay)
    if (todaySchedule && !todaySchedule.isClosed && todaySchedule.openTime) {
      if (currentTime < todaySchedule.openTime) {
        return `Abre a las ${todaySchedule.openTime}`
      }
    }

    // Check next days
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7
      const schedule = schedules.find(s => s.dayOfWeek === nextDay)
      if (schedule && !schedule.isClosed && schedule.openTime) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        return `Abre ${dayNames[nextDay]} ${schedule.openTime}`
      }
    }

    return null
  }

  return {
    isOpen,
    getOpenStatus,
    getNextOpenTime
  }
}
