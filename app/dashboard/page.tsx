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
import { Textarea } from '@/components/ui/textarea';

export default function DashboardPage() {
  const { t, language, dir } = useLanguage();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default items per page
  const [paginationData, setPaginationData] = useState<any>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTargetGroup, setAlertTargetGroup] = useState<{ id: string, name: string } | null>(null);
  const [sendingAlert, setSendingAlert] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/groups/dashboard', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      if (response.data.success) {
        setGroups(response.data.data);
        setPaginationData(response.data.pagination);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/auth');
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
      router.push('/auth');
    } else {
      fetchGroups();
    }
  }, [currentPage, itemsPerPage]);

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

  const handleSendAlert = (groupId: string, groupName: string) => {
    setAlertTargetGroup({ id: groupId, name: groupName });
    setIsAlertDialogOpen(true);
  };

  const handleConfirmSendAlert = async () => {
    if (!alertTargetGroup || !alertMessage.trim()) return;

    try {
      setSendingAlert(true);
      await apiClient.post('/groups/send-alert', {
        group_id: alertTargetGroup.id,
        message_text: alertMessage
      });
      toast.success(language === 'ar' ? 'تم إرسال التنبيه بنجاح' : 'Alert sent successfully');
      setIsAlertDialogOpen(false);
      setAlertMessage('');
      setAlertTargetGroup(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setSendingAlert(false);
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
                onSendAlert={handleSendAlert}
              />
            ))}
          </div>
        )}

        {groups.length > 0 && paginationData && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <div className="flex-1 text-sm text-muted-foreground text-center">
              {t('common.page')} {currentPage} / {paginationData.pages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(paginationData.pages, prev + 1))}
              disabled={currentPage === paginationData.pages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </main>

      {/* Alert Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.sendAlert')}</DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? `إرسال تنبيه إلى المجموعة: ${alertTargetGroup?.name}` 
                : `Send alert to group: ${alertTargetGroup?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="alert-message">{language === 'ar' ? 'الرسالة' : 'Message'}</Label>
            <Textarea
              id="alert-message"
              placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
              value={alertMessage}
              onChange={e => setAlertMessage(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)} disabled={sendingAlert}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirmSendAlert} disabled={sendingAlert || !alertMessage.trim()}>
              {sendingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'ar' ? 'إرسال' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
