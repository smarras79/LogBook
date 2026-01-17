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
  signInWithPopup,
  sendPasswordResetEmail // <--- Added for Forgot Password
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
const GOOGLE_CLIENT_ID = "870884007039-9got7ia77t611u2fugedlq6j7kftf51p.apps.googleusercontent.com"; 
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
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', or 'forgot'
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
  const geocoder = useRef(null);

  const [formData, setFormData] = useState({
    origin: '', destination: '', date: '', aircraftType: '', airline: '', serviceClass: 'Economy', checkLandmarks: false
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

  // --- NEW: Password Reset Handler ---
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail) {
      setAuthError('Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, authEmail);
      alert('Password reset link sent! Check your email to set a new password.');
      setAuthMode('login'); // Return to login screen
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setAuthError('No account found with this email.');
          break;
        case 'auth/invalid-email':
          setAuthError('Please enter a valid email address.');
          break;
        default:
          setAuthError(error.message);
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
        if (!from || !to || isNaN(from.lat) || isNaN(to.lat)) {
             alert('Invalid airport codes. Please check IATA codes (e.g., JFK, LHR).');
             setIsVerifying(false);
             return;
        }

        let landmarks = [];
        if (flightData.checkLandmarks) {
           setStatusMsg('Scanning route for landmarks...');
           landmarks = await detectLandmarksHybrid(from, to);
        }

        const dist = calculateDistance(from.lat, from.lon, to.lat, to.lon);
        
        const newFlight = {
          id: flightData.id || Date.now(),
          ...flightData,
          distance: dist,
          landmarks: landmarks || []
        };

        if (editingFlight) {
            setFlights(flights.map(f => f.id === editingFlight.id ? newFlight : f));
            setEditingFlight(null);
        } else {
            setFlights([...flights, newFlight]);
        }

        if (isImport) {
           setSuggestedFlights(prev => prev.filter(f => f.id !== flightData.id));
        } else {
            setFormData({ origin: '', destination: '', date: '', aircraftType: '', airline: '', serviceClass: 'Economy', checkLandmarks: false });
            setShowForm(false);
        }
    } catch (e) {
        console.error("Error saving flight:", e);
        alert("Failed to save flight. Please try again.");
    } finally {
        setIsVerifying(false);
        setStatusMsg('');
    }
  };

  const fetchAirportData = async (code) => {
    if (!code) return null;
    const local = AIRPORTS_DATABASE.find(a => a.code === code);
    if (local) return local;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${code}+airport&format=json&limit=1`);
      const data = await response.json();
      if (data && data[0]) {
        return {
          code,
          name: code + " Airport", 
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
    } catch (err) {
      console.error("Airport fetch error:", err);
    }
    return null;
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this flight?")) {
      setFlights(flights.filter(f => f.id !== id));
    }
  };

  const handleEdit = (flight) => {
      setEditingFlight(flight);
      setFormData({ ...flight });
      setShowForm(true);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#000', padding: '10px', borderRadius: '12px' }}>
             <Plane color="#fff" size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>FlightLog</h1>
            <span style={{ fontSize: '14px', color: '#666' }}>Track your journey</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!authLoading && (
            authUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{authUser.email}</span>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => openAuthModal('login')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                <LogIn size={16} /> Sign In
              </button>
            )
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={statCard}>
          <Globe size={24} color="#666" style={{ margin: '0 auto' }} />
          <div style={statVal}>{flights.length}</div>
          <div style={statLbl}>Flights</div>
        </div>
        <div style={statCard}>
          <BarChart3 size={24} color="#666" style={{ margin: '0 auto' }} />
          <div style={statVal}>{flights.reduce((acc, curr) => acc + curr.distance, 0).toLocaleString()}</div>
          <div style={statLbl}>Miles Flown</div>
        </div>
        <div style={statCard}>
          <Trophy size={24} color="#666" style={{ margin: '0 auto' }} />
          <div style={statVal}>{new Set(flights.map(f => f.destination)).size}</div>
          <div style={statLbl}>Cities Visited</div>
        </div>
      </div>

      {/* Main Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => { setEditingFlight(null); setFormData({ origin: '', destination: '', date: '', aircraftType: '', airline: '', serviceClass: 'Economy', checkLandmarks: false }); setShowForm(true); }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', background: '#000', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <Plus size={20} /> Log Flight
        </button>
        <button 
          onClick={handleGmailImport}
          disabled={!gapiInited}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', background: '#fff', color: '#000', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', fontWeight: 'bold', cursor: gapiInited ? 'pointer' : 'not-allowed', opacity: gapiInited ? 1 : 0.6 }}
        >
          {importing ? <Loader2 className="spin" size={20} /> : <Mail size={20} />} Sync Gmail
        </button>
      </div>

      {/* Flights List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {flights.map((flight) => (
          <div key={flight.id} style={{ padding: '20px', border: '1px solid #eee', borderRadius: '16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px' }}>{flight.origin} → {flight.destination}</h3>
                    <span style={{ fontSize: '12px', padding: '4px 8px', background: '#f5f5f5', borderRadius: '20px' }}>{flight.serviceClass}</span>
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    {formatDate(flight.date)} • {flight.airline} {flight.flightNumber}
                  </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{flight.distance.toLocaleString()} mi</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                     <button onClick={() => handleEdit(flight)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #eee', background: 'none', cursor: 'pointer' }}><Edit2 size={16} color="#666"/></button>
                     <button onClick={() => handleDelete(flight.id)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #eee', background: 'none', cursor: 'pointer' }}><Trash2 size={16} color="#ef4444"/></button>
                  </div>
               </div>
            </div>
            
            {/* Landmarks Section */}
            {flight.landmarks && flight.landmarks.length > 0 && (
              <div style={{ paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: '#444' }}>
                   <Mountain size={14} /> Landmarks Flown Over
                 </div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                   {flight.landmarks.map((lm, idx) => (
                     <span key={idx} style={{ fontSize: '12px', padding: '4px 10px', background: '#f0f9ff', color: '#0369a1', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                       {lm}
                     </span>
                   ))}
                 </div>
              </div>
            )}
          </div>
        ))}
        {flights.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No flights logged yet. Add your first trip!</div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={modalOverlay}>
          <div style={{...modalContent, maxWidth: '400px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0}}>
                {authMode === 'forgot' ? 'Reset Password' : (authMode === 'login' ? 'Welcome Back' : 'Create Account')}
              </h2>
              <X style={{cursor:'pointer'}} onClick={() => setShowAuthModal(false)}/>
            </div>

            {/* Only show Google Sign In for Login/Signup, not Password Reset */}
            {authMode !== 'forgot' && (
              <div style={{ marginBottom: '20px' }}>
                <button 
                  onClick={handleGoogleSignIn}
                  style={{ width: '100%', background: '#fff', border: '1px solid #ddd', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
                  <span style={{ padding: '0 10px', color: '#666', fontSize: '12px' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
                </div>
              </div>
            )}

            {authError && (
              <div style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <AlertCircle size={16} />
                {authError}
              </div>
            )}

            <form onSubmit={authMode === 'forgot' ? handlePasswordReset : (authMode === 'login' ? handleLogin : handleSignup)}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>

              {/* Hide password field if we are in 'forgot' mode */}
              {authMode !== 'forgot' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Forgot Password Link */}
                  {authMode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                      <span 
                        onClick={() => setAuthMode('forgot')}
                        style={{ fontSize: '12px', color: '#4285F4', cursor: 'pointer', fontWeight: '500' }}
                      >
                        Forgot password?
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit" 
                style={{ width: '100%', background: '#000', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                {authMode === 'forgot' ? 'Send Reset Link' : (authMode === 'login' ? 'Log In' : 'Create Account')}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
              {authMode === 'forgot' ? (
                <span>
                  Remember your password?{' '}
                  <button 
                    onClick={() => setAuthMode('login')} 
                    style={{ background: 'none', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                  >
                    Log in
                  </button>
                </span>
              ) : authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('signup')} 
                    style={{ background: 'none', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('login')} 
                    style={{ background: 'none', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                  >
                    Log in
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Form Modal */}
      {showForm && (
        <div style={modalOverlay}>
          <div style={modalContent}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h2 style={{ margin: 0 }}>{editingFlight ? 'Edit Flight' : 'Log New Flight'}</h2>
               <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
             </div>
             {isVerifying ? (
               <div style={{ textAlign: 'center', padding: '40px' }}>
                 <Loader2 className="spin" size={32} style={{ marginBottom: '10px' }} />
                 <div>{statusMsg}</div>
               </div>
             ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveOrImport(formData); }} style={{ display: 'grid', gap: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>From (Airport Code)</label>
                      <input style={{...inputStyle, width: '100%', boxSizing: 'border-box'}} placeholder="JFK" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value.toUpperCase()})} required maxLength={3} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>To (Airport Code)</label>
                      <input style={{...inputStyle, width: '100%', boxSizing: 'border-box'}} placeholder="LHR" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value.toUpperCase()})} required maxLength={3} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Date</label>
                    <input type="date" style={{...inputStyle, width: '100%', boxSizing: 'border-box'}} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Airline</label>
                      <input style={{...inputStyle, width: '100%', boxSizing: 'border-box'}} placeholder="Delta" value={formData.airline} onChange={e => setFormData({...formData, airline: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Class</label>
                       <select style={{...inputStyle, width: '100%', boxSizing: 'border-box'}} value={formData.serviceClass} onChange={e => setFormData({...formData, serviceClass: e.target.value})}>
                         {serviceClasses.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '8px', cursor: 'pointer' }}>
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
                  </button>
                </form>
             )}
          </div>
        </div>
      )}

      {/* Gmail Import Modal */}
      {showImport && (
        <div style={modalOverlay}>
           <div style={modalContent}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h2 style={{ margin: 0 }}>Import from Gmail</h2>
               <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
             </div>
             {suggestedFlights.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No recent flight emails found.</div>
             ) : (
               <div style={{ display: 'grid', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                 {suggestedFlights.map(flight => (
                   <div key={flight.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <div style={{ fontWeight: 'bold' }}>{flight.origin} → {flight.destination}</div>
                       <div style={{ fontSize: '12px', color: '#666' }}>{flight.date} • {flight.airline}</div>
                     </div>
                     <button onClick={() => handleSaveOrImport(flight, true)} style={{ padding: '8px 16px', background: '#000', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Import</button>
                   </div>
                 ))}
               </div>
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
const modalContent = { background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' };

export default FlightTracker;
