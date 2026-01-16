import React, { useState, useEffect } from 'react';
import { Plane, Plus, Trash2, Edit2, X, MapPin, Calendar, Award, TrendingUp } from 'lucide-react';

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Major airport database with coordinates
const airports = {
  'JFK': { name: 'John F. Kennedy International', city: 'New York', lat: 40.6413, lon: -73.7781 },
  'LAX': { name: 'Los Angeles International', city: 'Los Angeles', lat: 33.9416, lon: -118.4085 },
  'ORD': { name: "O'Hare International", city: 'Chicago', lat: 41.9742, lon: -87.9073 },
  'LHR': { name: 'London Heathrow', city: 'London', lat: 51.4700, lon: -0.4543 },
  'CDG': { name: 'Charles de Gaulle', city: 'Paris', lat: 49.0097, lon: 2.5479 },
  'DXB': { name: 'Dubai International', city: 'Dubai', lat: 25.2532, lon: 55.3657 },
  'HND': { name: 'Tokyo Haneda', city: 'Tokyo', lat: 35.5494, lon: 139.7798 },
  'SIN': { name: 'Singapore Changi', city: 'Singapore', lat: 1.3644, lon: 103.9915 },
  'SFO': { name: 'San Francisco International', city: 'San Francisco', lat: 37.6213, lon: -122.3790 },
  'MIA': { name: 'Miami International', city: 'Miami', lat: 25.7959, lon: -80.2870 },
  'ATL': { name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', lat: 33.6407, lon: -84.4277 },
  'DEN': { name: 'Denver International', city: 'Denver', lat: 39.8561, lon: -104.6737 },
  'SEA': { name: 'Seattle-Tacoma International', city: 'Seattle', lat: 47.4502, lon: -122.3088 },
  'BOS': { name: 'Boston Logan International', city: 'Boston', lat: 42.3656, lon: -71.0096 },
  'IAD': { name: 'Washington Dulles International', city: 'Washington DC', lat: 38.9531, lon: -77.4565 },
  'MCO': { name: 'Orlando International', city: 'Orlando', lat: 28.4312, lon: -81.3081 },
  'LAS': { name: 'Las Vegas McCarran International', city: 'Las Vegas', lat: 36.0840, lon: -115.1537 },
  'PHX': { name: 'Phoenix Sky Harbor International', city: 'Phoenix', lat: 33.4484, lon: -112.0740 },
  'FRA': { name: 'Frankfurt Airport', city: 'Frankfurt', lat: 50.0379, lon: 8.5622 },
  'AMS': { name: 'Amsterdam Schiphol', city: 'Amsterdam', lat: 52.3105, lon: 4.7683 },
  'MAD': { name: 'Madrid Barajas', city: 'Madrid', lat: 40.4936, lon: -3.5668 },
  'FCO': { name: 'Rome Fiumicino', city: 'Rome', lat: 41.8003, lon: 12.2389 },
  'SYD': { name: 'Sydney Kingsford Smith', city: 'Sydney', lat: -33.9399, lon: 151.1753 },
  'MEL': { name: 'Melbourne Airport', city: 'Melbourne', lat: -37.6690, lon: 144.8410 },
  'YYZ': { name: 'Toronto Pearson International', city: 'Toronto', lat: 43.6777, lon: -79.6248 },
  'YVR': { name: 'Vancouver International', city: 'Vancouver', lat: 49.1939, lon: -123.1844 },
  'GRU': { name: 'São Paulo Guarulhos', city: 'São Paulo', lat: -23.4356, lon: -46.4731 },
  'EZE': { name: 'Buenos Aires Ezeiza', city: 'Buenos Aires', lat: -34.8222, lon: -58.5358 },
  'ICN': { name: 'Seoul Incheon', city: 'Seoul', lat: 37.4602, lon: 126.4407 },
  'PEK': { name: 'Beijing Capital', city: 'Beijing', lat: 40.0801, lon: 116.5846 },
  'PVG': { name: 'Shanghai Pudong', city: 'Shanghai', lat: 31.1443, lon: 121.8083 },
  'HKG': { name: 'Hong Kong International', city: 'Hong Kong', lat: 22.3080, lon: 113.9185 },
  'BKK': { name: 'Bangkok Suvarnabhumi', city: 'Bangkok', lat: 13.6900, lon: 100.7501 },
  'DEL': { name: 'Delhi Indira Gandhi', city: 'Delhi', lat: 28.5562, lon: 77.1000 },
  'IST': { name: 'Istanbul Airport', city: 'Istanbul', lat: 41.2753, lon: 28.7519 },
  'DOH': { name: 'Hamad International', city: 'Doha', lat: 25.2731, lon: 51.6080 },
};

const serviceClasses = ['Economy', 'Premium Economy', 'Business', 'First'];

const FlightTracker = () => {
  const [flights, setFlights] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    serviceClass: 'Economy',
  });
  const [loading, setLoading] = useState(true);

  // Load flights from storage
  useEffect(() => {
    const loadFlights = async () => {
      try {
        const result = await window.storage.get('flights-data');
        if (result && result.value) {
          setFlights(JSON.parse(result.value));
        }
      } catch (error) {
        console.log('No existing flights data');
      } finally {
        setLoading(false);
      }
    };
    loadFlights();
  }, []);

  // Save flights to storage
  const saveFlights = async (updatedFlights) => {
    try {
      await window.storage.set('flights-data', JSON.stringify(updatedFlights));
    } catch (error) {
      console.error('Failed to save flights:', error);
    }
  };

  // Calculate flight details
  const calculateFlightDetails = (origin, destination) => {
    const originAirport = airports[origin.toUpperCase()];
    const destAirport = airports[destination.toUpperCase()];
    
    if (!originAirport || !destAirport) return null;
    
    const distanceMiles = calculateDistance(
      originAirport.lat,
      originAirport.lon,
      destAirport.lat,
      destAirport.lon
    );
    
    return {
      distanceMiles: Math.round(distanceMiles),
      distanceKm: Math.round(distanceMiles * 1.60934),
      originAirport,
      destAirport,
    };
  };

  // Add or update flight
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const flightDetails = calculateFlightDetails(formData.origin, formData.destination);
    if (!flightDetails) {
      alert('Invalid airport codes. Please check and try again.');
      return;
    }

    const newFlight = {
      id: editingFlight ? editingFlight.id : Date.now(),
      ...formData,
      ...flightDetails,
      timestamp: editingFlight ? editingFlight.timestamp : Date.now(),
    };

    const updatedFlights = editingFlight
      ? flights.map(f => f.id === editingFlight.id ? newFlight : f)
      : [...flights, newFlight];
    
    setFlights(updatedFlights);
    saveFlights(updatedFlights);
    
    setShowForm(false);
    setEditingFlight(null);
    setFormData({ origin: '', destination: '', date: '', serviceClass: 'Economy' });
  };

  // Delete flight
  const handleDelete = async (id) => {
    const updatedFlights = flights.filter(f => f.id !== id);
    setFlights(updatedFlights);
    saveFlights(updatedFlights);
  };

  // Edit flight
  const handleEdit = (flight) => {
    setEditingFlight(flight);
    setFormData({
      origin: flight.origin,
      destination: flight.destination,
      date: flight.date,
      serviceClass: flight.serviceClass,
    });
    setShowForm(true);
  };

  // Calculate total statistics
  const totalMiles = flights.reduce((sum, flight) => sum + flight.distanceMiles, 0);
  const totalKm = flights.reduce((sum, flight) => sum + flight.distanceKm, 0);
  const totalFlights = flights.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg font-medium">Loading flight data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        .flight-tracker-app {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .header-title {
          font-weight: 700;
          letter-spacing: -0.03em;
          animation: slideDown 0.5s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
          animation: slideUp 0.4s ease-out;
          animation-fill-mode: both;
        }

        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .flight-card {
          background: white;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
          animation: cardFadeIn 0.3s ease-out;
          animation-fill-mode: both;
        }

        .flight-card:nth-child(1) { animation-delay: 0.05s; }
        .flight-card:nth-child(2) { animation-delay: 0.1s; }
        .flight-card:nth-child(3) { animation-delay: 0.15s; }
        .flight-card:nth-child(4) { animation-delay: 0.2s; }
        .flight-card:nth-child(5) { animation-delay: 0.25s; }

        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .flight-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }

        .btn-primary {
          background: #111827;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .btn-primary:hover {
          background: #1f2937;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .form-input {
          background: white;
          border: 1px solid #d1d5db;
          color: #111827;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
        }

        .modal-backdrop {
          animation: fadeInBackdrop 0.2s ease-out;
        }

        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .route-line {
          position: relative;
          height: 2px;
          background: #e5e7eb;
          flex: 1;
        }

        .route-line::after {
          content: '';
          position: absolute;
          right: -4px;
          top: 50%;
          width: 0;
          height: 0;
          border-left: 8px solid #9ca3af;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
          transform: translateY(-50%);
        }

        .badge {
          background: #f3f4f6;
          color: #374151;
          font-weight: 500;
        }

        .empty-state {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.7; }
        }

        select.form-input {
          cursor: pointer;
        }

        select.form-input option {
          background: white;
          color: #111827;
        }

        .icon-accent {
          color: #6366f1;
        }

        .text-accent {
          color: #6366f1;
        }

        .bg-accent {
          background: #6366f1;
        }

        .bg-accent-light {
          background: #eef2ff;
        }
      `}</style>

      <div className="flight-tracker-app min-h-screen">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent rounded-xl">
                  <Plane className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="header-title text-2xl text-gray-900">Flight Tracker</h1>
                  <p className="text-gray-500 text-xs">Track your aviation journey</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingFlight(null);
                  setFormData({ origin: '', destination: '', date: '', serviceClass: 'Economy' });
                }}
                className="btn-primary px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm text-white"
              >
                <Plus size={18} />
                Add Flight
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div className="stat-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="icon-accent" size={20} />
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Flights</div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {totalFlights}
              </div>
            </div>

            <div className="stat-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="icon-accent" size={20} />
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Miles Flown</div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {totalMiles.toLocaleString()}
              </div>
              <div className="text-gray-500 text-sm mt-1">{totalKm.toLocaleString()} km</div>
            </div>

            <div className="stat-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Award className="icon-accent" size={20} />
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Times Around Earth</div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(totalMiles / 24901).toFixed(2)}
              </div>
              <div className="text-gray-500 text-sm mt-1">Earth circumferences</div>
            </div>
          </div>

          {/* Flight List */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-5 text-gray-900">
              Your Flights
            </h2>

            {flights.length === 0 ? (
              <div className="text-center py-16 empty-state">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Plane size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No flights yet</h3>
                <p className="text-gray-500 text-sm">Start tracking your flights by adding your first one</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flights.sort((a, b) => new Date(b.date) - new Date(a.date)).map((flight) => (
                  <div key={flight.id} className="flight-card rounded-xl p-6">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      {/* Left section - Route */}
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-4 mb-4">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {flight.origin.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">{flight.originAirport.city}</div>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center">
                            <div className="route-line w-full max-w-[120px]"></div>
                            <Plane className="text-gray-400 mx-2 rotate-90" size={18} />
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {flight.destination.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">{flight.destAirport.city}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="badge px-3 py-1 rounded-lg text-xs">
                            {flight.distanceMiles.toLocaleString()} mi
                          </span>
                          <span className="badge px-3 py-1 rounded-lg text-xs">
                            {flight.distanceKm.toLocaleString()} km
                          </span>
                          <span className="badge px-3 py-1 rounded-lg text-xs">
                            {flight.serviceClass}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Calendar size={14} />
                          {new Date(flight.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>

                      {/* Right section - Actions */}
                      <div className="flex lg:flex-col gap-2">
                        <button
                          onClick={() => handleEdit(flight)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit flight"
                        >
                          <Edit2 size={18} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(flight.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete flight"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Airports Reference */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-900">
              Available Airport Codes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
              {Object.entries(airports).map(([code, airport]) => (
                <div key={code} className="text-gray-600">
                  <span className="font-semibold text-gray-900">{code}</span>
                  <span className="text-gray-400 ml-1">· {airport.city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add/Edit Flight Modal */}
        {showForm && (
          <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="modal-content bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingFlight ? 'Edit Flight' : 'Add New Flight'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingFlight(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Origin Airport
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g., JFK"
                    className="form-input w-full px-3 py-2 rounded-lg text-sm uppercase"
                    required
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Destination Airport
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., LAX"
                    className="form-input w-full px-3 py-2 rounded-lg text-sm uppercase"
                    required
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Flight Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="form-input w-full px-3 py-2 rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Class of Service
                  </label>
                  <select
                    value={formData.serviceClass}
                    onChange={(e) => setFormData({ ...formData, serviceClass: e.target.value })}
                    className="form-input w-full px-3 py-2 rounded-lg text-sm"
                  >
                    {serviceClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-2.5 rounded-lg text-sm text-white"
                >
                  {editingFlight ? 'Update Flight' : 'Add Flight'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightTracker;