
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Users, 
  Package, 
  BarChart3, 
  RefreshCw, 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  Ban, 
  Check 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

// Определяем интерфейсы для типов данных
interface AdminUser {
  _id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  balance: number;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
  referralCount: number;
}

interface AdminCase {
  _id: string;
  name: string;
  imageUrl: string;
  price: number;
  description?: string;
  isActive: boolean;
  possibleGifts: {
    name: string;
    imageUrl: string;
    value: number;
    chance: number;
  }[];
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalCases: number;
  casesOpened: number;
  totalVolume: number;
  profit: number;
}

const API_URL = '/api/admin';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedCase, setSelectedCase] = useState<AdminCase | null>(null);
  
  // Функции для работы с API
  const fetchStats = async (): Promise<AdminStats> => {
    const response = await fetch(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  };
  
  const fetchUsers = async (): Promise<AdminUser[]> => {
    const response = await fetch(`${API_URL}/users?${searchQuery ? `username=${searchQuery}` : ''}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return data.users;
  };
  
  const fetchCases = async (): Promise<AdminCase[]> => {
    const response = await fetch(`${API_URL}/cases`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch cases');
    return response.json();
  };
  
  // Запросы данных
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchStats,
    enabled: user?.role === 'admin'
  });
  
  const {
    data: users,
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['adminUsers', searchQuery],
    queryFn: fetchUsers,
    enabled: user?.role === 'admin' && activeTab === 'users'
  });
  
  const {
    data: cases,
    isLoading: isLoadingCases,
    refetch: refetchCases
  } = useQuery({
    queryKey: ['adminCases'],
    queryFn: fetchCases,
    enabled: user?.role === 'admin' && activeTab === 'cases'
  });
  
  // Мутации для изменения данных
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string, isBlocked: boolean }) => {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ isBlocked })
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status has been updated",
      });
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Обработчики действий с пользователями
  const handleBlockUser = (userId: string, currentStatus: boolean) => {
    blockUserMutation.mutate({ userId, isBlocked: !currentStatus });
  };
  
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
        
        <Tabs defaultValue="stats" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="stats" className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Stats</TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1"><Users className="w-4 h-4" /> Users</TabsTrigger>
            <TabsTrigger value="cases" className="flex items-center gap-1"><Package className="w-4 h-4" /> Cases</TabsTrigger>
          </TabsList>
          
          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Platform Statistics</h2>
              <Button variant="outline" size="sm" onClick={() => refetchStats()} disabled={isLoadingStats}>
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingStats ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {isLoadingStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2 w-20"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-secondary/20">
                  <p className="text-muted-foreground text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</p>
                </Card>
                <Card className="p-4 bg-secondary/20">
                  <p className="text-muted-foreground text-sm">Cases Opened</p>
                  <p className="text-2xl font-bold">{stats?.casesOpened.toLocaleString()}</p>
                </Card>
                <Card className="p-4 bg-secondary/20">
                  <p className="text-muted-foreground text-sm">TON Volume</p>
                  <p className="text-2xl font-bold">{stats?.totalVolume.toLocaleString()}</p>
                </Card>
                <Card className="p-4 bg-secondary/20">
                  <p className="text-muted-foreground text-sm">Profit</p>
                  <p className="text-2xl font-bold">{stats?.profit.toLocaleString()}</p>
                </Card>
              </div>
            )}
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h2 className="text-lg font-medium">User Management</h2>
              
              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative flex-1 sm:flex-auto">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && refetchUsers()}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="animate-pulse">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted"></div>
                            <div className="h-4 bg-muted rounded w-24"></div>
                          </div>
                        </TableCell>
                        <TableCell className="animate-pulse"><div className="h-4 bg-muted rounded w-16"></div></TableCell>
                        <TableCell className="animate-pulse"><div className="h-4 bg-muted rounded w-12"></div></TableCell>
                        <TableCell className="animate-pulse"><div className="h-4 bg-muted rounded w-16"></div></TableCell>
                        <TableCell className="animate-pulse text-right"><div className="h-8 bg-muted rounded w-16 ml-auto"></div></TableCell>
                      </TableRow>
                    ))
                  ) : users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.photoUrl ? (
                              <img src={user.photoUrl} alt={user.username} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                {user.username.substring(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-xs text-muted-foreground">ID: {user.telegramId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{user.balance} TON</TableCell>
                        <TableCell>
                          {user.isBlocked ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-destructive/20 text-destructive">Blocked</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => setSelectedUser(user)}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Edit User</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <div>
                                    <p>User Details</p>
                                    <p className="text-sm text-muted-foreground">This feature will be implemented later.</p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant={user.isBlocked ? "default" : "destructive"} 
                              size="icon"
                              onClick={() => handleBlockUser(user._id, user.isBlocked)}
                            >
                              {user.isBlocked ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              <span className="sr-only">{user.isBlocked ? 'Unblock' : 'Block'}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Case Management</h2>
              <div className="flex gap-2">
                <Button onClick={() => refetchCases()} variant="outline" size="icon" disabled={isLoadingCases}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingCases ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Case
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Case</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-muted-foreground">
                        Case creation form will be implemented in a future update.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingCases ? (
                Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse overflow-hidden">
                    <div className="h-40 bg-muted"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-8 bg-muted rounded w-full mt-4"></div>
                    </div>
                  </Card>
                ))
              ) : cases && cases.length > 0 ? (
                cases.map((caseItem) => (
                  <Card key={caseItem._id} className={`overflow-hidden ${!caseItem.isActive ? 'opacity-60' : ''}`}>
                    <div className="relative h-40 bg-muted">
                      <img 
                        src={caseItem.imageUrl || '/placeholder.svg'} 
                        alt={caseItem.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {!caseItem.isActive && (
                          <span className="px-2 py-1 bg-background/80 text-xs font-medium rounded">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{caseItem.name}</h3>
                        <span className="font-bold text-primary">{caseItem.price} TON</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {caseItem.description || 'No description provided.'}
                      </p>
                      <div className="flex justify-between gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Case
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Case</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-muted-foreground">
                                Case edit form will be implemented in a future update.
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="destructive" size="icon">
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 border rounded-lg bg-card text-card-foreground">
                  <Package className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="font-semibold mb-1">No Cases Yet</h3>
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    Create your first case to get started
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Case
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Case</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-muted-foreground">
                          Case creation form will be implemented in a future update.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
