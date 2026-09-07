import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { pmsService } from '../services/pmsService';
import {
  Key, Search, Plus, RotateCcw, CheckCircle, AlertTriangle, UserCheck,
  ShieldAlert, DollarSign, Shirt, Hash, X, Printer, User, UserPlus,
  Zap, Sliders, ChevronDown, ShoppingBag, History, CreditCard, Banknote, Smartphone, Receipt
} from 'lucide-react';

export default function CostumeLockerPage() {
  const { defaultRules, user, customers, lockers: ctxLockers, costumes: ctxCostumes, costumeIssues: ctxIssues, dispatch, showToast } = useApp();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin' || !user?.role;
  const rawMode = defaultRules?.costumeLockerMode || 'enterprise';
  let currentMode = 'enterprise';
  if (rawMode === 'express' || rawMode === 'simple') currentMode = 'express';
  else if (rawMode === 'tabs') currentMode = 'tabs';
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
  const [selectedLockerIds, setSelectedLockerIds] = useState([]); // Array of selected locker numbers/ids
  const [selectedCostumes, setSelectedCostumes] = useState([]); // [{ costumeId, code, name, quantity, rentalFee, deposit }]
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('');

  // Express Counter Sub-Mode state
  const [expressSubMode, setExpressSubMode] = useState('issue'); // 'issue' or 'return'
  const [expressReturnSearchQuery, setExpressReturnSearchQuery] = useState('');

  // Return Modal state
  const [returnModalIssue, setReturnModalIssue] = useState(null);
  const [damageFine, setDamageFine] = useState(0);
  const [returnNotes, setReturnNotes] = useState('');
  const [refundPaymentMode, setRefundPaymentMode] = useState('Cash');

  // Locker Filters state
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');
  const [lockerSearchQuery, setLockerSearchQuery] = useState('');
  const [lockerStatusFilter, setLockerStatusFilter] = useState('All');
  const [lockerViewMode, setLockerViewMode] = useState('quick'); // 'quick' (+/- category) or 'grid' (virtual locker grid)

  // Live Zone Available Counts
  const totalAvailableLockers = (lockersList || []).filter(l => l.status !== 'assigned' && l.status !== 'occupied').length;
  const menAvailableLockers = (lockersList || []).filter(l => (l.zone || '').includes('Men') && l.status !== 'assigned' && l.status !== 'occupied').length;
  const ladiesAvailableLockers = (lockersList || []).filter(l => (l.zone || '').includes('Ladies') && l.status !== 'assigned' && l.status !== 'occupied').length;
  const vipAvailableLockers = (lockersList || []).filter(l => (l.zone || '').includes('VIP') && l.status !== 'assigned' && l.status !== 'occupied').length;
  const execAvailableLockers = (lockersList || []).filter(l => (l.zone || '').includes('Executive') && l.status !== 'assigned' && l.status !== 'occupied').length;

  // Zone Locker Helpers for Quick (+/-) View
  const getZoneLockers = (zoneKey) => {
    return (lockersList || []).filter(l => (l.zone || '').toLowerCase().includes(zoneKey.toLowerCase()));
  };
  const getAvailableZoneLockers = (zoneKey) => {
    return getZoneLockers(zoneKey).filter(l => l.status !== 'assigned' && l.status !== 'occupied');
  };
  const getSelectedZoneLockers = (zoneKey) => {
    const zoneLockers = getZoneLockers(zoneKey);
    return zoneLockers.filter(l => {
      const locId = l.id || l.lockerNumber;
      return selectedLockerIds.includes(locId) || selectedLockerIds.includes(l.lockerNumber);
    });
  };

  const handleAddZoneLocker = (zoneKey) => {
    const avail = getAvailableZoneLockers(zoneKey);
    const unselectedAvail = avail.filter(l => {
      const locId = l.id || l.lockerNumber;
      return !selectedLockerIds.includes(locId) && !selectedLockerIds.includes(l.lockerNumber);
    });
    if (unselectedAvail.length > 0) {
      const nextLocker = unselectedAvail[0];
      const locId = nextLocker.lockerNumber || nextLocker.id;
      setSelectedLockerIds([...selectedLockerIds, locId]);
    } else {
      showToast(`No more available lockers in ${zoneKey} zone!`, 'error');
    }
  };

  const handleRemoveZoneLocker = (zoneKey) => {
    const selectedInZone = getSelectedZoneLockers(zoneKey);
    if (selectedInZone.length > 0) {
      const lastLocker = selectedInZone[selectedInZone.length - 1];
      const locId = lastLocker.lockerNumber || lastLocker.id;
      setSelectedLockerIds(selectedLockerIds.filter(id => id !== locId && id !== lastLocker.lockerNumber));
    }
  };

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

  // Filter Lockers by Zone, Search, and Status
  const filteredLockers = (lockersList || []).filter(l => {
    const zoneMatch = selectedZoneFilter === 'All' || (l.zone || '').toLowerCase().includes(selectedZoneFilter.toLowerCase());
    const searchMatch = (l.lockerNumber || '').toLowerCase().includes(lockerSearchQuery.toLowerCase()) ||
                        (l.assignedTo || '').toLowerCase().includes(lockerSearchQuery.toLowerCase());
    const statusMatch = lockerStatusFilter === 'All' ||
                        (lockerStatusFilter === 'available' && l.status !== 'assigned' && l.status !== 'occupied') ||
                        (lockerStatusFilter === 'assigned' && (l.status === 'assigned' || l.status === 'occupied'));
    return zoneMatch && searchMatch && statusMatch;
  });

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setSearchQuery(cust.customerCode || cust.phone);
    showToast(`Unified Profile Loaded: ${cust.name} (${cust.customerCode || 'Synced'})`);
  };

  // Toggle multi-locker selection
  const handleToggleLocker = (locker) => {
    const locId = locker.lockerNumber || locker.id;
    if (selectedLockerIds.includes(locId)) {
      setSelectedLockerIds(selectedLockerIds.filter(id => id !== locId));
    } else {
      setSelectedLockerIds([...selectedLockerIds, locId]);
    }
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

  // Calculations for Multi-Locker Issue
  const selectedLockerObjs = (lockersList || []).filter(l => selectedLockerIds.includes(l.id) || selectedLockerIds.includes(l.lockerNumber));
  const lockerRentalFee = selectedLockerObjs.reduce((sum, l) => sum + (l.rentalFee || 100), 0);
  const lockerDeposit = selectedLockerObjs.reduce((sum, l) => sum + (l.securityDeposit || 100), 0);
  const lockerNumbersString = selectedLockerObjs.map(l => l.lockerNumber).join(', ');

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
    if (selectedLockerIds.length === 0 && selectedCostumes.length === 0) {
      showToast('Select at least 1 locker or 1 costume item to issue.', 'error');
      return;
    }

    const payload = {
      customerCode: selectedCustomer.customerCode || `CST-${Math.floor(1000 + Math.random() * 9000)}`,
      guestName: selectedCustomer.name,
      guestPhone: selectedCustomer.phone,
      roomNumber: selectedCustomer.roomNumber || '',
      wristbandId: selectedCustomer.wristbandId || '',
      waterparkTickets: selectedCustomer.waterparkTickets || null,
      lockerNumbers: selectedLockerObjs.map(l => l.lockerNumber),
      lockerNumber: lockerNumbersString || 'No Locker',
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
        locker_id: lockerNumbersString,
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
    setSelectedLockerIds([]);
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
  const currentStep = !selectedCustomer ? 1 : selectedLockerIds.length === 0 ? 2 : selectedCostumes.length === 0 ? 3 : 4;

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
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-slate-50 p-2.5 md:p-3.5 overflow-hidden space-y-2.5">
      {/* TOP COMPACT HEADER & UNIFIED SEARCH BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 px-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm shadow-indigo-200">
            <Key size={16} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight">Costumes & Lockers Counter</h1>
            <p className="text-[10px] text-slate-500 font-medium">Issue lockers, swimwear costumes & caution deposits</p>
          </div>
        </div>

        {/* CENTER: UNIFIED GUEST SEARCH BAR */}
        <div className="flex-1 max-w-xl mx-auto w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Type Customer ID (CST-1001), Phone (+91...), Room # (101), or Wristband Tag..."
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
                      roomNumber: '101',
                      wristbandId: 'W-7854'
                    });
                  }
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 rounded-xl pl-8 pr-20 py-1 text-xs placeholder-slate-400 outline-none transition"
            />
            <button
              type="button"
              onClick={() => {
                if (filteredCustomers.length > 0) handleSelectCustomer(filteredCustomers[0]);
                else if (searchQuery.trim()) {
                  handleSelectCustomer({
                    customerCode: searchQuery.trim().startsWith('CST') ? searchQuery.trim() : `CST-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: searchQuery.trim(),
                    phone: searchQuery.trim().match(/^\+?\d+$/) ? searchQuery.trim() : '+91 98765 11223',
                    roomNumber: '101',
                    wristbandId: 'W-7854'
                  });
                }
              }}
              className="absolute right-1 px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>

        {/* RIGHT: QUICK STATS & RETURNS BUTTON */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center bg-slate-100 px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 gap-1.5">
            <span>Rental <b className="text-emerald-600">₹{todayRentalRevenue}</b></span>
            <span>•</span>
            <span>Deposit <b className="text-amber-600">₹{totalCautionHeld}</b></span>
          </div>

          <button
            type="button"
            onClick={() => setExpressSubMode(expressSubMode === 'return' ? 'issue' : 'return')}
            className={`px-3 py-1 border rounded-xl text-[11px] font-extrabold shadow-2xs transition flex items-center gap-1.5 cursor-pointer ${
              expressSubMode === 'return'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900'
            }`}
          >
            <RotateCcw size={13} /> {expressSubMode === 'return' ? '⬅️ Back to Issue' : `Refund Deposit (${activeIssues.length})`}
          </button>

          {isSuperAdmin && (
            <select
              value={currentMode}
              onChange={(e) => handleModeSwitch(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-[11px] font-extrabold rounded-xl px-2 py-1 outline-none cursor-pointer"
            >
              <option value="enterprise">🚀 Enterprise</option>
              <option value="express">⚡ Express</option>
              <option value="tabs">🗂️ Multi-Tab</option>
            </select>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA: FIXED FIT 100vh SINGLE SCREEN DASHBOARD */}
      {expressSubMode === 'return' ? (
        /* RETURN & CAUTION REFUND VIEW */
        <div className="flex-1 min-h-0 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col space-y-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw size={15} className="text-amber-500" /> Caution Deposit Refund & Locker Returns
              </h3>
              <p className="text-[11px] text-slate-500">Select active rental below to process deposit refund</p>
            </div>
            <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
              {activeIssues.length} Active Rentals
            </span>
          </div>

          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by Locker # (M-101), Customer ID (CST-1001), Phone, or Wristband..."
              value={expressReturnSearchQuery}
              onChange={(e) => setExpressReturnSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 text-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeIssues
                .filter(iss => {
                  if (!expressReturnSearchQuery.trim()) return true;
                  const q = expressReturnSearchQuery.toLowerCase();
                  return (
                    (iss.lockerNumber || '').toLowerCase().includes(q) ||
                    (iss.customerCode || '').toLowerCase().includes(q) ||
                    (iss.guestName || iss.guest_name || '').toLowerCase().includes(q) ||
                    (iss.wristbandId || '').toLowerCase().includes(q)
                  );
                })
                .map((issue) => (
                  <div key={issue.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 flex flex-col justify-between hover:border-amber-400 transition shadow-2xs">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">{issue.guestName || issue.guest_name || 'Amit Sharma'}</h4>
                          <p className="text-[11px] font-mono text-indigo-600 font-bold mt-0.5">
                            {issue.customerCode} • Room #{issue.roomNumber || '101'}
                          </p>
                        </div>
                        {issue.lockerNumber && (
                          <span className="bg-indigo-600 text-white font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-2xs">
                            {issue.lockerNumber}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Rented Items</span>
                        {(issue.costumes || []).map((c, idx) => (
                          <div key={idx} className="flex justify-between font-semibold">
                            <span>{c.name}</span>
                            <b className="font-mono text-slate-900">x{c.quantity}</b>
                          </div>
                        ))}
                        {(!issue.costumes || issue.costumes.length === 0) && (
                          <div className="flex justify-between text-slate-500">
                            <span>Swimwear (Standard)</span>
                            <b className="font-mono">x1</b>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Caution Deposit</span>
                        <span className="text-sm font-black text-amber-600">₹{issue.totalDepositHeld || 200}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReturnModalIssue(issue);
                          setDamageFine(0);
                          setReturnNotes('');
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={13} /> Refund Deposit ₹{issue.totalDepositHeld || 200}
                      </button>
                    </div>
                  </div>
                ))}
              {activeIssues.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs font-bold">
                  No active rentals pending return. All lockers and costumes are currently returned!
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ISSUE COUNTER 100vh SINGLE SCREEN VIEW */
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
          {/* LEFT & CENTER COLUMN (8 cols): Customer Banner, Category Lockers Grid & Costumes Picker */}
          <div className="lg:col-span-8 flex flex-col space-y-2 min-h-0 overflow-hidden">
            
            {/* LOADED CUSTOMER BANNER WITH TICKET DETAILS */}
            {selectedCustomer ? (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2 px-3 flex items-center justify-between gap-2.5 shrink-0 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedCustomer.name ? selectedCustomer.name[0].toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 truncate">{selectedCustomer.name}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                        {selectedCustomer.customerCode || 'CST-1001'}
                      </span>
                      {selectedCustomer.waterparkTickets && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.2 rounded font-mono">
                          🎫 {selectedCustomer.waterparkTickets.bookingRef} ({selectedCustomer.waterparkTickets.totalCount} Tickets)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">
                      Room #{selectedCustomer.roomNumber || '101'} • Phone: {selectedCustomer.phone} • Wristband: {selectedCustomer.wristbandId || 'W-7854'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 rounded text-[10px] font-bold transition cursor-pointer"
                  >
                    History
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-1.5 px-3 text-xs text-amber-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <span>Search guest profile by <b>Customer ID</b>, Phone, or Wristband in top search bar</span>
                </div>
                <span className="text-[9px] text-amber-600 font-semibold hidden sm:inline">Auto-Sync Active</span>
              </div>
            )}

            {/* 1. LOCKER SELECTION CARD */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs flex flex-col space-y-2 shrink-0">
              {/* Header with Title & Dual-View Toggle */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={14} className="text-indigo-600" /> Lockers Category
                  </h3>
                  <span className="bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
                    {totalAvailableLockers} Available
                  </span>
                </div>

                {/* Dual-View Switcher Tabs */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-extrabold border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setLockerViewMode('quick')}
                    className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      lockerViewMode === 'quick'
                        ? 'bg-white text-indigo-600 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap size={12} /> Quick Category (+/-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLockerViewMode('grid')}
                    className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      lockerViewMode === 'grid'
                        ? 'bg-white text-indigo-600 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Key size={12} /> Visual Locker Grid
                  </button>
                </div>
              </div>

              {/* VIEW A: QUICK CATEGORY (+/-) */}
              {lockerViewMode === 'quick' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'Men', title: '👨 Men Changing Locker', rent: 100, dep: 100, avail: menAvailableLockers },
                      { key: 'Ladies', title: '👩 Ladies Changing Locker', rent: 100, dep: 100, avail: ladiesAvailableLockers },
                      { key: 'VIP', title: '👑 VIP Locker Room', rent: 150, dep: 100, avail: vipAvailableLockers },
                      { key: 'Executive', title: '💼 Executive Locker', rent: 150, dep: 100, avail: execAvailableLockers }
                    ].map((cat) => {
                      const selectedInCat = getSelectedZoneLockers(cat.key);
                      const count = selectedInCat.length;
                      return (
                        <div key={cat.key} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-100/60 transition">
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{cat.title}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">
                                {cat.avail} Available
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                              Rent: <b className="text-slate-800">₹{cat.rent}</b> • Deposit: <b className="text-amber-600">₹{cat.dep}</b>
                            </div>
                          </div>

                          {/* Counter Buttons */}
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleRemoveZoneLocker(cat.key)}
                              disabled={count === 0}
                              className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-black text-slate-900 text-xs">{count}</span>
                            <button
                              type="button"
                              onClick={() => handleAddZoneLocker(cat.key)}
                              disabled={cat.avail === 0}
                              className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs hover:bg-indigo-700 disabled:opacity-40 cursor-pointer shadow-2xs transition"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Lockers Tag Pills */}
                  {selectedLockerIds.length > 0 && (
                    <div className="p-1.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider shrink-0">
                        Selected ({selectedLockerIds.length}):
                      </span>
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {selectedLockerIds.map((id) => (
                          <span key={id} className="bg-white border border-indigo-200 text-indigo-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 shadow-2xs">
                            {id}
                            <button
                              type="button"
                              onClick={() => setSelectedLockerIds(selectedLockerIds.filter(lId => lId !== id))}
                              className="hover:text-red-500 cursor-pointer ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* VIEW B: VISUAL LOCKER GRID */
                <div className="space-y-1.5 max-h-48 overflow-hidden flex flex-col">
                  {/* Category Zone Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto shrink-0 border-b border-slate-100 pb-1">
                    {[
                      { id: 'All', label: `All (${totalAvailableLockers})` },
                      { id: 'Men', label: `👨 Men (${menAvailableLockers})` },
                      { id: 'Ladies', label: `👩 Ladies (${ladiesAvailableLockers})` },
                      { id: 'VIP', label: `👑 VIP (${vipAvailableLockers})` },
                      { id: 'Executive', label: `💼 Exec (${execAvailableLockers})` },
                    ].map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setSelectedZoneFilter(z.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer shrink-0 ${
                          selectedZoneFilter === z.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>

                  {/* Locker Cards Grid */}
                  <div className="max-h-36 overflow-y-auto pr-1">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedLockerIds([])}
                        className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          selectedLockerIds.length === 0
                            ? 'bg-slate-100 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 font-black'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-[11px] font-bold">No Locker</div>
                        <div className="text-[8px] text-slate-400">Costumes</div>
                      </button>

                      {filteredLockers.map((l) => {
                        const isAssigned = l.status === 'assigned' || l.status === 'occupied';
                        const locId = l.id || l.lockerNumber;
                        const isSelected = selectedLockerIds.includes(locId) || selectedLockerIds.includes(l.lockerNumber);
                        return (
                          <button
                            key={l.id || l.lockerNumber}
                            type="button"
                            disabled={isAssigned}
                            onClick={() => handleToggleLocker(l)}
                            className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-950 font-bold shadow-xs'
                                : isAssigned
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono">
                              <span>{l.zone ? l.zone.slice(0, 3).toUpperCase() : 'MED'}</span>
                              <span className="font-extrabold text-slate-700">₹{l.rentalFee}</span>
                            </div>
                            <div className="text-xs font-mono font-black text-slate-900 my-0.5">{l.lockerNumber}</div>
                            <div className="text-[8px] font-extrabold">
                              {isSelected ? (
                                <span className="text-emerald-700 bg-emerald-100 px-1 rounded text-[8px]">✓ Selected</span>
                              ) : isAssigned ? (
                                <span className="text-slate-400 text-[8px]">Occupied</span>
                              ) : (
                                <span className="text-emerald-600 text-[8px]">Available</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. COSTUMES & TOWELS PICKER CARD */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs flex-1 min-h-0 flex flex-col space-y-2 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 shrink-0">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Shirt size={14} className="text-indigo-600" /> Swimwear & Towels
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                  Selected: <b className="text-slate-900">{selectedCostumes.reduce((sum, c) => sum + c.quantity, 0)} items</b>
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(costumesList || []).map((c) => {
                    const costumeId = c.id || c.code;
                    const selectedCostumeObj = selectedCostumes.find(sc => sc.costumeId === costumeId || sc.code === c.code);
                    const qty = selectedCostumeObj ? selectedCostumeObj.quantity : 0;
                    return (
                      <div key={c.id || c.code} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-100/60 transition">
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span className="truncate">{c.name}</span>
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1 rounded">
                              {c.size || 'M'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Rent: <b className="text-slate-800">₹{c.rentalFee}</b> • Dep: <b className="text-amber-600">₹{c.securityDeposit}</b> • Stock: <b className="text-emerald-700">{c.totalStock || 40}</b>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateCostumeQty(c, Math.max(0, qty - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition"
                            disabled={qty === 0}
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-black text-slate-900 text-xs">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCostumeQty(c, qty + 1)}
                            className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs hover:bg-indigo-700 cursor-pointer shadow-2xs transition"
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
          </div>

          {/* RIGHT SIDEBAR COLUMN (4 cols): RENTAL SUMMARY & CHECKOUT */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs flex flex-col justify-between overflow-hidden">
            <div className="space-y-2 min-h-0 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt size={14} className="text-indigo-600" /> Rental Summary & Charges
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  selectedCustomer ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedCustomer ? selectedCustomer.name : 'No Guest'}
                </span>
              </div>

              {!selectedCustomer && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                  <span>Select guest profile from top search bar for receipt & wristband tag.</span>
                </div>
              )}

              {/* Itemized Charges List */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-semibold">Locker(s) Selected:</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {selectedLockerIds.length > 0 ? selectedLockerIds.join(', ') : 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-semibold">Costumes & Towels:</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {selectedCostumes.length > 0
                      ? selectedCostumes.map(c => `${c.name} (${c.quantity})`).join(', ')
                      : 'No costume selected'}
                  </span>
                </div>

                <div className="pt-1.5 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Rental Fee:</span>
                    <span className="font-extrabold text-slate-900 font-mono">₹{totalRentalFee}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Caution Deposit (Refundable):</span>
                    <span className="font-extrabold text-amber-700 font-mono">₹{totalDepositHeld}</span>
                  </div>
                </div>

                {/* Grand Total Banner */}
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between mt-2">
                  <div>
                    <div className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">Grand Total Paid:</div>
                    <div className="text-xs text-indigo-500 font-medium">Incl. all taxes & deposit</div>
                  </div>
                  <div className="text-xl font-black text-indigo-600 font-mono">₹{grandTotalPaid}</div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Payment Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['UPI', 'Cash', 'Card'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMode(method)}
                      className={`py-1.5 text-xs font-extrabold rounded-xl border cursor-pointer transition ${
                        paymentMode === method
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Issue Button */}
            <div className="pt-2 shrink-0 border-t border-slate-100">
              <button
                type="button"
                onClick={handleIssueSubmit}
                disabled={selectedLockerIds.length === 0 && selectedCostumes.length === 0}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} /> Issue Locker & Print Receipt (₹{grandTotalPaid})
              </button>
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
                <RotateCcw size={16} className="text-amber-500" /> Return Locker & Refund Caution Deposit
              </h3>
              <button onClick={() => setReturnModalIssue(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{returnModalIssue.guestName || returnModalIssue.guest_name}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{returnModalIssue.customerCode} • {returnModalIssue.guestPhone || '+91 98765 11223'}</p>
                  </div>
                  {returnModalIssue.lockerNumber && (
                    <span className="bg-indigo-100 text-indigo-800 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                      Locker {returnModalIssue.lockerNumber}
                    </span>
                  )}
                </div>
                {returnModalIssue.roomNumber && (
                  <p className="text-slate-600 text-[11px]">Room #{returnModalIssue.roomNumber} • Wristband #{returnModalIssue.wristbandId || 'W-7854'}</p>
                )}
              </div>

              {/* Deposit Held Box */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center text-amber-900 font-bold">
                <span className="flex items-center gap-1.5"><ShieldAlert size={15} /> Caution Deposit Held:</span>
                <span className="text-base font-extrabold text-amber-600">₹{returnModalIssue.totalDepositHeld || 0}</span>
              </div>

              {/* Preset Damage Fines */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Quick Damage / Fine Presets:</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[
                    { label: '✓ No Damage (₹0)', amount: 0 },
                    { label: '🔑 Lost Key (₹50)', amount: 50 },
                    { label: '👕 Damaged Costume (₹100)', amount: 100 },
                    { label: '🧼 Missing Towel (₹50)', amount: 50 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setDamageFine(preset.amount)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition text-left cursor-pointer ${
                        Number(damageFine) === preset.amount
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <label className="block text-slate-600 font-semibold mb-1">Custom Fine Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  max={returnModalIssue.totalDepositHeld || 500}
                  value={damageFine}
                  onChange={(e) => setDamageFine(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none focus:border-amber-500 font-bold"
                />
              </div>

              {/* Refund Payment Mode */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Refund Payment Mode:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Room Folio'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setRefundPaymentMode(pm)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        refundPaymentMode === pm
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspection Notes */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Remarks / Inspection Notes:</label>
                <textarea
                  rows="2"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned locker key intact, swimwear returned clean."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none"
                ></textarea>
              </div>

              {/* Net Refund Calculation Card */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center text-sm font-extrabold text-emerald-900 shadow-2xs">
                <span>Net Refund Paid to Guest:</span>
                <span className="text-base text-emerald-700">₹{Math.max(0, (returnModalIssue.totalDepositHeld || 0) - Number(damageFine))}</span>
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
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} /> Confirm & Issue Refund
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
