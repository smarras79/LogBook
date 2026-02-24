import React from 'react';
import { X, Loader2, Plus, Trash2, ArrowLeftRight } from 'lucide-react';
import { searchAirports } from '../utils/geo';
import { serviceClasses } from '../data/geography';
import { inputStyle, modalOverlay, modalContent } from '../styles/constants';

const FlightFormModal = ({
  formData, setFormData,
  editingFlight,
  airportSuggestions, setAirportSuggestions,
  activeAirportField, setActiveAirportField,
  isVerifying, statusMsg,
  onSubmit, onClose,
}) => {
  return (
    <div style={modalOverlay}>
      <div style={{...modalContent, maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto'}}>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
           <h2 style={{margin: 0}}>{editingFlight ? 'Edit Flight' : 'Log Flight'}</h2>
           <X style={{cursor:'pointer'}} onClick={onClose}/>
         </div>
         {isVerifying ? (
             <div style={{textAlign:'center', padding:'40px'}}>
                 <Loader2 className="animate-spin" size={40} style={{marginBottom:'20px'}}/>
                 <div>{formData.checkLandmarks ? 'Analyzing route & landmarks...' : 'Saving flight...'}</div>
                 <div style={{fontSize:'12px', color:'#666', marginTop:'10px'}}>{statusMsg}</div>
             </div>
         ) : (
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: '15px' }}>
              {/* Route Section with Autocomplete */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Origin Input with Autocomplete */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    placeholder="From (code or city)"
                    required
                    value={formData.origin}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setFormData({...formData, origin: val});
                      setAirportSuggestions(searchAirports(val));
                      setActiveAirportField('origin');
                    }}
                    onFocus={() => {
                      setAirportSuggestions(searchAirports(formData.origin));
                      setActiveAirportField('origin');
                    }}
                    onBlur={() => setTimeout(() => {
                      if (activeAirportField === 'origin') setAirportSuggestions([]);
                    }, 200)}
                    style={{...inputStyle, width: '100%', textAlign: 'center', fontWeight: 'bold'}}
                  />
                  {activeAirportField === 'origin' && airportSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: '#fff', border: '1px solid #ddd', borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto'
                    }}>
                      {airportSuggestions.map(airport => (
                        <div
                          key={airport.code}
                          onClick={() => {
                            setFormData({...formData, origin: airport.code});
                            setAirportSuggestions([]);
                            setActiveAirportField(null);
                          }}
                          style={{
                            padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                          onMouseEnter={e => e.target.style.background = '#f5f5f5'}
                          onMouseLeave={e => e.target.style.background = '#fff'}
                        >
                          <div>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>{airport.code}</span>
                            <span style={{ color: '#666', marginLeft: '8px', fontSize: '13px' }}>{airport.city}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#999' }}>{airport.country}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Swap Button */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      origin: formData.destination,
                      destination: formData.origin
                    });
                    setAirportSuggestions([]);
                    setActiveAirportField(null);
                  }}
                  title="Swap origin and destination"
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#e5e7eb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <ArrowLeftRight size={18} color="#6b7280" />
                </button>

                {/* Destination Input with Autocomplete */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    placeholder="To (code or city)"
                    required
                    value={formData.destination}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setFormData({...formData, destination: val});
                      setAirportSuggestions(searchAirports(val));
                      setActiveAirportField('destination');
                    }}
                    onFocus={() => {
                      setAirportSuggestions(searchAirports(formData.destination));
                      setActiveAirportField('destination');
                    }}
                    onBlur={() => setTimeout(() => {
                      if (activeAirportField === 'destination') setAirportSuggestions([]);
                    }, 200)}
                    style={{...inputStyle, width: '100%', textAlign: 'center', fontWeight: 'bold'}}
                  />
                  {activeAirportField === 'destination' && airportSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: '#fff', border: '1px solid #ddd', borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto'
                    }}>
                      {airportSuggestions.map(airport => (
                        <div
                          key={airport.code}
                          onClick={() => {
                            setFormData({...formData, destination: airport.code});
                            setAirportSuggestions([]);
                            setActiveAirportField(null);
                          }}
                          style={{
                            padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                          onMouseEnter={e => e.target.style.background = '#f5f5f5'}
                          onMouseLeave={e => e.target.style.background = '#fff'}
                        >
                          <div>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>{airport.code}</span>
                            <span style={{ color: '#666', marginLeft: '8px', fontSize: '13px' }}>{airport.city}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#999' }}>{airport.country}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          placeholder={`Connection ${idx + 1} (code or city)`}
                          value={via}
                          onChange={e => {
                            const val = e.target.value.toUpperCase();
                            const newVias = [...formData.viaAirports];
                            newVias[idx] = val;
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
                            setAirportSuggestions(searchAirports(val));
                            setActiveAirportField(`via-${idx}`);
                          }}
                          onFocus={() => {
                            setAirportSuggestions(searchAirports(via));
                            setActiveAirportField(`via-${idx}`);
                          }}
                          onBlur={() => setTimeout(() => {
                            if (activeAirportField === `via-${idx}`) setAirportSuggestions([]);
                          }, 200)}
                          style={{...inputStyle, width: '100%', fontSize: '13px', padding: '10px'}}
                        />
                        {activeAirportField === `via-${idx}` && airportSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                            background: '#fff', border: '1px solid #ddd', borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '160px', overflowY: 'auto'
                          }}>
                            {airportSuggestions.map(airport => (
                              <div
                                key={airport.code}
                                onClick={() => {
                                  const newVias = [...formData.viaAirports];
                                  newVias[idx] = airport.code;
                                  setFormData({...formData, viaAirports: newVias});
                                  setAirportSuggestions([]);
                                  setActiveAirportField(null);
                                }}
                                style={{
                                  padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px'
                                }}
                                onMouseEnter={e => e.target.style.background = '#f5f5f5'}
                                onMouseLeave={e => e.target.style.background = '#fff'}
                              >
                                <div>
                                  <span style={{ fontWeight: 'bold', color: '#333' }}>{airport.code}</span>
                                  <span style={{ color: '#666', marginLeft: '6px' }}>{airport.city}</span>
                                </div>
                                <span style={{ fontSize: '10px', color: '#999' }}>{airport.country}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                              <option key={cls} value={cls}>
                                {cls === 'Economy' ? '🐔 Chicken class' :
                                 cls === 'Premium Economy' ? '💺 Premium Economy' :
                                 cls === 'Business' ? '💼 Business' : '👑 First'}
                              </option>
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
                    placeholder="Flight # (e.g. UA123, AA456)"
                    value={formData.flightNumber}
                    onChange={e => setFormData({...formData, flightNumber: e.target.value.toUpperCase()})}
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
                      <option key={cls} value={cls}>
                        {cls === 'Economy' ? '🐔 Chicken class' :
                         cls === 'Premium Economy' ? '💺 Premium Economy' :
                         cls === 'Business' ? '💼 Business' : '👑 First'}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* Date Section */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                    {formData.isRoundTrip ? 'Departure Date' : 'Flight Date'}
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                {formData.isRoundTrip && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Return Date</div>
                    <input
                      type="date"
                      required
                      value={formData.returnDate}
                      onChange={e => setFormData({...formData, returnDate: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              {/* Round Trip Option */}
              {(!editingFlight || formData.isRoundTrip) && (
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: editingFlight ? 'default' : 'pointer',
                  fontSize: '14px',
                  color: '#555',
                  background: formData.isRoundTrip ? '#ecfdf5' : '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: formData.isRoundTrip ? '1px solid #10b981' : '1px solid #e2e8f0',
                  opacity: editingFlight && formData.isRoundTrip ? 0.8 : 1
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isRoundTrip}
                    onChange={e => setFormData({
                      ...formData,
                      isRoundTrip: e.target.checked,
                      returnDate: e.target.checked ? formData.returnDate : ''
                    })}
                    style={{ width: '18px', height: '18px', cursor: editingFlight ? 'default' : 'pointer' }}
                    disabled={editingFlight}
                  />
                  <span style={{ fontWeight: formData.isRoundTrip ? '600' : 'normal', color: formData.isRoundTrip ? '#059669' : '#555' }}>
                    🔄 Round trip {editingFlight && formData.isRoundTrip ? '(2 flights)' : '(adds return flight automatically)'}
                  </span>
                </label>
              )}

              {/* Payment Section */}
              <div style={{
                background: '#fafafa',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid #eee'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontWeight: '600' }}>
                  PAYMENT (optional)
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={formData.paymentType}
                    onChange={e => setFormData({...formData, paymentType: e.target.value})}
                    style={{...inputStyle, padding: '10px', fontSize: '13px', minWidth: '100px'}}
                  >
                    <option value="money">💵 Money</option>
                    <option value="miles">✈️ Miles</option>
                  </select>
                  <input
                    type="number"
                    placeholder={formData.paymentType === 'money' ? 'Amount ($)' : 'Miles used'}
                    value={formData.paymentAmount}
                    onChange={e => setFormData({...formData, paymentAmount: e.target.value})}
                    style={{...inputStyle, flex: 1, padding: '10px', fontSize: '13px'}}
                    min="0"
                    step={formData.paymentType === 'money' ? '0.01' : '1'}
                  />
                </div>
              </div>

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
                {editingFlight
                  ? (formData.isRoundTrip ? 'Update Round Trip' : 'Update Flight')
                  : (formData.isRoundTrip ? 'Save Round Trip' : (formData.checkLandmarks ? 'Save & Analyze' : 'Save Flight'))}
                {formData.hasLayover && formData.viaAirports.filter(v => v.trim()).length > 0 && (
                  <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                    ({formData.viaAirports.filter(v => v.trim()).length + 1} legs{formData.isRoundTrip ? ' × 2' : ''})
                  </span>
                )}
              </button>
            </form>
         )}
      </div>
    </div>
  );
};

export default FlightFormModal;
