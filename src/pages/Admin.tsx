
import React, { useState, useEffect } from 'react';
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
  Check,
  Wallet,
  DollarSign,
  User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

// Define interfaces for data types
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
  today: {
    revenue: number;
    casesOpened: number;
  };
}

interface WalletInfo {
  walletAddress: string;
  walletBalance: number;
  withdrawals: any[];
}

const API_URL = '/api/admin';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedCase, setSelectedCase] = useState<AdminCase | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  
  // API functions
  const fetchStats = async (): Promise<AdminStats> => {
    const response = await fetch(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  };
  
  const fetchUsers = async (): Promise<{users: AdminUser[], pagination: any}> => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    
    const response = await fetch(`${API_URL}/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  };
  
  const fetchCases = async (): Promise<AdminCase[]> => {
    const response = await fetch(`${API_URL}/cases`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch cases');
    return response.json();
  };
  
  const fetchWalletInfo = async (): Promise<WalletInfo> => {
    const response = await fetch(`${API_URL}/wallet`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch wallet info');
    return response.json();
  };
  
  // Query hooks
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
    data: usersData,
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
  
  const {
    data: walletInfo,
    isLoading: isLoadingWallet,
    refetch: refetchWalletInfo
  } = useQuery({
    queryKey: ['adminWallet'],
    queryFn: fetchWalletInfo,
    enabled: user?.role === 'admin' && activeTab === 'wallet'
  });
  
  // Mutations
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string, isBlocked: boolean }) => {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ isBlocked, confirmation: true })
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
  
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: 'user' | 'admin' }) => {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ role, confirmation: true })
      });
      
      if (!response.ok) throw new Error('Failed to update user role');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role has been updated",
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
  
  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const response = await fetch(`${API_URL}/cases/${caseId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete case');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Case has been deleted",
      });
      refetchCases();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const updateWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await fetch(`${API_URL}/wallet`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ walletAddress, confirmation: true })
      });
      
      if (!response.ok) throw new Error('Failed to update wallet');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wallet address has been updated",
      });
      refetchWalletInfo();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Action handlers
  const handleBlockUser = (userId: string, currentStatus: boolean) => {
    setConfirmationDialog({
      isOpen: true,
      title: currentStatus ? 'Unblock User' : 'Block User',
      description: currentStatus 
        ? 'Are you sure you want to unblock this user? They will regain access to the platform.'
        : 'Are you sure you want to block this user? They will lose access to the platform.',
      onConfirm: () => {
        blockUserMutation.mutate({ userId, isBlocked: !currentStatus });
        setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  const handleChangeUserRole = (userId: string, currentRole: 'user' | 'admin') => {
    const newRole = currentRole === 'user' ? 'admin' : 'user';
    
    setConfirmationDialog({
      isOpen: true,
      title: `Change User Role to ${newRole}`,
      description: `Are you sure you want to change this user's role to ${newRole}? This will ${newRole === 'admin' ? 'grant them administrative privileges' : 'remove their administrative privileges'}.`,
      onConfirm: () => {
        updateUserRoleMutation.mutate({ userId, role: newRole });
        setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  const handleDeleteCase = (caseId: string, caseName: string) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Delete Case',
      description: `Are you sure you want to delete the case "${caseName}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteCaseMutation.mutate(caseId);
        setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  const handleUpdateWallet = (newAddress: string) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Update TON Wallet',
      description: `Are you sure you want to change the TON wallet address to ${newAddress}? This will affect all future transactions.`,
      onConfirm: () => {
        updateWalletMutation.mutate(newAddress);
        setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
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
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" /> Stats
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex items-center gap-1">
              <Package className="w-4 h-4" /> Cases
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-1">
              <Wallet className="w-4 h-4" /> Wallet
            </TabsTrigger>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2 w-20"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <h3 className="text-md font-medium mt-4">Overall Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-secondary/20">
                    <p className="text-muted-foreground text-sm">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 bg-secondary/20">
                    <p className="text-muted-foreground text-sm">Total Cases</p>
                    <p className="text-2xl font-bold">{stats?.totalCases.toLocaleString()}</p>
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
                    <p className="text-muted-foreground text-sm">Net Profit</p>
                    <p className="text-2xl font-bold">{stats?.profit.toLocaleString()}</p>
                  </Card>
                </div>
                
                <h3 className="text-md font-medium mt-4">Today's Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-secondary/10">
                    <p className="text-muted-foreground text-sm">Today's Revenue</p>
                    <p className="text-2xl font-bold">{stats?.today.revenue.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 bg-secondary/10">
                    <p className="text-muted-foreground text-sm">Cases Opened Today</p>
                    <p className="text-2xl font-bold">{stats?.today.casesOpened.toLocaleString()}</p>
                  </Card>
                </div>
              </>
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
                  ) : usersData && usersData.users && usersData.users.length > 0 ? (
                    usersData.users.map((user) => (
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
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleChangeUserRole(user._id, user.role)}
                            >
                              <User className="h-4 w-4" />
                              <span className="sr-only">Change Role</span>
                            </Button>
                            
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
            
            {usersData && usersData.pagination && usersData.pagination.pages > 1 && (
              <div className="flex justify-center mt-4">
                <div className="flex gap-2">
                  {Array.from({ length: usersData.pagination.pages }, (_, i) => (
                    <Button 
                      key={i} 
                      variant={usersData.pagination.page === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        // Handle pagination
                      }}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Case Name</label>
                          <Input placeholder="Enter case name" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Price (TON)</label>
                          <Input type="number" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Image URL</label>
                          <Input placeholder="https://..." />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Description</label>
                          <Input placeholder="Case description" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Possible Gifts</label>
                          <div className="text-xs text-muted-foreground mb-2">
                            Add possible gifts with their chances (total must be 100%)
                          </div>
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" /> Add Gift
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button>Create Case</Button>
                      </div>
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
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Possible Gifts:</h4>
                        <div className="text-xs text-muted-foreground">
                          {caseItem.possibleGifts.map((gift, i) => (
                            <div key={i} className="flex justify-between mb-1">
                              <span>{gift.name}</span>
                              <span>{gift.chance}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
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
                              <DialogTitle>Edit Case: {caseItem.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Case Name</label>
                                  <Input placeholder="Enter case name" defaultValue={caseItem.name} />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Price (TON)</label>
                                  <Input type="number" placeholder="0.00" defaultValue={caseItem.price} />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Image URL</label>
                                  <Input placeholder="https://..." defaultValue={caseItem.imageUrl} />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Status</label>
                                  <div className="flex items-center gap-2">
                                    <input type="checkbox" id={`active-${caseItem._id}`} defaultChecked={caseItem.isActive} />
                                    <label htmlFor={`active-${caseItem._id}`}>Active</label>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Gift Probabilities</label>
                                  <div className="border rounded p-2">
                                    {caseItem.possibleGifts.map((gift, i) => (
                                      <div key={i} className="flex justify-between items-center mb-2 gap-2">
                                        <span className="text-sm">{gift.name}</span>
                                        <Input 
                                          type="number" 
                                          className="w-20" 
                                          defaultValue={gift.chance} 
                                          min={0}
                                          max={100}
                                        />
                                        <span>%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <Button>Save Changes</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={() => handleDeleteCase(caseItem._id, caseItem.name)}
                        >
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
                          Fill out the case details to add it to your platform.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">TON Wallet Management</h2>
              <Button variant="outline" size="sm" onClick={() => refetchWalletInfo()} disabled={isLoadingWallet}>
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingWallet ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {isLoadingWallet ? (
              <Card className="p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-1/3 mt-4"></div>
                  <div className="h-6 bg-muted rounded w-1/6"></div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Wallet Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground block">Wallet Address</label>
                      <div className="flex mt-1 gap-2">
                        <Input 
                          value={walletInfo?.walletAddress || ''} 
                          placeholder="No wallet address set" 
                          className="font-mono text-sm"
                          onChange={(e) => {/* Handle input change */}}
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Update TON Wallet</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Enter the new TON wallet address. This wallet will be used for all platform transactions.
                              </p>
                              <Input 
                                placeholder="Enter wallet address" 
                                className="font-mono"
                                defaultValue={walletInfo?.walletAddress || ''}
                              />
                              <div className="flex justify-end">
                                <Button onClick={() => handleUpdateWallet("EQDWFD...mpleNew")}>
                                  Update Wallet
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground block">Available Balance</label>
                      <div className="text-2xl font-bold flex items-center mt-1">
                        <DollarSign className="h-5 w-5 mr-1 text-muted-foreground" />
                        {walletInfo?.walletBalance || 0} TON
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Financial Overview</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <span className="font-medium">{stats?.totalVolume || 0} TON</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Net Profit</span>
                      <span className="font-medium">{stats?.profit || 0} TON</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Pending Withdrawals</span>
                      <span className="font-medium">0 TON</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 col-span-1 md:col-span-2">
                  <h3 className="font-medium mb-4">Recent Withdrawals</h3>
                  {walletInfo?.withdrawals && walletInfo.withdrawals.length > 0 ? (
                    <div className="border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {walletInfo.withdrawals.map((withdrawal, i) => (
                            <TableRow key={i}>
                              <TableCell>{withdrawal.user?.username || 'Unknown'}</TableCell>
                              <TableCell>{withdrawal.amount} TON</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  withdrawal.status === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                                }`}>
                                  {withdrawal.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {new Date(withdrawal.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded">
                      <p className="text-muted-foreground">No withdrawal transactions yet</p>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmationDialog.isOpen} onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmationDialog.onConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
