<script setup lang="ts">
/// <reference types="@types/google.maps" />

interface _StoreLocation {
  latitude: string
  longitude: string
  address: string
  city: string
}

interface StoreWithLocation {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  locations?: _StoreLocation[]
}

interface Props {
  stores: StoreWithLocation[]
  center?: { lat: number, lng: number }
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 13
})

const { loadGoogleMaps } = useGoogleMaps()
const mapContainer = ref<HTMLElement | null>(null)
const map = ref<google.maps.Map | null>(null)
const markers = ref<google.maps.Marker[]>([])
const infoWindows = ref<google.maps.InfoWindow[]>([])
const loading = ref(true)
const _error = ref<string | null>(null)

const initializeMap = async () => {
  try {
    loading.value = true
    _error.value = null

    // Load Google Maps script
    await loadGoogleMaps()

    if (!mapContainer.value) {
      throw new Error('Map container not found')
    }

    // Calculate center from stores if not provided
    let mapCenter = props.center
    if (!mapCenter && props.stores.length > 0) {
      const firstStore = props.stores.find(s => s.locations && s.locations.length > 0)
      if (firstStore?.locations?.[0]) {
        mapCenter = {
          lat: parseFloat(firstStore.locations[0].latitude),
          lng: parseFloat(firstStore.locations[0].longitude)
        }
      }
    }

    // Default center if still not set
    if (!mapCenter) {
      mapCenter = { lat: 40.7128, lng: -74.0060 } // New York as fallback
    }

    // Create map
    map.value = new google.maps.Map(mapContainer.value, {
      center: mapCenter,
      zoom: props.zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    })

    // Add markers for each store location
    props.stores.forEach((store) => {
      if (store.locations && store.locations.length > 0) {
        store.locations.forEach((location) => {
          const lat = parseFloat(location.latitude)
          const lng = parseFloat(location.longitude)

          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Invalid coordinates for store ${store.name}`)
            return
          }

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map: map.value,
            title: store.name,
            animation: google.maps.Animation.DROP
          })

          // Create info window content
          const infoWindowContent = `
            <div style="padding: 12px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${store.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">${location.address}</p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${location.city}</p>
              <a href="/${store.slug}" style="color: #16a34a; text-decoration: none; font-size: 14px; font-weight: 500;">Ver tienda →</a>
            </div>
          `

          const infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent
          })

          // Add click listener to marker
          marker.addListener('click', () => {
            // Close all other info windows
            infoWindows.value.forEach((iw: google.maps.InfoWindow) => iw.close())
            // Open this info window
            infoWindow.open(map.value, marker)
          })

          markers.value.push(marker)
          infoWindows.value.push(infoWindow)
        })
      }
    })

    // Fit bounds to show all markers if multiple stores
    if (markers.value.length > 1) {
      const bounds = new google.maps.LatLngBounds()
      markers.value.forEach((marker: google.maps.Marker) => {
        const position = marker.getPosition()
        if (position) {
          bounds.extend(position)
        }
      })
      map.value.fitBounds(bounds)
    }

    loading.value = false
  } catch (err) {
    console._error('Error initializing map:', err)
    _error.value = 'Failed to load map. Please try again later.'
    loading.value = false
  }
}

// Clean up markers and info windows
const cleanupMap = () => {
  markers.value.forEach(marker => marker.setMap(null))
  infoWindows.value.forEach(iw => iw.close())
  markers.value = []
  infoWindows.value = []
}

// Watch for store changes
watch(() => props.stores, () => {
  if (map.value) {
    cleanupMap()
    initializeMap()
  }
}, { deep: true })

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  cleanupMap()
})
</script>

<template>
  <div class="relative w-full">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center h-[400px] lg:h-[600px] bg-muted rounded-lg"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-loader-2"
          class="w-8 h-8 animate-spin text-muted mx-auto mb-3"
        />
        <p class="text-sm text-muted">
          Loading map...
        </p>
      </div>
    </div>

    <!-- Error State -->
    <UCard
      v-else-if="_error"
      class="h-[400px] lg:h-[600px]"
    >
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <UIcon
            name="i-lucide-alert-circle"
            class="w-8 h-8 text-_error mx-auto mb-3"
          />
          <p class="text-sm text-muted">
            {{ _error }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Empty State -->
    <UCard
      v-else-if="stores.length === 0"
      class="h-[400px] lg:h-[600px]"
    >
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <UIcon
            name="i-lucide-map-pin"
            class="w-8 h-8 text-muted mx-auto mb-3"
          />
          <p class="text-sm text-muted">
            No store locations available
          </p>
        </div>
      </div>
    </UCard>

    <!-- Map Container -->
    <div
      v-show="!loading && !_error && stores.length > 0"
      ref="mapContainer"
      class="w-full h-[400px] lg:h-[600px] rounded-lg"
    />
  </div>
</template>
