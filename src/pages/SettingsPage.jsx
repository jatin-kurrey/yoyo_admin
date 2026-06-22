import { useState } from 'react';
import { Shield, Users, Eye, Edit, Plus, Save } from 'lucide-react';
import { useApp } from '../store/AppContext';

const allPermissions = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'calendar', label: 'Reservation Calendar' },
  { key: 'pos', label: 'Restaurant POS' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'pricing', label: 'Pricing / Channel' },
  { key: 'accounts', label: 'Accounts & Finance' },
  { key: 'reports', label: 'Reports & Audit' },
  { key: 'settings', label: 'Settings' },
];

export default function SettingsPage() {
  const { roles, defaultRules, dispatch } = useApp();
  const [editingRole, setEditingRole] = useState(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePerms, setNewRolePerms] = useState({});
  const [localRules, setLocalRules] = useState(defaultRules);

  const togglePermission = (roleId, permKey) => {
    const role = roles.find(r => r.id === roleId);
    dispatch({ type: 'UPDATE_ROLE', payload: { id: roleId, permissions: { ...role.permissions, [permKey]: !role.permissions[permKey] } } });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return alert('Enter a role name');
    const perms = {};
    allPermissions.forEach(p => { perms[p.key] = !!newRolePerms[p.key]; });
    dispatch({ type: 'CREATE_ROLE', payload: { name: newRoleName, permissions: perms } });
    setShowCreateRole(false);
    setNewRoleName('');
    setNewRolePerms({});
  };

  const handleSaveRules = () => {
    dispatch({ type: 'UPDATE_DEFAULT_RULES', payload: localRules });
    alert('Default rules saved');
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Settings & Security</h1>
        <button onClick={() => setShowCreateRole(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={13} /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {roles.map((role) => (
          <div key={role.id} onClick={() => setEditingRole(editingRole === role.id ? null : role.id)}
            className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-sm ${editingRole === role.id ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className={editingRole === role.id ? 'text-slate-800' : 'text-slate-400'} />
              <span className="text-xs font-bold text-slate-800">{role.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Users size={12} /><span>{role.users} user{role.users !== 1 ? 's' : ''}</span></div>
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(role.permissions).filter(([, v]) => v).slice(0, 3).map(([key]) => (
                <span key={key} className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{key}</span>
              ))}
              {Object.values(role.permissions).filter(Boolean).length > 3 && (
                <span className="text-[8px] text-blue-500 font-medium">+{Object.values(role.permissions).filter(Boolean).length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingRole && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-slate-600" />
              <h3 className="text-sm font-bold text-slate-800">{roles.find(r => r.id === editingRole)?.name} — Permissions</h3>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-emerald-600 px-3 py-1.5 rounded hover:bg-emerald-50 border border-emerald-200"><Save size={13} /> Save Changes</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {allPermissions.map((perm) => {
              const role = roles.find(r => r.id === editingRole);
              const enabled = role?.permissions[perm.key];
              return (
                <div key={perm.key} onClick={() => togglePermission(editingRole, perm.key)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    {enabled ? <Eye size={14} className="text-emerald-600" /> : <Edit size={14} className="text-slate-400" />}
                    <span className={`text-xs font-medium ${enabled ? 'text-emerald-700' : 'text-slate-500'}`}>{perm.label}</span>
                  </div>
                  <span className={`w-8 h-4 rounded-full transition-colors relative ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${enabled ? 'right-0.5' : 'left-0.5'}`} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Default System Rules</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Default Check-In Time</span>
              <select value={localRules.checkInTime} onChange={e => setLocalRules({...localRules, checkInTime: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>12:00 PM</option><option>01:00 PM</option><option>02:00 PM</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Default Check-Out Time</span>
              <select value={localRules.checkOutTime} onChange={e => setLocalRules({...localRules, checkOutTime: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>10:00 AM</option><option>11:00 AM</option><option>12:00 PM</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Hold Booking Expiry</span>
              <select value={localRules.holdExpiry} onChange={e => setLocalRules({...localRules, holdExpiry: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>2 Hours</option><option>4 Hours</option><option>6 Hours</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Default Currency</span>
              <select value={localRules.currency} onChange={e => setLocalRules({...localRules, currency: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>INR (₹)</option><option>USD ($)</option><option>EUR (€)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Tax Rate (%)</span>
              <input type="number" value={localRules.taxRate} onChange={e => setLocalRules({...localRules, taxRate: +e.target.value})} className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-right" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Night Audit Time</span>
              <select value={localRules.nightAuditTime} onChange={e => setLocalRules({...localRules, nightAuditTime: e.target.value})} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                <option>12:00 AM</option><option>01:00 AM</option><option>02:00 AM</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
          <button onClick={handleSaveRules} className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg">Save Rules</button>
        </div>
      </div>

      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateRole(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[440px] p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Create New Role</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Role Name</label>
                <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g., Maintenance Manager" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {allPermissions.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={!!newRolePerms[perm.key]} onChange={e => setNewRolePerms({...newRolePerms, [perm.key]: e.target.checked})} className="accent-slate-800" />
                      <span className="text-xs text-slate-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
              <button onClick={() => setShowCreateRole(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleCreateRole} className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg">Create Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
