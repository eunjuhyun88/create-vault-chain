import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, AlertCircle, Clock } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Logo } from './Logo';

interface PinLockScreenProps {
  onUnlock: () => void;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATIONS = [30, 300, 1800]; // 30s, 5min, 30min in seconds

export function PinLockScreen({ onUnlock }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutLevel, setLockoutLevel] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingLockout, setRemainingLockout] = useState(0);
  const { unlockWallet } = useWallet();

  // Check for existing lockout on mount
  useEffect(() => {
    const storedLockout = sessionStorage.getItem('wallet_lockout');
    const storedLevel = sessionStorage.getItem('wallet_lockout_level');
    if (storedLockout) {
      const endTime = parseInt(storedLockout, 10);
      if (endTime > Date.now()) {
        setLockoutEndTime(endTime);
        setLockoutLevel(storedLevel ? parseInt(storedLevel, 10) : 0);
      } else {
        sessionStorage.removeItem('wallet_lockout');
        sessionStorage.removeItem('wallet_lockout_level');
      }
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutEndTime - Date.now()) / 1000));
        setRemainingLockout(remaining);
        if (remaining === 0) {
          setLockoutEndTime(null);
          setAttempts(0);
          sessionStorage.removeItem('wallet_lockout');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutEndTime]);

  const isLockedOut = lockoutEndTime !== null && lockoutEndTime > Date.now();

  const handleDigit = useCallback((digit: string) => {
    if (isLockedOut) return;
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError(false);
    }
  }, [pin.length, isLockedOut]);

  const handleDelete = useCallback(() => {
    if (isLockedOut) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, [isLockedOut]);

  useEffect(() => {
    if (pin.length === 6 && !isLockedOut) {
      const attemptUnlock = async () => {
        const success = await unlockWallet(pin);
        if (success) {
          // Reset lockout on successful unlock
          sessionStorage.removeItem('wallet_lockout');
          sessionStorage.removeItem('wallet_lockout_level');
          onUnlock();
        } else {
          setError(true);
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          
          if (newAttempts >= MAX_ATTEMPTS) {
            // Trigger lockout with exponential backoff
            const currentLevel = Math.min(lockoutLevel, LOCKOUT_DURATIONS.length - 1);
            const lockoutDuration = LOCKOUT_DURATIONS[currentLevel] * 1000;
            const endTime = Date.now() + lockoutDuration;
            
            setLockoutEndTime(endTime);
            setLockoutLevel(currentLevel + 1);
            
            // Persist lockout to sessionStorage
            sessionStorage.setItem('wallet_lockout', endTime.toString());
            sessionStorage.setItem('wallet_lockout_level', (currentLevel + 1).toString());
          }
          
          setTimeout(() => {
            setPin('');
          }, 500);
        }
      };
      attemptUnlock();
    }
  }, [pin, unlockWallet, onUnlock, isLockedOut, attempts, lockoutLevel]);

  const formatLockoutTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="h-full bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10 pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scan-line" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Logo size="lg" showText={false} />
      </motion.div>

      {/* Lock Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`w-16 h-16 rounded-full border flex items-center justify-center mb-6 ${
          isLockedOut 
            ? 'bg-destructive/10 border-destructive/30' 
            : 'bg-primary/10 border-primary/30'
        }`}
      >
        {isLockedOut ? (
          <Clock className="w-8 h-8 text-destructive" />
        ) : (
          <Lock className="w-8 h-8 text-primary" />
        )}
      </motion.div>

      <h2 className="font-display text-lg font-bold text-primary mb-2">
        {isLockedOut ? 'WALLET LOCKED' : 'UNLOCK WALLET'}
      </h2>
      <p className="text-xs text-muted-foreground mb-6">
        {isLockedOut 
          ? `Too many failed attempts. Try again in ${formatLockoutTime(remainingLockout)}`
          : 'Enter your 6-digit PIN'
        }
      </p>

      {/* PIN Dots */}
      <div className="flex gap-3 mb-8">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <motion.div
            key={index}
            animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              isLockedOut
                ? 'bg-muted opacity-50'
                : pin.length > index
                  ? error
                    ? 'bg-destructive shadow-[0_0_10px_hsl(0,85%,50%,0.6)]'
                    : 'bg-primary shadow-[0_0_10px_hsl(75,100%,55%,0.6)]'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && !isLockedOut && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-destructive text-xs mb-4"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Incorrect PIN. {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keypad */}
      <div className={`grid grid-cols-3 gap-3 w-full max-w-[240px] ${isLockedOut ? 'opacity-50 pointer-events-none' : ''}`}>
        {digits.map((digit, index) => (
          <div key={index} className="aspect-square">
            {digit === '' ? (
              <div />
            ) : digit === 'del' ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDelete}
                disabled={isLockedOut}
                className="w-full h-full rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                <Delete className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDigit(digit)}
                disabled={isLockedOut}
                className="w-full h-full rounded-full glass-card flex items-center justify-center text-xl font-display text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                {digit}
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Demo Mode Notice - removed non-functional recovery link */}
      <p className="mt-8 text-[10px] text-muted-foreground/60 text-center max-w-xs">
        Demo Mode: Data is stored locally in your browser session only.
      </p>
    </div>
  );
}
