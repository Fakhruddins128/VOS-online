import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import PendingOrders from './pages/PendingOrders';
import PurchaseOrderDraft from './pages/PurchaseOrderDraft';
import './styles/dynamics-theme.css';
import './App.css';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Pages where sidebar should be hidden
  const hideSidebarPages = ['/', '/login'];
  const shouldShowSidebar = !hideSidebarPages.includes(location.pathname);

  return (
    <div className="app">
      <div className={`app-layout ${!shouldShowSidebar ? 'no-sidebar' : ''}`}>
        {shouldShowSidebar && (
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        )}
        <div className="app-main">
          <Navbar 
            toggleSidebar={shouldShowSidebar ? toggleSidebar : null} 
            showSidebarToggle={shouldShowSidebar}
          />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pending-orders" element={<PendingOrders />} />
              <Route path="/purchase-order-draft" element={<PurchaseOrderDraft />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
