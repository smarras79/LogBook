import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, Plus, Trash2, Edit2, X, Copy,
  Globe, BarChart3, Trophy, Loader2, Mail, Check, AlertCircle, Users, Map, Mountain, CloudRain,
  LogIn, LogOut, User, Eye, EyeOff
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot 
} from 'firebase/firestore';

// Firebase configuration - Replace with your own config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBN3khxqaQpC8Ws9EQ7syvnPC_rLasMOL0",
  authDomain: "flightlog-82a3c.firebaseapp.com",
  projectId: "flightlog-82a3c",
  storageBucket: "flightlog-82a3c.firebasestorage.app",
  messagingSenderId: "959347389178",
  appId: "1:959347389178:web:f175b4aac3b755b71d8f43",
  measurementId: "G-CDV75B04DY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

//const GOOGLE_API_KEY = "AIzaSyDYzKON-9m0NYBIVZEXD434wDrmqMpyeQQ";
const GOOGLE_CLIENT_ID = "959347389178-dhkggam9a7cslv89p0dluaupqa4jg8n4.apps.googleusercontent.com";
const GOOGLE_API_KEY = "AIzaSyArv6AbTjFIM_nuCm4VKZAZTdfP_y2G0ag";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";


const AIRPORTS_DATABASE = [
  { code: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', lat: 40.6413, lon: -73.7781 },
  { code: 'LHR', name: 'London Heathrow', city: 'London', lat: 51.4700, lon: -0.4543 },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', lat: 41.2753, lon: 28.7519 },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', lat: 37.6188, lon: -122.3749 },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', lat: 25.2532, lon: 55.3657 },
  { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', lat: -33.9399, lon: 151.1753 },
  { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', lat: 35.5494, lon: 139.7798 },
  { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', lat: 49.0097, lon: 2.5479 },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', lat: 33.9416, lon: -118.4085 },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', lat: 25.7959, lon: -80.2870 },
  { code: 'ORD', name: "O'Hare Intl", city: 'Chicago', lat: 41.9742, lon: -87.9073 },
  { code: 'DFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas', lat: 32.8998, lon: -97.0403 },
  { code: 'DEN', name: 'Denver Intl', city: 'Denver', lat: 39.8561, lon: -104.6737 },
  { code: 'SEA', name: 'Seattle-Tacoma Intl', city: 'Seattle', lat: 47.4502, lon: -122.3088 },
  { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', lat: 33.4373, lon: -112.0078 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', lat: 33.6407, lon: -84.4277 },
];

const serviceClasses = ['Economy', 'Premium Economy', 'Business', 'First'];

// --- AIRLINE ALLIANCES DATABASE ---
const AIRLINE_ALLIANCES = {
  // Star Alliance Members (26 airlines)
  'Star Alliance': [
    'Aegean Airlines', 'Aegean', 
    'Air Canada', 
    'Air China', 
    'Air India', 
    'Air New Zealand', 
    'ANA', 'All Nippon Airways', 'All Nippon',
    'Asiana Airlines', 'Asiana',
    'Austrian', 'Austrian Airlines',
    'Avianca',
    'Brussels Airlines', 'Brussels',
    'Copa Airlines', 'Copa',
    'Croatia Airlines', 'Croatia',
    'EgyptAir', 'Egypt Air', 'Egyptair',
    'Ethiopian Airlines', 'Ethiopian',
    'EVA Air', 'EVA',
    'LOT Polish Airlines', 'LOT', 'Polish Airlines',
    'Lufthansa',
    'Scandinavian Airlines', 'SAS', 'Scandinavian',
    'Shenzhen Airlines', 'Shenzhen',
    'Singapore Airlines', 'Singapore',
    'South African Airways', 'South African',
    'Swiss', 'Swiss International', 'SWISS',
    'TAP Air Portugal', 'TAP Portugal', 'TAP',
    'Thai Airways', 'Thai', 'THAI',
    'Turkish Airlines', 'Turkish', 'THY',
    'United', 'United Airlines'
  ],
  
  // SkyTeam Members (19 airlines)
  'SkyTeam': [
    'Aeroflot',
    'Aerolíneas Argentinas', 'Aerolineas Argentinas', 'Aerolíneas',
    'Aeroméxico', 'Aeromexico', 'AeroMexico',
    'Air Europa',
    'Air France', 'AirFrance',
    'China Airlines',
    'China Eastern', 'China Eastern Airlines',
    'Czech Airlines', 'CSA',
    'Delta', 'Delta Air Lines', 'Delta Airlines',
    'Garuda Indonesia', 'Garuda',
    'ITA Airways', 'ITA', 'Alitalia',
    'Kenya Airways', 'Kenya',
    'KLM', 'KLM Royal Dutch', 'Royal Dutch Airlines',
    'Korean Air', 'Korean',
    'Middle East Airlines', 'MEA',
    'Saudia', 'Saudi Arabian Airlines', 'Saudi Arabian',
    'TAROM',
    'Vietnam Airlines', 'Vietnam',
    'Virgin Atlantic', 'Virgin',
    'XiamenAir', 'Xiamen Airlines', 'Xiamen'
  ],
  
  // Oneworld Members (13 airlines)
  'Oneworld': [
    'Alaska Airlines', 'Alaska',
    'American Airlines', 'American', 'AA',
    'British Airways', 'BA',
    'Cathay Pacific', 'Cathay',
    'Finnair',
    'Iberia',
    'Japan Airlines', 'JAL',
    'Malaysia Airlines', 'Malaysia',
    'Qantas',
    'Qatar Airways', 'Qatar',
    'Royal Air Maroc', 'RAM',
    'Royal Jordanian',
    'SriLankan Airlines', 'SriLankan'
  ]
};

// Alliance styling configuration
const ALLIANCE_STYLES = {
  'Star Alliance': { 
    color: '#1e3a5f', 
    background: '#e8f4fd', 
    icon: '⭐',
    fullName: 'Star Alliance'
  },
  'SkyTeam': { 
    color: '#0f4c81', 
    background: '#e3f2fd', 
    icon: '🌐',
    fullName: 'SkyTeam'
  },
  'Oneworld': { 
    color: '#b91c1c', 
    background: '#fee2e2', 
    icon: '🌍',
    fullName: 'Oneworld'
  },
  'Independent': { 
    color: '#6b7280', 
    background: '#f3f4f6', 
    icon: '✈️',
    fullName: 'Independent'
  }
};

// Clean list of alliance members for dropdown display (no duplicates)
const ALLIANCE_MEMBERS_DISPLAY = {
  'Star Alliance': [
    'Aegean Airlines',
    'Air Canada',
    'Air China',
    'Air India',
    'Air New Zealand',
    'ANA (All Nippon Airways)',
    'Asiana Airlines',
    'Austrian Airlines',
    'Avianca',
    'Brussels Airlines',
    'Copa Airlines',
    'Croatia Airlines',
    'EgyptAir',
    'Ethiopian Airlines',
    'EVA Air',
    'LOT Polish Airlines',
    'Lufthansa',
    'Scandinavian Airlines (SAS)',
    'Shenzhen Airlines',
    'Singapore Airlines',
    'South African Airways',
    'Swiss International',
    'TAP Air Portugal',
    'Thai Airways',
    'Turkish Airlines',
    'United Airlines'
  ],
  'SkyTeam': [
    'Aeroflot',
    'Aerolíneas Argentinas',
    'Aeroméxico',
    'Air Europa',
    'Air France',
    'China Airlines',
    'China Eastern Airlines',
    'Czech Airlines',
    'Delta Air Lines',
    'Garuda Indonesia',
    'ITA Airways',
    'Kenya Airways',
    'KLM Royal Dutch Airlines',
    'Korean Air',
    'Middle East Airlines',
    'Saudia',
    'TAROM',
    'Vietnam Airlines',
    'Virgin Atlantic',
    'XiamenAir'
  ],
  'Oneworld': [
    'Alaska Airlines',
    'American Airlines',
    'British Airways',
    'Cathay Pacific',
    'Finnair',
    'Iberia',
    'Japan Airlines (JAL)',
    'Malaysia Airlines',
    'Qantas',
    'Qatar Airways',
    'Royal Air Maroc',
    'Royal Jordanian',
    'SriLankan Airlines'
  ]
};

// Helper function to get airline alliance
const getAirlineAlliance = (airlineName) => {
  if (!airlineName) return null;
  
  const normalizedName = airlineName.trim().toLowerCase();
  
  for (const [alliance, members] of Object.entries(AIRLINE_ALLIANCES)) {
    for (const member of members) {
      if (normalizedName.includes(member.toLowerCase()) || 
          member.toLowerCase().includes(normalizedName)) {
        return alliance;
      }
    }
  }
  
  return 'Independent';
};

// --- MATH UTILS ---
const toRad = (val) => val * Math.PI / 180;
const toDeg = (val) => val * 180 / Math.PI;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
const getIntermediatePoint = (lat1, lon1, lat2, lon2, f) => {
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

// --- COMPREHENSIVE LANDMARKS DATABASE ---
// Each landmark has: name, lat, lon, radius (in miles for detection)
const LANDMARKS_DB = [
  // US National Parks - Western
  { name: "Grand Canyon National Park", lat: 36.0544, lon: -112.1401, radius: 40 },
  { name: "Joshua Tree National Park", lat: 33.8734, lon: -115.9010, radius: 35 },
  { name: "Death Valley National Park", lat: 36.5054, lon: -117.0794, radius: 50 },
  { name: "Yosemite National Park", lat: 37.8651, lon: -119.5383, radius: 35 },
  { name: "Sequoia National Park", lat: 36.4864, lon: -118.5658, radius: 25 },
  { name: "Kings Canyon National Park", lat: 36.8879, lon: -118.5551, radius: 25 },
  { name: "Zion National Park", lat: 37.2982, lon: -113.0263, radius: 25 },
  { name: "Bryce Canyon National Park", lat: 37.5930, lon: -112.1871, radius: 20 },
  { name: "Arches National Park", lat: 38.7331, lon: -109.5925, radius: 20 },
  { name: "Canyonlands National Park", lat: 38.3269, lon: -109.8783, radius: 35 },
  { name: "Capitol Reef National Park", lat: 38.2833, lon: -111.2471, radius: 30 },
  { name: "Mesa Verde National Park", lat: 37.2309, lon: -108.4618, radius: 20 },
  { name: "Petrified Forest National Park", lat: 34.9100, lon: -109.8068, radius: 25 },
  { name: "Saguaro National Park", lat: 32.2967, lon: -111.1666, radius: 20 },
  { name: "Carlsbad Caverns National Park", lat: 32.1479, lon: -104.5567, radius: 20 },
  { name: "Big Bend National Park", lat: 29.2500, lon: -103.2502, radius: 40 },
  { name: "Guadalupe Mountains National Park", lat: 31.9231, lon: -104.8645, radius: 20 },
  { name: "White Sands National Park", lat: 32.7872, lon: -106.3257, radius: 25 },
  
  // US National Parks - Pacific Coast
  { name: "Redwood National Park", lat: 41.2132, lon: -124.0046, radius: 25 },
  { name: "Crater Lake National Park", lat: 42.8684, lon: -122.1685, radius: 20 },
  { name: "Olympic National Park", lat: 47.8021, lon: -123.6044, radius: 35 },
  { name: "Mount Rainier National Park", lat: 46.8800, lon: -121.7269, radius: 30 },
  { name: "North Cascades National Park", lat: 48.7718, lon: -121.2985, radius: 30 },
  { name: "Lassen Volcanic National Park", lat: 40.4977, lon: -121.5080, radius: 20 },
  { name: "Channel Islands National Park", lat: 34.0069, lon: -119.7785, radius: 25 },
  { name: "Pinnacles National Park", lat: 36.4906, lon: -121.1825, radius: 15 },
  
  // US National Parks - Rocky Mountains
  { name: "Yellowstone National Park", lat: 44.4280, lon: -110.5885, radius: 50 },
  { name: "Grand Teton National Park", lat: 43.7904, lon: -110.6818, radius: 30 },
  { name: "Glacier National Park", lat: 48.7596, lon: -113.7870, radius: 40 },
  { name: "Rocky Mountain National Park", lat: 40.3428, lon: -105.6836, radius: 30 },
  { name: "Great Sand Dunes National Park", lat: 37.7916, lon: -105.5943, radius: 20 },
  { name: "Black Canyon of the Gunnison", lat: 38.5754, lon: -107.7416, radius: 15 },
  
  // US National Parks - Midwest & East
  { name: "Badlands National Park", lat: 43.8554, lon: -102.3397, radius: 30 },
  { name: "Theodore Roosevelt National Park", lat: 46.9790, lon: -103.4590, radius: 25 },
  { name: "Wind Cave National Park", lat: 43.5724, lon: -103.4213, radius: 15 },
  { name: "Voyageurs National Park", lat: 48.4839, lon: -92.8318, radius: 25 },
  { name: "Isle Royale National Park", lat: 48.0000, lon: -88.8269, radius: 25 },
  { name: "Mammoth Cave National Park", lat: 37.1862, lon: -86.0996, radius: 20 },
  { name: "Great Smoky Mountains National Park", lat: 35.6532, lon: -83.5070, radius: 35 },
  { name: "Shenandoah National Park", lat: 38.4755, lon: -78.4535, radius: 30 },
  { name: "Acadia National Park", lat: 44.3386, lon: -68.2733, radius: 20 },
  { name: "Cuyahoga Valley National Park", lat: 41.2808, lon: -81.5678, radius: 15 },
  { name: "Indiana Dunes National Park", lat: 41.6533, lon: -87.0524, radius: 15 },
  
  // US National Parks - South
  { name: "Everglades National Park", lat: 25.2866, lon: -80.8987, radius: 50 },
  { name: "Biscayne National Park", lat: 25.4824, lon: -80.2083, radius: 20 },
  { name: "Dry Tortugas National Park", lat: 24.6285, lon: -82.8732, radius: 20 },
  { name: "Congaree National Park", lat: 33.7948, lon: -80.7821, radius: 15 },
  { name: "Hot Springs National Park", lat: 34.5217, lon: -93.0424, radius: 10 },
  
  // Major Geographic Features - US
  { name: "Great Lakes Region", lat: 44.0, lon: -84.5, radius: 150 },
  { name: "Lake Superior", lat: 47.5, lon: -88.0, radius: 100 },
  { name: "Lake Michigan", lat: 43.5, lon: -87.0, radius: 80 },
  { name: "Lake Erie", lat: 42.2, lon: -81.2, radius: 60 },
  { name: "Mississippi River Delta", lat: 29.5, lon: -89.5, radius: 40 },
  { name: "Appalachian Mountains", lat: 37.0, lon: -81.0, radius: 80 },
  { name: "Ozark Mountains", lat: 36.0, lon: -93.0, radius: 60 },
  { name: "Sierra Nevada", lat: 37.5, lon: -119.5, radius: 60 },
  { name: "Cascade Range", lat: 44.0, lon: -121.5, radius: 50 },
  { name: "Colorado Plateau", lat: 37.0, lon: -110.5, radius: 100 },
  { name: "Mojave Desert", lat: 35.0, lon: -116.0, radius: 70 },
  { name: "Sonoran Desert", lat: 32.0, lon: -112.0, radius: 80 },
  { name: "Chihuahuan Desert", lat: 31.0, lon: -106.0, radius: 70 },
  { name: "Great Basin", lat: 39.5, lon: -117.0, radius: 100 },
  
  // US National Monuments & Other Protected Areas
  { name: "Monument Valley", lat: 36.9983, lon: -110.0985, radius: 25 },
  { name: "Sedona Red Rocks", lat: 34.8697, lon: -111.7610, radius: 20 },
  { name: "Lake Tahoe", lat: 39.0968, lon: -120.0324, radius: 20 },
  { name: "Lake Powell", lat: 37.0683, lon: -111.2433, radius: 30 },
  { name: "Lake Mead", lat: 36.1460, lon: -114.3901, radius: 30 },
  { name: "Hoover Dam", lat: 36.0161, lon: -114.7377, radius: 10 },
  { name: "Mount Whitney", lat: 36.5785, lon: -118.2920, radius: 15 },
  { name: "Mount Shasta", lat: 41.4092, lon: -122.1949, radius: 20 },
  { name: "Denali (Mount McKinley)", lat: 63.0695, lon: -151.0074, radius: 40 },
  
  // International Landmarks
  { name: "Canadian Rockies", lat: 51.5, lon: -116.0, radius: 80 },
  { name: "Banff National Park", lat: 51.4968, lon: -115.9281, radius: 40 },
  { name: "Niagara Falls", lat: 43.0962, lon: -79.0377, radius: 15 },
  { name: "Alps", lat: 46.5, lon: 9.5, radius: 150 },
  { name: "Pyrenees", lat: 42.6, lon: 1.0, radius: 80 },
  { name: "Scottish Highlands", lat: 57.0, lon: -5.0, radius: 60 },
  { name: "English Channel", lat: 50.2, lon: -1.0, radius: 40 },
  { name: "Amazon Rainforest", lat: -3.0, lon: -60.0, radius: 500 },
  { name: "Sahara Desert", lat: 23.0, lon: 12.0, radius: 800 },
  { name: "Himalayas", lat: 28.0, lon: 84.0, radius: 200 },
  { name: "Great Barrier Reef", lat: -18.2871, lon: 147.6992, radius: 150 },
  { name: "Uluru (Ayers Rock)", lat: -25.3444, lon: 131.0369, radius: 20 },
  { name: "Mount Fuji", lat: 35.3606, lon: 138.7274, radius: 30 },
  { name: "Gobi Desert", lat: 42.5, lon: 103.0, radius: 300 },
  { name: "Siberian Taiga", lat: 60.0, lon: 100.0, radius: 500 },
];

// --- IMPROVED OCEANS DATABASE ---
// Using bounding boxes instead of just center + radius for better accuracy
const OCEANS_DB = [
  { 
    name: "North Atlantic Ocean", 
    // Bounding box: roughly between North America and Europe
    bounds: { minLat: 10, maxLat: 60, minLon: -80, maxLon: -5 },
    center: { lat: 35.0, lon: -40.0 }
  },
  { 
    name: "South Atlantic Ocean", 
    bounds: { minLat: -60, maxLat: 0, minLon: -70, maxLon: 20 },
    center: { lat: -25.0, lon: -15.0 }
  },
  { 
    name: "North Pacific Ocean", 
    // This is the key fix - more restrictive bounds that don't include US mainland
    bounds: { minLat: 10, maxLat: 60, minLon: -180, maxLon: -125 },
    center: { lat: 35.0, lon: -155.0 }
  },
  { 
    name: "South Pacific Ocean", 
    bounds: { minLat: -60, maxLat: 0, minLon: -180, maxLon: -70 },
    center: { lat: -30.0, lon: -130.0 }
  },
  { 
    name: "Indian Ocean", 
    bounds: { minLat: -60, maxLat: 25, minLon: 20, maxLon: 120 },
    center: { lat: -10.0, lon: 80.0 }
  },
  { 
    name: "Arctic Ocean", 
    bounds: { minLat: 66, maxLat: 90, minLon: -180, maxLon: 180 },
    center: { lat: 85.0, lon: 0.0 }
  },
  { 
    name: "Caribbean Sea", 
    bounds: { minLat: 9, maxLat: 23, minLon: -88, maxLon: -60 },
    center: { lat: 15.0, lon: -75.0 }
  },
  { 
    name: "Mediterranean Sea", 
    bounds: { minLat: 30, maxLat: 46, minLon: -6, maxLon: 36 },
    center: { lat: 35.0, lon: 18.0 }
  },
  { 
    name: "Gulf of Mexico", 
    bounds: { minLat: 18, maxLat: 30.5, minLon: -98, maxLon: -81 },
    center: { lat: 25.0, lon: -90.0 }
  },
  {
    name: "Bering Sea",
    bounds: { minLat: 51, maxLat: 66, minLon: 162, maxLon: -157 },
    center: { lat: 58.0, lon: -175.0 }
  },
  {
    name: "Sea of Japan",
    bounds: { minLat: 33, maxLat: 52, minLon: 127, maxLon: 142 },
    center: { lat: 40.0, lon: 135.0 }
  },
  {
    name: "South China Sea",
    bounds: { minLat: 0, maxLat: 25, minLon: 99, maxLon: 121 },
    center: { lat: 12.0, lon: 113.0 }
  },
  {
    name: "Bay of Bengal",
    bounds: { minLat: 5, maxLat: 22, minLon: 80, maxLon: 95 },
    center: { lat: 15.0, lon: 88.0 }
  },
  {
    name: "Arabian Sea",
    bounds: { minLat: 5, maxLat: 25, minLon: 50, maxLon: 77 },
    center: { lat: 15.0, lon: 65.0 }
  },
  {
    name: "Red Sea",
    bounds: { minLat: 12, maxLat: 30, minLon: 32, maxLon: 44 },
    center: { lat: 20.0, lon: 38.0 }
  },
  {
    name: "Persian Gulf",
    bounds: { minLat: 24, maxLat: 30, minLon: 48, maxLon: 56 },
    center: { lat: 27.0, lon: 51.0 }
  },
  {
    name: "Tasman Sea",
    bounds: { minLat: -47, maxLat: -28, minLon: 147, maxLon: 175 },
    center: { lat: -38.0, lon: 160.0 }
  },
  {
    name: "Coral Sea",
    bounds: { minLat: -28, maxLat: -10, minLon: 143, maxLon: 165 },
    center: { lat: -18.0, lon: 155.0 }
  }
];

// --- HELPERS ---
const decodeEmailBody = (payload) => {
  let body = '';
  if (payload.parts) {
    payload.parts.forEach(part => {
      if (part.mimeType === 'text/plain' && part.body.data) {
        body += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    });
  } else if (payload.body.data) {
    body = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }
  return body;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  return `${month}-${day}-${year}`;
};

const FlightTracker = () => {
  const [user, setUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [flights, setFlights] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [suggestedFlights, setSuggestedFlights] = useState([]);
  const [gapiInited, setGapiInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [editingFlight, setEditingFlight] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false); 
  const [statusMsg, setStatusMsg] = useState('');
  const [openAllianceDropdown, setOpenAllianceDropdown] = useState(null); // tracks which alliance dropdown is open
  const geocoder = useRef(null);

  const [formData, setFormData] = useState({
    origin: '', 
    destination: '', 
    date: '', 
    aircraftType: '', 
    airline: '', 
    serviceClass: 'Economy', 
    checkLandmarks: false,
    hasLayover: false,
    viaAirports: [''], // Array of connection airport codes
    legAirlines: ['', ''], // Airlines for each leg
    legAircraftTypes: ['', ''], // Aircraft for each leg
    legServiceClasses: ['Economy', 'Economy'] // Service class for each leg
  });

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        // Load user's flights from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setFlights(userDoc.data().flights || []);
        } else {
          // Create user document if it doesn't exist
          await setDoc(userDocRef, { flights: [], createdAt: new Date().toISOString() });
          setFlights([]);
        }
      } else {
        setAuthUser(null);
        // Fall back to localStorage for non-authenticated users
        const localFlights = localStorage.getItem('flights-data');
        setFlights(localFlights ? JSON.parse(localFlights) : []);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save flights to Firestore when they change (for authenticated users)
  useEffect(() => {
    if (authUser && !authLoading) {
      const userDocRef = doc(db, 'users', authUser.uid);
      updateDoc(userDocRef, { flights: flights }).catch(console.error);
    } else if (!authUser && !authLoading) {
      // Save to localStorage for non-authenticated users
      localStorage.setItem('flights-data', JSON.stringify(flights));
    }
  }, [flights, authUser, authLoading]);

  useEffect(() => {
    const session = localStorage.getItem('user-profile');
    if (session) {
      setUser(JSON.parse(session));
    }

    // 1. Singleton Script Loading for GAPI
    if (!document.querySelector('script[src*="apis.google.com"]')) {
      const script1 = document.createElement('script');
      script1.src = "https://apis.google.com/js/api.js";
      script1.onload = () => {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: DISCOVERY_DOCS });
          setGapiInited(true);
        });
      };
      document.body.appendChild(script1);
    } else if (window.gapi && window.gapi.client) {
       setGapiInited(true);
    }

    if (!document.querySelector('script[src*="accounts.google.com"]')) {
      const script2 = document.createElement('script');
      script2.src = "https://accounts.google.com/gsi/client";
      script2.onload = () => {
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: '',
	    ux_mode: 'popup',
        });
        setTokenClient(client);
      };
      document.body.appendChild(script2);
    }

    
    // 2. Singleton Script Loading for Google Maps
    const mapScriptId = 'google-maps-script';
    
    // Global callback for async loading
    window.initFlightMaps = () => {
        if (window.google && window.google.maps) {
            geocoder.current = new window.google.maps.Geocoder();
        }
    };

    if (!document.getElementById(mapScriptId)) {
      const script3 = document.createElement('script');
      script3.id = mapScriptId;
      // Note: &callback=initFlightMaps is crucial for async loading to avoid race conditions
      script3.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&loading=async&callback=initFlightMaps`;
      script3.async = true;
      script3.defer = true;
      document.body.appendChild(script3);
    } else if (window.google && window.google.maps && window.google.maps.Geocoder) {
        geocoder.current = new window.google.maps.Geocoder();
    }
  }, []);

  // Close alliance dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openAllianceDropdown) {
        setOpenAllianceDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openAllianceDropdown]);

  // --- AUTHENTICATION HANDLERS ---
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setAuthError('This email is already registered. Try logging in.');
          break;
        case 'auth/weak-password':
          setAuthError('Password should be at least 6 characters.');
          break;
        case 'auth/invalid-email':
          setAuthError('Please enter a valid email address.');
          break;
        default:
          setAuthError(error.message);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setAuthError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setAuthError('Incorrect password.');
          break;
        case 'auth/invalid-email':
          setAuthError('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setAuthError('Too many failed attempts. Please try again later.');
          break;
        default:
          setAuthError('Invalid email or password.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in failed. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
    setShowAuthModal(true);
  };

  // --- IMPROVED LANDMARK DETECTION ---
  // Check if a point is within an ocean's bounding box
  const isPointInOceanBounds = (point, ocean) => {
    const { minLat, maxLat, minLon, maxLon } = ocean.bounds;
    
    // Handle longitude wrap-around for areas crossing the date line
    if (minLon > maxLon) {
      // Crosses date line (e.g., Bering Sea)
      return point.lat >= minLat && point.lat <= maxLat && 
             (point.lon >= minLon || point.lon <= maxLon);
    }
    
    return point.lat >= minLat && point.lat <= maxLat && 
           point.lon >= minLon && point.lon <= maxLon;
  };

  // Check if a point is near a landmark
  const isPointNearLandmark = (point, landmark) => {
    const dist = calculateDistance(point.lat, point.lon, landmark.lat, landmark.lon);
    return dist <= landmark.radius;
  };

  // Main hybrid detection function
  const detectLandmarksHybrid = async (origin, dest) => {
    const steps = 20; // Increased from 12 for better coverage
    const detected = new Set();
    const landPointsFound = []; // Track which points are confirmed over land
    
    // First pass: Check all points against our landmarks database
    for (let i = 1; i < steps; i++) {
      const point = getIntermediatePoint(origin.lat, origin.lon, dest.lat, dest.lon, i / steps);
      
      if (!point || isNaN(point.lat) || isNaN(point.lon)) continue;
      
      // Check against landmarks database
      LANDMARKS_DB.forEach(landmark => {
        if (isPointNearLandmark(point, landmark)) {
          detected.add(landmark.name);
        }
      });
    }
    
    // Second pass: Use geocoding to verify water vs land and detect additional features
    if (geocoder.current) {
      // Sample fewer points for geocoding to stay within rate limits
      const geocodeSteps = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9];
      
      for (let frac of geocodeSteps) {
        const point = getIntermediatePoint(origin.lat, origin.lon, dest.lat, dest.lon, frac);
        
        if (!point || isNaN(point.lat) || isNaN(point.lon)) continue;
        
        setStatusMsg(`Scanning point ${Math.round(frac * 100)}%...`);
        
        try {
          await new Promise(r => setTimeout(r, 300));
          
          const googlePoint = { lat: point.lat, lng: point.lon };
          
          const results = await new Promise((resolve) => {
            geocoder.current.geocode({ location: googlePoint }, (res, status) => resolve({res, status}));
          });
          
          if (results.status === "OK" && results.res && results.res.length > 0) {
            // We got land results - this point is over land
            landPointsFound.push(point);
            
            // Check for additional features from geocoding
            results.res.forEach(r => {
              const types = r.types || [];
              if (types.includes('natural_feature') || types.includes('park') || types.includes('establishment')) {
                r.address_components?.forEach(comp => {
                  const compTypes = comp.types || [];
                  // Skip administrative areas
                  if (compTypes.includes('country') || 
                      compTypes.includes('administrative_area_level_1') ||
                      compTypes.includes('administrative_area_level_2') ||
                      compTypes.includes('locality')) {
                    return;
                  }
                  
                  const name = comp.long_name;
                  // Look for meaningful natural features
                  if (name.includes("National Park") || 
                      name.includes("National Forest") ||
                      name.includes("National Monument") ||
                      name.includes("Wilderness") ||
                      name.includes("Mountain") ||
                      name.includes("Lake") ||
                      name.includes("River") ||
                      name.includes("Canyon") ||
                      name.includes("Desert") ||
                      name.includes("Valley")) {
                    detected.add(name);
                  }
                });
              }
            });
          } else if (results.status === "ZERO_RESULTS") {
            // No results means we're over water - check oceans
            checkOceansImproved(point, detected);
          }
        } catch (e) { 
          console.warn("Geocoding skip:", e); 
        }
      }
    }
    
    setStatusMsg('');
    return Array.from(detected);
  };

  // Improved ocean checking using bounding boxes
  const checkOceansImproved = (point, detectedSet) => {
    OCEANS_DB.forEach(ocean => {
      if (isPointInOceanBounds(point, ocean)) {
        detectedSet.add(ocean.name);
      }
    });
  };

  // --- GMAIL LOGIC ---
  const extractFlightInfo = (message) => {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const dateHeader = headers.find(h => h.name === 'Date')?.value || '';
    const fullText = (subject + " " + message.snippet + " " + decodeEmailBody(message.payload)).replace(/\s+/g, ' ');

    const isTicket = /ticket number|booking ref|confirmation code|eticket|itinerary/i.test(fullText);
    if (!isTicket) return null;

    const originRegex = /(?:from|depart|departure|origin)[\s\S]{0,50}?\(?([A-Z]{3})\)?/i;
    const destRegex = /(?:to|arrive|arrival|destination)[\s\S]{0,50}?\(?([A-Z]{3})\)?/i;
    const simpleRouteRegex = /\b([A-Z]{3})\s*(?:to|-|->|–)\s*([A-Z]{3})\b/i;

    let origin = '', destination = '';
    const simpleMatch = fullText.match(simpleRouteRegex);
    if (simpleMatch) {
      origin = simpleMatch[1];
      destination = simpleMatch[2];
    } else {
      const originMatch = fullText.match(originRegex);
      const destMatch = fullText.match(destRegex);
      if (originMatch) origin = originMatch[1];
      if (destMatch) destination = destMatch[1];
    }

    const flightNumRegex = /([A-Z]{2}|[A-Z]\d|\d[A-Z])\s?(\d{3,4})\b/; 
    const numMatch = fullText.match(flightNumRegex);
    let flightNum = numMatch ? numMatch[0].replace(/\s/g, '').toUpperCase() : '';

    // Try to extract airline from email sender or content
    const airlines = [
      'United', 'Delta', 'American', 'Southwest', 'JetBlue', 'Alaska', 'Spirit', 'Frontier',
      'British Airways', 'Lufthansa', 'Air France', 'KLM', 'Emirates', 'Qatar Airways',
      'Singapore Airlines', 'Cathay Pacific', 'ANA', 'JAL', 'Turkish Airlines', 'Qantas',
      'Virgin Atlantic', 'Air Canada', 'Aeromexico', 'LATAM', 'Iberia', 'Swiss', 'Austrian'
    ];
    let detectedAirline = '';
    for (const airline of airlines) {
      if (fullText.toLowerCase().includes(airline.toLowerCase()) || 
          from.toLowerCase().includes(airline.toLowerCase())) {
        detectedAirline = airline;
        break;
      }
    }

    if (!origin || !destination) return null;

    const flightDate = new Date(dateHeader);
    const formattedDate = flightDate.toISOString().split('T')[0];

    return {
      id: message.id,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date: formattedDate,
      flightNumber: flightNum,
      airline: detectedAirline,
      aircraftType: 'Unknown',
      serviceClass: 'Economy',
      snippet: message.snippet.substring(0, 80) + "..."
    };
  };

  const handleGmailImport = () => {
    setImporting(true);
    tokenClient.callback = async (resp) => {
      if (resp.error) {
        setImporting(false);
        alert("Auth failed.");
        return;
      }
      try {
        const response = await window.gapi.client.gmail.users.messages.list({
          'userId': 'me',
          'q': 'subject:(flight OR confirmation OR ticket) AND ("ticket number" OR "booking reference" OR "eticket")',
          'maxResults': 15
        });

        const messages = response.result.messages || [];
        const suggestions = [];

        for (let msg of messages) {
          const details = await window.gapi.client.gmail.users.messages.get({ 
            'userId': 'me', 'id': msg.id, 'format': 'full' 
          });
          const flight = extractFlightInfo(details.result);
          if (flight && !suggestions.find(s => s.id === flight.id)) {
            suggestions.push(flight);
          }
        }
        setSuggestedFlights(suggestions);
        setShowImport(true);
      } catch (err) {
        console.error("Gmail Import Error:", err);
        alert("An error occurred while scanning emails.");
      } finally {
        setImporting(false);
      }
    };
    if (window.gapi.client.getToken() === null) tokenClient.requestAccessToken({prompt: 'consent'});
    else tokenClient.requestAccessToken({prompt: ''});
  };

  // --- SAVE & IMPORT LOGIC ---
  const handleSaveOrImport = async (flightData, isImport = false) => {
    setIsVerifying(true);
    setStatusMsg('Verifying Airports...');
    try {
        const from = await fetchAirportData(flightData.origin);
        const to = await fetchAirportData(flightData.destination);

        // STRICT VALIDATION: Check if airports exist AND have valid numbers
        if (!from || !to || isNaN(from.lat) || isNaN(from.lon) || isNaN(to.lat) || isNaN(to.lon)) {
            alert(`Could not verify airports: ${flightData.origin} or ${flightData.destination}. Please check the codes.`);
            setIsVerifying(false);
            setStatusMsg('');
            return;
        }

        // Build legs array
        let legs = [];
        let totalDistance = 0;
        let allFeatures = [];
        
        if (flightData.hasLayover && flightData.viaAirports && flightData.viaAirports.some(v => v.trim())) {
            // Filter out empty via airports
            const validVias = flightData.viaAirports.filter(v => v.trim());
            
            // Verify all via airports
            const viaData = [];
            for (let i = 0; i < validVias.length; i++) {
                setStatusMsg(`Verifying connection ${i + 1}: ${validVias[i]}...`);
                const viaAirport = await fetchAirportData(validVias[i]);
                if (!viaAirport || isNaN(viaAirport.lat) || isNaN(viaAirport.lon)) {
                    alert(`Could not verify connection airport: ${validVias[i]}. Please check the code.`);
                    setIsVerifying(false);
                    setStatusMsg('');
                    return;
                }
                viaData.push(viaAirport);
            }
            
            // Build legs: origin -> via1 -> via2 -> ... -> destination
            const allStops = [from, ...viaData, to];
            const legAirlines = flightData.legAirlines || [];
            const legAircraftTypes = flightData.legAircraftTypes || [];
            const legServiceClasses = flightData.legServiceClasses || [];
            
            for (let i = 0; i < allStops.length - 1; i++) {
                const legFrom = allStops[i];
                const legTo = allStops[i + 1];
                const legDist = calculateDistance(legFrom.lat, legFrom.lon, legTo.lat, legTo.lon);
                totalDistance += legDist;
                
                // Detect landmarks for this leg if requested
                let legFeatures = [];
                if (flightData.checkLandmarks) {
                    setStatusMsg(`Analyzing leg ${i + 1}: ${legFrom.code} → ${legTo.code}...`);
                    legFeatures = await detectLandmarksHybrid(legFrom, legTo);
                    allFeatures = [...new Set([...allFeatures, ...legFeatures])];
                }
                
                legs.push({
                    origin: legFrom.code,
                    destination: legTo.code,
                    originCity: legFrom.city,
                    destCity: legTo.city,
                    airline: legAirlines[i] || flightData.airline || '',
                    aircraftType: legAircraftTypes[i] || flightData.aircraftType || '',
                    serviceClass: legServiceClasses[i] || flightData.serviceClass || 'Economy',
                    distance: legDist,
                    featuresCrossed: legFeatures
                });
            }
        } else {
            // Single leg flight (no layover)
            // Check if this is an edit with unchanged route
            const isEditWithSameRoute = editingFlight && 
                editingFlight.origin === flightData.origin && 
                editingFlight.destination === flightData.destination &&
                !editingFlight.legs; // Only if original was also single-leg

            let dist, features;
            
            if (isEditWithSameRoute) {
                dist = editingFlight.distance;
                features = editingFlight.featuresCrossed || [];
                setStatusMsg('Route unchanged, keeping landmarks...');
            } else {
                dist = calculateDistance(from.lat, from.lon, to.lat, to.lon);
                
                if (flightData.checkLandmarks) {
                    features = await detectLandmarksHybrid(from, to);
                } else {
                    const existingRouteFlights = flights.filter(f => 
                        f.origin === flightData.origin && f.destination === flightData.destination
                    );
                    if (existingRouteFlights.length > 0 && existingRouteFlights[0].featuresCrossed) {
                        features = existingRouteFlights[0].featuresCrossed;
                        setStatusMsg('Copied landmarks from existing route...');
                    } else {
                        features = [];
                    }
                }
            }
            
            totalDistance = dist;
            allFeatures = features;
            
            legs.push({
                origin: flightData.origin,
                destination: flightData.destination,
                originCity: from.city,
                destCity: to.city,
                airline: flightData.airline || '',
                aircraftType: flightData.aircraftType || '',
                serviceClass: flightData.serviceClass || 'Economy',
                distance: dist,
                featuresCrossed: features
            });
        }
        
        const pax = getPassengerEstimate(flightData.aircraftType);

        // Remove form-only fields from the data to be saved
        const { checkLandmarks, hasLayover, viaAirports, legAirlines, legAircraftTypes, legServiceClasses, ...flightDataToSave } = flightData;

        const newRecord = { 
            ...flightDataToSave, 
            id: flightData.id || Date.now(),
            distance: totalDistance,
            originCity: from.city, 
            destCity: to.city,
            featuresCrossed: allFeatures,
            passengerCount: pax,
            legs: legs, // Store all legs
            legCount: legs.length // Quick reference for stats
        };

        const updated = isImport 
            ? [newRecord, ...flights] 
            : (editingFlight ? flights.map(f => f.id === editingFlight.id ? newRecord : f) : [newRecord, ...flights]);

        setFlights(updated);
        localStorage.setItem('flights-data', JSON.stringify(updated));
        
        if (isImport) setSuggestedFlights(prev => prev.filter(f => f.id !== flightData.id));
        setShowForm(false);
        setEditingFlight(null);
        setFormData({ 
            origin: '', destination: '', date: '', aircraftType: '', airline: '', 
            serviceClass: 'Economy', checkLandmarks: false, hasLayover: false,
            viaAirports: [''], legAirlines: ['', ''], legAircraftTypes: ['', ''], legServiceClasses: ['Economy', 'Economy']
        });
    } catch (e) {
        console.error(e);
        alert("Error saving flight. Check console for details.");
    } finally {
        setIsVerifying(false);
        setStatusMsg('');
    }
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      handleSaveOrImport({ ...formData, id: editingFlight ? editingFlight.id : null });
  };

  const fetchAirportData = async (code) => {
    const cleanCode = code.trim().toUpperCase();
    const local = AIRPORTS_DATABASE.find(a => a.code === cleanCode);
    if (local) return local;
    
    try {
      const response = await fetch(`https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat`);
      const text = await response.text();
      const rows = text.split('\n');
      for (let row of rows) {
        if (row.includes(`"${cleanCode}"`)) {
          const parts = row.split(',');
          // Robust check for lat/lon parsing
          const lat = parseFloat(parts[parts.length - 8]);
          const lon = parseFloat(parts[parts.length - 7]);
          
          if (!isNaN(lat) && !isNaN(lon)) {
              return {
                code: cleanCode,
                city: parts[2].replace(/"/g, ''),
                lat: lat,
                lon: lon
              };
          }
        }
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const getPassengerEstimate = (aircraftType) => {
    const type = (aircraftType || "").toUpperCase();
    let capacity = 150;
    if (type.includes("380")) capacity = 500;
    else if (type.includes("747")) capacity = 416;
    else if (type.includes("777") || type.includes("350")) capacity = 350;
    else if (type.includes("787") || type.includes("330")) capacity = 250;
    else if (type.includes("767")) capacity = 220;
    else if (type.includes("CRJ") || type.includes("ERJ") || type.includes("EMB")) capacity = 70;
    return Math.round(capacity * 0.82);
  };

  // Estimate personal CO2 emissions in kg based on distance (miles) and service class
  // Base rate: ~0.14 kg CO2 per passenger-mile for economy (industry standard per-person rate)
  // Class multipliers account for seat space/fuel share per passenger
  const getCarbonEstimate = (distance, serviceClass) => {
    const baseRatePerMile = 0.14; // kg CO2 per passenger-mile for economy
    const classMultipliers = {
      'Economy': 1.0,
      'Premium Economy': 1.5,
      'Business': 2.5,
      'First': 4.0
    };
    const multiplier = classMultipliers[serviceClass] || 1.0;
    return Math.round(distance * baseRatePerMile * multiplier);
  };
  
  // Calculate total flights (counting each leg as a separate flight)
  const totalFlightLegs = flights.reduce((sum, f) => sum + (f.legCount || 1), 0);
  
  const totalMiles = flights.reduce((sum, f) => sum + (f.distance || 0), 0);
  const totalPassengers = flights.reduce((sum, f) => sum + (f.passengerCount || 0), 0);
  
  // Calculate total personal carbon footprint (per leg for multi-leg trips)
  const totalCarbonKg = flights.reduce((sum, f) => {
    if (f.legs && f.legs.length > 1) {
      // Multi-leg trip: calculate carbon per leg with its own service class
      return sum + f.legs.reduce((legSum, leg) => {
        return legSum + getCarbonEstimate(leg.distance || 0, leg.serviceClass || 'Economy');
      }, 0);
    } else {
      // Single leg trip
      return sum + getCarbonEstimate(f.distance || 0, f.serviceClass || 'Economy');
    }
  }, 0);
  const totalCarbonTons = (totalCarbonKg / 1000).toFixed(2);

  // Calculate total flight emissions (entire aircraft)
  // Using average ~0.14 kg CO2 per passenger-mile * estimated passengers
  const totalFlightCarbonKg = flights.reduce((sum, f) => {
    const passengerCount = f.passengerCount || getPassengerEstimate(f.aircraftType);
    const flightEmissions = (f.distance || 0) * 0.14 * passengerCount;
    return sum + flightEmissions;
  }, 0);
  const totalFlightCarbonTons = (totalFlightCarbonKg / 1000).toFixed(1);
  
  const featureStats = {};
  flights.forEach(f => {
    if (f.featuresCrossed) {
      f.featuresCrossed.forEach(feat => {
        featureStats[feat] = (featureStats[feat] || 0) + 1;
      });
    }
  });
  const topFeatures = Object.entries(featureStats).sort((a,b) => b[1]-a[1]).slice(0, 5);

  // Airline statistics (count per leg for multi-leg trips)
  const airlineStats = {};
  flights.forEach(f => {
    if (f.legs && f.legs.length > 1) {
      // Multi-leg trip: count each leg's airline
      f.legs.forEach(leg => {
        if (leg.airline) {
          airlineStats[leg.airline] = (airlineStats[leg.airline] || 0) + 1;
        }
      });
    } else if (f.airline) {
      // Single leg trip
      airlineStats[f.airline] = (airlineStats[f.airline] || 0) + 1;
    }
  });
  const topAirlines = Object.entries(airlineStats).sort((a,b) => b[1]-a[1]).slice(0, 5);

  // Aircraft statistics (count per trip, not per leg, since aircraft is per trip)
  const aircraftStats = {};
  flights.forEach(f => {
    if (f.aircraftType && f.aircraftType !== 'Unknown') {
      aircraftStats[f.aircraftType] = (aircraftStats[f.aircraftType] || 0) + 1;
    }
  });
  const topAircraft = Object.entries(aircraftStats).sort((a,b) => b[1]-a[1]).slice(0, 5);

  // Alliance statistics (count per leg for multi-leg trips)
  const allianceStats = {};
  let totalFlightsWithAirlines = 0; // Count of flights/legs that have airline info
  flights.forEach(f => {
    if (f.legs && f.legs.length > 1) {
      // Multi-leg trip: count each leg's alliance
      f.legs.forEach(leg => {
        if (leg.airline) {
          const alliance = getAirlineAlliance(leg.airline);
          allianceStats[alliance] = (allianceStats[alliance] || 0) + 1;
          totalFlightsWithAirlines++;
        }
      });
    } else if (f.airline) {
      // Single leg trip
      const alliance = getAirlineAlliance(f.airline);
      allianceStats[alliance] = (allianceStats[alliance] || 0) + 1;
      totalFlightsWithAirlines++;
    }
  });
  const sortedAlliances = Object.entries(allianceStats)
    .sort((a, b) => b[1] - a[1]);
  const dominantAlliance = sortedAlliances.length > 0 ? sortedAlliances[0][0] : null;

  // Service class statistics (count per leg for multi-leg trips)
  const classStats = {};
  flights.forEach(f => {
    if (f.legs && f.legs.length > 1) {
      // Multi-leg trip: count each leg's service class
      f.legs.forEach(leg => {
        const cls = leg.serviceClass || 'Economy';
        classStats[cls] = (classStats[cls] || 0) + 1;
      });
    } else if (f.serviceClass) {
      // Single leg trip
      classStats[f.serviceClass] = (classStats[f.serviceClass] || 0) + 1;
    }
  });
  const classOrder = ['First', 'Business', 'Premium Economy', 'Economy'];
  const sortedClasses = Object.entries(classStats).sort((a, b) => {
    return classOrder.indexOf(a[0]) - classOrder.indexOf(b[0]);
  });

  // Personal carbon footprint by class (calculated per leg for multi-leg trips)
  const carbonByClass = {};
  flights.forEach(f => {
    if (f.legs && f.legs.length > 1) {
      // Multi-leg trip: calculate carbon per leg with its own service class
      f.legs.forEach(leg => {
        const cls = leg.serviceClass || 'Economy';
        const carbon = getCarbonEstimate(leg.distance || 0, cls);
        carbonByClass[cls] = (carbonByClass[cls] || 0) + carbon;
      });
    } else {
      // Single leg trip
      const cls = f.serviceClass || 'Economy';
      const carbon = getCarbonEstimate(f.distance || 0, cls);
      carbonByClass[cls] = (carbonByClass[cls] || 0) + carbon;
    }
  });
  const sortedCarbonByClass = Object.entries(carbonByClass).sort((a, b) => b[1] - a[1]);

  // Group flights by route for consolidated display
  const groupedFlights = flights.reduce((acc, flight) => {
    const routeKey = `${flight.origin}-${flight.destination}`;
    if (!acc[routeKey]) {
      acc[routeKey] = {
        origin: flight.origin,
        destination: flight.destination,
        originCity: flight.originCity,
        destCity: flight.destCity,
        featuresCrossed: flight.featuresCrossed,
        distance: flight.distance,
        flights: []
      };
    }
    acc[routeKey].flights.push(flight);
    return acc;
  }, {});

  // Sort flights within each group by date (newest first)
  Object.values(groupedFlights).forEach(group => {
    group.flights.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // Convert to array and sort by most recent flight date
  const sortedGroups = Object.values(groupedFlights).sort((a, b) => {
    const aDate = new Date(a.flights[0].date);
    const bDate = new Date(b.flights[0].date);
    return bDate - aDate;
  });

  // Handler to copy/duplicate a flight
  const handleCopyFlight = (flight) => {
    setEditingFlight(null); // Not editing, creating new
    
    // Check if flight has multiple legs
    const hasMultipleLegs = flight.legs && flight.legs.length > 1;
    
    if (hasMultipleLegs) {
      // Extract via airports and leg details from legs
      const viaAirports = flight.legs.slice(1, -1).map(leg => leg.origin);
      const legAirlines = flight.legs.map(leg => leg.airline || '');
      const legAircraftTypes = flight.legs.map(leg => leg.aircraftType || '');
      const legServiceClasses = flight.legs.map(leg => leg.serviceClass || 'Economy');
      
      setFormData({
        origin: flight.origin,
        destination: flight.destination,
        airline: '',
        aircraftType: '',
        serviceClass: 'Economy',
        date: '', // Clear date so user must enter new one
        checkLandmarks: false,
        hasLayover: true,
        viaAirports: viaAirports.length > 0 ? viaAirports : [''],
        legAirlines: legAirlines,
        legAircraftTypes: legAircraftTypes,
        legServiceClasses: legServiceClasses
      });
    } else {
      const singleLeg = flight.legs && flight.legs[0];
      setFormData({
        origin: flight.origin,
        destination: flight.destination,
        airline: flight.airline || (singleLeg ? singleLeg.airline : '') || '',
        aircraftType: flight.aircraftType || (singleLeg ? singleLeg.aircraftType : '') || '',
        serviceClass: flight.serviceClass || (singleLeg ? singleLeg.serviceClass : '') || 'Economy',
        date: '', // Clear date so user must enter new one
        checkLandmarks: false,
        hasLayover: false,
        viaAirports: [''],
        legAirlines: ['', ''],
        legAircraftTypes: ['', ''],
        legServiceClasses: ['Economy', 'Economy']
      });
    }
    setShowForm(true);
  };

  // Handler to edit a specific flight within a group
  const handleEditFlight = (flight) => {
    setEditingFlight(flight);
    
    // Check if flight has multiple legs
    const hasMultipleLegs = flight.legs && flight.legs.length > 1;
    
    if (hasMultipleLegs) {
      // Extract via airports (middle stops) and leg details from legs
      const viaAirports = [];
      for (let i = 1; i < flight.legs.length; i++) {
        viaAirports.push(flight.legs[i].origin);
      }
      const legAirlines = flight.legs.map(leg => leg.airline || '');
      const legAircraftTypes = flight.legs.map(leg => leg.aircraftType || '');
      const legServiceClasses = flight.legs.map(leg => leg.serviceClass || 'Economy');
      
      setFormData({
        origin: flight.origin,
        destination: flight.destination,
        airline: '',
        aircraftType: '',
        serviceClass: 'Economy',
        date: flight.date || '',
        checkLandmarks: false,
        hasLayover: true,
        viaAirports: viaAirports.length > 0 ? viaAirports : [''],
        legAirlines: legAirlines,
        legAircraftTypes: legAircraftTypes,
        legServiceClasses: legServiceClasses
      });
    } else {
      const singleLeg = flight.legs && flight.legs[0];
      setFormData({
        origin: flight.origin,
        destination: flight.destination,
        airline: flight.airline || (singleLeg ? singleLeg.airline : '') || '',
        aircraftType: flight.aircraftType || (singleLeg ? singleLeg.aircraftType : '') || '',
        serviceClass: flight.serviceClass || (singleLeg ? singleLeg.serviceClass : '') || 'Economy',
        date: flight.date || '',
        checkLandmarks: false,
        hasLayover: false,
        viaAirports: [''],
        legAirlines: ['', ''],
        legAircraftTypes: ['', ''],
        legServiceClasses: ['Economy', 'Economy']
      });
    }
    setShowForm(true);
  };

  // Handler to delete a specific flight
  const handleDeleteFlight = (flightId) => {
    const updated = flights.filter(x => x.id !== flightId);
    setFlights(updated);
    localStorage.setItem('flights-data', JSON.stringify(updated));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ margin: 0 }}>FlightLog</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Auth UI */}
          {authLoading ? (
            <Loader2 className="animate-spin" size={20} style={{ color: '#888' }} />
          ) : authUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 12px', 
                background: '#f0fdf4', 
                borderRadius: '20px',
                fontSize: '13px',
                color: '#166534'
              }}>
                <User size={16} />
                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {authUser.email}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid #ddd', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: '#666'
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => openAuthModal('login')}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid #ddd', 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}
              >
                <LogIn size={16} /> Log In
              </button>
              <button 
                onClick={() => openAuthModal('signup')}
                style={{ 
                  background: '#10b981', 
                  color: '#fff',
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <User size={16} /> Sign Up
              </button>
            </div>
          )}
          
          <button 
            onClick={handleGmailImport} 
            disabled={!gapiInited || importing}
            style={{ background: '#4285F4', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems:'center' }}
          >
            {importing ? <Loader2 className="animate-spin" size={18}/> : <Mail size={18}/>}
            {importing ? "Scanning..." : "Sync Gmail"}
          </button>
          <button onClick={() => { 
            setEditingFlight(null); 
            setFormData({ 
              origin: '', destination: '', date: '', aircraftType: '', airline: '', 
              serviceClass: 'Economy', checkLandmarks: false, hasLayover: false,
              viaAirports: [''], legAirlines: ['', ''], legAircraftTypes: ['', ''], legServiceClasses: ['Economy', 'Economy']
            });
            setShowForm(true); 
          }} style={{ background: '#000', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Manual Add
          </button>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={modalOverlay}>
          <div style={{...modalContent, maxWidth: '400px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0}}>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <X style={{cursor:'pointer'}} onClick={() => setShowAuthModal(false)}/>
            </div>
            
            {authError && (
              <div style={{ 
                background: '#fef2f2', 
                color: '#dc2626', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '15px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                {authError}
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} style={{ display: 'grid', gap: '15px' }}>
              <input 
                type="email" 
                placeholder="Email address" 
                required 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)} 
                style={inputStyle} 
              />
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Password" 
                  required 
                  value={authPassword} 
                  onChange={e => setAuthPassword(e.target.value)} 
                  style={{...inputStyle, paddingRight: '45px'}} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#888'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button 
                type="submit" 
                style={{ 
                  background: authMode === 'login' ? '#000' : '#10b981', 
                  color: '#fff', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  cursor: 'pointer' 
                }}
              >
                {authMode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
              <span style={{ color: '#888', fontSize: '12px' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
            </div>

            <button 
              onClick={handleGoogleSignIn}
              style={{ 
                width: '100%',
                background: '#fff', 
                border: '1px solid #ddd',
                padding: '12px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '14px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }}>
              {authMode === 'login' ? (
                <>Don't have an account? <button onClick={() => setAuthMode('signup')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: '600' }}>Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontWeight: '600' }}>Log in</button></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Info banner for non-authenticated users */}
      {!authLoading && !authUser && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '12px', 
          padding: '16px', 
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <AlertCircle size={20} color="#d97706" />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <strong style={{ color: '#92400e' }}>Your data is stored locally.</strong>
            <span style={{ color: '#a16207', marginLeft: '8px' }}>Sign up to sync your flights across devices and never lose your data.</span>
          </div>
          <button 
            onClick={() => openAuthModal('signup')}
            style={{ 
              background: '#f59e0b', 
              color: '#fff', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            Sign Up Free
          </button>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div style={modalOverlay}>
          <div style={{...modalContent, maxWidth: '600px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h2>Flights Found ({suggestedFlights.length})</h2>
              <X style={{cursor:'pointer'}} onClick={() => setShowImport(false)}/>
            </div>
            {suggestedFlights.length === 0 ? (
              <div style={{textAlign:'center', padding:'20px', color:'#666'}}>
                <AlertCircle size={30} style={{marginBottom:'10px'}}/>
                <p>No new flight emails found.</p>
              </div>
            ) : (
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {suggestedFlights.map(f => (
                  <div key={f.id} style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{flex: 1, marginRight:'15px'}}>
                      <div style={{fontWeight:'bold'}}>{f.origin} → {f.destination}</div>
                      <div style={{fontSize:'12px', color:'#666'}}>
                        {formatDate(f.date)}
                        {f.airline && <span style={{marginLeft:'8px'}}>• {f.airline}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleSaveOrImport(f, true)} style={{background: '#00C851', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px'}}>
                      <Check size={14} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={statCard}>
          <Plane size={20}/>
          <div style={statVal}>{totalFlightLegs}</div>
          <div style={statLbl}>Total Flights</div>
          {flights.length !== totalFlightLegs && (
            <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>({flights.length} trips)</div>
          )}
        </div>
        <div style={statCard}><Globe size={20}/><div style={statVal}>{totalMiles.toLocaleString()}</div><div style={statLbl}>Total Miles</div></div>
        <div style={statCard}><Map size={20}/><div style={statVal}>{Object.keys(groupedFlights).length}</div><div style={statLbl}>Unique Routes</div></div>
        <div style={statCard}><CloudRain size={20} color="#dc2626"/><div style={statVal}>{totalCarbonTons}</div><div style={statLbl}>Your CO₂ (tons)</div></div>
        {dominantAlliance && dominantAlliance !== 'Independent' && (
          <div style={{
            ...statCard,
            background: ALLIANCE_STYLES[dominantAlliance].background,
            borderColor: ALLIANCE_STYLES[dominantAlliance].color
          }}>
            <span style={{ fontSize: '20px' }}>{ALLIANCE_STYLES[dominantAlliance].icon}</span>
            <div style={{...statVal, color: ALLIANCE_STYLES[dominantAlliance].color, fontSize: '18px'}}>{dominantAlliance}</div>
            <div style={statLbl}>Top Alliance</div>
          </div>
        )}
        <div style={statCard}><Trophy size={20}/><div style={statVal}>{((totalMiles / 238855) * 100).toFixed(2)}%</div><div style={statLbl}>To the Moon</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {/* Top Airlines Chart */}
        {flights.length > 0 && topAirlines.length > 0 && (
          <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}><Plane size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Top Airlines</h3>
            {topAirlines.map(([name, count]) => (
              <div key={name} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{name}</span><span>{count} flights</span></div>
                <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                  <div style={{ height: '100%', background: '#4285F4', borderRadius: '4px', width: `${(count/flights.length)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Aircraft Chart */}
        {flights.length > 0 && topAircraft.length > 0 && (
          <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}><BarChart3 size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Top Aircraft</h3>
            {topAircraft.map(([name, count]) => (
              <div key={name} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{name}</span><span>{count} flights</span></div>
                <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                  <div style={{ height: '100%', background: '#f97316', borderRadius: '4px', width: `${(count/flights.length)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Class of Service Chart */}
        {flights.length > 0 && sortedClasses.length > 0 && (
          <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}><Trophy size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Class of Service</h3>
            {sortedClasses.map(([name, count]) => {
              const barColor = name === 'Economy' ? '#d97706' : 
                               name === 'Premium Economy' ? '#16a34a' : 
                               name === 'Business' ? '#2563eb' : 
                               '#ca8a04'; /* First - gold */
              const displayName = name === 'Economy' ? '🐔 Chicken class' : 
                                  name === 'Premium Economy' ? '💺 Premium Economy' :
                                  name === 'Business' ? '💼 Business' :
                                  '👑 First';
              return (
                <div key={name} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span>{displayName}</span>
                    <span>{count} flights</span>
                  </div>
                  <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                    <div style={{ height: '100%', background: barColor, borderRadius: '4px', width: `${(count/flights.length)*100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Alliance Breakdown Chart */}
        {flights.length > 0 && sortedAlliances.length > 0 && (
          <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}><Users size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Airline Alliances</h3>
            {sortedAlliances.map(([alliance, count]) => {
              const style = ALLIANCE_STYLES[alliance] || ALLIANCE_STYLES['Independent'];
              const dropdownId = `chart-alliance-${alliance}`;
              const isOpen = openAllianceDropdown === dropdownId;
              const members = ALLIANCE_MEMBERS_DISPLAY[alliance] || [];
              const hasDropdown = alliance !== 'Independent' && members.length > 0;
              
              return (
                <div key={alliance} style={{ marginBottom: '15px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span 
                      onClick={(e) => {
                        if (hasDropdown) {
                          e.stopPropagation();
                          setOpenAllianceDropdown(isOpen ? null : dropdownId);
                        }
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        cursor: hasDropdown ? 'pointer' : 'default',
                        padding: '4px 8px',
                        marginLeft: '-8px',
                        borderRadius: '6px',
                        background: isOpen ? style.background : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                      title={hasDropdown ? `Click to see all ${alliance} members` : ''}
                    >
                      <span>{style.icon}</span>
                      {alliance}
                      {hasDropdown && (
                        <span style={{ 
                          fontSize: '10px', 
                          color: '#888',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}>▼</span>
                      )}
                    </span>
                    <span>{count} flights ({Math.round((count/totalFlightsWithAirlines)*100)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                    <div style={{ 
                      height: '100%', 
                      background: style.color, 
                      borderRadius: '4px', 
                      width: `${(count/totalFlightsWithAirlines)*100}%` 
                    }} />
                  </div>
                  
                  {/* Alliance Members Dropdown */}
                  {isOpen && members.length > 0 && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        marginTop: '8px',
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        border: `1px solid ${style.color}20`,
                        zIndex: 1000,
                        minWidth: '260px',
                        maxHeight: '350px',
                        overflowY: 'auto'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid #eee',
                        background: style.background,
                        borderRadius: '12px 12px 0 0',
                        position: 'sticky',
                        top: 0
                      }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: style.color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '15px'
                        }}>
                          <span>{style.icon}</span>
                          {alliance}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {members.length} member airlines worldwide
                        </div>
                      </div>
                      <div style={{ padding: '8px 0' }}>
                        {members.map((member, idx) => {
                          // Check if user has flown this airline
                          const hasFlown = flights.some(f => 
                            f.airline && (
                              member.toLowerCase().includes(f.airline.toLowerCase()) ||
                              f.airline.toLowerCase().includes(member.split(' ')[0].toLowerCase())
                            )
                          );
                          return (
                            <div 
                              key={idx}
                              style={{
                                padding: '10px 18px',
                                fontSize: '13px',
                                color: hasFlown ? style.color : '#555',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: hasFlown ? style.background : 'transparent',
                                fontWeight: hasFlown ? '600' : 'normal',
                                borderLeft: hasFlown ? `3px solid ${style.color}` : '3px solid transparent'
                              }}
                            >
                              <span style={{ color: hasFlown ? style.color : '#999' }}>✈</span>
                              {member}
                              {hasFlown && (
                                <span style={{ 
                                  fontSize: '9px', 
                                  background: style.color, 
                                  color: '#fff',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  marginLeft: 'auto'
                                }}>
                                  FLOWN
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {dominantAlliance && dominantAlliance !== 'Independent' && (
              <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                background: ALLIANCE_STYLES[dominantAlliance].background, 
                borderRadius: '8px',
                fontSize: '13px',
                color: ALLIANCE_STYLES[dominantAlliance].color,
                textAlign: 'center'
              }}>
                {ALLIANCE_STYLES[dominantAlliance].icon} You're a <strong>{dominantAlliance}</strong> loyalist!
              </div>
            )}
          </div>
        )}
        
        {/* Top Landmarks Chart */}
        {flights.length > 0 && (
          <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}><Mountain size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Top Landmarks</h3>
            {topFeatures.length === 0 ? <p style={{color:'#666', fontSize:'13px'}}>No landmarks detected yet.</p> : topFeatures.map(([name, count]) => (
              <div key={name} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{name}</span><span>{count} times</span></div>
                <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                  <div style={{ height: '100%', background: '#008080', borderRadius: '4px', width: `${(count/flights.length)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carbon Footprint Breakdown */}
        {flights.length > 0 && totalCarbonKg > 0 && (
          <div style={{ background: '#fef2f2', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0, color: '#991b1b' }}><CloudRain size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Your Carbon Footprint</h3>
            
            {/* Personal vs Total Flight comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{totalCarbonTons}t</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Your emissions</div>
              </div>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9ca3af' }}>{totalFlightCarbonTons}t</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Total flights' emissions</div>
              </div>
            </div>

            {/* Driving comparison */}
            <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>🚗 If you drove {totalMiles.toLocaleString()} miles instead:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{(totalMiles * 0.21 / 1000).toFixed(2)}t</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>CO₂ by car</span>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px', 
                  borderRadius: '12px',
                  background: totalCarbonKg < (totalMiles * 0.21) ? '#dcfce7' : '#fef3c7',
                  color: totalCarbonKg < (totalMiles * 0.21) ? '#166534' : '#854d0e'
                }}>
                  {totalCarbonKg < (totalMiles * 0.21) 
                    ? `✈️ Flying saved ${((totalMiles * 0.21 - totalCarbonKg) / 1000).toFixed(2)}t`
                    : `🚗 Driving would save ${((totalCarbonKg - totalMiles * 0.21) / 1000).toFixed(2)}t`
                  }
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Your breakdown by class:</div>
            {sortedCarbonByClass.map(([name, carbonKg]) => {
              const barColor = name === 'Economy' ? '#d97706' : 
                               name === 'Premium Economy' ? '#16a34a' : 
                               name === 'Business' ? '#2563eb' : 
                               '#ca8a04';
              const displayName = name === 'Economy' ? '🐔 Chicken' : 
                                  name === 'Premium Economy' ? '💺 Prem Eco' :
                                  name === 'Business' ? '💼 Business' :
                                  '👑 First';
              return (
                <div key={name} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>{displayName}</span>
                    <span>{(carbonKg / 1000).toFixed(2)}t ({Math.round(carbonKg / totalCarbonKg * 100)}%)</span>
                  </div>
                  <div style={{ height: '6px', background: '#fecaca', borderRadius: '3px' }}>
                    <div style={{ height: '100%', background: barColor, borderRadius: '3px', width: `${(carbonKg/totalCarbonKg)*100}%` }} />
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: '11px', color: '#888', marginTop: '16px', borderTop: '1px solid #fecaca', paddingTop: '12px' }}>
              💡 Your share: ~{((totalCarbonKg / totalFlightCarbonKg) * 100).toFixed(1)}% of total aircraft emissions. Premium classes have larger footprints due to increased seat space.<br/>
              <span style={{ color: '#aaa' }}>Calculated on the base rate of 0.14 kg CO₂ per passenger-mile (flying) and 0.21 kg CO₂ per mile (driving).</span>
            </div>
          </div>
        )}
      </div>

      {/* Flight List - Consolidated by Route */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {sortedGroups.map(group => (
          <div key={`${group.origin}-${group.destination}`} style={{ border: '1px solid #eee', borderRadius: '16px', padding: '24px' }}>
            {/* Route Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{group.origin} → {group.destination}</span>
                <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                  {group.originCity} to {group.destCity}
                  {group.distance && <span style={{ marginLeft: '10px', color: '#888' }}>• {group.distance.toLocaleString()} mi</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#888', background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px' }}>
                  {group.flights.length} flight{group.flights.length > 1 ? 's' : ''}
                </span>
                <Copy 
                  size={16} 
                  style={{ cursor: 'pointer', color: '#666' }} 
                  title="Copy this route"
                  onClick={() => handleCopyFlight(group.flights[0])} 
                />
              </div>
            </div>

            {/* Landmarks */}
            {group.featuresCrossed && group.featuresCrossed.length > 0 && (
              <div style={{marginTop:'12px', marginBottom: '16px', display:'flex', flexWrap:'wrap', gap:'8px'}}>
                {group.featuresCrossed.map(feat => (
                  <span key={feat} style={{fontSize:'11px', background:'#e0f2f1', color:'#004d40', padding:'4px 8px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'4px', fontWeight:'600'}}>
                    <Globe size={10}/> {feat}
                  </span>
                ))}
              </div>
            )}

            {/* Individual Flights List */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '8px' }}>
              {group.flights.map((f, idx) => {
                const flightCO2 = getCarbonEstimate(f.distance || 0, f.serviceClass || 'Economy');
                const drivingCO2 = (f.distance || 0) * 0.21;
                const co2Diff = drivingCO2 - flightCO2;
                const hasMultipleLegs = f.legs && f.legs.length > 1;
                
                return (
                <div 
                  key={f.id} 
                  style={{ 
                    padding: '12px 0',
                    borderBottom: idx < group.flights.length - 1 ? '1px solid #f5f5f5' : 'none'
                  }}
                >
                  {/* Trip Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: hasMultipleLegs ? '10px' : '0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', minWidth: '90px' }}>
                        {formatDate(f.date)}
                      </span>
                      
                      {/* Show leg count badge for multi-leg trips */}
                      {hasMultipleLegs && (
                        <span style={{ 
                          fontSize: '10px', 
                          color: '#6366f1', 
                          background: '#eef2ff', 
                          padding: '3px 8px', 
                          borderRadius: '10px',
                          fontWeight: '600'
                        }}>
                          {f.legs.length} LEGS
                        </span>
                      )}
                      
                      {/* Single leg flight - show airline inline */}
                      {!hasMultipleLegs && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {f.airline && (
                            <span style={{ fontSize: '12px', color: '#555', background: '#f5f5f5', padding: '3px 8px', borderRadius: '6px' }}>
                              {f.airline}
                            </span>
                          )}
                          {f.airline && (() => {
                            const alliance = getAirlineAlliance(f.airline);
                            const style = ALLIANCE_STYLES[alliance] || ALLIANCE_STYLES['Independent'];
                            const dropdownId = `alliance-${f.id}`;
                            const isOpen = openAllianceDropdown === dropdownId;
                            const members = ALLIANCE_MEMBERS_DISPLAY[alliance] || [];
                            
                            return (
                              <div style={{ position: 'relative' }}>
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (alliance !== 'Independent' && members.length > 0) {
                                      setOpenAllianceDropdown(isOpen ? null : dropdownId);
                                    }
                                  }}
                                  style={{ 
                                    fontSize: '11px', 
                                    color: style.color, 
                                    background: style.background, 
                                    padding: '3px 8px', 
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: '500',
                                    cursor: alliance !== 'Independent' ? 'pointer' : 'default',
                                    border: isOpen ? `1px solid ${style.color}` : '1px solid transparent',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title={alliance !== 'Independent' ? `Click to see all ${alliance} members` : 'Independent airline'}
                                >
                                  <span style={{ fontSize: '10px' }}>{style.icon}</span>
                                  {alliance}
                                  {alliance !== 'Independent' && (
                                    <span style={{ 
                                      fontSize: '8px', 
                                      marginLeft: '2px',
                                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                      transition: 'transform 0.2s ease'
                                    }}>▼</span>
                                  )}
                                </span>
                                
                                {/* Alliance Members Dropdown */}
                                {isOpen && members.length > 0 && (
                                  <div 
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: '0',
                                      marginTop: '4px',
                                      background: '#fff',
                                      borderRadius: '12px',
                                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                      border: `1px solid ${style.color}20`,
                                      zIndex: 1000,
                                      minWidth: '220px',
                                      maxHeight: '300px',
                                      overflowY: 'auto'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div style={{
                                      padding: '12px 16px',
                                      borderBottom: '1px solid #eee',
                                      background: style.background,
                                      borderRadius: '12px 12px 0 0',
                                      position: 'sticky',
                                      top: 0
                                    }}>
                                      <div style={{ 
                                        fontWeight: '600', 
                                        color: style.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}>
                                        <span>{style.icon}</span>
                                        {alliance}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                        {members.length} member airlines
                                      </div>
                                    </div>
                                    <div style={{ padding: '8px 0' }}>
                                      {members.map((member, mIdx) => (
                                        <div 
                                          key={mIdx}
                                          style={{
                                            padding: '8px 16px',
                                            fontSize: '12px',
                                            color: '#333',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: member.toLowerCase().includes(f.airline.toLowerCase()) || 
                                                       f.airline.toLowerCase().includes(member.split(' ')[0].toLowerCase())
                                              ? style.background 
                                              : 'transparent',
                                            fontWeight: member.toLowerCase().includes(f.airline.toLowerCase()) || 
                                                       f.airline.toLowerCase().includes(member.split(' ')[0].toLowerCase())
                                              ? '600' 
                                              : 'normal'
                                          }}
                                        >
                                          <span style={{ color: style.color }}>✈</span>
                                          {member}
                                          {(member.toLowerCase().includes(f.airline.toLowerCase()) || 
                                            f.airline.toLowerCase().includes(member.split(' ')[0].toLowerCase())) && (
                                            <span style={{ 
                                              fontSize: '9px', 
                                              background: style.color, 
                                              color: '#fff',
                                              padding: '2px 6px',
                                              borderRadius: '10px',
                                              marginLeft: 'auto'
                                            }}>
                                              YOUR FLIGHT
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      
                      {/* Common badges */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {f.aircraftType && f.aircraftType !== 'Unknown' && (
                          <span style={{ fontSize: '12px', color: '#555', background: '#f5f5f5', padding: '3px 8px', borderRadius: '6px' }}>
                            {f.aircraftType}
                          </span>
                        )}
                        {f.serviceClass && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: f.serviceClass === 'Economy' ? '#8b6914' : 
                                   f.serviceClass === 'Premium Economy' ? '#166534' : 
                                   f.serviceClass === 'Business' ? '#1e40af' : 
                                   '#854d0e',
                            background: f.serviceClass === 'Economy' ? '#fef3c7' : 
                                        f.serviceClass === 'Premium Economy' ? '#dcfce7' : 
                                        f.serviceClass === 'Business' ? '#dbeafe' : 
                                        '#fef9c3',
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            fontWeight: f.serviceClass === 'First' ? '600' : 'normal'
                          }}>
                            {f.serviceClass === 'Economy' ? '🐔 Chicken class' : 
                             f.serviceClass === 'Premium Economy' ? '💺 Premium Economy' :
                             f.serviceClass === 'Business' ? '💼 Business' :
                             '👑 First'}
                          </span>
                        )}
                        <span 
                          style={{ 
                            fontSize: '11px', 
                            color: '#dc2626', 
                            background: '#fef2f2', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`Flying: ${flightCO2} kg CO₂ | Driving: ${Math.round(drivingCO2)} kg CO₂`}
                        >
                          <CloudRain size={10}/>
                          {flightCO2} kg
                          <span style={{ 
                            fontSize: '10px', 
                            color: co2Diff > 0 ? '#166534' : '#854d0e',
                            marginLeft: '2px'
                          }}>
                            {co2Diff > 0 ? `(🚗+${Math.round(co2Diff)})` : `(🚗${Math.round(co2Diff)})`}
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <Copy 
                        size={14} 
                        style={{ cursor: 'pointer', color: '#888' }} 
                        title="Duplicate this flight"
                        onClick={() => handleCopyFlight(f)} 
                      />
                      <Edit2 
                        size={14} 
                        style={{ cursor: 'pointer', color: '#888' }} 
                        title="Edit this flight"
                        onClick={() => handleEditFlight(f)} 
                      />
                      <Trash2 
                        size={14} 
                        color="#e57373" 
                        style={{ cursor: 'pointer' }} 
                        title="Delete this flight"
                        onClick={() => handleDeleteFlight(f.id)} 
                      />
                    </div>
                  </div>
                  
                  {/* Multi-leg display */}
                  {hasMultipleLegs && (
                    <div style={{ 
                      marginLeft: '106px', 
                      background: '#fafafa', 
                      borderRadius: '10px', 
                      padding: '12px',
                      border: '1px solid #f0f0f0'
                    }}>
                      {f.legs.map((leg, legIdx) => {
                        const legAlliance = leg.airline ? getAirlineAlliance(leg.airline) : null;
                        const legStyle = legAlliance ? (ALLIANCE_STYLES[legAlliance] || ALLIANCE_STYLES['Independent']) : null;
                        const legDropdownId = `alliance-${f.id}-leg-${legIdx}`;
                        const isLegDropdownOpen = openAllianceDropdown === legDropdownId;
                        const legMembers = legAlliance ? (ALLIANCE_MEMBERS_DISPLAY[legAlliance] || []) : [];
                        
                        return (
                          <div 
                            key={legIdx} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px',
                              padding: '8px 0',
                              borderBottom: legIdx < f.legs.length - 1 ? '1px dashed #e5e5e5' : 'none'
                            }}
                          >
                            {/* Leg number */}
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#94a3b8', 
                              fontWeight: '600',
                              minWidth: '35px'
                            }}>
                              LEG {legIdx + 1}
                            </span>
                            
                            {/* Route */}
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#374151',
                              minWidth: '100px'
                            }}>
                              {leg.origin} → {leg.destination}
                            </span>
                            
                            {/* Distance */}
                            <span style={{ 
                              fontSize: '11px', 
                              color: '#6b7280',
                              minWidth: '70px'
                            }}>
                              {leg.distance?.toLocaleString()} mi
                            </span>
                            
                            {/* Airline */}
                            {leg.airline && (
                              <span style={{ 
                                fontSize: '11px', 
                                color: '#555', 
                                background: '#fff', 
                                padding: '2px 8px', 
                                borderRadius: '6px',
                                border: '1px solid #e5e5e5'
                              }}>
                                {leg.airline}
                              </span>
                            )}
                            
                            {/* Alliance badge with dropdown */}
                            {leg.airline && legStyle && (
                              <div style={{ position: 'relative' }}>
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (legAlliance !== 'Independent' && legMembers.length > 0) {
                                      setOpenAllianceDropdown(isLegDropdownOpen ? null : legDropdownId);
                                    }
                                  }}
                                  style={{ 
                                    fontSize: '10px', 
                                    color: legStyle.color, 
                                    background: legStyle.background, 
                                    padding: '2px 6px', 
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontWeight: '500',
                                    cursor: legAlliance !== 'Independent' ? 'pointer' : 'default',
                                    border: isLegDropdownOpen ? `1px solid ${legStyle.color}` : '1px solid transparent'
                                  }}
                                  title={legAlliance !== 'Independent' ? `Click to see all ${legAlliance} members` : 'Independent airline'}
                                >
                                  <span style={{ fontSize: '9px' }}>{legStyle.icon}</span>
                                  {legAlliance}
                                  {legAlliance !== 'Independent' && (
                                    <span style={{ fontSize: '7px', marginLeft: '1px' }}>▼</span>
                                  )}
                                </span>
                                
                                {/* Leg Alliance Dropdown */}
                                {isLegDropdownOpen && legMembers.length > 0 && (
                                  <div 
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: '0',
                                      marginTop: '4px',
                                      background: '#fff',
                                      borderRadius: '12px',
                                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                      border: `1px solid ${legStyle.color}20`,
                                      zIndex: 1000,
                                      minWidth: '220px',
                                      maxHeight: '250px',
                                      overflowY: 'auto'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div style={{
                                      padding: '10px 14px',
                                      borderBottom: '1px solid #eee',
                                      background: legStyle.background,
                                      borderRadius: '12px 12px 0 0',
                                      position: 'sticky',
                                      top: 0
                                    }}>
                                      <div style={{ fontWeight: '600', color: legStyle.color, fontSize: '13px' }}>
                                        {legStyle.icon} {legAlliance}
                                      </div>
                                    </div>
                                    <div style={{ padding: '6px 0' }}>
                                      {legMembers.map((member, mIdx) => (
                                        <div 
                                          key={mIdx}
                                          style={{
                                            padding: '6px 14px',
                                            fontSize: '11px',
                                            color: '#333',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: member.toLowerCase().includes(leg.airline.toLowerCase()) || 
                                                       leg.airline.toLowerCase().includes(member.split(' ')[0].toLowerCase())
                                              ? legStyle.background 
                                              : 'transparent',
                                            fontWeight: member.toLowerCase().includes(leg.airline.toLowerCase()) || 
                                                       leg.airline.toLowerCase().includes(member.split(' ')[0].toLowerCase())
                                              ? '600' 
                                              : 'normal'
                                          }}
                                        >
                                          <span style={{ color: legStyle.color }}>✈</span>
                                          {member}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Aircraft type badge */}
                            {leg.aircraftType && leg.aircraftType !== 'Unknown' && (
                              <span style={{ 
                                fontSize: '10px', 
                                color: '#555', 
                                background: '#f5f5f5', 
                                padding: '2px 6px', 
                                borderRadius: '6px'
                              }}>
                                {leg.aircraftType}
                              </span>
                            )}
                            
                            {/* Service class badge */}
                            {leg.serviceClass && (
                              <span style={{ 
                                fontSize: '10px', 
                                color: leg.serviceClass === 'Economy' ? '#8b6914' : 
                                       leg.serviceClass === 'Premium Economy' ? '#166534' : 
                                       leg.serviceClass === 'Business' ? '#1e40af' : 
                                       '#854d0e',
                                background: leg.serviceClass === 'Economy' ? '#fef3c7' : 
                                            leg.serviceClass === 'Premium Economy' ? '#dcfce7' : 
                                            leg.serviceClass === 'Business' ? '#dbeafe' : 
                                            '#fef9c3',
                                padding: '2px 6px', 
                                borderRadius: '6px',
                                fontWeight: leg.serviceClass === 'First' ? '600' : 'normal'
                              }}>
                                {leg.serviceClass === 'Economy' ? '🐔' : 
                                 leg.serviceClass === 'Premium Economy' ? '💺' :
                                 leg.serviceClass === 'Business' ? '💼' :
                                 '👑'} {leg.serviceClass === 'Economy' ? 'Eco' : 
                                        leg.serviceClass === 'Premium Economy' ? 'Prem' : 
                                        leg.serviceClass === 'Business' ? 'Biz' : 'First'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Total distance summary */}
                      <div style={{ 
                        marginTop: '8px', 
                        paddingTop: '8px', 
                        borderTop: '1px solid #e5e5e5',
                        fontSize: '11px',
                        color: '#6b7280',
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}>
                        Total: {f.distance?.toLocaleString()} mi
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={modalOverlay}>
          <div style={{...modalContent, maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto'}}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
               <h2 style={{margin: 0}}>{editingFlight ? 'Edit Flight' : 'Log Flight'}</h2>
               <X style={{cursor:'pointer'}} onClick={() => {
                 setShowForm(false);
                 setEditingFlight(null);
                 setFormData({ 
                   origin: '', destination: '', date: '', aircraftType: '', airline: '', 
                   serviceClass: 'Economy', checkLandmarks: false, hasLayover: false,
                   viaAirports: [''], legAirlines: ['', ''], legAircraftTypes: ['', ''], legServiceClasses: ['Economy', 'Economy']
                 });
               }}/>
             </div>
             {isVerifying ? (
                 <div style={{textAlign:'center', padding:'40px'}}>
                     <Loader2 className="animate-spin" size={40} style={{marginBottom:'20px'}}/>
                     <div>{formData.checkLandmarks ? 'Analyzing route & landmarks...' : 'Saving flight...'}</div>
                     <div style={{fontSize:'12px', color:'#666', marginTop:'10px'}}>{statusMsg}</div>
                 </div>
             ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
                  {/* Route Section */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      placeholder="From (e.g. PRG)" 
                      required 
                      value={formData.origin} 
                      onChange={e => setFormData({...formData, origin: e.target.value.toUpperCase()})} 
                      style={{...inputStyle, flex: 1, textAlign: 'center', fontWeight: 'bold'}} 
                    />
                    <span style={{ color: '#888', fontSize: '20px' }}>→</span>
                    <input 
                      placeholder="To (e.g. JFK)" 
                      required 
                      value={formData.destination} 
                      onChange={e => setFormData({...formData, destination: e.target.value.toUpperCase()})} 
                      style={{...inputStyle, flex: 1, textAlign: 'center', fontWeight: 'bold'}} 
                    />
                  </div>

                  {/* Layover Checkbox */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    color: '#555',
                    padding: '10px 12px',
                    background: formData.hasLayover ? '#f0f9ff' : '#f9f9f9',
                    borderRadius: '8px',
                    border: formData.hasLayover ? '1px solid #3b82f6' : '1px solid #eee'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={formData.hasLayover} 
                      onChange={e => {
                        const hasLayover = e.target.checked;
                        setFormData({
                          ...formData, 
                          hasLayover,
                          viaAirports: hasLayover ? [''] : [''],
                          legAirlines: hasLayover ? ['', ''] : ['', ''],
                          legAircraftTypes: hasLayover ? ['', ''] : ['', ''],
                          legServiceClasses: hasLayover ? ['Economy', 'Economy'] : ['Economy', 'Economy'],
                          airline: hasLayover ? '' : formData.airline
                        });
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Has connection/layover</span>
                  </label>

                  {/* Via Airports Section */}
                  {formData.hasLayover && (
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '15px', 
                      borderRadius: '12px',
                      border: '1px dashed #cbd5e1'
                    }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontWeight: '600' }}>
                        CONNECTION AIRPORTS
                      </div>
                      
                      {formData.viaAirports.map((via, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', minWidth: '50px' }}>Via {idx + 1}:</span>
                          <input 
                            placeholder={`Connection ${idx + 1} (e.g. FRA)`}
                            value={via} 
                            onChange={e => {
                              const newVias = [...formData.viaAirports];
                              newVias[idx] = e.target.value.toUpperCase();
                              // Adjust all leg arrays size
                              const newLegAirlines = [...formData.legAirlines];
                              const newLegAircraftTypes = [...formData.legAircraftTypes];
                              const newLegServiceClasses = [...formData.legServiceClasses];
                              while (newLegAirlines.length < newVias.length + 1) {
                                newLegAirlines.push('');
                                newLegAircraftTypes.push('');
                                newLegServiceClasses.push('Economy');
                              }
                              setFormData({
                                ...formData, 
                                viaAirports: newVias, 
                                legAirlines: newLegAirlines,
                                legAircraftTypes: newLegAircraftTypes,
                                legServiceClasses: newLegServiceClasses
                              });
                            }} 
                            style={{...inputStyle, flex: 1, fontSize: '13px', padding: '10px'}} 
                          />
                          {formData.viaAirports.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => {
                                const newVias = formData.viaAirports.filter((_, i) => i !== idx);
                                const newLegAirlines = formData.legAirlines.filter((_, i) => i !== idx + 1);
                                const newLegAircraftTypes = formData.legAircraftTypes.filter((_, i) => i !== idx + 1);
                                const newLegServiceClasses = formData.legServiceClasses.filter((_, i) => i !== idx + 1);
                                setFormData({
                                  ...formData, 
                                  viaAirports: newVias, 
                                  legAirlines: newLegAirlines,
                                  legAircraftTypes: newLegAircraftTypes,
                                  legServiceClasses: newLegServiceClasses
                                });
                              }}
                              style={{ 
                                background: '#fee2e2', 
                                color: '#dc2626', 
                                border: 'none', 
                                borderRadius: '6px',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData, 
                            viaAirports: [...formData.viaAirports, ''],
                            legAirlines: [...formData.legAirlines, ''],
                            legAircraftTypes: [...formData.legAircraftTypes, ''],
                            legServiceClasses: [...formData.legServiceClasses, 'Economy']
                          });
                        }}
                        style={{ 
                          background: '#e0f2fe', 
                          color: '#0369a1', 
                          border: 'none', 
                          borderRadius: '6px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '5px'
                        }}
                      >
                        <Plus size={14} /> Add another connection
                      </button>
                    </div>
                  )}

                  {/* Airline Section */}
                  {formData.hasLayover ? (
                    <div style={{ 
                      background: '#fefce8', 
                      padding: '15px', 
                      borderRadius: '12px',
                      border: '1px dashed #fde047'
                    }}>
                      <div style={{ fontSize: '12px', color: '#a16207', marginBottom: '12px', fontWeight: '600' }}>
                        FLIGHT DETAILS PER LEG
                      </div>
                      
                      {(() => {
                        const validVias = formData.viaAirports.filter(v => v.trim());
                        const stops = [formData.origin, ...validVias, formData.destination].filter(s => s);
                        const legs = [];
                        for (let i = 0; i < stops.length - 1; i++) {
                          if (stops[i] && stops[i+1]) {
                            legs.push({ from: stops[i], to: stops[i+1], idx: i });
                          }
                        }
                        
                        return legs.map((leg, i) => (
                          <div key={i} style={{ 
                            marginBottom: i < legs.length - 1 ? '16px' : '0',
                            paddingBottom: i < legs.length - 1 ? '16px' : '0',
                            borderBottom: i < legs.length - 1 ? '1px dashed #fde047' : 'none'
                          }}>
                            {/* Leg header */}
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#92400e', 
                              fontWeight: '600',
                              marginBottom: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{ 
                                background: '#fbbf24', 
                                color: '#78350f', 
                                padding: '2px 8px', 
                                borderRadius: '10px',
                                fontSize: '10px'
                              }}>
                                LEG {i + 1}
                              </span>
                              {leg.from} → {leg.to}
                            </div>
                            
                            {/* Leg inputs row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <input 
                                placeholder="Airline"
                                value={formData.legAirlines[i] || ''} 
                                onChange={e => {
                                  const newLegAirlines = [...formData.legAirlines];
                                  newLegAirlines[i] = e.target.value;
                                  setFormData({...formData, legAirlines: newLegAirlines});
                                }} 
                                style={{...inputStyle, fontSize: '13px', padding: '10px'}} 
                              />
                              <input 
                                placeholder="Aircraft"
                                value={formData.legAircraftTypes[i] || ''} 
                                onChange={e => {
                                  const newLegAircraftTypes = [...formData.legAircraftTypes];
                                  newLegAircraftTypes[i] = e.target.value;
                                  setFormData({...formData, legAircraftTypes: newLegAircraftTypes});
                                }} 
                                style={{...inputStyle, fontSize: '13px', padding: '10px'}} 
                              />
                            </div>
                            <div style={{ marginTop: '8px' }}>
                              <select 
                                value={formData.legServiceClasses[i] || 'Economy'} 
                                onChange={e => {
                                  const newLegServiceClasses = [...formData.legServiceClasses];
                                  newLegServiceClasses[i] = e.target.value;
                                  setFormData({...formData, legServiceClasses: newLegServiceClasses});
                                }} 
                                style={{...inputStyle, fontSize: '13px', padding: '10px', width: '100%'}}
                              >
                                {serviceClasses.map(cls => (
                                  <option key={cls} value={cls}>{cls}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <>
                      <input 
                        placeholder="Airline (e.g. United, Delta)" 
                        value={formData.airline} 
                        onChange={e => setFormData({...formData, airline: e.target.value})} 
                        style={inputStyle} 
                      />
                      <input 
                        placeholder="Aircraft (e.g. Boeing 737)" 
                        value={formData.aircraftType} 
                        onChange={e => setFormData({...formData, aircraftType: e.target.value})} 
                        style={inputStyle} 
                      />
                      <select 
                        value={formData.serviceClass} 
                        onChange={e => setFormData({...formData, serviceClass: e.target.value})} 
                        style={inputStyle}
                      >
                        {serviceClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </>
                  )}
                  
                  <input 
                    type="date" 
                    required 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    style={inputStyle} 
                  />
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.checkLandmarks} 
                      onChange={e => setFormData({...formData, checkLandmarks: e.target.checked})}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Detect landmarks along route</span>
                  </label>
                  
                  <button type="submit" style={{ background: '#000', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                    {editingFlight ? 'Update Flight' : (formData.checkLandmarks ? 'Save & Analyze' : 'Save Flight')}
                    {formData.hasLayover && formData.viaAirports.filter(v => v.trim()).length > 0 && (
                      <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                        ({formData.viaAirports.filter(v => v.trim()).length + 1} legs)
                      </span>
                    )}
                  </button>
                </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

const statCard = { padding: '24px', border: '1px solid #eee', borderRadius: '16px', textAlign: 'center' };
const statVal = { fontSize: '28px', fontWeight: 'bold', margin: '10px 0 5px' };
const statLbl = { fontSize: '12px', color: '#888', textTransform: 'uppercase' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { background: '#fff', padding: '30px', borderRadius: '20px', width: '400px' };

export default FlightTracker;
