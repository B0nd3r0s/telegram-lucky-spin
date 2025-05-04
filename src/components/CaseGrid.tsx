
import React, { useEffect, useState } from 'react';
import { Case } from '@/types';
import mockApi from '@/lib/api';
import CaseItem from './CaseItem';

const CaseGrid: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadCases = async () => {
      try {
        const casesData = await mockApi.getCases();
        setCases(casesData);
      } catch (error) {
        console.error('Failed to load cases', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCases();
  }, []);
  
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div 
            key={i} 
            className="bg-card animate-pulse h-48 rounded-lg"
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cases.map(caseItem => (
        <CaseItem key={caseItem.id} caseItem={caseItem} />
      ))}
    </div>
  );
};

export default CaseGrid;
