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
  AlertTriangle,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import dynamic from 'next/dynamic';
const MapComponent = dynamic(
  () => import('@/components/ui/MapComponent').then((mod) => mod.MapComponent),
  { ssr: false }
);
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
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');

  // Pilgrim Registration State
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [currentPilgrimDialogTab, setCurrentPilgrimDialogTab] = useState<'register' | 'search'>('register');
  const [newPilgrim, setNewPilgrim] = useState({
    full_name: '',
    national_id: '',
    medical_history: '',
    email: ''
  });
  const [registering, setRegistering] = useState(false);
  const [searchPilgrimTerm, setSearchPilgrimTerm] = useState('');
  const [foundPilgrims, setFoundPilgrims] = useState<any[]>([]);
  const [searchingPilgrims, setSearchingPilgrims] = useState(false);

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

  const handleUpdateGroupName = async () => {
    try {
      if (!editedGroupName.trim()) {
        toast.error(language === 'ar' ? 'اسم المجموعة لا يمكن أن يكون فارغًا' : 'Group name cannot be empty');
        return;
      }
      const response = await apiClient.put(`/groups/${id}`, { group_name: editedGroupName });
      if (response.data.message) {
        toast.success(response.data.message);
        setGroup((prev: any) => ({ ...prev, group_name: editedGroupName }));
        setIsEditingGroupName(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    }
  };

  const fetchAvailableBands = async () => {
    try {
      // Use the new endpoint to get available bands for the specific group
      const response = await apiClient.get(`/groups/${id}/available-bands`);
      if (response.data.success) {
        setAvailableBands(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch available bands for group', error);
      toast.error(language === 'ar' ? 'فشل في جلب الأساور المتاحة' : 'Failed to fetch available bands');
    }
  };

  useEffect(() => {
    if (isBandDialogOpen) {
      fetchAvailableBands();
    }
  }, [isBandDialogOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchPilgrimTerm.trim()) {
        setSearchingPilgrims(true);
        apiClient.get('/auth/search-pilgrims', { params: { search: searchPilgrimTerm, limit: 10 } })
          .then(response => {
            if (response.data.success) {
              // Filter out pilgrims already in the group
              const pilgrimsInGroupIds = new Set(group?.pilgrims.map((p: any) => p._id));
              const filteredResults = response.data.data.filter((p: any) => !pilgrimsInGroupIds.has(p._id));
              setFoundPilgrims(filteredResults);
            }
          })
          .catch(error => {
            console.error('Pilgrim search error:', error);
            setFoundPilgrims([]);
          })
          .finally(() => {
            setSearchingPilgrims(false);
          });
      } else {
        setFoundPilgrims([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchPilgrimTerm, group?.pilgrims]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/groups/${id}`);
      if (response.data) { // Assuming direct group object, not { success: true, data: group }
        setGroup(response.data);
      } else {
        toast.error(language === 'ar' ? 'المجموعة غير موجودة' : 'Group not found');
        router.push('/dashboard');
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        toast.error(language === 'ar' ? 'المجموعة غير موجودة' : 'Group not found');
        router.push('/dashboard');
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();

    const intervalId = setInterval(() => {
      // Silent refresh logic - avoiding full page loader
      apiClient.get(`/groups/${id}`).then(response => {
        if (response.data) {
          setGroup(response.data);
        }
      }).catch(err => console.error("Auto-refresh group failed", err));
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [id]);

  const addPilgrimToGroup = async (pilgrimId: string) => {
    try {
      await apiClient.post(`/groups/${id}/add-pilgrim`, { user_id: pilgrimId });
      toast.success(language === 'ar' ? 'تمت إضافة الحاج بنجاح' : 'Pilgrim added successfully');
      fetchGroupDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    }
  };

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
      await addPilgrimToGroup(pilgrimId);

      setIsRegDialogOpen(false);
      setNewPilgrim({ full_name: '', national_id: '', medical_history: '', email: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || error.response?.data?.error || t('common.error'));
    } finally {
      setRegistering(false);
    }
  };

  const handleAddExistingPilgrim = async (pilgrimId: string) => {
    try {
      setRegistering(true); // Re-using registering state for adding existing pilgrim
      await addPilgrimToGroup(pilgrimId);
      setIsRegDialogOpen(false);
      setSearchPilgrimTerm('');
      setFoundPilgrims([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setRegistering(false);
    }
  };

  const handleAssignBand = async () => {
    try {
      setAssigning(true);
      await apiClient.post('/groups/assign-band', {
        serial_number: serialNumber,
        user_id: selectedPilgrimId,
        group_id: id
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

  const handleUnassignBand = async (pilgrimId: string) => {
    try {
      setAssigning(true); // Re-using assigning state for unassigning
      await apiClient.post('/groups/unassign-band', {
        user_id: pilgrimId,
        group_id: id
      });
      toast.success(language === 'ar' ? 'تم إلغاء ربط السوار بنجاح' : 'Band unassigned successfully');
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
                {isEditingGroupName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedGroupName}
                      onChange={(e) => setEditedGroupName(e.target.value)}
                      className="text-3xl font-bold text-slate-900 h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUpdateGroupName}
                      disabled={editedGroupName.trim() === group?.group_name || editedGroupName.trim() === ''}
                    >
                      {t('common.save')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingGroupName(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-slate-900">{group?.group_name}</h1>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditedGroupName(group?.group_name);
                      setIsEditingGroupName(true);
                    }}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
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

                <Dialog open={isRegDialogOpen} onOpenChange={(open) => {
                  setIsRegDialogOpen(open);
                  if (!open) {
                    // Reset states when dialog closes
                    setCurrentPilgrimDialogTab('register');
                    setNewPilgrim({ full_name: '', national_id: '', medical_history: '', email: '' });
                    setSearchPilgrimTerm('');
                    setFoundPilgrims([]);
                  }
                }}>
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
                        {currentPilgrimDialogTab === 'register'
                          ? (language === 'ar' ? 'أدخل بيانات الحاج الجديد لإضافته إلى المجموعة' : 'Enter the details of the new pilgrim to add to the group')
                          : (language === 'ar' ? 'ابحث عن حاجز موجود لإضافته إلى المجموعة' : 'Search for an existing pilgrim to add to the group')
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex border-b">
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentPilgrimDialogTab('register')}
                        className={`rounded-none border-b-2 ${currentPilgrimDialogTab === 'register' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                      >
                        {t('dashboard.registerNew')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentPilgrimDialogTab('search')}
                        className={`rounded-none border-b-2 ${currentPilgrimDialogTab === 'search' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                      >
                        {t('dashboard.searchExisting')}
                      </Button>
                    </div>

                    {currentPilgrimDialogTab === 'register' ? (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="full_name_reg">{t('common.fullName')}</Label>
                          <Input
                            id="full_name_reg"
                            value={newPilgrim.full_name}
                            onChange={e => setNewPilgrim({ ...newPilgrim, full_name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="national_id_reg">{language === 'ar' ? 'رقم الهوية' : 'National ID'}</Label>
                          <Input
                            id="national_id_reg"
                            value={newPilgrim.national_id}
                            onChange={e => setNewPilgrim({ ...newPilgrim, national_id: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="medical_reg">{language === 'ar' ? 'التاريخ الطبي' : 'Medical History'}</Label>
                          <Input
                            id="medical_reg"
                            value={newPilgrim.medical_history}
                            onChange={e => setNewPilgrim({ ...newPilgrim, medical_history: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email_reg" className="flex justify-between">
                            {t('common.email')}
                            <span className="text-xs font-normal text-muted-foreground">{t('common.optional')}</span>
                          </Label>
                          <Input
                            id="email_reg"
                            type="email"
                            value={newPilgrim.email}
                            onChange={e => setNewPilgrim({ ...newPilgrim, email: e.target.value })}
                            placeholder="example@email.com"
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={handleRegisterPilgrim} disabled={registering}>
                            {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                          </Button>
                        </DialogFooter>
                      </div>
                    ) : (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="search_pilgrim">{t('dashboard.searchPilgrim')}</Label>
                          <Input
                            id="search_pilgrim"
                            placeholder={language === 'ar' ? 'ابحث بالاسم أو رقم الهوية' : 'Search by name or national ID'}
                            value={searchPilgrimTerm}
                            onChange={e => setSearchPilgrimTerm(e.target.value)}
                          />
                        </div>
                        {searchingPilgrims ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : foundPilgrims.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {foundPilgrims.map((pilgrim: any) => (
                              <div key={pilgrim._id} className="flex items-center justify-between p-2 border rounded-md">
                                <div>
                                  <p className="font-medium">{pilgrim.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{pilgrim.national_id}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddExistingPilgrim(pilgrim._id)}
                                >
                                  {t('dashboard.add')}
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : searchPilgrimTerm.trim() && !searchingPilgrims ? (
                          <p className="text-center text-muted-foreground py-4">{t('dashboard.noPilgrimsFound')}</p>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">{t('dashboard.typeToSearch')}</p>
                        )}
                      </div>
                    )}
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
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                {pilgrim.band_info.serial_number}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleUnassignBand(pilgrim._id)}
                              >
                                {t('dashboard.unassignBand')}
                              </Button>
                            </div>
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
            <Card className="h-[500px] relative overflow-hidden shadow-xl border-0 ring-1 ring-slate-900/5 group">
              <div className="absolute inset-0 z-0 h-full w-full">
                <MapComponent
                  markers={
                    (group?.pilgrims || [])
                      .filter((p: any) => p.band_info?.last_location?.lat && p.band_info?.last_location?.lng)
                      .map((p: any) => ({
                        lat: p.band_info.last_location.lat,
                        lng: p.band_info.last_location.lng,
                        popupText: p.full_name
                      }))
                  }
                />
              </div>

              {/* Header Overlay */}
              <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md shadow-sm border border-slate-200/50 rounded-xl px-4 py-2 flex items-center gap-3 pointer-events-auto transition-all hover:bg-white/95">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-sm leading-none">{t('dashboard.liveTracking')}</span>
                    <span className="text-[10px] text-muted-foreground leading-none mt-1">
                      {language === 'ar' ? 'تحديث مباشر' : 'Real-time updates'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Footer Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md shadow-sm border border-slate-200/50 rounded-xl p-3 grid grid-cols-2 gap-4 pointer-events-auto transition-all hover:bg-white/95">
                  <div className="flex flex-col items-center justify-center border-r border-slate-200/50">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{language === 'ar' ? 'متصل' : 'Connected'}</span>
                    <span className="text-xl font-bold text-green-600 leading-none">
                      {(group?.pilgrims || []).filter((p: any) => p.band_info?.last_location).length}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{language === 'ar' ? 'غير متصل' : 'Offline'}</span>
                    <span className="text-xl font-bold text-slate-400 leading-none">
                      {(group?.pilgrims || []).length - (group?.pilgrims || []).filter((p: any) => p.band_info?.last_location).length}
                    </span>
                  </div>
                </div>
              </div>
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
                {language === 'ar' ? 'لا توجد أساور متاحة. يرجى طلب من مسؤول النظام تعيينها لك.' : 'No available bands found. Please ask an admin to assign them to you.'}
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