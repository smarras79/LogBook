import React, { useState, useEffect } from 'react';
import { 
  Plane, Plus, Trash2, Edit2, X, 
  LogOut, Globe, BarChart3, Trophy, Loader2, Mail, Check 
} from 'lucide-react';

// --- CONFIGURATION (YOU MUST FILL THIS) ---
const GOOGLE_CLIENT_ID = "870884007039-9got7ia77t611u2fugedlq6j7kftf51p.apps.googleusercontent.com"; 
const GOOGLE_API_KEY = "AIzaSyDYzKON-9m0NYBIVZEXD434wDrmqMpyeQQ"; 
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

const AIRPORTS_DATABASE = [
  { code: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', lat: 40.6413, lon: -73.7781 },
  { code: 'LHR', name: 'London Heathrow', city: 'London', lat: 51.4700, lon: -0.4543 },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', lat: 41.2753, lon: 28.7519 },
  // ... (Your other airports)
];

const serviceClasses = ['Economy', 'Premium Economy', 'Business', 'First'];

// ... (Keep calculateDistance, fetchAirportData, formatDate helpers from previous code) ...
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  return `${month}-${day}-${year}`;
};

const FlightTracker = () => {
  const [user, setUser] = useState(null);
  const [flights, setFlights] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false); // New Import Modal
  const [importing, setImporting] = useState(false);
  const [suggestedFlights, setSuggestedFlights] = useState([]);
  const [gapiInited, setGapiInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  const [editingFlight, setEditingFlight] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    origin: '', destination: '', date: '', aircraftType: '', serviceClass: 'Economy'
  });

  // 1. Initialize Google API on Load
  useEffect(() => {
    const session = localStorage.getItem('user-profile');
    if (session) {
      setUser(JSON.parse(session));
      setFlights(JSON.parse(localStorage.getItem('flights-data') || '[]'));
    }

    // Load Google Scripts dynamically
    const script1 = document.createElement('script');
    script1.src = "https://apis.google.com/js/api.js";
    script1.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        });
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
        callback: '', // defined later
      });
      setTokenClient(client);
    };
    document.body.appendChild(script2);
  }, []);

  // 2. Flight Parsing Logic (The "Brain")
  const parseEmailForFlight = (message) => {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const dateHeader = headers.find(h => h.name === 'Date')?.value || '';
    const snippet = message.snippet;

    // Pattern Matching for IATA codes (e.g., "JFK to LHR", "JFK-LHR", "JFK -> LHR")
    const routeRegex = /\b([A-Z]{3})\s*(?:to|-|->|–)\s*([A-Z]{3})\b/i;
    const match = subject.match(routeRegex) || snippet.match(routeRegex);

    // Date Parsing
    const flightDate = new Date(dateHeader);
    const formattedDate = flightDate.toISOString().split('T')[0];

    if (match) {
      return {
        id: message.id, // Use email ID as temp ID
        origin: match[1].toUpperCase(),
        destination: match[2].toUpperCase(),
        date: formattedDate,
        aircraftType: 'Unknown',
        serviceClass: 'Economy',
        source: 'Gmail Import',
        snippet: snippet.substring(0, 100) + "..."
      };
    }
    return null;
  };

  // 3. Connect & Fetch
  const handleGmailImport = () => {
    setImporting(true);
    tokenClient.callback = async (resp) => {
      if (resp.error) {
        setImporting(false);
        throw (resp);
      }
      
      try {
        // Search query: looking for confirmation emails
        const response = await window.gapi.client.gmail.users.messages.list({
          'userId': 'me',
          'q': 'subject:(flight confirmation) OR subject:(eticket) OR subject:(itinerary) after:2010/01/01',
          'maxResults': 15
        });

        const messages = response.result.messages || [];
        const suggestions = [];

        // Fetch details for each email found
        for (let msg of messages) {
          const details = await window.gapi.client.gmail.users.messages.get({
            'userId': 'me',
            'id': msg.id
          });
          const flight = parseEmailForFlight(details.result);
          if (flight) suggestions.push(flight);
        }
        
        setSuggestedFlights(suggestions);
        setShowImport(true);
      } catch (err) {
        console.error("Gmail Import Error", err);
        alert("Could not import flights. Check console for details.");
      } finally {
        setImporting(false);
      }
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      tokenClient.requestAccessToken({prompt: ''});
    }
  };

  // 4. Save Imported Flight
  const confirmImport = async (flight) => {
    // We treat this like a form submission to fetch coords
    const from = await fetchAirportData(flight.origin);
    const to = await fetchAirportData(flight.destination);

    if (from && to) {
      const dist = calculateDistance(from.lat, from.lon, to.lat, to.lon);
      const newFlight = { 
        ...flight, 
        id: Date.now(), // New ID
        distance: dist, 
        originCity: from.city, 
        destCity: to.city 
      };
      
      // Add to main list
      const updated = [newFlight, ...flights];
      setFlights(updated);
      localStorage.setItem('flights-data', JSON.stringify(updated));
      
      // Remove from suggestions
      setSuggestedFlights(prev => prev.filter(f => f.id !== flight.id));
    } else {
      alert("Found codes " + flight.origin + "/" + flight.destination + " but couldn't verify them. Please add manually.");
    }
  };

  // ... (Rest of saveFlights, handleSubmit, stats logic remains the same) ...
  const saveFlights = (updated) => {
    setFlights(updated);
    localStorage.setItem('flights-data', JSON.stringify(updated));
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

  const handleEdit = (flight) => {
      setEditingFlight(flight);
      setFormData({
        origin: flight.origin,
        destination: flight.destination,
        date: flight.date,
        aircraftType: flight.aircraftType || '',
        serviceClass: flight.serviceClass || 'Economy'
      });
      setShowForm(true);
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
      
      const flightRecord = { 
        ...formData, 
        id: editingFlight ? editingFlight.id : Date.now(), 
        distance: dist, 
        originCity: from.city, 
        destCity: to.city 
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
  
  const totalMiles = flights.reduce((sum, f) => sum + (f.distance || 0), 0);
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
              <h2>Found {suggestedFlights.length} Flights</h2>
              <X style={{cursor:'pointer'}} onClick={() => setShowImport(false)}/>
            </div>
            
            {suggestedFlights.length === 0 ? (
              <p>No flights found in recent emails. Try searching for specific keywords.</p>
            ) : (
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {suggestedFlights.map(f => (
                  <div key={f.id} style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:'bold'}}>{f.origin} → {f.destination}</div>
                      <div style={{fontSize:'12px', color:'#666'}}>{formatDate(f.date)}</div>
                      <div style={{fontSize:'10px', color:'#999', marginTop:'4px'}}>{f.snippet}</div>
                    </div>
                    <button onClick={() => confirmImport(f)} style={{background: '#00C851', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor:'pointer'}}>
                      <Check size={16} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Normal Stats & List (Existing Code) */}
      {/* Stats Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div style={statCard}><Globe size={20}/><div style={statVal}>{totalMiles.toLocaleString()}</div><div style={statLbl}>Total Miles</div></div>
              <div style={statCard}><Plane size={20}/><div style={statVal}>{flights.length}</div><div style={statLbl}>Total Flights</div></div>
              <div style={statCard}><Trophy size={20}/><div style={statVal}>{((totalMiles / 238855) * 100).toFixed(2)}%</div><div style={statLbl}>To the Moon</div></div>
            </div>
      
            {/* Top Aircraft Chart */}
            {flights.length > 0 && (
              <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px', marginBottom: '40px' }}>
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
      
            {/* Flight List */}
            <div style={{ display: 'grid', gap: '20px' }}>
              {sortedFlights.map(f => (
                <div key={f.id} style={{ border: '1px solid #eee', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{f.origin} → {f.destination}</span>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <Edit2 size={18} style={{ cursor: 'pointer' }} onClick={() => handleEdit(f)} />
                      <Trash2 size={18} color="red" style={{ cursor: 'pointer' }} onClick={() => saveFlights(flights.filter(x => x.id !== f.id))} />
                    </div>
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>{f.originCity} to {f.destCity}</div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#888' }}>
                    <span>{formatDate(f.date)}</span>
                    <span>✈️ {f.aircraftType || 'N/A'}</span>
                    <span style={{color:'#007bff', fontWeight:'bold'}}>{f.serviceClass}</span>
                  </div>
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f5f5f5', fontSize: '18px', fontWeight: 'bold' }}>
                    {f.distance?.toLocaleString()} miles
                  </div>
                </div>
              ))}
            </div>

      {/* Manual Add Form (Existing Modal) */}
      {showForm && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{editingFlight ? 'Edit Flight' : 'Log Flight'}</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input placeholder="Origin (e.g. IST)" required value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value.toUpperCase()})} style={inputStyle} />
              <input placeholder="Destination (e.g. ATH)" required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value.toUpperCase()})} style={inputStyle} />
              <input placeholder="Aircraft Type (e.g. A350)" value={formData.aircraftType} onChange={e => setFormData({...formData, aircraftType: e.target.value})} style={inputStyle} />
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
