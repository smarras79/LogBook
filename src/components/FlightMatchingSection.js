import React from 'react';
import { Users, User, Plane, MapPin, Heart, MessageCircle } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const FlightMatchingSection = ({
  authUser,
  flightMatchingOptIn, handleFlightMatchingToggle,
  fellowPassengers, favoritePassengers,
  showFellowPassengers, setShowFellowPassengers,
  toggleFavoritePassenger, openChat,
}) => {
  return (
    <>
      {/* Flight Matching Opt-in Banner */}
      {authUser && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #86efac',
          borderRadius: '12px',
          padding: '12px 20px',
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              position: 'relative',
              cursor: flightMatchingOptIn && fellowPassengers.length > 0 ? 'pointer' : 'default'
            }}
            onMouseEnter={() => {
              console.log('Mouse entered banner. Opted in:', flightMatchingOptIn, 'Fellow passengers:', fellowPassengers.length);
              if (flightMatchingOptIn && fellowPassengers.length > 0) {
                console.log('Showing fellow passengers popup');
                setShowFellowPassengers(true);
              }
            }}
            onMouseLeave={() => {
              console.log('Mouse left banner');
              setShowFellowPassengers(false);
            }}
          >
            <Users size={20} color={flightMatchingOptIn ? '#16a34a' : '#94a3b8'} />
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
              {flightMatchingOptIn ? `👥 Finding Fellow Passengers ${fellowPassengers.length > 0 ? `(${fellowPassengers.length} shared flights found)` : ''}` : 'Fellow Passenger Finder'}
            </span>
            {!flightMatchingOptIn && (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                — See who else was on your flights
              </span>
            )}

            {/* Fellow Passengers Popup */}
            {showFellowPassengers && fellowPassengers.length > 0 && (
              <div
                onMouseEnter={() => setShowFellowPassengers(true)}
                onMouseLeave={() => setShowFellowPassengers(false)}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '16px',
                  zIndex: 1000,
                  minWidth: '340px',
                  maxWidth: '420px',
                  maxHeight: '450px',
                  overflowY: 'auto'
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '12px',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '8px'
                }}>
                  Fellow Passengers
                </div>
                {/* Sort: favorites first */}
                {[...fellowPassengers].filter(p => String(p.uid) !== String(authUser?.uid)).sort((a, b) => {
                  const aFav = favoritePassengers.includes(a.uid) ? 0 : 1;
                  const bFav = favoritePassengers.includes(b.uid) ? 0 : 1;
                  return aFav - bFav;
                }).map((passenger, idx) => {
                  const isFav = favoritePassengers.includes(passenger.uid);
                  return (
                    <div key={`${passenger.uid}-${passenger.flightNumber}-${idx}`} style={{
                      padding: '12px',
                      background: isFav ? '#fef2f2' : '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      border: isFav ? '1px solid #fca5a5' : '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} color="#16a34a" />
                          {passenger.nickname || 'Anonymous Traveler'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Heart
                            size={16}
                            fill={isFav ? '#ef4444' : 'none'}
                            color={isFav ? '#ef4444' : '#94a3b8'}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                            onClick={(e) => { e.stopPropagation(); toggleFavoritePassenger(passenger.uid); }}
                          />
                          <MessageCircle
                            size={16}
                            color="#3b82f6"
                            style={{ cursor: 'pointer' }}
                            title={`Chat with ${passenger.nickname || 'this passenger'}`}
                            onClick={(e) => { e.stopPropagation(); openChat(passenger); }}
                          />
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Plane size={12} />
                          <span style={{ fontWeight: '600' }}>{passenger.flightNumber}</span>
                          {passenger.airline && <span>({passenger.airline})</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={12} />
                          <span>{passenger.origin} → {passenger.destination}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {formatDate(passenger.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '6px 12px',
            background: flightMatchingOptIn ? '#fff' : '#f1f5f9',
            borderRadius: '8px',
            border: flightMatchingOptIn ? '1px solid #16a34a' : '1px solid #e2e8f0',
            fontSize: '13px',
            fontWeight: '600',
            color: flightMatchingOptIn ? '#166534' : '#475569'
          }}>
            <input
              type="checkbox"
              checked={flightMatchingOptIn}
              onChange={(e) => handleFlightMatchingToggle(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: '#16a34a'
              }}
            />
            {flightMatchingOptIn ? 'Opted In' : 'Opt In'}
          </label>
        </div>
      )}
    </>
  );
};

export default FlightMatchingSection;
