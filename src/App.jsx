import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import RightPanel from './components/RightPanel';
import NewBookingModal from './components/NewBookingModal';
import DashboardPage from './pages/DashboardPage';
import RoomViewPage from './pages/RoomViewPage';
import POSPage from './pages/POSPage';
import HousekeepingPage from './pages/HousekeepingPage';
import PricingPage from './pages/PricingPage';
import AccountsPage from './pages/AccountsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import WaterparkCounterPage from './pages/WaterparkCounterPage';
import WebsiteCMSPage from './pages/WebsiteCMSPage';
import KitchenInventoryPage from './pages/KitchenInventoryPage';
import { sidebarModules } from './data/mockData';
import { ChevronLeft } from 'lucide-react';

function AppInner() {
  const { roomCategories, bookings, user, loading, authChecked, dates, dayLabels, usingMockData, enabledModules } = useApp();
  const [activeModule, setActiveModule] = useState('calendar');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // If user role changes or module disabled, redirect away from forbidden views
  useEffect(() => {
    const role = user?.role;
    if (role === 'hk_staff' && activeModule !== 'hk') {
      setActiveModule('hk');
    } else if (role === 'booking_staff' && !['calendar', 'roomview', 'reports'].includes(activeModule)) {
      setActiveModule('calendar');
    } else if (role === 'restaurant_staff' && !['pos', 'kitchen_inventory'].includes(activeModule)) {
      setActiveModule('pos');
    } else if (role === 'kitchen_staff' && !['kitchen_inventory', 'pos'].includes(activeModule)) {
      setActiveModule('kitchen_inventory');
    } else if (role === 'waterpark_staff' && activeModule !== 'waterpark') {
      setActiveModule('waterpark');
    } else if (role === 'staff' && ['pricing', 'accounts', 'settings'].includes(activeModule)) {
      setActiveModule('calendar');
    } else if (enabledModules[activeModule] === false) {
      setActiveModule('dashboard');
    }
  }, [user, activeModule, enabledModules]);

  // Loading indicator
  if (loading || !authChecked) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Loading System...</div>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return <LoginPage />;
  }

  const needsRightPanel = ['calendar', 'roomview'].includes(activeModule);

  const openNewBooking = (room, date) => {
    setBookingPrefill(room ? { room, date } : null);
    setShowNewBooking(true);
  };

  const handleNavigate = (module) => {
    const role = user?.role;
    if (role === 'hk_staff' && module !== 'hk') return;
    if (role === 'booking_staff' && !['calendar', 'roomview', 'reports'].includes(module)) return;
    if (role === 'restaurant_staff' && !['pos', 'kitchen_inventory'].includes(module)) return;
    if (role === 'waterpark_staff' && module !== 'waterpark') return;
    if (module === 'website_cms' && !['admin', 'super_admin'].includes(role)) return;
    if (role === 'staff' && ['pricing', 'accounts', 'settings', 'website_cms'].includes(module)) return;
    setActiveModule(module);
  };

  const renderMain = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardPage />;
      case 'roomview': return <RoomViewPage />;
      case 'pos': return <POSPage />;
      case 'kitchen_inventory': return <KitchenInventoryPage />;
      case 'hk': return <HousekeepingPage />;
      case 'pricing': return <PricingPage />;
      case 'accounts': return <AccountsPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'waterpark': return <WaterparkCounterPage />;
      case 'website_cms': return <WebsiteCMSPage />;
      case 'calendar':
      default:
        return (
          <CalendarGrid
            roomCategories={roomCategories}
            bookings={bookings}
            onCellClick={(room, date) => openNewBooking(room, date)}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-800 relative">
      <Header onNewBooking={() => openNewBooking()} onNavigate={handleNavigate} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar modules={sidebarModules} activeModule={activeModule} onNavigate={handleNavigate} />
        {renderMain()}
        {needsRightPanel && showRightPanel && <RightPanel onClose={() => setShowRightPanel(false)} />}
      </div>
      {needsRightPanel && !showRightPanel && (
        <button
          onClick={() => setShowRightPanel(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-l-lg shadow-lg z-30 transition-all border border-slate-700 border-r-0 cursor-pointer flex items-center justify-center"
          title="Show Today's Overview"
        >
          <ChevronLeft size={15} />
        </button>
      )}
      {showNewBooking && (
        <NewBookingModal
          onClose={() => { setShowNewBooking(false); setBookingPrefill(null); }}
          prefillRoom={bookingPrefill?.room}
          prefillDate={bookingPrefill?.date}
        />
      )}
      {usingMockData && (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-amber-500 text-white text-[10px] font-semibold text-center py-1 tracking-wider">
          ⚠ DEMO MODE — Showing sample data. Connect to backend for live operations.
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </AppProvider>
  );
}
