import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  passportService, 
  scannedAssetService, 
  CreatePassportInput, 
  CreateScannedAssetInput, 
  AIService, 
  AssetStatus,
  PassportUpdate 
} from '@/services/passportService';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/hooks/use-haptic';

// Query keys
const QUERY_KEYS = {
  passports: ['passports'] as const,
  passport: (id: string) => ['passports', id] as const,
  scannedAssets: ['scannedAssets'] as const,
};

// Passports hooks
export function usePassports() {
  return useQuery({
    queryKey: QUERY_KEYS.passports,
    queryFn: passportService.getAll,
  });
}

export function usePassport(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.passport(id),
    queryFn: () => passportService.getById(id),
    enabled: !!id,
  });
}

export function usePassportsBySource(source: AIService) {
  return useQuery({
    queryKey: [...QUERY_KEYS.passports, source],
    queryFn: () => passportService.getBySource(source),
  });
}

export function useCreatePassport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreatePassportInput) => passportService.create(input),
    onSuccess: (data) => {
      haptic.success();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.passports });
      toast({
        title: 'Passport Minted!',
        description: `${data.acp_id} has been added to your vault.`,
      });
    },
    onError: (error) => {
      haptic.error();
      toast({
        title: 'Minting Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePassport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PassportUpdate }) => 
      passportService.update(id, updates),
    onSuccess: (data) => {
      haptic.light();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.passports });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.passport(data.id) });
      toast({
        title: 'Passport Updated',
        description: 'Changes saved successfully.',
      });
    },
    onError: (error) => {
      haptic.error();
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePassport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: passportService.delete,
    onSuccess: () => {
      haptic.medium();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.passports });
      toast({
        title: 'Passport Deleted',
        description: 'The passport has been removed from your vault.',
      });
    },
    onError: (error) => {
      haptic.error();
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });
}

// Scanned Assets hooks
export function useScannedAssets() {
  return useQuery({
    queryKey: QUERY_KEYS.scannedAssets,
    queryFn: scannedAssetService.getAll,
  });
}

export function useCreateScannedAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateScannedAssetInput) => scannedAssetService.create(input),
    onSuccess: () => {
      haptic.medium();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scannedAssets });
      toast({
        title: 'Session Detected',
        description: 'Scanning AI creation...',
      });
    },
    onError: (error) => {
      haptic.error();
      toast({
        title: 'Scan Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateScannedAssetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, previewUrl }: { id: string; status: AssetStatus; previewUrl?: string }) =>
      scannedAssetService.updateStatus(id, status, previewUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scannedAssets });
    },
  });
}

export function useDeleteScannedAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scannedAssetService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scannedAssets });
    },
  });
}

export function useMintScannedAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, trustLevel }: { id: string; trustLevel?: number }) =>
      scannedAssetService.mintToPassport(id, trustLevel),
    onSuccess: (data) => {
      haptic.success();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.passports });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scannedAssets });
      toast({
        title: 'ACP Minted Successfully!',
        description: `${data.acp_id} is now in your vault.`,
      });
    },
    onError: (error) => {
      haptic.error();
      toast({
        title: 'Minting Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });
}
