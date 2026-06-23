import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
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
import { sidebarModules, dayLabels, dates } from './data/mockData';

function AppInner() {
  const { roomCategories, bookings, user, loading, authChecked } = useApp();
  const [activeModule, setActiveModule] = useState('calendar');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState(null);

  // If user role changes (e.g. staff log in), ensure they are redirected away from forbidden views
  useEffect(() => {
    if (user?.role === 'staff' && ['pricing', 'accounts', 'settings'].includes(activeModule)) {
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
    // Prevent staff from navigation into admin pages
    if (user?.role === 'staff' && ['pricing', 'accounts', 'settings'].includes(module)) {
      return;
    }
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
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
