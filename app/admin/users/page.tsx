'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  ShieldAlert, 
  UserX, 
  UserCheck,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
// Removed Select imports

export default function UsersPage() {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      const response = await apiClient.get('/admin/users', { params });
      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleAction = async (action: string, userId: string) => {
    try {
      let endpoint = '';
      if (action === 'promote') endpoint = '/admin/users/promote';
      if (action === 'demote') endpoint = '/admin/users/demote';
      if (action === 'deactivate') endpoint = '/admin/users/deactivate';
      if (action === 'activate') endpoint = '/admin/users/activate';

      await apiClient.post(endpoint, { user_id: userId });
      toast.success('Action successful');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('admin.users')}</h1>
          <p className="text-muted-foreground">Manage system users and roles</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative w-[180px]">
             <select
               className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
               value={roleFilter}
               onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
             >
               <option value="all">All Roles</option>
               <option value="admin">Admin</option>
               <option value="moderator">Moderator</option>
               <option value="pilgrim">Pilgrim</option>
             </select>
             <Filter className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
           </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.fullName')}</TableHead>
              <TableHead>{t('common.email')}</TableHead>
              <TableHead>{t('admin.role')}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }>
                      {user.active ? t('admin.active') : t('admin.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {user.role !== 'admin' && (
                          <DropdownMenuItem onClick={() => handleAction('promote', user._id)}>
                            <Shield className="mr-2 h-4 w-4 text-purple-600" />
                            {t('admin.promote')}
                          </DropdownMenuItem>
                        )}
                        {user.role === 'admin' && (
                          <DropdownMenuItem onClick={() => handleAction('demote', user._id)}>
                            <ShieldAlert className="mr-2 h-4 w-4 text-orange-600" />
                            {t('admin.demote')}
                          </DropdownMenuItem>
                        )}
                        {user.active ? (
                          <DropdownMenuItem onClick={() => handleAction('deactivate', user._id)}>
                            <UserX className="mr-2 h-4 w-4 text-red-600" />
                            {t('admin.deactivate')}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleAction('activate', user._id)}>
                            <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                            {t('admin.activate')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-end space-x-2 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
