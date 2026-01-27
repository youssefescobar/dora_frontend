'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Map as MapIcon, 
  Loader2, 
  User, 
  Activity, 
  Watch, 
  Smartphone,
  Mail,
  CreditCard,
  Battery
} from 'lucide-react';
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
        // Since there's no direct single pilgrim endpoint documented that returns everything,
        // we'll fetch the group and find the pilgrim.
        // Alternatively we could use search, but group context is better.
        const response = await apiClient.get('/groups/dashboard');
        if (response.data.success) {
          const currentGroup = response.data.data.find((g: any) => g._id === id);
          if (currentGroup) {
            setGroupName(currentGroup.group_name);
            const currentPilgrim = currentGroup.pilgrims.find((p: any) => p._id === pilgrimId);
            if (currentPilgrim) {
              setPilgrim(currentPilgrim);
            } else {
              toast.error(language === 'ar' ? 'الحاج غير موجود' : 'Pilgrim not found');
              router.push(`/dashboard/groups/${id}`);
            }
          } else {
            router.push('/dashboard');
          }
        }
      } catch (error: any) {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    if (id && pilgrimId) {
      fetchPilgrimDetails();
    }
  }, [id, pilgrimId]);

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
              <CardHeader className="bg-slate-900 text-white shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-primary" />
                  {t('dashboard.lastLocation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative bg-slate-100">
                {pilgrim.band_info?.last_location ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                     {/* Placeholder for map */}
                     <div className="w-full h-full bg-[url('https://maps.wikimedia.org/img/osm-intl,15,21.4225,39.8262.png')] bg-cover bg-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500" />
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 p-4 rounded-xl shadow-lg backdrop-blur-sm flex flex-col items-center">
                          <MapIcon className="w-8 h-8 text-primary mb-2" />
                          <p className="font-mono text-sm">
                            {pilgrim.band_info.last_location.lat.toFixed(6)}, {pilgrim.band_info.last_location.lng.toFixed(6)}
                          </p>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <MapIcon className="w-16 h-16 mb-4 opacity-20" />
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
