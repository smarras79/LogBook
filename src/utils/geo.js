// Geographic/math utility functions

import { COUNTRY_TO_CONTINENT } from '../data/geography';
import AIRPORTS_DATABASE from '../data/airports';

export const getContinent = (country) => COUNTRY_TO_CONTINENT[country] || 'Unknown';

export const searchAirports = (query) => {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();

  return AIRPORTS_DATABASE.filter(airport =>
    airport.code.toLowerCase().includes(q) ||
    airport.city.toLowerCase().includes(q) ||
    airport.name.toLowerCase().includes(q) ||
    (airport.country && airport.country.toLowerCase().includes(q))
  ).slice(0, 8); // Limit to 8 suggestions
};

// --- MATH UTILS ---
export const toRad = (val) => val * Math.PI / 180;
export const toDeg = (val) => val * 180 / Math.PI;

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Robust Great Circle Interpolation
export const getIntermediatePoint = (lat1, lon1, lat2, lon2, f) => {
  const phi1 = toRad(lat1);
  const lam1 = toRad(lon1);
  const phi2 = toRad(lat2);
  const lam2 = toRad(lon2);

  // Calculate angular distance with clamp to prevent NaN
  const sinSqLat = Math.pow(Math.sin((phi2 - phi1) / 2), 2);
  const sinSqLon = Math.pow(Math.sin((lam2 - lam1) / 2), 2);
  const underRoot = sinSqLat + Math.cos(phi1) * Math.cos(phi2) * sinSqLon;
  const clamped = Math.min(1, Math.max(0, underRoot));
  const d = 2 * Math.asin(Math.sqrt(clamped));

  if (d === 0) return { lat: lat1, lon: lon1 };

  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);

  const x = A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2);
  const y = A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2);
  const z = A * Math.sin(phi1) + B * Math.sin(phi2);

  return { lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lon: toDeg(Math.atan2(y, x)) };
};
