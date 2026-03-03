import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api';

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  navy:    '#1a237e',
  blue:    '#1565c0',
  teal:    '#00838f',
  light:   '#e3f2fd',
  white:   '#ffffff',
  grey:    '#f5f7fa',
  text:    '#1a1a2e',
  muted:   '#607d8b',
  success: '#2e7d32',
  danger:  '#c62828',
  warn:    '#e65100',
};

const styles = {
  app:      { fontFamily: "'Segoe UI', sans-serif", background: C.grey, minHeight: '100vh', color: C.text },
  header:   { background: `linear-gradient(135deg, ${C.navy} 0%, ${C.teal} 100%)`, color: C.white, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' },
  logo:     { fontSize: 22, fontWeight: 700, letterSpacing: 1 },
  badge:    (col) => ({ background: col, color: C.white, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }),
  main:     { maxWidth: 1100, margin: '0 auto', padding: 24 },
  card:     { background: C.white, borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20 },
  h2:       { margin: '0 0 16px', fontSize: 18, color: C.navy, borderBottom: `2px solid ${C.light}`, paddingBottom: 8 },
  row:      { display: 'flex', gap: 16, flexWrap: 'wrap' },
  col:      { flex: 1, minWidth: 260 },
  input:    { width: '100%', padding: '10px 12px', border: `1px solid #cdd`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 10 },
  select:   { width: '100%', padding: '10px 12px', border: `1px solid #cdd`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 10 },
  btn:      (col = C.blue) => ({ background: col, color: C.white, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14, marginRight: 8, marginTop: 4 }),
  tag:      (t) => {
    const map = { diagnosis: '#7b1fa2', prescription: '#1565c0', lab_report: '#2e7d32' };
    return { background: map[t] || '#555', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 };
  },
  record:   { background: C.light, borderRadius: 8, padding: 14, marginBottom: 10, borderLeft: `4px solid ${C.teal}` },
  alert:    (ok) => ({ background: ok ? '#e8f5e9' : '#ffebee', color: ok ? C.success : C.danger, padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 14 }),
  tab:      (active) => ({ padding: '10px 20px', border: 'none', borderBottom: active ? `3px solid ${C.blue}` : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: active ? 700 : 400, color: active ? C.blue : C.muted, fontSize: 15 }),
  stat:     { textAlign: 'center', padding: 16 },
  statNum:  { fontSize: 36, fontWeight: 800, color: C.teal },
  statLbl:  { fontSize: 13, color: C.muted, marginTop: 4 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const call = async (method, path, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

const roleLabel = (r) => ({ none: 'None', patient: 'Patient', doctor: 'Doctor', admin: 'Admin' }[r] || r);
const roleColor = (r) => ({ patient: C.teal, doctor: C.navy, admin: C.warn }[r] || C.muted);

// ─── Components ───────────────────────────────────────────────────────────────
function Alert({ msg, ok = true }) {
  if (!msg) return null;
  return <div style={styles.alert(ok)}>{ok ? '✅' : '❌'} {msg}</div>;
}

function RecordCard({ rec }) {
  return (
    <div style={styles.record}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={styles.tag(rec.recordType)}>{rec.recordType.replace('_', ' ')}</span>
        <span style={{ fontSize: 12, color: C.muted }}>{new Date(rec.timestamp).toLocaleDateString()}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>ID #{rec.id}</span>
      </div>
      <div style={{ fontSize: 14, marginBottom: 4 }}>{rec.description}</div>
      <div style={{ fontSize: 11, color: C.muted }}>IPFS: {rec.ipfsHash} | By: {rec.createdBy.slice(0, 10)}…</div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState('dashboard');
  const [health, setHealth]     = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [msg, setMsg]           = useState({ text: '', ok: true });

  // Forms
  const [regWallet, setRegWallet] = useState('');
  const [regName, setRegName]     = useState('');
  const [regRole, setRegRole]     = useState('patient');

  const [recPatient, setRecPatient]   = useState('');
  const [recCaller, setRecCaller]     = useState('');
  const [recType, setRecType]         = useState('diagnosis');
  const [recHash, setRecHash]         = useState('');
  const [recDesc, setRecDesc]         = useState('');

  const [viewPatient, setViewPatient] = useState('');
  const [viewCaller, setViewCaller]   = useState('');
  const [records, setRecords]         = useState([]);

  const [accPatient, setAccPatient]   = useState('');
  const [accAccessor, setAccAccessor] = useState('');
  const [accessResult, setAccessResult] = useState(null);

  const notify = (text, ok = true) => setMsg({ text, ok });

  const loadHealth = useCallback(async () => {
    try {
      const h = await call('GET', '/health');
      setHealth(h);
      const a = await call('GET', '/blockchain/accounts');
      setAccounts(a.accounts || []);
    } catch { /* backend not running */ }
  }, []);

  useEffect(() => { loadHealth(); }, [loadHealth]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    const res = await call('POST', '/users/register', { wallet: regWallet, name: regName, role: regRole });
    notify(res.message || res.error, !res.error);
  };

  const handleAddRecord = async () => {
    const res = await call('POST', '/records', {
      patientAddress: recPatient, callerAddress: recCaller,
      recordType: recType, ipfsHash: recHash || `QmHash${Date.now()}`, description: recDesc
    });
    notify(res.message || res.error, !res.error);
  };

  const handleViewRecords = async () => {
    const res = await call('GET', `/records/${viewPatient}?caller=${viewCaller}`);
    if (res.error) { notify(res.error, false); return; }
    setRecords(res.records || []);
    notify(`${res.records.length} record(s) fetched`, true);
  };

  const handleGrantAccess = async () => {
    const res = await call('POST', '/access/grant', { patientAddress: accPatient, accessorAddress: accAccessor });
    notify(res.message || res.error, !res.error);
  };

  const handleRevokeAccess = async () => {
    const res = await call('POST', '/access/revoke', { patientAddress: accPatient, accessorAddress: accAccessor });
    notify(res.message || res.error, !res.error);
  };

  const handleCheckAccess = async () => {
    const res = await call('GET', `/access/check?patient=${accPatient}&accessor=${accAccessor}`);
    if (res.error) { notify(res.error, false); return; }
    setAccessResult(res.hasAccess);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>🏥 Blockchain EHR System</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {health
            ? <span style={styles.badge(C.success)}>● Connected | Block #{health.blockNumber}</span>
            : <span style={styles.badge(C.danger)}>● Offline</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, borderBottom: '1px solid #e0e0e0', paddingLeft: 32 }}>
        {[['dashboard','📊 Dashboard'],['register','👤 Register'],['records','📋 Records'],['access','🔐 Access Control']].map(([id, label]) => (
          <button key={id} style={styles.tab(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={styles.main}>
        <Alert msg={msg.text} ok={msg.ok} />

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          <>
            <div style={styles.card}>
              <div style={styles.h2}>System Overview</div>
              <div style={styles.row}>
                <div style={{...styles.col, ...styles.stat}}>
                  <div style={styles.statNum}>{accounts.length}</div>
                  <div style={styles.statLbl}>Blockchain Accounts</div>
                </div>
                <div style={{...styles.col, ...styles.stat}}>
                  <div style={styles.statNum}>{health?.blockNumber || '—'}</div>
                  <div style={styles.statLbl}>Current Block</div>
                </div>
                <div style={{...styles.col, ...styles.stat}}>
                  <div style={{ ...styles.statNum, fontSize: 16, wordBreak: 'break-all' }}>
                    {health?.contractAddress?.slice(0, 16) || '—'}…
                  </div>
                  <div style={styles.statLbl}>Contract Address</div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.h2}>Available Accounts (Hardhat)</div>
              {accounts.length === 0
                ? <p style={{ color: C.muted }}>Start the backend to see accounts.</p>
                : accounts.map((a, i) => (
                  <div key={a.address} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span><strong>#{i}</strong> {a.address}</span>
                    <span style={{ color: C.teal }}>{a.balance}</span>
                  </div>
                ))}
            </div>

            <div style={styles.card}>
              <div style={styles.h2}>Architecture</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
                {[['🖥️','Frontend','React UI'],['⚙️','Backend','Node.js / Express'],['📜','Contract','Solidity (EHR.sol)'],['⛓️','Blockchain','Hardhat / Ethereum']].map(([ic, t, s]) => (
                  <div key={t} style={{ background: C.light, borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 28 }}>{ic}</div>
                    <div style={{ fontWeight: 700, marginTop: 6 }}>{t}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Register ── */}
        {tab === 'register' && (
          <div style={styles.card}>
            <div style={styles.h2}>Register User (Admin Action)</div>
            <p style={{ color: C.muted, fontSize: 14 }}>Only the contract owner (Admin) can register new users. Use account[0] as the admin.</p>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Wallet Address</label>
                <input style={styles.input} placeholder="0x..." value={regWallet} onChange={e => setRegWallet(e.target.value)} />
                <label style={{ fontSize: 13, fontWeight: 600 }}>Full Name</label>
                <input style={styles.input} placeholder="e.g. Alice Johnson" value={regName} onChange={e => setRegName(e.target.value)} />
                <label style={{ fontSize: 13, fontWeight: 600 }}>Role</label>
                <select style={styles.select} value={regRole} onChange={e => setRegRole(e.target.value)}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
                <button style={styles.btn(C.navy)} onClick={handleRegister}>Register User</button>
              </div>
              <div style={styles.col}>
                <div style={{ background: C.light, borderRadius: 8, padding: 16, fontSize: 13 }}>
                  <strong>Demo Accounts (after deploy):</strong>
                  <br /><br />
                  <span style={styles.badge(C.warn)}>Admin</span> accounts[0]<br /><br />
                  <span style={styles.badge(C.teal)}>Patient</span> accounts[1] → Alice Johnson<br /><br />
                  <span style={styles.badge(C.navy)}>Doctor</span> accounts[2] → Dr. Sharma<br /><br />
                  <span style={styles.badge(C.navy)}>Doctor</span> accounts[3] → Dr. Patel
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Records ── */}
        {tab === 'records' && (
          <>
            <div style={styles.card}>
              <div style={styles.h2}>Add Medical Record</div>
              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Patient Address</label>
                  <input style={styles.input} placeholder="0x..." value={recPatient} onChange={e => setRecPatient(e.target.value)} />
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Your Address (Caller)</label>
                  <input style={styles.input} placeholder="Doctor or Patient address" value={recCaller} onChange={e => setRecCaller(e.target.value)} />
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Record Type</label>
                  <select style={styles.select} value={recType} onChange={e => setRecType(e.target.value)}>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="prescription">Prescription</option>
                    <option value="lab_report">Lab Report</option>
                  </select>
                </div>
                <div style={styles.col}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>IPFS Hash (auto-generated if blank)</label>
                  <input style={styles.input} placeholder="QmABC..." value={recHash} onChange={e => setRecHash(e.target.value)} />
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Description / Notes</label>
                  <textarea style={{ ...styles.input, height: 80, resize: 'vertical' }} placeholder="Medical notes..." value={recDesc} onChange={e => setRecDesc(e.target.value)} />
                  <button style={styles.btn(C.teal)} onClick={handleAddRecord}>Add to Blockchain</button>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.h2}>View Records</div>
              <div style={styles.row}>
                <div style={styles.col}>
                  <input style={styles.input} placeholder="Patient Address (0x...)" value={viewPatient} onChange={e => setViewPatient(e.target.value)} />
                </div>
                <div style={styles.col}>
                  <input style={styles.input} placeholder="Your Address (Caller)" value={viewCaller} onChange={e => setViewCaller(e.target.value)} />
                </div>
              </div>
              <button style={styles.btn(C.navy)} onClick={handleViewRecords}>Fetch Records</button>
              {records.length > 0 && <div style={{ marginTop: 16 }}>{records.map(r => <RecordCard key={r.id} rec={r} />)}</div>}
            </div>
          </>
        )}

        {/* ── Access Control ── */}
        {tab === 'access' && (
          <div style={styles.card}>
            <div style={styles.h2}>🔐 Smart Contract Access Control</div>
            <p style={{ color: C.muted, fontSize: 14 }}>Patients control who can view their records. Only patients can grant/revoke access.</p>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Patient Address</label>
                <input style={styles.input} placeholder="0x... (must be Patient)" value={accPatient} onChange={e => setAccPatient(e.target.value)} />
                <label style={{ fontSize: 13, fontWeight: 600 }}>Doctor / Accessor Address</label>
                <input style={styles.input} placeholder="0x..." value={accAccessor} onChange={e => setAccAccessor(e.target.value)} />
                <div>
                  <button style={styles.btn(C.success)} onClick={handleGrantAccess}>✅ Grant Access</button>
                  <button style={styles.btn(C.danger)} onClick={handleRevokeAccess}>❌ Revoke Access</button>
                  <button style={styles.btn(C.muted)} onClick={handleCheckAccess}>🔍 Check Access</button>
                </div>
                {accessResult !== null && (
                  <div style={{ marginTop: 12, ...styles.alert(accessResult) }}>
                    Access is currently: <strong>{accessResult ? 'GRANTED ✅' : 'DENIED ❌'}</strong>
                  </div>
                )}
              </div>
              <div style={styles.col}>
                <div style={{ background: C.light, borderRadius: 8, padding: 16, fontSize: 13 }}>
                  <strong>How Access Control Works:</strong>
                  <ul style={{ paddingLeft: 16, lineHeight: 2 }}>
                    <li>Each patient owns their records</li>
                    <li>Doctors need patient permission to view</li>
                    <li>Permissions stored in smart contract mapping</li>
                    <li>Patients can revoke at any time</li>
                    <li>Admin can always view (auditing)</li>
                    <li>All actions are recorded on-chain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
