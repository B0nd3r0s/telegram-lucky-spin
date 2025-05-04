
import React, { useEffect, useState } from 'react';
import { Gift } from '@/types';
import mockApi from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/components/ui/use-toast';
import { PackageOpen } from 'lucide-react';

const Upgrade: React.FC = () => {
  const [inventory, setInventory] = useState<Gift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const gifts = await mockApi.getUserInventory();
        setInventory(gifts.filter(gift => !gift.isWithdrawn));
      } catch (error) {
        console.error('Failed to load inventory', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInventory();
  }, []);
  
  const handleCheckGift = (giftId: string) => {
    setSelectedGifts(prev => 
      prev.includes(giftId) ? 
      prev.filter(id => id !== giftId) : 
      [...prev, giftId]
    );
  };
  
  const handleUpgrade = async () => {
    if (selectedGifts.length < 2) {
      toast({
        title: "Select more gifts",
        description: "You need to select at least 2 gifts to upgrade",
        variant: "destructive",
      });
      return;
    }
    
    setUpgrading(true);
    try {
      // In a real app, this would call the API to upgrade the gifts
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate the upgrade result
      const selectedItems = inventory.filter(gift => selectedGifts.includes(gift.id));
      const totalValue = selectedItems.reduce((sum, gift) => sum + gift.value, 0);
      const newValue = Math.floor(totalValue * 1.2); // 20% bonus
      
      toast({
        title: "Upgrade successful!",
        description: `Your items were upgraded to a ${newValue} TON gift!`,
      });
      
      // Remove selected gifts from inventory and add the new one
      setInventory(prev => [
        ...prev.filter(gift => !selectedGifts.includes(gift.id)),
        {
          id: `new-${Date.now()}`,
          name: `TON x${newValue}`,
          imageUrl: '/placeholder.svg',
          value: newValue,
          isWithdrawn: false,
          createdAt: new Date()
        }
      ]);
      
      setSelectedGifts([]);
    } catch (error) {
      console.error('Failed to upgrade gifts', error);
      toast({
        title: "Upgrade failed",
        description: "Failed to upgrade your gifts",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 pb-24">
      <div className="bg-card p-4 rounded-lg shadow-lg mb-6">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <PackageOpen className="text-primary" />
          Upgrade Gifts
        </h1>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-secondary h-32 rounded-lg"></div>
            ))}
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-4">You don't have any gifts to upgrade yet.</p>
            <Button asChild>
              <a href="/">Open Cases</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {inventory.map((gift) => (
                <div 
                  key={gift.id}
                  className={`bg-secondary p-3 rounded-lg border-2 transition-all ${
                    selectedGifts.includes(gift.id) ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`gift-${gift.id}`}
                      checked={selectedGifts.includes(gift.id)}
                      onCheckedChange={() => handleCheckGift(gift.id)}
                    />
                    <div className="bg-muted rounded-lg p-2">
                      <img 
                        src={gift.imageUrl} 
                        alt={gift.name} 
                        className="w-10 h-10 object-contain" 
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{gift.name}</p>
                      <p className="text-xs text-primary">{gift.value} TON</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col items-center">
              <p className="mb-4 text-sm text-muted-foreground text-center">
                Select two or more gifts to combine and upgrade them to a higher value gift. 
                The upgrade gives you a 20% bonus on the total value.
              </p>
              <Button 
                onClick={handleUpgrade} 
                disabled={selectedGifts.length < 2 || upgrading}
                className="w-full"
              >
                {upgrading ? 'Upgrading...' : 'Upgrade Selected Gifts'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Upgrade;
