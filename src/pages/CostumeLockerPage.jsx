import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { pmsService } from '../services/pmsService';
import {
  Key, Search, Plus, RotateCcw, CheckCircle, AlertTriangle, UserCheck,
  ShieldAlert, DollarSign, Shirt, Hash, X, Printer, User, UserPlus,
  Zap, Sliders, ChevronDown, ShoppingBag, History, CreditCard, Banknote, Smartphone, Receipt, Maximize, Minimize
} from 'lucide-react';

export default function CostumeLockerPage() {
  const { defaultRules, user, customers, lockers: ctxLockers, costumes: ctxCostumes, costumeIssues: ctxIssues, dispatch, showToast } = useApp();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin' || !user?.role;
  const [currentMode, setCurrentMode] = useState(defaultRules?.costumeLockerMode || 'express');
  const [activeTab, setActiveTab] = useState('issue'); // issue, returns, lockers_grid, costume_stock, history
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showActiveDrawer, setShowActiveDrawer] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log('Error requesting fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

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

  // Sample fallback issue with rich metadata
  const sampleFallbackIssues = [
    {
      id: 'ISS-1001',
      issueNumber: 'ISS-98412',
      guestName: 'Amit Sharma',
      customerCode: 'CST-1001',
      guestPhone: '+91 98765 11223',
      roomNumber: '101',
      wristbandId: 'W-7854',
      waterparkTickets: {
        bookingRef: 'TCK-8890',
        totalCount: 2,
        details: '2 Adult Waterpark Passes'
      },
      lockerNumber: 'L-101',
      costumes: [
        { name: 'Gents Swim Costume (Large)', quantity: 1, rentalFee: 60, deposit: 50 },
        { name: 'Cotton Bath Towel (Large)', quantity: 1, rentalFee: 40, deposit: 50 }
      ],
      totalRentalFee: 200,
      totalDepositHeld: 200,
      grandTotalPaid: 400,
      paymentMode: 'UPI',
      issuedAt: 'Today at 11:30 AM',
      status: 'issued'
    }
  ];

  // Calculations for stats
  const assignedLockersCount = (lockersList || []).filter(l => l.status === 'assigned' || l.status === 'occupied').length;
  const rawIssues = (issuesList && issuesList.length > 0) ? issuesList : sampleFallbackIssues;
  const activeIssues = rawIssues.filter(i => i.status === 'issued' || i.status === 'active');
  const totalCautionHeld = activeIssues.reduce((acc, i) => acc + (i.totalDepositHeld || i.total_deposit_held || 0), 0);
  const todayRentalRevenue = rawIssues.reduce((acc, i) => acc + (i.totalRentalFee || i.total_rental_fee || 0), 0);

  // Stepper progress state calculation
  const currentStep = !selectedCustomer ? 1 : selectedLockerIds.length === 0 ? 2 : selectedCostumes.length === 0 ? 3 : 4;

  const handleModeSwitch = (mode) => {
    setCurrentMode(mode);
    dispatch({ type: 'SET_COSTUME_LOCKER_MODE', payload: mode });
    const labels = {
      express: 'Express Counter',
      tabs: 'Multi-Tab Registers',
      enterprise: 'Enterprise Management'
    };
    showToast(`Switched to ${labels[mode]}`);
  };

  // Search matches across Customers, Active Rentals, and Lockers
  const matchingCustomers = (customers || []).filter(c =>
    searchQuery.trim() && (
      (c.customerCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery) ||
      (c.roomNumber || '').includes(searchQuery) ||
      (c.wristbandId || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const matchingActiveRentals = (activeIssues || []).filter(iss =>
    searchQuery.trim() && (
      (iss.lockerNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (iss.customerCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (iss.guestName || iss.guest_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (iss.wristbandId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (iss.issueCode || iss.id || '').toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const matchingLockers = (lockersList || []).filter(l =>
    searchQuery.trim() && (
      (l.lockerNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.assignedTo || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handlePerformSmartSearch = (overrideQuery) => {
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!q) return;

    // 1. Check Active Rentals first
    const rentalMatch = activeIssues.find(iss =>
      (iss.lockerNumber || '').toLowerCase() === q.toLowerCase() ||
      (iss.customerCode || '').toLowerCase() === q.toLowerCase() ||
      (iss.issueCode || iss.id || '').toString().toLowerCase() === q.toLowerCase() ||
      (iss.wristbandId || '').toLowerCase() === q.toLowerCase()
    );

    if (rentalMatch) {
      setReturnModalIssue(rentalMatch);
      setDamageFine(0);
      setReturnNotes('');
      setShowSearchDropdown(false);
      showToast(`Active Rental Found: Locker ${rentalMatch.lockerNumber || 'Assigned'} (${rentalMatch.guestName || rentalMatch.customerCode})`, 'info');
      return;
    }

    // 2. Check Customer match
    const custMatch = matchingCustomers.length > 0 ? matchingCustomers[0] : null;
    if (custMatch) {
      handleSelectCustomer(custMatch);
      setActiveTab('issue');
      setShowSearchDropdown(false);
      return;
    }

    // 3. Check Locker match
    const lockerMatch = matchingLockers.length > 0 ? matchingLockers[0] : null;
    if (lockerMatch) {
      const locId = lockerMatch.lockerNumber || lockerMatch.id;
      if (lockerMatch.status === 'assigned' || lockerMatch.status === 'occupied') {
        const foundActive = activeIssues.find(i => i.lockerNumber === lockerMatch.lockerNumber);
        if (foundActive) {
          setReturnModalIssue(foundActive);
          setDamageFine(0);
          setReturnNotes('');
          showToast(`Locker ${lockerMatch.lockerNumber} is occupied by ${foundActive.guestName}`);
        } else {
          setActiveTab('lockers_grid');
          showToast(`Locker ${lockerMatch.lockerNumber} is assigned.`);
        }
      } else {
        if (!selectedLockerIds.includes(locId)) {
          setSelectedLockerIds([...selectedLockerIds, locId]);
        }
        setActiveTab('issue');
        showToast(`Locker ${lockerMatch.lockerNumber} selected for issue!`);
      }
      setShowSearchDropdown(false);
      return;
    }

    // 4. Fallback: Create dynamic customer record for this ID/Phone/Name
    const dynamicCust = {
      customerCode: q.startsWith('CST') ? q.toUpperCase() : `CST-${q.toUpperCase()}`,
      name: q.match(/^[a-zA-Z\s]+$/) ? q : `Guest (${q})`,
      phone: q.match(/^\+?\d+$/) ? q : '+91 98765 11223',
      roomNumber: '101',
      wristbandId: `W-${Math.floor(1000 + Math.random() * 9000)}`
    };
    handleSelectCustomer(dynamicCust);
    setActiveTab('issue');
    setShowSearchDropdown(false);
  };

  return (
    <div className="h-full flex-1 flex flex-col bg-slate-100/70 p-2 md:p-2.5 overflow-hidden space-y-2">
      {/* TOP COMPACT HEADER & UNIFIED SEARCH BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 px-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-indigo-200">
            <Key size={18} />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Costumes & Lockers Counter</h1>
            <p className="text-xs text-slate-500 font-medium">Issue lockers, swimwear costumes & caution deposits</p>
          </div>
        </div>

        {/* CENTER: HIGHLIGHTED GUEST SEARCH BAR & LIVE AUTO-SUGGEST */}
        <div className="flex-1 max-w-xl mx-auto w-full relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-indigo-600" size={17} />
            <input
              type="text"
              placeholder="Search by Customer ID (CST-1001), Phone, Room #, Wristband, or Locker..."
              value={searchQuery}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePerformSmartSearch();
                }
              }}
              className="w-full bg-indigo-50/40 border-2 border-indigo-500 focus:border-indigo-600 ring-4 ring-indigo-500/10 text-slate-900 font-medium rounded-xl pl-10 pr-28 py-2 text-xs md:text-sm placeholder-slate-400 outline-none transition shadow-2xs"
            />
            
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="absolute right-24 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => handlePerformSmartSearch()}
              className="absolute right-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs"
            >
              Search ID
            </button>
          </div>

          {/* LIVE AUTO-SUGGEST DROPDOWN */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-indigo-200 shadow-2xl rounded-2xl z-50 max-h-80 overflow-y-auto p-2 space-y-2">
              {/* SECTION: ACTIVE RENTALS MATCH */}
              {matchingActiveRentals.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider px-2.5 py-1 bg-amber-50 rounded-lg flex items-center justify-between">
                    <span>Active Rentals & Refunds</span>
                    <span className="font-mono text-amber-800 font-bold">{matchingActiveRentals.length} found</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchingActiveRentals.map((iss) => (
                      <div
                        key={iss.id}
                        onClick={() => {
                          setReturnModalIssue(iss);
                          setDamageFine(0);
                          setReturnNotes('');
                          setShowSearchDropdown(false);
                          showToast(`Opened refund for ${iss.guestName || iss.customerCode}`);
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{iss.guestName || iss.guest_name}</span>
                            <span className="text-[10px] font-mono text-indigo-600 font-bold">({iss.customerCode})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Locker: <b className="text-indigo-700">{iss.lockerNumber || 'N/A'}</b> • Room #{iss.roomNumber || '101'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-amber-600 block">₹{iss.totalDepositHeld || 200} Dep</span>
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded">Refund</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: CUSTOMERS MATCH */}
              {matchingCustomers.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-indigo-700 uppercase tracking-wider px-2.5 py-1 bg-indigo-50 rounded-lg flex items-center justify-between">
                    <span>Guest Profiles</span>
                    <span className="font-mono text-indigo-800 font-bold">{matchingCustomers.length} found</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchingCustomers.map((cust) => (
                      <div
                        key={cust.id || cust.customerCode}
                        onClick={() => {
                          handleSelectCustomer(cust);
                          setActiveTab('issue');
                          setShowSearchDropdown(false);
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{cust.name}</span>
                            <span className="text-[10px] font-mono text-indigo-600 font-bold">({cust.customerCode})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Phone: {cust.phone} • Room #{cust.roomNumber || '101'}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-lg">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: LOCKERS MATCH */}
              {matchingLockers.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider px-2.5 py-1 bg-emerald-50 rounded-lg flex items-center justify-between">
                    <span>Lockers</span>
                    <span className="font-mono text-emerald-800 font-bold">{matchingLockers.length} found</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchingLockers.map((l) => {
                      const isAssigned = l.status === 'assigned' || l.status === 'occupied';
                      return (
                        <div
                          key={l.id || l.lockerNumber}
                          onClick={() => {
                            const locId = l.lockerNumber || l.id;
                            if (isAssigned) {
                              const foundActive = activeIssues.find(i => i.lockerNumber === l.lockerNumber);
                              if (foundActive) {
                                setReturnModalIssue(foundActive);
                                setDamageFine(0);
                                setReturnNotes('');
                              } else {
                                setActiveTab('lockers_grid');
                              }
                            } else {
                              if (!selectedLockerIds.includes(locId)) {
                                setSelectedLockerIds([...selectedLockerIds, locId]);
                              }
                              setActiveTab('issue');
                            }
                            setShowSearchDropdown(false);
                          }}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-black font-mono text-slate-900">Locker {l.lockerNumber}</span>
                            <span className="text-[10px] text-slate-500 ml-2">({l.zone})</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            isAssigned ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isAssigned ? 'Assigned' : 'Available'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NO EXACT MATCHES FALLBACK */}
              {matchingActiveRentals.length === 0 && matchingCustomers.length === 0 && matchingLockers.length === 0 && (
                <div
                  onClick={() => handlePerformSmartSearch()}
                  className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl cursor-pointer text-center space-y-1 hover:bg-indigo-100 transition"
                >
                  <div className="text-xs font-extrabold text-indigo-900">Auto-Create Dynamic Guest Ticket</div>
                  <div className="text-[11px] text-indigo-700">Click to select ID <b>"{searchQuery}"</b> for immediate issue</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: QUICK STATS & FULLSCREEN */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 gap-2">
            <span>Rental: <b className="text-emerald-600 font-bold">₹{todayRentalRevenue}</b></span>
            <span>•</span>
            <span>Deposit: <b className="text-amber-600 font-bold">₹{totalCautionHeld}</b></span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={isFullscreen ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
          </button>
        </div>
      </div>

      {/* MULTI-TAB NAVIGATION BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 px-3 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full scrollbar-none pb-0.5">
          {[
            { id: 'issue', label: 'Issue Locker & Costume', icon: Key },
            { id: 'returns', label: 'Active Rentals & Refunds', icon: RotateCcw, count: activeIssues.length },
            { id: 'lockers_grid', label: 'Locker Grid & Management', icon: Hash, count: totalAvailableLockers },
            { id: 'costume_stock', label: 'Costume Stock & Towels', icon: Shirt, count: costumesList.length },
            { id: 'history', label: 'Rental History & Audit Log', icon: History, count: issuesList.length },
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <IconComp size={15} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {activeTab === 'returns' ? (
        /* TAB: ACTIVE RENTALS & DEPOSIT REFUNDS */
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
      ) : activeTab === 'issue' ? (
        /* TAB: ISSUE LOCKER & COSTUME */
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
                      <span className="text-xs font-bold text-slate-900 truncate">{selectedCustomer.name}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.2 rounded font-mono">
                        {selectedCustomer.customerCode || 'CST-1001'}
                      </span>
                      {selectedCustomer.waterparkTickets && (
                        <span className="bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.2 rounded font-mono">
                          Ticket #{selectedCustomer.waterparkTickets.bookingRef}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                      Room #{selectedCustomer.roomNumber || '101'} • Phone: {selectedCustomer.phone} • Wristband: {selectedCustomer.wristbandId || 'W-7854'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 rounded text-[10px] font-semibold transition cursor-pointer"
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
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2 px-3 text-xs text-amber-800 flex items-center justify-between shrink-0 font-medium">
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-amber-600 shrink-0" />
                  <span>Search guest profile by <b>Customer ID</b>, Phone, or Room # in top search bar</span>
                </div>
              </div>
            )}

            {/* 1. LOCKER SELECTION CARD */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col space-y-2.5 shrink-0">
              {/* Header with Title & Dual-View Toggle */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Key size={18} className="text-indigo-600" /> Lockers Category
                  </h3>
                  <span className="bg-emerald-50 text-emerald-700 font-mono font-bold text-xs px-3 py-0.5 rounded-full border border-emerald-200">
                    {totalAvailableLockers} Available
                  </span>
                </div>

                {/* Dual-View Switcher Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setLockerViewMode('quick')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      lockerViewMode === 'quick'
                        ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Quick Category (+/-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLockerViewMode('grid')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      lockerViewMode === 'grid'
                        ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Visual Locker Grid
                  </button>
                </div>
              </div>

              {/* VIEW A: QUICK CATEGORY (+/-) */}
              {lockerViewMode === 'quick' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'Men', title: 'Men Changing Locker', rent: 100, dep: 100, avail: menAvailableLockers },
                      { key: 'Ladies', title: 'Ladies Changing Locker', rent: 100, dep: 100, avail: ladiesAvailableLockers },
                      { key: 'VIP', title: 'VIP Locker Room', rent: 150, dep: 100, avail: vipAvailableLockers },
                      { key: 'Executive', title: 'Executive Locker', rent: 150, dep: 100, avail: execAvailableLockers }
                    ].map((cat) => {
                      const selectedInCat = getSelectedZoneLockers(cat.key);
                      const count = selectedInCat.length;
                      return (
                        <div key={cat.key} className="p-2.5 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-100/60 transition">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                              <span className="truncate">{cat.title}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                                {cat.avail} Available
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 font-medium">
                              Rent: ₹{cat.rent} • Deposit: ₹{cat.dep}
                            </div>
                          </div>

                          {/* Counter Buttons */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-lg p-0.5 shrink-0 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleRemoveZoneLocker(cat.key)}
                              disabled={count === 0}
                              className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-slate-800 text-sm">{count}</span>
                            <button
                              type="button"
                              onClick={() => handleAddZoneLocker(cat.key)}
                              disabled={cat.avail === 0}
                              className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 cursor-pointer shadow-2xs transition"
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
                    <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider shrink-0">
                        Selected ({selectedLockerIds.length}):
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto">
                        {selectedLockerIds.map((id) => (
                          <span key={id} className="bg-white border border-indigo-200 text-indigo-900 font-mono font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 shadow-2xs">
                            {id}
                            <button
                              type="button"
                              onClick={() => setSelectedLockerIds(selectedLockerIds.filter(lId => lId !== id))}
                              className="hover:text-red-500 cursor-pointer ml-1 font-black"
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
                <div className="space-y-2 max-h-48 overflow-hidden flex flex-col">
                  {/* Category Zone Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 border-b border-slate-100 pb-1.5">
                    {[
                      { id: 'All', label: `All (${totalAvailableLockers})` },
                      { id: 'Men', label: `Men (${menAvailableLockers})` },
                      { id: 'Ladies', label: `Ladies (${ladiesAvailableLockers})` },
                      { id: 'VIP', label: `VIP (${vipAvailableLockers})` },
                      { id: 'Executive', label: `Exec (${execAvailableLockers})` },
                    ].map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setSelectedZoneFilter(z.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
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
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          selectedLockerIds.length === 0
                            ? 'bg-slate-100 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 font-black'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">No Locker</div>
                        <div className="text-[10px] text-slate-400">Costumes</div>
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
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-950 font-bold shadow-xs'
                                : isAssigned
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                              <span>{l.zone ? l.zone.slice(0, 3).toUpperCase() : 'MED'}</span>
                              <span className="font-extrabold text-slate-700">₹{l.rentalFee}</span>
                            </div>
                            <div className="text-sm font-mono font-black text-slate-900 my-0.5">{l.lockerNumber}</div>
                            <div className="text-[9px] font-bold">
                              {isSelected ? (
                                <span className="text-emerald-700 bg-emerald-100 px-1 rounded">Selected</span>
                              ) : isAssigned ? (
                                <span className="text-slate-400">Occupied</span>
                              ) : (
                                <span className="text-emerald-600">Available</span>
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex-1 min-h-0 flex flex-col space-y-2.5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Shirt size={18} className="text-indigo-600" /> Swimwear & Towels
                </h3>
                <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-0.5 rounded-full">
                  Selected: <b className="text-slate-900">{selectedCostumes.reduce((sum, c) => sum + c.quantity, 0)} items</b>
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(costumesList || []).map((c) => {
                    const costumeId = c.id || c.code;
                    const selectedCostumeObj = selectedCostumes.find(sc => sc.costumeId === costumeId || sc.code === c.code);
                    const qty = selectedCostumeObj ? selectedCostumeObj.quantity : 0;
                    return (
                      <div key={c.id || c.code} className="p-2.5 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-100/60 transition">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <span className="truncate">{c.name}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-1.5 rounded">
                              {c.size || 'M'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            Rent: ₹{c.rentalFee} • Dep: ₹{c.securityDeposit} • Stock: {c.totalStock || 40}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-lg p-0.5 shrink-0 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateCostumeQty(c, Math.max(0, qty - 1))}
                            className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition"
                            disabled={qty === 0}
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-slate-800 text-sm">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCostumeQty(c, qty + 1)}
                            className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-sm hover:bg-indigo-700 cursor-pointer shadow-2xs transition"
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
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between overflow-hidden">
            <div className="space-y-3 min-h-0 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Receipt size={16} className="text-indigo-600" /> Rental Summary
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  selectedCustomer ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedCustomer ? selectedCustomer.name : 'No Guest'}
                </span>
              </div>

              {!selectedCustomer && (
                <div className="p-2 bg-amber-50/80 border border-amber-200/60 rounded-lg text-xs text-amber-800 font-medium text-center">
                  Search guest profile from top bar for slip.
                </div>
              )}

              {/* Itemized Charges List */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium">Locker(s) Selected:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {selectedLockerIds.length > 0 ? selectedLockerIds.join(', ') : 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium">Costumes & Towels:</span>
                  <span className="font-semibold text-slate-800 font-mono truncate max-w-[150px] text-right">
                    {selectedCostumes.length > 0
                      ? selectedCostumes.map(c => `${c.name} (${c.quantity})`).join(', ')
                      : 'None'}
                  </span>
                </div>

                <div className="pt-1 space-y-1">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Total Rental Fee:</span>
                    <span className="font-semibold text-slate-800 font-mono">₹{totalRentalFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Caution Deposit (Refundable):</span>
                    <span className="font-semibold text-amber-700 font-mono">₹{totalDepositHeld}</span>
                  </div>
                </div>

                {/* Grand Total Banner */}
                <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between mt-2">
                  <div>
                    <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Grand Total:</div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 font-mono">₹{grandTotalPaid}</div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Cash', 'Card'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMode(method)}
                      className={`py-2 text-xs font-extrabold rounded-xl border cursor-pointer transition ${
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
            <div className="pt-3 shrink-0 border-t border-slate-100">
              <button
                type="button"
                onClick={handleIssueSubmit}
                disabled={selectedLockerIds.length === 0 && selectedCostumes.length === 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={16} /> Issue Locker & Print Receipt (₹{grandTotalPaid})
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'lockers_grid' ? (
          /* TAB: LOCKER GRID & MANAGEMENT */
          <div className="flex-1 min-h-0 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col space-y-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-indigo-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Locker Grid & Management</h3>
                  <p className="text-xs text-slate-500">Monitor locker occupancy, zone filters, and assign lockers to guests</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLockerModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> New Locker
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['All', 'Men', 'Ladies', 'VIP', 'Executive'].map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZoneFilter(z)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                      selectedZoneFilter === z ? 'bg-indigo-600 text-white shadow-xs font-extrabold' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {z} Zone
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Filter locker #..."
                  value={lockerSearchQuery}
                  onChange={(e) => setLockerSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-slate-800 rounded-xl pl-9 pr-3 py-1 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {filteredLockers.map((l) => {
                  const isOccupied = l.status === 'assigned' || l.status === 'occupied';
                  return (
                    <div
                      key={l.id || l.lockerNumber}
                      className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition ${
                        isOccupied ? 'bg-amber-50/60 border-amber-200' : 'bg-emerald-50/60 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{l.zone ? l.zone.slice(0, 4) : 'MED'}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                          isOccupied ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                        }`}>
                          {isOccupied ? 'Occupied' : 'Available'}
                        </span>
                      </div>

                      <div>
                        <div className="text-lg font-mono font-black text-slate-900">{l.lockerNumber}</div>
                        <div className="text-xs text-slate-600 font-medium">₹{l.rentalFee} Rent • ₹{l.securityDeposit || 100} Dep</div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        {isOccupied ? (
                          <span className="text-amber-800 font-bold truncate">Assigned to Guest</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLockerIds([...selectedLockerIds, l.lockerNumber]);
                              setActiveTab('issue');
                            }}
                            className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg text-center cursor-pointer"
                          >
                            Select for Issue
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'costume_stock' ? (
          /* TAB: COSTUME STOCK & TOWELS INVENTORY */
          <div className="flex-1 min-h-0 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col space-y-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <Shirt size={18} className="text-indigo-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Swimwear & Towels Stock Inventory</h3>
                  <p className="text-xs text-slate-500">Track total stock, rental fees, and caution deposits for all costume items</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCostumeModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Costume Item
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(costumesList || []).map((c) => (
                  <div key={c.id || c.code} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900">{c.name}</h4>
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-md font-mono">{c.size || 'M'}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">Code: {c.code} • Category: {c.category || 'General'}</p>
                      <div className="text-xs font-medium text-slate-700 pt-1">
                        Rental Fee: <b className="text-slate-900">₹{c.rentalFee}</b> | Caution Dep: <b className="text-amber-700">₹{c.securityDeposit}</b>
                      </div>
                    </div>

                    <div className="text-right shrink-0 bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">In Stock</span>
                      <span className="text-lg font-black text-emerald-600 font-mono">{c.totalStock || 40}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'history' ? (
          /* TAB: RENTAL HISTORY & AUDIT LOG */
          <div className="flex-1 min-h-0 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col space-y-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <History size={18} className="text-indigo-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Rental Audit History & Slips Log</h3>
                  <p className="text-xs text-slate-500">Full transactional record of all issued lockers, costumes, and deposit refunds</p>
                </div>
              </div>
              <span className="bg-slate-100 text-slate-800 font-extrabold text-xs px-3 py-1 rounded-full">
                {issuesList.length} Total Slips
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-extrabold border-b border-slate-200">
                    <th className="p-2.5">Guest & Code</th>
                    <th className="p-2.5">Locker #</th>
                    <th className="p-2.5">Costumes Rented</th>
                    <th className="p-2.5">Rent Fee</th>
                    <th className="p-2.5">Deposit</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {issuesList.map((iss) => (
                    <tr key={iss.id || Math.random()} className="hover:bg-slate-50 font-medium text-slate-800">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{iss.guestName || iss.guest_name}</div>
                        <div className="text-[10px] font-mono text-indigo-600">{iss.customerCode} • Room #{iss.roomNumber || '101'}</div>
                      </td>
                      <td className="p-2.5 font-mono font-extrabold text-indigo-900">{iss.lockerNumber || 'No Locker'}</td>
                      <td className="p-2.5">
                        {(iss.costumes || []).map(c => `${c.name} (x${c.quantity})`).join(', ') || 'Swimwear (Standard)'}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">₹{iss.totalRentalFee || 100}</td>
                      <td className="p-2.5 font-mono font-bold text-amber-700">₹{iss.totalDepositHeld || 200}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          iss.status === 'returned' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {iss.status === 'returned' ? 'Returned' : 'Active Rental'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setReceiptIssue(iss)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Print Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

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

      {/* MODAL: RETURN & CAUTION REFUND FORM WITH FULL DETAILS */}
      {returnModalIssue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <RotateCcw size={18} className="text-amber-500" /> Rental Inspection & Caution Refund
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Issue Slip Ref: {returnModalIssue.issueNumber || returnModalIssue.id}</p>
              </div>
              <button onClick={() => setReturnModalIssue(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              {/* Guest Profile & Ticket Meta Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{returnModalIssue.guestName || returnModalIssue.guest_name}</p>
                    <p className="text-indigo-600 font-mono font-bold text-xs mt-0.5">{returnModalIssue.customerCode} • {returnModalIssue.guestPhone || '+91 98765 11223'}</p>
                  </div>
                  {returnModalIssue.lockerNumber && (
                    <span className="bg-indigo-600 text-white font-mono font-black text-xs px-3 py-1 rounded-xl shadow-xs">
                      Locker {returnModalIssue.lockerNumber}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1.5 border-t border-slate-200/60 font-medium">
                  <div>Room: <b className="text-slate-900">#{returnModalIssue.roomNumber || '101'}</b></div>
                  <div>Wristband: <b className="text-slate-900">#{returnModalIssue.wristbandId || 'W-7854'}</b></div>
                  <div>Issued At: <b className="text-slate-900">{returnModalIssue.issuedAt || 'Today 11:30 AM'}</b></div>
                  <div>Initial Payment: <b className="text-indigo-700 font-mono">{returnModalIssue.paymentMode || 'UPI'}</b></div>
                </div>
                {(returnModalIssue.waterparkTickets || returnModalIssue.ticketInfo) && (
                  <div className="bg-indigo-100/70 p-2 rounded-lg text-indigo-900 text-xs font-mono font-bold border border-indigo-200 mt-1">
                    Waterpark Ticket: {typeof returnModalIssue.waterparkTickets === 'object' ? `${returnModalIssue.waterparkTickets.bookingRef} (${returnModalIssue.waterparkTickets.totalCount} Passes)` : (returnModalIssue.waterparkTickets || returnModalIssue.ticketInfo)}
                  </div>
                )}
              </div>

              {/* Rented Items Breakdown */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Itemized Rented Items & Fees</span>
                <div className="space-y-1 text-xs">
                  {(returnModalIssue.costumes || []).map((c, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-medium">
                      <div>
                        <span className="font-extrabold text-slate-900">{c.name}</span>
                        <span className="text-[10px] text-slate-500 block">Rent: ₹{c.rentalFee || 60} • Caution Dep: ₹{c.deposit || 50}</span>
                      </div>
                      <span className="font-mono font-black text-slate-800 text-sm">x{c.quantity}</span>
                    </div>
                  ))}
                  {(!returnModalIssue.costumes || returnModalIssue.costumes.length === 0) && (
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-medium">
                      <div>
                        <span className="font-extrabold text-slate-900">Standard Swimwear & Towel Set</span>
                        <span className="text-[10px] text-slate-500 block">Rent: ₹100 • Caution Dep: ₹100</span>
                      </div>
                      <span className="font-mono font-black text-slate-800 text-sm">x1</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deposit Held Box */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center text-amber-900 font-bold">
                <span className="flex items-center gap-1.5 text-xs"><ShieldAlert size={16} /> Total Caution Deposit Held:</span>
                <span className="text-lg font-black text-amber-600">₹{returnModalIssue.totalDepositHeld || 200}</span>
              </div>

              {/* Preset Damage Fines */}
              <div>
                <label className="block text-slate-800 font-extrabold text-xs mb-1.5">Item Condition & Fine Presets:</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[
                    { label: 'No Damage (₹0)', amount: 0 },
                    { label: 'Lost Key (₹50)', amount: 50 },
                    { label: 'Damaged Costume (₹100)', amount: 100 },
                    { label: 'Missing Towel (₹50)', amount: 50 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setDamageFine(preset.amount)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-left cursor-pointer ${
                        Number(damageFine) === preset.amount
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <label className="block text-slate-600 font-semibold text-xs mb-1">Custom Fine Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  max={returnModalIssue.totalDepositHeld || 500}
                  value={damageFine}
                  onChange={(e) => setDamageFine(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 outline-none focus:border-amber-500 font-bold text-xs"
                />
              </div>

              {/* Refund Payment Mode */}
              <div>
                <label className="block text-slate-800 font-extrabold text-xs mb-1.5">Refund Payment Mode:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Room Folio'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setRefundPaymentMode(pm)}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
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

              {/* Remarks */}
              <div>
                <label className="block text-slate-600 font-semibold text-xs mb-1">Inspection Remarks / Notes:</label>
                <textarea
                  rows="2"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned locker key intact, swimwear returned clean."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Net Refund Calculation Card */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex justify-between items-center text-sm font-black text-emerald-950 shadow-2xs">
                <div>
                  <span>Net Refund Paid to Guest:</span>
                  <span className="block text-[10px] text-emerald-700 font-medium">Deposit ₹{returnModalIssue.totalDepositHeld || 200} - Fine ₹{damageFine || 0}</span>
                </div>
                <span className="text-xl text-emerald-600 font-mono">₹{Math.max(0, (returnModalIssue.totalDepositHeld || 0) - Number(damageFine))}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalIssue(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={15} /> Confirm & Issue Refund
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
