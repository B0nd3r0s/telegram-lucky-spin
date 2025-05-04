
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

const NewsButton: React.FC = () => {
  const handleOpenNewsChannel = () => {
    // In a real app, this would open the Telegram channel
    window.open('https://t.me/yourchannel', '_blank');
  };
  
  return (
    <Button 
      variant="outline" 
      className="w-full mb-6 flex items-center justify-center gap-2 bg-secondary border-primary"
      onClick={handleOpenNewsChannel}
    >
      <FileText size={18} />
      Join Our News Channel
    </Button>
  );
};

export default NewsButton;
