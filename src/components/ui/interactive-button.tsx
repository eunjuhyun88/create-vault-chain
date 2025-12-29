import * as React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/use-haptic';

const interactiveButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-primary/40 bg-transparent hover:bg-primary/10 hover:border-primary/60 text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent/10 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        cyber: 'bg-primary text-primary-foreground font-display tracking-wider',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-14 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
      hapticFeedback: {
        none: '',
        light: '',
        medium: '',
        heavy: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      hapticFeedback: 'light',
    },
  }
);

export interface InteractiveButtonProps
  extends VariantProps<typeof interactiveButtonVariants> {
  ripple?: boolean;
  glowOnHover?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

interface RippleStyle {
  left: number;
  top: number;
  id: number;
}

const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    hapticFeedback = 'light',
    ripple = true,
    glowOnHover = true,
    children,
    onClick,
    disabled,
    type = 'button',
  }, ref) => {
    const [ripples, setRipples] = React.useState<RippleStyle[]>([]);
    const controls = useAnimation();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger haptic feedback
      if (hapticFeedback && hapticFeedback !== 'none') {
        haptic.trigger(hapticFeedback as 'light' | 'medium' | 'heavy');
      }

      // Create ripple effect
      if (ripple) {
        const rect = e.currentTarget.getBoundingClientRect();
        const left = e.clientX - rect.left;
        const top = e.clientY - rect.top;
        const id = Date.now();
        
        setRipples(prev => [...prev, { left, top, id }]);
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== id));
        }, 600);
      }

      // Trigger press animation
      controls.start({
        scale: [1, 0.97, 1],
        transition: { duration: 0.15 }
      });

      // Call original onClick
      onClick?.(e);
    };

    return (
      <motion.button
        className={cn(
          interactiveButtonVariants({ variant, size, hapticFeedback, className }),
          glowOnHover && 'hover:shadow-[0_0_20px_hsl(75_100%_55%/0.3)]'
        )}
        ref={ref}
        onClick={handleClick}
        animate={controls}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={disabled}
        type={type}
      >
        {/* Shimmer effect on hover */}
        {(variant === 'default' || variant === 'cyber') && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
            whileHover={{ translateX: '200%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}

        {/* Ripple effects */}
        {ripples.map(r => (
          <motion.span
            key={r.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{ left: r.left, top: r.top }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
            animate={{ 
              width: 200, 
              height: 200, 
              x: -100, 
              y: -100, 
              opacity: 0 
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}

        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);
InteractiveButton.displayName = 'InteractiveButton';

export { InteractiveButton, interactiveButtonVariants };
