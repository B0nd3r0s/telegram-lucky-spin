
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Medal, PackageOpen, Users, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user } = useAuth();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Medal, label: 'Rating', path: '/rating' },
    { icon: PackageOpen, label: 'Upgrade', path: '/upgrade' },
    { icon: Users, label: 'Invite', path: '/invite' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];
  
  // Add admin panel link only for users with admin role
  if (user?.role === 'admin') {
    navItems.push({ icon: Settings, label: 'Admin', path: '/admin' });
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-muted p-2 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center p-2 rounded-md transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
