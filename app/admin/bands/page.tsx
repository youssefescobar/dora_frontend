'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Band {
  _id: string;
  serial_number: string;
  imei: string;
  status: 'active' | 'inactive' | 'maintenance';
  current_user_id?: {
    full_name: string;
    phone_number: string;
  };
}

export default function BandsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Register Band State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newBand, setNewBand] = useState({ serial_number: '', imei: '' });
  const [registering, setRegistering] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [bandToDelete, setBandToDelete] = useState<Band | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBands = useCallback(async () => {
    try {
      setLoading(true);
      const params: { page: number; limit: number; status?: string } = { page, limit: 10 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await apiClient.get('/hardware/bands', { params });
      if (response.data.success) {
        setBands(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t]);

  useEffect(() => {
    fetchBands();
  }, [fetchBands]);

  const handleRegister = async () => {
    if (!newBand.serial_number || !newBand.imei) return;

    try {
      setRegistering(true);
      await apiClient.post('/hardware/register', newBand);
      toast.success('Band registered successfully');
      setIsRegisterOpen(false);
      setNewBand({ serial_number: '', imei: '' });
      fetchBands();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || t('common.error'));
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setRegistering(false);
    }
  };

  const handlePermanentDelete = async (serial: string) => {
    try {
      setDeleting(true);
      await apiClient.delete(`/hardware/bands/${serial}/force`);
      toast.success('Band permanently deleted successfully');
      fetchBands();
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || t('common.error'));
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async (serial: string) => {
    try {
      await apiClient.post(`/hardware/bands/${serial}/activate`);
      toast.success('Band activated successfully');
      fetchBands();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || t('common.error'));
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  const handleDeactivate = async (serial: string) => {
    try {
      await apiClient.delete(`/hardware/bands/${serial}`);
      toast.success('Band deactivated successfully');
      fetchBands();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || t('common.error'));
      } else {
        toast.error(t('common.error'));
      }
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('admin.bands')}</h1>
          <p className="text-muted-foreground">Manage hardware wristbands</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative w-[180px]">
             <select
               className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
               value={statusFilter}
               onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
             >
               <option value="all">All Statuses</option>
               <option value="active">Active</option>
               <option value="inactive">Inactive</option>
               <option value="maintenance">Maintenance</option>
             </select>
             <Filter className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
           </div>

          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t('admin.registerBand')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.registerBand')}</DialogTitle>
                <DialogDescription>
                  Enter the hardware details for the new band.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="serial">Serial Number</Label>
                  <Input 
                    id="serial" 
                    value={newBand.serial_number}
                    onChange={e => setNewBand({...newBand, serial_number: e.target.value})}
                    placeholder="BAND-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imei">{t('admin.imei')}</Label>
                  <Input 
                    id="imei" 
                    value={newBand.imei}
                    onChange={e => setNewBand({...newBand, imei: e.target.value})}
                    placeholder="358938070000000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRegister} disabled={registering}>
                  {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial Number</TableHead>
              <TableHead>{t('admin.imei')}</TableHead>
              <TableHead>Current User</TableHead>
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
            ) : bands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No bands found
                </TableCell>
              </TableRow>
            ) : (
              bands.map((band) => (
                <TableRow key={band._id}>
                  <TableCell className="font-mono font-medium">
                    <button
                      onClick={() => router.push(`/admin/bands/${band.serial_number}`)}
                      className="hover:underline text-left"
                    >
                      {band.serial_number}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{band.imei}</TableCell>
                  <TableCell>
                    {band.current_user_id ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{band.current_user_id.full_name}</span>
                        <span className="text-xs text-muted-foreground">{band.current_user_id.phone_number}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      band.status === 'active' ? 'bg-green-100 text-green-700' :
                      band.status === 'inactive' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }>
                      {band.status}
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
                        {band.status === 'inactive' && (
                          <DropdownMenuItem onClick={() => handleActivate(band.serial_number)}>
                            Activate
                          </DropdownMenuItem>
                        )}
                        {band.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleDeactivate(band.serial_number)}>
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setBandToDelete(band);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Permanently
                        </DropdownMenuItem>
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
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this band?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the band
              with serial number <span className="font-mono">{bandToDelete?.serial_number}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (bandToDelete) {
                  handlePermanentDelete(bandToDelete.serial_number);
                }
              }}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}