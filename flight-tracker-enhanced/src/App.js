import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Calendar, LogOut, BarChart3, Loader2 } from 'lucide-react';

// Expanded local list for instant testing
const LOCAL_AIRPORTS = [
  { code: 'JFK', city: 'New York', lat: 40.6413, lon: -73.7781 },
  { code: 'IST', city: 'Istanbul', lat: 41.2753, lon: 28.7519 },
  { code: 'ATH', city: 'Athens', lat: 37.9356, lon: 23.9484 },
  { code: 'LAX', city: 'Los Angeles', lat: 33.9416, lon: -118.4085 },
  { code: 'LHR', city: 'London', lat: 51.4700, lon: -0.4543 }
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const FlightTracker = () => {
  const [user, setUser] = useState(null);
  const [flights, setFlights] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    origin: '', destination: '', date: '', flightNumber: '', aircraftType: '', serviceClass: 'Economy'
  });

  // Load Session & Database
  useEffect(() => {
    const session = localStorage.getItem('flightlog-session');
    if (session) {
      const userData = JSON.parse(session);
      setUser(userData);
      const db = JSON.parse(localStorage.getItem('flightlog-db') || '{}');
      setFlights(db[userData.email] || []);
    }
  }, []);

  const saveFlights = (updated) => {
    setFlights(updated);
    const db = JSON.parse(localStorage.getItem('flightlog-db') || '{}');
    db[user.email] = updated;
    localStorage.setItem('flightlog-db', JSON.stringify(db));
  };

  // THE WEB LOOKUP FUNCTION
  const getAirport = async (code) => {
    const c = code.trim().toUpperCase();
    
    // 1. Try local list first
    const local = LOCAL_AIRPORTS.find(a => a.code === c);
    if (local) return local;

    // 2. TRUE WEB LOOKUP
    try {
      // Using the hexo-airport API which is a reliable public mirror
      const response = await fetch(`https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat`);
      const text = await response.text();
      const rows = text.split('\n');
      
      for (let row of rows) {
        const parts = row.split(',');
        // OpenFlights format: IATA is usually the 5th column (index 4) or 6th (index 5)
        // This is a more brute-force but 100% web-based reliable method
        if (row.includes(`"${c}"`)) {
          const lat = parseFloat(parts[parts.length - 8]);
          const lon = parseFloat(parts[parts.length - 7]);
          const city = parts[2].replace(/"/g, '');
          if (!isNaN(lat) && !isNaN(lon)) {
            return { code: c, city, lat, lon };
          }
        }
      }
    } catch (e) {
      console.error("Web fetch failed", e);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);

    const from = await getAirport(formData.origin);
    const to = await getAirport(formData.destination);

    if (!from || !to) {
      alert(`Could not locate ${!from ? formData.origin : formData.destination} on the web. Please verify the IATA/ICAO code.`);
      setIsVerifying(false);
      return;
    }

    const dist = calculateDistance(from.lat, from.lon, to.lat, to.lon);
    const newFlight = { 
      ...formData, 
      id: Date.now(), 
      distance: dist, 
      originCity: from.city, 
      destCity: to.city 
    };

    saveFlights([newFlight, ...flights]);
    setShowForm(false);
    setIsVerifying(false);
    setFormData({ origin: '', destination: '', date: '', flightNumber: '', aircraftType: '', serviceClass: 'Economy' });
  };

  const aircraftStats = () => {
    const counts = {};
    flights.forEach(f => {
      const type = f.aircraftType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  };

  if (!user) return <div style={{padding: '50px', textAlign: 'center'}}>Please refresh or login.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>FlightLog Dashboard</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#000', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>+ Add Flight</button>
      </div>

      {/* Stats Chart */}
      {flights.length > 0 && (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
          <h4 style={{ margin: '0 0 15px 0' }}><BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> Aircraft Stats</h4>
          {aircraftStats().map(([type, count]) => (
            <div key={type} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}><span>{type}</span><span>{count}</span></div>
              <div style={{ height: '6px', background: '#ddd', borderRadius: '3px' }}>
                <div style={{ height: '100%', background: '#000', borderRadius: '3px', width: `${(count/flights.length)*100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flight Cards */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {flights.map(f => (
          <div key={f.id} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{f.origin} → {f.destination}</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Trash2 size={16} color="red" style={{ cursor: 'pointer' }} onClick={() => saveFlights(flights.filter(x => x.id !== f.id))} />
              </div>
            </div>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>{f.originCity} to {f.destCity}</div>
            <div style={{ fontSize: '12px', display: 'flex', gap: '15px' }}>
              <span>📅 {f.date}</span>
              {f.flightNumber && <span>✈️ {f.flightNumber}</span>}
              {f.aircraftType && <span>🏢 {f.aircraftType}</span>}
            </div>
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f5f5f5', fontWeight: 'bold' }}>
              {f.distance.toLocaleString()} miles
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Log Flight</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
              <input placeholder="Origin (e.g. DOH)" required value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value.toUpperCase()})} style={{ padding: '10px' }} />
              <input placeholder="Destination (e.g. SIN)" required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value.toUpperCase()})} style={{ padding: '10px' }} />
              <input placeholder="Flight Number (Optional)" value={formData.flightNumber} onChange={e => setFormData({...formData, flightNumber: e.target.value.toUpperCase()})} style={{ padding: '10px' }} />
              <input placeholder="Aircraft Type (Optional)" value={formData.aircraftType} onChange={e => setFormData({...formData, aircraftType: e.target.value})} style={{ padding: '10px' }} />
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ padding: '10px' }} />
              <button type="submit" disabled={isVerifying} style={{ padding: '12px', background: '#000', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}>
                {isVerifying ? 'Checking Web Database...' : 'Save Flight'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightTracker;
