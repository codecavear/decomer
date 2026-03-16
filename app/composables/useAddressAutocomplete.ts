/// <reference types="@types/google.maps" />

export type AddressResult = {
  address: string
  city: string
  country: string
  neighborhood: string
  latitude: string
  longitude: string
}

export function useAddressAutocomplete() {
  const { loadGoogleMaps } = useGoogleMaps()

  function parsePlace(place: google.maps.places.PlaceResult): AddressResult {
    const components = place.address_components || []

    let streetNumber = ''
    let route = ''
    let locality = ''
    let country = ''
    let sublocality = ''

    for (const comp of components) {
      const type = comp.types[0]
      if (type === 'street_number') streetNumber = comp.long_name || ''
      if (type === 'route') route = comp.long_name || ''
      if (type === 'locality') locality = comp.long_name || ''
      if (type === 'administrative_area_level_2' && !locality) locality = comp.long_name || ''
      if (type === 'country') country = comp.long_name || ''
      if (type === 'sublocality' || type === 'neighborhood') sublocality = comp.long_name || ''
    }

    const streetPart = [route, streetNumber].filter(Boolean).join(' ')

    return {
      address: streetPart || place.formatted_address || '',
      city: locality,
      country: country || 'Argentina',
      neighborhood: sublocality,
      latitude: place.geometry?.location ? String(place.geometry.location.lat()) : '',
      longitude: place.geometry?.location ? String(place.geometry.location.lng()) : ''
    }
  }

  async function attachAutocomplete(
    inputEl: HTMLInputElement | null,
    onSelect: (result: AddressResult) => void
  ): Promise<google.maps.places.Autocomplete | null> {
    if (!inputEl || typeof window === 'undefined') return null

    try {
      await loadGoogleMaps()
    } catch {
      console.warn('Google Maps failed to load, autocomplete disabled')
      return null
    }

    if (!window.google?.maps?.places) return null

    // Save original state to restore if Google breaks the input
    const originalPlaceholder = inputEl.placeholder
    const originalDisabled = inputEl.disabled

    const autocomplete = new google.maps.places.Autocomplete(inputEl, {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'geometry'],
      componentRestrictions: { country: 'ar' }
    })

    // Watch for Google disabling the input (happens when Places API isn't enabled)
    const watchdog = setInterval(() => {
      if (inputEl.disabled && !originalDisabled) {
        inputEl.disabled = false
        inputEl.placeholder = originalPlaceholder
        clearInterval(watchdog)
        console.warn('Google Places API error detected — autocomplete disabled, input restored')
      }
    }, 500)

    // Stop checking after 10 seconds if no error
    setTimeout(() => clearInterval(watchdog), 10000)

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const parsed = parsePlace(place)
      if (parsed.address || parsed.city) {
        onSelect(parsed)
      }
    })

    return autocomplete
  }

  return { attachAutocomplete }
}
