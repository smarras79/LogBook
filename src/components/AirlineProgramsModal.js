import React, { useState } from 'react';
import { X, Plus, Trash2, Plane, Search, ExternalLink } from 'lucide-react';
import { modalOverlay, modalContent, inputStyle } from '../styles/constants';
import { ALL_AIRLINES_LIST, AIRLINE_LOYALTY_PROGRAMS, AIRLINE_WEBSITES } from '../data/airlines';
import { getAirlineAlliance } from '../utils/airlines';
import { ALLIANCE_STYLES } from '../data/airlines';

function AirlineProgramsModal({ linkedPrograms, onSave, onClose, milesByAirline }) {
  const [programs, setPrograms] = useState(linkedPrograms || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState('');
  const [membershipId, setMembershipId] = useState('');

  const filteredAirlines = ALL_AIRLINES_LIST.filter(a => {
    const alreadyLinked = programs.some(p => p.airline === a);
    if (alreadyLinked) return false;
    if (!searchQuery) return true;
    return a.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddProgram = (airline) => {
    const loyaltyName = AIRLINE_LOYALTY_PROGRAMS[airline] || airline;
    setPrograms([...programs, {
      airline,
      programName: loyaltyName,
      memberId: membershipId.trim() || '',
      addedAt: new Date().toISOString()
    }]);
    setSelectedAirline('');
    setMembershipId('');
    setSearchQuery('');
    setShowAddForm(false);
  };

  const handleRemoveProgram = (index) => {
    setPrograms(programs.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(programs);
    onClose();
  };

  const getMilesForAirline = (airline) => {
    if (!milesByAirline) return 0;
    // Check exact match and common variants
    let total = 0;
    Object.entries(milesByAirline).forEach(([key, miles]) => {
      const k = key.toLowerCase().trim();
      const a = airline.toLowerCase().trim();
      if (k === a) { total += miles; return; }
      // Match variants like "United" vs "United Airlines"
      const aNoSuffix = a.replace(/\s*(airlines?|airways?|air lines?)\s*$/i, '').trim();
      const kNoSuffix = k.replace(/\s*(airlines?|airways?|air lines?)\s*$/i, '').trim();
      if (kNoSuffix === aNoSuffix) { total += miles; return; }
      if (k.startsWith(aNoSuffix) || a.startsWith(kNoSuffix)) { total += miles; }
    });
    return Math.round(total);
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div
        style={{
          ...modalContent,
          width: '520px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '0'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          zIndex: 1
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>
              Airline Loyalty Programs
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Link your frequent flyer programs to track miles
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px', borderRadius: '8px', color: '#64748b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Linked Programs List */}
        <div style={{ padding: '16px 24px' }}>
          {programs.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              color: '#94a3b8', fontSize: '14px'
            }}>
              <Plane size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div>No airline programs linked yet.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Add your frequent flyer programs to see your miles.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {programs.map((program, idx) => {
                const alliance = getAirlineAlliance(program.airline);
                const allianceStyle = ALLIANCE_STYLES[alliance] || ALLIANCE_STYLES['Independent'];
                const miles = getMilesForAirline(program.airline);
                const website = AIRLINE_WEBSITES[program.airline];
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px',
                    background: allianceStyle.background,
                    border: `1px solid ${allianceStyle.color}20`,
                    borderRadius: '12px',
                    transition: 'all 0.2s ease'
                  }}>
                    <span style={{ fontSize: '20px' }}>{allianceStyle.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          fontWeight: '600', fontSize: '14px',
                          color: allianceStyle.color
                        }}>
                          {program.airline}
                        </span>
                        {website && (
                          <a href={website} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#94a3b8', display: 'flex' }}
                            title="Visit airline website"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {program.programName}
                        {program.memberId && (
                          <span style={{ marginLeft: '8px', color: '#94a3b8' }}>
                            #{program.memberId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: '18px', fontWeight: '700',
                        color: miles > 0 ? allianceStyle.color : '#cbd5e1'
                      }}>
                        {miles > 0 ? miles.toLocaleString() : '0'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
                        miles flown
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveProgram(idx)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '6px', borderRadius: '6px', color: '#ef4444',
                        opacity: 0.6, flexShrink: 0
                      }}
                      title="Remove program"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total miles across all linked programs */}
          {programs.length > 0 && (
            <div style={{
              marginTop: '16px', padding: '12px 16px',
              background: '#f0f9ff', borderRadius: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: '1px solid #bae6fd'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0369a1' }}>
                Total across linked programs
              </span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#0284c7' }}>
                {programs.reduce((sum, p) => sum + getMilesForAirline(p.airline), 0).toLocaleString()} mi
              </span>
            </div>
          )}
        </div>

        {/* Add Program Section */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9'
        }}>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%', padding: '12px',
                background: '#f8fafc', border: '2px dashed #cbd5e1',
                borderRadius: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', fontSize: '14px', color: '#64748b',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={18} /> Add Airline Program
            </button>
          ) : (
            <div style={{
              background: '#f8fafc', borderRadius: '12px',
              padding: '16px', border: '1px solid #e2e8f0'
            }}>
              {/* Search input */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={16} style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: '#94a3b8'
                }} />
                <input
                  type="text"
                  placeholder="Search airlines..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    ...inputStyle, width: '100%', paddingLeft: '36px',
                    boxSizing: 'border-box', fontSize: '14px'
                  }}
                />
              </div>

              {/* Airline list */}
              <div style={{
                maxHeight: '200px', overflowY: 'auto',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                background: '#fff'
              }}>
                {filteredAirlines.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No airlines found
                  </div>
                ) : (
                  filteredAirlines.map(airline => {
                    const alliance = getAirlineAlliance(airline);
                    const allianceStyle = ALLIANCE_STYLES[alliance] || ALLIANCE_STYLES['Independent'];
                    const loyaltyName = AIRLINE_LOYALTY_PROGRAMS[airline] || '';
                    const isSelected = selectedAirline === airline;
                    return (
                      <div key={airline}>
                        <div
                          onClick={() => setSelectedAirline(isSelected ? '' : airline)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            borderBottom: '1px solid #f1f5f9',
                            background: isSelected ? allianceStyle.background : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>{allianceStyle.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '13px', fontWeight: isSelected ? '600' : '400',
                              color: isSelected ? allianceStyle.color : '#334155'
                            }}>
                              {airline}
                            </div>
                            {loyaltyName && (
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {loyaltyName}
                              </div>
                            )}
                          </div>
                          <span style={{
                            fontSize: '10px', color: allianceStyle.color,
                            background: allianceStyle.background,
                            padding: '2px 8px', borderRadius: '10px'
                          }}>
                            {alliance}
                          </span>
                        </div>
                        {/* Membership ID input when selected */}
                        {isSelected && (
                          <div style={{
                            padding: '10px 14px',
                            background: '#f8fafc',
                            display: 'flex', gap: '8px', alignItems: 'center'
                          }}>
                            <input
                              type="text"
                              placeholder="Membership # (optional)"
                              value={membershipId}
                              onChange={e => setMembershipId(e.target.value)}
                              style={{
                                ...inputStyle, flex: 1, fontSize: '13px',
                                padding: '8px 12px'
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAddProgram(airline);
                              }}
                            />
                            <button
                              onClick={() => handleAddProgram(airline)}
                              style={{
                                background: allianceStyle.color,
                                color: '#fff',
                                border: 'none', borderRadius: '8px',
                                padding: '8px 16px', cursor: 'pointer',
                                fontSize: '13px', fontWeight: '600',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSearchQuery('');
                  setSelectedAirline('');
                  setMembershipId('');
                }}
                style={{
                  marginTop: '10px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '13px', color: '#64748b',
                  padding: '4px 0'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #eee',
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
          position: 'sticky', bottom: 0, background: '#fff',
          borderRadius: '0 0 20px 20px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              border: '1px solid #e2e8f0', background: '#fff',
              cursor: 'pointer', fontSize: '14px', color: '#64748b'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px', borderRadius: '10px',
              border: 'none', background: '#6366f1', color: '#fff',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default AirlineProgramsModal;
