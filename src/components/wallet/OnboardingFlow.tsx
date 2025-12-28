import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Key, Shield, Copy, Check, ArrowRight, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  'welcome',
  'create-wallet',
  'seed-phrase',
  'confirm-phrase',
  'set-pin',
  'complete'
] as const;

type Step = typeof steps[number];

// Generate random seed phrase
const generateSeedPhrase = (): string[] => {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
    'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
    'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
    'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album'
  ];
  return Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)]);
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [seedPhrase] = useState<string[]>(generateSeedPhrase);
  const [confirmWords, setConfirmWords] = useState<string[]>(['', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const verificationIndices = [2, 5, 10]; // Words 3, 6, 11

  const handleCopySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase.join(' '));
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'Store your seed phrase securely offline.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPhrase = () => {
    const isValid = verificationIndices.every(
      (idx, i) => confirmWords[i].toLowerCase().trim() === seedPhrase[idx]
    );
    if (isValid) {
      setCurrentStep('set-pin');
    } else {
      toast({
        title: 'Verification failed',
        description: 'Please check your seed phrase words.',
        variant: 'destructive',
      });
    }
  };

  const handleSetPin = () => {
    if (pin.length < 4) {
      toast({
        title: 'PIN too short',
        description: 'PIN must be at least 4 digits.',
        variant: 'destructive',
      });
      return;
    }
    if (pin !== confirmPin) {
      toast({
        title: 'PIN mismatch',
        description: 'PINs do not match.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep('complete');
  };

  useEffect(() => {
    if (currentStep === 'complete') {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center h-full px-6 text-center"
          >
            <div className="mb-8">
              <Logo size="xl" showText={false} />
            </div>
            
            <h1 className="font-display text-2xl font-bold text-primary neon-text mb-2">
              PLAYARTS WALLET
            </h1>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs">
              Your AI Creation Passport. Capture, verify, and materialize your generative AI sessions.
            </p>

            <div className="space-y-3 w-full max-w-xs">
              <Button 
                className="w-full h-12 text-sm font-display tracking-wider"
                onClick={() => setCurrentStep('create-wallet')}
              >
                <Wallet className="w-4 h-4 mr-2" />
                CREATE NEW PASSPORT
              </Button>
              
              <Button 
                variant="outline"
                className="w-full h-12 text-sm font-display tracking-wider border-primary/40"
                onClick={() => setCurrentStep('create-wallet')}
              >
                <Key className="w-4 h-4 mr-2" />
                IMPORT EXISTING
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground mt-8 max-w-xs">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        );

      case 'create-wallet':
        return (
          <motion.div
            key="create-wallet"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-8"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-primary mb-2">
                SECURE BACKUP
              </h2>
              <p className="text-xs text-muted-foreground">
                Your seed phrase is the only way to recover your wallet.
              </p>
            </div>

            {/* Animated Wallet Creation */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <motion.div
                  className="w-32 h-32 rounded-full border-2 border-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-primary/50"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-8 rounded-full bg-primary/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Key className="w-8 h-8 text-primary" />
                </motion.div>
              </div>
            </div>

            <Button
              className="w-full h-12 text-sm font-display tracking-wider"
              onClick={() => setCurrentStep('seed-phrase')}
            >
              GENERATE SEED PHRASE
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'seed-phrase':
        return (
          <motion.div
            key="seed-phrase"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-6"
          >
            <div className="text-center mb-4">
              <h2 className="font-display text-lg font-bold text-primary mb-1">
                YOUR SEED PHRASE
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Write these words down in order and store them securely offline.
              </p>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {seedPhrase.map((word, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-2 text-center"
                  >
                    <span className="text-[10px] text-muted-foreground">{index + 1}.</span>
                    <span className="text-xs text-foreground ml-1 font-mono">{word}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mb-4 border-primary/30"
                onClick={handleCopySeedPhrase}
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>

              <div className="glass-card p-3 border-warning/30 bg-warning/5">
                <p className="text-[10px] text-warning">
                  ⚠️ Never share your seed phrase. Anyone with it can access your wallet.
                </p>
              </div>
            </div>

            <Button
              className="w-full h-12 text-sm font-display tracking-wider mt-4"
              onClick={() => setCurrentStep('confirm-phrase')}
            >
              I'VE SAVED IT
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'confirm-phrase':
        return (
          <motion.div
            key="confirm-phrase"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-6"
          >
            <div className="text-center mb-6">
              <h2 className="font-display text-lg font-bold text-primary mb-1">
                VERIFY YOUR BACKUP
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter the requested words to confirm you've saved your phrase.
              </p>
            </div>

            <div className="flex-1 space-y-4">
              {verificationIndices.map((wordIndex, i) => (
                <div key={wordIndex} className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Word #{wordIndex + 1}
                  </label>
                  <Input
                    type="text"
                    value={confirmWords[i]}
                    onChange={(e) => {
                      const newWords = [...confirmWords];
                      newWords[i] = e.target.value;
                      setConfirmWords(newWords);
                    }}
                    className="bg-input border-primary/30 text-foreground"
                    placeholder={`Enter word ${wordIndex + 1}`}
                  />
                </div>
              ))}
            </div>

            <Button
              className="w-full h-12 text-sm font-display tracking-wider"
              onClick={handleConfirmPhrase}
            >
              VERIFY
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'set-pin':
        return (
          <motion.div
            key="set-pin"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-primary mb-1">
                SET YOUR PIN
              </h2>
              <p className="text-xs text-muted-foreground">
                Create a PIN to quickly unlock your wallet.
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Enter PIN</label>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-input border-primary/30 text-foreground text-center text-2xl tracking-[1em]"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Confirm PIN</label>
                <Input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-input border-primary/30 text-foreground text-center text-2xl tracking-[1em]"
                  maxLength={6}
                />
              </div>
            </div>

            <Button
              className="w-full h-12 text-sm font-display tracking-wider"
              onClick={handleSetPin}
            >
              CREATE WALLET
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mb-6"
            >
              <Check className="w-12 h-12 text-success" />
            </motion.div>

            <h2 className="font-display text-xl font-bold text-primary neon-text mb-2">
              WALLET CREATED
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Your PlayArts Passport is ready. Start capturing your AI creations.
            </p>

            <motion.div
              className="text-xs text-primary/60"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Initializing wallet...
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="h-full bg-background overflow-hidden relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      {/* Progress Dots */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {steps.slice(1, -1).map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-all ${
                steps.indexOf(currentStep) > index
                  ? 'bg-primary'
                  : steps.indexOf(currentStep) === index + 1
                  ? 'bg-primary animate-pulse'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
