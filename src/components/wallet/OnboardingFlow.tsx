import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Key, Shield, Check, ArrowRight, Lock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'create-wallet' | 'seed-phrase' | 'confirm-phrase' | 'import-phrase' | 'set-pin' | 'complete';

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

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isImporting, setIsImporting] = useState(false);
  const [seedPhrase] = useState<string[]>(generateSeedPhrase);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [importedWords, setImportedWords] = useState<string[]>([]);
  const [availableImportWords, setAvailableImportWords] = useState<string[]>([]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [copied, setCopied] = useState(false);
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

  const handleCopySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase.join(' '));
    setCopied(true);
    toast({ title: 'Copied to clipboard', description: 'Store your seed phrase securely offline.' });
    setTimeout(() => setCopied(false), 2000);
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
      toast({ title: 'Verification failed', description: 'Please select the correct words in order.', variant: 'destructive' });
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
      toast({ title: 'Incomplete phrase', description: 'Please select all 12 words.', variant: 'destructive' });
    }
  };

  const handleSetPin = () => {
    if (pin.length < 4) {
      toast({ title: 'PIN too short', description: 'PIN must be at least 4 digits.', variant: 'destructive' });
      return;
    }
    if (pin !== confirmPin) {
      toast({ title: 'PIN mismatch', description: 'PINs do not match.', variant: 'destructive' });
      return;
    }
    setCurrentStep('complete');
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
          <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="mb-8"><Logo size="xl" showText={false} /></div>
            <h1 className="font-display text-2xl font-bold text-primary neon-text mb-2">PLAYARTS WALLET</h1>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs">
              Your AI Creation Passport. Capture, verify, and materialize your generative AI sessions.
            </p>
            <div className="space-y-3 w-full max-w-xs">
              <Button className="w-full h-12 text-sm font-display tracking-wider" onClick={() => { setIsImporting(false); setCurrentStep('create-wallet'); }}>
                <Wallet className="w-4 h-4 mr-2" />CREATE NEW PASSPORT
              </Button>
              <Button variant="outline" className="w-full h-12 text-sm font-display tracking-wider border-primary/40"
                onClick={() => { setIsImporting(true); setCurrentStep('import-phrase'); }}>
                <Key className="w-4 h-4 mr-2" />IMPORT EXISTING
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-8 max-w-xs">By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </motion.div>
        );

      case 'create-wallet':
        return (
          <motion.div key="create-wallet" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-primary mb-2">SECURE BACKUP</h2>
              <p className="text-xs text-muted-foreground">Your seed phrase is the only way to recover your wallet.</p>
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
              GENERATE SEED PHRASE<ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'seed-phrase':
        return (
          <motion.div key="seed-phrase" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-6">
            <div className="text-center mb-4">
              <h2 className="font-display text-lg font-bold text-primary mb-1">YOUR SEED PHRASE</h2>
              <p className="text-[10px] text-muted-foreground">Write these words down in order and store them securely offline.</p>
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
                <p className="text-[10px] text-warning">⚠️ Never share your seed phrase. Anyone with it can access your wallet.</p>
              </div>
            </div>
            <Button className="w-full h-12 text-sm font-display tracking-wider mt-4" onClick={() => setCurrentStep('confirm-phrase')}>
              I'VE SAVED IT<ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'confirm-phrase':
        return (
          <motion.div key="confirm-phrase" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-6">
            <div className="text-center mb-4">
              <h2 className="font-display text-lg font-bold text-primary mb-1">VERIFY YOUR BACKUP</h2>
              <p className="text-xs text-muted-foreground">
                Tap words #{verificationIndices[0] + 1}, #{verificationIndices[1] + 1}, #{verificationIndices[2] + 1} in order.
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
              VERIFY<ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'import-phrase':
        return (
          <motion.div key="import-phrase" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-6 py-6">
            <div className="text-center mb-4">
              <h2 className="font-display text-lg font-bold text-primary mb-1">IMPORT WALLET</h2>
              <p className="text-xs text-muted-foreground">Tap your 12-word seed phrase in order.</p>
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
            className="flex flex-col h-full px-6 py-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-primary mb-1">SET YOUR PIN</h2>
              <p className="text-xs text-muted-foreground">Create a PIN to quickly unlock your wallet.</p>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Enter PIN</label>
                <Input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-input border-primary/30 text-foreground text-center text-2xl tracking-[1em]" maxLength={6} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Confirm PIN</label>
                <Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-input border-primary/30 text-foreground text-center text-2xl tracking-[1em]" maxLength={6} />
              </div>
            </div>
            <Button className="w-full h-12 text-sm font-display tracking-wider" onClick={handleSetPin}>
              {isImporting ? 'IMPORT WALLET' : 'CREATE WALLET'}<ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
              {isImporting ? 'WALLET IMPORTED' : 'WALLET CREATED'}
            </h2>
            <p className="text-sm text-muted-foreground mb-8">Your PlayArts Passport is ready. Start capturing your AI creations.</p>
            <motion.div className="text-xs text-primary/60" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
              Initializing wallet...
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
