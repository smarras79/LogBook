import React from 'react';
import { X, AlertCircle, Trash2, Check } from 'lucide-react';
import { modalOverlay, modalContent } from '../styles/constants';
import { formatDate } from '../utils/formatters';

const ImportSuggestionsModal = ({
  suggestedFlights,
  setSuggestedFlights,
  setShowImport,
  handleDeleteSuggestion,
  handleSaveOrImport
}) => {
  return (
    <div style={modalOverlay}>
      <div style={{...modalContent, maxWidth: '650px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2 style={{margin: 0}}>Flights Found ({suggestedFlights.length})</h2>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            {suggestedFlights.length > 0 && (
              <>
                <button
                  onClick={() => setSuggestedFlights([])}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #fecaca',
                    background: '#fff',
                    color: '#dc2626',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Clear All
                </button>
              </>
            )}
            <X style={{cursor:'pointer'}} onClick={() => setShowImport(false)}/>
          </div>
        </div>
        {suggestedFlights.length === 0 ? (
          <div style={{textAlign:'center', padding:'30px', color:'#666'}}>
            <AlertCircle size={40} style={{marginBottom:'15px', color:'#ccc'}}/>
            <p style={{fontWeight:'500', marginBottom:'10px'}}>No flight emails found</p>
            <p style={{fontSize:'13px', color:'#999', lineHeight:'1.5'}}>
              We searched your Gmail using multiple queries:<br/>
              • Gmail's reservation category<br/>
              • Flight confirmation keywords<br/>
              • Emails from known airline domains<br/><br/>
              <strong>Tip:</strong> Open browser console (F12) to see detailed search logs.
            </p>
          </div>
        ) : (
          <div style={{maxHeight: '450px', overflowY: 'auto'}}>
            {suggestedFlights.map(f => (
              <div key={f.id} style={{
                padding:'15px',
                borderBottom:'1px solid #eee',
                display:'flex',
                justifyContent:'space-between',
                alignItems:'flex-start',
                gap:'12px',
                background: f.isRoundTrip ? '#f0fdf4' : 'transparent'
              }}>
                <div style={{flex: 1}}>
                  <div style={{fontWeight:'bold', fontSize:'16px', marginBottom:'4px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {f.isRoundTrip ? (
                      <>
                        {f.origin} ⇄ {f.destination}
                        <span style={{
                          fontSize: '10px',
                          background: '#16a34a',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: '600'
                        }}>
                          Round Trip
                        </span>
                      </>
                    ) : (
                      <>{f.origin} → {f.destination}</>
                    )}
                  </div>
                  <div style={{fontSize:'13px', color:'#555', marginBottom:'6px'}}>
                    {f.isRoundTrip ? (
                      <>
                        <span>Outbound: {formatDate(f.date)}</span>
                        <span style={{marginLeft: '12px'}}>Return: {formatDate(f.returnDate)}</span>
                      </>
                    ) : (
                      formatDate(f.date)
                    )}
                    {f.flightNumber && !f.isRoundTrip && <span style={{marginLeft:'10px', fontWeight:'500'}}>✈ {f.flightNumber}</span>}
                  </div>
                  <div style={{display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center'}}>
                    {f.airline && (
                      <span style={{
                        fontSize:'11px',
                        background:'#e8f4fd',
                        color:'#1e3a5f',
                        padding:'2px 8px',
                        borderRadius:'10px'
                      }}>
                        {f.airline}
                      </span>
                    )}
                    {f.confirmationNumber && (
                      <span style={{
                        fontSize:'11px',
                        background:'#fef2f2',
                        color:'#991b1b',
                        padding:'2px 8px',
                        borderRadius:'10px'
                      }}>
                        PNR: {f.confirmationNumber}
                      </span>
                    )}
                    {f.source === 'json-ld' && (
                      <span style={{
                        fontSize:'10px',
                        background:'#dcfce7',
                        color:'#166534',
                        padding:'2px 6px',
                        borderRadius:'8px'
                      }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                  <button
                    onClick={() => handleDeleteSuggestion(f.id)}
                    title="Remove from list"
                    style={{
                      background: '#fff',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor:'pointer',
                      display:'flex',
                      alignItems:'center',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#fef2f2';
                      e.currentTarget.style.borderColor = '#dc2626';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => handleSaveOrImport(f, true)}
                    style={{
                      background: f.isRoundTrip ? '#16a34a' : '#00C851',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor:'pointer',
                      display:'flex',
                      alignItems:'center',
                      gap:'6px',
                      fontWeight:'500',
                      whiteSpace:'nowrap'
                    }}
                  >
                    <Check size={16} /> {f.isRoundTrip ? 'Add Both' : 'Add'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:'15px', paddingTop:'15px', borderTop:'1px solid #eee', fontSize:'11px', color:'#999', textAlign:'center'}}>
          Searched using multiple Gmail queries. "Verified" = extracted from structured email data (JSON-LD).
        </div>
      </div>
    </div>
  );
};

export default ImportSuggestionsModal;
