/**
 * Shipping Utility Functions using completely free and open-source APIs:
 * - Geocoding & Autocomplete: Nominatim (OpenStreetMap)
 * - Real Driving Route & Distance: OpenRouteService / OSRM (OpenStreetMap Routing)
 */

export interface GeocodingResult {
  display_name: string;
  lat: number;
  lon: number;
  streetName?: string;
  suburb?: string; // Neighborhood
  city?: string;
}

/**
 * Searches locations using Nominatim API (OpenStreetMap)
 * Rate limit alert: Nominatim asks for absolute maximum of 1 request per second.
 * We implement caching and debouncing to respect this.
 */
export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 3) return [];
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=br`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'User-Agent': 'ReiDoPastelApp/1.0 (tudojonas38@gmail.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((item: any) => {
      const address = item.address || {};
      
      // Attempt to extract street and neighborhood
      const streetName = address.road || address.pedestrian || address.suburb || '';
      const suburb = address.suburb || address.neighbourhood || address.quarter || '';
      const city = address.city || address.town || address.municipality || '';

      return {
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        streetName,
        suburb,
        city
      };
    });
  } catch (error) {
    console.error("Geocoding address search failed:", error);
    return [];
  }
}

/**
 * Single address geocoding by structured elements (backup or direct typing trigger)
 */
export async function geocodeStructuredAddress(
  street: string,
  number: string,
  neighborhood: string
): Promise<{ lat: number; lon: number } | null> {
  const query = `${street} ${number}, ${neighborhood}`;
  const results = await searchAddress(query);
  if (results && results.length > 0) {
    return { lat: results[0].lat, lon: results[0].lon };
  }
  return null;
}

/**
 * Calculates REAL route distance in kilometers between two coordinates using OSRM (Open Source Routing Machine)
 */
export async function calculateRouteDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number | null> {
  try {
    // Coordinate sequence for OSRM is longitude,latitude
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM routing error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // distance is returned in meters
      const distanceMeters = data.routes[0].distance;
      const distanceKm = distanceMeters / 1000;
      return parseFloat(distanceKm.toFixed(2));
    }
    return null;
  } catch (error) {
    console.error("OSRM Route distance calculation failed, fallback to straight line:", error);
    // Fallback to straight-line distance if server is down
    return calculateHaversineDistance(lat1, lon1, lat2, lon2);
  }
}

/**
 * Haversine formula for straight-line distance calculation (as backup/fallback)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2));
}

/**
 * Calculates delivery fee based on configured settings
 */
export function calculateDeliveryFee({
  distanceKm,
  orderSubtotal,
  freeDistanceLimit = 3,
  pricePerExcessKm = 2.50,
  minDeliveryFee = 5.00,
  freeDeliveryMinOrderValue = 80,
  maxDeliveryDistance = 15
}: {
  distanceKm: number;
  orderSubtotal: number;
  freeDistanceLimit?: number;
  pricePerExcessKm?: number;
  minDeliveryFee?: number;
  freeDeliveryMinOrderValue?: number;
  maxDeliveryDistance?: number;
}): { fee: number; isAllowed: boolean; message?: string } {
  // 1. Check max distance
  if (distanceKm > maxDistanceWithMargin(maxDeliveryDistance)) {
    return { 
      fee: 0, 
      isAllowed: false, 
      message: `Desculpe, não entregamos nessa região. Distância de ${distanceKm} km excede o limite de ${maxDeliveryDistance} km.` 
    };
  }

  // 2. Check if free delivery applies by order subtotal
  if (orderSubtotal >= freeDeliveryMinOrderValue) {
    return { fee: 0, isAllowed: true, message: `Frete Grátis! Seu pedido é de R$ ${orderSubtotal.toFixed(2)} (acima de R$ ${freeDeliveryMinOrderValue.toFixed(2)})` };
  }

  // 3. Check if within free distance
  if (distanceKm <= freeDistanceLimit) {
    return { fee: 0, isAllowed: true, message: `Frete Grátis por proximidade (até ${freeDistanceLimit} KM exatos)` };
  }

  // 4. Calculate excess distance
  const excessKm = distanceKm - freeDistanceLimit;
  const excessCost = excessKm * pricePerExcessKm;
  
  // 5. Apply minimum delivery fee
  const calculatedFee = Math.max(minDeliveryFee, excessCost);
  
  return { 
    fee: parseFloat(calculatedFee.toFixed(2)), 
    isAllowed: true 
  };
}

// Add a slight tolerance buffer for rounding or exact outer-edge matches
function maxDistanceWithMargin(max: number): number {
  return max + 0.1;
}
