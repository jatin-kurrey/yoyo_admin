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
import { sidebarModules } from './data/mockData';

function AppInner() {
  const { roomCategories, bookings, user, loading, authChecked, dates, dayLabels, usingMockData } = useApp();
  const [activeModule, setActiveModule] = useState('calendar');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState(null);

  // If user role changes, ensure they are redirected away from forbidden views
  useEffect(() => {
    const role = user?.role;
    if (role === 'hk_staff' && activeModule !== 'hk') {
      setActiveModule('hk');
    } else if (role === 'booking_staff' && !['calendar', 'roomview', 'reports'].includes(activeModule)) {
      setActiveModule('calendar');
    } else if (role === 'staff' && ['pricing', 'accounts', 'settings'].includes(activeModule)) {
      setActiveModule('calendar');
    }
  }, [user, activeModule]);

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
    if (role === 'staff' && ['pricing', 'accounts', 'settings'].includes(module)) return;
    setActiveModule(module);
  };

  const renderMain = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardPage />;
      case 'roomview': return <RoomViewPage />;
      case 'pos': return <POSPage />;
      case 'hk': return <HousekeepingPage />;
      case 'pricing': return <PricingPage />;
      case 'accounts': return <AccountsPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'calendar':
      default:
        return (
          <CalendarGrid
            dates={dates}
            dayLabels={dayLabels}
            roomCategories={roomCategories}
            bookings={bookings}
            todayIdx={0}
            onCellClick={(room, date) => openNewBooking(room, date)}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-800">
      <Header onNewBooking={() => openNewBooking()} onNavigate={handleNavigate} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar modules={sidebarModules} activeModule={activeModule} onNavigate={handleNavigate} />
        {renderMain()}
        {needsRightPanel && <RightPanel />}
      </div>
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
