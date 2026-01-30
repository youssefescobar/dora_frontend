'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, User, Activity, Watch, Smartphone, Mail, CreditCard, Battery } from 'lucide-react';
import dynamic from 'next/dynamic';
const MapComponent = dynamic(
  () => import('@/components/ui/MapComponent').then((mod) => mod.MapComponent),
  { ssr: false }
);
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function PilgrimDetailsPage() {
  const { id, pilgrimId } = useParams();
  const { t, language, dir } = useLanguage();
  const router = useRouter();
  const [pilgrim, setPilgrim] = useState<any>(null);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPilgrimDetails = async () => {
      try {
        setLoading(true);
        const pilgrimResponse = await apiClient.get(`/auth/pilgrims/${pilgrimId}`);
        if (pilgrimResponse.data) {
          setPilgrim(pilgrimResponse.data);
          // Assuming group name might not be directly in pilgrim object,
          // if needed, another call to /groups/:id might be necessary,
          // but for now, we'll try to find it if available or leave it.
          // Fallback to fetch group details to get group name
          try {
            const groupResponse = await apiClient.get(`/groups/${id}`);
            setGroupName(groupResponse.data.group_name);
          } catch (groupError) {
            console.warn("Could not fetch group name for pilgrim:", groupError);
            setGroupName('Unknown Group'); // Default or handle as needed
          }
        } else {
          toast.error(language === 'ar' ? 'الحاج غير موجود' : 'Pilgrim not found');
          router.push(`/dashboard/groups/${id}`);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          toast.error(language === 'ar' ? 'الحاج غير موجود' : 'Pilgrim not found');
          router.push(`/dashboard/groups/${id}`);
        } else {
          toast.error(t('common.error'));
        }
      } finally {
        setLoading(false);
      }
    };

    if (id && pilgrimId) {
      fetchPilgrimDetails();

      const intervalId = setInterval(() => {
        // Silent refresh (loading state not set to true)
        apiClient.get(`/auth/pilgrims/${pilgrimId}`).then(response => {
          if (response.data) {
            setPilgrim(response.data);
          }
        }).catch(err => console.error("Auto-refresh failed", err));
      }, 30000); // 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [id, pilgrimId, language, router, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!pilgrim) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavbar />

      <main className="container mx-auto p-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/groups/${id}`)}
          className="mb-4 gap-2"
        >
          <ChevronLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          {language === 'ar' ? 'العودة للمجموعة' : 'Back to Group'}
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Details */}
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{pilgrim.full_name}</h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <User className="w-4 h-4" />
                  {groupName}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`text-sm px-3 py-1 ${pilgrim.band_info ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}
              >
                {pilgrim.band_info ? (language === 'ar' ? 'متصل' : 'Connected') : (language === 'ar' ? 'غير متصل' : 'Offline')}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'رقم الهوية' : 'National ID'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <CreditCard className="w-5 h-5 text-primary" />
                    {pilgrim.national_id}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('common.email')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Mail className="w-5 h-5 text-primary" />
                    {pilgrim.email || (language === 'ar' ? 'غير متوفر' : 'N/A')}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.medicalHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2">
                    <Activity className="w-5 h-5 text-red-500 mt-1" />
                    <p className="text-slate-900 leading-relaxed">
                      {pilgrim.medical_history || (language === 'ar' ? 'لا يوجد سجل طبي' : 'No medical history recorded')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {pilgrim.band_info && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Watch className="w-5 h-5 text-primary" />
                    {t('dashboard.bandStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">{language === 'ar' ? 'الرقم التسلسلي' : 'Serial Number'}</span>
                    <span className="font-mono font-medium">{pilgrim.band_info.serial_number}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">{language === 'ar' ? 'آخر تحديث' : 'Last Updated'}</span>
                    <span>
                      {pilgrim.band_info.last_updated ? new Date(pilgrim.band_info.last_updated).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">{language === 'ar' ? 'IMEI' : 'IMEI'}</span>
                    <span className="font-mono text-sm">{pilgrim.band_info.imei || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Map */}
          <div className="w-full lg:w-[450px] space-y-6">
            <Card className="overflow-hidden h-full min-h-[500px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Watch className="w-5 h-5 text-primary" />
                  {t('dashboard.lastLocation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative bg-slate-100">
                {pilgrim.band_info?.last_location ? (
                  <MapComponent latitude={pilgrim.band_info.last_location.lat} longitude={pilgrim.band_info.last_location.lng} popupText={pilgrim.full_name} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <Watch className="w-16 h-16 mb-4 opacity-20" />
                    <p>{language === 'ar' ? 'لم يتم استلام أي بيانات للموقع بعد' : 'No location data received yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
