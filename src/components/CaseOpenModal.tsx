
import React, { useEffect } from 'react';
import { Gift } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CaseOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  gift: Gift;
}

const CaseOpenModal: React.FC<CaseOpenModalProps> = ({ isOpen, onClose, gift }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.getElementById('gift-reveal')?.classList.add('animate-case-reveal');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md case-open-overlay">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-4">
            Your Prize!
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6">
          <div
            id="gift-reveal"
            className="opacity-0 scale-90 transition-all duration-500"
          >
            <div className="bg-secondary p-6 rounded-xl shadow-lg animate-prize-glow mb-4">
              <img
                src={gift.imageUrl}
                alt={gift.name}
                className="w-32 h-32 object-contain mx-auto"
              />
            </div>
            <h3 className="text-center text-xl font-bold mt-4">{gift.name}</h3>
            <p className="text-center text-primary text-3xl font-bold mt-2">
              {gift.value} TON
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseOpenModal;
