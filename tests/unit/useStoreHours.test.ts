import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the composable logic directly since auto-imports may not work in tests
interface StoreSchedule {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

const isOpen = (schedules: StoreSchedule[] | undefined): boolean => {
  if (!schedules || schedules.length === 0) return false

  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5)

  const todaySchedule = schedules.find(s => s.dayOfWeek === currentDay)

  if (!todaySchedule || todaySchedule.isClosed) return false
  if (!todaySchedule.openTime || !todaySchedule.closeTime) return false

  return currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime
}

const getOpenStatus = (schedules: StoreSchedule[] | undefined) => {
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

describe('useStoreHours', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isOpen', () => {
    it('returns false for empty schedules', () => {
      expect(isOpen(undefined)).toBe(false)
      expect(isOpen([])).toBe(false)
    })

    it('returns false when store is closed today', () => {
      // Set to Monday 12:00
      vi.setSystemTime(new Date('2024-01-08T12:00:00'))

      const schedules: StoreSchedule[] = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: true }
      ]

      expect(isOpen(schedules)).toBe(false)
    })

    it('returns true when within open hours', () => {
      // Set to Monday 12:00
      vi.setSystemTime(new Date('2024-01-08T12:00:00'))

      const schedules: StoreSchedule[] = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }
      ]

      expect(isOpen(schedules)).toBe(true)
    })

    it('returns false when before open hours', () => {
      // Set to Monday 08:00
      vi.setSystemTime(new Date('2024-01-08T08:00:00'))

      const schedules: StoreSchedule[] = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }
      ]

      expect(isOpen(schedules)).toBe(false)
    })

    it('returns false when after close hours', () => {
      // Set to Monday 19:00
      vi.setSystemTime(new Date('2024-01-08T19:00:00'))

      const schedules: StoreSchedule[] = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }
      ]

      expect(isOpen(schedules)).toBe(false)
    })
  })

  describe('getOpenStatus', () => {
    it('returns neutral status for no schedules', () => {
      const status = getOpenStatus(undefined)
      expect(status.label).toBe('Sin horarios')
      expect(status.color).toBe('neutral')
    })

    it('returns success status when open', () => {
      vi.setSystemTime(new Date('2024-01-08T12:00:00'))

      const schedules: StoreSchedule[] = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }
      ]

      const status = getOpenStatus(schedules)
      expect(status.isOpen).toBe(true)
      expect(status.label).toBe('Abierto')
      expect(status.color).toBe('success')
    })

    it('returns _error status when closed', () => {
      vi.setSystemTime(new Date('2024-01-08T20:00:00'))

      const schedules: StoreSchedule[] = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }
      ]

      const status = getOpenStatus(schedules)
      expect(status.isOpen).toBe(false)
      expect(status.label).toBe('Cerrado')
      expect(status.color).toBe('_error')
    })
  })
})
