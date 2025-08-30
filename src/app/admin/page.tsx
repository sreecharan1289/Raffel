"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Users, DollarSign, Clock, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';

type DashboardData = {
  stats: {
    totalEntries: number;
    confirmedEntries: number;
    pendingEntries: number;
    failedEntries: number;
    totalRevenue: number;
    eligibleForDraw: number;
  };
  currentWinner: {
    entry: {
      user: {
        name: string;
        email: string;
        phone: string;
        address: string;
        state: string;
        pincode: string;
      };
      token: string;
    };
  } | null;
  recentEntries: Array<{
    id: string;
    token: string;
    status: string;
    amount: number;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  eligibleEntries: Array<{
    id: string;
    token: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectingWinner, setIsSelectingWinner] = useState(false);
  const [isClearingWinner, setIsClearingWinner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [animatingEntries, setAnimatingEntries] = useState<string[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<any>(null);
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showWinnerDetails, setShowWinnerDetails] = useState(false);
  const [visibleStats, setVisibleStats] = useState({
    totalEntries: true,
    confirmedEntries: true,
    eligibleForDraw: true,
    pendingFailed: true,
    totalRevenue: true,
  });
  const [visibleWinnerDetails, setVisibleWinnerDetails] = useState({
    email: false,
    phone: false,
    address: false,
    state: false,
    pincode: false,
  });
  const router = useRouter();
  const { toast } = useToast();

  const toggleStatVisibility = (statKey: keyof typeof visibleStats) => {
    setVisibleStats(prev => ({
      ...prev,
      [statKey]: !prev[statKey]
    }));
  };

  const toggleWinnerDetailVisibility = (detailKey: keyof typeof visibleWinnerDetails) => {
    setVisibleWinnerDetails(prev => ({
      ...prev,
      [detailKey]: !prev[detailKey]
    }));
  };

  useEffect(() => {
    // Set window size for confetti
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Admin token present:', !!token);
      
      if (!token) {
        console.log('No admin token, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('Fetching dashboard data...');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Dashboard response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Dashboard API error:', errorData);
        
        if (response.status === 401) {
          console.log('Unauthorized, clearing token and redirecting');
          localStorage.removeItem('adminToken');
          router.push('/login');
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      console.log('Dashboard data loaded successfully');
      setData(dashboardData);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load dashboard data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectWinner = async () => {
    if (!data?.eligibleEntries.length) return;
    
    setIsSelectingWinner(true);
    setShowWinnerAnimation(true);
    
    try {
      // Start animation - highlight random entries
      const eligibleIds = data.eligibleEntries.map(e => e.id);
      let animationRounds = 0;
      const maxRounds = 15;
      
      const animationInterval = setInterval(() => {
        if (animationRounds >= maxRounds) {
          clearInterval(animationInterval);
          return;
        }
        
        // Randomly highlight 1-3 entries
        const randomCount = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...eligibleIds].sort(() => 0.5 - Math.random());
        const highlighted = shuffled.slice(0, randomCount);
        
        setAnimatingEntries(highlighted);
        animationRounds++;
      }, 200);

      // Wait for animation to build suspense
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Clear animation
      clearInterval(animationInterval);
      setAnimatingEntries([]);
      
      // Make actual API call
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/select-winner', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to select winner');
      }

      const result = await response.json();
      setSelectedWinner(result.winner);
      
      // Start confetti celebration
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
      
      // Show winner celebration
      toast({
        title: '🎉 Winner Selected!',
        description: `🏆 ${result.winner.name} has won the "Aether-Glide X1"!`,
      });

      // Refresh dashboard data after a moment
      setTimeout(async () => {
        await fetchDashboardData();
        setShowWinnerAnimation(false);
        setSelectedWinner(null);
      }, 5000);
      
    } catch (error) {
      console.error('Select winner error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to select winner',
      });
      setShowWinnerAnimation(false);
      setAnimatingEntries([]);
    } finally {
      setIsSelectingWinner(false);
    }
  };

  const clearWinner = async () => {
    setIsClearingWinner(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/clear-winner', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear winner');
      }

      toast({
        title: 'Winner Cleared',
        description: 'Winner has been cleared successfully',
      });

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Clear winner error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear winner',
      });
    } finally {
      setIsClearingWinner(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
        />
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🎟️ Patnam Baabu X Raffle
          </h1>
          <p className="text-lg text-muted-foreground mt-2">Admin Dashboard - "Aether-Glide X1" Limited Edition</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={async () => {
              const token = localStorage.getItem('adminToken');
              if (token) {
                try {
                  // Call logout API to blacklist token
                  await fetch('/api/admin/logout', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                } catch (error) {
                  console.error('Logout API error:', error);
                }
              }
              
              // Clear local storage and redirect
              localStorage.removeItem('adminToken');
              localStorage.removeItem('isAdmin');
              router.push('/');
            }}
            variant="outline"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {visibleStats.totalEntries ? data.stats.totalEntries : '••••'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStatVisibility('totalEntries')}
                className="h-8 w-8 p-0"
              >
                {visibleStats.totalEntries ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Entries</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {visibleStats.confirmedEntries ? data.stats.confirmedEntries : '••••'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStatVisibility('confirmedEntries')}
                className="h-8 w-8 p-0"
              >
                {visibleStats.confirmedEntries ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible for Draw</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                {visibleStats.eligibleForDraw ? data.stats.eligibleForDraw : '••••'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStatVisibility('eligibleForDraw')}
                className="h-8 w-8 p-0"
              >
                {visibleStats.eligibleForDraw ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Confirmed entries only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending/Failed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {visibleStats.pendingFailed ? (data.stats.pendingEntries + data.stats.failedEntries) : '••••'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStatVisibility('pendingFailed')}
                className="h-8 w-8 p-0"
              >
                {visibleStats.pendingFailed ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Not eligible for draw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {visibleStats.totalRevenue ? `₹${(data.stats.totalRevenue / 100).toFixed(2)}` : '₹••••'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStatVisibility('totalRevenue')}
                className="h-8 w-8 p-0"
              >
                {visibleStats.totalRevenue ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Winner Selection Section */}
      {data.currentWinner ? (
        // Expanded Winner Display
        <div className="mb-8">
          <Card className="border-2 border-green-500 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Trophy className="h-6 w-6 text-yellow-500" />
                🏆 RAFFLE WINNER ANNOUNCED
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Congratulations to our lucky winner! 🎉
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Winner Details - Centered and Prominent */}
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🎊</div>
                    <h3 className="text-3xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                      {data.currentWinner.entry.user.name}
                    </h3>
                    <p className="text-xl font-mono text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 px-4 py-2 rounded-lg inline-block">
                      🎫 {data.currentWinner.entry.token}
                    </p>
                  </div>
                  
                  <div className="space-y-4 border-t border-yellow-200 dark:border-yellow-700 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-700 dark:text-yellow-300 font-medium text-lg">Contact Details:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWinnerDetails(!showWinnerDetails)}
                        className="text-sm"
                      >
                        {showWinnerDetails ? '🙈 Hide Details' : '👁️ Show Details'}
                      </Button>
                    </div>
                    
                    {showWinnerDetails && (
                      <div className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        {/* Email */}
                        <div className="flex items-center justify-between">
                          <p className="text-base flex-1">
                            <strong>📧 Email:</strong> {visibleWinnerDetails.email ? data.currentWinner.entry.user.email : '••••••••••••'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWinnerDetailVisibility('email')}
                            className="h-6 w-6 p-0 ml-2"
                          >
                            {visibleWinnerDetails.email ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center justify-between">
                          <p className="text-base flex-1">
                            <strong>📱 Phone:</strong> {visibleWinnerDetails.phone ? data.currentWinner.entry.user.phone : '••••••••••'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWinnerDetailVisibility('phone')}
                            className="h-6 w-6 p-0 ml-2"
                          >
                            {visibleWinnerDetails.phone ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {/* Address */}
                        <div className="flex items-center justify-between">
                          <p className="text-base flex-1">
                            <strong>🏠 Address:</strong> {visibleWinnerDetails.address ? data.currentWinner.entry.user.address : '••••••••••••••••••••'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWinnerDetailVisibility('address')}
                            className="h-6 w-6 p-0 ml-2"
                          >
                            {visibleWinnerDetails.address ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {/* State */}
                        <div className="flex items-center justify-between">
                          <p className="text-base flex-1">
                            <strong>🗺️ State:</strong> {visibleWinnerDetails.state ? data.currentWinner.entry.user.state : '••••••••••'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWinnerDetailVisibility('state')}
                            className="h-6 w-6 p-0 ml-2"
                          >
                            {visibleWinnerDetails.state ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {/* Pincode */}
                        <div className="flex items-center justify-between">
                          <p className="text-base flex-1">
                            <strong>📮 Pincode:</strong> {visibleWinnerDetails.pincode ? data.currentWinner.entry.user.pincode : '••••••'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWinnerDetailVisibility('pincode')}
                            className="h-6 w-6 p-0 ml-2"
                          >
                            {visibleWinnerDetails.pincode ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={clearWinner} 
                  variant="destructive"
                  disabled={isClearingWinner}
                  className="w-full py-3 text-lg"
                >
                  {isClearingWinner ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Clearing Winner...
                    </>
                  ) : (
                    'Clear Winner & Reset Draw'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // No Winner - Show Selection Interface
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Winner Management
              </CardTitle>
              <CardDescription>
                Select a random winner from eligible entries only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Ready for Draw</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {data.stats.eligibleForDraw} confirmed entries are eligible for winner selection
                  </p>
                </div>
                <Button 
                  onClick={selectWinner} 
                  disabled={isSelectingWinner || data.stats.eligibleForDraw === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 animate-pulse-glow"
                >
                  {isSelectingWinner ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      🎲 Drawing Winner...
                    </>
                  ) : (
                    `🎯 Draw Random Winner (${data.stats.eligibleForDraw} eligible)`
                  )}
                </Button>
                {data.stats.eligibleForDraw === 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    ⚠️ No confirmed entries available for winner selection
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Eligible Entries Preview / Winner Selection Animation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {showWinnerAnimation ? (
                  <>
                    <Trophy className="h-5 w-5 animate-bounce text-yellow-500" />
                    🎲 Selecting Winner...
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    Eligible Entries Preview
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {showWinnerAnimation 
                  ? "🎯 Drawing from confirmed entries only..." 
                  : "Only confirmed entries that can win (first 8 shown)"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showWinnerAnimation && selectedWinner ? (
                // Winner Announcement
                <div className="text-center space-y-4 py-8">
                  <div className="text-6xl animate-bounce">🏆</div>
                  <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    WINNER SELECTED!
                  </h3>
                  <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
                    <p className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                      🎉 {selectedWinner.name}
                    </p>
                    <p className="text-lg font-mono text-yellow-700 dark:text-yellow-300">
                      Token: {selectedWinner.token}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Updating dashboard...
                  </p>
                </div>
              ) : (
                // Eligible Entries List
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.eligibleEntries.slice(0, 8).map((entry) => (
                    <div 
                      key={entry.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                        animatingEntries.includes(entry.id)
                          ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600 scale-105 shadow-lg animate-pulse'
                          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      }`}
                    >
                      <div>
                        <p className={`font-medium transition-colors ${
                          animatingEntries.includes(entry.id)
                            ? 'text-yellow-800 dark:text-yellow-200'
                            : 'text-green-800 dark:text-green-200'
                        }`}>
                          {animatingEntries.includes(entry.id) ? '🎯 ' : ''}{entry.user.name}
                        </p>
                        <p className={`text-sm font-mono transition-colors ${
                          animatingEntries.includes(entry.id)
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {entry.token}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="default" 
                          className={`transition-all ${
                            animatingEntries.includes(entry.id)
                              ? 'bg-yellow-600 animate-pulse'
                              : 'bg-green-600'
                          }`}
                        >
                          {animatingEntries.includes(entry.id) ? '🎲 DRAWING' : '✅ ELIGIBLE'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {data.eligibleEntries.length > 8 && (
                    <p className="text-center text-sm text-muted-foreground">
                      ... and {data.eligibleEntries.length - 8} more eligible entries
                    </p>
                  )}
                  {data.eligibleEntries.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No eligible entries yet
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Entries with Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Entries</CardTitle>
              <CardDescription>
                Manage and filter raffle entries
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="CONFIRMED">✅ Confirmed Only</option>
                <option value="PENDING">⏳ Pending Only</option>
                <option value="FAILED">❌ Failed Only</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEligibleOnly(!showEligibleOnly)}
                className={showEligibleOnly ? 'bg-green-100 dark:bg-green-900' : ''}
              >
                {showEligibleOnly ? '🎯 Eligible Only' : '👁️ Show All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.recentEntries
              .filter(entry => statusFilter === 'all' || entry.status === statusFilter)
              .filter(entry => !showEligibleOnly || entry.status === 'CONFIRMED')
              .map((entry) => (
              <div key={entry.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                entry.status === 'CONFIRMED' ? 'border-green-200 dark:border-green-800' : 
                entry.status === 'PENDING' ? 'border-yellow-200 dark:border-yellow-800' : 
                'border-red-200 dark:border-red-800'
              }`}>
                <div>
                  <p className="font-medium">{entry.user.name}</p>
                  <p className="text-sm text-muted-foreground">{entry.user.email}</p>
                  <p className="text-sm font-mono text-blue-600 dark:text-blue-400">🎫 {entry.token}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={entry.status === 'CONFIRMED' ? 'default' : entry.status === 'PENDING' ? 'secondary' : 'destructive'} 
                    className="mb-2"
                  >
                    {entry.status === 'CONFIRMED' ? '✅ PAID' : 
                     entry.status === 'PENDING' ? '⏳ PENDING' : 
                     '❌ FAILED'}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ₹{(entry.amount / 100).toFixed(2)}
                  </p>
                  {entry.status === 'CONFIRMED' && (
                    <p className="text-xs text-green-600 font-bold">🎯 ELIGIBLE</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}