import React, { useContext, useState } from 'react';
import { AppContext } from './context/AppContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { AssetDirectory } from './components/AssetDirectory.jsx';
import { AssetAllocation } from './components/AssetAllocation.jsx';
import { ResourceBooking } from './components/ResourceBooking.jsx';
import { Maintenance } from './components/Maintenance.jsx';
import { AssetAudit } from './components/AssetAudit.jsx';
import { OrgSetup } from './components/OrgSetup.jsx';
import { ActivityLogs } from './components/ActivityLogs.jsx';
import { Reports } from './components/Reports.jsx';
import { Login } from './components/Login.jsx';

function App() {
  const { currentUser } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'assets':
        return <AssetDirectory />;
      case 'allocations':
        return <AssetAllocation />;
      case 'bookings':
        return <ResourceBooking />;
      case 'maintenance':
        return <Maintenance />;
      case 'audits':
        return <AssetAudit />;
      case 'org-setup':
        return <OrgSetup />;
      case 'logs':
        return <ActivityLogs />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
