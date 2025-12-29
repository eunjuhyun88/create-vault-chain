import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, Link2Off, Lock, Unlock, Radio, Wifi, WifiOff, 
  Scan, Shield, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { AIService } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { haptic } from '@/hooks/use-haptic';

export type SessionState = 'no_signal' | 'signal_detected' | 'connecting' | 'connected';

interface SessionHandshakeProps {
  onSessionEstablished?: () => void;
  compact?: boolean;
}

const AI_PLATFORMS = [
  { id: 'midjourney' as AIService, name: 'Midjourney', domain: 'midjourney.com' },
  { id: 'dalle' as AIService, name: 'DALL·E', domain: 'labs.openai.com' },
  { id: 'chatgpt' as AIService, name: 'ChatGPT', domain: 'chat.openai.com' },
  { id: 'stable' as AIService, name: 'Stable Diffusion', domain: 'stability.ai' },
  { id: 'runway' as AIService, name: 'Runway', domain: 'runway.ml' },
  { id: 'firefly' as AIService, name: 'Firefly', domain: 'firefly.adobe.com' },
  { id: 'sora' as AIService, name: 'Sora', domain: 'sora.com' },
  { id: 'veo' as AIService, name: 'Veo', domain: 'labs.google' },
];

export function SessionHandshake({ onSessionEstablished, compact = false }: SessionHandshakeProps) {
  const { session, startSession, endSession } = useWallet();
  const [sessionState, setSessionState] = useState<SessionState>('no_signal');
  const [detectedPlatform, setDetectedPlatform] = useState<typeof AI_PLATFORMS[0] | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [isGlitching, setIsGlitching] = useState(false);

  // Simulate AI platform detection
  useEffect(() => {
    if (session.isActive) {
      setSessionState('connected');
      const platform = AI_PLATFORMS.find(p => p.id === session.currentService);
      if (platform) setDetectedPlatform(platform);
      return;
    }

    const checkForPlatforms = () => {
      // Simulate random platform detection for demo
      const shouldDetect = Math.random() > 0.3;
      if (shouldDetect && sessionState === 'no_signal') {
        const randomPlatform = AI_PLATFORMS[Math.floor(Math.random() * AI_PLATFORMS.length)];
        setDetectedPlatform(randomPlatform);
        setSessionState('signal_detected');
        
        // Terminal animation
        setTerminalLines([]);
        const lines = [
          '> Scanning for AI platforms...',
          `> Checking TLS... OK`,
          `> Verifying Domain... ${randomPlatform.domain} DETECTED`,
          '> Session Ready for Lock'
        ];
        lines.forEach((line, i) => {
          setTimeout(() => {
            setTerminalLines(prev => [...prev, line]);
          }, i * 400);
        });
      }
    };

    const interval = setInterval(checkForPlatforms, 5000);
    // Initial check
    setTimeout(checkForPlatforms, 1000);
    
    return () => clearInterval(interval);
  }, [session.isActive, sessionState]);

  const handleConnect = async () => {
    if (!detectedPlatform) return;
    
    haptic.medium();
    setSessionState('connecting');
    setIsGlitching(true);

    // Glitch effect
    setTimeout(() => setIsGlitching(false), 500);

    // Lock animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    haptic.success();
    startSession(detectedPlatform.id);
    setSessionState('connected');
    onSessionEstablished?.();
  };

  const handleDisconnect = () => {
    haptic.light();
    endSession();
    setSessionState('no_signal');
    setDetectedPlatform(null);
    setTerminalLines([]);
  };

  // Demo: Manual signal trigger
  const triggerSignal = () => {
    if (sessionState !== 'no_signal') return;
    const randomPlatform = AI_PLATFORMS[Math.floor(Math.random() * AI_PLATFORMS.length)];
    setDetectedPlatform(randomPlatform);
    setSessionState('signal_detected');
    haptic.light();
    
    setTerminalLines([]);
    const lines = [
      '> Scanning for AI platforms...',
      `> Checking TLS... OK`,
      `> Verifying Domain... ${randomPlatform.domain} DETECTED`,
      '> Session Ready for Lock'
    ];
    lines.forEach((line, i) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, line]);
      }, i * 400);
    });
  };

  if (compact) {
    return (
      <motion.div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
          ${sessionState === 'connected' 
            ? 'bg-primary/10 border-primary/40 text-primary' 
            : sessionState === 'signal_detected'
            ? 'bg-primary/5 border-primary/20 text-primary/80'
            : 'bg-muted/30 border-border/40 text-muted-foreground'
          }
        `}
        onClick={sessionState === 'no_signal' ? triggerSignal : sessionState === 'signal_detected' ? handleConnect : undefined}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={sessionState === 'connected' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {sessionState === 'connected' ? (
            <Link2 className="w-4 h-4" />
          ) : sessionState === 'signal_detected' ? (
            <Radio className="w-4 h-4 animate-pulse" />
          ) : (
            <Link2Off className="w-4 h-4" />
          )}
        </motion.div>
        <span className="text-xs font-medium">
          {sessionState === 'connected' && detectedPlatform
            ? detectedPlatform.name 
            : sessionState === 'signal_detected'
            ? 'Signal Detected'
            : 'No Signal'
          }
        </span>
        {sessionState === 'connected' && (
          <motion.div 
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Signal Ring Indicator */}
      <div className="relative">
        <motion.div 
          className={`
            w-32 h-32 rounded-full border-4 flex items-center justify-center
            ${sessionState === 'no_signal' 
              ? 'border-destructive/50' 
              : sessionState === 'connecting'
              ? 'border-primary/50'
              : 'border-primary'
            }
          `}
          animate={
            sessionState === 'connecting' 
              ? { rotate: 360, borderColor: ['hsl(75 100% 55% / 0.5)', 'hsl(75 100% 55%)'] }
              : sessionState === 'signal_detected'
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={
            sessionState === 'connecting'
              ? { rotate: { duration: 1, repeat: Infinity, ease: 'linear' }, borderColor: { duration: 0.5, repeat: Infinity } }
              : { duration: 1, repeat: Infinity }
          }
          style={isGlitching ? { 
            filter: 'url(#glitch)', 
            animation: 'glitch-anim 100ms infinite'
          } : {}}
        >
          {/* Inner glow */}
          {sessionState !== 'no_signal' && (
            <motion.div 
              className="absolute inset-4 rounded-full bg-primary/10"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          
          {/* Icon */}
          <motion.div
            animate={sessionState === 'connecting' ? { scale: [1, 0.9, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {sessionState === 'no_signal' ? (
              <WifiOff className="w-12 h-12 text-destructive/70" />
            ) : sessionState === 'signal_detected' ? (
              <Unlock className="w-12 h-12 text-primary" />
            ) : sessionState === 'connecting' ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <Lock className="w-12 h-12 text-primary" />
            )}
          </motion.div>

          {/* Pulse rings for signal_detected */}
          {sessionState === 'signal_detected' && (
            <>
              <motion.div 
                className="absolute inset-0 rounded-full border border-primary/30"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full border border-primary/30"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </motion.div>

        {/* Status text below ring */}
        <motion.div 
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          key={sessionState}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={`
            text-sm font-display font-bold tracking-widest
            ${sessionState === 'no_signal' ? 'text-destructive' : 'text-primary'}
          `}>
            {sessionState === 'no_signal' && 'NO SIGNAL'}
            {sessionState === 'signal_detected' && 'SIGNAL DETECTED'}
            {sessionState === 'connecting' && 'LOCKING...'}
            {sessionState === 'connected' && 'CONNECTED'}
          </span>
        </motion.div>
      </div>

      {/* Detected Platform Badge */}
      <AnimatePresence mode="wait">
        {detectedPlatform && sessionState !== 'no_signal' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 px-4 py-2 glass-card rounded-full"
          >
            <ServiceBadge service={detectedPlatform.id} size="md" />
            <span className="text-sm text-foreground font-medium">{detectedPlatform.domain}</span>
            {sessionState === 'connected' && (
              <motion.div 
                className="flex items-center gap-1 text-primary"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Wifi className="w-4 h-4" />
                <span className="text-xs font-mono">LIVE</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Output */}
      <motion.div 
        className="w-full max-w-sm bg-background/80 border border-border/50 rounded-lg p-3 font-mono text-[11px] min-h-[100px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AnimatePresence mode="popLayout">
          {terminalLines.length === 0 ? (
            <motion.div 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-primary">{`>`}</span> Scanning for AI platforms...
              <motion.span 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >_</motion.span>
              <br />
              <span className="text-muted-foreground/60">{`>`} No active session detected</span>
              <br />
              <span className="text-muted-foreground/60">{`>`} Open Midjourney, ChatGPT, or Claude to begin</span>
            </motion.div>
          ) : (
            terminalLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={
                  line.includes('DETECTED') 
                    ? 'text-primary' 
                    : line.includes('OK')
                    ? 'text-success'
                    : 'text-muted-foreground'
                }
              >
                {line}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Button */}
      <AnimatePresence mode="wait">
        {sessionState === 'no_signal' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button 
              variant="outline" 
              size="lg"
              className="border-muted-foreground/30 text-muted-foreground cursor-not-allowed"
              disabled
            >
              <WifiOff className="w-4 h-4 mr-2" />
              WAITING FOR SIGNAL...
            </Button>
            <p className="text-xs text-muted-foreground/60 text-center mt-2">
              <button 
                onClick={triggerSignal}
                className="underline hover:text-primary transition-colors"
              >
                Demo: Simulate signal
              </button>
            </p>
          </motion.div>
        )}

        {sessionState === 'signal_detected' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button 
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 neon-glow"
              onClick={handleConnect}
            >
              <Lock className="w-4 h-4" />
              CONNECT SECURE SESSION
            </Button>
          </motion.div>
        )}

        {sessionState === 'connecting' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button 
              size="lg"
              disabled
              className="gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              ESTABLISHING SECURE CHANNEL...
            </Button>
          </motion.div>
        )}

        {sessionState === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Session Established</span>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Disconnect Session
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glitch SVG Filter */}
      <svg className="hidden">
        <defs>
          <filter id="glitch">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="original"
            />
            <feOffset in="original" dx="2" dy="0" result="red" />
            <feOffset in="original" dx="-2" dy="0" result="cyan" />
            <feBlend mode="screen" in="red" in2="cyan" />
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
}
