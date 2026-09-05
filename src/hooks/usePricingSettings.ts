import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PricingSettings {
  id: string;
  sms_rate: number;
  whatsapp_rate: number;
  unlock_threshold: number;
  max_units: number;
  discount_note_en: string | null;
  discount_note_sw: string | null;
}

export const DEFAULT_PRICING: PricingSettings = {
  id: '',
  sms_rate: 50,
  whatsapp_rate: 1000,
  unlock_threshold: 300000,
  max_units: 5000,
  discount_note_en: null,
  discount_note_sw: null,
};

export const usePricingSettings = () => {
  const query = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: async (): Promise<PricingSettings> => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_PRICING;
      return {
        id: data.id,
        sms_rate: Number(data.sms_rate),
        whatsapp_rate: Number(data.whatsapp_rate),
        unlock_threshold: Number(data.unlock_threshold),
        max_units: Number(data.max_units),
        discount_note_en: data.discount_note_en,
        discount_note_sw: data.discount_note_sw,
      };
    },
  });

  return { settings: query.data ?? DEFAULT_PRICING, ...query };
};
