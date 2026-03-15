import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatDistance,
  formatRating,
  formatPhone,
  truncate
} from '~/utils/format'

describe('formatPrice', () => {
  it('formats price in ARS', () => {
    expect(formatPrice(1000)).toContain('1.000')
    expect(formatPrice(1500)).toContain('1.500')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toContain('0')
  })

  it('handles large numbers', () => {
    expect(formatPrice(1000000)).toContain('1.000.000')
  })
})

describe('formatDistance', () => {
  it('formats meters for distances under 1km', () => {
    expect(formatDistance(0.5)).toBe('500m')
    expect(formatDistance(0.1)).toBe('100m')
  })

  it('formats kilometers for distances 1km and over', () => {
    expect(formatDistance(1.5)).toBe('1.5km')
    expect(formatDistance(10)).toBe('10.0km')
  })

  it('rounds meters to whole numbers', () => {
    expect(formatDistance(0.123)).toBe('123m')
  })
})

describe('formatRating', () => {
  it('formats rating with one decimal', () => {
    expect(formatRating(4.567)).toBe('4.6')
    expect(formatRating(5)).toBe('5.0')
    expect(formatRating(3.14159)).toBe('3.1')
  })
})

describe('formatPhone', () => {
  it('formats Argentine mobile with country code', () => {
    expect(formatPhone('5493511234567')).toBe('+54 9 351 123-4567')
  })

  it('formats local phone number', () => {
    expect(formatPhone('3511234567')).toBe('351 123-4567')
  })

  it('returns original for unknown formats', () => {
    expect(formatPhone('123')).toBe('123')
    expect(formatPhone('abcd')).toBe('abcd')
  })
})

describe('truncate', () => {
  it('truncates long text with ellipsis', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...')
  })

  it('does not truncate short text', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })
})
