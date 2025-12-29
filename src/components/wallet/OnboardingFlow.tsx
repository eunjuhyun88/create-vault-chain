import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { Input } from '@/components/ui/input';
import { Wallet, Key, Shield, Check, ArrowRight, Lock, X, Zap, Sparkles, Camera, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/hooks/use-haptic';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'features' | 'create-wallet' | 'seed-phrase' | 'confirm-phrase' | 'import-phrase' | 'set-pin' | 'complete';

// Extended BIP39-like word list (subset for demo - production should use full 2048 words)
const BIP39_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha',
  'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount',
  'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal',
  'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety',
  'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch',
  'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army',
  'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist',
  'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma',
  'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
  'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid',
  'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby',
  'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo',
  'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base', 'basic',
  'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef',
  'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench',
  'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid',
  'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade',
  'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom',
  'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil',
  'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow',
  'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand',
  'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright',
  'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown',
  'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk',
  'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business',
  'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus'
];

// Cryptographically secure seed phrase generation
const generateSeedPhrase = (): string[] => {
  const array = new Uint32Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, n => BIP39_WORDS[n % BIP39_WORDS.length]);
};

// Cryptographically secure shuffle using Fisher-Yates with crypto.getRandomValues
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  const randomValues = new Uint32Array(shuffled.length);
  crypto.getRandomValues(randomValues);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Feature highlights for onboarding
const features = [
  {
    icon: Camera,
    title: 'Capture AI Sessions',
    description: 'Scan and verify your generative AI creations instantly'
  },
  {
    icon: Sparkles,
    title: 'Mint as NFT',
    description: 'Turn your AI artwork into unique digital collectibles'
  },
  {
    icon: Gift,
    title: 'Earn Rewards',
    description: 'Get PIM tokens for participating in campaigns'
  }
];

// Progress indicator component
const StepIndicator = ({ currentStep, isQuickStart }: { currentStep: Step; isQuickStart: boolean }) => {
  const steps = isQuickStart 
    ? ['welcome', 'features', 'set-pin', 'complete']
    : ['welcome', 'features', 'create-wallet', 'seed-phrase', 'confirm-phrase', 'set-pin', 'complete'];
  
  const currentIndex = steps.indexOf(currentStep);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  
  if (currentStep === 'welcome' || currentStep === 'import-phrase') return null;
  
  return (
    <div className="absolute top-4 left-6 right-6 z-10">
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Step {currentIndex + 1} of {steps.length}
      </p>
    </div>
  );
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isImporting, setIsImporting] = useState(false);
  const [isQuickStart, setIsQuickStart] = useState(false);
  const [seedPhrase] = useState<string[]>(generateSeedPhrase);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [importedWords, setImportedWords] = useState<string[]>([]);
  const [availableImportWords, setAvailableImportWords] = useState<string[]>([]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [copied, setCopied] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const { toast } = useToast();

  // For confirm-phrase: verification indices (words 3, 6, 11)
  const verificationIndices = [2, 5, 10];
  const verificationWords = verificationIndices.map(i => seedPhrase[i]);

  useEffect(() => {
    // Shuffle words with some decoys for confirm step
    const decoyWords = ['hello', 'world', 'crypto', 'wallet', 'secure', 'block'];
    const allWords = [...verificationWords, ...decoyWords.slice(0, 6)];
    setShuffledWords(shuffleArray(allWords));
  }, [seedPhrase]);

  useEffect(() => {
    // For import step: generate shuffled pool of words
    const allBipWords = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
      'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
      'border', 'brain', 'brave', 'bread', 'bridge', 'bright', 'bring', 'broken'
    ];
    setAvailableImportWords(shuffleArray(allBipWords));
  }, []);

  // Auto-advance features carousel
  useEffect(() => {
    if (currentStep === 'features') {
      const interval = setInterval(() => {
        setFeatureIndex((prev) => (prev + 1) % features.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const handleCopySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase.join(' '));
    setCopied(true);
    toast({ 
      title: 'Copied!', 
      description: 'Clipboard will be cleared in 5 seconds for security.' 
    });
    setTimeout(() => setCopied(false), 2000);
    // Security: Clear clipboard after 5 seconds to minimize clipboard exposure
    setTimeout(() => {
      navigator.clipboard.writeText('').catch(() => {
        // Silently fail if clipboard access is denied
      });
    }, 5000);
  };

  const handleSelectWord = (word: string) => {
    if (selectedWords.length < 3 && !selectedWords.includes(word)) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleRemoveSelectedWord = (index: number) => {
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
  };

  const handleConfirmPhrase = () => {
    const isValid = selectedWords.every((word, i) => word === verificationWords[i]);
    if (isValid) {
      setCurrentStep('set-pin');
    } else {
      toast({ title: 'Oops!', description: 'That doesn\'t match. Try again!', variant: 'destructive' });
      setSelectedWords([]);
    }
  };

  const handleSelectImportWord = (word: string) => {
    if (importedWords.length < 12) {
      setImportedWords([...importedWords, word]);
      setAvailableImportWords(availableImportWords.filter(w => w !== word));
    }
  };

  const handleRemoveImportWord = (index: number) => {
    const word = importedWords[index];
    setImportedWords(importedWords.filter((_, i) => i !== index));
    setAvailableImportWords([word, ...availableImportWords]);
  };

  const handleImportConfirm = () => {
    if (importedWords.length === 12) {
      setCurrentStep('set-pin');
    } else {
      toast({ title: 'Almost there!', description: 'Please select all 12 words.', variant: 'destructive' });
    }
  };

  const handleSetPin = () => {
    if (pin.length < 6) {
      toast({ title: 'Too short!', description: 'PIN needs at least 6 digits for security.', variant: 'destructive' });
      return;
    }
    if (pin !== confirmPin) {
      toast({ title: 'PINs don\'t match', description: 'Make sure both PINs are the same.', variant: 'destructive' });
      return;
    }
    setCurrentStep('complete');
  };

  const handleQuickStart = () => {
    setIsQuickStart(true);
    setIsImporting(false);
    setCurrentStep('features');
  };

  const handleFullSetup = () => {
    setIsQuickStart(false);
    setIsImporting(false);
    setCurrentStep('features');
  };

  useEffect(() => {
    if (currentStep === 'complete') {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <motion.div key="welcome" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center h-full px-6 text-center relative">
            
            {/* Background Effects */}
            <div className="absolute inset-0 cyber-grid opacity-30" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            
            {/* Logo with enhanced glow */}
            <motion.div 
              className="mb-6 relative"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute inset-0 scale-150 bg-primary/20 rounded-full blur-[40px]" />
              <Logo size="xl" showText={false} />
            </motion.div>
            
            {/* Title */}
            <motion.h1 
              className="font-display text-3xl font-bold text-primary neon-text mb-2 relative z-10"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              PLAYARTS
            </motion.h1>
            
            <motion.p 
              className="text-base text-foreground/90 font-medium mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Passport (Wallet)
            </motion.p>
            
            <motion.p 
              className="text-muted-foreground text-sm mb-8 max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your creative identity for the AI generation. Capture, collect, and earn.
            </motion.p>
            
            <motion.div 
              className="space-y-3 w-full max-w-xs relative z-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* Quick Start - Primary */}
              <InteractiveButton 
                className="w-full h-14 text-sm font-display tracking-wider" 
                onClick={() => { haptic.medium(); handleQuickStart(); }}
                variant="cyber"
                size="xl"
                hapticFeedback="medium"
              >
                <Zap className="w-5 h-5 mr-3" />
                <div className="flex flex-col items-start">
                  <span className="text-sm">QUICK START</span>
                  <span className="text-[10px] opacity-80 font-normal font-mono">Get started in seconds</span>
                </div>
              </InteractiveButton>
              
              {/* Full Setup - Secondary */}
              <InteractiveButton 
                variant="outline" 
                className="w-full h-12 text-sm font-display tracking-wider"
                onClick={() => { haptic.light(); handleFullSetup(); }}
                hapticFeedback="light"
              >
                <Shield className="w-4 h-4 mr-2" />
                SECURE SETUP
              </InteractiveButton>
              
              {/* Import - Tertiary */}
              <InteractiveButton 
                variant="ghost" 
                className="w-full h-10 text-xs text-muted-foreground hover:text-primary"
                onClick={() => { haptic.selection(); setIsImporting(true); setCurrentStep('import-phrase'); }}
                hapticFeedback="light"
                glowOnHover={false}
              >
                <Key className="w-3 h-3 mr-2" />
                I already have a passport
              </InteractiveButton>
            </motion.div>
            
            <motion.p 
              className="text-[10px] text-muted-foreground/60 mt-8 max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </motion.p>
          </motion.div>
        );

      case 'features':
        return (
          <motion.div key="features" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 pt-16 pb-8 relative">
            <StepIndicator currentStep={currentStep} isQuickStart={isQuickStart} />
            
            {/* Background */}
            <div className="absolute inset-0 cyber-grid opacity-20" />
            
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featureIndex}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <motion.div 
                    className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center mx-auto mb-6 relative overflow-hidden"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    {/* Shimmer effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    
                    {(() => {
                      const Icon = features[featureIndex].icon;
                      return <Icon className="w-12 h-12 text-primary drop-shadow-[0_0_15px_hsl(75_100%_55%/0.6)]" />;
                    })()}
                  </motion.div>
                  <h2 className="font-display text-xl font-bold text-foreground mb-3 neon-text-subtle">
                    {features[featureIndex].title}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    {features[featureIndex].description}
                  </p>
                </motion.div>
              </AnimatePresence>
              
              {/* Feature dots */}
              <div className="flex gap-3 mt-10">
                {features.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setFeatureIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === featureIndex 
                        ? 'bg-primary w-8 shadow-[0_0_10px_hsl(75_100%_55%/0.6)]' 
                        : 'bg-muted/50 w-2 hover:bg-muted'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
            
            <Button 
              className="w-full h-12 text-sm font-display tracking-wider relative overflow-hidden group" 
              onClick={() => setCurrentStep(isQuickStart ? 'set-pin' : 'create-wallet')}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <span className="relative z-10">LET'S GO</span>
              <ArrowRight className="w-4 h-4 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        );

      case 'create-wallet':
        return (
          <motion.div key="create-wallet" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 pt-16 pb-8">
            <StepIndicator currentStep={currentStep} isQuickStart={isQuickStart} />
            
            <div className="text-center mb-6 mt-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-primary mb-2">BACKUP TIME</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                We'll create a recovery phrase. This is the only way to restore your passport if you lose access.
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <motion.div className="w-32 h-32 rounded-full border-2 border-primary/30" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                <motion.div className="absolute inset-4 rounded-full border-2 border-primary/50" animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                <motion.div className="absolute inset-8 rounded-full bg-primary/20 flex items-center justify-center" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Key className="w-8 h-8 text-primary" />
                </motion.div>
              </div>
            </div>
            <Button className="w-full h-12 text-sm font-display tracking-wider" onClick={() => setCurrentStep('seed-phrase')}>
              GENERATE PHRASE <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'seed-phrase':
        return (
          <motion.div key="seed-phrase" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 pt-16 pb-6">
            <StepIndicator currentStep={currentStep} isQuickStart={isQuickStart} />
            
            <div className="text-center mb-4 mt-4">
              <h2 className="font-display text-lg font-bold text-primary mb-1">YOUR SECRET PHRASE</h2>
              <p className="text-[10px] text-muted-foreground">Write these down and keep them somewhere safe!</p>
            </div>
            
            {/* Demo Mode Warning */}
            <div className="glass-card p-2 mb-3 border-amber-500/30 bg-amber-500/5">
              <p className="text-[10px] text-amber-500 text-center">
                ⚠️ Demo Mode: This seed phrase is for UI preview only and does not enable actual wallet recovery.
              </p>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {seedPhrase.map((word, index) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                    className="glass-card p-2 text-center">
                    <span className="text-[10px] text-muted-foreground">{index + 1}.</span>
                    <span className="text-xs text-foreground ml-1 font-mono">{word}</span>
                  </motion.div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mb-4 border-primary/30" onClick={handleCopySeedPhrase}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : null}{copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <div className="glass-card p-3 border-warning/30 bg-warning/5">
                <p className="text-[10px] text-warning">⚠️ Never share this phrase! Anyone with it can access your passport.</p>
              </div>
            </div>
            <Button className="w-full h-12 text-sm font-display tracking-wider mt-4" onClick={() => setCurrentStep('confirm-phrase')}>
              I'VE SAVED IT <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'confirm-phrase':
        return (
          <motion.div key="confirm-phrase" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 pt-16 pb-6">
            <StepIndicator currentStep={currentStep} isQuickStart={isQuickStart} />
            
            <div className="text-center mb-4 mt-4">
              <h2 className="font-display text-lg font-bold text-primary mb-1">QUICK CHECK</h2>
              <p className="text-xs text-muted-foreground">
                Tap words #{verificationIndices[0] + 1}, #{verificationIndices[1] + 1}, #{verificationIndices[2] + 1} to make sure you've got it!
              </p>
            </div>

            {/* Selected Words Display */}
            <div className="flex gap-2 mb-4 min-h-[44px]">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`flex-1 h-10 rounded-lg border-2 border-dashed flex items-center justify-center text-xs font-mono
                  ${selectedWords[i] ? 'border-primary bg-primary/10 text-primary' : 'border-muted text-muted-foreground'}`}>
                  {selectedWords[i] ? (
                    <button onClick={() => handleRemoveSelectedWord(i)} className="flex items-center gap-1 hover:text-destructive">
                      {selectedWords[i]} <X className="w-3 h-3" />
                    </button>
                  ) : `Word ${verificationIndices[i] + 1}`}
                </div>
              ))}
            </div>

            {/* Word Chips to Click */}
            <div className="flex-1 overflow-auto">
              <div className="flex flex-wrap gap-2">
                {shuffledWords.map((word, index) => {
                  const isSelected = selectedWords.includes(word);
                  return (
                    <motion.button key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03 }}
                      onClick={() => !isSelected && handleSelectWord(word)} disabled={isSelected}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono transition-all
                        ${isSelected ? 'border-muted/30 bg-muted/20 text-muted-foreground cursor-not-allowed' : 'border-primary/40 bg-card hover:bg-primary/10 hover:border-primary text-foreground cursor-pointer'}`}>
                      {word}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Button className="w-full h-12 text-sm font-display tracking-wider mt-4" onClick={handleConfirmPhrase} disabled={selectedWords.length < 3}>
              VERIFY <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'import-phrase':
        return (
          <motion.div key="import-phrase" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-6">
            <div className="text-center mb-4">
              <h2 className="font-display text-lg font-bold text-primary mb-1">WELCOME BACK</h2>
              <p className="text-xs text-muted-foreground">Tap your 12 secret words in order.</p>
            </div>

            {/* Selected Words Grid */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`h-8 rounded border flex items-center justify-center text-[10px] font-mono
                  ${importedWords[i] ? 'border-primary bg-primary/10 text-primary' : 'border-muted/40 border-dashed text-muted-foreground'}`}>
                  {importedWords[i] ? (
                    <button onClick={() => handleRemoveImportWord(i)} className="flex items-center gap-0.5 hover:text-destructive px-1">
                      <span className="truncate">{importedWords[i]}</span>
                      <X className="w-2.5 h-2.5 flex-shrink-0" />
                    </button>
                  ) : (i + 1)}
                </div>
              ))}
            </div>

            {/* Available Words */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <div className="flex flex-wrap gap-1.5">
                {availableImportWords.map((word, index) => (
                  <motion.button key={word} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.01 }}
                    onClick={() => handleSelectImportWord(word)}
                    className="px-2.5 py-1.5 rounded border border-primary/30 bg-card hover:bg-primary/10 hover:border-primary text-[10px] font-mono text-foreground transition-all">
                    {word}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 h-10 border-primary/30" onClick={() => setCurrentStep('welcome')}>Back</Button>
              <Button className="flex-1 h-10 font-display tracking-wider" onClick={handleImportConfirm} disabled={importedWords.length < 12}>
                IMPORT ({importedWords.length}/12)
              </Button>
            </div>
          </motion.div>
        );

      case 'set-pin':
        return (
          <motion.div key="set-pin" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 pt-16 pb-6">
            <StepIndicator currentStep={currentStep} isQuickStart={isQuickStart} />
            
            <div className="text-center mb-6 mt-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-primary mb-1">SET YOUR PIN</h2>
              <p className="text-xs text-muted-foreground">Create a PIN for quick access to your passport.</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">You can set this up later in settings.</p>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Enter PIN (min 6 digits)</label>
                <Input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="bg-input border-primary/30 text-foreground text-center text-2xl tracking-[0.5em]" maxLength={8} placeholder="••••••" />
              </div>
              {pin.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label className="text-xs text-muted-foreground">Confirm PIN</label>
                  <Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="bg-input border-primary/30 text-foreground text-center text-2xl tracking-[0.5em]" maxLength={8} placeholder="••••••" />
                </motion.div>
              )}
            </div>
            <div className="space-y-2">
              <Button className="w-full h-12 text-sm font-display tracking-wider" onClick={handleSetPin} disabled={pin.length > 0 && (pin.length < 6 || pin !== confirmPin)}>
                {isQuickStart ? 'CREATE PASSPORT' : isImporting ? 'IMPORT PASSPORT' : 'CREATE PASSPORT'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {pin.length === 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full h-10 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setCurrentStep('complete')}
                >
                  Skip for now
                </Button>
              )}
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full px-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mb-6">
              <Check className="w-12 h-12 text-success" />
            </motion.div>
            <h2 className="font-display text-xl font-bold text-primary neon-text mb-2">
              YOU'RE ALL SET!
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">
              Your PlayArts Passport is ready. Time to start creating!
            </p>
            <motion.div className="text-xs text-primary/60" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
              Setting things up...
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="h-full bg-background overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
    </div>
  );
}
