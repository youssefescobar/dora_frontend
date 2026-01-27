'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { deleteCookie, getCookie } from 'cookies-next';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Languages, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function DashboardNavbar() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null); // New state for API fetched profile

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setUserProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Fallback to cookies if API call fails
        const name = getCookie('userName') as string;
        const role = getCookie('role') as string;
        if (name) setUserName(name);
        if (role) setUserRole(role);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      setUserName(userProfile.full_name);
      setUserRole(userProfile.role);
    } else {
      // If API fetch hasn't completed or failed, use cookie values initially
      const name = getCookie('userName') as string;
      const role = getCookie('role') as string;
      if (name) setUserName(name);
      if (role) setUserRole(role);
    }
  }, [userProfile]);

  const handleLogout = () => {
    deleteCookie('token');
    deleteCookie('role');
    deleteCookie('userName');
    router.push('/login');
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <Image
            src="/logo.jpeg"
            alt="Dora Care Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-bold text-lg text-primary hidden sm:block">
            {t('common.appName')}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Languages className="w-4 h-4" />
                <span className="hidden xs:block">{language === 'en' ? 'English' : 'العربية'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('ar')}>
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{userProfile?.full_name || userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile?.role || userRole}
                </p>
              </div>
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>{t('dashboard.myProfile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
