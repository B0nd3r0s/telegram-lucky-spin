
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("cases");
  
  // Only admin can access this page
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You don't have permission to access the admin panel.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 pb-24">
      <div className="bg-card p-4 rounded-lg shadow-lg mb-6">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings className="text-primary" />
          Admin Panel
        </h1>
        
        <Tabs defaultValue="cases" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cases" className="space-y-4">
            <h2 className="text-lg font-medium">Case Management</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add, edit or remove cases and adjust drop rates
            </p>
            
            <Button className="w-full">Add New Case</Button>
            
            <div className="border border-muted rounded-lg p-4 mt-4">
              <p className="text-center text-muted-foreground">
                In a complete implementation, this would list all cases with edit and delete options
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-lg font-medium">User Management</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Manage users, assign roles, ban/unban users
            </p>
            
            <div className="border border-muted rounded-lg p-4">
              <p className="text-center text-muted-foreground">
                In a complete implementation, this would display a searchable user list with actions
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4">
            <h2 className="text-lg font-medium">Statistics</h2>
            <p className="text-sm text-muted-foreground mb-4">
              View platform statistics and analytics
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary p-4 rounded-lg">
                <p className="text-muted-foreground text-sm">Total Users</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <div className="bg-secondary p-4 rounded-lg">
                <p className="text-muted-foreground text-sm">Cases Opened</p>
                <p className="text-2xl font-bold">5,678</p>
              </div>
              <div className="bg-secondary p-4 rounded-lg">
                <p className="text-muted-foreground text-sm">TON Volume</p>
                <p className="text-2xl font-bold">9,876</p>
              </div>
              <div className="bg-secondary p-4 rounded-lg">
                <p className="text-muted-foreground text-sm">Profit</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
