'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import AuthLayout from '@/components/layout/AuthLayout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import PhoneInput from 'react-phone-number-input/min';
import 'react-phone-number-input/style.css';

import en from 'react-phone-number-input/locale/en';
import { getCountryCallingCode, CountryCode, getCountries } from 'libphonenumber-js';

const labels: Record<string, string> = { ...en };
const validCountryCodes = getCountries();
Object.keys(labels).forEach((code) => {
  if (validCountryCodes.includes(code as CountryCode)) { // Only process valid country codes
    const callingCode = getCountryCallingCode(code as CountryCode);
    if (callingCode) { // Check if callingCode is found
      labels[code] = `${labels[code]} (+${callingCode})`;
    }
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone_number: z.string().refine((value) => /^\+[1-9]\d{1,14}$/.test(value), {
    message: "Invalid phone number",
  }),
});

export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const { t, language } = useLanguage();
  const router = useRouter();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', phone_number: '' },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const response = await apiClient.post('/auth/login', values);
      const { token, role, full_name } = response.data;
      setCookie('token', token);
      setCookie('role', role);
      setCookie('userName', full_name);
      toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
      router.push(role === 'admin' ? '/admin' : '/dashboard');
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error(language === 'ar' ? 'عدد كبير جدًا من محاولات تسجيل الدخول، يرجى المحاولة مرة أخرى لاحقًا.' : 'Too many login attempts, please try again later.');
      } else {
        const errorMsg = error.response?.data?.errors?.join('\n') || error.response?.data?.error || t('common.error');
        toast.error(errorMsg);
      }
    }
  }

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    try {
      await apiClient.post('/auth/register', values);
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
      setIsLoginView(true); // Switch to login view after successful registration
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error(language === 'ar' ? 'عدد كبير جدًا من محاولات التسجيل، يرجى المحاولة مرة أخرى لاحقًا.' : 'Too many registration attempts, please try again later.');
      } else {
        let errorMsg = error.response?.data?.error || t('common.error');
        if (error.response?.data?.errors) {
          errorMsg = error.response.data.errors.join('\n');
        }
        if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('phone')) {
          toast.error(language === 'ar' ? 'البريد الإلكتروني أو رقم الهاتف موجود بالفعل' : 'Email or phone number already exists');
        } else {
          toast.error(errorMsg);
        }
      }
    }
  }

  return (
    <AuthLayout>
      <div
        className={`transition-opacity duration-300 ${isLoginView ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
      >
        <Image key="logo-login" src="/logo.jpeg" alt="Dora Care" width={64} height={64} className="mx-auto" />
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold">{t('auth.welcomeBack')}</h1>
          <p className="text-balance text-muted-foreground">{t('auth.signInToAccount')}</p>
        </div>
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="grid gap-4">
            <FormField control={loginForm.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>{t('common.email')}</FormLabel><FormControl><Input placeholder="abdullah.alfahad@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={loginForm.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>{t('common.password')}</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting ? t('common.loading') : t('common.login')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('auth.noAccount')}{' '}
          <button onClick={() => setIsLoginView(false)} className="underline">
            {t('common.register')}
          </button>
        </div>
      </div>

      <div
        className={`transition-opacity duration-300 ${!isLoginView ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
      >
        <Image key="logo-register" src="/logo.jpeg" alt="Dora Care" width={64} height={64} className="mx-auto" />
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold">{t('auth.createAccount')}</h1>
          <p className="text-balance text-muted-foreground">{t('auth.registerModerator')}</p>
        </div>
        <Form {...registerForm}>
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="grid gap-4">
            <FormField control={registerForm.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>{t('common.fullName')}</FormLabel><FormControl><Input placeholder="Abdullah Al-Fahad" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={registerForm.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>{t('common.email')}</FormLabel><FormControl><Input placeholder="abdullah.alfahad@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={registerForm.control} name="phone_number" render={({ field }) => (
              <FormItem><FormLabel>{t('common.phoneNumber')}</FormLabel><FormControl><PhoneInput placeholder="+966501234567" {...field} international withCountryCallingCode className="phone-input" labels={labels} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={registerForm.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>{t('common.password')}</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
              {registerForm.formState.isSubmitting ? t('common.loading') : t('common.register')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('auth.haveAccount')}{' '}
          <button onClick={() => setIsLoginView(true)} className="underline">
            {t('common.login')}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}