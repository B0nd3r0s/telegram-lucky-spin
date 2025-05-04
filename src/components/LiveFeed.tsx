
import React, { useEffect, useState } from 'react';
import { LiveWin } from '@/types';
import mockApi from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

const LiveFeed: React.FC = () => {
  const [liveWins, setLiveWins] = useState<LiveWin[]>([]);
  
  useEffect(() => {
    const loadLiveWins = async () => {
      try {
        const wins = await mockApi.getLiveWins();
        setLiveWins(wins.filter(win => win.giftValue >= 5));
      } catch (error) {
        console.error('Failed to load live wins', error);
      }
    };
    
    loadLiveWins();
    
    // In a real app, we would use websockets to get live updates
    const interval = setInterval(loadLiveWins, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (liveWins.length === 0) {
    return <div className="text-center py-2 text-sm text-muted-foreground">No recent wins to display</div>;
  }
  
  return (
    <div className="overflow-hidden relative">
      <h3 className="text-sm font-medium mb-2">Live Wins</h3>
      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
        {liveWins.map(win => (
          <div
            key={win.id}
            className="flex-shrink-0 bg-secondary p-3 rounded-lg w-60"
          >
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={win.photoUrl} 
                alt={win.username} 
                className="w-6 h-6 rounded-full" 
              />
              <span className="text-sm font-medium">{win.username}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(win.timestamp), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-lg p-2">
                <img 
                  src={win.giftImageUrl} 
                  alt={win.giftName} 
                  className="w-10 h-10 object-contain" 
                />
              </div>
              <div>
                <p className="text-sm font-medium">{win.giftName}</p>
                <p className="text-xs text-primary">{win.giftValue} TON</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveFeed;
