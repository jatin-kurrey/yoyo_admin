import { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  Key, Search, Plus, RotateCcw, CheckCircle, AlertTriangle, UserCheck,
  ShieldAlert, DollarSign, Shirt, Hash, Sparkles, Filter, Check, X, Printer
} from 'lucide-react';

export default function CostumeLockerPage() {
  const { customers, lockers, costumes, costumeIssues, dispatch, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('issue'); // issue, returns, lockers_grid, costume_stock
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // New Issue Modal / Form state
  const [selectedLockerId, setSelectedLockerId] = useState('');
  const [selectedCostumes, setSelectedCostumes] = useState([]); // [{ costumeId, code, name, quantity, rentalFee, deposit }]
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('');

  // Return Modal state
  const [returnModalIssue, setReturnModalIssue] = useState(null);
  const [damageFine, setDamageFine] = useState(0);
  const [returnNotes, setReturnNotes] = useState('');

  // Add Costume Modal state
  const [showAddCostumeModal, setShowAddCostumeModal] = useState(false);
  const [newCostume, setNewCostume] = useState({ code: '', name: '', category: 'Men', size: 'M', totalStock: 30, rentalFee: 60, securityDeposit: 50 });

  // Add Locker Modal state
  const [showAddLockerModal, setShowAddLockerModal] = useState(false);
  const [newLocker, setNewLocker] = useState({ lockerNumber: '', zone: 'Men Changing Area', sizeCategory: 'Medium', rentalFee: 100, securityDeposit: 100 });

  // Receipt Modal
  const [receiptIssue, setReceiptIssue] = useState(null);

  // Filter customers by query
  const filteredCustomers = (customers || []).filter(c =>
    (c.customerCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery) ||
    (c.roomNumber || '').includes(searchQuery) ||
    (c.wristbandId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-sync select customer
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setSearchQuery(cust.customerCode || cust.phone);
    showToast(`Unified Customer Profile Synced: ${cust.name} (${cust.customerCode})`);
  };

  // Toggle costume selection for new issue
  const handleToggleCostume = (costume, qty) => {
    const existingIdx = selectedCostumes.findIndex(c => c.costumeId === costume.id);
    if (qty <= 0) {
      if (existingIdx >= 0) {
        setSelectedCostumes(selectedCostumes.filter(c => c.costumeId !== costume.id));
      }
      return;
    }
    const itemData = {
      costumeId: costume.id,
      code: costume.code,
      name: costume.name,
      quantity: qty,
      rentalFee: costume.rentalFee,
      deposit: costume.securityDeposit
    };
    if (existingIdx >= 0) {
      const updated = [...selectedCostumes];
      updated[existingIdx] = itemData;
      setSelectedCostumes(updated);
    } else {
      setSelectedCostumes([...selectedCostumes, itemData]);
    }
  };

  // Calculations for Issue
  const selectedLockerObj = (lockers || []).find(l => l.id === selectedLockerId || l.lockerNumber === selectedLockerId);
  const lockerRentalFee = selectedLockerObj ? selectedLockerObj.rentalFee : 0;
  const lockerDeposit = selectedLockerObj ? selectedLockerObj.securityDeposit : 0;

  const costumesRentalTotal = selectedCostumes.reduce((acc, c) => acc + (c.rentalFee * c.quantity), 0);
  const costumesDepositTotal = selectedCostumes.reduce((acc, c) => acc + (c.deposit * c.quantity), 0);

  const totalRentalFee = lockerRentalFee + costumesRentalTotal;
  const totalDepositHeld = lockerDeposit + costumesDepositTotal;
  const grandTotalPaid = totalRentalFee + totalDepositHeld;

  // Handle Submit Issue
  const handleIssueSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showToast('Please search or select a customer profile first.', 'error');
      return;
    }
    if (!selectedLockerId && selectedCostumes.length === 0) {
      showToast('Select at least a locker or 1 costume item to issue.', 'error');
      return;
    }

    const payload = {
      customerCode: selectedCustomer.customerCode,
      guestName: selectedCustomer.name,
      guestPhone: selectedCustomer.phone,
      roomNumber: selectedCustomer.roomNumber,
      wristbandId: selectedCustomer.wristbandId,
      lockerNumber: selectedLockerObj ? selectedLockerObj.lockerNumber : '',
      costumes: selectedCostumes,
      totalRentalFee,
      totalDepositHeld,
      grandTotalPaid,
      paymentMode,
      notes,
    };

    dispatch({ type: 'ISSUE_LOCKER_COSTUME', payload });
    showToast(`Issued successfully to ${selectedCustomer.name}! Slip generated.`);
    setReceiptIssue(payload);

    // Reset form
    setSelectedLockerId('');
    setSelectedCostumes([]);
    setNotes('');
  };

  // Handle Return & Refund Submit
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!returnModalIssue) return;
    dispatch({
      type: 'RETURN_LOCKER_COSTUME',
      payload: {
        issueId: returnModalIssue.id,
        damageFine: Number(damageFine),
        notes: returnNotes,
      }
    });
    const netRefund = Math.max(0, (returnModalIssue.totalDepositHeld || 0) - Number(damageFine));
    showToast(`Returned! Refund ₹${netRefund} to ${returnModalIssue.guestName}.`);
    setReturnModalIssue(null);
    setDamageFine(0);
    setReturnNotes('');
  };

  // Add Costume
  const handleAddCostume = (e) => {
    e.preventDefault();
    if (!newCostume.code || !newCostume.name) {
      showToast('Please fill costume code and name.', 'error');
      return;
    }
    dispatch({ type: 'ADD_COSTUME', payload: newCostume });
    showToast(`Costume ${newCostume.name} added to stock.`);
    setShowAddCostumeModal(false);
    setNewCostume({ code: '', name: '', category: 'Men', size: 'M', totalStock: 30, rentalFee: 60, securityDeposit: 50 });
  };

  // Add Locker
  const handleAddLocker = (e) => {
    e.preventDefault();
    if (!newLocker.lockerNumber) {
      showToast('Please fill locker number.', 'error');
      return;
    }
    dispatch({ type: 'ADD_LOCKER', payload: newLocker });
    showToast(`Locker ${newLocker.lockerNumber} created.`);
    setShowAddLockerModal(false);
    setNewLocker({ lockerNumber: '', zone: 'Men Changing Area', sizeCategory: 'Medium', rentalFee: 100, securityDeposit: 100 });
  };

  // Stats
  const assignedLockersCount = (lockers || []).filter(l => l.status === 'assigned').length;
  const activeIssues = (costumeIssues || []).filter(i => i.status === 'issued');
  const totalCautionHeld = activeIssues.reduce((acc, i) => acc + (i.totalDepositHeld || 0), 0);
  const todayRentalRevenue = (costumeIssues || []).reduce((acc, i) => acc + (i.totalRentalFee || 0), 0);

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Key className="text-cyan-400" size={26} />
            <h1 className="text-2xl font-bold text-white tracking-tight">Costume & Locker Management</h1>
            <span className="bg-cyan-950 text-cyan-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-cyan-800 flex items-center gap-1">
              <Sparkles size={12} /> Sync Customer ID Active
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Issue lockers, swimwear costumes, towels, caution deposits & refunds linked to guest profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddLockerModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
          >
            <Plus size={14} /> Add Locker
          </button>
          <button
            onClick={() => setShowAddCostumeModal(true)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 transition flex items-center gap-1.5"
          >
            <Shirt size={14} /> Add Costume Item
          </button>
        </div>
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium">Assigned Lockers</p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {assignedLockersCount} <span className="text-slate-500 text-sm font-normal">/ {(lockers || []).length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Key size={20} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium">Active Rentals</p>
            <p className="text-2xl font-extrabold text-white mt-1">{activeIssues.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Shirt size={20} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium">Caution Deposit Held</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">₹{totalCautionHeld}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium">Rental Income</p>
            <p className="text-2xl font-extrabold text-cyan-300 mt-1">₹{todayRentalRevenue}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Unified Customer Auto-Sync Search Bar */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-800/50 rounded-xl p-4 mb-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-cyan-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <UserCheck size={14} /> Search & Auto-Sync Unified Customer ID
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Type Customer ID (CST-1001), Phone (+91...), Room # (101), or Wristband ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Selected Customer Info Badge */}
          {selectedCustomer ? (
            <div className="bg-cyan-950/90 border border-cyan-700/80 rounded-lg p-3 min-w-[260px] flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  {selectedCustomer.name}
                  <span className="bg-cyan-900 text-cyan-200 text-[10px] px-1.5 py-0.5 rounded font-mono">
                    {selectedCustomer.customerCode}
                  </span>
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Phone: {selectedCustomer.phone} {selectedCustomer.roomNumber ? `• Room: ${selectedCustomer.roomNumber}` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white p-1"
                title="Clear selection"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Search above to sync guest profile across Ticketing, POS & Lockers.
            </div>
          )}
        </div>

        {/* Live Search Autocomplete Results */}
        {searchQuery && !selectedCustomer && (
          <div className="mt-3 bg-slate-900 border border-slate-700 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-800">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(c => (
                <div
                  key={c.id || c.customerCode}
                  onClick={() => handleSelectCustomer(c)}
                  className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition"
                >
                  <div>
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="ml-2 font-mono text-cyan-400">({c.customerCode})</span>
                    <span className="ml-2 text-slate-400">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.roomNumber && <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">Room {c.roomNumber}</span>}
                    <span className="text-cyan-400 font-semibold">Select →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-xs text-slate-400 flex items-center justify-between">
                <span>No customer found matching "{searchQuery}".</span>
                <button
                  onClick={() => handleSelectCustomer({
                    customerCode: `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: searchQuery,
                    phone: searchQuery.match(/^\+?\d+$/) ? searchQuery : '+91 98765 00000',
                    roomNumber: '',
                    wristbandId: ''
                  })}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  + Auto-Create Customer "{searchQuery}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('issue')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'issue'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key size={14} /> Issue Locker & Costumes
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'returns'
              ? 'border-amber-500 text-amber-400 bg-amber-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw size={14} /> Returns & Caution Refunds ({activeIssues.length})
        </button>
        <button
          onClick={() => setActiveTab('lockers_grid')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'lockers_grid'
              ? 'border-blue-500 text-blue-400 bg-blue-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash size={14} /> Visual Locker Grid
        </button>
        <button
          onClick={() => setActiveTab('costume_stock')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'costume_stock'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shirt size={14} /> Costume Inventory Register
        </button>
      </div>

      {/* TAB 1: ISSUE LOCKER & COSTUMES */}
      {activeTab === 'issue' && (
        <form onSubmit={handleIssueSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Locker & Costume Selector */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Locker */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  Select Available Locker
                </span>
                <span className="text-xs text-slate-400 font-normal">Optional</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div
                  onClick={() => setSelectedLockerId('')}
                  className={`p-3 rounded-lg border cursor-pointer text-xs transition ${
                    selectedLockerId === ''
                      ? 'bg-slate-800 border-slate-600 text-slate-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">No Locker</p>
                  <p className="text-[10px] mt-0.5">Costumes only</p>
                </div>
                {(lockers || []).filter(l => l.status === 'available').map(l => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLockerId(l.id)}
                    className={`p-3 rounded-lg border cursor-pointer text-xs transition relative ${
                      selectedLockerId === l.id
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-cyan-300">{l.lockerNumber}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{l.sizeCategory}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{l.zone}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">Rent: ₹{l.rentalFee}</span>
                      <span className="text-amber-400 font-medium">Dep: ₹{l.securityDeposit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Select Swimwear & Towels */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                Select Costumes & Towels
              </h3>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
                {(costumes || []).map(c => {
                  const selObj = selectedCostumes.find(sc => sc.costumeId === c.id);
                  const selQty = selObj ? selObj.quantity : 0;
                  return (
                    <div key={c.id} className="p-3 bg-slate-950 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{c.name}</span>
                          <span className="bg-slate-800 text-cyan-400 text-[10px] px-2 py-0.5 rounded font-mono">{c.code}</span>
                          <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">{c.category} ({c.size})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Rent: <span className="text-slate-200 font-semibold">₹{c.rentalFee}</span> • Caution Deposit: <span className="text-amber-400 font-semibold">₹{c.securityDeposit}</span> • Available: <span className="text-emerald-400 font-bold">{c.availableStock}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleToggleCostume(c, selQty - 1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold transition flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-white">{selQty}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCostume(c, selQty + 1)}
                          disabled={selQty >= c.availableStock}
                          className="w-7 h-7 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white rounded font-bold transition flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Col: Issue Summary & Billing Counter */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Rental Summary & Charges</span>
                <span className="bg-cyan-950 text-cyan-400 text-[10px] px-2 py-0.5 rounded font-mono">
                  {selectedCustomer ? selectedCustomer.customerCode : 'No Guest'}
                </span>
              </h3>

              {/* Guest Card */}
              {selectedCustomer ? (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4 text-xs">
                  <p className="font-bold text-white">{selectedCustomer.name}</p>
                  <p className="text-slate-400 mt-0.5">Phone: {selectedCustomer.phone}</p>
                  {selectedCustomer.roomNumber && <p className="text-slate-400">Room: {selectedCustomer.roomNumber}</p>}
                </div>
              ) : (
                <div className="bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} /> Select guest profile from top search bar.
                </div>
              )}

              {/* Selected Locker */}
              <div className="text-xs space-y-2 mb-4">
                <div className="flex justify-between text-slate-300">
                  <span>Locker Selected:</span>
                  <span className="font-bold text-white">{selectedLockerObj ? selectedLockerObj.lockerNumber : 'None'}</span>
                </div>

                {/* Selected Costumes */}
                <div>
                  <span className="text-slate-400 block mb-1">Items Selected:</span>
                  {selectedCostumes.length > 0 ? (
                    <div className="space-y-1 bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
                      {selectedCostumes.map(sc => (
                        <div key={sc.costumeId} className="flex justify-between text-slate-300">
                          <span>{sc.name} x{sc.quantity}</span>
                          <span className="font-semibold text-slate-200">₹{(sc.rentalFee + sc.deposit) * sc.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">No costume selected</span>
                  )}
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 text-xs mb-4">
                <div className="flex justify-between text-slate-300">
                  <span>Total Rental Fee:</span>
                  <span className="font-bold text-white">₹{totalRentalFee}</span>
                </div>
                <div className="flex justify-between text-amber-400 font-medium">
                  <span>Caution Deposit (Refundable):</span>
                  <span className="font-bold">₹{totalDepositHeld}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-extrabold text-cyan-300">
                  <span>Grand Total Paid:</span>
                  <span>₹{grandTotalPaid}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="mb-4">
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['UPI', 'Cash', 'Card'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-lg font-semibold border transition ${
                        paymentMode === mode
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedCustomer || (!selectedLockerId && selectedCostumes.length === 0)}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-900/40 transition flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Issue Locker & Print Receipt (₹{grandTotalPaid})
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: RETURNS & CAUTION REFUNDS */}
      {activeTab === 'returns' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw size={16} className="text-amber-400" /> Active Rental Issues & Caution Refund Counter
            </h3>
            <span className="text-xs text-slate-400">{activeIssues.length} active issue receipts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Issue #</th>
                  <th className="p-3">Guest / Customer ID</th>
                  <th className="p-3">Locker #</th>
                  <th className="p-3">Issued Costumes</th>
                  <th className="p-3">Caution Deposit</th>
                  <th className="p-3">Issued At</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeIssues.length > 0 ? (
                  activeIssues.map(issue => (
                    <tr key={issue.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-cyan-400">{issue.issueNumber}</td>
                      <td className="p-3">
                        <p className="font-bold text-white">{issue.guestName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{issue.customerCode} • {issue.guestPhone}</p>
                      </td>
                      <td className="p-3">
                        {issue.lockerNumber ? (
                          <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                            {issue.lockerNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {(issue.costumes || []).map((c, i) => (
                          <span key={i} className="inline-block bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[10px] mr-1 mb-1">
                            {c.name} (x{c.quantity})
                          </span>
                        ))}
                      </td>
                      <td className="p-3 font-bold text-amber-400">₹{issue.totalDepositHeld}</td>
                      <td className="p-3 text-slate-400 text-[11px]">{issue.issuedAt}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setReturnModalIssue(issue)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5 ml-auto"
                        >
                          <RotateCcw size={14} /> Process Return & Refund
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      No active issued costumes or lockers currently. All keys & costumes returned!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL LOCKER GRID */}
      {activeTab === 'lockers_grid' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Visual Locker Grid View</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Available
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span> Assigned
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {(lockers || []).map(l => (
              <div
                key={l.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition relative overflow-hidden ${
                  l.status === 'assigned'
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-lg text-white font-mono">{l.lockerNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      l.status === 'assigned' ? 'bg-rose-900 text-rose-200' : 'bg-emerald-900 text-emerald-200'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{l.zone}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/80 text-xs">
                  {l.status === 'assigned' ? (
                    <div>
                      <p className="font-bold text-white truncate">{l.assignedTo}</p>
                      <p className="text-[10px] text-rose-300 font-mono mt-0.5">{l.assignedCustomerCode}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">Ready for rental</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COSTUME STOCK REGISTER */}
      {activeTab === 'costume_stock' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shirt size={16} className="text-emerald-400" /> Swimwear & Costume Inventory Stock Register
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Costume Name</th>
                  <th className="p-3">Category / Size</th>
                  <th className="p-3">Total Stock</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Rental Fee</th>
                  <th className="p-3">Caution Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(costumes || []).map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-cyan-400">{c.code}</td>
                    <td className="p-3 font-bold text-white">{c.name}</td>
                    <td className="p-3 text-slate-300">{c.category} ({c.size})</td>
                    <td className="p-3 font-bold text-slate-200">{c.totalStock}</td>
                    <td className="p-3 font-bold text-emerald-400">{c.availableStock}</td>
                    <td className="p-3 text-slate-200">₹{c.rentalFee}</td>
                    <td className="p-3 text-amber-400 font-semibold">₹{c.securityDeposit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: RETURN & CAUTION REFUND */}
      {returnModalIssue && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw size={16} className="text-amber-400" /> Process Return & Refund Caution Deposit
              </h3>
              <button onClick={() => setReturnModalIssue(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <p className="font-bold text-white text-sm">{returnModalIssue.guestName}</p>
                <p className="text-slate-400 font-mono">{returnModalIssue.customerCode} • {returnModalIssue.guestPhone}</p>
                {returnModalIssue.lockerNumber && (
                  <p className="text-cyan-400 font-bold mt-1">Locker Number: {returnModalIssue.lockerNumber}</p>
                )}
              </div>

              <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-lg flex justify-between items-center text-amber-300">
                <span>Caution Deposit Held:</span>
                <span className="text-base font-extrabold">₹{returnModalIssue.totalDepositHeld}</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Damage / Loss Fine (If key or costume lost):</label>
                <input
                  type="number"
                  min="0"
                  max={returnModalIssue.totalDepositHeld}
                  value={damageFine}
                  onChange={(e) => setDamageFine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Remarks / Inspection Notes:</label>
                <textarea
                  rows="2"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned locker key intact, towel returned clean."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                ></textarea>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                <span>Net Refund to Guest:</span>
                <span>₹{Math.max(0, (returnModalIssue.totalDepositHeld || 0) - Number(damageFine))}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalIssue(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg"
                >
                  Confirm Return & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COSTUME */}
      {showAddCostumeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shirt size={16} className="text-cyan-400" /> Add New Swimwear / Costume Item
              </h3>
              <button onClick={() => setShowAddCostumeModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCostume} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Item Code (e.g. CST-M-L)</label>
                <input
                  type="text"
                  required
                  value={newCostume.code}
                  onChange={(e) => setNewCostume({ ...newCostume, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Costume Name</label>
                <input
                  type="text"
                  required
                  value={newCostume.name}
                  onChange={(e) => setNewCostume({ ...newCostume, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={newCostume.category}
                    onChange={(e) => setNewCostume({ ...newCostume, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Unisex">Unisex / Towels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Size</label>
                  <input
                    type="text"
                    value={newCostume.size}
                    onChange={(e) => setNewCostume({ ...newCostume, size: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Total Stock</label>
                  <input
                    type="number"
                    value={newCostume.totalStock}
                    onChange={(e) => setNewCostume({ ...newCostume, totalStock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Rental Fee (₹)</label>
                  <input
                    type="number"
                    value={newCostume.rentalFee}
                    onChange={(e) => setNewCostume({ ...newCostume, rentalFee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Caution Dep. (₹)</label>
                  <input
                    type="number"
                    value={newCostume.securityDeposit}
                    onChange={(e) => setNewCostume({ ...newCostume, securityDeposit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCostumeModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LOCKER */}
      {showAddLockerModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key size={16} className="text-cyan-400" /> Create New Locker
              </h3>
              <button onClick={() => setShowAddLockerModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLocker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Locker Number (e.g. L-106)</label>
                <input
                  type="text"
                  required
                  value={newLocker.lockerNumber}
                  onChange={(e) => setNewLocker({ ...newLocker, lockerNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Zone Area</label>
                  <select
                    value={newLocker.zone}
                    onChange={(e) => setNewLocker({ ...newLocker, zone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="Men Changing Area">Men Changing Area</option>
                    <option value="Ladies Changing Area">Ladies Changing Area</option>
                    <option value="VIP Locker Room">VIP Locker Room</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Size Category</label>
                  <select
                    value={newLocker.sizeCategory}
                    onChange={(e) => setNewLocker({ ...newLocker, sizeCategory: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Rental Fee (₹)</label>
                  <input
                    type="number"
                    value={newLocker.rentalFee}
                    onChange={(e) => setNewLocker({ ...newLocker, rentalFee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Caution Deposit (₹)</label>
                  <input
                    type="number"
                    value={newLocker.securityDeposit}
                    onChange={(e) => setNewLocker({ ...newLocker, securityDeposit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLockerModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg"
                >
                  Save Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
