'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(3, { message: 'Full name must be at least 3 characters.' }),
  phone_number: z.string().min(10, { message: 'Phone number must be at least 10 characters.' }),
});

export default function ProfilePage() {
  const { t, language, dir } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone_number: '',
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/auth/me');
        form.reset({
          full_name: response.data.full_name,
          phone_number: response.data.phone_number,
        });
      } catch (error: any) {
        toast.error(error.response?.data?.error || t('common.error'));
        router.push('/dashboard'); // Redirect if profile can't be fetched
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    try {
      const response = await apiClient.put('/auth/update-profile', values);
      toast.success(response.data.message || (language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'));
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || error.response?.data?.error || t('common.error'));
    }
  }

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
          {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
        </Button>

        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{t('dashboard.myProfile')}</CardTitle>
            <CardDescription>{t('dashboard.updateProfileInfo')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.fullName')}</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.phoneNumber')}</FormLabel>
                      <FormControl>
                        <Input placeholder="+201234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.saveChanges')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
