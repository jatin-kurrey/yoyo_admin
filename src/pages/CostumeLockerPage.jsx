import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { pmsService } from '../services/pmsService';
import {
  Key, Search, Plus, RotateCcw, CheckCircle, AlertTriangle, UserCheck,
  ShieldAlert, DollarSign, Shirt, Hash, X, Printer, User, UserPlus,
  Zap, Sliders, ChevronDown, ShoppingBag, History, CreditCard, Banknote, Smartphone
} from 'lucide-react';

export default function CostumeLockerPage() {
  const { defaultRules, user, customers, lockers: ctxLockers, costumes: ctxCostumes, costumeIssues: ctxIssues, dispatch, showToast } = useApp();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin' || !user?.role;
  const rawMode = defaultRules?.costumeLockerMode || 'express';
  let currentMode = 'express';
  if (rawMode === 'tabs') currentMode = 'tabs';
  else if (rawMode === 'enterprise' || rawMode === 'advanced') currentMode = 'enterprise';

  const [activeTab, setActiveTab] = useState('issue'); // issue, returns, lockers_grid, costume_stock
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showActiveDrawer, setShowActiveDrawer] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
    if (e && e.preventDefault) e.preventDefault();
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
    if (e && e.preventDefault) e.preventDefault();
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
  const assignedLockersCount = (lockersList || []).filter(l => l.status === 'assigned' || l.status === 'occupied').length;
  const activeIssues = (issuesList || []).filter(i => i.status === 'issued' || i.status === 'active');
  const totalCautionHeld = activeIssues.reduce((acc, i) => acc + (i.totalDepositHeld || i.total_deposit_held || 0), 0);
  const todayRentalRevenue = (issuesList || []).reduce((acc, i) => acc + (i.totalRentalFee || i.total_rental_fee || 0), 0);

  // Stepper progress state calculation
  const currentStep = !selectedCustomer ? 1 : !selectedLockerId ? 2 : selectedCostumes.length === 0 ? 3 : 4;

  const handleModeSwitch = (mode) => {
    dispatch({ type: 'SET_COSTUME_LOCKER_MODE', payload: mode });
    const labels = {
      express: '⚡ Express Counter',
      tabs: '🗂️ Multi-Tab Registers',
      enterprise: '🚀 Enterprise Management'
    };
    showToast(`Switched to ${labels[mode]}`);
  };

  return (
    <div className="h-[calc(100vh-1rem)] flex-1 bg-slate-50 p-4 md:p-5 overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Costume & Locker Management</h1>
          <p className="text-xs text-slate-500">
            Issue lockers, swimwear costumes, towels & manage caution deposits
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Today's Summary Pill */}
          <div className="hidden lg:flex items-center bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs font-semibold text-slate-600 gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Today's Summary</span>
            <span>Rental <b className="text-emerald-600">₹{todayRentalRevenue}</b></span>
            <span>•</span>
            <span>Deposit <b className="text-amber-600">₹{totalCautionHeld}</b></span>
            <span>•</span>
            <span>Active <b className="text-indigo-600">{activeIssues.length}</b></span>
          </div>

          {/* Active Rentals Drawer Toggle */}
          <button
            onClick={() => setShowActiveDrawer(!showActiveDrawer)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag size={14} className="text-emerald-600" /> Active Rentals ({activeIssues.length})
          </button>

          {/* Counter Mode Switcher Dropdown (3 MODES!) */}
          <div className="relative group">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Counter</span>
              <select
                value={currentMode}
                onChange={(e) => handleModeSwitch(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-lg px-2.5 py-1 outline-none cursor-pointer border-none transition"
              >
                <option value="express">⚡ Express Counter</option>
                <option value="tabs">🗂️ Multi-Tab Registers</option>
                <option value="enterprise">🚀 Enterprise Full Suite</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
         MODE 1: ⚡ EXPRESS COUNTER (Modern 1-Page Stepper Wizard + Side Drawer)
         Matches user screenshot with pixel perfection!
         ========================================================================= */}
      {currentMode === 'express' && (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 items-stretch overflow-hidden">
          {/* Main Form Column (Left) */}
          <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-y-auto pr-1">
            {/* Stepper Progress Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex items-center justify-between max-w-2xl mx-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('sec-customer');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex items-center gap-2 text-xs font-bold transition hover:opacity-80 cursor-pointer ${currentStep >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${currentStep >= 1 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>1</span>
                Customer
              </button>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('sec-locker');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`flex items-center gap-2 text-xs font-bold transition hover:opacity-80 cursor-pointer ${currentStep >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${currentStep >= 2 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>2</span>
                Locker
              </button>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('sec-items');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`flex items-center gap-2 text-xs font-bold transition hover:opacity-80 cursor-pointer ${currentStep >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${currentStep >= 3 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>3</span>
                Items
              </button>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('sec-payment');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }}
                className={`flex items-center gap-2 text-xs font-bold transition hover:opacity-80 cursor-pointer ${currentStep >= 4 ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${currentStep >= 4 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>4</span>
                Payment
              </button>
            </div>

            {/* Section 1: Search Customer Card */}
            <div id="sec-customer" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Search Customer</h3>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by Mobile, Customer ID, Room No, or Wristband..."
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
                            phone: searchQuery.trim().match(/^\+?\d+$/) ? searchQuery.trim() : '+91 98765 11223',
                            roomNumber: '101',
                            wristbandId: 'W-7854'
                          });
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-slate-400 outline-none transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (filteredCustomers.length > 0) {
                      handleSelectCustomer(filteredCustomers[0]);
                    } else if (searchQuery.trim()) {
                      handleSelectCustomer({
                        customerCode: searchQuery.trim().startsWith('CST') ? searchQuery.trim() : `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                        name: searchQuery.trim(),
                        phone: searchQuery.trim().match(/^\+?\d+$/) ? searchQuery.trim() : '+91 98765 11223',
                        roomNumber: '101',
                        wristbandId: 'W-7854'
                      });
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Search size={14} /> Search
                </button>
              </div>

              {/* Selected Customer Card */}
              {selectedCustomer ? (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-200">
                      {selectedCustomer.name ? selectedCustomer.name[0].toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{selectedCustomer.name}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        <b className="font-mono text-emerald-700">{selectedCustomer.customerCode || 'CST-1001'}</b> • Room {selectedCustomer.roomNumber || '101'} • {selectedCustomer.phone}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Wristband: {selectedCustomer.wristbandId || 'W-7854'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <History size={13} /> View Rental History
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>Search above by <b>Customer ID</b> or type guest name/phone & press <b>Enter</b></span>
                </div>
              )}
            </div>

            {/* Section 2: Select Locker Card */}
            <div id="sec-locker" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Select Locker</h3>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Occupied</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Maintenance</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(lockersList || []).slice(0, 5).map((l) => {
                  const isAssigned = l.status === 'assigned' || l.status === 'occupied';
                  const isSelected = selectedLockerId === l.id || selectedLockerId === l.lockerNumber;
                  return (
                    <button
                      key={l.id || l.lockerNumber}
                      type="button"
                      disabled={isAssigned}
                      onClick={() => setSelectedLockerId(isSelected ? '' : (l.id || l.lockerNumber))}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-900 shadow-md font-bold'
                          : isAssigned
                          ? 'bg-amber-50 border-amber-200 text-amber-800 cursor-not-allowed opacity-70'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                      }`}
                    >
                      <div className="text-sm font-mono font-black text-slate-900">{l.lockerNumber}</div>
                      <div className="text-xs font-extrabold text-slate-700 mt-1">₹{l.rentalFee + l.securityDeposit}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{l.sizeCategory || 'Medium'}</div>
                      <div className="text-[10px] mt-2 font-extrabold">
                        {isSelected ? (
                          <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Selected</span>
                        ) : isAssigned ? (
                          <span className="text-amber-700">• Occupied</span>
                        ) : (
                          <span className="text-emerald-600">• Available</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Add Items Table */}
            <div id="sec-items" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Add Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px] tracking-wider">
                    <tr>
                      <th className="pb-3">Item</th>
                      <th className="pb-3 text-center">Rent</th>
                      <th className="pb-3 text-center">Qty</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(costumesList || []).map((c) => {
                      const costumeId = c.id || c.code;
                      const selectedCostumeObj = selectedCostumes.find(sc => sc.costumeId === costumeId || sc.code === c.code);
                      const qty = selectedCostumeObj ? selectedCostumeObj.quantity : 0;
                      return (
                        <tr key={c.id || c.code} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                            <Shirt size={14} className="text-indigo-600" />
                            {c.name} ({c.size || 'M'})
                          </td>
                          <td className="py-3 text-center font-bold text-slate-700">₹{c.rentalFee}</td>
                          <td className="py-3 text-center">
                            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateCostumeQty(c, Math.max(0, qty - 1))}
                                className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold shadow-2xs hover:bg-slate-200 transition cursor-pointer disabled:opacity-40"
                                disabled={qty === 0}
                              >
                                -
                              </button>
                              <span className="w-4 text-center font-extrabold text-slate-800">{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCostumeQty(c, qty + 1)}
                                className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-right font-black text-emerald-600 text-sm">
                            ₹{c.rentalFee * qty}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Bottom Payment Bar */}
            <div id="sec-payment" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rental Fee</span>
                    <span className="text-lg font-black text-emerald-600">₹{totalRentalFee}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deposit (Refundable)</span>
                    <span className="text-lg font-black text-amber-600">₹{totalDepositHeld}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payable</span>
                    <span className="text-2xl font-black text-indigo-700">₹{grandTotalPaid}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">Payment Method</span>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'UPI', label: 'UPI', icon: Smartphone },
                      { id: 'Cash', label: 'Cash', icon: Banknote },
                      { id: 'Card', label: 'Card', icon: CreditCard },
                    ].map((pm) => {
                      const IconComp = pm.icon;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMode(pm.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                            paymentMode === pm.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <IconComp size={13} /> {pm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleIssueSubmit}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={18} /> Issue Locker & Print Receipt ₹{grandTotalPaid}
              </button>
            </div>
          </div>

          {/* Active Rentals Side Drawer (Right) */}
          {showActiveDrawer && (
            <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  Active Rentals <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-mono">{activeIssues.length}</span>
                </h3>
                <button onClick={() => setShowActiveDrawer(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {activeIssues.map((issue) => (
                  <div key={issue.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{issue.guestName || issue.guest_name || 'Amit Sharma'}</h4>
                        <p className="text-xs font-bold text-indigo-600 mt-0.5">
                          Locker: {issue.lockerNumber || 'L-101'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {issue.customerCode || 'CST-1001'} • Room {issue.roomNumber || '101'}
                        </p>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 pt-2 border-t border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items</span>
                      {(issue.costumes || []).map((c, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{c.name || 'Gents Swim Costume (L)'}</span>
                          <b className="font-mono">x{c.quantity || 1}</b>
                        </div>
                      ))}
                      {(!issue.costumes || issue.costumes.length === 0) && (
                        <div className="flex justify-between text-slate-500">
                          <span>Standard Swimwear (L)</span>
                          <b className="font-mono">x1</b>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-xs pt-2 border-t border-slate-200/80">
                      <div className="flex justify-between text-slate-600">
                        <span>Rental</span>
                        <b className="text-slate-900 font-extrabold">₹{issue.totalRentalFee || 100}</b>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Deposit (Refundable)</span>
                        <b className="text-amber-600 font-extrabold">₹{issue.totalDepositHeld || 100}</b>
                      </div>
                      <div className="flex justify-between text-indigo-700 font-black pt-1 border-t border-slate-200">
                        <span>Total Paid</span>
                        <span>₹{issue.grandTotalPaid || 200}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReturnModalIssue(issue);
                        setDamageFine(0);
                        setReturnNotes('');
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={14} /> Refund Deposit ₹{issue.totalDepositHeld || 200}
                    </button>
                  </div>
                ))}

                {activeIssues.length === 0 && (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <ShoppingBag size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">No Active Rentals</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         MODE 2: 🗂️ MULTI-TAB REGISTERS (Clean 4-Tab View)
         ========================================================================= */}
      {currentMode === 'tabs' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-1.5 rounded-2xl shadow-2xs">
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'issue' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Key size={15} /> Issue Counter
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'returns' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <RotateCcw size={15} /> Returns & Refunds ({activeIssues.length})
            </button>
            <button
              onClick={() => setActiveTab('lockers_grid')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'lockers_grid' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Hash size={15} /> Visual Locker Grid
            </button>
            <button
              onClick={() => setActiveTab('costumes_stock')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'costumes_stock' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shirt size={15} /> Stock Catalog
            </button>
          </div>

          {/* Tab 1: Issue Counter */}
          {activeTab === 'issue' && (
            <div className="space-y-4">
              {/* Customer Search Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Search Customer</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search by Mobile, Customer ID, Room No, or Wristband..."
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
                              phone: searchQuery.trim().match(/^\+?\d+$/) ? searchQuery.trim() : '+91 98765 11223',
                              roomNumber: '101',
                              wristbandId: 'W-7854'
                            });
                          }
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-slate-400 outline-none transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredCustomers.length > 0) {
                        handleSelectCustomer(filteredCustomers[0]);
                      } else if (searchQuery.trim()) {
                        handleSelectCustomer({
                          customerCode: searchQuery.trim().startsWith('CST') ? searchQuery.trim() : `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                          name: searchQuery.trim(),
                          phone: searchQuery.trim().match(/^\+?\d+$/) ? searchQuery.trim() : '+91 98765 11223',
                          roomNumber: '101',
                          wristbandId: 'W-7854'
                        });
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search size={14} /> Search
                  </button>
                </div>

                {selectedCustomer ? (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-200">
                        {selectedCustomer.name ? selectedCustomer.name[0].toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">{selectedCustomer.name}</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Active</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          <b className="font-mono text-emerald-700">{selectedCustomer.customerCode || 'CST-1001'}</b> • Room {selectedCustomer.roomNumber || '101'} • {selectedCustomer.phone}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>Search above by <b>Customer ID</b> or type guest name/phone & press <b>Enter</b></span>
                  </div>
                )}
              </div>

              {/* Locker Grid & Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Locker Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Select Locker</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(lockersList || []).slice(0, 6).map((l) => {
                      const isAssigned = l.status === 'assigned' || l.status === 'occupied';
                      const isSelected = selectedLockerId === l.id || selectedLockerId === l.lockerNumber;
                      return (
                        <button
                          key={l.id || l.lockerNumber}
                          type="button"
                          disabled={isAssigned}
                          onClick={() => setSelectedLockerId(isSelected ? '' : (l.id || l.lockerNumber))}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-900 shadow-sm font-bold'
                              : isAssigned
                              ? 'bg-amber-50 border-amber-200 text-amber-800 cursor-not-allowed opacity-70'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                          }`}
                        >
                          <div className="text-xs font-mono font-black text-slate-900">{l.lockerNumber}</div>
                          <div className="text-[11px] font-extrabold text-slate-700">₹{l.rentalFee + l.securityDeposit}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Items Table Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Add Items</h3>
                  <div className="space-y-2">
                    {(costumesList || []).map((c) => {
                      const costumeId = c.id || c.code;
                      const selectedCostumeObj = selectedCostumes.find(sc => sc.costumeId === costumeId || sc.code === c.code);
                      const qty = selectedCostumeObj ? selectedCostumeObj.quantity : 0;
                      return (
                        <div key={c.id || c.code} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <span className="font-semibold text-slate-800">{c.name} (₹{c.rentalFee})</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateCostumeQty(c, Math.max(0, qty - 1))}
                              className="w-5 h-5 rounded bg-white text-slate-700 font-bold border border-slate-200 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold w-4 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCostumeQty(c, qty + 1)}
                              className="w-5 h-5 rounded bg-emerald-600 text-white font-bold flex items-center justify-center cursor-pointer"
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

              {/* Bottom Payment Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span>Rental: <b className="text-emerald-600">₹{totalRentalFee}</b></span>
                  <span>Deposit: <b className="text-amber-600">₹{totalDepositHeld}</b></span>
                  <span>Total: <b className="text-indigo-600 text-sm">₹{grandTotalPaid}</b></span>
                </div>
                <button
                  type="button"
                  onClick={handleIssueSubmit}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer size={14} /> Issue Locker & Receipt ₹{grandTotalPaid}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Returns & Caution Refunds */}
          {activeTab === 'returns' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Active Rentals & Pending Caution Refunds</h3>
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {activeIssues.length} Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px]">
                    <tr>
                      <th className="pb-3">Guest Name</th>
                      <th className="pb-3">Customer ID</th>
                      <th className="pb-3 text-center">Locker</th>
                      <th className="pb-3 text-center">Deposit Held</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 font-bold text-slate-900">{issue.guestName || issue.guest_name}</td>
                        <td className="py-3 font-mono text-indigo-600">{issue.customerCode}</td>
                        <td className="py-3 text-center font-bold text-slate-800">{issue.lockerNumber || 'N/A'}</td>
                        <td className="py-3 text-center font-black text-amber-600">₹{issue.totalDepositHeld || 100}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setReturnModalIssue(issue);
                              setDamageFine(0);
                              setReturnNotes('');
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw size={13} /> Refund Deposit ₹{issue.totalDepositHeld || 100}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {activeIssues.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                          No Active Rentals currently pending return.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Visual Locker Grid */}
          {activeTab === 'lockers_grid' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Visual Locker Grid Map</h3>
                {isSuperAdmin && (
                  <button onClick={() => setShowAddLockerModal(true)} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                    + Add Locker
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {(lockersList || []).map((l) => (
                  <div key={l.id || l.lockerNumber} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center space-y-1">
                    <div className="text-sm font-mono font-black text-slate-900">{l.lockerNumber}</div>
                    <div className="text-xs font-bold text-slate-700">₹{l.rentalFee + l.securityDeposit}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${l.status === 'assigned' || l.status === 'occupied' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {l.status === 'assigned' || l.status === 'occupied' ? 'Occupied' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Stock Catalog */}
          {activeTab === 'costumes_stock' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Swimwear & Costume Stock Catalog</h3>
                {isSuperAdmin && (
                  <button onClick={() => setShowAddCostumeModal(true)} className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                    + Add Costume Item
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px]">
                    <tr>
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Costume Name</th>
                      <th className="pb-3 text-center">Category</th>
                      <th className="pb-3 text-center">Size</th>
                      <th className="pb-3 text-center">Total Stock</th>
                      <th className="pb-3 text-right">Rent Fee</th>
                      <th className="pb-3 text-right">Deposit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(costumesList || []).map((c) => (
                      <tr key={c.id || c.code} className="hover:bg-slate-50 transition">
                        <td className="py-3 font-mono font-bold text-slate-900">{c.code}</td>
                        <td className="py-3 font-bold text-indigo-700">{c.name}</td>
                        <td className="py-3 text-center font-semibold text-slate-600">{c.category || 'Unisex'}</td>
                        <td className="py-3 text-center font-bold text-slate-800">{c.size || 'M'}</td>
                        <td className="py-3 text-center font-bold text-emerald-600">{c.totalStock || 30}</td>
                        <td className="py-3 text-right font-black text-slate-900">₹{c.rentalFee}</td>
                        <td className="py-3 text-right font-black text-amber-600">₹{c.securityDeposit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         MODE 3: 🚀 ENTERPRISE FULL SUITE (Master Registers & Catalog)
         ========================================================================= */}
      {currentMode === 'enterprise' && (
        <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-y-auto pr-1">
          {/* Quick Counter Issue Panel (Fully Operational in Enterprise Mode) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap size={16} className="text-emerald-600" /> Counter Issue Terminal
                </h3>
                <p className="text-xs text-slate-500">Issue lockers, costumes & generate slips directly from Enterprise Mode</p>
              </div>
              {selectedCustomer && (
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Guest Loaded: {selectedCustomer.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Col 1: Customer Search */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">1. Customer Lookup</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search ID, Mobile, Room..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredCustomers.length > 0) handleSelectCustomer(filteredCustomers[0]);
                          else if (searchQuery.trim()) {
                            handleSelectCustomer({
                              customerCode: searchQuery.trim().startsWith('CST') ? searchQuery.trim() : `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                              name: searchQuery.trim(),
                              phone: searchQuery.trim().match(/^\+?\d+$/) ? searchQuery.trim() : '+91 98765 11223',
                              roomNumber: '101'
                            });
                          }
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredCustomers.length > 0) handleSelectCustomer(filteredCustomers[0]);
                      else if (searchQuery.trim()) {
                        handleSelectCustomer({
                          customerCode: searchQuery.trim().startsWith('CST') ? searchQuery.trim() : `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                          name: searchQuery.trim(),
                          phone: searchQuery.trim().match(/^\+?\d+$/) ? searchQuery.trim() : '+91 98765 11223',
                          roomNumber: '101'
                        });
                      }
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Search
                  </button>
                </div>
                {selectedCustomer && (
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
                    <div>
                      <b className="text-slate-900">{selectedCustomer.name}</b>
                      <p className="text-[10px] text-emerald-700 font-mono">{selectedCustomer.customerCode} • Room {selectedCustomer.roomNumber || '101'}</p>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-700"><X size={14} /></button>
                  </div>
                )}
              </div>

              {/* Col 2: Locker Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">2. Select Locker</label>
                <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {(lockersList || []).map((l) => {
                    const isAssigned = l.status === 'assigned' || l.status === 'occupied';
                    const isSelected = selectedLockerId === l.id || selectedLockerId === l.lockerNumber;
                    return (
                      <button
                        key={l.id || l.lockerNumber}
                        type="button"
                        disabled={isAssigned}
                        onClick={() => setSelectedLockerId(isSelected ? '' : (l.id || l.lockerNumber))}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-900 font-bold'
                            : isAssigned
                            ? 'bg-amber-50 border-amber-200 text-amber-800 cursor-not-allowed opacity-60'
                            : 'bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                        }`}
                      >
                        <div className="text-xs font-mono font-black">{l.lockerNumber}</div>
                        <div className="text-[10px] text-slate-600">₹{l.rentalFee + l.securityDeposit}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Col 3: Items & Issue Action */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">3. Add Costumes</label>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {(costumesList || []).map((c) => {
                      const costumeId = c.id || c.code;
                      const selectedCostumeObj = selectedCostumes.find(sc => sc.costumeId === costumeId || sc.code === c.code);
                      const qty = selectedCostumeObj ? selectedCostumeObj.quantity : 0;
                      return (
                        <div key={c.id || c.code} className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[120px]">{c.name}</span>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleUpdateCostumeQty(c, Math.max(0, qty - 1))} className="w-4 h-4 rounded bg-white text-slate-700 font-bold border flex items-center justify-center">-</button>
                            <span className="font-bold text-[11px] w-3 text-center">{qty}</span>
                            <button onClick={() => handleUpdateCostumeQty(c, qty + 1)} className="w-4 h-4 rounded bg-emerald-600 text-white font-bold flex items-center justify-center">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleIssueSubmit}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <Printer size={14} /> Issue Locker & Receipt (Total: ₹{grandTotalPaid})
                </button>
              </div>
            </div>
          </div>

          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Rentals</span>
              <div className="text-xl font-black text-slate-900">{activeIssues.length}</div>
              <p className="text-xs text-slate-500">Deposit Held: <b className="text-amber-600 font-bold">₹{totalCautionHeld}</b></p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revenue Today</span>
              <div className="text-xl font-black text-emerald-600">₹{todayRentalRevenue}</div>
              <p className="text-xs text-slate-500">Total Rental Collection</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Lockers</span>
              <div className="text-xl font-black text-indigo-600">{(lockersList || []).length}</div>
              <p className="text-xs text-slate-500">Available: <b className="text-emerald-600 font-bold">{(lockersList || []).filter(l => l.status !== 'assigned' && l.status !== 'occupied').length}</b></p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Swimwear Items</span>
              <div className="text-xl font-black text-blue-600">{(costumesList || []).length} Types</div>
              <p className="text-xs text-slate-500">Total Stock Units: <b className="text-slate-800 font-bold">{(costumesList || []).reduce((acc, c) => acc + (c.totalStock || 30), 0)}</b></p>
            </div>
          </div>

          {/* Active Rental Audit Master Register */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Active Rental & Deposit Audit Register</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time tracking of active locker issues & caution deposit returns.</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
                {activeIssues.length} Active Rentals
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="pb-3">Guest Name</th>
                    <th className="pb-3">Customer ID</th>
                    <th className="pb-3">Room / Wristband</th>
                    <th className="pb-3 text-center">Locker No</th>
                    <th className="pb-3 text-right">Rental Fee</th>
                    <th className="pb-3 text-right">Deposit Held</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-bold text-slate-900">{issue.guestName || issue.guest_name}</td>
                      <td className="py-3 font-mono font-bold text-indigo-600">{issue.customerCode}</td>
                      <td className="py-3 text-slate-600">Room {issue.roomNumber || '101'} • {issue.wristbandId || 'W-7854'}</td>
                      <td className="py-3 text-center font-extrabold text-slate-900">{issue.lockerNumber || 'L-101'}</td>
                      <td className="py-3 text-right font-bold text-emerald-600">₹{issue.totalRentalFee || 100}</td>
                      <td className="py-3 text-right font-black text-amber-600">₹{issue.totalDepositHeld || 100}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setReturnModalIssue(issue);
                            setDamageFine(0);
                            setReturnNotes('');
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw size={13} /> Refund Deposit ₹{issue.totalDepositHeld || 100}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeIssues.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 font-semibold">
                        No active rentals currently pending return.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Locker & Costume Catalog Registers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Locker Master */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Locker Master Directory</h3>
                {isSuperAdmin && (
                  <button onClick={() => setShowAddLockerModal(true)} className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                    + Add Locker
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px]">
                    <tr>
                      <th className="pb-2">Locker No</th>
                      <th className="pb-2">Zone</th>
                      <th className="pb-2 text-right">Rent</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(lockersList || []).map((l) => (
                      <tr key={l.id || l.lockerNumber} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 font-mono font-bold text-slate-900">{l.lockerNumber}</td>
                        <td className="py-2.5 text-slate-600 text-[11px]">{l.zone || 'Men Area'}</td>
                        <td className="py-2.5 text-right font-bold text-slate-800">₹{l.rentalFee + l.securityDeposit}</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.status === 'assigned' || l.status === 'occupied' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {l.status === 'assigned' || l.status === 'occupied' ? 'Occupied' : 'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Costume Master */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Swimwear Stock Catalog</h3>
                {isSuperAdmin && (
                  <button onClick={() => setShowAddCostumeModal(true)} className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                    + Add Costume
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px]">
                    <tr>
                      <th className="pb-2">Code</th>
                      <th className="pb-2">Item Name</th>
                      <th className="pb-2 text-center">Stock</th>
                      <th className="pb-2 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(costumesList || []).map((c) => (
                      <tr key={c.id || c.code} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 font-mono font-bold text-slate-900">{c.code}</td>
                        <td className="py-2.5 font-bold text-indigo-700">{c.name}</td>
                        <td className="py-2.5 text-center font-bold text-emerald-600">{c.totalStock || 30}</td>
                        <td className="py-2.5 text-right font-black text-slate-900">₹{c.rentalFee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
