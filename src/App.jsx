import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ContentGenerator from './components/ContentGenerator';
import ContentRepurposer from './components/ContentRepurposer';
import Subscription from './components/Subscription';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'generate':
        return <ContentGenerator />;
      case 'repurpose':
        return <ContentRepurposer />;
      case 'subscription':
        return <Subscription />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="flex h-screen overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;