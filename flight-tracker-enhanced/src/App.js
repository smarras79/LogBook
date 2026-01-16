import React, { useState, useEffect } from 'react';
import { 
  Plane, Plus, Trash2, Edit2, X, 
  Globe, BarChart3, Trophy, Loader2, Mail, Check, AlertCircle, Users, Sun, Map, Trees, Mountain 
} from 'lucide-react';

// --- CONFIGURATION ---
const GOOGLE_CLIENT_ID = "870884007039-9got7ia77t611u2fugedlq6j7kftf51p.apps.googleusercontent.com"; 
const GOOGLE_API_KEY = "AIzaSyDYzKON-9m0NYBIVZEXD434wDrmqMpyeQQ"; 
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
  { code: 'GRU', name: 'São Paulo/Guarulhos', city: 'São Paulo', lat: -23.4356, lon: -46.4731 },
];

const serviceClasses = ['Economy', 'Premium Economy', 'Business', 'First'];

// --- REFINED GEO DATABASE ---
const GEO_FEATURES = [
  // Oceans (Moved centers further from land and adjusted radii)
  { name: "North Atlantic Ocean", type: "ocean", lat: 42.0, lon: -40.0, radius: 1500 }, // Moved East
  { name: "South Atlantic Ocean", type: "ocean", lat: -15.0, lon: -15.0, radius: 1800 },
  { name: "North Pacific Ocean", type: "ocean", lat: 35.0, lon: -170.0, radius: 2500 }, // Moved West
  { name: "South Pacific Ocean", type: "ocean", lat: -25.0, lon: -130.0, radius: 2500 },
  { name: "Indian Ocean", type: "ocean", lat: -15.0, lon: 80.0, radius: 2200 },
  { name: "Arctic Ocean", type: "ocean", lat: 85.0, lon: 0.0, radius: 1200 },
  
  // Deserts
  { name: "Sahara Desert", type: "desert", lat: 23.4162, lon: 25.6628, radius: 1000 },
  { name: "Arabian Desert", type: "desert", lat: 18.2753, lon: 42.3667, radius: 600 },
  { name: "Gobi Desert", type: "desert", lat: 42.5900, lon: 103.4300, radius: 500 },
  { name: "Kalahari Desert", type: "desert", lat: -22.5609, lon: 21.0822, radius: 400 },
  { name: "Australian Outback", type: "desert", lat: -25.2744, lon: 133.7751, radius: 800 },
  
  // Forests & Nature
  { name: "Amazon Rainforest", type: "forest", lat: -3.4653, lon: -62.2159, radius: 1200 },
  { name: "Congo Rainforest", type: "forest", lat: -1.0000, lon: 22.0000, radius: 600 },
  { name: "Taiga (Siberia)", type: "forest", lat: 60.0000, lon: 100.0000, radius: 2000 },
  { name: "Black Forest", type: "forest", lat: 48.0000, lon: 8.2000, radius: 50 },
  
  // National Parks & Landmarks (Expanded for US Routes)
  { name: "Yellowstone NP", type: "park", lat: 44.4280, lon: -110.5885, radius: 80 },
  { name: "Rocky Mountain NP", type: "park", lat: 40.3428, lon: -105.6836, radius: 60 },
  { name: "Grand Canyon", type: "park", lat: 36.1069, lon: -112.1129, radius: 60 },
  { name: "Zion NP", type: "park", lat: 37.2982, lon: -113.0263, radius: 40 },
  { name: "Yosemite NP", type: "park", lat: 37.8651, lon: -119.5383, radius: 50 },
  { name: "Great Smoky Mtn NP", type: "park", lat: 35.6131, lon: -83.5532, radius: 50 },
  { name: "Banff NP", type: "park", lat: 51.4968, lon: -115.9281, radius: 60 },
  { name: "Great Lakes", type: "water", lat: 45.0000, lon: -85.0000, radius: 300 },
  { name: "The Alps", type: "mountain", lat: 46.8182, lon: 8.2275, radius: 150 },
  { name: "Himalayas", type: "mountain", lat: 27.9878, lon: 86.9250, radius: 400 },
];

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

const toRad = (val) => val * Math.PI / 180;
const toDeg = (val) => val * 180 / Math.PI;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// --- NEW GREAT CIRCLE MATH ---
// Calculates an intermediate point at fraction 'f' (0..1) between two lat/lons
const getIntermediatePoint = (lat1, lon1, lat2, lon2, f) => {
  const phi1 = toRad(lat1);
  const lam1 = toRad(lon1);
  const phi2 = toRad(lat2);
  const lam2 = toRad(lon2);

  // Angular distance (delta)
  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((phi2 - phi1) / 2), 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.pow(Math.sin((lam2 - lam1) / 2), 2)
  ));

  if (d === 0) return { lat: lat1, lon: lon1 };

  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);

  const x = A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2);
  const y = A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2);
  const z = A * Math.sin(phi1) + B * Math.sin(phi2);

  const newLat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const newLon = Math.atan2(y, x);

  return { lat: toDeg(newLat), lon: toDeg(newLon) };
};

const analyzeRoute = (origin, dest) => {
  if (!origin || !dest) return [];
  
  const steps = 30; // More steps for smoother curve
  const foundFeatures = new Set();

  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    // Use Great Circle Interpolation instead of Linear
    const point = getIntermediatePoint(origin.lat, origin.lon, dest.lat, dest.lon, f);

    GEO_FEATURES.forEach(feature => {
      const dist = calculateDistance(point.lat, point.lon, feature.lat, feature.lon);
      if (dist < feature.radius) {
        foundFeatures.add(feature.name);
      }
    });
  }
  return Array.from(foundFeatures);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  return `${month}-${day}-${year}`;
};

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

const FlightTracker = () => {
  const [user, setUser] = useState(null);
  const [flights, setFlights] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [suggestedFlights, setSuggestedFlights] = useState([]);
  const [gapiInited, setGapiInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [editingFlight, setEditingFlight] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    origin: '', destination: '', date: '', aircraftType: '', serviceClass: 'Economy'
  });

  useEffect(() => {
    const session = localStorage.getItem('user-profile');
    if (session) {
      setUser(JSON.parse(session));
      setFlights(JSON.parse(localStorage.getItem('flights-data') || '[]'));
    }

    const script1 = document.createElement('script');
    script1.src = "https://apis.google.com/js/api.js";
    script1.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: DISCOVERY_DOCS });
        setGapiInited(true);
      });
    };
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = "https://accounts.google.com/gsi/client";
    script2.onload = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '',
      });
      setTokenClient(client);
    };
    document.body.appendChild(script2);
  }, []);

  const extractFlightInfo = (message) => {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
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

    if (!origin || !destination) return null;

    const flightDate = new Date(dateHeader);
    const formattedDate = flightDate.toISOString().split('T')[0];

    return {
      id: message.id,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date: formattedDate,
      flightNumber: flightNum,
      aircraftType: 'Unknown',
      serviceClass: 'Economy',
      snippet: message.snippet.substring(0, 80) + "..."
    };
  };

  const handleGmailImport = () => {
    setImporting(true);
    tokenClient.callback = async (resp) => {
      if (resp.error) {
        console.error("Auth Error:", resp);
        alert("Authorization failed. Please check the console for details.");
        setImporting(false);
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

  const confirmImport = async (flight) => {
    let finalOrigin = flight.origin;
    let finalDest = flight.destination;
    if (finalOrigin === finalDest) { alert("Origin and Destination cannot be the same."); return; }

    const from = await fetchAirportData(finalOrigin);
    const to = await fetchAirportData(finalDest);

    if (from && to) {
      const dist = calculateDistance(from.lat, from.lon, to.lat, to.lon);
      const features = analyzeRoute(from, to); 
      
      const newFlight = { 
        ...flight, 
        id: Date.now(),
        origin: finalOrigin,
        destination: finalDest,
        distance: dist, 
        originCity: from.city, 
        destCity: to.city,
        featuresCrossed: features, 
        passengerCount: getPassengerEstimate(flight.aircraftType)
      };
      
      const updated = [newFlight, ...flights];
      setFlights(updated);
      localStorage.setItem('flights-data', JSON.stringify(updated));
      setSuggestedFlights(prev => prev.filter(f => f.id !== flight.id));
    } else {
      alert(`Could not verify airports ${finalOrigin} or ${finalDest}.`);
    }
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
          return {
            code: cleanCode,
            city: parts[2].replace(/"/g, ''),
            lat: parseFloat(parts[parts.length - 8]),
            lon: parseFloat(parts[parts.length - 7])
          };
        }
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    const from = await fetchAirportData(formData.origin);
    const to = await fetchAirportData(formData.destination);

    if (!from || !to) {
      alert(`Error: Could not find ${!from ? formData.origin : formData.destination}`);
      setIsVerifying(false);
      return;
    }

    const dist = calculateDistance(from.lat, from.lon, to.lat, to.lon);
    const features = analyzeRoute(from, to); 
    const pax = getPassengerEstimate(formData.aircraftType);

    const flightRecord = { 
      ...formData, 
      id: editingFlight ? editingFlight.id : Date.now(), 
      distance: dist, 
      originCity: from.city, 
      destCity: to.city,
      featuresCrossed: features,
      passengerCount: pax
    };

    const updatedFlights = editingFlight 
      ? flights.map(f => f.id === editingFlight.id ? flightRecord : f)
      : [flightRecord, ...flights];

    saveFlights(updatedFlights);
    setShowForm(false);
    setEditingFlight(null);
    setIsVerifying(false);
    setFormData({ origin: '', destination: '', date: '', aircraftType: '', serviceClass: 'Economy' });
  };
  
  const saveFlights = (updated) => {
    setFlights(updated);
    localStorage.setItem('flights-data', JSON.stringify(updated));
  };
  
  const totalMiles = flights.reduce((sum, f) => sum + (f.distance || 0), 0);
  const totalPassengers = flights.reduce((sum, f) => sum + (f.passengerCount || getPassengerEstimate(f.aircraftType)), 0);
  
  const featureStats = {};
  flights.forEach(f => {
    if (f.featuresCrossed) {
      f.featuresCrossed.forEach(feat => {
        featureStats[feat] = (featureStats[feat] || 0) + 1;
      });
    }
  });
  const topFeatures = Object.entries(featureStats).sort((a,b) => b[1]-a[1]).slice(0, 5);

  const aircraftStats = flights.reduce((acc, f) => {
      const type = f.aircraftType || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  const topAircraft = Object.entries(aircraftStats).sort((a,b) => b[1]-a[1]).slice(0, 3);
  const sortedFlights = [...flights].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: 0 }}>FlightLog</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleGmailImport} 
            disabled={!gapiInited || importing}
            style={{ background: '#4285F4', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems:'center' }}
          >
            {importing ? <Loader2 className="animate-spin" size={18}/> : <Mail size={18}/>}
            {importing ? "Scanning..." : "Sync Gmail"}
          </button>
          <button onClick={() => { setEditingFlight(null); setShowForm(true); }} style={{ background: '#000', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Manual Add
          </button>
        </div>
      </header>

      {/* --- Import Modal --- */}
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
                      <div style={{fontSize:'12px', color:'#666'}}>{formatDate(f.date)}</div>
                    </div>
                    <button onClick={() => confirmImport(f)} style={{background: '#00C851', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px'}}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={statCard}><Globe size={20}/><div style={statVal}>{totalMiles.toLocaleString()}</div><div style={statLbl}>Total Miles</div></div>
        <div style={statCard}><Users size={20}/><div style={statVal}>{totalPassengers.toLocaleString()}</div><div style={statLbl}>Fellow Travelers</div></div>
        <div style={statCard}><Map size={20}/><div style={statVal}>{Object.keys(featureStats).length}</div><div style={statLbl}>Landmarks Seen</div></div>
        <div style={statCard}><Trophy size={20}/><div style={statVal}>{((totalMiles / 238855) * 100).toFixed(2)}%</div><div style={statLbl}>To the Moon</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {/* Top Aircraft Chart */}
        {flights.length > 0 && (
          <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}><BarChart3 size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Top Aircraft</h3>
            {topAircraft.map(([type, count]) => (
              <div key={type} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{type}</span><span>{count} flights</span></div>
                <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                  <div style={{ height: '100%', background: '#000', borderRadius: '4px', width: `${(count/flights.length)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Top Landmarks Chart */}
        {flights.length > 0 && (
          <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}><Mountain size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Top Landmarks</h3>
            {topFeatures.length === 0 ? <p style={{color:'#666', fontSize:'13px'}}>No landmarks crossed yet.</p> : topFeatures.map(([name, count]) => (
              <div key={name} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{name}</span><span>{count} times</span></div>
                <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                  <div style={{ height: '100%', background: '#008080', borderRadius: '4px', width: `${(count/flights.length)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flight List */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {sortedFlights.map(f => (
          <div key={f.id} style={{ border: '1px solid #eee', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{f.origin} → {f.destination}</span>
              <div style={{display: 'flex', gap: '10px'}}>
                <Edit2 size={18} style={{ cursor: 'pointer' }} onClick={() => { setEditingFlight(f); setShowForm(true); }} />
                <Trash2 size={18} color="red" style={{ cursor: 'pointer' }} onClick={() => saveFlights(flights.filter(x => x.id !== f.id))} />
              </div>
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>{f.originCity} to {f.destCity}</div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#888' }}>
              <span>{formatDate(f.date)}</span>
              {f.flightNumber && <span>✈️ {f.flightNumber}</span>}
              <span>🏢 {f.aircraftType || 'N/A'}</span>
              <span>👥 ~{f.passengerCount || getPassengerEstimate(f.aircraftType)} pax</span>
            </div>
            {f.featuresCrossed && f.featuresCrossed.length > 0 && (
              <div style={{marginTop:'12px', display:'flex', flexWrap:'wrap', gap:'8px'}}>
                {f.featuresCrossed.map(feat => {
                  let icon = <Globe size={10}/>;
                  let color = '#555';
                  let bg = '#eee';
                  if (feat.includes("Ocean")) { icon = "🌊"; color = "#006994"; bg="#e0f7fa"; }
                  else if (feat.includes("Desert")) { icon = "☀️"; color = "#d97706"; bg="#fef3c7"; }
                  else if (feat.includes("Forest")) { icon = "🌲"; color = "#166534"; bg="#dcfce7"; }
                  else if (feat.includes("NP") || feat.includes("Park") || feat.includes("Canyon")) { icon = "🏞️"; color = "#78350f"; bg="#ffedd5"; }
                  
                  return (
                    <span key={feat} style={{fontSize:'11px', background:bg, color:color, padding:'4px 8px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'4px', fontWeight:'600'}}>
                      {icon} {feat}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{editingFlight ? 'Edit Flight' : 'Log Flight'}</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input placeholder="Origin" required value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value.toUpperCase()})} style={inputStyle} />
              <input placeholder="Destination" required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value.toUpperCase()})} style={inputStyle} />
              <input placeholder="Aircraft Type (e.g. B777)" value={formData.aircraftType} onChange={e => setFormData({...formData, aircraftType: e.target.value})} style={inputStyle} />
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={inputStyle} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>CLASS OF SERVICE</label>
                <select value={formData.serviceClass} onChange={e => setFormData({...formData, serviceClass: e.target.value})} style={inputStyle}>
                  {serviceClasses.map(cls => (<option key={cls} value={cls}>{cls}</option>))}
                </select>
              </div>
              <button type="submit" disabled={isVerifying} style={{ background: '#000', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                {isVerifying ? 'Saving...' : editingFlight ? 'Update Flight' : 'Save Flight'}
              </button>
            </form>
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
