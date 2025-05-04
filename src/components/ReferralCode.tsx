
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';

interface ReferralCodeProps {
  code: string;
}

const ReferralCode: React.FC<ReferralCodeProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(`https://t.me/your_bot?start=${code}`);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  return (
    <div className="bg-secondary p-4 rounded-lg flex items-center justify-between">
      <div className="overflow-hidden">
        <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
        <p className="font-mono font-medium truncate">{code}</p>
      </div>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={handleCopy}
        className={copied ? "text-green-500" : ""}
      >
        <Copy size={16} />
      </Button>
    </div>
  );
};

export default ReferralCode;
