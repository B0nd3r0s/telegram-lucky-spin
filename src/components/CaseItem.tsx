
import React, { useState } from 'react';
import { Case, Gift } from '@/types';
import { Button } from '@/components/ui/button';
import mockApi from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { triggerHapticFeedback } from '@/lib/telegram';
import CaseOpenModal from './CaseOpenModal';

interface CaseItemProps {
  caseItem: Case;
}

const CaseItem: React.FC<CaseItemProps> = ({ caseItem }) => {
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<Gift | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const { balance, refreshUser } = useAuth();
  
  const handleOpenCase = async () => {
    if (balance < caseItem.price) {
      toast({
        title: "Insufficient balance",
        description: "Please top up your balance to open this case",
        variant: "destructive",
      });
      return;
    }
    
    setIsOpening(true);
    try {
      const { gift } = await mockApi.openCase(caseItem.id);
      setResult(gift);
      setShowModal(true);
      triggerHapticFeedback('success');
      await refreshUser(); // Refresh user data to update balance
    } catch (error) {
      console.error('Failed to open case', error);
      toast({
        title: "Error",
        description: "Failed to open case",
        variant: "destructive",
      });
      triggerHapticFeedback('error');
    } finally {
      setIsOpening(false);
    }
  };
  
  return (
    <>
      <div className="bg-card rounded-lg overflow-hidden flex flex-col hover:scale-105 transition-transform duration-200">
        <div className="flex-1 p-4 flex items-center justify-center">
          <img 
            src={caseItem.imageUrl} 
            alt={caseItem.name}
            className="w-24 h-24 object-contain animate-float" 
          />
        </div>
        <div className="p-4 border-t border-muted bg-secondary">
          <h3 className="font-medium mb-1">{caseItem.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary">{caseItem.price} TON</span>
            <Button 
              size="sm"
              onClick={handleOpenCase}
              disabled={isOpening}
            >
              {isOpening ? 'Opening...' : 'Open'}
            </Button>
          </div>
        </div>
      </div>
      
      {showModal && result && (
        <CaseOpenModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          gift={result}
        />
      )}
    </>
  );
};

export default CaseItem;
