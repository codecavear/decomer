// Argentina's main cities for the autocomplete
export const argentinaCities = [
  // Buenos Aires Province
  'Buenos Aires',
  'La Plata',
  'Mar del Plata',
  'Bahía Blanca',
  'Tandil',
  'Quilmes',
  'Lomas de Zamora',
  'Avellaneda',
  'San Isidro',
  'Vicente López',

  // Other provinces
  'Córdoba',
  'Rosario',
  'Mendoza',
  'San Miguel de Tucumán',
  'La Rioja',
  'Salta',
  'Santa Fe',
  'San Juan',
  'Resistencia',
  'Neuquén',
  'Posadas',
  'Santiago del Estero',
  'Corrientes',
  'San Salvador de Jujuy',
  'Paraná',
  'Formosa',
  'Santa Rosa',
  'San Fernando del Valle de Catamarca',
  'San Luis',
  'Río Cuarto',
  'Comodoro Rivadavia',
  'Río Gallegos',
  'Ushuaia'
].sort()

export function useCities() {
  const filterCities = (query: string) => {
    if (!query) return argentinaCities

    const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    return argentinaCities.filter((city) => {
      const normalizedCity = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return normalizedCity.includes(normalized)
    })
  }

  return {
    cities: argentinaCities,
    filterCities
  }
}
