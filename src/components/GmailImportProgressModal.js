import React from 'react';
import { Loader2 } from 'lucide-react';
import { modalOverlay, modalContent } from '../styles/constants';

const GmailImportProgressModal = ({ importProgress }) => {
  return (
    <div style={modalOverlay}>
      <div style={{
        ...modalContent,
        maxWidth: '450px',
        textAlign: 'center'
      }}>
        <div style={{marginBottom: '25px'}}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 0 rgba(66, 133, 244, 0.4)'
          }}>
            <Loader2 size={28} color="#fff" className="animate-spin" />
          </div>
          <h2 style={{margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600'}}>
            {importProgress.phase === 'searching' ? 'Searching Gmail...' : 'Analyzing Emails...'}
          </h2>
          <p style={{margin: 0, color: '#666', fontSize: '14px'}}>
            {importProgress.currentQueryText}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: '#f0f0f0',
          borderRadius: '10px',
          height: '12px',
          overflow: 'hidden',
          marginBottom: '15px'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #4285F4 0%, #34A853 100%)',
            height: '100%',
            borderRadius: '10px',
            transition: 'width 0.3s ease',
            width: importProgress.phase === 'searching'
              ? `${(importProgress.currentQuery / importProgress.totalQueries) * 100}%`
              : `${importProgress.totalEmails > 0 ? (importProgress.currentEmail / importProgress.totalEmails) * 100 : 0}%`
          }} />
        </div>

        {/* Progress Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: '#f8f9fa',
            padding: '12px',
            borderRadius: '10px'
          }}>
            <div style={{fontSize: '24px', fontWeight: '700', color: '#4285F4'}}>
              {importProgress.phase === 'searching'
                ? `${importProgress.currentQuery}/${importProgress.totalQueries}`
                : `${importProgress.currentEmail}/${importProgress.totalEmails}`
              }
            </div>
            <div style={{fontSize: '11px', color: '#666', marginTop: '4px'}}>
              {importProgress.phase === 'searching' ? 'Queries' : 'Emails'}
            </div>
          </div>
          <div style={{
            background: '#f0fdf4',
            padding: '12px',
            borderRadius: '10px'
          }}>
            <div style={{fontSize: '24px', fontWeight: '700', color: '#16a34a'}}>
              {importProgress.foundFlights}
            </div>
            <div style={{fontSize: '11px', color: '#666', marginTop: '4px'}}>
              Flights Found
            </div>
          </div>
        </div>

        {/* Percentage */}
        <div style={{
          fontSize: '13px',
          color: '#999'
        }}>
          {importProgress.phase === 'searching'
            ? `${Math.round((importProgress.currentQuery / importProgress.totalQueries) * 100)}% complete`
            : importProgress.totalEmails > 0
              ? `${Math.round((importProgress.currentEmail / importProgress.totalEmails) * 100)}% complete`
              : 'Starting...'
          }
        </div>
      </div>
    </div>
  );
};

export default GmailImportProgressModal;
