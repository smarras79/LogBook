import React, { useState, useEffect } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Settings, Plane, Globe, Map, Flag, MapPin, CloudRain, Moon, Users, DollarSign, CreditCard, Trophy, Mountain } from 'lucide-react';
import { statCard, statVal, statLbl } from '../styles/constants';
import { ALLIANCE_STYLES, ALLIANCE_MEMBERS_DISPLAY } from '../data/airlines';
import { isAirlineMatch } from '../utils/airlines';

function StatsSection({
  flights, totalFlightLegs, totalMiles, totalPassengers,
  uniqueCountries, uniqueContinents, uniqueAirports,
  totalCarbonKg, totalCarbonTons, totalFlightCarbonKg, totalFlightCarbonTons,
  allFeatures, topFeatures, allAirlines, topAirlines, allAircraft, topAircraft,
  sortedAlliances, dominantAlliance, totalFlightsWithAirlines,
  sortedClasses, sortedCarbonByClass, paymentStats, groupedFlights
}) {
  const [statsExpanded, setStatsExpanded] = useState(() => {
    const saved = localStorage.getItem('statsExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [chartsExpanded, setChartsExpanded] = useState(() => {
    const saved = localStorage.getItem('chartsExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [visibleStats, setVisibleStats] = useState(() => {
    const defaults = {
      flights: true, miles: true, routes: true, countries: true,
      continents: true, airports: true, co2: true, alliance: true,
      moon: true, world: true, passengers: true, money: true, milesSpent: true
    };
    const saved = localStorage.getItem('visibleStats');
    if (saved) return { ...defaults, ...JSON.parse(saved) };
    return defaults;
  });
  const [showStatsSettings, setShowStatsSettings] = useState(false);
  const [showAllAircraft, setShowAllAircraft] = useState(false);
  const [showAllAirlines, setShowAllAirlines] = useState(false);
  const [showAllLandmarks, setShowAllLandmarks] = useState(false);
  const [openAllianceDropdown, setOpenAllianceDropdown] = useState(null);

  useEffect(() => { localStorage.setItem('statsExpanded', JSON.stringify(statsExpanded)); }, [statsExpanded]);
  useEffect(() => { localStorage.setItem('chartsExpanded', JSON.stringify(chartsExpanded)); }, [chartsExpanded]);
  useEffect(() => { localStorage.setItem('visibleStats', JSON.stringify(visibleStats)); }, [visibleStats]);

  // Close alliance dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openAllianceDropdown) setOpenAllianceDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openAllianceDropdown]);

  return (
    <>
      {/* Stats Dashboard */}
      <div style={{ marginBottom: statsExpanded ? '40px' : '12px' }}>
        {/* Stats Header with collapse/settings */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: statsExpanded ? '20px' : '0',
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: '12px',
          cursor: 'pointer'
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}
            onClick={() => setStatsExpanded(!statsExpanded)}
          >
            <BarChart3 size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#334155' }}>
              Travel Statistics
            </h3>
            {statsExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
            {!statsExpanded && (
              <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '10px' }}>
                {totalFlightLegs} flights • {totalMiles.toLocaleString()} mi • {uniqueCountries.length} countries
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowStatsSettings(!showStatsSettings); }}
            style={{
              background: showStatsSettings ? '#e0e7ff' : 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}
            title="Customize visible stats"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Stats Settings Panel */}
        {showStatsSettings && (
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '12px' }}>
              Choose which stats to display:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { key: 'flights', label: '\u2708\uFE0F Flights' },
                { key: 'miles', label: '\uD83C\uDF0D Miles' },
                { key: 'routes', label: '\uD83D\uDDFA\uFE0F Routes' },
                { key: 'countries', label: '\uD83C\uDFF3\uFE0F Countries' },
                { key: 'continents', label: '\uD83C\uDF0E Continents' },
                { key: 'airports', label: '\uD83D\uDCCD Airports' },
                { key: 'co2', label: '\u2601\uFE0F CO\u2082' },
                { key: 'alliance', label: '\u2B50 Alliance' },
                { key: 'moon', label: '\uD83C\uDF19 Moon %' },
                { key: 'world', label: '\uD83C\uDF0D World Laps' },
                { key: 'passengers', label: '\uD83D\uDC65 Passengers' },
                { key: 'money', label: '\uD83D\uDCB5 Money' },
                { key: 'milesSpent', label: '\uD83D\uDCB3 Miles Spent' }
              ].map(({ key, label }) => (
                <label key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: visibleStats[key] ? '#e0e7ff' : '#f1f5f9',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: visibleStats[key] ? '#4338ca' : '#64748b',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={visibleStats[key]}
                    onChange={(e) => setVisibleStats({ ...visibleStats, [key]: e.target.checked })}
                    style={{ display: 'none' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {statsExpanded && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {visibleStats.flights && (
              <div style={statCard}>
                <Plane size={20}/>
                <div style={statVal}>{totalFlightLegs}</div>
                <div style={statLbl}>Total Flights</div>
                {flights.length !== totalFlightLegs && (
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>({flights.length} trips)</div>
                )}
              </div>
            )}
            {visibleStats.miles && (
              <div style={statCard}><Globe size={20}/><div style={statVal}>{totalMiles.toLocaleString()}</div><div style={statLbl}>Total Miles</div></div>
            )}
            {visibleStats.routes && (
              <div style={statCard}><Map size={20}/><div style={statVal}>{Object.keys(groupedFlights).length}</div><div style={statLbl}>Unique Routes</div></div>
            )}
            {visibleStats.countries && (
              <div style={{...statCard, background: '#fef3c7', borderColor: '#f59e0b'}}>
                <Flag size={20} color="#d97706"/>
                <div style={{...statVal, color: '#b45309'}}>{uniqueCountries.length}</div>
                <div style={statLbl}>Countries</div>
                {uniqueCountries.length > 0 && (
                  <div style={{ fontSize: '9px', color: '#92400e', marginTop: '4px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={uniqueCountries.join(', ')}>
                    {uniqueCountries.slice(0, 3).join(', ')}{uniqueCountries.length > 3 ? '...' : ''}
                  </div>
                )}
              </div>
            )}
            {visibleStats.continents && (
              <div style={{...statCard, background: '#dbeafe', borderColor: '#3b82f6'}}>
                <Globe size={20} color="#2563eb"/>
                <div style={{...statVal, color: '#1d4ed8'}}>{uniqueContinents.length}</div>
                <div style={statLbl}>Continents</div>
                {uniqueContinents.length > 0 && (
                  <div style={{ fontSize: '9px', color: '#1e40af', marginTop: '4px' }}>
                    {uniqueContinents.join(', ')}
                  </div>
                )}
              </div>
            )}
            {visibleStats.airports && (
              <div style={{...statCard, background: '#f0fdf4', borderColor: '#22c55e'}}>
                <MapPin size={20} color="#16a34a"/>
                <div style={{...statVal, color: '#15803d'}}>{uniqueAirports.length}</div>
                <div style={statLbl}>Airports</div>
              </div>
            )}
            {visibleStats.co2 && (
              <div style={statCard}><CloudRain size={20} color="#dc2626"/><div style={statVal}>{totalCarbonTons}</div><div style={statLbl}>Your CO₂ (tons)</div></div>
            )}
            {visibleStats.alliance && dominantAlliance && dominantAlliance !== 'Independent' && (
              <div style={{
                ...statCard,
                background: ALLIANCE_STYLES[dominantAlliance].background,
                borderColor: ALLIANCE_STYLES[dominantAlliance].color
              }}>
                <span style={{ fontSize: '20px' }}>{ALLIANCE_STYLES[dominantAlliance].icon}</span>
                <div style={{...statVal, color: ALLIANCE_STYLES[dominantAlliance].color, fontSize: '18px'}}>{dominantAlliance}</div>
                <div style={statLbl}>Top Alliance</div>
              </div>
            )}
            {visibleStats.moon && (
              <div style={{...statCard, background: '#eef2ff', borderColor: '#6366f1'}}>
                <Moon size={20} color="#6366f1"/>
                <div style={{...statVal, color: '#4f46e5'}}>{((totalMiles / 238855) * 100).toFixed(2)}%</div>
                <div style={statLbl}>🌙 To the Moon</div>
              </div>
            )}
            {visibleStats.world && (
              <div style={{...statCard, background: '#ecfdf5', borderColor: '#10b981'}}>
                <Globe size={20} color="#10b981"/>
                <div style={{...statVal, color: '#059669'}}>{(totalMiles / 24901).toFixed(2)}×</div>
                <div style={statLbl}>🌍 Around the World</div>
              </div>
            )}
            {visibleStats.passengers && flights.length > 0 && (
              <div style={{...statCard, background: '#fdf4ff', borderColor: '#c026d3'}}>
                <Users size={20} color="#c026d3"/>
                <div style={{...statVal, color: '#a21caf'}}>{totalPassengers.toLocaleString()}</div>
                <div style={statLbl}>👥 Fellow Passengers</div>
              </div>
            )}
            {visibleStats.money && paymentStats.totalMoneySpent > 0 && (
              <div style={{...statCard, background: '#f0fdf4', borderColor: '#22c55e'}}>
                <DollarSign size={20} color="#22c55e"/>
                <div style={{...statVal, color: '#16a34a'}}>${paymentStats.totalMoneySpent.toLocaleString()}</div>
                <div style={statLbl}>Money Spent</div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>({paymentStats.moneyFlightCount} trip{paymentStats.moneyFlightCount > 1 ? 's' : ''})</div>
              </div>
            )}
            {visibleStats.milesSpent && paymentStats.totalMilesSpent > 0 && (
              <div style={{...statCard, background: '#eff6ff', borderColor: '#3b82f6'}}>
                <CreditCard size={20} color="#3b82f6"/>
                <div style={{...statVal, color: '#2563eb'}}>{paymentStats.totalMilesSpent.toLocaleString()}</div>
                <div style={statLbl}>Miles Redeemed</div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>({paymentStats.milesFlightCount} trip{paymentStats.milesFlightCount > 1 ? 's' : ''})</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Charts Section */}
      {flights.length > 0 && (
        <div style={{ marginBottom: chartsExpanded ? '40px' : '12px' }}>
          {/* Charts Header with collapse */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: chartsExpanded ? '20px' : '0',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
            onClick={() => setChartsExpanded(!chartsExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={20} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#334155' }}>
                Detailed Breakdown
              </h3>
              {chartsExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
              {!chartsExpanded && (
                <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '10px' }}>
                  {topAirlines.length} airlines • {topAircraft.length} aircraft • {sortedAlliances.length} alliances
                </span>
              )}
            </div>
          </div>

          {/* Charts Grid */}
          {chartsExpanded && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Top Airlines Chart */}
              {topAirlines.length > 0 && (
                <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}><Plane size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> {showAllAirlines ? 'All Airlines' : 'Top Airlines'}</h3>
                    {allAirlines && allAirlines.length > 5 && (
                      <button
                        onClick={() => setShowAllAirlines(!showAllAirlines)}
                        style={{
                          background: showAllAirlines ? '#4285F4' : '#fff',
                          color: showAllAirlines ? '#fff' : '#4285F4',
                          border: '1px solid #4285F4',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {showAllAirlines ? `Show Top 5` : `Show All (${allAirlines.length})`}
                      </button>
                    )}
                  </div>
                  {(showAllAirlines ? allAirlines : topAirlines).map(([name, count]) => (
                    <div key={name} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{name}</span><span>{count} flight{count > 1 ? 's' : ''}</span></div>
                      <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                        <div style={{ height: '100%', background: '#4285F4', borderRadius: '4px', width: `${(count/totalFlightLegs)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Aircraft Chart */}
              {topAircraft.length > 0 && (
                <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}><BarChart3 size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> {showAllAircraft ? 'All Aircraft' : 'Top Aircraft'}</h3>
                    {allAircraft.length > 5 && (
                      <button
                        onClick={() => setShowAllAircraft(!showAllAircraft)}
                        style={{
                          background: showAllAircraft ? '#f97316' : '#fff',
                          color: showAllAircraft ? '#fff' : '#f97316',
                          border: '1px solid #f97316',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {showAllAircraft ? `Show Top 5` : `Show All (${allAircraft.length})`}
                      </button>
                    )}
                  </div>
                  {(showAllAircraft ? allAircraft : topAircraft).map(([name, count]) => (
                    <div key={name} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{name}</span><span>{count} flights</span></div>
                      <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                        <div style={{ height: '100%', background: '#f97316', borderRadius: '4px', width: `${(count/flights.length)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Class of Service Chart */}
              {sortedClasses.length > 0 && (
                <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
                  <h3 style={{ marginTop: 0 }}><Trophy size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Class of Service</h3>
                  {sortedClasses.map(([name, count]) => {
                    const barColor = name === 'Economy' ? '#d97706' :
                                     name === 'Premium Economy' ? '#16a34a' :
                                     name === 'Business' ? '#2563eb' :
                                     '#ca8a04'; /* First - gold */
                    const displayName = name === 'Economy' ? '🐔 Chicken class' :
                                        name === 'Premium Economy' ? '💺 Premium Economy' :
                                        name === 'Business' ? '💼 Business' :
                                        '👑 First';
                    return (
                      <div key={name} style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                          <span>{displayName}</span>
                          <span>{count} flight{count > 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                          <div style={{ height: '100%', background: barColor, borderRadius: '4px', width: `${(count/totalFlightLegs)*100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Alliance Breakdown Chart */}
              {sortedAlliances.length > 0 && (
                <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
                  <h3 style={{ marginTop: 0 }}><Users size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Airline Alliances</h3>
                  {sortedAlliances.map(([alliance, count]) => {
                    const style = ALLIANCE_STYLES[alliance] || ALLIANCE_STYLES['Independent'];
                    const dropdownId = `chart-alliance-${alliance}`;
                    const isOpen = openAllianceDropdown === dropdownId;
                    const members = ALLIANCE_MEMBERS_DISPLAY[alliance] || [];
                    const hasDropdown = alliance !== 'Independent' && members.length > 0;

                    return (
                      <div key={alliance} style={{ marginBottom: '15px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                          <span
                            onClick={(e) => {
                              if (hasDropdown) {
                                e.stopPropagation();
                                setOpenAllianceDropdown(isOpen ? null : dropdownId);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: hasDropdown ? 'pointer' : 'default',
                              padding: '4px 8px',
                              marginLeft: '-8px',
                              borderRadius: '6px',
                              background: isOpen ? style.background : 'transparent',
                              transition: 'background 0.2s ease'
                            }}
                            title={hasDropdown ? `Click to see all ${alliance} members` : ''}
                          >
                            <span>{style.icon}</span>
                            {alliance}
                            {hasDropdown && (
                              <span style={{
                                fontSize: '10px',
                                color: '#888',
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease'
                              }}>▼</span>
                            )}
                    </span>
                    <span>{count} flights ({Math.round((count/totalFlightsWithAirlines)*100)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                    <div style={{
                      height: '100%',
                      background: style.color,
                      borderRadius: '4px',
                      width: `${(count/totalFlightsWithAirlines)*100}%`
                    }} />
                  </div>

                  {/* Alliance Members Dropdown */}
                  {isOpen && members.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        marginTop: '8px',
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        border: `1px solid ${style.color}20`,
                        zIndex: 1000,
                        minWidth: '260px',
                        maxHeight: '350px',
                        overflowY: 'auto'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{
                        padding: '14px 18px',
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
                          gap: '8px',
                          fontSize: '15px'
                        }}>
                          <span>{style.icon}</span>
                          {alliance}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {members.length} member airlines worldwide
                        </div>
                      </div>
                      <div style={{ padding: '8px 0' }}>
                        {members.map((member, idx) => {
                          // Check if user has flown this airline (including multi-leg trips)
                          const hasFlown = flights.some(f => {
                            // Check top-level airline (single-leg trips)
                            if (f.airline && isAirlineMatch(f.airline, member)) {
                              return true;
                            }
                            // Check each leg's airline (multi-leg trips)
                            if (f.legs && f.legs.length > 0) {
                              return f.legs.some(leg => leg.airline && isAirlineMatch(leg.airline, member));
                            }
                            return false;
                          });
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '10px 18px',
                                fontSize: '13px',
                                color: hasFlown ? style.color : '#555',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: hasFlown ? style.background : 'transparent',
                                fontWeight: hasFlown ? '600' : 'normal',
                                borderLeft: hasFlown ? `3px solid ${style.color}` : '3px solid transparent'
                              }}
                            >
                              <span style={{ color: hasFlown ? style.color : '#999' }}>✈</span>
                              {member}
                              {hasFlown && (
                                <span style={{
                                  fontSize: '9px',
                                  background: style.color,
                                  color: '#fff',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  marginLeft: 'auto'
                                }}>
                                  FLOWN
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {dominantAlliance && dominantAlliance !== 'Independent' && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: ALLIANCE_STYLES[dominantAlliance].background,
                borderRadius: '8px',
                fontSize: '13px',
                color: ALLIANCE_STYLES[dominantAlliance].color,
                textAlign: 'center'
              }}>
                {ALLIANCE_STYLES[dominantAlliance].icon} You're a <strong>{dominantAlliance}</strong> loyalist!
              </div>
            )}
          </div>
        )}

              {/* Top Landmarks Chart */}
              <div style={{ background: '#f9f9f9', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}><Mountain size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> {showAllLandmarks ? 'All Landmarks' : 'Top Landmarks'}</h3>
                  {allFeatures && allFeatures.length > 5 && (
                    <button
                      onClick={() => setShowAllLandmarks(!showAllLandmarks)}
                      style={{
                        background: showAllLandmarks ? '#008080' : '#fff',
                        color: showAllLandmarks ? '#fff' : '#008080',
                        border: '1px solid #008080',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {showAllLandmarks ? `Show Top 5` : `Show All (${allFeatures.length})`}
                    </button>
                  )}
                </div>
                {topFeatures.length === 0 ? <p style={{color:'#666', fontSize:'13px'}}>No landmarks detected yet.</p> : (showAllLandmarks ? allFeatures : topFeatures).map(([name, count]) => (
                  <div key={name} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{name}</span><span>{count} times</span></div>
                    <div style={{ height: '8px', background: '#eee', borderRadius: '4px' }}>
                      <div style={{ height: '100%', background: '#008080', borderRadius: '4px', width: `${(count/flights.length)*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Carbon Footprint Breakdown */}
              {totalCarbonKg > 0 && (
                <div style={{ background: '#fef2f2', padding: '24px', borderRadius: '16px' }}>
                  <h3 style={{ marginTop: 0, color: '#991b1b' }}><CloudRain size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> Your Carbon Footprint</h3>

                  {/* Personal vs Total Flight comparison */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{totalCarbonTons}t</div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Your emissions</div>
                    </div>
                    <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9ca3af' }}>{totalFlightCarbonTons}t</div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Total flights' emissions</div>
                    </div>
                  </div>

            {/* Driving comparison */}
            <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>🚗 If you drove {totalMiles.toLocaleString()} miles instead:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{(totalMiles * 0.21 / 1000).toFixed(2)}t</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>CO₂ by car</span>
                </div>
                <div style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: totalCarbonKg < (totalMiles * 0.21) ? '#dcfce7' : '#fef3c7',
                  color: totalCarbonKg < (totalMiles * 0.21) ? '#166534' : '#854d0e'
                }}>
                  {totalCarbonKg < (totalMiles * 0.21)
                    ? `✈️ Flying saved ${((totalMiles * 0.21 - totalCarbonKg) / 1000).toFixed(2)}t`
                    : `🚗 Driving would save ${((totalCarbonKg - totalMiles * 0.21) / 1000).toFixed(2)}t`
                  }
                </div>
              </div>
            </div>

            {/* Train comparison - ~0.041 kg CO2 per passenger-mile for average train */}
            <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>🚂 If you took trains for {totalMiles.toLocaleString()} miles instead:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0891b2' }}>{(totalMiles * 0.041 / 1000).toFixed(2)}t</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>CO₂ by train</span>
                </div>
                <div style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  color: '#854d0e'
                }}>
                  🚂 Train would save {((totalCarbonKg - totalMiles * 0.041) / 1000).toFixed(2)}t ({Math.round((1 - (totalMiles * 0.041) / totalCarbonKg) * 100)}% less)
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Your breakdown by class:</div>
            {sortedCarbonByClass.map(([name, carbonKg]) => {
              const barColor = name === 'Economy' ? '#d97706' :
                               name === 'Premium Economy' ? '#16a34a' :
                               name === 'Business' ? '#2563eb' :
                               '#ca8a04';
              const displayName = name === 'Economy' ? '🐔 Chicken' :
                                  name === 'Premium Economy' ? '💺 Prem Eco' :
                                  name === 'Business' ? '💼 Business' :
                                  '👑 First';
              return (
                <div key={name} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>{displayName}</span>
                    <span>{(carbonKg / 1000).toFixed(2)}t ({Math.round(carbonKg / totalCarbonKg * 100)}%)</span>
                  </div>
                  <div style={{ height: '6px', background: '#fecaca', borderRadius: '3px' }}>
                    <div style={{ height: '100%', background: barColor, borderRadius: '3px', width: `${(carbonKg/totalCarbonKg)*100}%` }} />
                  </div>
                </div>
              );
            })}
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '16px', borderTop: '1px solid #fecaca', paddingTop: '12px' }}>
                    💡 Your share: ~{((totalCarbonKg / totalFlightCarbonKg) * 100).toFixed(1)}% of total aircraft emissions. Premium classes have larger footprints due to increased seat space.<br/>
                    <span style={{ color: '#aaa' }}>Rates: 0.14 kg CO₂/mi (flying), 0.21 kg CO₂/mi (driving), 0.041 kg CO₂/mi (train avg).</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default StatsSection;
