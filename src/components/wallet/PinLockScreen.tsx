import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Logo } from './Logo';

interface PinLockScreenProps {
  onUnlock: () => void;
}

export function PinLockScreen({ onUnlock }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { unlockWallet } = useWallet();

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError(false);
    }
  }, [pin.length]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      const attemptUnlock = async () => {
        const success = await unlockWallet(pin);
        if (success) {
          onUnlock();
        } else {
          setError(true);
          setAttempts(prev => prev + 1);
          setTimeout(() => {
            setPin('');
          }, 500);
        }
      };
      attemptUnlock();
    }
  }, [pin, unlockWallet, onUnlock]);

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
        className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6"
      >
        <Lock className="w-8 h-8 text-primary" />
      </motion.div>

      <h2 className="font-display text-lg font-bold text-primary mb-2">
        UNLOCK WALLET
      </h2>
      <p className="text-xs text-muted-foreground mb-6">
        Enter your 4-digit PIN
      </p>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              pin.length > index
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
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-destructive text-xs mb-4"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Incorrect PIN. {3 - attempts} attempts remaining.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {digits.map((digit, index) => (
          <div key={index} className="aspect-square">
            {digit === '' ? (
              <div />
            ) : digit === 'del' ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDelete}
                className="w-full h-full rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                <Delete className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDigit(digit)}
                className="w-full h-full rounded-full glass-card flex items-center justify-center text-xl font-display text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
              >
                {digit}
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Forgot PIN */}
      <button className="mt-8 text-xs text-muted-foreground hover:text-primary transition-colors">
        Forgot PIN? Use Recovery Key
      </button>
    </div>
  );
}
