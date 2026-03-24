import React, { useState } from 'react';
import {
  Trash2, Edit2, Copy, ArrowLeftRight, Globe, Flag,
  Users, CloudRain, Search, FileText, X
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { getFlightRadar24Url, getCarbonEstimate } from '../utils/flights';
import { getAirlineAlliance, getAirlineWebsite, isAirlineMatch } from '../utils/airlines';
import { ALLIANCE_STYLES, ALLIANCE_MEMBERS_DISPLAY } from '../data/airlines';

const MAX_NOTES_LENGTH = 1000;

const getGoogleFlightsUrl = (origin, destination) =>
  `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(origin)}+to+${encodeURIComponent(destination)}`;

const FlightListSection = ({
  flights, sortMode, setSortMode, sortedGroups,
  groupedByCountry, groupedByContinent,
  handleEditFlight, handleDeleteFlight, handleCopyFlight, handleReverseFlight,
  handleUpdateFlightNotes,
  flightMatches, flightMatchingOptIn, openAllianceDropdown, setOpenAllianceDropdown,
}) => {
  const [notesFlightId, setNotesFlightId] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const openNotes = (f) => {
    setNotesFlightId(f.id);
    setNotesDraft(f.notes || '');
  };

  const closeNotes = () => {
    setNotesFlightId(null);
    setNotesDraft('');
  };

  const saveNotes = () => {
    if (notesFlightId) {
      handleUpdateFlightNotes(notesFlightId, notesDraft);
    }
    closeNotes();
  };

  // Find the flight that has notes open (to show route info in modal title)
  const notesFlight = notesFlightId
    ? flights.find(f => f.id === notesFlightId)
    : null;

  return (
    <>
      {/* Flight List Header with Sort Options */}
      {flights.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#334155' }}>
            Your Flights
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', marginRight: '4px' }}>Organize by:</span>
            {[
              { key: 'date', label: 'Date'},
              { key: 'country', label: 'Country'},
              { key: 'continent', label: 'Continent'}
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortMode(key)}
                style={{
                  background: sortMode === key ? '#e0e7ff' : '#fff',
                  border: sortMode === key ? '1px solid #6366f1' : '1px solid #e2e8f0',
                  color: sortMode === key ? '#4338ca' : '#64748b',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: sortMode === key ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flight List - By Date (Default) */}
      {sortMode === 'date' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {sortedGroups.map(group => {
            const allRoundTrips = group.flights.every(f => f.isRoundTrip);
            
            return (
            <div key={`${group.origin}-${group.destination}`} style={{ border: '1px solid #eee', borderRadius: '16px', padding: '24px' }}>
              {/* Route Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {group.origin} {allRoundTrips ? '⇄' : '→'} {group.destination}
                  </span>
                  <a
                    href={getGoogleFlightsUrl(group.origin, group.destination)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Search on Google Flights"
                    style={{ display: 'inline-flex', alignItems: 'center', color: '#4285f4', verticalAlign: 'middle', marginLeft: '8px' }}
                  >
                    <Search size={16} />
                  </a>
                  {allRoundTrips && (
                    <span style={{ 
                      marginLeft: '10px',
                      fontSize: '11px', 
                      color: '#16a34a', 
                      background: '#dcfce7', 
                      padding: '3px 8px', 
                      borderRadius: '10px',
                      fontWeight: '600',
                      verticalAlign: 'middle'
                    }}>
                      Round Trip
                    </span>
                  )}
                  <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                    {group.originCity} {allRoundTrips ? '↔' : 'to'} {group.destCity}
                    {group.distance && <span style={{ marginLeft: '10px', color: '#888' }}>• {(group.distance * (allRoundTrips ? 2 : 1)).toLocaleString()} mi{allRoundTrips ? ' (total)' : ''}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {(() => {
                    // Calculate total flight legs for this route group (round trips count as 2x)
                    const totalLegs = group.flights.reduce((sum, f) => {
                      const baseCount = f.legCount || 1;
                      const rtMultiplier = f.isRoundTrip ? 2 : 1;
                      return sum + (baseCount * rtMultiplier);
                    }, 0);
                    return (
                      <span style={{ fontSize: '12px', color: '#888', background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px' }}>
                        {totalLegs} flight{totalLegs > 1 ? 's' : ''}
                      </span>
                    );
                  })()}
                  {!allRoundTrips && (
                    <ArrowLeftRight 
                      size={16} 
                      style={{ cursor: 'pointer', color: '#666' }} 
                      title="Add return flight (reverse route)"
                      onClick={() => handleReverseFlight(group.flights[0])} 
                    />
                  )}
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
                  // For round trips, calculate CO2 for both directions
                  const rtMultiplier = f.isRoundTrip ? 2 : 1;
                  const flightCO2 = getCarbonEstimate(f.distance || 0, f.serviceClass || 'Economy') * rtMultiplier;
                  const drivingCO2 = (f.distance || 0) * 0.21 * rtMultiplier;
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
                      {/* Date display - show both dates for round trips */}
                      {f.isRoundTrip ? (
                        <span style={{ fontWeight: '600', fontSize: '14px', minWidth: '90px' }}>
                          {formatDate(f.date)} ⇄ {formatDate(f.returnDate)}
                        </span>
                      ) : (
                        <span style={{ fontWeight: '600', fontSize: '14px', minWidth: '90px' }}>
                          {formatDate(f.date)}
                        </span>
                      )}
                      
                      {/* Round trip badge */}
                      {f.isRoundTrip && (
                        <span style={{ 
                          fontSize: '10px', 
                          color: '#16a34a', 
                          background: '#dcfce7', 
                          padding: '3px 8px', 
                          borderRadius: '10px',
                          fontWeight: '600'
                        }}>
                          🔄 ROUND TRIP
                        </span>
                      )}
                      
                      {/* Flight number badge (shown for all flight types) */}
                      {f.flightNumber && (() => {
                        const flightRadar24Url = getFlightRadar24Url(f.flightNumber, f.date);
                        return (
                          <a
                            href={flightRadar24Url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              fontSize: '11px', 
                              color: '#6366f1', 
                              background: '#eef2ff', 
                              padding: '3px 8px', 
                              borderRadius: '10px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#6366f1';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#eef2ff';
                              e.currentTarget.style.color = '#6366f1';
                            }}
                            title={`View ${f.flightNumber} on FlightRadar24`}
                          >
                            ✈ {f.flightNumber}
                            <Globe size={10} />
                          </a>
                        );
                      })()}
                      
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
                          {f.legs.length} LEGS{f.isRoundTrip ? ' × 2' : ''}
                        </span>
                      )}
                      
                      {/* Multi-leg flight - show top-level badges */}
                      {hasMultipleLegs && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Multi-leg aggregated service class badge */}
                          {(() => {
                            const classes = f.legs.map(leg => leg.serviceClass || 'Economy');
                            const uniqueClasses = [...new Set(classes)];
                            const classOrder = ['First', 'Business', 'Premium Economy', 'Economy'];
                            const bestClass = classOrder.find(c => uniqueClasses.includes(c)) || 'Economy';
                            return (
                              <span style={{
                                fontSize: '11px',
                                color: bestClass === 'Economy' ? '#8b6914' :
                                       bestClass === 'Premium Economy' ? '#166534' :
                                       bestClass === 'Business' ? '#1e40af' : 
                                       '#854d0e',
                                background: bestClass === 'Economy' ? '#fef3c7' : 
                                            bestClass === 'Premium Economy' ? '#dcfce7' : 
                                            bestClass === 'Business' ? '#dbeafe' : 
                                            '#fef9c3',
                                padding: '3px 8px', 
                                borderRadius: '6px',
                                fontWeight: bestClass === 'First' ? '600' : 'normal'
                              }}>
                                {bestClass === 'Economy' ? '🐔' : bestClass === 'Premium Economy' ? '💺' : bestClass === 'Business' ? '💼' : '👑'}
                                {uniqueClasses.length > 1 ? ' Mixed' : ` ${bestClass === 'Economy' ? 'Chicken class' : bestClass}`}
                              </span>
                            );
                          })()}
                          {/* Multi-leg CO2 badge */}
                          {(() => {
                            const totalLegCO2 = f.legs.reduce((sum, leg) => 
                              sum + Math.round(getCarbonEstimate(leg.distance || 0, leg.serviceClass || 'Economy')), 0
                            );
                            const totalDrivingCO2 = f.distance * 0.21;
                            const co2Diff = totalDrivingCO2 - totalLegCO2;
                            return (
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
                                title={`Flying: ${totalLegCO2} kg CO₂ | Driving: ${Math.round(totalDrivingCO2)} kg CO₂`}
                              >
                                <CloudRain size={10}/>
                                {totalLegCO2} kg
                                <span style={{ 
                                  fontSize: '10px', 
                                  color: co2Diff > 0 ? '#166534' : '#854d0e',
                                  marginLeft: '2px'
                                }}>
                                  {co2Diff > 0 ? `(🚗+${Math.round(co2Diff)})` : `(🚗${Math.round(co2Diff)})`}
                                </span>
                              </span>
                            );
                          })()}
                          {/* Payment badge for multi-leg */}
                          {f.paymentAmount && (
                            <span style={{ 
                              fontSize: '11px', 
                              color: f.paymentType === 'miles' ? '#2563eb' : '#16a34a', 
                              background: f.paymentType === 'miles' ? '#eff6ff' : '#f0fdf4', 
                              padding: '3px 8px', 
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              {f.paymentType === 'miles' ? '✈️' : '💵'}
                              {f.paymentType === 'miles' 
                                ? `${parseInt(f.paymentAmount).toLocaleString()} mi`
                                : `$${parseFloat(f.paymentAmount).toLocaleString()}`
                              }
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Single leg flight - show airline inline */}
                      {!hasMultipleLegs && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {f.airline && (() => {
                            const airlineWebsite = getAirlineWebsite(f.airline);
                            return airlineWebsite ? (
                              <a 
                                href={airlineWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  fontSize: '12px', 
                                  color: '#555', 
                                  background: '#f5f5f5', 
                                  padding: '3px 8px', 
                                  borderRadius: '6px',
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = '#3b82f6';
                                  e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = '#f5f5f5';
                                  e.currentTarget.style.color = '#555';
                                }}
                                title={`Visit ${f.airline} website`}
                              >
                                {f.airline}
                                <Globe size={10} />
                              </a>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#555', background: '#f5f5f5', padding: '3px 8px', borderRadius: '6px' }}>
                                {f.airline}
                              </span>
                            );
                          })()}
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
                                      {members.map((member, mIdx) => {
                                        const isMatch = isAirlineMatch(f.airline, member);
                                        return (
                                        <div 
                                          key={mIdx}
                                          style={{
                                            padding: '8px 16px',
                                            fontSize: '12px',
                                            color: '#333',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: isMatch ? style.background : 'transparent',
                                            fontWeight: isMatch ? '600' : 'normal'
                                          }}
                                        >
                                          <span style={{ color: style.color }}>✈</span>
                                          {member}
                                          {isMatch && (
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
                                      );})}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      
                      {/* Common badges (only for single-leg flights) */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {f.aircraftType && f.aircraftType !== 'Unknown' && !hasMultipleLegs && (
                          <span style={{ fontSize: '12px', color: '#555', background: '#f5f5f5', padding: '3px 8px', borderRadius: '6px' }}>
                            {f.aircraftType}
                          </span>
                        )}
                        {/* Only show serviceClass badge for single-leg flights (multi-leg shows it above) */}
                        {!hasMultipleLegs && f.serviceClass && (
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
                        {/* CO2 badge - only for single-leg flights */}
                        {!hasMultipleLegs && (
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
                        )}
                        {/* Payment badge - only for single-leg flights */}
                        {!hasMultipleLegs && f.paymentAmount && (
                          <span style={{ 
                            fontSize: '11px', 
                            color: f.paymentType === 'miles' ? '#2563eb' : '#16a34a', 
                            background: f.paymentType === 'miles' ? '#eff6ff' : '#f0fdf4', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            {f.paymentType === 'miles' ? '✈️' : '💵'}
                            {f.paymentType === 'miles' 
                              ? `${parseInt(f.paymentAmount).toLocaleString()} mi`
                              : `$${parseFloat(f.paymentAmount).toLocaleString()}`
                            }
                          </span>
                        )}
                        {/* Fellow Passengers badge */}
                        {flightMatchingOptIn && f.flightNumber && f.date && (() => {
                          const flightKey = `${f.flightNumber}_${f.date}`.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                          const matches = flightMatches[flightKey];
                          if (matches && matches.length > 0) {
                            return (
                              <span 
                                style={{ 
                                  fontSize: '11px', 
                                  color: '#059669', 
                                  background: '#ecfdf5', 
                                  padding: '3px 8px', 
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: '500',
                                  border: '1px solid #86efac'
                                }}
                                title={`Fellow passengers: ${matches.map(m => m.nickname).join(', ')}`}
                              >
                                <Users size={10}/>
                                {matches.length} fellow traveler{matches.length > 1 ? 's' : ''}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <FileText
                        size={14}
                        style={{ cursor: 'pointer', color: f.notes ? '#6366f1' : '#bbb' }}
                        title={f.notes ? 'View/edit notes' : 'Add notes'}
                        onClick={() => openNotes(f)}
                      />
                      <ArrowLeftRight
                        size={14}
                        style={{ cursor: 'pointer', color: '#888' }}
                        title="Add return flight (reverse route)"
                        onClick={() => handleReverseFlight(f)}
                      />
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
                            {leg.airline && (() => {
                              const airlineWebsite = getAirlineWebsite(leg.airline);
                              return airlineWebsite ? (
                                <a
                                  href={airlineWebsite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    fontSize: '11px', 
                                    color: '#555', 
                                    background: '#fff', 
                                    padding: '2px 8px', 
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = '#3b82f6';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.color = '#555';
                                    e.currentTarget.style.borderColor = '#e5e5e5';
                                  }}
                                  title={`Visit ${leg.airline} website`}
                                >
                                  {leg.airline}
                                  <Globe size={9} />
                                </a>
                              ) : (
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
                              );
                            })()}
                            
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
                                      {legMembers.map((member, mIdx) => {
                                        const isMatch = isAirlineMatch(leg.airline, member);
                                        return (
                                        <div 
                                          key={mIdx}
                                          style={{
                                            padding: '6px 14px',
                                            fontSize: '11px',
                                            color: '#333',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: isMatch ? legStyle.background : 'transparent',
                                            fontWeight: isMatch ? '600' : 'normal'
                                          }}
                                        >
                                          <span style={{ color: legStyle.color }}>✈</span>
                                          {member}
                                          {isMatch && (
                                            <span style={{ 
                                              fontSize: '9px', 
                                              background: legStyle.color, 
                                              color: '#fff',
                                              padding: '2px 6px',
                                              borderRadius: '10px',
                                              marginLeft: 'auto'
                                            }}>
                                              YOUR FLIGHT
                                            </span>
                                          )}
                                        </div>
                                      );})}
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
                                 '👑'} {leg.serviceClass === 'Economy' ? 'Chicken' : 
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
        )})}
      </div>
      )}

      {/* Flight List - By Country */}
      {sortMode === 'country' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {groupedByCountry.map(({ country, groups }) => (
            <div key={country}>
              {/* Country Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #fde68a'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Flag size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{country}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    {groups.length} route{groups.length > 1 ? 's' : ''} • {groups.reduce((sum, g) => sum + g.flights.length, 0)} flight{groups.reduce((sum, g) => sum + g.flights.length, 0) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Routes in this country */}
              <div style={{ display: 'grid', gap: '16px', paddingLeft: '20px' }}>
                {groups.map(group => (
                  <div key={`${group.origin}-${group.destination}`} style={{ 
                    border: '1px solid #fde68a', 
                    borderRadius: '16px', 
                    padding: '20px',
                    background: '#fffbeb'
                  }}>
                    {/* Route Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {group.origin} → {group.destination}
                          <a
                            href={getGoogleFlightsUrl(group.origin, group.destination)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Search on Google Flights"
                            style={{ display: 'inline-flex', alignItems: 'center', color: '#4285f4', verticalAlign: 'middle', marginLeft: '8px' }}
                          >
                            <Search size={16} />
                          </a>
                        </span>
                        <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                          {group.originCity} to {group.destCity}
                          {group.distance && <span style={{ marginLeft: '10px', color: '#888' }}>• {group.distance.toLocaleString()} mi</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: '12px' }}>
                          {group.flights.length} flight{group.flights.length > 1 ? 's' : ''}
                        </span>
                        <ArrowLeftRight size={14} style={{ cursor: 'pointer', color: '#666' }} title="Add return flight" onClick={() => handleReverseFlight(group.flights[0])} />
                        <Copy size={14} style={{ cursor: 'pointer', color: '#666' }} title="Copy route" onClick={() => handleCopyFlight(group.flights[0])} />
                      </div>
                    </div>

                    {/* Landmarks */}
                    {group.featuresCrossed && group.featuresCrossed.length > 0 && (
                      <div style={{marginBottom: '12px', display:'flex', flexWrap:'wrap', gap:'6px'}}>
                        {group.featuresCrossed.map(feat => (
                          <span key={feat} style={{fontSize:'10px', background:'#e0f2f1', color:'#004d40', padding:'3px 6px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'3px', fontWeight:'600'}}>
                            <Globe size={8}/> {feat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Individual Flights */}
                    <div style={{ borderTop: '1px solid #fde68a', paddingTop: '12px' }}>
                      {group.flights.map((f, idx) => {
                        const rtMultiplier = f.isRoundTrip ? 2 : 1;
                        const flightCO2 = getCarbonEstimate(f.distance || 0, f.serviceClass || 'Economy') * rtMultiplier;
                        const hasMultipleLegs = f.legs && f.legs.length > 1;
                        return (
                          <div key={f.id} style={{ padding: '10px 0', borderBottom: idx < group.flights.length - 1 ? '1px solid #fef3c7' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {f.isRoundTrip ? (
                                  <span style={{ fontWeight: '600', fontSize: '13px', minWidth: '85px' }}>{formatDate(f.date)} ⇄ {formatDate(f.returnDate)}</span>
                                ) : (
                                  <span style={{ fontWeight: '600', fontSize: '13px', minWidth: '85px' }}>{formatDate(f.date)}</span>
                                )}
                                {f.isRoundTrip && (
                                  <span style={{ fontSize: '10px', color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '8px', fontWeight: '600' }}>
                                    🔄 R/T
                                  </span>
                                )}
                                {hasMultipleLegs && (
                                  <span style={{ fontSize: '10px', color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '8px', fontWeight: '600' }}>
                                    {f.legs.length} LEGS{f.isRoundTrip ? ' × 2' : ''}
                                  </span>
                                )}
                                {f.airline && (() => {
                                  const airlineWebsite = getAirlineWebsite(f.airline);
                                  return airlineWebsite ? (
                                    <a
                                      href={airlineWebsite}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ 
                                        fontSize: '11px', 
                                        color: '#555', 
                                        background: '#fff', 
                                        padding: '2px 6px', 
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.background = '#3b82f6';
                                        e.currentTarget.style.color = '#fff';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.background = '#fff';
                                        e.currentTarget.style.color = '#555';
                                      }}
                                      title={`Visit ${f.airline} website`}
                                    >
                                      {f.airline}
                                      <Globe size={9} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#555', background: '#fff', padding: '2px 6px', borderRadius: '6px' }}>
                                      {f.airline}
                                    </span>
                                  );
                                })()}
                                {f.aircraftType && <span style={{ fontSize: '11px', color: '#888' }}>{f.aircraftType}</span>}
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '6px',
                                  background: f.serviceClass === 'Economy' ? '#fef3c7' : f.serviceClass === 'Business' ? '#dbeafe' : f.serviceClass === 'First' ? '#fef9c3' : '#dcfce7',
                                  color: f.serviceClass === 'Economy' ? '#92400e' : f.serviceClass === 'Business' ? '#1e40af' : f.serviceClass === 'First' ? '#854d0e' : '#166534'
                                }}>
                                  {f.serviceClass === 'Economy' ? '🐔' : f.serviceClass === 'Business' ? '💼' : f.serviceClass === 'First' ? '👑' : '💺'} {f.serviceClass === 'Economy' ? 'Chicken' : f.serviceClass}
                                </span>
                                <span style={{ fontSize: '10px', color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: '6px' }}>
                                  <CloudRain size={10} style={{verticalAlign: 'middle'}}/> {Math.round(flightCO2)} kg
                                </span>
                                {f.paymentAmount && (
                                  <span style={{ fontSize: '10px', color: f.paymentType === 'miles' ? '#2563eb' : '#16a34a', background: f.paymentType === 'miles' ? '#eff6ff' : '#f0fdf4', padding: '2px 6px', borderRadius: '6px' }}>
                                    {f.paymentType === 'miles' ? `✈️ ${parseInt(f.paymentAmount).toLocaleString()} mi` : `💵 $${parseFloat(f.paymentAmount).toLocaleString()}`}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <FileText size={14} style={{ cursor: 'pointer', color: f.notes ? '#6366f1' : '#bbb' }} title={f.notes ? 'View/edit notes' : 'Add notes'} onClick={() => openNotes(f)} />
                                <Edit2 size={14} style={{ cursor: 'pointer', color: '#888' }} onClick={() => handleEditFlight(f)} />
                                <Trash2 size={14} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => handleDeleteFlight(f.id)} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flight List - By Continent */}
      {sortMode === 'continent' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {groupedByContinent.map(({ continent, groups }) => (
            <div key={continent}>
              {/* Continent Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #bfdbfe'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Globe size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{continent}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    {groups.length} route{groups.length > 1 ? 's' : ''} • {groups.reduce((sum, g) => sum + g.flights.length, 0)} flight{groups.reduce((sum, g) => sum + g.flights.length, 0) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Routes in this continent */}
              <div style={{ display: 'grid', gap: '16px', paddingLeft: '20px' }}>
                {groups.map(group => (
                  <div key={`${group.origin}-${group.destination}`} style={{ 
                    border: '1px solid #bfdbfe', 
                    borderRadius: '16px', 
                    padding: '20px',
                    background: '#eff6ff'
                  }}>
                    {/* Route Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {group.origin} → {group.destination}
                          <a
                            href={getGoogleFlightsUrl(group.origin, group.destination)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Search on Google Flights"
                            style={{ display: 'inline-flex', alignItems: 'center', color: '#4285f4', verticalAlign: 'middle', marginLeft: '8px' }}
                          >
                            <Search size={16} />
                          </a>
                        </span>
                        <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                          {group.originCity} to {group.destCity}
                          {group.distance && <span style={{ marginLeft: '10px', color: '#888' }}>• {group.distance.toLocaleString()} mi</span>}
                        </div>
                        {(group.originCountry || group.destCountry) && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            🏳️ {[group.originCountry, group.destCountry].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' ↔ ')}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#1e40af', background: '#dbeafe', padding: '4px 8px', borderRadius: '12px' }}>
                          {group.flights.length} flight{group.flights.length > 1 ? 's' : ''}
                        </span>
                        <ArrowLeftRight size={14} style={{ cursor: 'pointer', color: '#666' }} title="Add return flight" onClick={() => handleReverseFlight(group.flights[0])} />
                        <Copy size={14} style={{ cursor: 'pointer', color: '#666' }} title="Copy route" onClick={() => handleCopyFlight(group.flights[0])} />
                      </div>
                    </div>

                    {/* Landmarks */}
                    {group.featuresCrossed && group.featuresCrossed.length > 0 && (
                      <div style={{marginBottom: '12px', display:'flex', flexWrap:'wrap', gap:'6px'}}>
                        {group.featuresCrossed.map(feat => (
                          <span key={feat} style={{fontSize:'10px', background:'#e0f2f1', color:'#004d40', padding:'3px 6px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'3px', fontWeight:'600'}}>
                            <Globe size={8}/> {feat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Individual Flights */}
                    <div style={{ borderTop: '1px solid #bfdbfe', paddingTop: '12px' }}>
                      {group.flights.map((f, idx) => {
                        const rtMultiplier = f.isRoundTrip ? 2 : 1;
                        const flightCO2 = getCarbonEstimate(f.distance || 0, f.serviceClass || 'Economy') * rtMultiplier;
                        const hasMultipleLegs = f.legs && f.legs.length > 1;
                        return (
                          <div key={f.id} style={{ padding: '10px 0', borderBottom: idx < group.flights.length - 1 ? '1px solid #dbeafe' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {f.isRoundTrip ? (
                                  <span style={{ fontWeight: '600', fontSize: '13px', minWidth: '85px' }}>{formatDate(f.date)} ⇄ {formatDate(f.returnDate)}</span>
                                ) : (
                                  <span style={{ fontWeight: '600', fontSize: '13px', minWidth: '85px' }}>{formatDate(f.date)}</span>
                                )}
                                {f.isRoundTrip && (
                                  <span style={{ fontSize: '10px', color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '8px', fontWeight: '600' }}>
                                    🔄 R/T
                                  </span>
                                )}
                                {hasMultipleLegs && (
                                  <span style={{ fontSize: '10px', color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '8px', fontWeight: '600' }}>
                                    {f.legs.length} LEGS{f.isRoundTrip ? ' × 2' : ''}
                                  </span>
                                )}
                                {f.airline && (() => {
                                  const airlineWebsite = getAirlineWebsite(f.airline);
                                  return airlineWebsite ? (
                                    <a
                                      href={airlineWebsite}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ 
                                        fontSize: '11px', 
                                        color: '#555', 
                                        background: '#fff', 
                                        padding: '2px 6px', 
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.background = '#3b82f6';
                                        e.currentTarget.style.color = '#fff';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.background = '#fff';
                                        e.currentTarget.style.color = '#555';
                                      }}
                                      title={`Visit ${f.airline} website`}
                                    >
                                      {f.airline}
                                      <Globe size={9} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#555', background: '#fff', padding: '2px 6px', borderRadius: '6px' }}>
                                      {f.airline}
                                    </span>
                                  );
                                })()}
                                {f.aircraftType && <span style={{ fontSize: '11px', color: '#888' }}>{f.aircraftType}</span>}
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '6px',
                                  background: f.serviceClass === 'Economy' ? '#fef3c7' : f.serviceClass === 'Business' ? '#dbeafe' : f.serviceClass === 'First' ? '#fef9c3' : '#dcfce7',
                                  color: f.serviceClass === 'Economy' ? '#92400e' : f.serviceClass === 'Business' ? '#1e40af' : f.serviceClass === 'First' ? '#854d0e' : '#166534'
                                }}>
                                  {f.serviceClass === 'Economy' ? '🐔' : f.serviceClass === 'Business' ? '💼' : f.serviceClass === 'First' ? '👑' : '💺'} {f.serviceClass === 'Economy' ? 'Chicken' : f.serviceClass}
                                </span>
                                <span style={{ fontSize: '10px', color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: '6px' }}>
                                  <CloudRain size={10} style={{verticalAlign: 'middle'}}/> {Math.round(flightCO2)} kg
                                </span>
                                {f.paymentAmount && (
                                  <span style={{ fontSize: '10px', color: f.paymentType === 'miles' ? '#2563eb' : '#16a34a', background: f.paymentType === 'miles' ? '#eff6ff' : '#f0fdf4', padding: '2px 6px', borderRadius: '6px' }}>
                                    {f.paymentType === 'miles' ? `✈️ ${parseInt(f.paymentAmount).toLocaleString()} mi` : `💵 $${parseFloat(f.paymentAmount).toLocaleString()}`}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <FileText size={14} style={{ cursor: 'pointer', color: f.notes ? '#6366f1' : '#bbb' }} title={f.notes ? 'View/edit notes' : 'Add notes'} onClick={() => openNotes(f)} />
                                <Edit2 size={14} style={{ cursor: 'pointer', color: '#888' }} onClick={() => handleEditFlight(f)} />
                                <Trash2 size={14} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => handleDeleteFlight(f.id)} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {notesFlightId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: '#fff', padding: '28px', borderRadius: '20px',
            width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                  Flight Notes
                </h3>
                {notesFlight && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                    {notesFlight.origin} → {notesFlight.destination} · {formatDate(notesFlight.date)}
                  </p>
                )}
              </div>
              <X size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={closeNotes} />
            </div>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value.slice(0, MAX_NOTES_LENGTH))}
              placeholder="Add personal notes about this flight…"
              style={{
                width: '100%', height: '180px', resize: 'vertical',
                border: '1px solid #e2e8f0', borderRadius: '10px',
                padding: '12px', fontSize: '14px', lineHeight: '1.5',
                fontFamily: 'inherit', color: '#1e293b', outline: 'none',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '12px', color: notesDraft.length >= MAX_NOTES_LENGTH ? '#dc2626' : '#94a3b8' }}>
                {notesDraft.length} / {MAX_NOTES_LENGTH}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={closeNotes}
                  style={{
                    padding: '8px 16px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    color: '#64748b', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveNotes}
                  style={{
                    padding: '8px 20px', borderRadius: '8px',
                    border: 'none', background: '#6366f1',
                    color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlightListSection;
