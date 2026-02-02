'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages, LogIn, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LandingNavbar() {
  const { language, setLanguage, t, dir } = useLanguage();

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            key={Date.now()}
            src="/logo.jpeg"
            alt="Munawwara Care Logo"
            width={40}
            height={40}
            className="rounded-lg shadow-sm"
          />
          <span className="font-bold text-xl text-primary tracking-tight">
            {t('common.appName')}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/auth">
              <Button variant="ghost" className="hidden sm:flex">
                {t('common.login')}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 flex">
                  <Languages className="w-4 h-4" />
                  {language === 'en' ? 'English' : 'العربية'}
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
            <Link href="/auth">
              <Button className="gap-2">
                {t('common.register')}
                <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
