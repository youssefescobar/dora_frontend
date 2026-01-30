'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Shield,
  Trash2,
  Watch,
  Unlink
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import axios from 'axios';

interface Group {
  _id: string;
  group_name: string;
  pilgrim_count: number;
  created_by: {
    full_name: string;
  };
  moderator_ids: string[];
  created_at: string;
  available_band_ids?: Band[];
}

interface Band {
  _id: string;
  serial_number: string;
  imei: string;
  status: 'active' | 'inactive' | 'maintenance';
  battery_percent?: number; // Added optional property
}

export default function GroupsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Assign Bands State
  const [isAssignBandDialogOpen, setIsAssignBandDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [availableBands, setAvailableBands] = useState<Band[]>([]);
  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  const [assigningBands, setAssigningBands] = useState(false);

  // Unassign Bands State
  const [isUnassignBandDialogOpen, setIsUnassignBandDialogOpen] = useState(false);
  const [selectedBandsToUnassign, setSelectedBandsToUnassign] = useState<string[]>([]);
  const [unassigningBands, setUnassigningBands] = useState(false);

  const handleAssignBands = async () => {
    if (!selectedGroup || selectedBandIds.length === 0) return;
    try {
      setAssigningBands(true);
      await apiClient.post(`/admin/groups/${selectedGroup._id}/assign-bands`, { band_ids: selectedBandIds });
      toast.success('Bands assigned successfully');
      setIsAssignBandDialogOpen(false);
      setSelectedGroup(null);
      setSelectedBandIds([]);
      fetchGroups(); // Refresh groups to reflect the change
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || t('common.error'));
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setAssigningBands(false);
    }
  };

  const openAssignBandDialog = async (group: Group) => {
    setSelectedGroup(group);
    setIsAssignBandDialogOpen(true);
    try {
      // Fetch all globally unassigned bands (not assigned to any pilgrim) AND not assigned to any group
      const response = await apiClient.get(`/hardware/bands`, { params: { status: 'active', exclude_assigned_to_groups: 'true' } });
      if (response.data.success && response.data.data) {
        // Filter to show only unassigned bands (current_user_id is null)
        const unassignedBands = response.data.data.filter((band: any) => !band.current_user_id);
        setAvailableBands(unassignedBands);
      } else if (response.data.data) {
        // Handle case where response is direct array instead of wrapped in success
        const unassignedBands = response.data.data.filter((band: any) => !band.current_user_id);
        setAvailableBands(unassignedBands);
      } else {
        setAvailableBands([]);
      }
    } catch (error) {
      console.error('Failed to fetch available bands:', error);
      toast.error('Failed to fetch available bands for assignment');
      setAvailableBands([]);
    }
  };

  const handleUnassignBands = async () => {
    if (!selectedGroup || selectedBandsToUnassign.length === 0) return;
    try {
      setUnassigningBands(true);
      await apiClient.post(`/admin/groups/${selectedGroup._id}/unassign-bands`, { band_ids: selectedBandsToUnassign });
      toast.success('Bands unassigned successfully');
      setIsUnassignBandDialogOpen(false);
      setSelectedGroup(null);
      setSelectedBandsToUnassign([]);
      fetchGroups(); // Refresh groups to reflect the change
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || t('common.error'));
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setUnassigningBands(false);
    }
  };

  const openUnassignBandDialog = async (group: Group) => {
    setSelectedGroup(group);
    setIsUnassignBandDialogOpen(true);
    try {
      // Fetch the full details of the selected group to get populated available_band_ids
      const response = await apiClient.get(`/groups/${group._id}`);
      if (response.data && response.data.available_band_ids) {
        setAvailableBands(response.data.available_band_ids);
      } else {
        setAvailableBands([]);
      }
    } catch (error) {
      toast.error('Failed to fetch assigned bands for group');
    }
  };

  const [search, setSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on search
      fetchGroups();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/groups', { params: { page, limit: 12, search } });
      if (response.data.success) {
        setGroups(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  // ... (rest of useEffects)

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/admin/groups/${deleteId}`);
      toast.success('Group deleted successfully');
      setDeleteId(null);
      setIsDeleteDialogOpen(false);
      fetchGroups();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('admin.groups')}</h1>
          <p className="text-muted-foreground">Manage all Hajj groups</p>
        </div>
        <div className="relative w-full sm:w-64">
          {/* Search Input handled below */}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
          <p className="text-muted-foreground">{search ? 'No groups found matching your search' : 'No groups found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold truncate pr-2" title={group.group_name}>
                    {group.group_name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {group.pilgrim_count} {t('dashboard.pilgrims')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Watch className="w-4 h-4 text-green-600" />
                  <span>
                    {group.available_band_ids?.length || 0} Bands Available
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="truncate">
                    Created by: <span className="font-medium text-foreground">{group.created_by?.full_name || 'Unknown'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {group.moderator_ids?.length || 0} Moderators
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {group.created_at ? new Date(group.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAssignBandDialog(group)}
                >
                  <Watch className="w-4 h-4 mr-2" />
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openUnassignBandDialog(group)}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unassign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/groups/${group._id}`)}
                >
                  Details
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setDeleteId(group._id);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Bands Dialog */}
      <Dialog open={isAssignBandDialogOpen} onOpenChange={setIsAssignBandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Bands to {selectedGroup?.group_name}</DialogTitle>
            <DialogDescription>Select bands to make them available for this group.</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            {availableBands.length > 0 ? (
              availableBands.map((band, index) => {
                const bandId = band._id || String(index);
                return (
                  <div key={bandId} className="flex items-center justify-between p-2 border-b">
                    <label htmlFor={`band-${bandId}`} className="flex items-center gap-3 cursor-pointer w-full">
                      <input
                        type="checkbox"
                        id={`band-${bandId}`}
                        checked={selectedBandIds.includes(band._id)}
                        onChange={() => {
                          setSelectedBandIds(prev =>
                            prev.includes(band._id)
                              ? prev.filter(id => id !== band._id)
                              : [...prev, band._id]
                          );
                        }}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {band.serial_number}
                          {band.battery_percent !== undefined && band.battery_percent !== null && (
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${band.battery_percent < 20 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                              {band.battery_percent}%
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">IMEI: {band.imei}</p>
                      </div>
                    </label>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm">No available bands to assign.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignBandDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignBands} disabled={assigningBands || selectedBandIds.length === 0}>
              {assigningBands ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Bands Dialog */}
      <Dialog open={isUnassignBandDialogOpen} onOpenChange={setIsUnassignBandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign Bands from {selectedGroup?.group_name}</DialogTitle>
            <DialogDescription>Select bands to remove them from this group.</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            {availableBands.length > 0 ? (
              availableBands.map((band: Band, index: number) => {
                const bandId = band._id || String(index);
                return (
                  <div key={bandId} className="flex items-center justify-between p-2 border-b">
                    <label htmlFor={`unassign-band-${bandId}`} className="flex items-center gap-3 cursor-pointer w-full">
                      <input
                        type="checkbox"
                        id={`unassign-band-${bandId}`}
                        checked={selectedBandsToUnassign.includes(band._id)}
                        onChange={() => {
                          setSelectedBandsToUnassign(prev =>
                            prev.includes(band._id)
                              ? prev.filter(id => id !== band._id)
                              : [...prev, band._id]
                          );
                        }}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">{band.serial_number}</p>
                        <p className="text-sm text-muted-foreground">IMEI: {band.imei}</p>
                      </div>
                    </label>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm">No bands assigned to this group.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnassignBandDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleUnassignBands} disabled={unassigningBands || selectedBandsToUnassign.length === 0}>
              {unassigningBands ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unassign Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
            <DialogDescription>{t('common.confirmDeleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 p-4">
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
      )}
    </div>
  );
}