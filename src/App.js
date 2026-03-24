import React, { useState, useEffect, useRef } from 'react';
import {
  Plane, Plus, Trash2, Edit2, X, Copy,
  Globe, BarChart3, Trophy, Loader2, Mail, Check, AlertCircle, Users, Map, Mountain, CloudRain,
  LogIn, LogOut, User, Eye, EyeOff, DollarSign, CreditCard, ArrowLeftRight,
  ChevronDown, ChevronUp, Settings, Flag, MapPin, Moon, Heart, MessageCircle, Shield
} from 'lucide-react';
// Firebase imports
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  getDocs,
  arrayUnion
} from 'firebase/firestore';

// App modules
import { auth, db, googleProvider, GOOGLE_CLIENT_ID, GOOGLE_API_KEY, DISCOVERY_DOCS, SCOPES } from './config/firebase';
import AIRPORTS_DATABASE from './data/airports';
import { ALLIANCE_STYLES, ALLIANCE_MEMBERS_DISPLAY } from './data/airlines';
import { getContinent, calculateDistance } from './utils/geo';
import { isAirlineMatch, getAirlineWebsite, getAirlineAlliance } from './utils/airlines';
import { LANDMARK_DETECTION_VERSION, generateId, ensureUniqueIds, getFlightRadar24Url, getFlightsNeedingLandmarkRefresh, getFlightsForLandmarkAddition, getPassengerEstimate, getCarbonEstimate, calculateUserStats, fetchAirportData } from './utils/flights';
import { detectLandmarksHybrid } from './services/landmarkService';
import { extractFlightInfo } from './services/gmailParsingService';
import { formatDate } from './utils/formatters';
import { statCard, statVal, statLbl, inputStyle, modalOverlay, modalContent } from './styles/constants';
import useFlightStats from './hooks/useFlightStats';
import LandingPage from './components/LandingPage';
import LeaderboardModal from './components/LeaderboardModal';
import ChatModal from './components/ChatModal';
import GmailImportProgressModal from './components/GmailImportProgressModal';
import ImportSuggestionsModal from './components/ImportSuggestionsModal';
import FlightFormModal from './components/FlightFormModal';
import StatsSection from './components/StatsSection';
import AuthModal from './components/AuthModal';
import FlightListSection from './components/FlightListSection';
import FlightMatchingSection from './components/FlightMatchingSection';
import AdminDashboard from './components/AdminDashboard';

// The primary admin email — this user is auto-granted admin on first sign-in
const INITIAL_ADMIN_EMAIL = 'simone.marras@gmail.com';

// All data constants, utilities, and Firebase config are now imported from
// ./data/, ./utils/, and ./config/ modules above.


const FlightTracker = () => {
  const [user, setUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
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
  const [landmarkRefreshDismissed, setLandmarkRefreshDismissed] = useState(() => {
      return localStorage.getItem('landmarkRefreshDismissed') === 'true';
  });
  
  // Store setImporting in window so error callbacks can access it
  useEffect(() => {
    window._setGmailImporting = setImporting;
    return () => { window._setGmailImporting = null; };
  }, []);
  const [suggestedFlights, setSuggestedFlights] = useState([]);
  
  // Contest opt-in state
  const [contestOptIn, setContestOptIn] = useState(false);
  const [contestLoading, setContestLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardSortBy, setLeaderboardSortBy] = useState('miles'); // 'miles', 'flights', 'countries', 'co2'
  
  // Flight matching opt-in state (find fellow passengers on same flight)
  const [flightMatchingOptIn, setFlightMatchingOptIn] = useState(false);
  const [flightMatches, setFlightMatches] = useState({}); // { flightKey: [{ nickname, uid }] }
  
  // User nickname state
  const [nickname, setNickname] = useState('');
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  
  
  // Sort/organization mode for flight cards
  const [sortMode, setSortMode] = useState(() => {
    const saved = localStorage.getItem('flightSortMode');
    return saved || 'date';
  });
  
  // Landing page state - show landing if not logged in and hasn't dismissed it
  const [showLanding, setShowLanding] = useState(() => {
    const dismissed = localStorage.getItem('landingDismissed');
    return !dismissed;
  });
  
  // Progress tracking for Gmail import
  const [importProgress, setImportProgress] = useState({
    show: false,
    phase: 'searching', // 'searching' | 'processing'
    currentQuery: 0,
    totalQueries: 9,
    currentEmail: 0,
    totalEmails: 0,
    foundFlights: 0,
    currentQueryText: ''
  });
  const [gapiInited, setGapiInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [editingFlight, setEditingFlight] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [openAllianceDropdown, setOpenAllianceDropdown] = useState(null); // tracks which alliance dropdown is open

  // Database reprocessing state
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessProgress, setReprocessProgress] = useState({ current: 0, total: 0 });

  // Gmail date range defaults (3 years ago to today)
  const getDefaultFromDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 3);
    return date.toISOString().split('T')[0];
  };
  const getDefaultToDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  const gmailDateFrom = getDefaultFromDate();
  const gmailDateTo = getDefaultToDate();

  const geocoder = useRef(null);

  const [formData, setFormData] = useState({
    origin: '', 
    destination: '', 
    date: '', 
    returnDate: '', // For round trip
    flightNumber: '', // Flight number (e.g., UA123, AA456)
    aircraftType: '', 
    airline: '', 
    serviceClass: 'Economy', 
    checkLandmarks: false,
    hasLayover: false,
    isRoundTrip: false, // New: round trip option
    viaAirports: [''], // Array of connection airport codes
    legAirlines: ['', ''], // Airlines for each leg
    legAircraftTypes: ['', ''], // Aircraft for each leg
    legServiceClasses: ['Economy', 'Economy'], // Service class for each leg
    paymentType: 'money', // 'money' or 'miles'
    paymentAmount: ''
  });
  
  // Airport autocomplete state
  const [airportSuggestions, setAirportSuggestions] = useState([]);
  const [activeAirportField, setActiveAirportField] = useState(null); // 'origin', 'destination', or 'via-0', 'via-1', etc.
  
  // Fellow passengers state
  const [fellowPassengers, setFellowPassengers] = useState([]);
  const [showFellowPassengers, setShowFellowPassengers] = useState(false);

  // Favorites state (UIDs of favorited fellow passengers)
  const [favoritePassengers, setFavoritePassengers] = useState([]);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPartner, setChatPartner] = useState(null); // { uid, nickname }
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatUnsubRef = useRef(null);
  const chatPollRef = useRef(null);
  const chatMessagesEndRef = useRef(null);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        // Load user's flights from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();

          // Block check: sign out immediately if blocked
          if (data.blocked) {
            await signOut(auth);
            setAuthError('Your account has been suspended. Please contact the administrator.');
            setAuthMode('login');
            setShowAuthModal(true);
            setAuthLoading(false);
            return;
          }

	    const sourceFlights = data.flights || [];
	    const { fixed, changed } = ensureUniqueIds(sourceFlights);
	    setFlights(fixed);
            // Sync localStorage so the save function always has the correct base list
            try { localStorage.setItem('flights-data', JSON.stringify(fixed)); } catch (e) {}
            setContestOptIn(data.contestOptIn || false);
            setFlightMatchingOptIn(data.flightMatchingOptIn || false);
            setNickname(data.nickname || '');
            setFavoritePassengers(data.favoritePassengers || []);

            // Auto-grant admin to primary admin if not already set
            const shouldBeAdmin = data.isAdmin || firebaseUser.email === INITIAL_ADMIN_EMAIL;
            setIsAdmin(shouldBeAdmin);
            const updates = {};
            if (shouldBeAdmin && !data.isAdmin) updates.isAdmin = true;
            // Backfill email if missing (existing accounts pre-date this field)
            if (!data.email && firebaseUser.email) updates.email = firebaseUser.email;
            if (Object.keys(updates).length > 0) {
              try { await updateDoc(userDocRef, updates); } catch (e) {}
            }

	    if (changed) {
		try {
		    await updateDoc(userDocRef, { flights: fixed });
		} catch (e) {
		    console.error('Failed to persist ID migration', e);
		}
	    }
        } else {
          // Create user document — auto-seed admin for the primary admin email
          const isInitialAdmin = firebaseUser.email === INITIAL_ADMIN_EMAIL;
          await setDoc(userDocRef, {
            flights: [],
            email: firebaseUser.email || '',
            createdAt: new Date().toISOString(),
            contestOptIn: false,
            flightMatchingOptIn: false,
            nickname: '',
            isAdmin: isInitialAdmin,
            blocked: false
          });
          setIsAdmin(isInitialAdmin);
          setFlights([]);
          setContestOptIn(false);
          setFlightMatchingOptIn(false);
          setNickname('');
        }
        setAuthUser(firebaseUser);
      } else {
          setAuthUser(null);
          setIsAdmin(false);
          setContestOptIn(false);
          setFlightMatchingOptIn(false);
          setNickname('');
          setFavoritePassengers([]);
          setChatOpen(false);
          setChatPartner(null);
          setChatMessages([]);
          // User logged out — clear flights and stale localStorage cache
          setFlights([]);
          try { localStorage.removeItem('flights-data'); } catch (e) {}
      }
	setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save flights to Firestore when they change (for authenticated users)
  // CRITICAL: Use a ref to track if we're in the middle of loading to prevent race conditions
  const isSavingRef = useRef(false);
  
  useEffect(() => {
    // Don't save if we're still loading or if we're already saving
    if (authLoading || isSavingRef.current) {
      console.log('⏸️ Skipping save - authLoading:', authLoading, 'isSaving:', isSavingRef.current);
      return;
    }
    
    if (authUser) {
      isSavingRef.current = true;
      const userDocRef = doc(db, 'users', authUser.uid);
      console.log('💾 Saving flights to Firestore:', flights.length, 'flights');
      
      updateDoc(userDocRef, { flights: flights })
        .then(() => {
          console.log('✓ Flights saved successfully to Firestore');
          isSavingRef.current = false;
        })
        .catch((error) => {
          console.error('❌ Error saving flights to Firestore:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          isSavingRef.current = false;
        });
    } else if (!authUser) {
      // Save to localStorage for non-authenticated users
      console.log('💾 Saving flights to localStorage:', flights.length, 'flights');
      localStorage.setItem('flights-data', JSON.stringify(flights));
    }
  }, [flights, authUser, authLoading]);


  // Update public stats when opted in and flights change
  useEffect(() => {
    const updatePublicStats = async () => {
      // Don't run during toggle operation or if not opted in
      if (authUser && contestOptIn && !authLoading && !contestLoading) {
        const stats = calculateUserStats(flights);
        const publicStatsRef = doc(db, 'publicStats', authUser.uid);
        try {
          await setDoc(publicStatsRef, {
            displayName: nickname || authUser.displayName || authUser.email?.split('@')[0] || 'Anonymous Flyer',
            email: authUser.email,
            ...stats,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error updating public stats:', error);
        }
      }
    };
    updatePublicStats();
  }, [flights, contestOptIn, authUser, authLoading, contestLoading, nickname]);

  // Handle contest opt-in toggle
  const handleContestOptInToggle = async (newValue) => {
    if (!authUser || contestLoading) return;
    
    setContestLoading(true);
    const userDocRef = doc(db, 'users', authUser.uid);
    
    try {
      // First update the user's preference
      await updateDoc(userDocRef, { contestOptIn: newValue });
      
      // Then update public stats
      const publicStatsRef = doc(db, 'publicStats', authUser.uid);
      if (newValue) {
        // Add stats to public collection
        const stats = calculateUserStats(flights);
        await setDoc(publicStatsRef, {
          displayName: nickname || authUser.displayName || authUser.email?.split('@')[0] || 'Anonymous Flyer',
          email: authUser.email,
          ...stats,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Remove from public collection by setting opted out flag
        await setDoc(publicStatsRef, { optedOut: true, updatedAt: new Date().toISOString() });
      }
      
      // Only update local state after successful Firebase writes
      setContestOptIn(newValue);
    } catch (error) {
      console.error('Error updating contest opt-in:', error);
      alert('Failed to update contest preference. Please check your connection and try again.');
      // Don't change local state on error
    } finally {
      setContestLoading(false);
    }
  };

  // Handle flight matching opt-in toggle
  const handleFlightMatchingToggle = async (newValue) => {
    if (!authUser) return;
    
    const userDocRef = doc(db, 'users', authUser.uid);
    
    try {
      // Update user's preference
      await updateDoc(userDocRef, { flightMatchingOptIn: newValue });
      
      // If opting in, register all flights with flight numbers to the shared registry
      if (newValue) {
        const flightsWithNumbers = flights.filter(f => f.flightNumber && f.date);
        console.log(`Registering ${flightsWithNumbers.length} flights for user ${authUser.uid}`);
        
        for (const flight of flightsWithNumbers) {
          const flightKey = `${flight.flightNumber}_${flight.date}`.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
          console.log(`Registering flight: "${flight.flightNumber}" on ${flight.date} as key: "${flightKey}"`);
          
          const registryRef = doc(db, 'flightRegistry', flightKey);
          const registryDoc = await getDoc(registryRef);
          
          const userEntry = {
            uid: authUser.uid,
            nickname: nickname || authUser.displayName || 'Anonymous',
            addedAt: new Date().toISOString()
          };
          
          if (registryDoc.exists()) {
            const existing = registryDoc.data().passengers || [];
            console.log(`Flight ${flightKey} already has ${existing.length} passengers`);
            // Don't add duplicate
            if (!existing.some(p => p.uid === authUser.uid)) {
              await updateDoc(registryRef, { 
                passengers: [...existing, userEntry]
              });
              console.log(`Added user to existing flight ${flightKey}`);
            } else {
              console.log(`User already registered for flight ${flightKey}`);
            }
          } else {
            await setDoc(registryRef, {
              flightNumber: flight.flightNumber,
              date: flight.date,
              passengers: [userEntry]
            });
            console.log(`Created new registry for flight ${flightKey}`);
          }
        }
      } else {
        // If opting out, remove user from all flight registries
        const flightsWithNumbers = flights.filter(f => f.flightNumber && f.date);
        for (const flight of flightsWithNumbers) {
          const flightKey = `${flight.flightNumber}_${flight.date}`.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
          const registryRef = doc(db, 'flightRegistry', flightKey);
          const registryDoc = await getDoc(registryRef);
          
          if (registryDoc.exists()) {
            const existing = registryDoc.data().passengers || [];
            const filtered = existing.filter(p => p.uid !== authUser.uid);
            await updateDoc(registryRef, { passengers: filtered });
          }
        }
      }
      
      setFlightMatchingOptIn(newValue);
      
      // Refresh flight matches if opting in
      if (newValue) {
        checkFlightMatches();
      } else {
        setFlightMatches({});
        setFellowPassengers([]);
      }
    } catch (error) {
      console.error('Error updating flight matching preference:', error);
      alert('Failed to update flight matching preference. Please try again.');
    }
  };

  // Check for flight matches (other users on same flights)
  const checkFlightMatches = async () => {
    if (!authUser || !flightMatchingOptIn) {
      console.log('Skipping flight match check - not authenticated or not opted in');
      return;
    }
    
    console.log('========== CHECKING FLIGHT MATCHES ==========');
    console.log('Current user ID:', authUser.uid);
    console.log('Current user nickname:', nickname);
    
    // First, let's see ALL documents in flightRegistry for debugging
    try {
      console.log('\n--- Listing ALL flightRegistry documents ---');
      const registrySnapshot = await getDocs(collection(db, 'flightRegistry'));
      console.log(`Total documents in flightRegistry: ${registrySnapshot.size}`);
      registrySnapshot.forEach((doc) => {
        console.log(`Document ID: ${doc.id}`);
        console.log('Data:', JSON.stringify(doc.data(), null, 2));
      });
      console.log('--- End of flightRegistry listing ---\n');
    } catch (listError) {
      console.error('Error listing flightRegistry:', listError);
    }
    
    const matches = {};
    const fellowPassengersData = [];
    const flightsWithNumbers = flights.filter(f => f.flightNumber && f.date);
    
    console.log('Flights with numbers:', flightsWithNumbers.length);
    console.log('Flight details:', flightsWithNumbers.map(f => ({
      flightNumber: f.flightNumber,
      date: f.date,
      origin: f.origin,
      destination: f.destination
    })));
    
    for (const flight of flightsWithNumbers) {
      const flightKey = `${flight.flightNumber}_${flight.date}`.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      console.log(`\n--- Checking Flight ---`);
      console.log(`Original flight number: "${flight.flightNumber}"`);
      console.log(`Original date: "${flight.date}"`);
      console.log(`Generated key: "${flightKey}"`);
      
      try {
        const registryRef = doc(db, 'flightRegistry', flightKey);
        console.log(`Attempting to read from: flightRegistry/${flightKey}`);
        
        const registryDoc = await getDoc(registryRef);
        console.log(`Document exists: ${registryDoc.exists()}`);
        
        if (registryDoc.exists()) {
          const docData = registryDoc.data();
          console.log('Full document data:', JSON.stringify(docData, null, 2));
          
          const passengers = docData.passengers || [];
          console.log(`Total passengers in registry: ${passengers.length}`);
          console.log('All passengers:', passengers.map(p => ({
            uid: p.uid,
            nickname: p.nickname,
            addedAt: p.addedAt
          })));
          
          // Filter out current user (String() cast guards against type mismatches)
          const myUid = String(authUser.uid);
          const others = passengers.filter(p => String(p.uid) !== myUid);
          console.log(`Fellow passengers (excluding self): ${others.length}`);
          
          if (others.length > 0) {
            console.log('✓ MATCH FOUND! Other passengers:', others.map(p => p.nickname));
            matches[flightKey] = others;
            
            // Add to fellow passengers with flight details
            others.forEach(passenger => {
              const passengerData = {
                ...passenger,
                flightNumber: flight.flightNumber,
                date: flight.date,
                origin: flight.origin,
                destination: flight.destination,
                airline: flight.airline
              };
              console.log('Adding fellow passenger:', passengerData);
              fellowPassengersData.push(passengerData);
            });
          } else {
            console.log('✗ No other passengers on this flight (only you)');
          }
        } else {
          console.log(`✗ No registry document found for flight ${flightKey}`);
          console.log('This means no one has registered for this flight yet.');
        }
      } catch (e) {
        console.error(`❌ ERROR checking flight ${flightKey}:`, e);
        console.error('Error name:', e.name);
        console.error('Error message:', e.message);
        console.error('Error code:', e.code);
      }
    }
    
    console.log('\n========== FINAL RESULTS ==========');
    console.log('Total fellow passengers found:', fellowPassengersData.length);
    console.log('Fellow passengers data:', fellowPassengersData);
    console.log('Matches object:', matches);
    console.log('=====================================\n');
    
    setFlightMatches(matches);
    setFellowPassengers(fellowPassengersData);
  };

  // Check flight matches when flights change and user is opted in
  useEffect(() => {
    if (authUser && flightMatchingOptIn && !authLoading) {
      checkFlightMatches();
    }
  }, [flights, flightMatchingOptIn, authUser, authLoading]);

  // Toggle a fellow passenger as favorite
  const toggleFavoritePassenger = async (passengerUid) => {
    if (!authUser) return;
    const isFav = favoritePassengers.includes(passengerUid);
    const updated = isFav
      ? favoritePassengers.filter(uid => uid !== passengerUid)
      : [...favoritePassengers, passengerUid];
    setFavoritePassengers(updated);
    try {
      const userDocRef = doc(db, 'users', authUser.uid);
      await updateDoc(userDocRef, { favoritePassengers: updated });
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  };

  // Generate a deterministic chat conversation ID from two UIDs
  const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  // Helper: stop any active chat polling and snapshot listener
  const stopChatSync = () => {
    if (chatUnsubRef.current) {
      chatUnsubRef.current();
      chatUnsubRef.current = null;
    }
    if (chatPollRef.current) {
      clearInterval(chatPollRef.current);
      chatPollRef.current = null;
    }
  };

  // Open chat with a fellow passenger
  const openChat = (passenger) => {
    if (!authUser) return;
    setChatPartner({ uid: passenger.uid, nickname: passenger.nickname || 'Anonymous Traveler' });
    setChatMessages([]);
    setChatInput('');
    setChatError('');
    setChatOpen(true);
    setChatLoading(true);
    // Close the fellow passengers popup so it doesn't interfere
    setShowFellowPassengers(false);

    const chatId = getChatId(authUser.uid, passenger.uid);
    const chatDocRef = doc(db, 'chats', chatId);

    // Clean up any previous listeners/polls
    stopChatSync();

    const initAndListen = async () => {
      // Ensure chat document exists
      try {
        const chatDoc = await getDoc(chatDocRef);
        if (!chatDoc.exists()) {
          await setDoc(chatDocRef, {
            participants: [authUser.uid, passenger.uid],
            messages: []
          });
        } else {
          // Show existing messages immediately
          setChatMessages(chatDoc.data().messages || []);
        }
        setChatLoading(false);
      } catch (e) {
        console.error('Error initializing chat document:', e);
        setChatError('Could not connect to chat. Check your connection.');
        setChatLoading(false);
        return;
      }

      // 1) Real-time listener (instant for sender, may or may not work cross-user)
      try {
        const unsub = onSnapshot(chatDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setChatMessages(snapshot.data().messages || []);
          }
          setChatError('');
        }, (err) => {
          console.error('Chat snapshot listener error:', err);
          // Don't show error — polling fallback will keep working
        });
        chatUnsubRef.current = unsub;
      } catch (e) {
        console.error('Could not set up real-time listener:', e);
      }

      // 2) Polling fallback every 3s — guarantees cross-user delivery
      //    Uses getDoc with {source:'server'} to bypass cache and hit Firestore directly
      chatPollRef.current = setInterval(async () => {
        try {
          const fresh = await getDoc(chatDocRef);
          if (fresh.exists()) {
            const msgs = fresh.data().messages || [];
            setChatMessages(prev => {
              // Only update if message count changed to avoid unnecessary re-renders
              if (msgs.length !== prev.length) return msgs;
              return prev;
            });
          }
        } catch (e) {
          // Silent — snapshot or next poll will pick it up
        }
      }, 3000);
    };

    initAndListen();
  };

  // Close chat and unsubscribe from listener + polling
  const closeChat = () => {
    stopChatSync();
    setChatOpen(false);
    setChatPartner(null);
    setChatMessages([]);
    setChatInput('');
    setChatError('');
  };

  // Send a chat message using arrayUnion for atomic append
  const sendChatMessage = async () => {
    if (!authUser || !chatPartner || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatError('');

    const chatId = getChatId(authUser.uid, chatPartner.uid);
    const chatDocRef = doc(db, 'chats', chatId);
    const newMsg = {
      from: authUser.uid,
      nickname: nickname || authUser.displayName || 'Anonymous',
      text,
      ts: new Date().toISOString()
    };

    try {
      // Use arrayUnion for atomic, conflict-free append
      await updateDoc(chatDocRef, {
        messages: arrayUnion(newMsg)
      });
    } catch (e) {
      // If document doesn't exist yet (shouldn't happen since openChat creates it), create it
      if (e.code === 'not-found') {
        try {
          await setDoc(chatDocRef, {
            participants: [authUser.uid, chatPartner.uid],
            messages: [newMsg]
          });
        } catch (e2) {
          console.error('Error creating chat:', e2);
          setChatError('Failed to send. Please try again.');
          setChatInput(text); // Restore the message so user can retry
        }
      } else {
        console.error('Error sending message:', e);
        setChatError('Failed to send. Please try again.');
        setChatInput(text); // Restore the message so user can retry
      }
    }
  };

  // Cleanup chat listener + polling on unmount
  useEffect(() => {
    return () => stopChatSync();
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const publicStatsRef = collection(db, 'publicStats');
      const snapshot = await getDocs(publicStatsRef);
      const leaderboard = [];
      
      console.log('Fetching leaderboard, found documents:', snapshot.size);
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        console.log('Document:', docSnapshot.id, data);
        
        // Only exclude if explicitly opted out, include all others with any miles
        const isOptedOut = data.optedOut === true;
        const hasMiles = data.totalMiles !== undefined && data.totalMiles !== null;
        
        if (!isOptedOut && hasMiles) {
          leaderboard.push({
            id: docSnapshot.id,
            ...data,
            totalMiles: data.totalMiles || 0,
            totalFlights: data.totalFlights || 0,
            uniqueCountries: data.uniqueCountries || 0,
            uniqueAirports: data.uniqueAirports || 0,
            totalCO2: data.totalCO2 || 0,
            isCurrentUser: authUser && docSnapshot.id === authUser.uid
          });
        }
      });
      
      console.log('Filtered leaderboard entries:', leaderboard.length);
      
      // Sort by total miles descending by default
      leaderboard.sort((a, b) => (b.totalMiles || 0) - (a.totalMiles || 0));
      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Show the error to user for debugging
      alert('Error loading leaderboard: ' + error.message);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Get sorted leaderboard data based on current sort selection
  const getSortedLeaderboard = () => {
    const sorted = [...leaderboardData];
    switch (leaderboardSortBy) {
      case 'miles':
        sorted.sort((a, b) => (b.totalMiles || 0) - (a.totalMiles || 0));
        break;
      case 'flights':
        sorted.sort((a, b) => (b.totalFlights || 0) - (a.totalFlights || 0));
        break;
      case 'countries':
        sorted.sort((a, b) => (b.uniqueCountries || 0) - (a.uniqueCountries || 0));
        break;
      case 'co2':
        // Lower CO2 is better, so sort ascending
        sorted.sort((a, b) => (a.totalCO2 || 0) - (b.totalCO2 || 0));
        break;
      default:
        sorted.sort((a, b) => (b.totalMiles || 0) - (a.totalMiles || 0));
    }
    return sorted;
  };

  // Fetch leaderboard when showing it
  useEffect(() => {
    if (showLeaderboard) {
      fetchLeaderboard();
    }
  }, [showLeaderboard, authUser]);

  // Handle nickname save
  const handleSaveNickname = async () => {
    if (!authUser) return;
    
    const trimmedNickname = nicknameInput.trim();
    const userDocRef = doc(db, 'users', authUser.uid);
    
    try {
      await updateDoc(userDocRef, { nickname: trimmedNickname });
      setNickname(trimmedNickname);
      setEditingNickname(false);
      
      // Also update public stats if opted in
      if (contestOptIn) {
        const publicStatsRef = doc(db, 'publicStats', authUser.uid);
        const stats = calculateUserStats(flights);
        await setDoc(publicStatsRef, {
          displayName: trimmedNickname || authUser.displayName || authUser.email?.split('@')[0] || 'Anonymous Flyer',
          email: authUser.email,
          ...stats,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error saving nickname:', error);
      alert('Failed to save nickname. Please try again.');
    }
  };

  // Get display name (nickname or email prefix)
  const getDisplayName = () => {
    if (nickname) return nickname;
    if (authUser?.displayName) return authUser.displayName;
    if (authUser?.email) return authUser.email.split('@')[0];
    return 'User';
  };

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
            error_callback: (error) => {
              console.error('Google OAuth error:', error);
              // Clear timeout and reset importing state
              if (window._gmailAuthTimeout) {
                clearTimeout(window._gmailAuthTimeout);
                window._gmailAuthTimeout = null;
              }
              if (window._setGmailImporting) {
                window._setGmailImporting(false);
              }
              // Handle popup blocked or other errors
              if (error.type === 'popup_closed' || error.type === 'popup_failed_to_open') {
                alert('Popup was blocked or closed. Please allow popups for this site and try again.');
              }
            }
        });
        setTokenClient(client);
      };
      document.body.appendChild(script2);
    } else if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      // Script already loaded, just initialize the client
      const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: '',
          ux_mode: 'popup',
          error_callback: (error) => {
            console.error('Google OAuth error:', error);
            // Clear timeout and reset importing state
            if (window._gmailAuthTimeout) {
              clearTimeout(window._gmailAuthTimeout);
              window._gmailAuthTimeout = null;
            }
            if (window._setGmailImporting) {
              window._setGmailImporting(false);
            }
            if (error.type === 'popup_closed' || error.type === 'popup_failed_to_open') {
              alert('Popup was blocked or closed. Please allow popups for this site and try again.');
            }
          }
      });
      setTokenClient(client);
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
      } finally {
	  try { localStorage.removeItem('landingDismissed'); } catch(e) {}
	  if (typeof setShowLanding === 'function') setShowLanding(true);
	  if (typeof window !== 'undefined' && window.scrollTo) {
	      window.scrollTo({ top: 0, behavior: 'smooth' });
	  }
      }
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
    setShowAuthModal(true);
  };

  // Combined auth submit handler
  const handleAuthSubmit = (e) => {
    if (authMode === 'signup') {
      handleSignup(e);
    } else {
      handleLogin(e);
    }
  };

  // --- DATABASE REPROCESSING ---
  // Define the current schema version - increment this when new fields are added
  const CURRENT_SCHEMA_VERSION = 3; // v3 fixed country fetching for external airports

  // Check if a flight needs reprocessing (missing new fields)
  const flightNeedsReprocessing = (flight) => {
    // If schema version is current, no reprocessing needed
    if (flight.schemaVersion && flight.schemaVersion >= CURRENT_SCHEMA_VERSION) return false;
    // Otherwise, check for missing country/continent data
    if (flight.originCountry === undefined || flight.destCountry === undefined) return true;
    if (flight.originContinent === undefined || flight.destContinent === undefined) return true;
    // Also reprocess if continent is 'Unknown' (country might not have been fetched properly)
    if (flight.originContinent === 'Unknown' || flight.destContinent === 'Unknown') return true;
    // Also reprocess if country is empty string
    if (flight.originCountry === '' || flight.destCountry === '') return true;
    return true; // schemaVersion is outdated
  };

  // Count flights that need reprocessing
  const getFlightsNeedingUpdate = () => {
    return flights.filter(f => flightNeedsReprocessing(f));
  };

  // Reprocess a single flight to add missing data
  const reprocessFlight = (flight) => {
    const originAirport = AIRPORTS_DATABASE.find(a => a.code === flight.origin);
    const destAirport = AIRPORTS_DATABASE.find(a => a.code === flight.destination);
    
    // Get country - use existing if valid, otherwise look up
    const originCountry = (flight.originCountry && flight.originCountry !== '') 
      ? flight.originCountry 
      : (originAirport?.country || '');
    const destCountry = (flight.destCountry && flight.destCountry !== '') 
      ? flight.destCountry 
      : (destAirport?.country || '');
    
    // Get continent - recalculate from country (in case country was fixed)
    const originContinent = getContinent(originCountry);
    const destContinent = getContinent(destCountry);
    
    const updatedFlight = {
      ...flight,
      originCountry,
      destCountry,
      originContinent: originContinent !== 'Unknown' ? originContinent : (flight.originContinent || 'Unknown'),
      destContinent: destContinent !== 'Unknown' ? destContinent : (flight.destContinent || 'Unknown'),
      schemaVersion: CURRENT_SCHEMA_VERSION
    };

    // Also update legs if present
    if (updatedFlight.legs && updatedFlight.legs.length > 0) {
      updatedFlight.legs = updatedFlight.legs.map(leg => {
        const legOrigin = AIRPORTS_DATABASE.find(a => a.code === leg.origin);
        const legDest = AIRPORTS_DATABASE.find(a => a.code === leg.destination);
        
        const legOriginCountry = (leg.originCountry && leg.originCountry !== '') 
          ? leg.originCountry 
          : (legOrigin?.country || '');
        const legDestCountry = (leg.destCountry && leg.destCountry !== '') 
          ? leg.destCountry 
          : (legDest?.country || '');
        
        return {
          ...leg,
          originCountry: legOriginCountry,
          destCountry: legDestCountry,
          originContinent: getContinent(legOriginCountry),
          destContinent: getContinent(legDestCountry)
        };
      });
    }

    return updatedFlight;
  };

  // Reprocess all flights that need updating
  const handleReprocessDatabase = async () => {
    const flightsToUpdate = getFlightsNeedingUpdate();
    if (flightsToUpdate.length === 0) return;

    setIsReprocessing(true);
    setReprocessProgress({ current: 0, total: flightsToUpdate.length });

    try {
      const updatedFlights = flights.map((flight, index) => {
        if (flightNeedsReprocessing(flight)) {
          setReprocessProgress(prev => ({ ...prev, current: prev.current + 1 }));
          return reprocessFlight(flight);
        }
        return flight;
      });

      setFlights(updatedFlights);
      localStorage.setItem('flights-data', JSON.stringify(updatedFlights));

      // Also update Firestore if logged in
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        await updateDoc(userDocRef, { flights: updatedFlights });
      }

      alert(`Successfully updated ${flightsToUpdate.length} flight${flightsToUpdate.length > 1 ? 's' : ''} with new data!`);
    } catch (error) {
      console.error('Error reprocessing database:', error);
      alert('Error updating flights. Please try again.');
    } finally {
      setIsReprocessing(false);
      setReprocessProgress({ current: 0, total: 0 });
    }
  };

  // Delete a suggested flight from the list
  const handleDeleteSuggestion = (flightId) => {
    setSuggestedFlights(prev => prev.filter(f => f.id !== flightId));
  };

  const handleGmailImport = () => {
    // Check if tokenClient is available
    if (!tokenClient) {
      alert('Google services are still loading. Please wait a moment and try again.');
      return;
    }
    
    // Detect mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Show mobile warning (only once per session)
    if (isMobile && !sessionStorage.getItem('gmailMobileWarningShown')) {
      const proceed = window.confirm(
        'Gmail sync may not work well on mobile browsers due to popup restrictions.\n\n' +
        'For best results, please use a desktop browser.\n\n' +
        'Would you like to try anyway?'
      );
      sessionStorage.setItem('gmailMobileWarningShown', 'true');
      if (!proceed) return;
    }
    
    setImporting(true);
    tokenClient.callback = async (resp) => {
      // Clear the timeout since we got a response
      if (window._gmailAuthTimeout) {
        clearTimeout(window._gmailAuthTimeout);
        window._gmailAuthTimeout = null;
      }
      
      if (resp.error) {
        setImporting(false);
        setImportProgress(p => ({...p, show: false}));
        console.error('Gmail auth error:', resp.error);
        alert("Auth failed. " + (resp.error_description || ''));
        return;
      }

      // Show date range picker modal after OAuth
      const showDateRangePicker = () => {
        return new Promise((resolve) => {
          const modal = document.createElement('div');
          modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';

          const content = document.createElement('div');
          content.style.cssText = 'background:#fff;padding:30px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.2);max-width:400px;width:90%;';
          content.innerHTML = `
            <h2 style="margin:0 0 20px 0;font-size:20px;font-weight:600;">Select Date Range</h2>
            <div style="margin-bottom:15px;">
              <label style="display:block;margin-bottom:5px;font-size:13px;font-weight:600;">From:</label>
              <input type="date" id="dateFrom" value="${gmailDateFrom}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;"/>
            </div>
            <div style="margin-bottom:20px;">
              <label style="display:block;margin-bottom:5px;font-size:13px;font-weight:600;">To:</label>
              <input type="date" id="dateTo" value="${gmailDateTo}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;"/>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button id="cancelBtn" style="padding:10px 20px;border:1px solid #ddd;background:#fff;border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
              <button id="searchBtn" style="padding:10px 20px;border:none;background:#4285F4;color:#fff;border-radius:8px;cursor:pointer;font-weight:600;">Search</button>
            </div>
          `;

          modal.appendChild(content);
          document.body.appendChild(modal);

          document.getElementById('cancelBtn').onclick = () => {
            document.body.removeChild(modal);
            resolve(null);
          };

          document.getElementById('searchBtn').onclick = () => {
            const from = document.getElementById('dateFrom').value;
            const to = document.getElementById('dateTo').value;

            // Validate dates
            if (!from || !to) {
              alert('Please select both start and end dates.');
              return;
            }

            if (new Date(from) > new Date(to)) {
              alert('Start date must be before end date.');
              return;
            }

            console.log('Date range selected - From:', from, 'To:', to);
            document.body.removeChild(modal);
            resolve({ from, to });
          };
        });
      };

      const dateRange = await showDateRangePicker();
      if (!dateRange) {
        setImporting(false);
        return;
      }

      console.log('User selected date range:', dateRange);
      
      // Show progress modal
      setImportProgress({
        show: true,
        phase: 'searching',
        currentQuery: 0,
        totalQueries: 9,
        currentEmail: 0,
        totalEmails: 0,
        foundFlights: 0,
        currentQueryText: 'Initializing...'
      });

      try {
        // Build date range query (Gmail format: YYYY/MM/DD)
        const formatDateForGmail = (dateStr) => dateStr.replace(/-/g, '/');
        const afterDate = formatDateForGmail(dateRange.from);
        const beforeDate = formatDateForGmail(dateRange.to);

        console.log('Gmail date range - After:', afterDate, 'Before:', beforeDate);

        // Multi-pronged search strategy
        const searchQueries = [
          // 1. Gmail's reservation category (when available)
          `category:reservations after:${afterDate} before:${beforeDate}`,

          // 2. Strong flight subject keywords
          `subject:(itinerary OR "flight confirmation" OR "booking confirmation" OR "e-ticket" OR eticket OR "boarding pass" OR "ticket number" OR "booking reference") after:${afterDate} before:${beforeDate}`,

          // 3. Check-in and trip emails
          `subject:("check-in" OR "your trip" OR "your flight" OR "trip confirmation" OR "travel itinerary" OR "flight receipt") after:${afterDate} before:${beforeDate}`,

          // 4. Body content search — airline names and booking terms (catches emails not covered by domain/subject)
          `(itinerary OR "e-ticket" OR eticket OR "boarding pass" OR "booking reference" OR "reservation number" OR "flight number" OR "departure date" OR "passenger name") after:${afterDate} before:${beforeDate}`,

          // 5. US airlines (incl. common marketing subdomains)
          `from:(united.com OR delta.com OR aa.com OR southwest.com OR jetblue.com OR alaskaair.com OR email.aa.com OR email.united.com OR email.delta.com OR info.alaskaair.com) after:${afterDate} before:${beforeDate}`,

          // 6. European airlines
          `from:(britishairways.com OR lufthansa.com OR airfrance.com OR klm.com OR iberia.com OR vueling.com OR tap.pt OR swiss.com OR austrian.com OR finnair.com OR sas.se OR norwegian.com OR easyjet.com OR ryanair.com OR wizzair.com OR transavia.com OR eurowings.com OR brusselsairlines.com OR lot.com OR aegeanair.com) after:${afterDate} before:${beforeDate}`,

          // 7. Middle East, African, Turkish airlines
          `from:(emirates.com OR qatarairways.com OR turkishairlines.com OR thy.com OR flypgs.com OR pegasusairlines.com OR sunexpress.com OR saudia.com OR airarabia.com OR flydubai.com OR flynas.com OR egyptair.com OR ethiopianairlines.com OR kenyanairways.com) after:${afterDate} before:${beforeDate}`,

          // 8. Asian & Pacific airlines
          `from:(singaporeair.com OR cathaypacific.com OR airasia.com OR thaiairways.com OR ana.co.jp OR jal.com OR koreanair.com OR evaair.com OR qantas.com OR airnewzealand.com OR flypeach.com OR lionair.co.id OR airindia.in OR goindigo.in OR vistara.com OR spicejet.com) after:${afterDate} before:${beforeDate}`,

          // 9. Latin American airlines
          `from:(latam.com OR gol.com OR azul.com.br OR avianca.com OR aeromexico.com OR copaair.com OR tam.com.br OR skyairline.com OR aeroflot.ru) after:${afterDate} before:${beforeDate}`,

          // 10. Travel booking sites & OTAs
          `from:(expedia.com OR booking.com OR kayak.com OR priceline.com OR orbitz.com OR travelocity.com OR tripadvisor.com OR edreams.com OR opodo.com OR lastminute.com OR volagratis.com OR gotogate.com OR bravofly.com OR cheapflights.com OR skyscanner.com OR momondo.com OR travelport.com OR amadeus.com) after:${afterDate} before:${beforeDate}`,
        ];
        
        // Query labels for display
        const queryLabels = [
          'Gmail Reservations',
          'Flight Confirmations',
          'Check-in & Trip Emails',
          'Body Content Search',
          'US Airlines',
          'European & LCC Airlines',
          'Middle East & African Airlines',
          'Asian & Pacific Airlines',
          'Latin American Airlines',
          'Travel Booking Sites & OTAs',
        ];

        const allMessageIds = new Set();
        const allMessages = [];
        
        // Run searches with progress updates
        for (let i = 0; i < searchQueries.length; i++) {
          const query = searchQueries[i];
          
          setImportProgress(p => ({
            ...p,
            phase: 'searching',
            currentQuery: i + 1,
            totalQueries: searchQueries.length,
            currentQueryText: queryLabels[i]
          }));
          
          try {
            console.log(`Search ${i + 1}/${searchQueries.length}: ${query.substring(0, 60)}...`);
            const response = await window.gapi.client.gmail.users.messages.list({
              'userId': 'me',
              'q': query,
              'maxResults': 50
            });
            
            const messages = response.result.messages || [];
            console.log(`  → Found ${messages.length} emails`);
            
            for (const msg of messages) {
              if (!allMessageIds.has(msg.id)) {
                allMessageIds.add(msg.id);
                allMessages.push(msg);
              }
            }
          } catch (e) {
            console.log(`  → Search failed:`, e.message);
          }
        }
        
        console.log(`\nTotal unique emails to process: ${allMessages.length}`);
        
        // Update to processing phase
        setImportProgress(p => ({
          ...p,
          phase: 'processing',
          currentEmail: 0,
          totalEmails: allMessages.length,
          currentQueryText: 'Analyzing emails...'
        }));

        const suggestions = [];
        const processedRoutes = new Set();
        let jsonLdCount = 0;
        let regexCount = 0;

        // Helper function to detect and group round trips
        const groupRoundTrips = (flights) => {
          if (!flights || flights.length < 2) return flights;
          
          const result = [];
          const used = new Set();
          
          for (let i = 0; i < flights.length; i++) {
            if (used.has(i)) continue;
            
            const outbound = flights[i];
            let returnFlight = null;
            let returnIndex = -1;
            
            // Look for a return flight (same confirmation, reversed route)
            for (let j = i + 1; j < flights.length; j++) {
              if (used.has(j)) continue;
              
              const candidate = flights[j];
              const sameConfirmation = outbound.confirmationNumber && 
                                       outbound.confirmationNumber === candidate.confirmationNumber;
              const isReversed = outbound.origin === candidate.destination && 
                                outbound.destination === candidate.origin;
              const returnDateAfter = !outbound.date || !candidate.date || 
                                      new Date(candidate.date) >= new Date(outbound.date);
              
              if ((sameConfirmation || isReversed) && isReversed && returnDateAfter) {
                returnFlight = candidate;
                returnIndex = j;
                break;
              }
            }
            
            if (returnFlight) {
              // Mark as round trip
              used.add(i);
              used.add(returnIndex);
              
              result.push({
                ...outbound,
                id: `${outbound.id}-rt`,
                isRoundTrip: true,
                outboundFlight: outbound,
                returnFlight: returnFlight,
                snippet: `${outbound.origin} ⇄ ${outbound.destination} (Round Trip)`,
                returnDate: returnFlight.date
              });
            } else {
              result.push(outbound);
            }
          }
          
          return result;
        };

        for (let i = 0; i < allMessages.length; i++) {
          const msg = allMessages[i];
          
          // Update progress every email
          setImportProgress(p => ({
            ...p,
            currentEmail: i + 1,
            foundFlights: suggestions.length
          }));
          
          try {
            if (i % 10 === 0) {
              console.log(`Processing email ${i + 1}/${allMessages.length}...`);
            }
            
            const details = await window.gapi.client.gmail.users.messages.get({
              'userId': 'me', 'id': msg.id, 'format': 'full'
            });
            
            let flights = extractFlightInfo(details.result);
            
            // Group round trips within the same email
            if (flights && Array.isArray(flights) && flights.length >= 2) {
              flights = groupRoundTrips(flights);
            }
            
            if (flights && Array.isArray(flights)) {
              flights.forEach(flight => {
                const routeKey = flight.isRoundTrip 
                  ? `${flight.origin}-${flight.destination}-RT-${flight.date}`
                  : `${flight.origin}-${flight.destination}-${flight.date}`;
                if (!processedRoutes.has(routeKey)) {
                  processedRoutes.add(routeKey);
                  suggestions.push(flight);
                  
                  if (flight.source === 'json-ld') jsonLdCount++;
                  else regexCount++;
                  
                  if (flight.isRoundTrip) {
                    console.log(`✓ Found Round Trip: ${flight.origin} ⇄ ${flight.destination} | ${flight.date} - ${flight.returnDate} | ${flight.airline || 'Unknown'} | ${flight.source}`);
                  } else {
                    console.log(`✓ Found: ${flight.origin} → ${flight.destination} | ${flight.date} | ${flight.airline || 'Unknown'} | ${flight.source}`);
                  }
                }
              });
            }
          } catch (e) {
            // Skip failed messages
          }
        }
        
        suggestions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log(`\n=== RESULTS ===`);
        console.log(`Total flights: ${suggestions.length} (${jsonLdCount} from JSON-LD, ${regexCount} from regex)`);
        
        setImportProgress(p => ({...p, show: false}));
        setSuggestedFlights(suggestions);
        setShowImport(true);
      } catch (err) {
        console.error("Gmail Import Error:", err);
        setImportProgress(p => ({...p, show: false}));
        alert("An error occurred while scanning emails.");
      } finally {
        setImporting(false);
      }
    };
    
    // Request access token - must be called synchronously from user gesture
    try {
      // Set a timeout to reset state if popup doesn't respond
      const timeoutId = setTimeout(() => {
        if (importing) {
          setImporting(false);
          console.log('Gmail auth timed out');
        }
      }, 60000); // 60 second timeout
      
      // Store timeout ID so we can clear it when auth succeeds
      window._gmailAuthTimeout = timeoutId;
      
      if (window.gapi && window.gapi.client && window.gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
      } else if (window.gapi && window.gapi.client) {
        tokenClient.requestAccessToken({prompt: ''});
      } else {
        clearTimeout(timeoutId);
        setImporting(false);
        alert('Google API is still loading. Please wait a moment and try again.');
      }
    } catch (err) {
      console.error('Error requesting access token:', err);
      setImporting(false);
      alert('Failed to open Google sign-in. If you\'re on mobile, please try using a desktop browser, or check that popups are allowed.');
    }
  };

    // Refresh landmarks for specific flights
    const handleRefreshLandmarks = async (flightIds) => {
	setIsReprocessing(true);
	setReprocessProgress({ current: 0, total: flightIds.length });
	
	try {
	    const updatedFlights = await Promise.all(
		flights.map(async (flight, index) => {
		    if (!flightIds.includes(flight.id)) {
			return flight;
		    }
		    
		    setReprocessProgress(prev => ({ ...prev, current: prev.current + 1 }));
		    setStatusMsg(`Refreshing landmarks for ${flight.origin} → ${flight.destination}...`);
		    
		    // Re-detect landmarks
		    const from = await fetchAirportData(AIRPORTS_DATABASE,flight.origin);
		    const to = await fetchAirportData(AIRPORTS_DATABASE,flight.destination);
        
		    if (!from || !to) return flight;
		    
		    let allFeatures = [];
		    
		    if (flight.legs && flight.legs.length > 1) {
			// Multi-leg flight - refresh each leg
			for (let i = 0; i < flight.legs.length; i++) {
			    const leg = flight.legs[i];
			    const legFrom = await fetchAirportData(AIRPORTS_DATABASE,leg.origin);
			    const legTo = await fetchAirportData(AIRPORTS_DATABASE,leg.destination);
			    
			    if (legFrom && legTo) {
				const legFeatures = await detectLandmarksHybrid(legFrom, legTo, geocoder, setStatusMsg);
				allFeatures = [...new Set([...allFeatures, ...legFeatures])];
				
				// Update leg features
				flight.legs[i] = {
				    ...leg,
				    featuresCrossed: legFeatures
				};
			    }
			}
		    } else {
			// Single flight
			allFeatures = await detectLandmarksHybrid(from, to, geocoder, setStatusMsg);
		    }
		    
		    return {
			...flight,
			featuresCrossed: allFeatures,
			landmarkVersion: LANDMARK_DETECTION_VERSION
		    };
		})
	    );
	    
	    setFlights(updatedFlights);
	    localStorage.setItem('flights-data', JSON.stringify(updatedFlights));
	    
	    if (authUser) {
		const userDocRef = doc(db, 'users', authUser.uid);
		await updateDoc(userDocRef, { flights: updatedFlights });
	    }
	    
	    alert(`Successfully refreshed landmarks for ${flightIds.length} flight${flightIds.length > 1 ? 's' : ''}!`);
	} catch (error) {
	    console.error('Error refreshing landmarks:', error);
	    alert('Error refreshing landmarks. Please try again.');
	} finally {
	    setIsReprocessing(false);
	    setReprocessProgress({ current: 0, total: 0 });
	    setStatusMsg('');
	}
    };

  
    // --- SAVE & IMPORT LOGIC ---
  const handleSaveOrImport = async (flightData, isImport = false) => {
    // Handle round trips by adding both flights
    if (flightData.isRoundTrip && isImport) {
      setIsVerifying(true);
      setStatusMsg('Adding outbound flight...');
      
      try {
        // Add outbound flight
	  const outbound = flightData.outboundFlight;
	  const outboundId = generateId();
	  await handleSaveOrImportSingle({ ...outbound, id: outboundId }, true, true);
	  
	  // Add return flight
	  const returnFlight = flightData.returnFlight;
	  const returnId = generateId();
	  await handleSaveOrImportSingle({ ...returnFlight, id: returnId }, true, true);
          // Remove from suggestions
          setSuggestedFlights(prev => prev.filter(f => f.id !== flightData.id));
          
          setIsVerifying(false);
          setStatusMsg('');
      } catch (e) {
          console.error('Error adding round trip:', e);
          setIsVerifying(false);
          setStatusMsg('');
          alert('Error adding round trip. Check console for details.');
      }
	return;
    }
      
      // Regular single flight
      await handleSaveOrImportSingle(flightData, isImport, false);
  };

  const handleSaveOrImportSingle = async (flightData, isImport = false, skipStatusReset = false, skipFormReset = false) => {
    setIsVerifying(true);
    setStatusMsg('Verifying Airports...');
    try {
        const from = await fetchAirportData(AIRPORTS_DATABASE,flightData.origin);
        const to = await fetchAirportData(AIRPORTS_DATABASE,flightData.destination);

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
                const viaAirport = await fetchAirportData(AIRPORTS_DATABASE,validVias[i]);
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
                    legFeatures = await detectLandmarksHybrid(legFrom, legTo, geocoder, setStatusMsg);
                    allFeatures = [...new Set([...allFeatures, ...legFeatures])];
                }
                
                legs.push({
                    origin: legFrom.code,
                    destination: legTo.code,
                    originCity: legFrom.city,
                    destCity: legTo.city,
                    originCountry: legFrom.country || '',
                    destCountry: legTo.country || '',
                    originContinent: getContinent(legFrom.country),
                    destContinent: getContinent(legTo.country),
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
                    features = await detectLandmarksHybrid(from, to, geocoder, setStatusMsg);
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
                originCountry: from.country || '',
                destCountry: to.country || '',
                originContinent: getContinent(from.country),
                destContinent: getContinent(to.country),
                airline: flightData.airline || '',
                aircraftType: flightData.aircraftType || '',
                serviceClass: flightData.serviceClass || 'Economy',
                distance: dist,
                featuresCrossed: features
            });
        }
        
        // Calculate total passengers from all legs (each leg may have different aircraft)
        const pax = legs.reduce((sum, leg) => {
          return sum + getPassengerEstimate(leg.aircraftType);
        }, 0);

        // Remove form-only fields from the data to be saved
        const { checkLandmarks, hasLayover, viaAirports, legAirlines, legAircraftTypes, legServiceClasses, ...flightDataToSave } = flightData;

	const newRecord = {
	    ...flightDataToSave,
	    id: (editingFlight ? flightData.id : null) || generateId(),
	    date: flightData.date,
	    returnDate: flightData.returnDate || '',
	    isRoundTrip: flightData.isRoundTrip || false,
	    flightNumber: flightData.flightNumber || '',
	    distance: totalDistance,
	    originCity: from.city, 
	    destCity: to.city,
	    originCountry: from.country || '',
	    destCountry: to.country || '',
	    originContinent: getContinent(from.country),
	    destContinent: getContinent(to.country),
	    featuresCrossed: allFeatures,
	    landmarkVersion: flightData.checkLandmarks ? LANDMARK_DETECTION_VERSION : (flightData.landmarkVersion || 1), // Track landmark version
	    passengerCount: pax,
	    legs: legs,
	    legCount: legs.length,
	    schemaVersion: CURRENT_SCHEMA_VERSION
	};
        
        
        // Debug log for round trips
        if (newRecord.isRoundTrip) {
            console.log('Saving round trip flight:', newRecord.origin, '⇄', newRecord.destination, 'dates:', newRecord.date, '-', newRecord.returnDate);
        }

        // Read current flights from localStorage (kept in sync with Firestore on login).
        // Fall back to the React state to prevent data loss if localStorage is empty.
        const lsFlights = JSON.parse(localStorage.getItem('flights-data') || 'null');
        const currentFlights = (lsFlights && lsFlights.length > 0) ? lsFlights : flights;
        const updated = isImport 
            ? [newRecord, ...currentFlights] 
            : (editingFlight ? currentFlights.map(f => f.id === editingFlight.id ? newRecord : f) : [newRecord, ...currentFlights]);
        
        // Debug log the actual record being saved
        console.log('Saving flight record to localStorage:', {
            id: newRecord.id,
            route: `${newRecord.origin} → ${newRecord.destination}`,
            isRoundTrip: newRecord.isRoundTrip,
            returnDate: newRecord.returnDate,
            date: newRecord.date
        });
        
        // Save to both state and localStorage
        setFlights(updated);
        localStorage.setItem('flights-data', JSON.stringify(updated));
        
        // Register flight to shared registry if user opted in and has flight number
        if (authUser && flightMatchingOptIn && newRecord.flightNumber && newRecord.date) {
          try {
            const flightKey = `${newRecord.flightNumber}_${newRecord.date}`.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
            const registryRef = doc(db, 'flightRegistry', flightKey);
            const registryDoc = await getDoc(registryRef);
            
            const userEntry = {
              uid: authUser.uid,
              nickname: nickname || authUser.displayName || 'Anonymous',
              addedAt: new Date().toISOString()
            };
            
            if (registryDoc.exists()) {
              const existing = registryDoc.data().passengers || [];
              if (!existing.some(p => p.uid === authUser.uid)) {
                await updateDoc(registryRef, { passengers: [...existing, userEntry] });
              }
            } else {
              await setDoc(registryRef, {
                flightNumber: newRecord.flightNumber,
                date: newRecord.date,
                passengers: [userEntry]
              });
            }
            // Refresh matches
            checkFlightMatches();
          } catch (regError) {
            console.error('Error registering flight:', regError);
          }
        }
        
        if (isImport) setSuggestedFlights(prev => prev.filter(f => f.id !== flightData.id));
        
        // Only reset form if not skipping (for round trip handling)
        if (!skipFormReset) {
          setShowForm(false);
          setEditingFlight(null);
          setFormData({ 
              origin: '', destination: '', date: '', returnDate: '', flightNumber: '', aircraftType: '', airline: '', 
              serviceClass: 'Economy', checkLandmarks: false, hasLayover: false, isRoundTrip: false,
              viaAirports: [''], legAirlines: ['', ''], legAircraftTypes: ['', ''], legServiceClasses: ['Economy', 'Economy'],
              paymentType: 'money', paymentAmount: ''
          });
          setAirportSuggestions([]);
          setActiveAirportField(null);
        }
    } catch (e) {
        console.error(e);
        if (skipStatusReset) {
            throw e; // Rethrow to let parent handle it
        }
        alert("Error saving flight. Check console for details.");
    } finally {
        if (!skipStatusReset) {
            setIsVerifying(false);
            setStatusMsg('');
        }
    }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Debug log for round trip submission
      console.log('Form submission - isRoundTrip:', formData.isRoundTrip, 'returnDate:', formData.returnDate);
      
      // For round trips, we save as a single flight record with isRoundTrip flag
      // The distance will be for one way, but stats will count it as 2x
      const dataToSave = {
        ...formData,
        id: editingFlight ? editingFlight.id : null,
        // Keep isRoundTrip flag and returnDate in the saved record
      };
      
      console.log('Data to save:', dataToSave.origin, dataToSave.destination, 'isRoundTrip:', dataToSave.isRoundTrip);
      
      handleSaveOrImport(dataToSave);
  };

  
  // All derived stats (totals, unique counts, groupings) computed via custom hook
  const {
    totalFlightLegs, totalMiles, totalPassengers,
    uniqueCountries, uniqueContinents, uniqueAirports,
    totalCarbonKg, totalCarbonTons, totalFlightCarbonKg, totalFlightCarbonTons,
    allFeatures, topFeatures, allAirlines, topAirlines,
    allAircraft, topAircraft,
    totalFlightsWithAirlines, sortedAlliances, dominantAlliance,
    sortedClasses, sortedCarbonByClass,
    paymentStats, groupedFlights, sortedGroups,
    groupedByCountry, groupedByContinent,
  } = useFlightStats(flights);
  
  
  // Save sort mode preference
  useEffect(() => {
    localStorage.setItem('flightSortMode', sortMode);
  }, [sortMode]);
  
  // Handler to copy/duplicate a flight
  const handleUpdateFlightNotes = async (flightId, notes) => {
    let updated;
    setFlights(prev => {
      updated = prev.map(f => f.id === flightId ? { ...f, notes } : f);
      return updated;
    });
    await new Promise(r => setTimeout(r, 0));
    if (updated) {
      localStorage.setItem('flights-data', JSON.stringify(updated));
    }
    if (authUser && updated) {
      try {
        const userDocRef = doc(db, 'users', authUser.uid);
        await updateDoc(userDocRef, { flights: updated });
      } catch (error) {
        console.error('Error saving flight notes to Firestore:', error);
      }
    }
  };

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
        returnDate: '',
        checkLandmarks: false,
        hasLayover: true,
        isRoundTrip: false,
        viaAirports: viaAirports.length > 0 ? viaAirports : [''],
        legAirlines: legAirlines,
        legAircraftTypes: legAircraftTypes,
        legServiceClasses: legServiceClasses,
        paymentType: 'money',
        paymentAmount: ''
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
        returnDate: '',
        checkLandmarks: false,
        hasLayover: false,
        isRoundTrip: false,
        viaAirports: [''],
        legAirlines: ['', ''],
        legAircraftTypes: ['', ''],
        legServiceClasses: ['Economy', 'Economy'],
        paymentType: 'money',
        paymentAmount: ''
      });
    }
    setShowForm(true);
  };

  // Handler to create a return flight (reverse origin and destination)
  const handleReverseFlight = (flight) => {
    setEditingFlight(null); // Not editing, creating new
    
    // Check if flight has multiple legs
    const hasMultipleLegs = flight.legs && flight.legs.length > 1;
    
    if (hasMultipleLegs) {
      // Reverse the entire route: destination becomes origin, via airports are reversed
      const reversedLegs = [...flight.legs].reverse();
      const viaAirports = reversedLegs.slice(1, -1).map(leg => leg.destination);
      const legAirlines = reversedLegs.map(leg => leg.airline || '');
      const legAircraftTypes = reversedLegs.map(leg => leg.aircraftType || '');
      const legServiceClasses = reversedLegs.map(leg => leg.serviceClass || 'Economy');
      
      setFormData({
        origin: flight.destination, // Swap
        destination: flight.origin, // Swap
        airline: '',
        aircraftType: '',
        serviceClass: 'Economy',
        date: '', // Clear date so user must enter new one
        returnDate: '',
        checkLandmarks: false,
        hasLayover: true,
        isRoundTrip: false,
        viaAirports: viaAirports.length > 0 ? viaAirports : [''],
        legAirlines: legAirlines,
        legAircraftTypes: legAircraftTypes,
        legServiceClasses: legServiceClasses,
        paymentType: 'money',
        paymentAmount: ''
      });
    } else {
      const singleLeg = flight.legs && flight.legs[0];
      setFormData({
        origin: flight.destination, // Swap
        destination: flight.origin, // Swap
        airline: flight.airline || (singleLeg ? singleLeg.airline : '') || '',
        aircraftType: flight.aircraftType || (singleLeg ? singleLeg.aircraftType : '') || '',
        serviceClass: flight.serviceClass || (singleLeg ? singleLeg.serviceClass : '') || 'Economy',
        date: '', // Clear date so user must enter new one
        returnDate: '',
        checkLandmarks: false,
        hasLayover: false,
        isRoundTrip: false,
        viaAirports: [''],
        legAirlines: ['', ''],
        legAircraftTypes: ['', ''],
        legServiceClasses: ['Economy', 'Economy'],
        paymentType: 'money',
        paymentAmount: ''
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
        flightNumber: flight.flightNumber || '',
        serviceClass: 'Economy',
        date: flight.date || '',
        returnDate: flight.returnDate || '',
        checkLandmarks: false,
        hasLayover: true,
        isRoundTrip: flight.isRoundTrip || false,
        viaAirports: viaAirports.length > 0 ? viaAirports : [''],
        legAirlines: legAirlines,
        legAircraftTypes: legAircraftTypes,
        legServiceClasses: legServiceClasses,
        paymentType: flight.paymentType || 'money',
        paymentAmount: flight.paymentAmount || ''
      });
    } else {
      const singleLeg = flight.legs && flight.legs[0];
      setFormData({
        origin: flight.origin,
        destination: flight.destination,
        airline: flight.airline || (singleLeg ? singleLeg.airline : '') || '',
        aircraftType: flight.aircraftType || (singleLeg ? singleLeg.aircraftType : '') || '',
        flightNumber: flight.flightNumber || '',
        serviceClass: flight.serviceClass || (singleLeg ? singleLeg.serviceClass : '') || 'Economy',
        date: flight.date || '',
        returnDate: flight.returnDate || '',
        checkLandmarks: false,
        hasLayover: false,
        isRoundTrip: flight.isRoundTrip || false,
        viaAirports: [''],
        legAirlines: ['', ''],
        legAircraftTypes: ['', ''],
        legServiceClasses: ['Economy', 'Economy'],
        paymentType: flight.paymentType || 'money',
        paymentAmount: flight.paymentAmount || ''
      });
    }
    setShowForm(true);
  };

  // Handler to delete a specific flight by unique ID
  const handleDeleteFlight = async (flightId) => {
    if (!flightId) {
      console.error('Cannot delete flight: no valid ID provided');
      return;
    }

    if (!window.confirm('Delete this flight?')) return;

    console.log('Deleting flight with ID:', flightId);

    // Use functional update to avoid stale closure issues
    let updated;
    setFlights(prev => {
      updated = prev.filter(x => x.id !== flightId);
      console.log('Deleted flights:', prev.length - updated.length, 'of', prev.length);
      return updated;
    });

    // Wait a tick so the functional update has settled
    await new Promise(r => setTimeout(r, 0));

    // Persist to localStorage
    if (updated) {
      localStorage.setItem('flights-data', JSON.stringify(updated));
    }

    // If user is authenticated, immediately update Firestore
    if (authUser && updated) {
      try {
        const userDocRef = doc(db, 'users', authUser.uid);
        await updateDoc(userDocRef, { flights: updated });
        console.log('Flight deleted from Firestore');
      } catch (error) {
        console.error('Error deleting flight from Firestore:', error);
      }
    }
  };

  // Handle landing page dismissal
  const handleStartAddingFlights = () => {
    localStorage.setItem('landingDismissed', 'true');
    setShowLanding(false);
    if (!authUser) {
      openAuthModal('signup');
    }
  };

  // Show landing page for non-logged-in users who haven't dismissed it
  if (showLanding && !authUser && !authLoading) {
    return (
      <LandingPage
        handleStartAddingFlights={handleStartAddingFlights}
        setShowLanding={setShowLanding}
        openAuthModal={openAuthModal}
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleAuthSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0 }}>FlightLog</h1>
          <span style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: '700',
            padding: '3px 8px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
          }}>
            Beta
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Auth UI */}
          {authLoading ? (
            <Loader2 className="animate-spin" size={20} style={{ color: '#888' }} />
          ) : authUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {editingNickname ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 8px', 
                  background: '#f0fdf4', 
                  borderRadius: '20px'
                }}>
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="Enter nickname"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNickname();
                      if (e.key === 'Escape') {
                        setEditingNickname(false);
                        setNicknameInput(nickname);
                      }
                    }}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '13px',
                      width: '120px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleSaveNickname}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingNickname(false);
                      setNicknameInput(nickname);
                    }}
                    style={{
                      background: '#f3f4f6',
                      color: '#666',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 12px', 
                    background: '#f0fdf4', 
                    borderRadius: '20px',
                    fontSize: '13px',
                    color: '#166534',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setNicknameInput(nickname || '');
                    setEditingNickname(true);
                  }}
                  title="Click to edit nickname"
                >
                  <User size={16} />
                  <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getDisplayName()}
                  </span>
                  <Edit2 size={12} style={{ opacity: 0.6 }} />
                </div>
              )}
              {/* Landmark refresh button — always accessible */}
              <button
                onClick={() => {
                  const flightsToProcess = [
                    ...getFlightsNeedingLandmarkRefresh(flights),
                    ...getFlightsForLandmarkAddition(flights),
                  ];
                  const ids = flightsToProcess.length > 0
                    ? [...new Set(flightsToProcess.map(f => f.id))]
                    : flights.map(f => f.id);
                  handleRefreshLandmarks(ids);
                }}
                disabled={isReprocessing || flights.length === 0}
                title={isReprocessing
                  ? `Processing… ${reprocessProgress.current}/${reprocessProgress.total}`
                  : 'Update landmarks for all flights'}
                style={{
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '7px 9px',
                  cursor: isReprocessing || flights.length === 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280',
                  opacity: flights.length === 0 ? 0.4 : 1,
                }}
              >
                {isReprocessing
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Mountain size={16} />}
              </button>
              {/* Admin button — visible to all admin users */}
              {isAdmin && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  title="Admin Dashboard"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.35)'
                  }}
                >
                  <Shield size={15} />
                  Admin
                </button>
              )}
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
                <LogOut size={18} /> Sign Out
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
            title="Import flights from your Gmail inbox"
            style={{ background: '#4285F4', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: gapiInited && !importing ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '13px', display: 'flex', gap: '6px', alignItems:'center', lineHeight: '18px', opacity: gapiInited && !importing ? 1 : 0.6 }}
          >
            {importing ? <Loader2 className="animate-spin" size={18}/> : <Mail size={18}/>}
            {importing ? "Scanning..." : "Add Flights from Gmail"}
          </button>
          <button onClick={() => {
            setEditingFlight(null);
            setFormData({
              origin: '', destination: '', date: '', returnDate: '', flightNumber: '', aircraftType: '', airline: '',
              serviceClass: 'Economy', checkLandmarks: false, hasLayover: false, isRoundTrip: false,
              viaAirports: [''], legAirlines: ['', ''], legAircraftTypes: ['', ''], legServiceClasses: ['Economy', 'Economy'],
              paymentType: 'money', paymentAmount: ''
            });
            setAirportSuggestions([]);
            setActiveAirportField(null);
            setShowForm(true);
          }} style={{ background: '#000', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', lineHeight: '18px' }}>
            + Manual Add
          </button>
        </div>
      </header>


	
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authError={authError}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleLogin={handleLogin}
          handleSignup={handleSignup}
          handleGoogleSignIn={handleGoogleSignIn}
          onClose={() => setShowAuthModal(false)}
        />
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

      {/* Gmail Import Progress Modal */}
      {importProgress.show && (
        <GmailImportProgressModal importProgress={importProgress} />
      )}

      {showImport && (
        <ImportSuggestionsModal
          suggestedFlights={suggestedFlights}
          setSuggestedFlights={setSuggestedFlights}
          setShowImport={setShowImport}
          handleDeleteSuggestion={handleDeleteSuggestion}
          handleSaveOrImport={handleSaveOrImport}
        />
      )}

	      {/* Landmark Detection Banner - Shows for refresh OR initial addition */}
    {flights.length > 0 && !landmarkRefreshDismissed && (() => {
	const flightsNeedingRefresh = getFlightsNeedingLandmarkRefresh(flights);
	const flightsNeedingAddition = getFlightsForLandmarkAddition(flights);
	const totalFlightsToProcess = flightsNeedingRefresh.length + flightsNeedingAddition.length;
	
	if (totalFlightsToProcess === 0) return null;
	
	const isRefresh = flightsNeedingRefresh.length > 0;
	const isAddition = flightsNeedingAddition.length > 0;
	
	return (
	    <div style={{
		     background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
		     border: '1px solid #10b981',
		     borderRadius: '12px',
		     padding: '16px 20px',
		     marginBottom: '24px',
		     display: 'flex',
		     alignItems: 'center',
		     justifyContent: 'space-between',
		     flexWrap: 'wrap',
		     gap: '12px'
		 }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
		    <div style={{
			     width: '40px',
			     height: '40px',
			     borderRadius: '10px',
			     background: '#10b981',
			     display: 'flex',
			     alignItems: 'center',
			     justifyContent: 'center'
			 }}>
			<Mountain size={20} color="#fff" />
		    </div>
		    <div>
			<div style={{ fontWeight: '600', color: '#065f46', fontSize: '14px' }}>
			    {isRefresh && isAddition 
			     ? 'Detect landmarks on your flights!' 
			     : isRefresh 
			     ? 'Improved landmark detection available!'
			     : 'Add landmarks to your flights!'}
			</div>
			<div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
			    {isRefresh && isAddition && (
				<>{flightsNeedingRefresh.length} can be refreshed, {flightsNeedingAddition.length} can have landmarks added</>
			    )}
			    {isRefresh && !isAddition && (
				<>{flightsNeedingRefresh.length} flight{flightsNeedingRefresh.length > 1 ? 's' : ''} can be refreshed with improved detection</>
			    )}
			    {!isRefresh && isAddition && (
				<>{flightsNeedingAddition.length} flight{flightsNeedingAddition.length > 1 ? 's' : ''} can have landmarks detected</>
			    )}
			</div>
		    </div>
		</div>
		<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
		    <button
			onClick={() => {
			    setLandmarkRefreshDismissed(true);
			    localStorage.setItem('landmarkRefreshDismissed', 'true');
			}}
			style={{
			    background: 'transparent',
			    color: '#047857',
			    border: '1px solid #10b981',
			    padding: '8px 16px',
			    borderRadius: '8px',
			    fontWeight: '600',
			    fontSize: '13px',
			    cursor: 'pointer'
			}}
		    >
			Dismiss
		    </button>
		    <button
			onClick={() => {
			    const allIds = [...new Set([
				...flightsNeedingRefresh.map(f => f.id),
				...flightsNeedingAddition.map(f => f.id)
			    ])];
			    handleRefreshLandmarks(allIds);
			}}
			disabled={isReprocessing}
			style={{
			    background: isReprocessing ? '#059669' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
			    color: '#fff',
			    border: 'none',
			    padding: '10px 20px',
			    borderRadius: '8px',
			    fontWeight: '600',
			    fontSize: '13px',
			    cursor: isReprocessing ? 'wait' : 'pointer',
			    display: 'flex',
			    alignItems: 'center',
			    gap: '8px',
			    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
			}}
		    >
			{isReprocessing ? (
			    <>
				<Loader2 className="animate-spin" size={16} />
				Processing... {reprocessProgress.current}/{reprocessProgress.total}
			    </>
			) : (
			    <>
				<Mountain size={16} />
				{isRefresh && isAddition ? 'Process All' : isRefresh ? 'Refresh Landmarks' : 'Add Landmarks'}
			    </>
			)}
		    </button>
		</div>
	    </div>
	);
    })()}
    

	    
      {/* Contest Opt-In Section - Compact Version */}
      {authUser && (
        <div style={{
          background: contestOptIn ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : '#f8fafc',
          border: contestOptIn ? '1px solid #f59e0b' : '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <Trophy size={20} color={contestOptIn ? '#f59e0b' : '#94a3b8'} />
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
              {contestOptIn ? '🏆 Competing in Global Contest' : 'Global Travel Contest'}
            </span>
            {!contestOptIn && (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                — Compare your stats worldwide
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: contestLoading ? 'wait' : 'pointer',
              padding: '6px 12px',
              background: contestOptIn ? '#fff' : '#f1f5f9',
              borderRadius: '8px',
              border: contestOptIn ? '1px solid #f59e0b' : '1px solid #e2e8f0',
              fontSize: '13px',
              fontWeight: '600',
              color: contestOptIn ? '#92400e' : '#475569',
              opacity: contestLoading ? 0.7 : 1
            }}>
              {contestLoading ? (
                <Loader2 className="animate-spin" size={14} style={{ color: '#f59e0b' }} />
              ) : (
                <input
                  type="checkbox"
                  checked={contestOptIn}
                  onChange={(e) => handleContestOptInToggle(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#f59e0b'
                  }}
                />
              )}
              {contestLoading ? '...' : (contestOptIn ? 'Opted In' : 'Opt In')}
            </label>
            
            <button
              onClick={() => setShowLeaderboard(true)}
              style={{
                background: '#1e293b',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={14} />
              Leaderboard
            </button>

          </div>
        </div>
      )}


      <FlightMatchingSection
        authUser={authUser}
        flightMatchingOptIn={flightMatchingOptIn}
        handleFlightMatchingToggle={handleFlightMatchingToggle}
        fellowPassengers={fellowPassengers}
        favoritePassengers={favoritePassengers}
        showFellowPassengers={showFellowPassengers}
        setShowFellowPassengers={setShowFellowPassengers}
        toggleFavoritePassenger={toggleFavoritePassenger}
        openChat={openChat}
      />

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          leaderboardData={leaderboardData}
          loadingLeaderboard={loadingLeaderboard}
          leaderboardSortBy={leaderboardSortBy}
          setLeaderboardSortBy={setLeaderboardSortBy}
          setShowLeaderboard={setShowLeaderboard}
          getSortedLeaderboard={getSortedLeaderboard}
          contestOptIn={contestOptIn}
          authUser={authUser}
          contestLoading={contestLoading}
          handleContestOptInToggle={handleContestOptInToggle}
          fetchLeaderboard={fetchLeaderboard}
        />
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && isAdmin && (
        <AdminDashboard
          authUser={authUser}
          onClose={() => setShowAdminDashboard(false)}
        />
      )}

      {/* Database Update Banner - Shows when flights need reprocessing */}
      {flights.length > 0 && getFlightsNeedingUpdate().length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '600', color: '#92400e', fontSize: '14px' }}>
                New features available for your flights!
              </div>
              <div style={{ fontSize: '12px', color: '#a16207', marginTop: '2px' }}>
                {getFlightsNeedingUpdate().length} flight{getFlightsNeedingUpdate().length > 1 ? 's' : ''} can be updated with country & continent data
              </div>
            </div>
          </div>
          <button
            onClick={handleReprocessDatabase}
            disabled={isReprocessing}
            style={{
              background: isReprocessing ? '#d97706' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: isReprocessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}
          >
            {isReprocessing ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Updating... {reprocessProgress.current}/{reprocessProgress.total}
              </>
            ) : (
              <>
                <Check size={16} />
                Update All Flights
              </>
            )}
          </button>
        </div>
      )}

      <div style={{ marginTop: '32px' }}>
      <StatsSection
        flights={flights}
        totalFlightLegs={totalFlightLegs}
        totalMiles={totalMiles}
        totalPassengers={totalPassengers}
        uniqueCountries={uniqueCountries}
        uniqueContinents={uniqueContinents}
        uniqueAirports={uniqueAirports}
        totalCarbonKg={totalCarbonKg}
        totalCarbonTons={totalCarbonTons}
        totalFlightCarbonKg={totalFlightCarbonKg}
        totalFlightCarbonTons={totalFlightCarbonTons}
        allFeatures={allFeatures}
        topFeatures={topFeatures}
        allAirlines={allAirlines}
        topAirlines={topAirlines}
        allAircraft={allAircraft}
        topAircraft={topAircraft}
        sortedAlliances={sortedAlliances}
        dominantAlliance={dominantAlliance}
        totalFlightsWithAirlines={totalFlightsWithAirlines}
        sortedClasses={sortedClasses}
        sortedCarbonByClass={sortedCarbonByClass}
        paymentStats={paymentStats}
        groupedFlights={groupedFlights}
      />
      </div>


      <FlightListSection
        flights={flights}
        sortMode={sortMode}
        setSortMode={setSortMode}
        sortedGroups={sortedGroups}
        groupedByCountry={groupedByCountry}
        groupedByContinent={groupedByContinent}
        handleEditFlight={handleEditFlight}
        handleDeleteFlight={handleDeleteFlight}
        handleCopyFlight={handleCopyFlight}
        handleReverseFlight={handleReverseFlight}
        handleUpdateFlightNotes={handleUpdateFlightNotes}
        flightMatches={flightMatches}
        flightMatchingOptIn={flightMatchingOptIn}
        openAllianceDropdown={openAllianceDropdown}
        setOpenAllianceDropdown={setOpenAllianceDropdown}
      />
      {/* Modal Form */}
      {showForm && (
        <FlightFormModal
          formData={formData}
          setFormData={setFormData}
          editingFlight={editingFlight}
          airportSuggestions={airportSuggestions}
          setAirportSuggestions={setAirportSuggestions}
          activeAirportField={activeAirportField}
          setActiveAirportField={setActiveAirportField}
          isVerifying={isVerifying}
          statusMsg={statusMsg}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingFlight(null);
            setFormData({
              origin: '', destination: '', date: '', returnDate: '', flightNumber: '', aircraftType: '', airline: '',
              serviceClass: 'Economy', checkLandmarks: false, hasLayover: false, isRoundTrip: false,
              viaAirports: [''], legAirlines: ['', ''], legAircraftTypes: ['', ''], legServiceClasses: ['Economy', 'Economy'],
              paymentType: 'money', paymentAmount: ''
            });
            setAirportSuggestions([]);
            setActiveAirportField(null);
          }}
        />
      )}


      {/* Chat Modal */}
      {chatOpen && chatPartner && (
        <ChatModal
          chatPartner={chatPartner}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          chatLoading={chatLoading}
          chatError={chatError}
          chatMessagesEndRef={chatMessagesEndRef}
          authUser={authUser}
          closeChat={closeChat}
          sendChatMessage={sendChatMessage}
        />
      )}
    </div>
  );
};


export default FlightTracker;
