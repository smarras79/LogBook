import React from 'react';
import { Plane, Plus, Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LandingPage = ({
  handleStartAddingFlights,
  setShowLanding,
  openAuthModal,
  showAuthModal,
  setShowAuthModal,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  showPassword,
  setShowPassword,
  handleAuthSubmit
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
      padding: '20px'
    }}>
      {/* Logo and Title */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        {/* Logo Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '30px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            right: '-20px',
            bottom: '-20px',
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }} />
          <Plane size={56} color="#fff" style={{ transform: 'rotate(-30deg)' }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          margin: '0 0 8px 0',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          FlightLog
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          Track your journeys across the sky
        </p>

        {/* Beta Badge */}
        <span style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: '700',
          padding: '4px 12px',
          borderRadius: '20px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Beta
        </span>
      </div>

      {/* Features */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '16px',
        marginBottom: '40px',
        maxWidth: '600px'
      }}>
        {[
          { icon: '✈️', text: 'Log all your flights' },
          { icon: '🌍', text: 'Track countries & continents' },
          { icon: '📊', text: 'View travel statistics' },
          { icon: '🏆', text: 'Compete on leaderboards' },
          { icon: '🌱', text: 'Monitor carbon footprint' },
          { icon: '📧', text: 'Import from Gmail' }
        ].map((feature, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fff',
            padding: '10px 16px',
            borderRadius: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            fontSize: '14px',
            color: '#475569'
          }}>
            <span style={{ fontSize: '16px' }}>{feature.icon}</span>
            {feature.text}
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleStartAddingFlights}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          border: 'none',
          padding: '18px 48px',
          borderRadius: '16px',
          fontSize: '18px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 14px 50px rgba(16, 185, 129, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 40px rgba(16, 185, 129, 0.4)';
        }}
      >
        <Plus size={22} />
        Start Adding Your Flights
      </button>

      {/* Free signup note */}
      <p style={{
        marginTop: '20px',
        fontSize: '14px',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Check size={16} color="#10b981" />
        <strong style={{ color: '#10b981' }}>100% FREE</strong> to sign up and track unlimited flights
      </p>

      {/* Already have account link */}
      <button
        onClick={() => {
          localStorage.setItem('landingDismissed', 'true');
          setShowLanding(false);
          openAuthModal('login');
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#6366f1',
          fontSize: '14px',
          cursor: 'pointer',
          marginTop: '16px',
          textDecoration: 'underline'
        }}
      >
        Already have an account? Log in
      </button>

      {/* Skip for now */}
      <button
        onClick={() => {
          localStorage.setItem('landingDismissed', 'true');
          setShowLanding(false);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          fontSize: '13px',
          cursor: 'pointer',
          marginTop: '12px'
        }}
      >
        Continue without account
      </button>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            margin: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>{authMode === 'login' ? 'Welcome Back' : 'Create Free Account'}</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowAuthModal(false)} />
            </div>

            {authMode === 'signup' && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#166534'
              }}>
                <Check size={16} />
                Free forever • Unlimited flights • Full features
              </div>
            )}

            {authError && (
              <div style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}>
                <AlertCircle size={18} />
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              <input
                type="email"
                placeholder="Email address"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    paddingRight: '50px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {authMode === 'login' ? 'Log In' : 'Create Free Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {authMode === 'login' ? 'Sign up free' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
