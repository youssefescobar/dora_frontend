'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Watch, MapPin, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';

interface GroupCardProps {
  group: {
    _id: string;
    group_name: string;
    pilgrims: any[];
  };
  onViewDetails: (id: string) => void;
  onSendAlert: (groupId: string, groupName: string) => void;
}

export function GroupCard({ group, onViewDetails, onSendAlert }: GroupCardProps) {
  const { t } = useLanguage();
  const activeBands = group.pilgrims.filter(p => p.band_info?.serial_number).length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">{group.group_name}</CardTitle>
          <Badge variant="secondary">{group.pilgrims.length} {t('dashboard.pilgrims')}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Watch className="w-4 h-4" />
            <span>{activeBands} {t('dashboard.bands')} {t('admin.active')}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => onViewDetails(group._id)} className="gap-2">
              <Users className="w-4 h-4" />
              {t('common.actions')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSendAlert(group._id, group.group_name)} className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Bell className="w-4 h-4" />
              {t('dashboard.sendAlert')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
