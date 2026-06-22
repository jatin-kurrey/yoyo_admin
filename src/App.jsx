import { useState } from 'react';
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
import { sidebarModules, dayLabels, dates } from './data/mockData';

function AppInner() {
  const [activeModule, setActiveModule] = useState('calendar');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState(null);
  const { roomCategories, bookings } = useApp();

  const needsRightPanel = ['calendar', 'roomview'].includes(activeModule);

  const openNewBooking = (room, date) => {
    setBookingPrefill(room ? { room, date } : null);
    setShowNewBooking(true);
  };

  const handleNavigate = (module) => {
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
