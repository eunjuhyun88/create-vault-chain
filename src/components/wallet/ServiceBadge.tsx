import { AIService } from '@/types/wallet';
import { Sparkles, Video, MessageSquare, Palette, Wand2, Clapperboard, Eye, Bot } from 'lucide-react';

interface ServiceBadgeProps {
  service: AIService;
  size?: 'sm' | 'md' | 'lg';
}

const serviceConfig: Record<AIService, { 
  label: string; 
  icon: React.ElementType; 
  className: string;
}> = {
  midjourney: { 
    label: 'Midjourney', 
    icon: Sparkles, 
    className: 'badge-midjourney' 
  },
  dalle: { 
    label: 'DALL·E', 
    icon: Palette, 
    className: 'badge-dalle' 
  },
  sora: { 
    label: 'Sora', 
    icon: Video, 
    className: 'badge-sora' 
  },
  runway: { 
    label: 'Runway', 
    icon: Clapperboard, 
    className: 'badge-runway' 
  },
  stable: { 
    label: 'Stable Diffusion', 
    icon: Wand2, 
    className: 'badge-stable' 
  },
  firefly: { 
    label: 'Firefly', 
    icon: Eye, 
    className: 'badge-firefly' 
  },
  veo: { 
    label: 'Veo', 
    icon: Video, 
    className: 'badge-veo' 
  },
  chatgpt: { 
    label: 'ChatGPT', 
    icon: Bot, 
    className: 'badge-chatgpt' 
  },
};

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function ServiceBadge({ service, size = 'md' }: ServiceBadgeProps) {
  const config = serviceConfig[service];
  const Icon = config.icon;

  return (
    <div className={`
      inline-flex items-center gap-1 rounded-full border font-mono
      ${config.className} ${sizeClasses[size]}
    `}>
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      <span>{config.label}</span>
    </div>
  );
}
