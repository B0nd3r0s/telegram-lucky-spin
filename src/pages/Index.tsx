
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import CaseGrid from '@/components/CaseGrid';
import NewsButton from '@/components/NewsButton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // In a real Telegram Mini App, the user would be 
  // authenticated automatically when opening the app.
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'admin') {
      console.log('Admin user detected - admin panel access available');
    }
  }, [isLoading, isAuthenticated, user]);
  
  return (
    <div className="container mx-auto px-4 pb-24">
      <Header />
      
      <main>
        <NewsButton />
        <CaseGrid />
      </main>
    </div>
  );
};

export default Index;
