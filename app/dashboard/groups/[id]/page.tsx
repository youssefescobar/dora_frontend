'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Plus, 
  Watch, 
  UserPlus, 
  Map as MapIcon, 
  Search,
  Loader2,
  Trash2,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function GroupDetailsPage() {
  const { id } = useParams();
  const { t, language, dir } = useLanguage();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Pilgrim Registration State
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [newPilgrim, setNewPilgrim] = useState({
    full_name: '',
    national_id: '',
    medical_history: '',
    email: ''
  });
  const [registering, setRegistering] = useState(false);

  // Band Assignment State
  const [isBandDialogOpen, setIsBandDialogOpen] = useState(false);
  const [selectedPilgrimId, setSelectedPilgrimId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [availableBands, setAvailableBands] = useState<any[]>([]);

  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'pilgrim' | 'group', id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notification State
  const [isNotiDialogOpen, setIsNotiDialogOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTarget, setNotificationTarget] = useState<{ type: 'group' | 'pilgrim', id: string, name?: string } | null>(null);
  const [sendingNoti, setSendingNoti] = useState(false);

  const fetchAvailableBands = async () => {
    try {
      const response = await apiClient.get('/hardware/bands', { params: { status: 'active', limit: 100 } });
      if (response.data.success) {
        // Filter bands that are not assigned to any user
        const unassigned = response.data.data.filter((b: any) => !b.current_user_id);
        setAvailableBands(unassigned);
      }
    } catch (error) {
      console.error('Failed to fetch bands', error);
    }
  };

  useEffect(() => {
    if (isBandDialogOpen) {
      fetchAvailableBands();
    }
  }, [isBandDialogOpen]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/groups/dashboard');
      if (response.data.success) {
        const currentGroup = response.data.data.find((g: any) => g._id === id);
        if (currentGroup) {
          setGroup(currentGroup);
        } else {
          toast.error(language === 'ar' ? 'المجموعة غير موجودة' : 'Group not found');
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const handleRegisterPilgrim = async () => {
    try {
      setRegistering(true);
      
      // Filter out empty email
      const pilgrimData = { ...newPilgrim };
      if (!pilgrimData.email.trim()) {
        delete (pilgrimData as any).email;
      }

      const res = await apiClient.post('/auth/register-pilgrim', pilgrimData);
      const pilgrimId = res.data.pilgrim_id;
      
      // After registering, add to group
      await apiClient.post(`/groups/${id}/add-pilgrim`, { user_id: pilgrimId });
      
      toast.success(language === 'ar' ? 'تمت إضافة الحاج بنجاح' : 'Pilgrim added successfully');
      setIsRegDialogOpen(false);
      setNewPilgrim({ full_name: '', national_id: '', medical_history: '', email: '' });
      fetchGroupDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || error.response?.data?.error || t('common.error'));
    } finally {
      setRegistering(false);
    }
  };

  const handleAssignBand = async () => {
    try {
      setAssigning(true);
      await apiClient.post('/groups/assign-band', {
        serial_number: serialNumber,
        user_id: selectedPilgrimId
      });
      
      toast.success(language === 'ar' ? 'تم ربط السوار بنجاح' : 'Band assigned successfully');
      setIsBandDialogOpen(false);
      setSerialNumber('');
      fetchGroupDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      if (itemToDelete.type === 'pilgrim') {
        await apiClient.post(`/groups/${id}/remove-pilgrim`, { user_id: itemToDelete.id });
        toast.success(language === 'ar' ? 'تم حذف الحاج بنجاح' : 'Pilgrim removed successfully');
        fetchGroupDetails();
      } else if (itemToDelete.type === 'group') {
        await apiClient.delete(`/groups/${id}`);
        toast.success(language === 'ar' ? 'تم حذف المجموعة بنجاح' : 'Group deleted successfully');
        router.push('/dashboard');
      }
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTarget || !notificationMessage.trim()) return;

    try {
      setSendingNoti(true);
      if (notificationTarget.type === 'group') {
        await apiClient.post('/groups/send-alert', {
          group_id: notificationTarget.id,
          message_text: notificationMessage
        });
      } else {
        await apiClient.post('/groups/send-individual-alert', {
          user_id: notificationTarget.id,
          message_text: notificationMessage
        });
      }
      
      toast.success(language === 'ar' ? 'تم إرسال التنبيه بنجاح' : 'Alert sent successfully');
      setIsNotiDialogOpen(false);
      setNotificationMessage('');
      setNotificationTarget(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setSendingNoti(false);
    }
  };

  if (loading && !group) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavbar />
      
      <main className="container mx-auto p-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard')} 
          className="mb-4 gap-2"
        >
          <ChevronLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          {language === 'ar' ? 'العودة للمجموعات' : 'Back to Groups'}
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{group?.group_name}</h1>
                <p className="text-muted-foreground">
                  {group?.pilgrims.length} {t('dashboard.pilgrims')} {language === 'ar' ? 'مسجلين' : 'registered'}
                </p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setItemToDelete({ type: 'group', id: group._id });
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  {language === 'ar' ? 'حذف المجموعة' : 'Delete Group'}
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    setNotificationTarget({ type: 'group', id: group._id, name: group.group_name });
                    setIsNotiDialogOpen(true);
                  }}
                >
                  <Bell className="w-4 h-4" />
                  {t('dashboard.sendAlert')}
                </Button>

                <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      {t('dashboard.addPilgrim')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t('dashboard.addPilgrim')}</DialogTitle>
                      <DialogDescription>
                        {language === 'ar' ? 'أدخل بيانات الحاج الجديد' : 'Enter the details of the new pilgrim'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="full_name">{t('common.fullName')}</Label>
                        <Input 
                          id="full_name" 
                          value={newPilgrim.full_name}
                          onChange={e => setNewPilgrim({...newPilgrim, full_name: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="national_id">{language === 'ar' ? 'رقم الهوية' : 'National ID'}</Label>
                        <Input 
                          id="national_id" 
                          value={newPilgrim.national_id}
                          onChange={e => setNewPilgrim({...newPilgrim, national_id: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="medical">{language === 'ar' ? 'التاريخ الطبي' : 'Medical History'}</Label>
                        <Input 
                          id="medical" 
                          value={newPilgrim.medical_history}
                          onChange={e => setNewPilgrim({...newPilgrim, medical_history: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="flex justify-between">
                          {t('common.email')}
                          <span className="text-xs font-normal text-muted-foreground">{t('common.optional')}</span>
                        </Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={newPilgrim.email}
                          onChange={e => setNewPilgrim({...newPilgrim, email: e.target.value})}
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleRegisterPilgrim} disabled={registering}>
                        {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">{t('dashboard.pilgrims')}</CardTitle>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={language === 'ar' ? 'بحث...' : 'Search...'} className="pl-8" />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.fullName')}</TableHead>
                      <TableHead>{language === 'ar' ? 'رقم الهوية' : 'National ID'}</TableHead>
                      <TableHead>{language === 'ar' ? 'السوار' : 'Band'}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group?.pilgrims.map((pilgrim: any) => (
                      <TableRow key={pilgrim._id} className="group">
                        <TableCell className="font-medium">
                          <button 
                            onClick={() => router.push(`/dashboard/groups/${id}/pilgrims/${pilgrim._id}`)}
                            className="hover:underline text-left"
                          >
                            {pilgrim.full_name}
                          </button>
                        </TableCell>
                        <TableCell>{pilgrim.national_id}</TableCell>
                        <TableCell>
                          {pilgrim.band_info ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                              {pilgrim.band_info.serial_number}
                            </Badge>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setSelectedPilgrimId(pilgrim._id);
                                setIsBandDialogOpen(true);
                              }}
                            >
                              <Watch className="w-3 h-3" />
                              {t('dashboard.assignBand')}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setNotificationTarget({ type: 'pilgrim', id: pilgrim._id, name: pilgrim.full_name });
                                setIsNotiDialogOpen(true);
                              }}
                            >
                              <Bell className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setItemToDelete({ type: 'pilgrim', id: pilgrim._id });
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-96 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-900 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-primary" />
                  {t('dashboard.liveTracking')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 bg-slate-200 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden">
                  <MapIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm font-medium">Interactive Map Integration</p>
                  <p className="text-xs opacity-60 px-8 text-center mt-2">
                    {language === 'ar' 
                      ? 'يتم عرض مواقع الحجاج المباشرة هنا عند ربط الأساور' 
                      : 'Live pilgrim locations will appear here once bands are assigned'}
                  </p>
                </div>
                <div className="p-4 bg-white border-t">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">{language === 'ar' ? 'إحصائيات المواقع' : 'Location Stats'}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'ar' ? 'متصل' : 'Connected'}</span>
                      <span className="font-bold text-green-600">
                        {group?.pilgrims.filter((p: any) => p.band_info?.last_location).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'ar' ? 'غير متصل' : 'Offline'}</span>
                      <span className="font-bold text-slate-400">
                        {group?.pilgrims.length - group?.pilgrims.filter((p: any) => p.band_info?.last_location).length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Assign Band Dialog */}
      <Dialog open={isBandDialogOpen} onOpenChange={setIsBandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.assignBand')}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'أدخل الرقم التسلسلي للسوار' : 'Enter the serial number of the band'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="serial">{language === 'ar' ? 'رقم السوار (Serial)' : 'Band Serial Number'}</Label>
            {availableBands.length > 0 ? (
              <select
                id="serial" 
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                className="mt-2 flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{language === 'ar' ? 'اختر سوار...' : 'Select a band...'}</option>
                {availableBands.map((band) => (
                  <option key={band._id} value={band.serial_number}>
                    {band.serial_number} (IMEI: {band.imei})
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground p-2 border rounded bg-slate-50">
                {language === 'ar' ? 'لا توجد أساور متاحة' : 'No available bands found. Please register new bands in the Admin Dashboard.'}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleAssignBand} disabled={assigning}>
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : t('dashboard.assignBand')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t('common.confirmDelete')}
            </DialogTitle>
            <DialogDescription>
              {t('common.confirmDeleteDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={isNotiDialogOpen} onOpenChange={setIsNotiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.sendAlert')}</DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? `إرسال تنبيه إلى ${notificationTarget?.name || 'المجموعة'}` 
                : `Send alert to ${notificationTarget?.name || 'the group'}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="message">{language === 'ar' ? 'الرسالة' : 'Message'}</Label>
            <Textarea
              id="message"
              placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
              value={notificationMessage}
              onChange={e => setNotificationMessage(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotiDialogOpen(false)} disabled={sendingNoti}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSendNotification} disabled={sendingNoti || !notificationMessage.trim()}>
              {sendingNoti ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'ar' ? 'إرسال' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}