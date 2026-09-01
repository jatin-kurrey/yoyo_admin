import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { pmsService } from '../services/pmsService';
import {
  Key, Search, Plus, RotateCcw, CheckCircle, AlertTriangle, UserCheck,
  ShieldAlert, DollarSign, Shirt, Hash, X, Printer, User, UserPlus
} from 'lucide-react';

export default function CostumeLockerPage() {
  const { user, customers, lockers: ctxLockers, costumes: ctxCostumes, costumeIssues: ctxIssues, dispatch, showToast } = useApp();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

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
      if (locRes.status === 'fulfilled' && locRes.value?.success && locRes.value?.data?.length > 0) {
        setLockersList(locRes.value.data);
      } else {
        setLockersList(ctxLockers && ctxLockers.length > 0 ? ctxLockers : []);
      }

      if (cosRes.status === 'fulfilled' && cosRes.value?.success && cosRes.value?.data?.length > 0) {
        setCostumesList(cosRes.value.data);
      } else {
        setCostumesList(ctxCostumes && ctxCostumes.length > 0 ? ctxCostumes : []);
      }

      if (issRes.status === 'fulfilled' && issRes.value?.success && issRes.value?.data?.length > 0) {
        setIssuesList(issRes.value.data);
      } else {
        setIssuesList(ctxIssues && ctxIssues.length > 0 ? ctxIssues : []);
      }
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

  // Update costume quantities
  const handleUpdateCostumeQty = (costume, qty) => {
    const costumeId = costume.id || costume.code;
    const existingIdx = selectedCostumes.findIndex(c => c.costumeId === costumeId || c.code === costume.code);
    if (qty <= 0) {
      if (existingIdx >= 0) {
        setSelectedCostumes(selectedCostumes.filter(c => c.costumeId !== costumeId && c.code !== costume.code));
      }
      return;
    }
    const itemData = {
      costumeId: costumeId,
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
    } catch (err) {}

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

        {isSuperAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddLockerModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} className="text-indigo-600" /> Add Locker
            </button>
            <button
              onClick={() => setShowAddCostumeModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shirt size={14} /> Add Costume Item
            </button>
          </div>
        )}
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
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

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Rentals</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{activeIssues.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Shirt size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Caution Deposit Held</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">₹{totalCautionHeld}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today's Rental Income</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">₹{todayRentalRevenue}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 bg-white p-1.5 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('issue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'issue'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Key size={15} /> Issue Locker & Costumes
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw size={15} /> Returns & Caution Refunds
          {activeIssues.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'returns' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {activeIssues.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('lockers_grid')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'lockers_grid'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Hash size={15} /> Visual Locker Grid
        </button>
        <button
          onClick={() => setActiveTab('costumes_stock')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'costumes_stock'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shirt size={15} /> Costume Stock & Pricing
        </button>
      </div>

      {/* TAB 1: ISSUE LOCKER & COSTUMES */}
      {activeTab === 'issue' && (
        <div className="space-y-6">
          {/* Customer Search & Quick Sync Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserCheck size={14} /> Step 1: Search & Auto-Sync Customer ID (Or Type Mobile)
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Type Customer ID (CST-1001), Phone (+91...), Room # (101), or Wristband Tag and press Enter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredCustomers.length > 0) {
                          handleSelectCustomer(filteredCustomers[0]);
                        } else if (searchQuery.trim()) {
                          handleSelectCustomer({
                            customerCode: searchQuery.trim().startsWith('CST') ? searchQuery.trim() : `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                            name: searchQuery.trim(),
                            phone: searchQuery.trim().match(/^\+?\d+$/) ? searchQuery.trim() : '+91 98765 00000',
                            roomNumber: '',
                            wristbandId: ''
                          });
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Selected Customer Info Card */}
              {selectedCustomer ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 min-w-[280px] flex items-center justify-between gap-3 shadow-2xs">
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
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    title="Clear selection"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>Search by <b>Customer ID</b> or type guest & press <b>Enter</b></span>
                </div>
              )}
            </div>

            {/* Quick Result Pills */}
            {searchQuery && !selectedCustomer && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 mt-3">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Matching:</span>
                {filteredCustomers.slice(0, 5).map((c) => (
                  <button
                    key={c.id || c.customerCode}
                    onClick={() => handleSelectCustomer(c)}
                    className="px-3 py-1 bg-slate-100 hover:bg-indigo-100 border border-slate-200 hover:border-indigo-300 rounded-full text-xs text-slate-700 hover:text-indigo-900 font-medium transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <User size={12} className="text-indigo-600" />
                    {c.name} ({c.customerCode})
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <button
                    onClick={() => handleSelectCustomer({
                      customerCode: `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                      name: searchQuery,
                      phone: '+91 98765 00000',
                    })}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={12} /> Register "{searchQuery}" as New Guest
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2-Column Issue Counter Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 7-COL: Locker & Costume Selector */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 2: Locker Selector */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={16} className="text-indigo-600" /> Step 2: Select Locker (Optional)
                  </h3>
                  {selectedLockerId && (
                    <button
                      onClick={() => setSelectedLockerId('')}
                      className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
                    >
                      Clear Locker
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-[160px] overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {(lockersList || []).map((l) => {
                    const isAssigned = l.status === 'assigned' || l.status === 'occupied';
                    const isSelected = selectedLockerId === l.id || selectedLockerId === l.lockerNumber;
                    return (
                      <button
                        key={l.id || l.lockerNumber}
                        type="button"
                        disabled={isAssigned}
                        onClick={() => setSelectedLockerId(l.id || l.lockerNumber)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300 shadow-md font-bold scale-105'
                            : isAssigned
                            ? 'bg-slate-200/70 border-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                            : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800 font-semibold'
                        }`}
                      >
                        <div className="text-xs font-mono font-black">{l.lockerNumber}</div>
                        <div className="text-[9px] mt-0.5 opacity-90 truncate">{l.sizeCategory || 'Medium'}</div>
                        <div className="text-[8px] mt-0.5 font-bold">₹{l.rentalFee + l.securityDeposit}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Costume & Towel Selection */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Shirt size={16} className="text-indigo-600" /> Step 3: Select Swimwear & Towel Quantities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(costumesList || []).map((c) => {
                    const costumeId = c.id || c.code;
                    const selectedCostumeObj = selectedCostumes.find(sc => sc.costumeId === costumeId || sc.code === c.code);
                    const qty = selectedCostumeObj ? selectedCostumeObj.quantity : 0;
                    return (
                      <div key={c.id || c.code} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">{c.name}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                              {c.size || 'M'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Rent: <b className="text-indigo-600">₹{c.rentalFee}</b> • Caution Deposit: <b className="text-amber-600">₹{c.securityDeposit}</b>
                          </div>
                        </div>

                        {/* Counter controls */}
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateCostumeQty(c, Math.max(0, qty - 1))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer disabled:opacity-40"
                            disabled={qty === 0}
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-black text-slate-800">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCostumeQty(c, qty + 1)}
                            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-bold transition cursor-pointer"
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

            {/* RIGHT 5-COL: Billing Summary & Instant Payment */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5 h-fit">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <DollarSign size={16} className="text-indigo-600" /> Summary & Payment Mode
              </h3>

              {/* Price Table */}
              <div className="space-y-2 text-xs">
                {selectedLockerObj && (
                  <div className="flex justify-between text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Locker #{selectedLockerObj.lockerNumber} ({selectedLockerObj.sizeCategory}):</span>
                    <span className="font-bold text-slate-900">₹{selectedLockerObj.rentalFee} (Dep: ₹{selectedLockerObj.securityDeposit})</span>
                  </div>
                )}

                {selectedCostumes.map((c) => (
                  <div key={c.costumeId || c.code} className="flex justify-between text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>{c.name} (x{c.quantity}):</span>
                    <span className="font-bold text-slate-900">₹{c.rentalFee * c.quantity} (Dep: ₹{c.deposit * c.quantity})</span>
                  </div>
                ))}

                {selectedCostumes.length === 0 && !selectedLockerObj && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No items selected yet.</p>
                )}
              </div>

              {/* Breakdown Box */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Total Rental Fee:</span>
                  <span className="font-bold text-slate-900">₹{totalRentalFee}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Refundable Caution Deposit:</span>
                  <span className="font-bold text-amber-700">₹{totalDepositHeld}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-indigo-950 pt-2 border-t border-indigo-200">
                  <span>Grand Total Payable:</span>
                  <span className="text-indigo-700">₹{grandTotalPaid}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Cash', 'Card'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMode(pm)}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                        paymentMode === pm
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleIssueSubmit}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle size={18} /> Issue Locker & Costumes (₹{grandTotalPaid})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETURNS & CAUTION REFUNDS */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw size={16} className="text-amber-600" /> Active Rentals & Caution Deposit Refunds ({activeIssues.length})
            </h3>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Total Caution Held: ₹{totalCautionHeld}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeIssues.map((issue) => (
              <div key={issue.id} className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-2xs space-y-4 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      {issue.guestName || issue.guest_name || 'Guest'}
                      {issue.lockerNumber && (
                        <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-md font-mono font-bold">
                          Locker #{issue.lockerNumber}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Phone: {issue.guestPhone || issue.guest_phone || 'N/A'} {issue.customerCode ? `• ID: ${issue.customerCode}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full">
                    Active
                  </span>
                </div>

                {/* Costume Items */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">Issued Items:</span>
                  {(issue.costumes || []).map((c, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{c.name || 'Item'} (x{c.quantity || 1})</span>
                      <span className="font-bold text-slate-900">₹{(c.rentalFee || 0) * (c.quantity || 1)}</span>
                    </div>
                  ))}
                  {(!issue.costumes || issue.costumes.length === 0) && (
                    <p className="text-slate-400 italic text-[11px]">No extra costumes issued.</p>
                  )}
                </div>

                {/* Refund Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Caution Deposit Held</div>
                    <div className="text-base font-black text-amber-600">₹{issue.totalDepositHeld || issue.total_deposit_held || 0}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnModalIssue(issue);
                      setDamageFine(0);
                      setReturnNotes('');
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={14} /> Refund Deposit (₹{issue.totalDepositHeld || issue.total_deposit_held || 0})
                  </button>
                </div>
              </div>
            ))}

            {activeIssues.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                <Key size={36} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No Active Rentals Right Now</p>
                <p className="text-xs text-slate-400">All issued lockers and costumes have been returned cleanly.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL LOCKER GRID */}
      {activeTab === 'lockers_grid' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Hash size={16} className="text-blue-600" /> Real-Time Visual Locker Grid
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any available green locker to auto-select and jump to Issue Counter.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Available ({lockersList.filter(l => l.status !== 'assigned' && l.status !== 'occupied').length})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Occupied ({assignedLockersCount})</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {(lockersList || []).map((l) => {
              const isAssigned = l.status === 'assigned' || l.status === 'occupied';
              return (
                <button
                  key={l.id || l.lockerNumber}
                  type="button"
                  onClick={() => {
                    if (!isAssigned) {
                      setSelectedLockerId(l.id || l.lockerNumber);
                      setActiveTab('issue');
                      showToast(`Selected Locker #${l.lockerNumber}`);
                    }
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all shadow-2xs cursor-pointer ${
                    isAssigned
                      ? 'bg-amber-50 border-amber-200 text-amber-800 opacity-80 cursor-not-allowed'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900 font-bold hover:scale-105'
                  }`}
                >
                  <div className="text-sm font-mono font-black">{l.lockerNumber}</div>
                  <div className="text-[10px] mt-0.5 opacity-80">{l.sizeCategory || 'Medium'}</div>
                  <div className="text-[9px] mt-1 font-extrabold">{isAssigned ? 'Occupied' : `₹${l.rentalFee + l.securityDeposit}`}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: COSTUME INVENTORY & PRICING */}
      {activeTab === 'costumes_stock' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shirt size={16} className="text-emerald-600" /> Swimwear & Towels Master Stock Catalog
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage item pricing, rental fees, caution deposits & available inventory stock.</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddCostumeModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add New Costume
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Category & Size</th>
                  <th className="p-3.5">Total Stock</th>
                  <th className="p-3.5">Available</th>
                  <th className="p-3.5">Rental Fee</th>
                  <th className="p-3.5">Caution Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(costumesList || []).map(c => (
                  <tr key={c.id || c.code} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{c.code}</td>
                    <td className="p-3.5 font-bold text-slate-800">{c.name}</td>
                    <td className="p-3.5 text-slate-600">{c.category} ({c.size})</td>
                    <td className="p-3.5 font-bold text-slate-800">{c.totalStock}</td>
                    <td className="p-3.5 font-extrabold text-emerald-600">{c.availableStock}</td>
                    <td className="p-3.5 text-slate-800 font-bold">₹{c.rentalFee}</td>
                    <td className="p-3.5 text-amber-600 font-bold">₹{c.securityDeposit}</td>
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
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
              <button onClick={() => setReturnModalIssue(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
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
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
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
              <button onClick={() => setShowAddCostumeModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
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
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
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
              <button onClick={() => setShowAddLockerModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
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
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
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
