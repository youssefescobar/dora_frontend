'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Watch, Battery, User, Phone, Mail } from 'lucide-react';
import { MapComponent } from '@/components/ui/MapComponent';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BandDetails {
  _id: string;
  serial_number: string;
  imei: string;
  status: 'active' | 'inactive' | 'maintenance';
  battery_percent?: number;
  current_user_id?: {
    _id: string;
    full_name: string;
    email: string;
    phone_number: string;
  };
  last_latitude?: number;
  last_longitude?: number;
  last_updated?: string;
}

export default function BandDetailsPage() {
  const { serial_number } = useParams();
  const { t, language, dir } = useLanguage();
  const router = useRouter();
  const [band, setBand] = useState<BandDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBandDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/hardware/bands/${serial_number}`);
        setBand(response.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error(language === 'ar' ? 'السوار غير موجود' : 'Band not found');
        } else {
          toast.error(t('common.error'));
        }
        router.push('/admin/bands'); // Redirect back to bands list if not found or error
      } finally {
        setLoading(false);
      }
    };

    if (serial_number) {
      fetchBandDetails();
    }
  }, [serial_number, language, router, t]);

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

  if (!band) return null; // Should ideally redirect by now if not found

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto p-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/admin/bands')} 
          className="mb-4 gap-2"
        >
          <ChevronLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          {language === 'ar' ? 'العودة إلى الأساور' : 'Back to Bands'}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Band Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Watch className="w-6 h-6 text-primary" />
                {band.serial_number}
              </CardTitle>
              <Badge 
                className={
                  band.status === 'active' ? 'bg-green-100 text-green-700' :
                  band.status === 'inactive' ? 'bg-red-100 text-red-700' :
                  'bg-orange-100 text-orange-700'
                }
              >
                {band.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.imei')}</p>
                <p className="font-mono text-lg">{band.imei}</p>
              </div>
              {band.battery_percent !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.battery')}</p>
                  <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-gray-600" />
                    <p className="text-lg">{band.battery_percent}%</p>
                  </div>
                </div>
              )}
              {band.last_updated && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.lastUpdated')}</p>
                  <p className="text-lg">{new Date(band.last_updated).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current User Card */}
          {band.current_user_id && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <User className="w-6 h-6 text-primary" />
                  {t('dashboard.assignedTo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('common.fullName')}</p>
                  <p className="text-lg">{band.current_user_id.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('common.email')}</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-lg">{band.current_user_id.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('common.phoneNumber')}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-lg">{band.current_user_id.phone_number}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => router.push(`/dashboard/groups/${band.current_user_id._id}/pilgrims/${band.current_user_id._id}`)}>
                  {language === 'ar' ? 'عرض ملف الحاج' : 'View Pilgrim Profile'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Last Location Card */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Watch className="w-6 h-6 text-primary" />
                {t('dashboard.lastLocation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 w-full">
                {band.last_latitude && band.last_longitude ? (
                  <MapComponent latitude={band.last_latitude} longitude={band.last_longitude} popupText={band.serial_number} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <Watch className="w-16 h-16 mb-4 opacity-20" />
                    <p>{language === 'ar' ? 'لم يتم استلام أي بيانات للموقع بعد' : 'No location data received yet'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
