import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, FileText, Plus } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function AccountsPage() {
  const { transactions, vouchers, dispatch, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('transactions');
  const [txFilter, setTxFilter] = useState('all');
  const [showAddTx, setShowAddTx] = useState(false);
  const [newTx, setNewTx] = useState({ type: 'income', category: 'Room Booking', description: '', amount: '', method: 'Cash', date: new Date().toISOString().slice(0, 10) });

  const filteredTx = transactions.filter(t => {
    if (txFilter === 'income') return t.type === 'income';
    if (txFilter === 'expense') return t.type === 'expense';
    return true;
  });

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const pending = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0);

  const handleAddTx = () => {
    if (!newTx.description.trim() || !newTx.amount) return alert('Fill description and amount');
    dispatch({ type: 'ADD_TRANSACTION', payload: { ...newTx, id: `TXN${Date.now()}`, status: 'completed' } });
    setShowAddTx(false);
    setNewTx({ type: 'income', category: 'Room Booking', description: '', amount: '', method: 'Cash', date: new Date().toISOString().slice(0, 10) });
  };

  const handleExportCSV = () => {
    const headers = 'ID,Date,Type,Category,Description,Amount,Method,Status\n';
    const rows = filteredTx.map(t => `${t.id},${t.date},${t.type},${t.category},"${t.description}",${t.amount},${t.method},${t.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Accounts & Finance</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowAddTx(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={13} /> Add Transaction
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Income', value: `₹${(income / 1000).toFixed(0)}K`, icon: ArrowDownRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Expenses', value: `₹${(expense / 1000).toFixed(0)}K`, icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Net Balance', value: `₹${((income - expense) / 1000).toFixed(0)}K`, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: `₹${(pending / 1000).toFixed(0)}K`, icon: ArrowUpRight, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${item.bg} rounded-xl border border-slate-200 p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">{item.label}</span>
                <Icon size={16} className={item.color} />
              </div>
              <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {['transactions', 'vouchers'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${activeTab === tab ? 'text-slate-800 border-slate-800' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {tab === 'transactions' ? 'Transactions' : 'Vouchers'}
          </button>
        ))}
        <div className="flex-1" />
        {activeTab === 'transactions' && (
          <div className="flex gap-1.5 pb-2">
            {['all', 'income', 'expense'].map((f) => (
              <button key={f} onClick={() => setTxFilter(f)}
                className={`px-3 py-1 text-[10px] font-semibold rounded-lg ${txFilter === f ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Description</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Amount</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Method</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{tx.id}</td>
                  <td className="px-4 py-3 text-slate-700">{tx.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{tx.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{tx.description}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">{tx.method}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'vouchers' && (
        <div className="grid grid-cols-2 gap-4">
          {vouchers.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div><span className="text-xs font-semibold text-slate-800">{v.id}</span><span className="text-[10px] text-slate-400 ml-2">{v.date}</span></div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${v.status === 'generated' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{v.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-xs font-medium text-slate-700">{v.guest}</div><div className="text-[10px] text-slate-400">{v.type}</div></div>
                <div className="text-sm font-bold text-slate-800">₹{v.amount.toLocaleString()}</div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => showToast(`Viewing ${v.id}`)} className="text-[10px] text-blue-600 font-semibold hover:bg-blue-50 px-2 py-1 rounded">View</button>
                <button onClick={() => showToast(`Printing ${v.id}`)} className="text-[10px] text-blue-600 font-semibold hover:bg-blue-50 px-2 py-1 rounded">Print</button>
                <button onClick={() => showToast(`Emailing ${v.id}`)} className="text-[10px] text-blue-600 font-semibold hover:bg-blue-50 px-2 py-1 rounded">Email</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAddTx(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[420px] p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Add Transaction</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                {['income', 'expense'].map(t => (
                  <button key={t} onClick={() => setNewTx({...newTx, type: t})}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${newTx.type === t ? (t === 'income' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-700') : 'bg-white border-slate-200 text-slate-500'}`}>
                    {t === 'income' ? 'Income' : 'Expense'}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Category</label>
                <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                  <option>Room Booking</option><option>Restaurant</option><option>Other Services</option>
                  <option>Supplies</option><option>Utilities</option><option>Salary</option><option>Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Description</label>
                <input type="text" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="Transaction description..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Amount (₹)</label>
                  <input type="number" value={newTx.amount} onChange={e => {
                    const val = e.target.value;
                    setNewTx({...newTx, amount: val === '' ? '' : Number(val)});
                  }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Method</label>
                  <select value={newTx.method} onChange={e => setNewTx({...newTx, method: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
              <button onClick={() => setShowAddTx(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleAddTx} className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
