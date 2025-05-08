
import React, { useEffect, useState } from 'react';
import { Gift } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/components/ui/use-toast';
import { PackageOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import soundManager from '@/lib/sounds';
import { api } from '@/lib/api';

const Upgrade: React.FC = () => {
  const [inventory, setInventory] = useState<Gift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMode, setUpgradeMode] = useState<'combine' | 'upgrade'>('combine');
  const { toast } = useToast();
  
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await fetch('/api/user/inventory', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to load inventory');
        
        const data = await response.json();
        setInventory(data.gifts.filter(gift => !gift.isWithdrawn));
      } catch (error) {
        console.error('Failed to load inventory', error);
        toast({
          title: "Error",
          description: "Failed to load your inventory. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadInventory();
  }, [toast]);
  
  const handleCheckGift = (giftId: string) => {
    if (upgradeMode === 'upgrade') {
      // In upgrade mode, only allow selecting 1 gift
      setSelectedGifts([giftId]);
      return;
    }
    
    // In combine mode, allow up to 2 gifts
    setSelectedGifts(prev => {
      if (prev.includes(giftId)) {
        // Deselect this gift
        return prev.filter(id => id !== giftId);
      } else {
        // Select this gift, but limit to 2 total
        const newSelection = [...prev, giftId];
        return newSelection.length > 2 ? newSelection.slice(1) : newSelection;
      }
    });
  };
  
  const handleModeChange = (newMode: string) => {
    const mode = newMode as 'combine' | 'upgrade';
    setUpgradeMode(mode);
    
    // Clear selections when changing modes
    if (mode === 'upgrade' && selectedGifts.length > 1) {
      setSelectedGifts(selectedGifts.slice(0, 1));
    }
  };
  
  const handleUpgrade = async () => {
    if ((upgradeMode === 'combine' && selectedGifts.length !== 2) ||
        (upgradeMode === 'upgrade' && selectedGifts.length !== 1)) {
      toast({
        title: "Select gifts",
        description: upgradeMode === 'combine' 
          ? "You need to select exactly 2 gifts to combine" 
          : "Select 1 gift to upgrade",
        variant: "destructive",
      });
      return;
    }
    
    setUpgrading(true);
    soundManager.play('click');
    
    try {
      const response = await fetch('/api/upgrade/combine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          giftIds: selectedGifts,
          mode: upgradeMode
        })
      });
      
      if (!response.ok) {
        throw new Error('Upgrade failed');
      }
      
      const data = await response.json();
      
      // Play appropriate sound based on result
      if (data.result.success) {
        if (data.result.multiplier < 1) {
          soundManager.play('downgrade');
        } else {
          soundManager.play('upgrade');
        }
      } else {
        soundManager.play('lose');
      }
      
      // Show result
      if (data.result.success) {
        toast({
          title: "Upgrade successful!",
          description: `Your items were upgraded to a ${data.newGift.value} TON gift!`,
        });
      } else {
        toast({
          title: "Upgrade failed",
          description: "The upgrade attempt was unsuccessful!",
          variant: "destructive",
        });
      }
      
      // Update inventory
      // Remove selected gifts
      const updatedInventory = inventory.filter(gift => !selectedGifts.includes(gift.id));
      
      // Add new gift if upgrade was successful
      if (data.result.success && data.newGift) {
        updatedInventory.push({
          id: data.newGift._id,
          name: data.newGift.name,
          imageUrl: data.newGift.imageUrl || '/placeholder.svg',
          value: data.newGift.value,
          isWithdrawn: false,
          createdAt: new Date()
        });
      }
      
      setInventory(updatedInventory);
      setSelectedGifts([]);
      
    } catch (error) {
      console.error('Failed to upgrade gifts', error);
      soundManager.play('lose');
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
        
        <Tabs defaultValue="combine" onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="combine" className="flex items-center gap-1">
              <ArrowUp className="w-4 h-4" />
              Combine 2 Gifts
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="flex items-center gap-1">
              <ArrowDown className="w-4 h-4" />
              Single Gift Upgrade
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="combine">
            <Card>
              <CardHeader>
                <CardTitle>Combine Two Gifts</CardTitle>
                <CardDescription>
                  Select two gifts to combine them for a chance at increased value. 
                  Possible outcomes:
                </CardDescription>
                <div className="text-sm text-muted-foreground">
                  <div className="grid grid-cols-2 gap-2">
                    <div>• 10% chance: 0.8x value (downgrade)</div>
                    <div>• 30% chance: 1.0x value (same)</div>
                    <div>• 40% chance: 1.2x value (upgrade)</div>
                    <div>• 20% chance: 1.5x value (big upgrade)</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderInventoryGrid()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upgrade">
            <Card>
              <CardHeader>
                <CardTitle>Single Gift Upgrade</CardTitle>
                <CardDescription>
                  Attempt to upgrade a single gift. Higher risk, higher reward!
                  Possible outcomes:
                </CardDescription>
                <div className="text-sm text-muted-foreground">
                  <div className="grid grid-cols-2 gap-2">
                    <div>• 15% chance: 0x value (lose it)</div>
                    <div>• 30% chance: 1.5x value</div>
                    <div>• 25% chance: 2x value</div>
                    <div>• 15% chance: 3x value</div>
                    <div>• 10% chance: 5x value</div>
                    <div>• 4% chance: 10x value</div>
                    <div>• 1% chance: 20x value</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderInventoryGrid()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
  
  function renderInventoryGrid() {
    if (loading) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-secondary h-32 rounded-lg"></div>
          ))}
        </div>
      );
    }
    
    if (inventory.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="mb-4">You don't have any gifts to upgrade yet.</p>
          <Button asChild>
            <a href="/">Open Cases</a>
          </Button>
        </div>
      );
    }
    
    return (
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
          <Button 
            onClick={handleUpgrade} 
            disabled={
              (upgradeMode === 'combine' && selectedGifts.length !== 2) || 
              (upgradeMode === 'upgrade' && selectedGifts.length !== 1) || 
              upgrading
            }
            className="w-full"
          >
            {upgrading ? 'Upgrading...' : upgradeMode === 'combine' ? 'Combine Selected Gifts' : 'Upgrade Selected Gift'}
          </Button>
        </div>
      </>
    );
  }
};

export default Upgrade;
