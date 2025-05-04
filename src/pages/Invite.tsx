
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';
import ReferralCode from '@/components/ReferralCode';

const Invite: React.FC = () => {
  const { user } = useAuth();
  
  const referralRewards = [
    { title: "Referral Balance", value: user?.referralBalance || 0, unit: "TON" },
    { title: "Friends Joined", value: user?.referralCount || 0, unit: "friends" },
  ];
  
  return (
    <div className="container mx-auto px-4 pb-24">
      <div className="bg-card p-4 rounded-lg shadow-lg mb-6">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="text-primary" />
          Invite Friends
        </h1>
        
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-lg mb-6 text-center">
          <h2 className="text-xl font-bold mb-2">Earn 10% from friends</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Invite your friends and receive 10% of their first deposit (min 5 TON)
          </p>
          
          {user && (
            <ReferralCode code={user.referralCode} />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {referralRewards.map(reward => (
            <div key={reward.title} className="bg-secondary p-4 rounded-lg text-center">
              <p className="text-muted-foreground text-sm mb-1">{reward.title}</p>
              <p className="text-2xl font-bold">{reward.value} <span className="text-sm">{reward.unit}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Invite;
