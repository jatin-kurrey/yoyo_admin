import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { pmsService } from '../services/pmsService';
import {
  Key, Search, Plus, RotateCcw, CheckCircle, AlertTriangle, UserCheck,
  ShieldAlert, DollarSign, Shirt, Hash, Sparkles, X, Printer, User, Phone,
  CreditCard, Banknote, Smartphone, FileText, Check, ShieldCheck, Tag
} from 'lucide-react';

export default function CostumeLockerPage() {
  const { customers, lockers: ctxLockers, costumes: ctxCostumes, costumeIssues: ctxIssues, dispatch, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('issue'); // issue, returns, lockers_grid, costume_stock
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Local state synced with API / Context
  const [lockersList, setLockersList] = useState(ctxLockers || []);
  const [costumesList, setCostumesList] = useState(ctxCostumes || []);
  const [issuesList, setIssuesList] = useState(ctxIssues || []);
  const [loading, setLoading] = useState(false);

  // Issue Form state
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
  const [refundReceipt, setRefundReceipt] = useState(null);

  // Fetch real data from backend if available
  const loadData = async () => {
    try {
      setLoading(true);
      const [locRes, cosRes, issRes] = await Promise.allSettled([
        pmsService.getLockers(),
        pmsService.getCostumes(),
        pmsService.getWaterparkIssues()
      ]);
      if (locRes.status === 'fulfilled' && locRes.value?.success) setLockersList(locRes.value.data || []);
      else setLockersList(ctxLockers || []);

      if (cosRes.status === 'fulfilled' && cosRes.value?.success) setCostumesList(cosRes.value.data || []);
      else setCostumesList(ctxCostumes || []);

      if (issRes.status === 'fulfilled' && issRes.value?.success) setIssuesList(issRes.value.data || []);
      else setIssuesList(ctxIssues || []);
    } catch (e) {
      setLockersList(ctxLockers || []);
      setCostumesList(ctxCostumes || []);
      setIssuesList(ctxIssues || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ctxLockers, ctxCostumes, ctxIssues]);

  // Search & Filter customers
  const filteredCustomers = (customers || []).filter(c =>
    (c.customerCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery) ||
    (c.roomNumber || '').includes(searchQuery) ||
    (c.wristbandId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setSearchQuery(cust.customerCode || cust.phone);
    showToast(`Unified Profile Loaded: ${cust.name} (${cust.customerCode || 'Synced'})`);
  };

  // Toggle costume quantities
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
  const selectedLockerObj = (lockersList || []).find(l => l.id === selectedLockerId || l.lockerNumber === selectedLockerId);
  const lockerRentalFee = selectedLockerObj ? selectedLockerObj.rentalFee : 0;
  const lockerDeposit = selectedLockerObj ? selectedLockerObj.securityDeposit : 0;

  const costumesRentalTotal = selectedCostumes.reduce((acc, c) => acc + (c.rentalFee * c.quantity), 0);
  const costumesDepositTotal = selectedCostumes.reduce((acc, c) => acc + (c.deposit * c.quantity), 0);

  const totalRentalFee = lockerRentalFee + costumesRentalTotal;
  const totalDepositHeld = lockerDeposit + costumesDepositTotal;
  const grandTotalPaid = totalRentalFee + totalDepositHeld;

  // Submit Issue
  const handleIssueSubmit = async (e) => {
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
      customerCode: selectedCustomer.customerCode || `CST-${Math.floor(1000 + Math.random() * 9000)}`,
      guestName: selectedCustomer.name,
      guestPhone: selectedCustomer.phone,
      roomNumber: selectedCustomer.roomNumber || '',
      wristbandId: selectedCustomer.wristbandId || '',
      lockerId: selectedLockerObj ? selectedLockerObj.id : '',
      lockerNumber: selectedLockerObj ? selectedLockerObj.lockerNumber : '',
      costumes: selectedCostumes,
      totalRentalFee,
      totalDepositHeld,
      grandTotalPaid,
      paymentMode,
      notes,
    };

    // Try API call first
    try {
      const apiRes = await pmsService.issueLockerAndCostumes({
        customer_code: payload.customerCode,
        guest_name: payload.guestName,
        guest_phone: payload.guestPhone,
        room_number: payload.roomNumber,
        wristband_id: payload.wristbandId,
        locker_id: payload.lockerId,
        costumes: payload.costumes,
        payment_mode: payload.paymentMode,
        notes: payload.notes,
      });
      if (apiRes?.success) {
        showToast('Issued successfully! Receipt generated.');
      }
    } catch (err) {
      // Fallback context update
    }

    dispatch({ type: 'ISSUE_LOCKER_COSTUME', payload });
    setReceiptIssue({
      ...payload,
      issueNumber: `ISS-${Math.floor(10000 + Math.random() * 90000)}`,
      issuedAt: new Date().toLocaleString(),
    });

    // Reset Form
    setSelectedLockerId('');
    setSelectedCostumes([]);
    setNotes('');
  };

  // Submit Return & Refund
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnModalIssue) return;

    const fine = Number(damageFine);
    const netRefund = Math.max(0, (returnModalIssue.totalDepositHeld || 0) - fine);

    try {
      await pmsService.returnLockerAndCostumes(returnModalIssue.id, {
        damage_fine: fine,
        notes: returnNotes,
      });
    } catch (err) {}

    dispatch({
      type: 'RETURN_LOCKER_COSTUME',
      payload: {
        issueId: returnModalIssue.id,
        damageFine: fine,
        notes: returnNotes,
      }
    });

    setRefundReceipt({
      issue: returnModalIssue,
      damageFine: fine,
      refundAmount: netRefund,
      returnedAt: new Date().toLocaleString(),
      notes: returnNotes,
    });

    showToast(`Returned! Deposit Refund ₹${netRefund} processed.`);
    setReturnModalIssue(null);
    setDamageFine(0);
    setReturnNotes('');
  };

  // Add Costume
  const handleAddCostume = async (e) => {
    e.preventDefault();
    if (!newCostume.code || !newCostume.name) return showToast('Please fill costume code and name.', 'error');
    try {
      await pmsService.createCostume(newCostume);
    } catch (err) {}
    dispatch({ type: 'ADD_COSTUME', payload: newCostume });
    showToast(`Costume ${newCostume.name} added to stock.`);
    setShowAddCostumeModal(false);
    setNewCostume({ code: '', name: '', category: 'Men', size: 'M', totalStock: 30, rentalFee: 60, securityDeposit: 50 });
  };

  // Add Locker
  const handleAddLocker = async (e) => {
    e.preventDefault();
    if (!newLocker.lockerNumber) return showToast('Please fill locker number.', 'error');
    try {
      await pmsService.createLocker(newLocker);
    } catch (err) {}
    dispatch({ type: 'ADD_LOCKER', payload: newLocker });
    showToast(`Locker ${newLocker.lockerNumber} created.`);
    setShowAddLockerModal(false);
    setNewLocker({ lockerNumber: '', zone: 'Men Changing Area', sizeCategory: 'Medium', rentalFee: 100, securityDeposit: 100 });
  };

  // Calculations for stats
  const assignedLockersCount = (lockersList || []).filter(l => l.status === 'assigned').length;
  const activeIssues = (issuesList || []).filter(i => i.status === 'issued' || i.status === 'active');
  const totalCautionHeld = activeIssues.reduce((acc, i) => acc + (i.totalDepositHeld || i.total_deposit_held || 0), 0);
  const todayRentalRevenue = (issuesList || []).reduce((acc, i) => acc + (i.totalRentalFee || i.total_rental_fee || 0), 0);

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Key size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Costume & Locker Management</h1>
              <p className="text-xs text-slate-500">
                Issue lockers, swimwear costumes, towels, caution deposits & refunds linked to Unified Customer ID
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddLockerModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus size={14} className="text-indigo-600" /> Add Locker
          </button>
          <button
            onClick={() => setShowAddCostumeModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition flex items-center gap-1.5"
          >
            <Shirt size={14} /> Add Costume Item
          </button>
        </div>
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Lockers</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {assignedLockersCount} <span className="text-slate-400 text-sm font-normal">/ {(lockersList || []).length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Key size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Rentals</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{activeIssues.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Shirt size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Caution Deposit Held</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">₹{totalCautionHeld}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today's Rental Income</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">₹{todayRentalRevenue}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Unified Customer Auto-Sync Search Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm relative">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserCheck size={14} /> Search & Auto-Sync Unified Customer ID
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Type Customer ID (CST-1001), Phone (+91...), Room # (101), or Wristband Tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-slate-400 outline-none transition"
              />
            </div>
          </div>

          {/* Selected Customer Info Card */}
          {selectedCustomer ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 min-w-[280px] flex items-center justify-between gap-3 shadow-xs">
              <div>
                <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  {selectedCustomer.name}
                  <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                    {selectedCustomer.customerCode || 'Synced'}
                  </span>
                </p>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Phone: {selectedCustomer.phone} {selectedCustomer.roomNumber ? `• Room: ${selectedCustomer.roomNumber}` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Clear selection"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Search above to auto-fill guest profile from Ticket Counter or Check-In.
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchQuery && !selectedCustomer && (
          <div className="mt-3 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-lg z-20 relative">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(c => (
                <div
                  key={c.id || c.customerCode}
                  onClick={() => handleSelectCustomer(c)}
                  className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs transition"
                >
                  <div>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="ml-2 font-mono text-indigo-600">({c.customerCode})</span>
                    <span className="ml-2 text-slate-500">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.roomNumber && <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">Room {c.roomNumber}</span>}
                    <span className="text-indigo-600 font-semibold">Select →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-xs text-slate-500 flex items-center justify-between">
                <span>No customer found matching "{searchQuery}".</span>
                <button
                  onClick={() => handleSelectCustomer({
                    customerCode: `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: searchQuery,
                    phone: searchQuery.match(/^\+?\d+$/) ? searchQuery : '+91 98765 00000',
                    roomNumber: '',
                    wristbandId: ''
                  })}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  + Auto-Create Profile "{searchQuery}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('issue')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'issue'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key size={14} /> Issue Locker & Costumes
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'returns'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw size={14} /> Returns & Caution Refunds ({activeIssues.length})
        </button>
        <button
          onClick={() => setActiveTab('lockers_grid')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'lockers_grid'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Hash size={14} /> Visual Locker Grid
        </button>
        <button
          onClick={() => setActiveTab('costume_stock')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'costume_stock'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
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
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  Select Locker
                </h3>
                <span className="text-xs text-slate-400 font-normal">Optional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div
                  onClick={() => setSelectedLockerId('')}
                  className={`p-3 rounded-xl border-2 cursor-pointer text-xs transition ${
                    selectedLockerId === ''
                      ? 'bg-slate-100 border-slate-400 text-slate-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold">No Locker</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Costumes / Towel only</p>
                </div>
                {(lockersList || []).filter(l => l.status === 'available').map(l => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLockerId(l.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer text-xs transition relative ${
                      selectedLockerId === l.id
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-indigo-600 font-mono">{l.lockerNumber}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">{l.sizeCategory}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{l.zone}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-600">Rent: ₹{l.rentalFee}</span>
                      <span className="text-amber-600 font-bold">Dep: ₹{l.securityDeposit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Select Swimwear & Towels */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                Select Costumes & Towels
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(costumesList || []).map(c => {
                  const selObj = selectedCostumes.find(sc => sc.costumeId === c.id);
                  const selQty = selObj ? selObj.quantity : 0;
                  return (
                    <div key={c.id} className="p-3.5 bg-white flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                          <span className="bg-slate-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-mono font-bold">{c.code}</span>
                          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded">{c.category} ({c.size})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Rent: <span className="text-slate-800 font-semibold">₹{c.rentalFee}</span> • Caution Deposit: <span className="text-amber-600 font-semibold">₹{c.securityDeposit}</span> • Available Stock: <span className="text-emerald-600 font-bold">{c.availableStock}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleToggleCostume(c, selQty - 1)}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold transition flex items-center justify-center shadow-xs"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-extrabold text-sm text-slate-800">{selQty}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCostume(c, selQty + 1)}
                          disabled={selQty >= c.availableStock}
                          className="w-7 h-7 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg font-bold transition flex items-center justify-center shadow-xs"
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800">Rental Summary & Charges</h3>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {selectedCustomer ? selectedCustomer.customerCode || 'Synced' : 'No Guest'}
                </span>
              </div>

              {/* Guest Details Box */}
              {selectedCustomer ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs">
                  <p className="font-bold text-slate-800">{selectedCustomer.name}</p>
                  <p className="text-slate-500 mt-0.5">Phone: {selectedCustomer.phone}</p>
                  {selectedCustomer.roomNumber && <p className="text-slate-500">Room: {selectedCustomer.roomNumber}</p>}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" /> Select guest profile from top search bar.
                </div>
              )}

              {/* Selection Overview */}
              <div className="text-xs space-y-2 mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Locker Selected:</span>
                  <span className="font-bold text-slate-800">{selectedLockerObj ? selectedLockerObj.lockerNumber : 'None'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Costumes & Towels Selected:</span>
                  {selectedCostumes.length > 0 ? (
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
                      {selectedCostumes.map(sc => (
                        <div key={sc.costumeId} className="flex justify-between text-slate-700">
                          <span>{sc.name} x{sc.quantity}</span>
                          <span className="font-semibold text-slate-900">₹{(sc.rentalFee + sc.deposit) * sc.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No costume selected</span>
                  )}
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Total Rental Fee:</span>
                  <span className="font-bold text-slate-800">₹{totalRentalFee}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Caution Deposit (Refundable):</span>
                  <span className="font-bold">₹{totalDepositHeld}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-indigo-600">
                  <span>Grand Total Paid:</span>
                  <span>₹{grandTotalPaid}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['UPI', 'Cash', 'Card'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-xl font-bold border transition ${
                        paymentMode === mode
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Issue Locker & Print Receipt (₹{grandTotalPaid})
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: RETURNS & CAUTION REFUNDS */}
      {activeTab === 'returns' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <RotateCcw size={16} className="text-amber-500" /> Active Rental Issues & Caution Refund Counter
            </h3>
            <span className="text-xs text-slate-500">{activeIssues.length} active issues</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Issue #</th>
                  <th className="p-3.5">Guest Name & ID</th>
                  <th className="p-3.5">Locker #</th>
                  <th className="p-3.5">Issued Costumes</th>
                  <th className="p-3.5">Caution Deposit</th>
                  <th className="p-3.5">Issued At</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeIssues.length > 0 ? (
                  activeIssues.map(issue => (
                    <tr key={issue.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">{issue.issueNumber || issue.issue_number}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800">{issue.guestName || issue.guest_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{issue.customerCode || issue.customer_code} • {issue.guestPhone || issue.guest_phone}</p>
                      </td>
                      <td className="p-3.5">
                        {(issue.lockerNumber || issue.locker_number) ? (
                          <span className="bg-indigo-50 text-indigo-700 font-mono font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
                            {issue.lockerNumber || issue.locker_number}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {(issue.costumes || []).map((c, i) => (
                          <span key={i} className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] mr-1 mb-1 font-medium">
                            {c.name} (x{c.quantity})
                          </span>
                        ))}
                      </td>
                      <td className="p-3.5 font-extrabold text-amber-600">₹{issue.totalDepositHeld || issue.total_deposit_held}</td>
                      <td className="p-3.5 text-slate-500 text-[11px]">{issue.issuedAt || issue.issued_at}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setReturnModalIssue(issue)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 ml-auto"
                        >
                          <RotateCcw size={14} /> Process Return & Refund
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      No active issued costumes or lockers currently.
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
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Visual Locker Grid View</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Available
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span> Assigned
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {(lockersList || []).map(l => (
              <div
                key={l.id}
                className={`p-4 rounded-xl border-2 flex flex-col justify-between transition ${
                  l.status === 'assigned'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-lg text-slate-900 font-mono">{l.lockerNumber}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      l.status === 'assigned' ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{l.zone}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 text-xs">
                  {l.status === 'assigned' ? (
                    <div>
                      <p className="font-bold text-slate-900 truncate">{l.assignedTo}</p>
                      <p className="text-[10px] text-rose-700 font-mono mt-0.5">{l.assignedCustomerCode}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Ready for rental</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COSTUME STOCK REGISTER */}
      {activeTab === 'costume_stock' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Shirt size={16} className="text-emerald-600" /> Swimwear & Costume Inventory Register
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Item Code</th>
                  <th className="p-3.5">Costume Name</th>
                  <th className="p-3.5">Category / Size</th>
                  <th className="p-3.5">Total Stock</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Rental Fee</th>
                  <th className="p-3.5">Caution Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(costumesList || []).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{c.code}</td>
                    <td className="p-3.5 font-bold text-slate-800">{c.name}</td>
                    <td className="p-3.5 text-slate-600">{c.category} ({c.size})</td>
                    <td className="p-3.5 font-bold text-slate-800">{c.totalStock}</td>
                    <td className="p-3.5 font-extrabold text-emerald-600">{c.availableStock}</td>
                    <td className="p-3.5 text-slate-800">₹{c.rentalFee}</td>
                    <td className="p-3.5 text-amber-600 font-semibold">₹{c.securityDeposit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {receiptIssue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800">
            <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">YOYO FUN N FOODS RESORT</h2>
              <p className="text-[11px] text-slate-500 font-medium">Waterpark Costume & Locker Slip</p>
              <p className="text-[10px] text-indigo-600 font-mono mt-1">Receipt #: {receiptIssue.issueNumber}</p>
            </div>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name:</span>
                <span className="font-bold text-slate-900">{receiptIssue.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Code:</span>
                <span className="font-mono font-bold text-indigo-600">{receiptIssue.customerCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-800">{receiptIssue.guestPhone}</span>
              </div>
              {receiptIssue.lockerNumber && (
                <div className="flex justify-between bg-indigo-50 p-2 rounded-lg text-indigo-900 font-bold border border-indigo-100">
                  <span>Locker Number:</span>
                  <span>{receiptIssue.lockerNumber}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-3 mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Issued Items</p>
              {(receiptIssue.costumes || []).map((c, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>{c.name} x{c.quantity}</span>
                  <span className="font-semibold">₹{(c.rentalFee + c.deposit) * c.quantity}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs mb-4 border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Rental Fee:</span>
                <span className="font-bold">₹{receiptIssue.totalRentalFee}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Caution Deposit Held:</span>
                <span className="font-bold">₹{receiptIssue.totalDepositHeld}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-extrabold text-sm text-indigo-600">
                <span>Total Paid ({receiptIssue.paymentMode}):</span>
                <span>₹{receiptIssue.grandTotalPaid}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setReceiptIssue(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND RECEIPT MODAL */}
      {refundReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800">
            <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">CAUTION DEPOSIT REFUND SLIP</h2>
              <p className="text-[11px] text-slate-500 font-medium">YOYO Fun N Foods Resort</p>
              <p className="text-[10px] text-amber-600 font-mono mt-1">Ref #: {refundReceipt.issue?.issueNumber}</p>
            </div>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name:</span>
                <span className="font-bold text-slate-900">{refundReceipt.issue?.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Caution Deposit Held:</span>
                <span className="font-bold text-amber-600">₹{refundReceipt.issue?.totalDepositHeld}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Damage Fine:</span>
                <span className="font-bold text-rose-600">₹{refundReceipt.damageFine}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 font-extrabold text-sm flex justify-between mb-4">
              <span>Net Refund Paid to Guest:</span>
              <span>₹{refundReceipt.refundAmount}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRefundReceipt(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Print Refund Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RETURN & CAUTION REFUND FORM */}
      {returnModalIssue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <RotateCcw size={16} className="text-amber-500" /> Return & Refund Caution Deposit
              </h3>
              <button onClick={() => setReturnModalIssue(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">{returnModalIssue.guestName}</p>
                <p className="text-slate-500 font-mono">{returnModalIssue.customerCode} • {returnModalIssue.guestPhone}</p>
                {returnModalIssue.lockerNumber && (
                  <p className="text-indigo-600 font-bold mt-1">Locker Number: {returnModalIssue.lockerNumber}</p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center text-amber-900 font-bold">
                <span>Caution Deposit Held:</span>
                <span className="text-base font-extrabold text-amber-600">₹{returnModalIssue.totalDepositHeld}</span>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Damage / Loss Fine (If key or costume lost):</label>
                <input
                  type="number"
                  min="0"
                  max={returnModalIssue.totalDepositHeld}
                  value={damageFine}
                  onChange={(e) => setDamageFine(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Remarks / Inspection Notes:</label>
                <textarea
                  rows="2"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned locker key intact, towel returned clean."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                ></textarea>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center text-sm font-extrabold text-emerald-800">
                <span>Net Refund to Guest:</span>
                <span>₹{Math.max(0, (returnModalIssue.totalDepositHeld || 0) - Number(damageFine))}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalIssue(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shirt size={16} className="text-indigo-600" /> Add New Swimwear / Costume Item
              </h3>
              <button onClick={() => setShowAddCostumeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCostume} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Item Code (e.g. CST-M-L)</label>
                <input
                  type="text"
                  required
                  value={newCostume.code}
                  onChange={(e) => setNewCostume({ ...newCostume, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Costume Name</label>
                <input
                  type="text"
                  required
                  value={newCostume.name}
                  onChange={(e) => setNewCostume({ ...newCostume, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select
                    value={newCostume.category}
                    onChange={(e) => setNewCostume({ ...newCostume, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Unisex">Unisex / Towels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Size</label>
                  <input
                    type="text"
                    value={newCostume.size}
                    onChange={(e) => setNewCostume({ ...newCostume, size: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Total Stock</label>
                  <input
                    type="number"
                    value={newCostume.totalStock}
                    onChange={(e) => setNewCostume({ ...newCostume, totalStock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Rental Fee (₹)</label>
                  <input
                    type="number"
                    value={newCostume.rentalFee}
                    onChange={(e) => setNewCostume({ ...newCostume, rentalFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Caution Dep. (₹)</label>
                  <input
                    type="number"
                    value={newCostume.securityDeposit}
                    onChange={(e) => setNewCostume({ ...newCostume, securityDeposit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCostumeModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Key size={16} className="text-indigo-600" /> Create New Locker
              </h3>
              <button onClick={() => setShowAddLockerModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLocker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Locker Number (e.g. L-106)</label>
                <input
                  type="text"
                  required
                  value={newLocker.lockerNumber}
                  onChange={(e) => setNewLocker({ ...newLocker, lockerNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Zone Area</label>
                  <select
                    value={newLocker.zone}
                    onChange={(e) => setNewLocker({ ...newLocker, zone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                  >
                    <option value="Men Changing Area">Men Changing Area</option>
                    <option value="Ladies Changing Area">Ladies Changing Area</option>
                    <option value="VIP Locker Room">VIP Locker Room</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Size Category</label>
                  <select
                    value={newLocker.sizeCategory}
                    onChange={(e) => setNewLocker({ ...newLocker, sizeCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
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
                  <label className="block text-slate-600 font-semibold mb-1">Rental Fee (₹)</label>
                  <input
                    type="number"
                    value={newLocker.rentalFee}
                    onChange={(e) => setNewLocker({ ...newLocker, rentalFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Caution Deposit (₹)</label>
                  <input
                    type="number"
                    value={newLocker.securityDeposit}
                    onChange={(e) => setNewLocker({ ...newLocker, securityDeposit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLockerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
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
