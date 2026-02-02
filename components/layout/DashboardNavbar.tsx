'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { deleteCookie, getCookie } from 'cookies-next';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Languages, LogOut, User, Bell, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: {
    invitation_id?: string;
    group_id?: string;
    group_name?: string;
    inviter_name?: string;
  };
}

export function DashboardNavbar() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setUserProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
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
      const name = getCookie('userName') as string;
      const role = getCookie('role') as string;
      if (name) setUserName(name);
      if (role) setUserRole(role);
    }
  }, [userProfile]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get('/notifications?limit=10');
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    deleteCookie('token');
    deleteCookie('role');
    deleteCookie('userName');
    router.push('/');
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setLoadingAction(invitationId);
    try {
      await apiClient.post(`/invitations/${invitationId}/accept`);
      toast.success(language === 'ar' ? 'تم قبول الدعوة بنجاح' : 'Invitation accepted!');
      // Refresh notifications
      const response = await apiClient.get('/notifications?limit=10');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setLoadingAction(invitationId);
    try {
      await apiClient.post(`/invitations/${invitationId}/decline`);
      toast.success(language === 'ar' ? 'تم رفض الدعوة' : 'Invitation declined');
      // Refresh notifications
      const response = await apiClient.get('/notifications?limit=10');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setLoadingAction(null);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Just now';
    if (diffMins < 60) return language === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    return language === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <Image
            src="/logo.jpeg"
            alt="Munawwara Care Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-bold text-lg text-primary hidden sm:block">
            {t('common.appName')}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="font-semibold text-sm">
                  {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                </span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllRead}>
                    {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 border-b last:border-b-0 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.created_at)}</p>

                        {/* Accept/Decline buttons for invitations */}
                        {notification.type === 'group_invitation' && !notification.read && notification.data?.invitation_id && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={loadingAction === notification.data.invitation_id}
                              onClick={() => handleAcceptInvitation(notification.data!.invitation_id!)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {language === 'ar' ? 'قبول' : 'Accept'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={loadingAction === notification.data.invitation_id}
                              onClick={() => handleDeclineInvitation(notification.data!.invitation_id!)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              {language === 'ar' ? 'رفض' : 'Decline'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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

