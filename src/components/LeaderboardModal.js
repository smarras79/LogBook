import React from 'react';
import { Trophy, X, Loader2, Users } from 'lucide-react';
import { modalOverlay, modalContent } from '../styles/constants';

const LeaderboardModal = ({
  leaderboardData,
  loadingLeaderboard,
  leaderboardSortBy,
  setLeaderboardSortBy,
  setShowLeaderboard,
  getSortedLeaderboard,
  contestOptIn,
  authUser,
  contestLoading,
  handleContestOptInToggle,
  fetchLeaderboard
}) => {
  return (
    <div style={modalOverlay}>
      <div style={{
        ...modalContent,
        maxWidth: '750px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Global Leaderboard</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#888' }}>
                {leaderboardData.length} explorer{leaderboardData.length !== 1 ? 's' : ''} competing
              </p>
            </div>
          </div>
          <X style={{ cursor: 'pointer' }} onClick={() => setShowLeaderboard(false)} />
        </div>

        {loadingLeaderboard ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            color: '#888'
          }}>
            <Loader2 className="animate-spin" size={32} style={{ marginBottom: '12px' }} />
            <span>Loading leaderboard...</span>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <Users size={48} style={{ marginBottom: '16px', color: '#ccc' }} />
            <h3 style={{ margin: '0 0 8px 0' }}>No competitors yet</h3>
            <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
              Be the first to opt in and claim the top spot!
            </p>
          </div>
        ) : (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            marginRight: '-10px',
            paddingRight: '10px'
          }}>
            {/* Sort Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b', marginRight: '4px' }}>Sort by:</span>
              {[
                { key: 'miles', label: '✈️ Miles', color: '#f59e0b' },
                { key: 'flights', label: '🛫 Flights', color: '#3b82f6' },
                { key: 'countries', label: '🌍 Countries', color: '#10b981' },
                { key: 'co2', label: '🌱 CO₂ (Low)', color: '#059669' }
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setLeaderboardSortBy(key)}
                  style={{
                    background: leaderboardSortBy === key ? color : '#f1f5f9',
                    color: leaderboardSortBy === key ? '#fff' : '#64748b',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0 6px',
              minWidth: '600px'
            }}>
              <thead>
                <tr style={{
                  background: '#f8fafc',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase'
                }}>
                  <th style={{ padding: '10px 10px', textAlign: 'center', borderRadius: '8px 0 0 8px', width: '50px' }}>#</th>
                  <th style={{ padding: '10px 10px', textAlign: 'left', minWidth: '120px' }}>Explorer</th>
                  <th
                    style={{
                      padding: '10px 10px',
                      textAlign: 'right',
                      width: '90px',
                      background: leaderboardSortBy === 'miles' ? '#fef3c7' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setLeaderboardSortBy('miles')}
                  >
                    Miles {leaderboardSortBy === 'miles' && '▼'}
                  </th>
                  <th
                    style={{
                      padding: '10px 10px',
                      textAlign: 'right',
                      width: '70px',
                      background: leaderboardSortBy === 'flights' ? '#dbeafe' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setLeaderboardSortBy('flights')}
                  >
                    Flights {leaderboardSortBy === 'flights' && '▼'}
                  </th>
                  <th
                    style={{
                      padding: '10px 10px',
                      textAlign: 'right',
                      width: '80px',
                      background: leaderboardSortBy === 'countries' ? '#dcfce7' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setLeaderboardSortBy('countries')}
                  >
                    Countries {leaderboardSortBy === 'countries' && '▼'}
                  </th>
                  <th
                    style={{
                      padding: '10px 10px',
                      textAlign: 'right',
                      borderRadius: '0 8px 8px 0',
                      width: '75px',
                      background: leaderboardSortBy === 'co2' ? '#ecfdf5' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setLeaderboardSortBy('co2')}
                  >
                    CO₂ {leaderboardSortBy === 'co2' && '▲'}
                  </th>
                </tr>
              </thead>

              <tbody>
                {getSortedLeaderboard().map((entry, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  const medalColors = ['#fbbf24', '#9ca3af', '#cd7f32'];

                  return (
                    <tr
                      key={entry.id}
                      style={{
                        background: entry.isCurrentUser
                          ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                          : isTop3 ? '#fffbeb' : '#fff',
                        boxShadow: entry.isCurrentUser
                          ? 'inset 0 0 0 2px #10b981'
                          : isTop3 ? 'inset 0 0 0 1px #fde68a' : 'inset 0 0 0 1px #f1f5f9',
                        borderRadius: '10px'
                      }}
                    >
                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'center',
                        borderRadius: '10px 0 0 10px'
                      }}>
                        {isTop3 ? (
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: medalColors[rank - 1],
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '11px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            {rank}
                          </div>
                        ) : (
                          <span style={{
                            fontWeight: '600',
                            color: '#64748b',
                            fontSize: '13px'
                          }}>
                            {rank}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: entry.isCurrentUser ? '#10b981' : '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: entry.isCurrentUser ? '#fff' : '#64748b',
                            fontWeight: '600',
                            fontSize: '12px',
                            flexShrink: 0
                          }}>
                            {entry.displayName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div style={{
                            fontWeight: '600',
                            fontSize: '13px',
                            color: entry.isCurrentUser ? '#059669' : '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            overflow: 'hidden'
                          }}>
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '90px'
                            }}>
                              {entry.displayName}
                            </span>
                            {entry.isCurrentUser && (
                              <span style={{
                                fontSize: '9px',
                                background: '#10b981',
                                color: '#fff',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                flexShrink: 0
                              }}>
                                YOU
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'right',
                        fontWeight: leaderboardSortBy === 'miles' ? '700' : '600',
                        fontSize: '13px',
                        color: leaderboardSortBy === 'miles' ? '#b45309' : '#1e293b',
                        background: leaderboardSortBy === 'miles' ? 'rgba(254, 243, 199, 0.5)' : 'transparent',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {(entry.totalMiles || 0).toLocaleString()}
                      </td>

                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'right',
                        fontWeight: leaderboardSortBy === 'flights' ? '700' : '500',
                        fontSize: '13px',
                        color: leaderboardSortBy === 'flights' ? '#1e40af' : '#64748b',
                        background: leaderboardSortBy === 'flights' ? 'rgba(219, 234, 254, 0.5)' : 'transparent',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {entry.totalFlights || 0}
                      </td>

                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'right',
                        fontWeight: leaderboardSortBy === 'countries' ? '700' : '500',
                        fontSize: '13px',
                        color: leaderboardSortBy === 'countries' ? '#166534' : '#64748b',
                        background: leaderboardSortBy === 'countries' ? 'rgba(220, 252, 231, 0.5)' : 'transparent',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {entry.uniqueCountries || 0}
                      </td>

                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'right',
                        fontWeight: leaderboardSortBy === 'co2' ? '700' : '500',
                        fontSize: '12px',
                        color: leaderboardSortBy === 'co2' ? '#047857' : '#64748b',
                        background: leaderboardSortBy === 'co2' ? 'rgba(236, 253, 245, 0.5)' : 'transparent',
                        borderRadius: '0 10px 10px 0',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {((entry.totalCO2 || 0) / 1000).toFixed(1)}t
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with opt-in prompt for non-participants */}
        {!contestOptIn && authUser && !contestLoading && (
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #eee',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 12px 0' }}>
              Want to join the competition?
            </p>
            <button
              onClick={async () => {
                await handleContestOptInToggle(true);
                fetchLeaderboard();
              }}
              disabled={contestLoading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: contestLoading ? 'wait' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Trophy size={18} />
              Opt In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardModal;
