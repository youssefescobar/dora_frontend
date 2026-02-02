'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

import en from 'react-phone-number-input/locale/en';
import { getCountryCallingCode, CountryCode, getCountries } from 'libphonenumber-js';

const labels: Record<string, string> = { ...en };
const validCountryCodes = getCountries();
Object.keys(labels).forEach((code) => {
  if (validCountryCodes.includes(code as CountryCode)) {
    const callingCode = getCountryCallingCode(code as CountryCode);
    if (callingCode) {
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

type AuthView = 'login' | 'register' | 'verify';

export default function AuthPage() {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { t, language } = useLanguage();
  const router = useRouter();

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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
      const response = await apiClient.post('/auth/register', values);
      if (response.data.success) {
        setPendingEmail(values.email);
        setAuthView('verify');
        setResendCooldown(60); // 60 second cooldown before resend
        toast.success(language === 'ar' ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'Verification code sent to your email');
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error(language === 'ar' ? 'عدد كبير جدًا من محاولات التسجيل، يرجى المحاولة مرة أخرى لاحقًا.' : 'Too many registration attempts, please try again later.');
      } else {
        let errorMsg = error.response?.data?.error || error.response?.data?.message || t('common.error');
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

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otpCode];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpCode(newOtp);
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    otpInputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
  };

  // Verify OTP
  async function verifyOtp() {
    const code = otpCode.join('');
    if (code.length !== 6) {
      toast.error(language === 'ar' ? 'يرجى إدخال الرمز المكون من 6 أرقام' : 'Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiClient.post('/auth/verify-email', {
        email: pendingEmail,
        code: code
      });
      if (response.data.success) {
        toast.success(language === 'ar' ? 'تم التحقق من البريد الإلكتروني بنجاح' : 'Email verified successfully');
        setAuthView('login');
        setOtpCode(['', '', '', '', '', '']);
        setPendingEmail('');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || t('common.error');
      toast.error(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  }

  // Resend verification code
  async function resendCode() {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const response = await apiClient.post('/auth/resend-verification', {
        email: pendingEmail
      });
      if (response.data.success) {
        toast.success(language === 'ar' ? 'تم إعادة إرسال رمز التحقق' : 'Verification code resent');
        setResendCooldown(60);
        setOtpCode(['', '', '', '', '', '']);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || t('common.error');
      toast.error(errorMsg);
    } finally {
      setIsResending(false);
    }
  }

  // Go back from verification
  const handleBackFromVerify = () => {
    setAuthView('register');
    setOtpCode(['', '', '', '', '', '']);
    setPendingEmail('');
  };

  return (
    <AuthLayout>
      {/* Login View */}
      <div
        className={`transition-opacity duration-300 ${authView === 'login' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
      >
        <Image key="logo-login" src="/logo.jpeg" alt="Munawwara Care" width={64} height={64} className="mx-auto" />
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
          <button onClick={() => setAuthView('register')} className="underline">
            {t('common.register')}
          </button>
        </div>
      </div>

      {/* Register View */}
      <div
        className={`transition-opacity duration-300 ${authView === 'register' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
      >
        <Image key="logo-register" src="/logo.jpeg" alt="Munawwara Care" width={64} height={64} className="mx-auto" />
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
          <button onClick={() => setAuthView('login')} className="underline">
            {t('common.login')}
          </button>
        </div>
      </div>

      {/* Email Verification View */}
      <div
        className={`transition-opacity duration-300 ${authView === 'verify' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-bold">{language === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Verify Your Email'}</h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ar'
                ? `لقد أرسلنا رمز التحقق إلى ${pendingEmail}`
                : `We've sent a verification code to ${pendingEmail}`}
            </p>
          </div>

          {/* OTP Input */}
          <div className="flex gap-2 mt-4" onPaste={handleOtpPaste}>
            {otpCode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-primary focus:outline-none transition-colors bg-background"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button
            onClick={verifyOtp}
            className="w-full mt-4"
            disabled={isVerifying || otpCode.join('').length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}
              </>
            ) : (
              language === 'ar' ? 'تحقق' : 'Verify'
            )}
          </Button>

          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'لم تستلم الرمز؟' : "Didn't receive the code?"}
            </p>
            <Button
              variant="ghost"
              onClick={resendCode}
              disabled={isResending || resendCooldown > 0}
              className="text-sm"
            >
              {isResending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {resendCooldown > 0
                ? `${language === 'ar' ? 'إعادة الإرسال خلال' : 'Resend in'} ${resendCooldown}s`
                : (language === 'ar' ? 'إعادة إرسال الرمز' : 'Resend Code')}
            </Button>
          </div>

          <Button
            variant="link"
            onClick={handleBackFromVerify}
            className="mt-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'العودة للتسجيل' : 'Back to Register'}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}