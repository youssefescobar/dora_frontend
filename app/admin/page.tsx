'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Shield, 
  UserCheck, 
  Radio, 
  Layers, 
  Activity,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/admin/stats');
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error: any) {
        console.error('Fetch stats error:', error);
        toast.error(error.response?.data?.error || t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      description: `${stats?.admins || 0} Admins, ${stats?.moderators || 0} Mods`,
      color: 'text-blue-600',
    },
    {
      title: 'Active Pilgrims',
      value: stats?.pilgrims || 0,
      icon: UserCheck,
      description: 'Registered in system',
      color: 'text-green-600',
    },
    {
      title: 'Groups',
      value: stats?.total_groups || 0,
      icon: Layers,
      description: 'Active Hajj groups',
      color: 'text-purple-600',
    },
    {
      title: 'Active Bands',
      value: stats?.active_bands || 0,
      icon: Radio,
      description: `${stats?.total_bands || 0} Total registered`,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('admin.dashboard')}</h1>
        <p className="text-muted-foreground">{t('admin.stats')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="font-medium text-green-600">{stats?.active_users}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Inactive Users</span>
              <span className="font-medium text-slate-500">{stats?.inactive_users}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Bands in Maintenance</span>
              <span className="font-medium text-orange-500">{stats?.maintenance_bands}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
             <div className="p-3 bg-slate-50 rounded-lg border text-sm text-muted-foreground">
                Select a tab from the navigation bar to manage Users, Bands, or Groups.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
