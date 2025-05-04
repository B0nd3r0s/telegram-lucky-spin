
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Gift } from '@/types';
import mockApi from '@/lib/api';
import { Wallet, Plus } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, balance, walletConnected, connectWallet } = useAuth();
  const [inventory, setInventory] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const gifts = await mockApi.getUserInventory();
        setInventory(gifts);
      } catch (error) {
        console.error('Failed to load inventory', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInventory();
  }, []);
  
  const handleDeposit = () => {
    // In a real app, this would open the deposit modal or redirect to payment
    alert("In a real app, this would open the TON payment interface");
  };
  
  return (
    <div className="container mx-auto px-4 pb-24">
      <div className="bg-card p-4 rounded-lg shadow-lg mb-6">
        <div className="flex flex-col items-center mb-6">
          <img 
            src={user?.photoUrl || '/placeholder.svg'} 
            alt={user?.username} 
            className="w-24 h-24 rounded-full mb-4" 
          />
          <h1 className="text-xl font-bold">{user?.username}</h1>
          <p className="text-sm text-muted-foreground">ID: {user?.telegramId}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-secondary p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-xl font-bold">{balance} TON</p>
            </div>
            <Button onClick={handleDeposit} className="flex items-center gap-2">
              <Plus size={16} />
              Deposit
            </Button>
          </div>
          
          {!walletConnected && (
            <Button 
              variant="outline" 
              onClick={connectWallet}
              className="w-full flex items-center justify-center gap-2"
            >
              <Wallet size={16} />
              Connect Wallet
            </Button>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-4">Your Gifts</h2>
          
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-secondary h-32 rounded-lg" />
              ))}
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8 bg-secondary rounded-lg">
              <p className="mb-4">You haven't won any gifts yet. Time to fix that!</p>
              <Button asChild>
                <a href="/">Open Cases</a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {inventory.map(gift => (
                <div 
                  key={gift.id}
                  className={`bg-secondary p-4 rounded-lg ${
                    gift.isWithdrawn ? 'grayscale opacity-70' : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="bg-muted rounded-lg p-3 mb-2">
                      <img 
                        src={gift.imageUrl} 
                        alt={gift.name} 
                        className="w-16 h-16 object-contain" 
                      />
                    </div>
                    <p className="text-sm font-medium">{gift.name}</p>
                    <p className="text-xs text-primary">{gift.value} TON</p>
                    {gift.isWithdrawn ? (
                      <p className="text-xs text-muted-foreground mt-2">Withdrawn</p>
                    ) : (
                      <Button size="sm" variant="link" className="mt-2">
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
