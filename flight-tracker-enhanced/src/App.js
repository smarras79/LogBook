import React, { useState, useEffect } from 'react';
import { Plane, Plus, Trash2, Edit2, X, Calendar, LogOut, BarChart3, Loader2, Info } from 'lucide-react';

// Expanded Database to ensure hubs like IST work instantly
const AIRPORTS_DATABASE = [
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lon: 28.7519 },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', lat: 40.6413, lon: -73.7781 },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', lat: 33.9416, lon: -118.4085 },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543 },
  { code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719 },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
];

const serviceClasses = ['Economy', 'Premium Economy', 'Business', 'First'];

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
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [flights, setFlights] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    flightNumber: '',
    aircraftType: '',
    serviceClass: 'Economy'
  });

  const [authInput, setAuthInput] = useState({ email: '', password: '', name: '' });

  useEffect(() => {
    const activeUser = localStorage.getItem('flightlog-session');
    if (activeUser) {
      const userData = JSON.parse(activeUser);
      setUser(userData);
      setShowAuth(false);
      const db = JSON.parse(localStorage.getItem('flightlog-db') || '{}');
      setFlights(db[userData.email] || []);
    }
  }, []);

  const saveToDb = (updatedFlights) => {
    const db = JSON.parse(localStorage.getItem('flightlog-db') || '{}');
    db[user.email] = updatedFlights;
    localStorage.setItem('flightlog-db', JSON.stringify(db));
    setFlights(updatedFlights);
  };

  const handleAuth = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('flightlog-users') || '[]');
    if (authMode === 'register') {
      if (users.find(u => u.email === authInput.email)) return alert('Email already registered');
      users.push(authInput);
      localStorage.setItem('flightlog-users', JSON.stringify(users));
      login(authInput);
    } else {
      const found = users.find(u => u.email === authInput.email && u.password === authInput.password);
      if (found) login(found);
      else alert('Invalid credentials');
    }
  };

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('flightlog-session', JSON.stringify(userData));
    const db = JSON.parse(localStorage.getItem('flightlog-db') || '{}');
    setFlights(db[userData.email] || []);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('flightlog-session');
    setUser(null);
    setShowAuth(true);
  };

  const fetchAirport = async (code) => {
    const c = code.trim().toUpperCase();
    const local = AIRPORTS_DATABASE.find(a => a.code === c);
    if (local) return local;

    // Fallback Online Lookup
    try {
      const type = c.length === 3 ? 'iata' : 'icao';
      const response = await fetch(`https://ryanburnette.github.io/airports-api/${type}/${c.toLowerCase()}.json`);
      if (response.ok) {
        const data = await response.json();
        return {
          code: c,
          city: data.city || 'Unknown City',
          lat: parseFloat(data.latitude),
          lon: parseFloat(data.longitude)
        };
      }
    } catch (err) { console.error("API error", err); }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);

    const originData = await fetchAirport(formData.origin);
    const destData = await fetchAirport(formData.destination);

    if (!originData || !destData) {
      alert(`Error: Could not find ${!originData ? formData.origin : formData.destination}.`);
      setIsVerifying(false);
      return;
    }

    const distance = calculateDistance(originData.lat, originData.lon, destData.lat, destData.lon);

    const newFlight = {
      ...formData,
      id: editingFlight ? editingFlight.id : Date.now(),
      distance,
      originCity: originData.city,
      destCity: destData.city
    };

    const updated = editingFlight 
      ? flights.map(f => f.id === editingFlight.id ? newFlight : f)
      : [newFlight, ...flights];

    saveToDb(updated);
    setShowForm(false);
    setEditingFlight(null);
    setFormData({ origin: '', destination: '', date: '', flightNumber: '', aircraftType: '', serviceClass: 'Economy' });
    setIsVerifying(false);
  };

  const getStats = () => {
    const counts = {};
    flights.forEach(f => {
      const type = f.aircraftType || 'Not Specified';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  };

  if (showAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>{authMode === 'login' ? 'Welcome Back' : 'Join FlightLog'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'grid', gap: '20px' }}>
            {authMode === 'register' && <input placeholder="Name" required onChange={e => setAuthInput({...authInput, name: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} />}
            <input type="email" placeholder="Email" required onChange={e => setAuthInput({...authInput, email: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <input type="password" placeholder="Password" required onChange={e => setAuthInput({...authInput, password: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <button type="submit" style={{ padding: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
            <p onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ textAlign: 'center', fontSize: '14px', cursor: 'pointer', color: '#666' }}>{authMode === 'login' ? "New here? Register" : "Have an account? Login"}</p>
          </form>
        </div>
      </div>
    );
  }

  const aircraftStats = getStats();

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>FlightLog</h1>
          <p style={{ margin: 0, color: '#666' }}>Logged in as {user.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setShowForm(true)} style={{ background: '#000', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>+ Log Flight</button>
          <button onClick={handleLogout} style={{ background: '#eee', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><LogOut size={20}/></button>
        </div>
      </header>

      {/* Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ padding: '25px', background: '#fff', border: '1px solid #eee', borderRadius: '20px' }}>
          <div style={{ fontSize: '13px', color: '#888', fontWeight: '600' }}>TOTAL DISTANCE</div>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{flights.reduce((s,f) => s + f.distance, 0).toLocaleString()} <span style={{ fontSize: '16px' }}>mi</span></div>
        </div>
        <div style={{ padding: '25px', background: '#fff', border: '1px solid #eee', borderRadius: '20px' }}>
          <div style={{ fontSize: '13px', color: '#888', fontWeight: '600' }}>TOTAL FLIGHTS</div>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{flights.length}</div>
        </div>
      </div>

      {flights.length > 0 && (
        <section style={{ marginBottom: '40px', padding: '25px', background: '#fbfbfb', borderRadius: '20px', border: '1px solid #eee' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 size={20}/> Fleet Stats</h3>
          {aircraftStats.map(([type, count]) => (
            <div key={type} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{type}</span><span>{count} flights</span></div>
              <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}><div style={{ height: '100%', background: '#000', borderRadius: '4px', width: `${(count / flights.length) * 100}%` }} /></div>
            </div>
          ))}
        </section>
      )}

      {/* Flight List - New Layout to prevent overlapping */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {flights.map(f => (
          <div key={f.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '20px', padding: '25px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{f.origin} → {f.destination}</div>
                <div style={{ color: '#888', fontSize: '14px' }}>{f.originCity} to {f.destCity}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setEditingFlight(f); setFormData(f); setShowForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><Edit2 size={18}/></button>
                <button onClick={() => saveToDb(flights.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}><Trash2 size={18}/></button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: '#555' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14}/> {f.date}</span>
              {f.flightNumber && <span><strong>Flight:</strong> {f.flightNumber}</span>}
              {f.aircraftType && <span><strong>Aircraft:</strong> {f.aircraftType}</span>}
              <span style={{ color: '#007bff', fontWeight: '600' }}>{f.serviceClass}</span>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f5f5f5', fontSize: '18px', fontWeight: 'bold' }}>
              {f.distance.toLocaleString()} miles
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '35px', borderRadius: '25px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
              <h2 style={{ margin: 0 }}>{editingFlight ? 'Edit Flight' : 'Log Flight'}</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>ORIGIN (IST, JFK...)</label>
                <input required value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', border: '1px solid #ddd' }} /></div>
                <div><label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>DESTINATION</label>
                <input required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', border: '1px solid #ddd' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>FLIGHT # (OPTIONAL)</label>
                <input value={formData.flightNumber} onChange={e => setFormData({...formData, flightNumber: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', border: '1px solid #ddd' }} /></div>
                <div><label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>AIRCRAFT (OPTIONAL)</label>
                <input value={formData.aircraftType} onChange={e => setFormData({...formData, aircraftType: e.target.value})} style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', border: '1px solid #ddd' }} /></div>
              </div>
              <div><label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>DATE</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', border: '1px solid #ddd' }} /></div>
              <select value={formData.serviceClass} onChange={e => setFormData({...formData, serviceClass: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}>
                {serviceClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" disabled={isVerifying} style={{ padding: '15px', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                {isVerifying ? <><Loader2 className="animate-spin" size={18}/> Searching...</> : 'Save Flight Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightTracker;
