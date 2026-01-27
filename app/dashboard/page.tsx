'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { Plus, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { GroupCard } from '@/components/dashboard/GroupCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DashboardPage() {
  const { t, language, dir } = useLanguage();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/groups/dashboard');
      if (response.data.success) {
        setGroups(response.data.data);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/login');
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getCookie('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchGroups();
    }
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      setCreating(true);
      await apiClient.post('/groups/create', { group_name: newGroupName });
      toast.success(language === 'ar' ? 'تم إنشاء المجموعة بنجاح' : 'Group created successfully');
      setNewGroupName('');
      setIsCreateDialogOpen(false);
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavbar />
      
      <main className="container mx-auto p-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.myGroups')}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchGroups} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('dashboard.createGroup')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('dashboard.createGroup')}</DialogTitle>
                  <DialogDescription>
                    {language === 'ar' ? 'أدخل اسماً لمجموعتك الجديدة' : 'Enter a name for your new group'}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="name" className={dir === 'rtl' ? 'text-right block' : 'text-left block'}>
                    {t('dashboard.groupName')}
                  </Label>
                  <Input
                    id="name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="mt-2"
                    placeholder={language === 'ar' ? 'مثل: مجموعة مكة 2024' : 'e.g. Mecca Group 2024'}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={creating}>
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">
              {language === 'ar' ? 'لا توجد مجموعات بعد' : 'No groups yet'}
            </h3>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'ابدأ بإنشاء مجموعتك الأولى' : 'Start by creating your first group'}
            </p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              {t('dashboard.createGroup')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard 
                key={group._id} 
                group={group} 
                onViewDetails={(id) => router.push(`/dashboard/groups/${id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
