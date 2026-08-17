import { useState } from 'react';
import {
  Boxes, Plus, Search, AlertTriangle, ArrowDownRight,
  TrendingDown, ChefHat, Truck, FileText, CheckCircle2,
  Filter, DollarSign, ClipboardCheck, Clock, ShieldAlert,
  Printer, ArrowUpRight, Zap, Settings, RefreshCw
} from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function KitchenInventoryPage() {
  const {
    inventoryItems, recipes, inventoryTransactions, suppliers,
    audits, purchaseOrders, menuItems, defaultRules, user, dispatch, showToast
  } = useApp();

  // Role check: Only Super Admin/Admin can toggle mode
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  // Mode check: 'simple' vs 'advanced' (Default: simple)
  const currentMode = defaultRules?.kitchenInventoryMode || 'simple';

  const [activeTab, setActiveTab] = useState('stock'); // stock | recipes | costing | audits | pos | suppliers | alerts
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Quick Inward/Outward state for Simple Mode
  const [quickUpdateItem, setQuickUpdateItem] = useState(null);
  const [quickQty, setQuickQty] = useState('');
  const [quickType, setQuickType] = useState('in'); // 'in' | 'out'

  // Forms
  const [itemForm, setItemForm] = useState({ name: '', category: 'Dairy', unit: 'kg', minStockLevel: 5, unitCost: 100, supplier: '', batchNumber: '', expiryDate: '' });
  const [stockInForm, setStockInForm] = useState({ itemId: '', qty: '', unit: 'kg', unitPrice: '', reason: '', supplier: '', batchNumber: '', expiryDate: '' });
  const [wastageForm, setWastageForm] = useState({ itemId: '', qty: '', unit: 'kg', reason: '' });
  const [recipeForm, setRecipeForm] = useState({ menuItemName: '', sellingPrice: 300, ingredients: [{ inventoryItemId: '', qty: 0.1, unit: 'kg' }] });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '', gstin: '' });
  const [auditForm, setAuditForm] = useState({ notes: 'Weekly Kitchen Physical Count', items: {} });
  const [poForm, setPOForm] = useState({ supplier: '', notes: 'Replenish low stock items', items: [] });

  // Categories list
  const categories = ['All', 'Dairy', 'Vegetables', 'Dry Pantry', 'Spices', 'Meat', 'Beverages', 'Consumables'];

  // Low stock items & Expiring items
  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStockLevel);
  const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const expiringItems = inventoryItems.filter(item => item.expiryDate && item.expiryDate <= sevenDaysLater);

  // Filtered items
  const filteredItems = inventoryItems.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate totals
  const totalStockValue = inventoryItems.reduce((s, i) => s + (i.currentStock * (i.unitCost || 0)), 0);
  const totalItemsCount = inventoryItems.length;

  // Recipe Costing Calculations (Food Cost % & Profit Margins)
  const recipeCostings = recipes.map(rec => {
    const dishPrice = rec.sellingPrice || (menuItems.find(m => m.name.toLowerCase() === rec.menuItemName.toLowerCase())?.price || 300);
    const rawCost = (rec.ingredients || []).reduce((sum, ing) => {
      const invItem = inventoryItems.find(i => i.id === ing.inventoryItemId || i.name === ing.name);
      const unitCost = invItem?.unitCost || 100;
      let qtyInItemUnit = ing.qty || ing.quantityRequired || 0;
      if (ing.unit === 'g' && invItem?.unit === 'kg') qtyInItemUnit = qtyInItemUnit / 1000;
      if (ing.unit === 'ml' && invItem?.unit === 'L') qtyInItemUnit = qtyInItemUnit / 1000;
      return sum + (qtyInItemUnit * unitCost);
    }, 0);

    const grossProfit = Math.max(0, dishPrice - rawCost);
    const foodCostPct = dishPrice > 0 ? ((rawCost / dishPrice) * 100).toFixed(1) : 0;
    const marginPct = dishPrice > 0 ? ((grossProfit / dishPrice) * 100).toFixed(1) : 0;

    return {
      name: rec.menuItemName,
      sellingPrice: dishPrice,
      rawCost: Math.round(rawCost),
      grossProfit: Math.round(grossProfit),
      foodCostPct: parseFloat(foodCostPct),
      marginPct: parseFloat(marginPct),
      ingredientCount: rec.ingredients?.length || 0,
    };
  });

  // Handlers
  const handleToggleMode = (newMode) => {
    dispatch({ type: 'SET_KITCHEN_INVENTORY_MODE', payload: newMode });
    showToast(`Switched to ${newMode === 'simple' ? 'Simple' : 'Enterprise'} Kitchen Inventory Mode`);
  };

  const handleQuickUpdateSubmit = (e) => {
    e.preventDefault();
    if (!quickUpdateItem || !quickQty) return alert('Enter quantity');
    const val = parseFloat(quickQty);
    if (isNaN(val) || val <= 0) return alert('Enter valid quantity');

    if (quickType === 'in') {
      dispatch({
        type: 'LOG_STOCK_IN',
        payload: {
          itemId: quickUpdateItem.id,
          qty: val,
          unit: quickUpdateItem.unit,
          unitPrice: quickUpdateItem.unitCost,
          reason: 'Quick Stock In',
        },
      });
      showToast(`Added +${val} ${quickUpdateItem.unit} to ${quickUpdateItem.name}`);
    } else {
      dispatch({
        type: 'LOG_WASTAGE',
        payload: {
          itemId: quickUpdateItem.id,
          qty: val,
          unit: quickUpdateItem.unit,
          reason: 'Quick Kitchen Stock Deduct',
        },
      });
      showToast(`Deducted -${val} ${quickUpdateItem.unit} from ${quickUpdateItem.name}`);
    }
    setQuickUpdateItem(null);
    setQuickQty('');
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return alert('Please enter item name');
    dispatch({
      type: 'ADD_INVENTORY_ITEM',
      payload: {
        sku: `RAW-${Math.floor(100 + Math.random() * 900)}`,
        name: itemForm.name.trim(),
        category: itemForm.category,
        unit: itemForm.unit,
        currentStock: 0,
        minStockLevel: parseFloat(itemForm.minStockLevel) || 5,
        unitCost: parseFloat(itemForm.unitCost) || 0,
        supplier: itemForm.supplier || 'General Supplier',
        batchNumber: itemForm.batchNumber || `BAT-${Date.now().toString().slice(-4)}`,
        expiryDate: itemForm.expiryDate || '',
      },
    });
    setShowAddItemModal(false);
    setItemForm({ name: '', category: 'Dairy', unit: 'kg', minStockLevel: 5, unitCost: 100, supplier: '', batchNumber: '', expiryDate: '' });
    showToast('Inventory item added successfully');
  };

  const handleStockIn = (e) => {
    e.preventDefault();
    if (!stockInForm.itemId || !stockInForm.qty) return alert('Select item and enter quantity');
    dispatch({
      type: 'LOG_STOCK_IN',
      payload: stockInForm,
    });
    setShowStockInModal(false);
    setStockInForm({ itemId: '', qty: '', unit: 'kg', unitPrice: '', reason: '', supplier: '', batchNumber: '', expiryDate: '' });
    showToast('Stock inward logged successfully');
  };

  const handleWastage = (e) => {
    e.preventDefault();
    if (!wastageForm.itemId || !wastageForm.qty) return alert('Select item and enter quantity');
    dispatch({
      type: 'LOG_WASTAGE',
      payload: wastageForm,
    });
    setShowWastageModal(false);
    setWastageForm({ itemId: '', qty: '', unit: 'kg', reason: '' });
    showToast('Wastage logged');
  };

  const handleSaveRecipe = (e) => {
    e.preventDefault();
    if (!recipeForm.menuItemName) return alert('Select a menu item');
    dispatch({
      type: 'SAVE_RECIPE',
      payload: recipeForm,
    });
    setShowRecipeModal(false);
    showToast('Recipe BOM saved successfully');
  };

  const handleAddSupplier = (e) => {
    e.preventDefault();
    if (!supplierForm.name) return alert('Enter supplier name');
    dispatch({
      type: 'ADD_SUPPLIER',
      payload: supplierForm,
    });
    setShowSupplierModal(false);
    setSupplierForm({ name: '', phone: '', email: '', address: '', gstin: '' });
    showToast('Supplier added');
  };

  const handleOpenAuditModal = () => {
    const initialCounts = {};
    inventoryItems.forEach(item => {
      initialCounts[item.id] = { physicalQty: item.currentStock, reason: '' };
    });
    setAuditForm({ notes: 'Weekly Kitchen Physical Count', items: initialCounts });
    setShowAuditModal(true);
  };

  const handleSaveAudit = (e) => {
    e.preventDefault();
    const auditItems = Object.keys(auditForm.items).map(itemId => {
      const item = inventoryItems.find(i => i.id === itemId);
      const physicalQty = parseFloat(auditForm.items[itemId].physicalQty) || 0;
      const variance = parseFloat((physicalQty - (item?.currentStock || 0)).toFixed(2));
      const costLoss = Math.round(variance * (item?.unitCost || 0));
      return {
        itemId,
        name: item?.name || 'Item',
        systemQty: item?.currentStock || 0,
        physicalQty,
        variance,
        unit: item?.unit || 'kg',
        costLoss,
        reason: auditForm.items[itemId].reason || 'Count discrepancy',
      };
    });

    dispatch({
      type: 'CREATE_STOCK_AUDIT',
      payload: { notes: auditForm.notes, items: auditItems },
    });
    setShowAuditModal(false);
    showToast('Stock physical audit saved as Draft');
  };

  const handleReconcileAudit = (auditId) => {
    dispatch({ type: 'RECONCILE_AUDIT', payload: auditId });
    showToast('Stock audit reconciled! Inventory adjusted.');
  };

  const handleOpenPOModal = () => {
    const autoPOItems = lowStockItems.map(item => ({
      itemId: item.id,
      name: item.name,
      qty: Math.max(10, (item.minStockLevel * 2) - item.currentStock),
      unit: item.unit,
      unitPrice: item.unitCost,
      total: Math.round(Math.max(10, (item.minStockLevel * 2) - item.currentStock) * item.unitCost),
    }));

    setPOForm({
      supplier: suppliers[0]?.name || 'Fresh Dairy & Farms',
      notes: 'Purchase Order for Low Stock Replenishment',
      items: autoPOItems,
    });
    setShowPOModal(true);
  };

  const handleSavePO = (e) => {
    e.preventDefault();
    if (poForm.items.length === 0) return alert('Add items to purchase order');
    const totalAmount = poForm.items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    dispatch({
      type: 'CREATE_PURCHASE_ORDER',
      payload: {
        supplier: poForm.supplier,
        notes: poForm.notes,
        totalAmount,
        expectedDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        items: poForm.items,
      },
    });
    setShowPOModal(false);
    showToast('Purchase Order generated');
  };

  // ----------------------------------------------------
  // RENDER: SIMPLE MODE VIEW (Lightweight 1-Page Kitchen)
  // ----------------------------------------------------
  if (currentMode === 'simple') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Top Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-200 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ChefHat className="text-emerald-600" size={22} />
                Kitchen Inventory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Zap size={12} /> Simple Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Minimalist Kitchen Stock Tracking for Head Chef & Kitchen Staff
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={() => handleToggleMode('advanced')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
              >
                <RefreshCw size={13} /> Switch to Enterprise Mode
              </button>
            )}
            <button
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm"
            >
              <Plus size={14} /> + New Item
            </button>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-3 gap-4 p-5 pb-2">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Total Raw Items</div>
              <div className="text-xl font-extrabold text-slate-800 mt-0.5">{totalItemsCount} Items</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Boxes size={20} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Stock Valuation</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-0.5">₹{totalStockValue.toLocaleString()}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Low Stock Alerts</div>
              <div className="text-xl font-extrabold text-amber-600 mt-0.5">{lowStockItems.length} Need Reorder</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        {/* Search & Stock Grid */}
        <div className="flex-1 overflow-auto p-5 pt-2 space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Quick search raw ingredient..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-slate-800 w-full focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold ${
                    selectedCategory === cat ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Stock Cards Grid */}
          <div className="grid grid-cols-3 gap-3.5">
            {filteredItems.map(item => {
              const isLow = item.currentStock <= item.minStockLevel;
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">{item.category}</div>
                      </div>
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          OK
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">{item.currentStock}</span>
                      <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">Min: {item.minStockLevel} {item.unit}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setQuickUpdateItem(item);
                        setQuickType('in');
                      }}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1"
                    >
                      + Add Stock
                    </button>
                    <button
                      onClick={() => {
                        setQuickUpdateItem(item);
                        setQuickType('out');
                      }}
                      className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-lg border border-red-200 flex items-center justify-center gap-1"
                    >
                      - Deduct
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Update Modal */}
        {quickUpdateItem && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {quickType === 'in' ? '+ Quick Stock Inward' : '- Quick Kitchen Stock Deduct'}
              </h3>
              <p className="text-xs text-slate-500 mb-3">{quickUpdateItem.name}</p>

              <form onSubmit={handleQuickUpdateSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Quantity ({quickUpdateItem.unit})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    placeholder={`Enter ${quickUpdateItem.unit}`}
                    value={quickQty}
                    onChange={e => setQuickQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickUpdateItem(null)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 text-xs font-semibold text-white rounded-lg ${
                      quickType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Confirm Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: ENTERPRISE MODE VIEW (Full Commercial Suite)
  // ----------------------------------------------------
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Top Header */}
      <div className="p-5 pb-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Boxes className="text-emerald-600" size={22} />
              Kitchen Inventory & Food Costing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
              🚀 Enterprise Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise Kitchen Management: POS Sync, Recipe Margins, Expiry Alerts & Stock Audit Reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isSuperAdmin && (
            <button
              onClick={() => handleToggleMode('simple')}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm"
            >
              <Zap size={13} className="text-emerald-600" /> Switch to Simple Mode
            </button>
          )}
          <button
            onClick={handleOpenAuditModal}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors"
          >
            <ClipboardCheck size={14} /> Physical Audit
          </button>
          <button
            onClick={handleOpenPOModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors"
          >
            <FileText size={14} /> Create PO
          </button>
          <button
            onClick={() => setShowStockInModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors"
          >
            <ArrowDownRight size={14} /> Stock Inward
          </button>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Raw Item
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-5 gap-3.5 px-5 pt-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Total Inventory Items</div>
            <div className="text-lg font-extrabold text-slate-800 mt-0.5">{totalItemsCount} Raw Items</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Total Stock Valuation</div>
            <div className="text-lg font-extrabold text-emerald-600 mt-0.5">₹{totalStockValue.toLocaleString()}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Avg. Food Cost %</div>
            <div className="text-lg font-extrabold text-purple-600 mt-0.5">
              {recipeCostings.length > 0
                ? (recipeCostings.reduce((s, c) => s + c.foodCostPct, 0) / recipeCostings.length).toFixed(1)
                : 27.5}%
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <DollarSign size={18} />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('alerts')}
          className={`bg-white border ${lowStockItems.length > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'} rounded-xl p-3.5 flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-400 transition-all`}
        >
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Low Stock Reorders</div>
            <div className="text-lg font-extrabold text-amber-600 mt-0.5">{lowStockItems.length} Items</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('alerts')}
          className={`bg-white border ${expiringItems.length > 0 ? 'border-red-300 bg-red-50/40' : 'border-slate-200'} rounded-xl p-3.5 flex items-center justify-between shadow-sm cursor-pointer hover:border-red-400 transition-all`}
        >
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-400">Expiring Soon (FEFO)</div>
            <div className="text-lg font-extrabold text-red-600 mt-0.5">{expiringItems.length} Items</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* Expiring Soon Banner if items exist */}
      {expiringItems.length > 0 && (
        <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            <ShieldAlert size={16} className="text-red-600" />
            <span>FEFO Alert: {expiringItems.length} perishable item(s) expiring within 7 days ({expiringItems.map(i => i.name).join(', ')})</span>
          </div>
          <button onClick={() => setActiveTab('alerts')} className="text-red-700 font-bold underline text-[11px]">
            View Alerts
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-1 px-5 pt-3 border-b border-slate-200">
        {[
          { id: 'stock', label: 'Stock Register', icon: Boxes },
          { id: 'costing', label: 'Food Cost & Margins', icon: DollarSign, badge: `${recipeCostings.length} Dishes` },
          { id: 'recipes', label: 'Recipe BOM', icon: ChefHat },
          { id: 'audits', label: 'Physical Audits & Variance', icon: ClipboardCheck, badge: audits.length },
          { id: 'pos', label: 'Purchase Orders', icon: FileText, badge: purchaseOrders.length },
          { id: 'transactions', label: 'Stock Movements', icon: ArrowUpRight },
          { id: 'suppliers', label: 'Suppliers', icon: Truck },
          { id: 'alerts', label: 'Low/Expiry Alerts', icon: AlertTriangle, badge: lowStockItems.length + expiringItems.length, badgeColor: 'bg-red-500' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full text-white font-bold ${tab.badgeColor || 'bg-slate-700'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-auto p-5">
        {/* 1. STOCK REGISTER TAB */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 flex-1 max-w-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item name or SKU..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 w-full focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Filter size={12} /> Category:
                </span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory Items Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">SKU / Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Min. Threshold</th>
                    <th className="py-3 px-4">Unit Cost</th>
                    <th className="py-3 px-4">Batch / Expiry</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => {
                    const isLow = item.currentStock <= item.minStockLevel;
                    const isOut = item.currentStock <= 0;
                    const isExp = item.expiryDate && item.expiryDate <= sevenDaysLater;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {item.minStockLevel} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          ₹{item.unitCost} / {item.unit}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-[10px] text-slate-600">{item.batchNumber || '—'}</div>
                          {item.expiryDate && (
                            <div className={`text-[10px] font-semibold ${isExp ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                              Exp: {item.expiryDate}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.supplier || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setStockInForm({ ...stockInForm, itemId: item.id, unit: item.unit });
                                setShowStockInModal(true);
                              }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold transition-colors"
                            >
                              + Stock In
                            </button>
                            <button
                              onClick={() => {
                                setWastageForm({ ...wastageForm, itemId: item.id, unit: item.unit });
                                setShowWastageModal(true);
                              }}
                              className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-[11px] font-semibold transition-colors"
                            >
                              - Wastage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. FOOD COST & MARGINS TAB (COGS) */}
        {activeTab === 'costing' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recipe Food Costing & Gross Profit Margins</h3>
                <p className="text-xs text-slate-500">
                  Calculates raw material cost per dish vs menu selling price (Target Food Cost $\le 30\%$)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Healthy (&le; 30%)</span>
                <span className="flex items-center gap-1 text-amber-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate (30%-40%)</span>
                <span className="flex items-center gap-1 text-red-600"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High Cost (&gt; 40%)</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Menu Dish Name</th>
                    <th className="py-3 px-4">Selling Price (₹)</th>
                    <th className="py-3 px-4">Raw Material Cost (₹)</th>
                    <th className="py-3 px-4">Gross Profit (₹)</th>
                    <th className="py-3 px-4">Food Cost %</th>
                    <th className="py-3 px-4">Profit Margin %</th>
                    <th className="py-3 px-4 text-right">Margin Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recipeCostings.map((c, idx) => {
                    const isHealthy = c.foodCostPct <= 30;
                    const isModerate = c.foodCostPct > 30 && c.foodCostPct <= 40;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">₹{c.sellingPrice}</td>
                        <td className="py-3 px-4 font-bold text-red-600">₹{c.rawCost}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">₹{c.grossProfit}</td>
                        <td className="py-3 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                            isHealthy ? 'bg-emerald-100 text-emerald-800' : isModerate ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {c.foodCostPct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-800">{c.marginPct}%</td>
                        <td className="py-3 px-4 text-right font-bold">
                          {isHealthy ? (
                            <span className="text-emerald-600 flex items-center justify-end gap-1"><TrendingDown size={14} className="rotate-180" /> High Margin</span>
                          ) : isModerate ? (
                            <span className="text-amber-600">Fair Margin</span>
                          ) : (
                            <span className="text-red-600">Low Margin Alert</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. PHYSICAL STOCK AUDITS & VARIANCE RECONCILIATION TAB */}
        {activeTab === 'audits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Physical Stock Audits & Discrepancy Reconciliation</h3>
                <p className="text-xs text-slate-500">
                  Compare actual shelf count against system stock to detect theft, spoilage, or over-portioning loss
                </p>
              </div>
              <button
                onClick={handleOpenAuditModal}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg"
              >
                <ClipboardCheck size={14} /> Conduct Physical Audit
              </button>
            </div>

            <div className="space-y-4">
              {audits.map(audit => (
                <div key={audit.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{audit.auditNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Date: {audit.date} · {audit.notes}</div>
                    </div>
                    <div>
                      {audit.status === 'reconciled' ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                          <CheckCircle2 size={13} /> Reconciled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleReconcileAudit(audit.id)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                        >
                          Reconcile & Update Stock
                        </button>
                      )}
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="py-2 px-3">Item Name</th>
                        <th className="py-2 px-3">System Qty</th>
                        <th className="py-2 px-3">Physical Qty</th>
                        <th className="py-2 px-3">Variance</th>
                        <th className="py-2 px-3">Est. Cost Discrepancy</th>
                        <th className="py-2 px-3">Reason Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(audit.items || []).map((ai, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-bold text-slate-800">{ai.name}</td>
                          <td className="py-2 px-3 text-slate-600">{ai.systemQty} {ai.unit}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{ai.physicalQty} {ai.unit}</td>
                          <td className={`py-2 px-3 font-extrabold ${ai.variance < 0 ? 'text-red-600' : ai.variance > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {ai.variance > 0 ? `+${ai.variance}` : ai.variance} {ai.unit}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-700">₹{Math.abs(ai.costLoss || 0)}</td>
                          <td className="py-2 px-3 text-slate-500 italic">{ai.reason || 'Count Variance'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. PURCHASE ORDERS TAB */}
        {activeTab === 'pos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Purchase Orders (PO Workflow)</h3>
                <p className="text-xs text-slate-500">Generate vendor purchase orders to replenish low-stock items</p>
              </div>
              <button
                onClick={handleOpenPOModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg"
              >
                <Plus size={14} /> Create Purchase Order
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {purchaseOrders.map(po => (
                <div key={po.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{po.poNumber}</div>
                      <div className="text-[10px] text-slate-400">Supplier: <span className="font-semibold text-slate-700">{po.supplier}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-blue-600 text-sm">₹{po.totalAmount.toLocaleString()}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {po.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs mb-3">
                    {(po.items || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded text-slate-700">
                        <span>{item.name} ({item.qty} {item.unit})</span>
                        <span className="font-bold">₹{item.total}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedPO(po)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                    >
                      <Printer size={12} /> View Printable PO Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. RECIPE BOM MAPPING TAB */}
        {activeTab === 'recipes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recipe BOM (Bill of Materials) Mapping</h3>
                <p className="text-xs text-slate-500">
                  Map raw kitchen ingredients to restaurant dishes so POS orders automatically deduct stock!
                </p>
              </div>
              <button
                onClick={() => setShowRecipeModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg"
              >
                <Plus size={14} /> Map Dish Recipe
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {recipes.map((rec, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <ChefHat size={18} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{rec.menuItemName}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Auto-Deducts on KOT
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Required Ingredients per Portion:</div>
                    {(rec.ingredients || []).map((ing, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700">{ing.name || ing.inventoryItemId}</span>
                        <span className="font-bold text-slate-800">{ing.qty || ing.quantityRequired} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. STOCK MOVEMENT LOG TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-700">
                Stock Movements Audit Log
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Transaction Type</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Quantity Delta</th>
                    <th className="py-3 px-4">Total Value</th>
                    <th className="py-3 px-4">Ref / KOT</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryTransactions.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{tx.date}</td>
                      <td className="py-3 px-4">
                        {tx.type === 'purchase_in' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Purchase In
                          </span>
                        )}
                        {tx.type === 'pos_deduction' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            POS Deduction
                          </span>
                        )}
                        {tx.type === 'wastage' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Wastage Log
                          </span>
                        )}
                        {tx.type === 'adjustment' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            Audit Adjust
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{tx.item}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{tx.qty}</td>
                      <td className="py-3 px-4 text-slate-700">{tx.cost}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{tx.ref || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{tx.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Suppliers & Vendor Directory</h3>
                <p className="text-xs text-slate-500">Manage vendors for raw groceries, dairy, meat, and dry pantry</p>
              </div>
              <button
                onClick={() => setShowSupplierModal(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg"
              >
                <Plus size={14} /> Add New Supplier
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {suppliers.map(supp => (
                <div key={supp.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      <Truck size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{supp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">GST: {supp.gstin || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div><span className="font-medium text-slate-400">Phone:</span> {supp.phone}</div>
                    <div><span className="font-medium text-slate-400">Email:</span> {supp.email || '—'}</div>
                    <div><span className="font-medium text-slate-400">Address:</span> {supp.address || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. LOW STOCK & EXPIRY ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Low Stock Box */}
              <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-3">
                  <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="text-amber-600" size={16} /> Low Stock Warnings ({lowStockItems.length})
                  </span>
                  <button onClick={handleOpenPOModal} className="text-[11px] font-bold text-blue-600 hover:underline">
                    + Generate PO
                  </button>
                </div>
                <div className="space-y-2">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-500">Min: {item.minStockLevel} {item.unit}</div>
                      </div>
                      <span className="font-extrabold text-red-600">{item.currentStock} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiring Soon Box (FEFO) */}
              <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-red-100 mb-3">
                  <span className="font-bold text-xs text-red-900 flex items-center gap-1.5">
                    <Clock className="text-red-600" size={16} /> Expiring Soon FEFO ({expiringItems.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {expiringItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-red-50/60 p-2.5 rounded-lg border border-red-100 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-500">Batch: {item.batchNumber || 'N/A'}</div>
                      </div>
                      <span className="font-extrabold text-red-600">Exp: {item.expiryDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD INVENTORY ITEM */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-4">Add Raw Kitchen Item</h2>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer / Amul Milk / Tomatoes"
                  value={itemForm.name}
                  onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">UOM</label>
                  <select
                    value={itemForm.unit}
                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="L">L (Liter)</option>
                    <option value="ml">ml (Milliliter)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="pkt">pkt (Packets)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Batch No.</label>
                  <input
                    type="text"
                    placeholder="BAT-2026-..."
                    value={itemForm.batchNumber}
                    onChange={e => setItemForm({ ...itemForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={itemForm.expiryDate}
                    onChange={e => setItemForm({ ...itemForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    step="0.1"
                    value={itemForm.minStockLevel}
                    onChange={e => setItemForm({ ...itemForm, minStockLevel: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={itemForm.unitCost}
                    onChange={e => setItemForm({ ...itemForm, unitCost: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK INWARD */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-4">Log Stock Inward (Purchase Receipt)</h2>
            <form onSubmit={handleStockIn} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Raw Item</label>
                <select
                  required
                  value={stockInForm.itemId}
                  onChange={e => {
                    const found = inventoryItems.find(i => i.id === e.target.value);
                    setStockInForm({ ...stockInForm, itemId: e.target.value, unit: found?.unit || 'kg' });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                >
                  <option value="">-- Choose Item --</option>
                  {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.currentStock} {i.unit} in stock)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Quantity Received</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={stockInForm.qty}
                    onChange={e => setStockInForm({ ...stockInForm, qty: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={stockInForm.unitPrice}
                    onChange={e => setStockInForm({ ...stockInForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="BAT-..."
                    value={stockInForm.batchNumber}
                    onChange={e => setStockInForm({ ...stockInForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={stockInForm.expiryDate}
                    onChange={e => setStockInForm({ ...stockInForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG WASTAGE */}
      {showWastageModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-4">Log Wastage / Spoilage</h2>
            <form onSubmit={handleWastage} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Raw Item</label>
                <select
                  required
                  value={wastageForm.itemId}
                  onChange={e => {
                    const found = inventoryItems.find(i => i.id === e.target.value);
                    setWastageForm({ ...wastageForm, itemId: e.target.value, unit: found?.unit || 'kg' });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                >
                  <option value="">-- Choose Item --</option>
                  {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.currentStock} {i.unit})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Wastage Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={wastageForm.qty}
                  onChange={e => setWastageForm({ ...wastageForm, qty: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Reason for Wastage</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expired / Damaged / Spill"
                  value={wastageForm.reason}
                  onChange={e => setWastageForm({ ...wastageForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Deduct Wastage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECIPE MAPPER */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-4">Map Dish Recipe BOM</h2>
            <form onSubmit={handleSaveRecipe} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Restaurant Menu Item</label>
                <select
                  required
                  value={recipeForm.menuItemName}
                  onChange={e => {
                    const dish = menuItems.find(m => m.name === e.target.value);
                    setRecipeForm({ ...recipeForm, menuItemName: e.target.value, sellingPrice: dish?.price || 300 });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                >
                  <option value="">-- Choose Menu Dish --</option>
                  {menuItems.map(m => <option key={m.id} value={m.name}>{m.name} (₹{m.price})</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Raw Ingredients Required per Dish:</label>
                  <button
                    type="button"
                    onClick={() => setRecipeForm({ ...recipeForm, ingredients: [...recipeForm.ingredients, { inventoryItemId: '', qty: 0.1, unit: 'kg' }] })}
                    className="text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    + Add Ingredient
                  </button>
                </div>

                {recipeForm.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      required
                      value={ing.inventoryItemId}
                      onChange={e => {
                        const found = inventoryItems.find(i => i.id === e.target.value);
                        const updated = [...recipeForm.ingredients];
                        updated[idx] = { ...ing, inventoryItemId: e.target.value, name: found?.name, unit: found?.unit || 'kg' };
                        setRecipeForm({ ...recipeForm, ingredients: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    >
                      <option value="">Choose Raw Item</option>
                      {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>

                    <input
                      type="number"
                      step="0.001"
                      required
                      placeholder="Qty"
                      value={ing.qty}
                      onChange={e => {
                        const updated = [...recipeForm.ingredients];
                        updated[idx] = { ...ing, qty: parseFloat(e.target.value) || 0 };
                        setRecipeForm({ ...recipeForm, ingredients: updated });
                      }}
                      className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />

                    <span className="text-xs font-semibold text-slate-500 w-8">{ing.unit || 'kg'}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecipeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Save Recipe Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PHYSICAL AUDIT FORM */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] flex flex-col">
            <h2 className="text-base font-bold text-slate-800 mb-2">Conduct Kitchen Physical Stock Audit</h2>
            <p className="text-xs text-slate-500 mb-4">Enter actual counted stock on shelf to calculate variance and cost loss</p>

            <form onSubmit={handleSaveAudit} className="flex-1 flex flex-col overflow-hidden space-y-3">
              <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">System Qty</th>
                      <th className="py-2.5 px-3 w-28">Physical Count</th>
                      <th className="py-2.5 px-3">Reason Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryItems.map(item => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-bold text-slate-800">{item.name}</td>
                        <td className="py-2 px-3 text-slate-600">{item.currentStock} {item.unit}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={auditForm.items[item.id]?.physicalQty || ''}
                            onChange={e => setAuditForm({
                              ...auditForm,
                              items: {
                                ...auditForm.items,
                                [item.id]: { ...auditForm.items[item.id], physicalQty: e.target.value },
                              },
                            })}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bold"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={auditForm.items[item.id]?.reason || ''}
                            onChange={e => setAuditForm({
                              ...auditForm,
                              items: {
                                ...auditForm.items,
                                [item.id]: { ...auditForm.items[item.id], reason: e.target.value },
                              },
                            })}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          >
                            <option value="">Normal Count</option>
                            <option value="Over-portioning">Over-portioning</option>
                            <option value="Spoilage / Expiry">Spoilage / Expiry</option>
                            <option value="Unrecorded Theft">Unrecorded Theft</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  Save Physical Audit Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CREATE PO FORM */}
      {showPOModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-2">Create Supplier Purchase Order (PO)</h2>
            <form onSubmit={handleSavePO} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Target Supplier</label>
                <select
                  required
                  value={poForm.supplier}
                  onChange={e => setPOForm({ ...poForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                >
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.phone})</option>)}
                </select>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 p-2.5 rounded-xl">
                <div className="text-[11px] font-bold text-slate-600 uppercase">Items to Order:</div>
                {poForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={e => {
                          const updated = [...poForm.items];
                          updated[idx].qty = parseFloat(e.target.value) || 1;
                          setPOForm({ ...poForm, items: updated });
                        }}
                        className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs font-bold"
                      />
                      <span className="text-slate-500">{item.unit}</span>
                      <span className="font-bold text-emerald-600">₹{item.qty * item.unitPrice}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Generate Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: VIEW PRINTABLE PO SLIP */}
      {selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">PURCHASE ORDER {selectedPO.poNumber}</h2>
                <div className="text-[10px] text-slate-400">Date: {selectedPO.date} · YOYO Fun Resort</div>
              </div>
              <button onClick={() => setSelectedPO(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-800">VENDOR: {selectedPO.supplier}</div>
                <div className="text-[11px] text-slate-500">Status: {selectedPO.status} | Delivery Expected: {selectedPO.expectedDate}</div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2">Item</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedPO.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 font-bold text-slate-800">{item.name}</td>
                      <td className="py-2">{item.qty} {item.unit}</td>
                      <td className="py-2 text-right font-bold">₹{item.total || (item.qty * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-3 flex justify-between font-extrabold text-sm text-slate-800">
                <span>ESTIMATED TOTAL:</span>
                <span className="text-emerald-600">₹{selectedPO.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { window.print(); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer size={14} /> Print PO Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
