'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { useLanguage } from '@/lib/LanguageContext';
import { LandingNavbar } from '@/components/layout/LandingNavbar';
import { Button } from '@/components/ui/button';
import {
  Map,
  Activity,
  Bell,
  Watch,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const { t, language, dir } = useLanguage();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-32 lg:pb-28">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-primary bg-primary/5">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              {t('landing.v1Available')}
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {t('landing.heroTitle')}
            </h1>

            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {t('landing.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {isLoggedIn ? (
                <Button size="lg" className="h-12 px-8 text-lg gap-2" onClick={() => router.push('/dashboard')}>
                  {t('dashboard.title')}
                  <ArrowRight className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </Button>
              ) : (
                <>
                  <Link href="/auth">
                    <Button size="lg" className="h-12 px-8 text-lg gap-2 shadow-lg shadow-primary/20">
                      {t('landing.getStarted')}
                      <ArrowRight className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                      {t('landing.learnMore')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 opacity-30 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 blur-3xl" />
          <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-400/20 to-teal-400/20 blur-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-slate-50/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: t('landing.stats.pilgrimsSecured'), value: '10k+' },
              { label: t('landing.stats.activeGroups'), value: '500+' },
              { label: t('landing.stats.uptime'), value: '99.9%' },
              { label: t('landing.stats.countries'), value: '12+' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
              {t('landing.featuresSectionTitle')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('landing.featuresSectionSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Map}
              title={t('landing.features.tracking')}
              description={t('landing.features.trackingDesc')}
            />
            <FeatureCard
              icon={Activity}
              title={t('landing.features.health')}
              description={t('landing.features.healthDesc')}
            />
            <FeatureCard
              icon={Bell}
              title={t('landing.features.alerts')}
              description={t('landing.features.alertsDesc')}
            />
            <FeatureCard
              icon={Watch}
              title={t('landing.features.hardware')}
              description={t('landing.features.hardwareDesc')}
            />
            <FeatureCard
              icon={Users}
              title={t('landing.features.groupManagement')}
              description={t('landing.features.groupManagementDesc')}
            />
            <FeatureCard
              icon={ShieldCheck}
              title={t('landing.features.dataSecurity')}
              description={t('landing.features.dataSecurityDesc')}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/40 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100">
                {t('landing.getStarted')}
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="ghost" className="h-14 px-8 text-lg w-full sm:w-auto border-slate-700 hover:bg-slate-800 text-white hover:text-white">
                {t('landing.cta.contactSales')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  key={Date.now()}
                  src="/logo.jpeg"
                  alt="Munawwara Care Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="font-bold text-lg text-slate-900">Munawwara Care</span>
              </div>
              <p className="text-sm text-slate-500">
                {t('landing.footer.tagline')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.featuresLink')}</Link></li>
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.hardwareLink')}</Link></li>
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.pricingLink')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.aboutUsLink')}</Link></li>
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.contactLink')}</Link></li>
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.privacyPolicyLink')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">{t('landing.footer.connect')}</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.twitter')}</Link></li>
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.linkedin')}</Link></li>
                <li><Link href="#" className="hover:text-primary">{t('landing.footer.instagram')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} {t('landing.footer.copyright')}</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-slate-900">{t('landing.footer.termsLink')}</Link>
              <Link href="#" className="hover:text-slate-900">{t('landing.footer.privacyLink')}</Link>
              <Link href="#" className="hover:text-slate-900">{t('landing.footer.cookiesLink')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-slate-50 p-8 rounded-2xl border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="h-12 w-12 bg-white rounded-xl shadow-sm border flex items-center justify-center text-primary mb-6">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
