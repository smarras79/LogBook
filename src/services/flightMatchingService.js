/**
 * Flight Matching Service
 * 
 * Handles all logic for the "Fellow Passengers" feature:
 * - Generating flight keys from flight number + date
 * - Registering users to flights in Firestore
 * - Finding matches between users on same flights
 * - Removing users from flight registries
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  getDocs 
} from 'firebase/firestore';

/**
 * Generate a unique key for a flight based on flight number and date
 * @param {string} flightNumber - Flight number (e.g., "DL 15", "AA123")
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} - Normalized flight key (e.g., "DL15_2024-02-16")
 */
export const generateFlightKey = (flightNumber, date) => {
  return `${flightNumber}_${date}`.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
};

/**
 * Register a user to a flight in the shared registry
 * @param {Object} db - Firestore database instance
 * @param {Object} flight - Flight object with flightNumber and date
 * @param {string} userId - User's UID
 * @param {string} nickname - User's display name
 * @returns {Promise<void>}
 */
export const registerUserToFlight = async (db, flight, userId, nickname) => {
  const flightKey = generateFlightKey(flight.flightNumber, flight.date);
  console.log(`Registering flight: "${flight.flightNumber}" on ${flight.date} as key: "${flightKey}"`);
  
  const registryRef = doc(db, 'flightRegistry', flightKey);
  const registryDoc = await getDoc(registryRef);
  
  const userEntry = {
    uid: userId,
    nickname: nickname || 'Anonymous',
    addedAt: new Date().toISOString()
  };
  
  if (registryDoc.exists()) {
    const existing = registryDoc.data().passengers || [];
    console.log(`Flight ${flightKey} already has ${existing.length} passengers`);
    
    // Don't add duplicate
    if (!existing.some(p => p.uid === userId)) {
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
};

/**
 * Remove a user from a flight registry
 * @param {Object} db - Firestore database instance
 * @param {Object} flight - Flight object with flightNumber and date
 * @param {string} userId - User's UID
 * @returns {Promise<void>}
 */
export const removeUserFromFlight = async (db, flight, userId) => {
  const flightKey = generateFlightKey(flight.flightNumber, flight.date);
  const registryRef = doc(db, 'flightRegistry', flightKey);
  const registryDoc = await getDoc(registryRef);
  
  if (registryDoc.exists()) {
    const existing = registryDoc.data().passengers || [];
    const filtered = existing.filter(p => p.uid !== userId);
    await updateDoc(registryRef, { passengers: filtered });
    console.log(`Removed user from flight ${flightKey}`);
  }
};

/**
 * Register all user flights to the flight registry
 * @param {Object} db - Firestore database instance
 * @param {Array} flights - Array of flight objects
 * @param {string} userId - User's UID
 * @param {string} nickname - User's display name
 * @returns {Promise<void>}
 */
export const registerAllFlights = async (db, flights, userId, nickname) => {
  const flightsWithNumbers = flights.filter(f => f.flightNumber && f.date);
  console.log(`Registering ${flightsWithNumbers.length} flights for user ${userId}`);
  
  for (const flight of flightsWithNumbers) {
    await registerUserToFlight(db, flight, userId, nickname);
  }
};

/**
 * Remove user from all flight registries
 * @param {Object} db - Firestore database instance
 * @param {Array} flights - Array of flight objects
 * @param {string} userId - User's UID
 * @returns {Promise<void>}
 */
export const unregisterAllFlights = async (db, flights, userId) => {
  const flightsWithNumbers = flights.filter(f => f.flightNumber && f.date);
  console.log(`Unregistering ${flightsWithNumbers.length} flights for user ${userId}`);
  
  for (const flight of flightsWithNumbers) {
    await removeUserFromFlight(db, flight, userId);
  }
};

/**
 * List all documents in the flight registry (for debugging)
 * @param {Object} db - Firestore database instance
 * @returns {Promise<void>}
 */
export const listAllFlightRegistries = async (db) => {
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
};

/**
 * Find fellow passengers on user's flights
 * @param {Object} db - Firestore database instance
 * @param {Array} flights - User's flights
 * @param {string} userId - Current user's UID
 * @param {boolean} enableDebugLogging - Whether to show detailed logs
 * @returns {Promise<Object>} - { matches: {}, fellowPassengers: [] }
 */
export const findFellowPassengers = async (db, flights, userId, enableDebugLogging = true) => {
  if (enableDebugLogging) {
    console.log('========== CHECKING FLIGHT MATCHES ==========');
    console.log('Current user ID:', userId);
    
    // List all registries for debugging
    await listAllFlightRegistries(db);
  }
  
  const matches = {};
  const fellowPassengersData = [];
  const flightsWithNumbers = flights.filter(f => f.flightNumber && f.date);
  
  if (enableDebugLogging) {
    console.log('Flights with numbers:', flightsWithNumbers.length);
    console.log('Flight details:', flightsWithNumbers.map(f => ({
      flightNumber: f.flightNumber,
      date: f.date,
      origin: f.origin,
      destination: f.destination
    })));
  }
  
  for (const flight of flightsWithNumbers) {
    const flightKey = generateFlightKey(flight.flightNumber, flight.date);
    
    if (enableDebugLogging) {
      console.log(`\n--- Checking Flight ---`);
      console.log(`Original flight number: "${flight.flightNumber}"`);
      console.log(`Original date: "${flight.date}"`);
      console.log(`Generated key: "${flightKey}"`);
    }
    
    try {
      const registryRef = doc(db, 'flightRegistry', flightKey);
      
      if (enableDebugLogging) {
        console.log(`Attempting to read from: flightRegistry/${flightKey}`);
      }
      
      const registryDoc = await getDoc(registryRef);
      
      if (enableDebugLogging) {
        console.log(`Document exists: ${registryDoc.exists()}`);
      }
      
      if (registryDoc.exists()) {
        const docData = registryDoc.data();
        
        if (enableDebugLogging) {
          console.log('Full document data:', JSON.stringify(docData, null, 2));
        }
        
        const passengers = docData.passengers || [];
        
        if (enableDebugLogging) {
          console.log(`Total passengers in registry: ${passengers.length}`);
          console.log('All passengers:', passengers.map(p => ({
            uid: p.uid,
            nickname: p.nickname,
            addedAt: p.addedAt
          })));
        }
        
        // Filter out current user and get other passengers
        const others = passengers.filter(p => {
          if (enableDebugLogging) {
            console.log(`Comparing: "${p.uid}" !== "${userId}" = ${p.uid !== userId}`);
          }
          return p.uid !== userId;
        });
        
        if (enableDebugLogging) {
          console.log(`Fellow passengers (excluding self): ${others.length}`);
        }
        
        if (others.length > 0) {
          if (enableDebugLogging) {
            console.log('✓ MATCH FOUND! Other passengers:', others.map(p => p.nickname));
          }
          
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
            
            if (enableDebugLogging) {
              console.log('Adding fellow passenger:', passengerData);
            }
            
            fellowPassengersData.push(passengerData);
          });
        } else {
          if (enableDebugLogging) {
            console.log('✗ No other passengers on this flight (only you)');
          }
        }
      } else {
        if (enableDebugLogging) {
          console.log(`✗ No registry document found for flight ${flightKey}`);
          console.log('This means no one has registered for this flight yet.');
        }
      }
    } catch (e) {
      console.error(`❌ ERROR checking flight ${flightKey}:`, e);
      console.error('Error name:', e.name);
      console.error('Error message:', e.message);
      console.error('Error code:', e.code);
    }
  }
  
  if (enableDebugLogging) {
    console.log('\n========== FINAL RESULTS ==========');
    console.log('Total fellow passengers found:', fellowPassengersData.length);
    console.log('Fellow passengers data:', fellowPassengersData);
    console.log('Matches object:', matches);
    console.log('=====================================\n');
  }
  
  return {
    matches,
    fellowPassengers: fellowPassengersData
  };
};

/**
 * Toggle flight matching opt-in for a user
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User's UID
 * @param {string} nickname - User's display name
 * @param {Array} flights - User's flights
 * @param {boolean} newValue - New opt-in value (true/false)
 * @returns {Promise<Object>} - { matches: {}, fellowPassengers: [] } or empty if opting out
 */
export const toggleFlightMatching = async (db, userId, nickname, flights, newValue) => {
  const userDocRef = doc(db, 'users', userId);
  
  try {
    // Update user's preference
    await updateDoc(userDocRef, { flightMatchingOptIn: newValue });
    
    if (newValue) {
      // Opting in: register all flights
      await registerAllFlights(db, flights, userId, nickname);
      
      // Return the matches
      return await findFellowPassengers(db, flights, userId);
    } else {
      // Opting out: remove from all registries
      await unregisterAllFlights(db, flights, userId);
      
      return {
        matches: {},
        fellowPassengers: []
      };
    }
  } catch (error) {
    console.error('Error toggling flight matching:', error);
    throw error;
  }
};
