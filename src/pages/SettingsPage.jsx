import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Plus, Save, Trash2, UserCog, Mail, KeyRound, Loader2, Download, Upload, AlertTriangle, Server, Database, RotateCcw } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import { pmsService } from '../services/pmsService';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  moderator: 'Moderator',
  staff: 'Staff',
  hk_staff: 'Housekeeping',
  booking_staff: 'Booking Staff',
};

export default function SettingsPage() {
  const { user, defaultRules, dispatch, showToast, demoUsers } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPassUser, setResetPassUser] = useState(null);
  const [resetPass, setResetPass] = useState('');
  const [showCreateDemo, setShowCreateDemo] = useState(false);
  const [editingDemoUser, setEditingDemoUser] = useState(null);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', password: '', role: 'staff', isActive: true });
  const [localRules, setLocalRules] = useState(defaultRules || {});
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', isActive: true });

  useEffect(() => {
    if (defaultRules) {
      setLocalRules(defaultRules);
    }
  }, [defaultRules]);

  // System admin state
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const [systemStats, setSystemStats] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    if (!api.getToken()) {
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
      const res = await api.admin.get('/users?limit=100');
      if (res.success) setUsers(res.data?.items || []);
    } catch { setUsers([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    if (isSuperAdmin && api.getToken()) {
      pmsService.getSystemStats().then(r => {
        if (r.success) setSystemStats(r.data);
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) return showToast('Name and email required', 'error');
    if (!form.password) return showToast('Password required', 'error');
    try {
      const res = await api.admin.post('/users', form);
      if (res.success) {
        showToast(`User ${form.name} created`);
        setShowCreate(false);
        setForm({ name: '', email: '', password: '', role: 'staff', isActive: true });
        loadUsers();
      } else showToast(res.message || 'Failed to create user', 'error');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const user = users.find(u => u.id === id);
      const res = await api.admin.patch(`/users/${id}`, { ...user, ...updates });
      if (res.success) {
        showToast('User updated');
        loadUsers();
        setEditingUser(null);
      } else showToast(res.message || 'Failed to update user', 'error');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleResetPassword = async () => {
    if (!resetPass || resetPass.length < 8) return showToast('Password must be at least 8 characters', 'error');
    try {
      const res = await api.admin.post(`/users/${resetPassUser.id}/reset-password`, { password: resetPass });
      if (res.success) {
        showToast(`Password reset for ${resetPassUser.name}`);
        setResetPassUser(null);
        setResetPass('');
      } else showToast(res.message || 'Failed to reset password', 'error');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleBackup = async () => {
    setBusy(true);
    try {
      const res = await pmsService.backupSystem();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pms-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup downloaded');
      }
    } catch (err) { showToast(err.message, 'error'); }
    setBusy(false);
  };

  const handleRestore = async () => {
    if (!restoreFile) return showToast('Select a backup file first', 'error');
    setBusy(true);
    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);
      const res = await pmsService.restoreSystem(data);
      if (res.success) {
        showToast('Backup restored successfully');
        setRestoreFile(null);
        loadUsers();
      } else showToast(res.message || 'Restore failed', 'error');
    } catch (err) { showToast('Invalid backup file: ' + err.message, 'error'); }
    setBusy(false);
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      // Force backup before reset
      const backup = await pmsService.backupSystem();
      if (!backup.success) {
        showToast('Backup failed — aborting reset. Try again.', 'error');
        setBusy(false);
        return;
      }
      const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pre-reset-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const res = await pmsService.resetSystem();
      if (res.success) {
        dispatch({ type: 'RESET_DATA' });
        showToast('System reset. Backup downloaded automatically.');
        setShowResetConfirm(false);
      } else showToast(res.message || 'Reset failed', 'error');
    } catch (err) { showToast(err.message, 'error'); }
    setBusy(false);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Settings & User Management</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={13} /> Create User
        </button>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Users size={14} /> Admin Users ({users.length})
          </h3>
          <button onClick={loadUsers} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">Refresh</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-xs gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">No users found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="relative flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    {(u.name || u.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      {u.name || 'Unnamed'}
                      {!u.isActive && <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Inactive</span>}
                    </div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    u.role === 'super_admin' ? 'bg-amber-50 text-amber-700'
                    : u.role === 'admin' ? 'bg-blue-50 text-blue-700'
                    : u.role === 'hk_staff' ? 'bg-purple-50 text-purple-700'
                    : u.role === 'booking_staff' ? 'bg-cyan-50 text-cyan-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  {isSuperAdmin && (
                    <button onClick={() => { setResetPassUser(u); setResetPass(''); }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Reset Password">
                      <KeyRound size={14} />
                    </button>
                  )}
                  <button onClick={() => setEditingUser(editingUser?.id === u.id ? null : u)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <UserCog size={15} />
                  </button>
                </div>

                {editingUser?.id === u.id && (
                  <div className="absolute mt-2 right-4 top-full bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-72 z-10" onClick={e => e.stopPropagation()}>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
                        <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
                          {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={editingUser.isActive} onChange={e => setEditingUser({...editingUser, isActive: e.target.checked})} className="accent-slate-800" />
                          <span>Active</span>
                        </label>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleUpdate(u.id, { role: editingUser.role, isActive: editingUser.isActive })}
                          className="flex-1 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditingUser(null)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default System Rules */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Default System Rules</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Default Check-In Time</span>
              <select value={localRules?.checkInTime || '12:00 PM'} onChange={e => setLocalRules({...localRules, checkInTime: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>12:00 PM</option><option>01:00 PM</option><option>02:00 PM</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Default Check-Out Time</span>
              <select value={localRules?.checkOutTime || '10:00 AM'} onChange={e => setLocalRules({...localRules, checkOutTime: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>10:00 AM</option><option>11:00 AM</option><option>12:00 PM</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Hold Booking Expiry</span>
              <select value={localRules?.holdExpiry || '4 Hours'} onChange={e => setLocalRules({...localRules, holdExpiry: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>2 Hours</option><option>4 Hours</option><option>6 Hours</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Default Currency</span>
              <select value={localRules?.currency || 'INR (₹)'} onChange={e => setLocalRules({...localRules, currency: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>INR (₹)</option><option>USD ($)</option><option>EUR (€)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Tax Rate (%)</span>
              <input type="number" value={localRules?.taxRate || 0} onChange={e => setLocalRules({...localRules, taxRate: +e.target.value})} className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-right" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Night Audit Time</span>
              <select value={localRules?.nightAuditTime || '01:00 AM'} onChange={e => setLocalRules({...localRules, nightAuditTime: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>12:00 AM</option><option>01:00 AM</option><option>02:00 AM</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => { dispatch({ type: 'UPDATE_DEFAULT_RULES', payload: localRules }); showToast('Rules saved'); }} className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg">Save Rules</button>
        </div>
      </div>

      {/* Local Demo Users */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Users size={14} /> Local Demo Users ({demoUsers.length})
          </h3>
          <button onClick={() => setShowCreateDemo(true)} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">+ Add</button>
        </div>
        <div className="divide-y divide-slate-100">
          {demoUsers.map((du) => (
            <div key={du.id} className="relative flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${du.isActive ? 'bg-slate-500' : 'bg-slate-300'}`}>
                  {(du.name || du.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    {du.name}
                    {!du.isActive && <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Inactive</span>}
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-medium">{du.role}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{du.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingDemoUser(editingDemoUser?.id === du.id ? null : du)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <UserCog size={15} />
                </button>
                <button onClick={() => { dispatch({ type: 'DELETE_DEMO_USER', payload: du.id }); showToast(`Deleted ${du.name}`); }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              {editingDemoUser?.id === du.id && (
                <div className="absolute mt-2 right-4 top-full bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-72 z-10" onClick={e => e.stopPropagation()}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Name</label>
                      <input type="text" value={editingDemoUser.name} onChange={e => setEditingDemoUser({...editingDemoUser, name: e.target.value})}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Email</label>
                      <input type="email" value={editingDemoUser.email} onChange={e => setEditingDemoUser({...editingDemoUser, email: e.target.value})}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
                      <input type="text" value={editingDemoUser.password} onChange={e => setEditingDemoUser({...editingDemoUser, password: e.target.value})}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
                      <select value={editingDemoUser.role} onChange={e => setEditingDemoUser({...editingDemoUser, role: e.target.value})}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
                        {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editingDemoUser.isActive} onChange={e => setEditingDemoUser({...editingDemoUser, isActive: e.target.checked})} className="accent-slate-800" />
                        <span>Active</span>
                      </label>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { dispatch({ type: 'UPDATE_DEMO_USER', payload: editingDemoUser }); setEditingDemoUser(null); showToast('Demo user updated'); }}
                        className="flex-1 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                        Save
                      </button>
                      <button onClick={() => setEditingDemoUser(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Demo User Modal */}
      {showCreateDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateDemo(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[440px] p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Create Local Demo User</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <input type="text" value={demoForm.name} onChange={e => setDemoForm({...demoForm, name: e.target.value})} placeholder="e.g., Rajesh Kumar" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" value={demoForm.email} onChange={e => setDemoForm({...demoForm, email: e.target.value})} placeholder="user@yoyofun.in" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
                <input type="text" value={demoForm.password} onChange={e => setDemoForm({...demoForm, password: e.target.value})} placeholder="Min 6 characters" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Role</label>
                <select value={demoForm.role} onChange={e => setDemoForm({...demoForm, role: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                  {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={demoForm.isActive} onChange={e => setDemoForm({...demoForm, isActive: e.target.checked})} className="accent-slate-800" />
                  <span>Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
              <button onClick={() => setShowCreateDemo(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={() => {
                if (!demoForm.name.trim() || !demoForm.email.trim() || !demoForm.password) return alert('Name, email, and password required');
                dispatch({ type: 'ADD_DEMO_USER', payload: demoForm });
                setShowCreateDemo(false);
                setDemoForm({ name: '', email: '', password: '', role: 'staff', isActive: true });
                showToast('Demo user created');
              }} className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* System Administration — Super Admin Only */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} /> System Administration
            </h3>
            <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">Super Admin Only</span>
          </div>

          <div className="p-4 space-y-4">
            {/* System Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Categories', value: systemStats?.categories ?? '-', icon: Database },
                { label: 'Rooms', value: systemStats?.rooms ?? '-', icon: Server },
                { label: 'Bookings', value: systemStats?.bookings ?? '-', icon: Database },
                { label: 'Transactions', value: systemStats?.transactions ?? '-', icon: Database },
                { label: 'Rate Overrides', value: systemStats?.rate_overrides ?? '-', icon: Database },
                { label: 'POS Tables', value: systemStats?.pos_tables ?? '-', icon: Server },
                { label: 'HK Tasks', value: systemStats?.hk_tasks ?? '-', icon: Database },
                { label: 'Settings', value: systemStats?.settings ?? '-', icon: Database },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                    <Icon size={14} className="mx-auto text-slate-400 mb-1" />
                    <div className="text-lg font-bold text-slate-800">{item.value}</div>
                    <div className="text-[9px] text-slate-500 font-medium">{item.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <button onClick={handleBackup} disabled={busy}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Backup Data
              </button>

              <label className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer">
                <Upload size={13} />
                Restore Backup
                <input type="file" accept=".json" className="hidden" onChange={e => setRestoreFile(e.target.files[0])} />
              </label>

              {restoreFile && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{restoreFile.name}</span>
                  <button onClick={handleRestore} disabled={busy}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded-lg disabled:opacity-50">
                    {busy ? <Loader2 size={12} className="animate-spin" /> : 'Restore'}
                  </button>
                  <button onClick={() => setRestoreFile(null)} className="text-[10px] text-red-500 hover:text-red-700">Cancel</button>
                </div>
              )}

              <div className="flex-1" />

              <button onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                <RotateCcw size={13} /> Reset System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[440px] p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Create Admin User</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <div className="relative">
                  <UserCog size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Rajesh Kumar" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="rajesh@yoyofun.in" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                  {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
              <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleCreate} className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg">Create User</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setResetPassUser(null); setResetPass(''); }}>
          <div className="bg-white rounded-xl shadow-xl w-[380px] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <KeyRound size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Reset Password</h3>
                <p className="text-[10px] text-slate-500">{resetPassUser.name} · {resetPassUser.email}</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">New Password</label>
              <input type="password" value={resetPass} onChange={e => setResetPass(e.target.value)} placeholder="Min 8 characters" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" autoFocus />
              <p className="text-[9px] text-slate-400 mt-1">User will need to use this password on next login.</p>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
              <button onClick={() => { setResetPassUser(null); setResetPass(''); }} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleResetPassword} disabled={resetPass.length < 8}
                className="px-5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset System Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[440px] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Reset PMS System</h3>
                <p className="text-[10px] text-slate-500">This action is irreversible</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-700 font-medium">This will permanently delete ALL property management data:</p>
              <ul className="text-[10px] text-red-600 mt-2 space-y-1 list-disc list-inside">
                <li>Room categories & room configurations</li>
                <li>All bookings, folio entries, and payments</li>
                <li>POS tables and order history</li>
                <li>Housekeeping tasks</li>
                <li>Financial transactions and rate overrides</li>
                <li>System settings and configurations</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <Download size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="text-[10px] text-amber-700">
                <span className="font-semibold">Recommended:</span> Take a backup before resetting. You can restore from backup later.
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleBackup} disabled={busy}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                <Download size={12} /> Backup First
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleReset} disabled={busy}
                className="flex items-center gap-1.5 px-5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                {busy ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
