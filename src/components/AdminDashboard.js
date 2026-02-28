import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Search, Trash2, Shield, ShieldOff, Ban, CheckCircle,
  Loader2, User, BarChart3, Plane,
  AlertTriangle, RefreshCw, Download, Calendar
} from 'lucide-react';
import {
  collection, getDocs, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateUserStats } from '../utils/flights';

const ADMIN_EMAIL = 'simone.marras@gmail.com';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n, digits = 0) =>
  typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : '—';

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(); } catch { return '—'; }
};

const pill = (label, color) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: '600',
    background: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`
  }}>
    {label}
  </span>
);

// ─── sub-components ─────────────────────────────────────────────────────────

const StatBox = ({ label, value, color }) => (
  <div style={{
    background: '#fff',
    border: `1px solid ${color}22`,
    borderLeft: `4px solid ${color}`,
    borderRadius: '10px',
    padding: '14px 18px',
    flex: '1 1 160px'
  }}>
    <div style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{label}</div>
  </div>
);

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
  }}>
    <div style={{
      background: '#fff', borderRadius: '14px', padding: '28px 32px',
      maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <AlertTriangle size={24} color="#ef4444" />
        <span style={{ fontWeight: '700', fontSize: '16px' }}>Confirm Action</span>
      </div>
      <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>{message}</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          padding: '8px 18px', borderRadius: '8px', border: '1px solid #d1d5db',
          background: '#fff', cursor: 'pointer', fontSize: '13px'
        }}>Cancel</button>
        <button onClick={onConfirm} style={{
          padding: '8px 18px', borderRadius: '8px', border: 'none',
          background: '#ef4444', color: '#fff', cursor: 'pointer',
          fontSize: '13px', fontWeight: '600'
        }}>Confirm</button>
      </div>
    </div>
  </div>
);

// ─── User detail drawer ──────────────────────────────────────────────────────

// ─── Main AdminDashboard ─────────────────────────────────────────────────────

const AdminDashboard = ({ authUser, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | blocked | admin
  const [expandedUser, setExpandedUser] = useState(null);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const [actionLoading, setActionLoading] = useState(null); // uid of user being acted on
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch all users ──────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      // Enrich stats
      const enriched = list.map(u => ({
        ...u,
        _stats: calculateUserStats(u.flights || [])
      }));
      setUsers(enriched);
    } catch (err) {
      console.error('Admin: failed to fetch users', err);
      showToast('Failed to load users: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const updateUser = async (uid, data) => {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, data);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...data } : u));
  };

  const handleBlock = (uid, currentlyBlocked) => {
    const action = currentlyBlocked ? 'unblock' : 'block';
    setConfirm({
      message: `Are you sure you want to ${action} this user? ${!currentlyBlocked ? 'They will be signed out immediately.' : ''}`,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(uid);
        try {
          await updateUser(uid, {
            blocked: !currentlyBlocked,
            blockedAt: !currentlyBlocked ? new Date().toISOString() : null,
            blockedBy: !currentlyBlocked ? authUser.uid : null
          });
          showToast(`User ${action}ed successfully.`);
        } catch (err) {
          showToast('Action failed: ' + err.message, 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleDelete = (uid, email) => {
    setConfirm({
      message: `Permanently delete user "${email}"? This will remove all their Firestore data. Firebase Auth account will remain but the user cannot use the app. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(uid);
        try {
          await deleteDoc(doc(db, 'users', uid));
          // Also remove from publicStats if present
          try { await deleteDoc(doc(db, 'publicStats', uid)); } catch (_) {}
          setUsers(prev => prev.filter(u => u.uid !== uid));
          showToast('User deleted.');
          if (expandedUser?.uid === uid) setExpandedUser(null);
        } catch (err) {
          showToast('Delete failed: ' + err.message, 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleToggleAdmin = (uid, email, isCurrentlyAdmin) => {
    if (email === ADMIN_EMAIL && isCurrentlyAdmin) {
      showToast('Cannot remove admin from the primary admin account.', 'error');
      return;
    }
    const action = isCurrentlyAdmin ? 'revoke admin from' : 'grant admin to';
    setConfirm({
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} "${email}"?`,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(uid);
        try {
          await updateUser(uid, { isAdmin: !isCurrentlyAdmin });
          showToast(`Admin ${isCurrentlyAdmin ? 'revoked' : 'granted'} successfully.`);
        } catch (err) {
          showToast('Action failed: ' + err.message, 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // ── Sort / Filter ────────────────────────────────────────────────────────

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.email || '').toLowerCase().includes(q) || (u.nickname || '').toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'blocked' ? !!u.blocked :
      statusFilter === 'admin' ? !!u.isAdmin :
      !u.blocked;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    let va, vb;
    if (sortField === 'email') { va = a.email || ''; vb = b.email || ''; }
    else if (sortField === 'flights') { va = a._stats.totalFlights; vb = b._stats.totalFlights; }
    else if (sortField === 'miles') { va = a._stats.totalMiles; vb = b._stats.totalMiles; }
    else if (sortField === 'countries') { va = a._stats.uniqueCountries; vb = b._stats.uniqueCountries; }
    else { va = a.createdAt || ''; vb = b.createdAt || ''; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // ── System summary ───────────────────────────────────────────────────────

  const totalFlights = users.reduce((s, u) => s + (u._stats?.totalFlights || 0), 0);
  const totalMiles = users.reduce((s, u) => s + (u._stats?.totalMiles || 0), 0);
  const blockedCount = users.filter(u => u.blocked).length;
  const adminCount = users.filter(u => u.isAdmin).length;

  // ── Sort header helper ───────────────────────────────────────────────────

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ color: '#cbd5e1', marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: '#6366f1', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thStyle = (field) => ({
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid #e2e8f0',
    background: '#f8fafc'
  });

  // ── Export CSV ───────────────────────────────────────────────────────────

  const exportCsv = () => {
    const header = ['Email', 'Nickname', 'Joined', 'Flights', 'Miles', 'Countries', 'Airports', 'CO2_kg', 'Blocked', 'Admin', 'ContestOptIn'];
    const rows = users.map(u => [
      u.email || '',
      u.nickname || '',
      fmtDate(u.createdAt),
      u._stats.totalFlights,
      Math.round(u._stats.totalMiles),
      u._stats.uniqueCountries,
      u._stats.uniqueAirports,
      u._stats.totalCO2,
      u.blocked ? 'yes' : 'no',
      u.isAdmin ? 'yes' : 'no',
      u.contestOptIn ? 'yes' : 'no'
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flightlog-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 8000, overflowY: 'auto'
      }}>
        <div style={{
          minHeight: '100vh', padding: '24px',
          display: 'flex', flexDirection: 'column', alignItems: 'stretch'
        }}>
          <div style={{
            background: '#f1f5f9', borderRadius: '16px',
            maxWidth: '1100px', margin: '0 auto', width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* ─── Header ─── */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '24px 28px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(99,102,241,0.3)', borderRadius: '10px',
                  padding: '8px', display: 'flex'
                }}>
                  <Shield size={22} color="#a5b4fc" />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '700' }}>Admin Dashboard</h2>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Logged in as {authUser?.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={exportCsv} title="Export CSV" style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0', borderRadius: '8px', padding: '8px 14px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px'
                }}>
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={fetchUsers} title="Refresh" style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex'
                }}>
                  <RefreshCw size={16} />
                </button>
                <button onClick={onClose} style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex'
                }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ─── Summary stats ─── */}
            <div style={{ padding: '20px 28px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <StatBox label="Total Users" value={fmt(users.length)} color="#6366f1" />
              <StatBox label="Active Users" value={fmt(users.length - blockedCount)} color="#10b981" />
              <StatBox label="Blocked" value={fmt(blockedCount)} color="#ef4444" />
              <StatBox label="Admins" value={fmt(adminCount)} color="#f59e0b" />
              <StatBox label="Total Flights Logged" value={fmt(totalFlights)} color="#3b82f6" />
              <StatBox label="Total Miles" value={fmt(Math.round(totalMiles / 1000)) + 'k'} color="#8b5cf6" />
            </div>

            {/* ─── Filters ─── */}
            <div style={{
              padding: '0 28px 20px',
              display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center'
            }}>
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by email or nickname…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px 9px 34px',
                    border: '1px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '13px', outline: 'none', background: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {['all', 'active', 'blocked', 'admin'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', border: '1px solid',
                  borderColor: statusFilter === f ? '#6366f1' : '#e2e8f0',
                  background: statusFilter === f ? '#6366f1' : '#fff',
                  color: statusFilter === f ? '#fff' : '#475569',
                  textTransform: 'capitalize'
                }}>{f}</button>
              ))}
              <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>
                {filtered.length} of {users.length} users
              </span>
            </div>

            {/* ─── Table ─── */}
            <div style={{ overflowX: 'auto', padding: '0 28px 28px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                  <Loader2 size={30} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '12px' }}>Loading users…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  <User size={40} style={{ opacity: 0.3 }} />
                  <p style={{ marginTop: '12px' }}>No users found.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <thead>
                    <tr>
                      <th style={thStyle('email')} onClick={() => toggleSort('email')}>
                        User <SortIcon field="email" />
                      </th>
                      <th style={thStyle('createdAt')} onClick={() => toggleSort('createdAt')}>
                        Joined <SortIcon field="createdAt" />
                      </th>
                      <th style={thStyle('flights')} onClick={() => toggleSort('flights')}>
                        Flights <SortIcon field="flights" />
                      </th>
                      <th style={thStyle('miles')} onClick={() => toggleSort('miles')}>
                        Miles <SortIcon field="miles" />
                      </th>
                      <th style={thStyle('countries')} onClick={() => toggleSort('countries')}>
                        Countries <SortIcon field="countries" />
                      </th>
                      <th style={{ ...thStyle(null), cursor: 'default' }}>Status</th>
                      <th style={{ ...thStyle(null), cursor: 'default' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, idx) => {
                      const isActing = actionLoading === u.uid;
                      const isSelf = u.uid === authUser?.uid;
                      return (
                        <React.Fragment key={u.uid}>
                          <tr style={{
                            background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                            borderBottom: '1px solid #f1f5f9',
                            opacity: isActing ? 0.6 : 1,
                            transition: 'background 0.15s'
                          }}>
                            {/* User cell */}
                            <td style={{ padding: '12px', minWidth: '200px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '34px', height: '34px', borderRadius: '50%',
                                  background: u.isAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0
                                }}>
                                  {(u.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>
                                    {u.email || '(no email)'}
                                    {isSelf && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#6366f1', fontWeight: '600' }}>YOU</span>}
                                  </div>
                                  {u.nickname && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{u.nickname}</div>}
                                </div>
                              </div>
                            </td>

                            {/* Joined */}
                            <td style={{ padding: '12px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} color="#94a3b8" />
                                {fmtDate(u.createdAt)}
                              </div>
                            </td>

                            {/* Flights */}
                            <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Plane size={12} color="#6366f1" />
                                {fmt(u._stats.totalFlights)}
                              </div>
                            </td>

                            {/* Miles */}
                            <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>
                              {fmt(Math.round(u._stats.totalMiles))}
                            </td>

                            {/* Countries */}
                            <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>
                              {fmt(u._stats.uniqueCountries)}
                            </td>

                            {/* Status pills */}
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {u.blocked
                                  ? pill('Blocked', { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' })
                                  : pill('Active', { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' })}
                                {u.isAdmin && pill('Admin', { bg: '#fffbeb', text: '#d97706', border: '#fde68a' })}
                                {u.contestOptIn && pill('Contest', { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' })}
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {/* View detail */}
                                <button
                                  onClick={() => setExpandedUser(expandedUser?.uid === u.uid ? null : u)}
                                  title="View details"
                                  style={{
                                    padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0',
                                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    gap: '4px', fontSize: '12px', color: '#475569'
                                  }}
                                >
                                  <BarChart3 size={13} />
                                  {expandedUser?.uid === u.uid ? 'Hide' : 'View'}
                                </button>

                                {/* Block / unblock — protect self */}
                                {!isSelf && (
                                  <button
                                    disabled={isActing}
                                    onClick={() => handleBlock(u.uid, !!u.blocked)}
                                    title={u.blocked ? 'Unblock user' : 'Block user'}
                                    style={{
                                      padding: '6px 10px', borderRadius: '6px', border: '1px solid',
                                      borderColor: u.blocked ? '#bbf7d0' : '#fecaca',
                                      background: u.blocked ? '#f0fdf4' : '#fff8f8',
                                      cursor: isActing ? 'wait' : 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '4px',
                                      fontSize: '12px',
                                      color: u.blocked ? '#16a34a' : '#dc2626'
                                    }}
                                  >
                                    {u.blocked ? <CheckCircle size={13} /> : <Ban size={13} />}
                                    {u.blocked ? 'Unblock' : 'Block'}
                                  </button>
                                )}

                                {/* Admin toggle — protect primary admin */}
                                {!isSelf && u.email !== ADMIN_EMAIL && (
                                  <button
                                    disabled={isActing}
                                    onClick={() => handleToggleAdmin(u.uid, u.email, !!u.isAdmin)}
                                    title={u.isAdmin ? 'Revoke admin' : 'Grant admin'}
                                    style={{
                                      padding: '6px 10px', borderRadius: '6px', border: '1px solid',
                                      borderColor: u.isAdmin ? '#fde68a' : '#e2e8f0',
                                      background: u.isAdmin ? '#fffbeb' : '#fff',
                                      cursor: isActing ? 'wait' : 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '4px',
                                      fontSize: '12px',
                                      color: u.isAdmin ? '#d97706' : '#64748b'
                                    }}
                                  >
                                    {u.isAdmin ? <ShieldOff size={13} /> : <Shield size={13} />}
                                    {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                                  </button>
                                )}

                                {/* Delete — protect self and primary admin */}
                                {!isSelf && u.email !== ADMIN_EMAIL && (
                                  <button
                                    disabled={isActing}
                                    onClick={() => handleDelete(u.uid, u.email)}
                                    title="Delete user"
                                    style={{
                                      padding: '6px 10px', borderRadius: '6px', border: '1px solid #fecaca',
                                      background: '#fff8f8', cursor: isActing ? 'wait' : 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '4px',
                                      fontSize: '12px', color: '#dc2626'
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {expandedUser?.uid === u.uid && (
                            <tr>
                              <td colSpan={7} style={{ padding: 0, background: '#f8fafc' }}>
                                {/* The drawer rendered inline */}
                                <div style={{ padding: '20px 28px', borderTop: '2px solid #6366f133' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
                                    {/* Account info */}
                                    <div>
                                      <h5 style={{ margin: '0 0 8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Account</h5>
                                      {[
                                        ['UID', u.uid.slice(0, 16) + '…'],
                                        ['Joined', fmtDate(u.createdAt)],
                                        ['Contest', u.contestOptIn ? '✅ Opted in' : '❌ Opted out'],
                                        ['Matching', u.flightMatchingOptIn ? '✅ Enabled' : '❌ Disabled'],
                                        ['Blocked', u.blocked ? `Yes (${fmtDate(u.blockedAt)})` : 'No'],
                                      ].map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                                          <span style={{ color: '#94a3b8', minWidth: '70px' }}>{k}</span>
                                          <span style={{ fontWeight: '500' }}>{v}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Stats */}
                                    <div>
                                      <h5 style={{ margin: '0 0 8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Travel Stats</h5>
                                      {[
                                        ['Flights', fmt(u._stats.totalFlights)],
                                        ['Miles', fmt(u._stats.totalMiles)],
                                        ['Countries', fmt(u._stats.uniqueCountries)],
                                        ['Airports', fmt(u._stats.uniqueAirports)],
                                        ['CO₂ (kg)', fmt(u._stats.totalCO2)],
                                      ].map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                                          <span style={{ color: '#94a3b8', minWidth: '70px' }}>{k}</span>
                                          <span style={{ fontWeight: '600' }}>{v}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Recent flights */}
                                    <div>
                                      <h5 style={{ margin: '0 0 8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Recent Flights ({(u.flights || []).length})</h5>
                                      <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {(u.flights || []).length === 0 ? (
                                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>None</span>
                                        ) : [...(u.flights || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 8).map((f, i) => (
                                          <div key={f.id || i} style={{ fontSize: '11px', background: '#fff', borderRadius: '6px', padding: '5px 8px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontWeight: '600' }}>{f.origin}→{f.destination}</span>
                                            <span style={{ color: '#94a3b8', marginLeft: '6px' }}>{fmtDate(f.date)}</span>
                                          </div>
                                        ))}
                                        {(u.flights || []).length > 8 && (
                                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>…and {(u.flights || []).length - 8} more</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff', padding: '12px 20px', borderRadius: '10px',
          fontSize: '13px', fontWeight: '600', zIndex: 99999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* CSS keyframe for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default AdminDashboard;
