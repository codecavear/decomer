export const useGoogleMaps = () => {
  const config = useRuntimeConfig()
  const isLoaded = useState<boolean>('googleMapsLoaded', () => false)
  const isLoading = useState<boolean>('googleMapsLoading', () => false)

  const loadGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // If already loaded, resolve immediately
      if (isLoaded.value) {
        resolve()
        return
      }

      // If currently loading, wait for it
      if (isLoading.value) {
        const checkInterval = setInterval(() => {
          if (isLoaded.value) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
        return
      }

      isLoading.value = true

      // Check if script already exists
      if (typeof window !== 'undefined' && window.google?.maps) {
        isLoaded.value = true
        isLoading.value = false
        resolve()
        return
      }

      // Create script element
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsApiKey}&libraries=places`
      script.async = true
      script.defer = true

      script.onload = () => {
        isLoaded.value = true
        isLoading.value = false
        resolve()
      }

      script.onerror = () => {
        isLoading.value = false
        reject(new Error('Failed to load Google Maps script'))
      }

      document.head.appendChild(script)
    })
  }

  return {
    loadGoogleMaps,
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading)
  }
}
