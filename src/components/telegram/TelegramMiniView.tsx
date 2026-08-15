import React, { useState } from 'react';
import SREYMARALayout from '@/components/sreymara/SREYMARALayout';
import HomeTab from '@/components/sreymara/tabs/HomeTab';
import ExploreTab from '@/components/sreymara/tabs/ExploreTab';
import LiveTab from '@/components/sreymara/tabs/LiveTab';
import ActiveTab from '@/components/sreymara/tabs/ActiveTab';
import StreamTab from '@/components/sreymara/tabs/StreamTab';
import SolanaGathering from '@/components/sreymara/SolanaGathering';
import AIEditorToolbar from '@/components/sreymara/AIEditorToolbar';

const TelegramMiniView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'explore':
        return <ExploreTab />;
      case 'live':
        return <LiveTab />;
      case 'active':
        return <ActiveTab />;
      case 'stream':
        return <StreamTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <SREYMARALayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      showAIEditor={true}
      showSolanaPanel={true}
    >
      {renderTabContent()}
      
      {/* Solana Gathering Panel - shown below tabs on Home or as overlay */}
      {activeTab === 'home' && (
        <div className="mt-4">
          <SolanaGathering />
        </div>
      )}

      {/* AI Editor - shown on Explore tab */}
      {activeTab === 'explore' && (
        <div className="mt-4">
          <AIEditorToolbar />
        </div>
      )}
    </SREYMARALayout>
  );
};

export default TelegramMiniView;
