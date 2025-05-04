
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import LiveFeed from './LiveFeed';

const Header: React.FC = () => {
  const { user, balance, walletConnected, connectWallet } = useAuth();
  
  const handleConnectWallet = () => {
    connectWallet();
  };
  
  return (
    <header className="bg-card p-4 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {user?.photoUrl && (
            <img 
              src={user.photoUrl} 
              alt={user?.username} 
              className="w-10 h-10 rounded-full"
            />
          )}
          <div className="text-left">
            <p className="font-medium">{user?.username || 'Loading...'}</p>
            <p className="text-xs text-muted-foreground">ID: {user?.telegramId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!walletConnected ? (
            <Button onClick={handleConnectWallet} className="flex items-center gap-2">
              <Wallet size={16} />
              Connect Wallet
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
              <Wallet size={16} />
              <span className="font-bold text-lg">{balance}</span>
              <span className="text-xs text-muted-foreground">TON</span>
            </div>
          )}
        </div>
      </div>
      
      <LiveFeed />
    </header>
  );
};

export default Header;
