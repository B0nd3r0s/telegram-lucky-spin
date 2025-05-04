
import React, { useEffect, useState } from 'react';
import { RatingItem } from '@/types';
import mockApi from '@/lib/api';
import { Medal } from 'lucide-react';

const Rating: React.FC = () => {
  const [topPlayers, setTopPlayers] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTopPlayers = async () => {
      try {
        const players = await mockApi.getTopPlayers();
        setTopPlayers(players);
      } catch (error) {
        console.error('Failed to load top players', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTopPlayers();
  }, []);
  
  return (
    <div className="container mx-auto px-4 pb-24">
      <div className="bg-card p-4 rounded-lg shadow-lg mb-6">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Medal className="text-primary" />
          Weekly Top Players
        </h1>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center p-4 bg-secondary rounded-lg">
                <div className="w-10 h-10 bg-muted rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {topPlayers.map((player, index) => (
              <div 
                key={player.userId}
                className={cn(
                  "flex items-center p-4 rounded-lg",
                  index === 0 ? "bg-yellow-900/20 border border-yellow-500/50" :
                  index === 1 ? "bg-gray-700/20 border border-gray-400/50" :
                  index === 2 ? "bg-amber-900/20 border border-amber-600/50" :
                  "bg-secondary"
                )}
              >
                <div className="relative">
                  {index < 3 && (
                    <div className={cn(
                      "absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 ? "bg-yellow-500 text-black" :
                      index === 1 ? "bg-gray-400 text-black" :
                      "bg-amber-600 text-black"
                    )}>
                      {index + 1}
                    </div>
                  )}
                  <img 
                    src={player.photoUrl} 
                    alt={player.username} 
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">{player.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Total winnings: <span className="text-primary">{player.totalWinnings} TON</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default Rating;
