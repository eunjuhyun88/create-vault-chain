import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  memePingTrackingService,
  memePingPIMService,
  memePingAlertsService,
  MemePingAlert,
  TrackingStats,
  PIMData,
  LeaderboardEntry,
  NotificationPreferences,
} from '@/services/memePingService';

// Tracking Stats Hook
export function useTrackingStats(passportId?: string) {
  return useQuery<TrackingStats>({
    queryKey: ['memeping-tracking-stats', passportId],
    queryFn: () => memePingTrackingService.getTrackingStats(passportId!),
    enabled: !!passportId,
  });
}

// PIM Hooks
export function usePIM(passportId?: string) {
  return useQuery<PIMData>({
    queryKey: ['memeping-pim', passportId],
    queryFn: () => memePingPIMService.getPIM(passportId!),
    enabled: !!passportId,
  });
}

export function useCalculatePIM() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ passportId, epoch }: { passportId: string; epoch?: number }) =>
      memePingPIMService.calculatePIM(passportId, epoch),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memeping-pim', variables.passportId] });
      toast({
        title: 'PIM Calculated',
        description: `Current PIM: ${(data.total_pim * 100).toFixed(1)}%`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Calculation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useLeaderboard(epoch?: number, limit = 100) {
  return useQuery<{ leaderboard: LeaderboardEntry[]; total: number }>({
    queryKey: ['memeping-leaderboard', epoch, limit],
    queryFn: () => memePingPIMService.getLeaderboard(epoch, limit),
  });
}

// Alerts Hooks
export function useMemePingAlerts(params?: {
  userId?: string;
  alertType?: string;
  read?: boolean;
  limit?: number;
}) {
  return useQuery<MemePingAlert[]>({
    queryKey: ['memeping-alerts', params],
    queryFn: () => memePingAlertsService.getAlerts({
      user_id: params?.userId,
      alert_type: params?.alertType,
      read: params?.read,
      limit: params?.limit,
    }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUnreadAlertCount(userId?: string) {
  return useQuery<number>({
    queryKey: ['memeping-unread-count', userId],
    queryFn: () => memePingAlertsService.getUnreadCount(userId),
    refetchInterval: 10000, // Check every 10 seconds
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, userId }: { alertId: string; userId?: string }) =>
      memePingAlertsService.markRead(alertId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memeping-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['memeping-unread-count'] });
    },
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId?: string) => memePingAlertsService.markAllRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memeping-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['memeping-unread-count'] });
      toast({
        title: 'All alerts marked as read',
      });
    },
  });
}

// Notification Preferences Hooks
export function useNotificationPreferences(userId?: string) {
  return useQuery<NotificationPreferences>({
    queryKey: ['memeping-preferences', userId],
    queryFn: () => memePingAlertsService.getPreferences(userId!),
    enabled: !!userId,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: Partial<NotificationPreferences> }) =>
      memePingAlertsService.updatePreferences(userId, preferences),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memeping-preferences', variables.userId] });
      toast({
        title: 'Preferences updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Demo Data Hook
export function useCreateDemoAlerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => memePingAlertsService.createDemoAlerts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memeping-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['memeping-unread-count'] });
      toast({
        title: 'Demo alerts created',
        description: '5 sample alerts have been added',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create demo alerts',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Realtime Alerts Subscription Hook
export function useRealtimeAlerts(userId?: string, onNewAlert?: (alert: MemePingAlert) => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('memeping-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memeping_alerts',
          filter: userId ? `user_id=eq.${userId}` : 'user_id=is.null',
        },
        (payload) => {
          console.log('[MemePing] New alert received:', payload);
          queryClient.invalidateQueries({ queryKey: ['memeping-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['memeping-unread-count'] });
          
          if (onNewAlert && payload.new) {
            onNewAlert(payload.new as MemePingAlert);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, onNewAlert]);
}
