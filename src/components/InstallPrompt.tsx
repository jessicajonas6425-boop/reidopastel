import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  Download, 
  Sparkles, 
  CornerRightDown 
} from 'lucide-react';

export default function InstallPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if the app is already running as a standalone installed application
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || // Standard
      (window.navigator as any).standalone === true;             // iOS Safari fallback

    setIsStandalone(isInStandaloneMode);

    // 2. Detect if the device is iOS (iPhone/iPad/iPod)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    // If already installed, don't trigger anything
    if (isInStandaloneMode) {
      return;
    }

    // 3. Listen for standard PWA prompt event (Chrome, Android, Edge, Opera)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has already dismissed this prompt in the last 24 hours
      const lastDismissed = localStorage.getItem('rei_do_pastel_prompt_dismissed_time');
      const now = Date.now();
      
      // If never dismissed or dismissed more than 24h ago, show the beautiful prompt
      if (!lastDismissed || (now - parseInt(lastDismissed, 10)) > 24 * 60 * 60 * 1000) {
        // Delay slightly for better perceived performance and user entry flow
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. iOS Fallback logic: Since iOS doesn't have the event above, 
    // we proactively show our manual shortcut guide on iOS mobile if they entered.
    if (isIOSDevice && !isInStandaloneMode) {
      const lastDismissed = localStorage.getItem('rei_do_pastel_prompt_dismissed_time');
      const now = Date.now();
      
      if (!lastDismissed || (now - parseInt(lastDismissed, 10)) > 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 4000); // Wait 4 seconds for iOS users to get acclimated
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Trigger native browser install dialog
    deferredPrompt.prompt();
    
    // Wait for the user choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA OS Prompt] User response outcome: ${outcome}`);
    
    // Clear deferred prompt so it is used only once
    setDeferredPrompt(null);
    setIsOpen(false);
  };

  const handleCancelClick = () => {
    // Save current time as dismissed timestamp to avoid bothering users immediately
    localStorage.setItem('rei_do_pastel_prompt_dismissed_time', Date.now().toString());
    setIsOpen(false);
  };

  // Do not show on wide desktops, only on mobile phones/tablets or when PWA prompts are active
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-xs sm:items-center">
          
          {/* Main prompt container animates on mobile up from bottom etc */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-brand-dark text-white rounded-2xl border-2 border-brand-yellow overflow-hidden shadow-2xl pb-6"
            id="pwa-install-prompt-card"
          >
            {/* Header branding band */}
            <div className="bg-gradient-to-r from-[#171515] to-[#262424] px-5 py-4 flex items-center justify-between border-b border-brand-yellow/15 relative">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-brand-yellow flex-shrink-0 flex items-center justify-center bg-zinc-900 shadow">
                  <img
                    src="https://i.postimg.cc/sXzSjhkh/702290933-3104997339685659-6402091820826444400-n.jpg"
                    alt="Logo Rei do Pastel"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="font-display font-black text-xs text-brand-yellow tracking-[2px] uppercase">Rei do Pastel</h4>
                  <p className="text-[10px] text-stone-300 font-bold uppercase tracking-wider">Aplicativo de Entrega Real</p>
                </div>
              </div>
              <button
                onClick={handleCancelClick}
                className="p-1 px-1.5 rounded-lg text-stone-405 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Fechar Notificação"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content area */}
            <div className="px-6 pt-5 pb-1 space-y-4">
              <div className="flex gap-3.5 items-start">
                <div className="bg-brand-yellow/10 p-2.5 rounded-xl border border-brand-yellow/20 text-brand-yellow shrink-0">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-sm uppercase tracking-wide text-white leading-snug">
                    Instale como Atalho no seu Celular! 📲
                  </h3>
                  <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                    Acesse nosso cardápio de pastéis imperiais instantaneamente direto da sua tela inicial, com apenas um toque, sem digitar o link!
                  </p>
                </div>
              </div>

              {/* Show normal install option for Android / Chromium */}
              {!isIOS ? (
                <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-800 text-[11px] text-stone-300 flex items-center gap-2">
                  <span className="text-xs">⭐️</span>
                  <span>Super leve, seguro e não gasta memória do seu aparelho!</span>
                </div>
              ) : (
                /* Beautiful custom iOS tutorial because Safari doesn't support automatic prompting */
                <div className="bg-neutral-900 border border-brand-yellow/10 p-4 rounded-xl space-y-3.5 relative">
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 text-[9px] uppercase font-bold text-brand-yellow tracking-wider px-1.5 py-0.5 bg-brand-yellow/10 border border-brand-yellow/20 rounded">
                    Manual iOS 🍎
                  </div>
                  
                  <p className="text-stone-300 text-xs font-bold uppercase tracking-wider border-b border-neutral-800 pb-1 flex items-center gap-1">
                    Como adicionar no iPhone:
                  </p>

                  <ul className="text-xs space-y-2.5 font-medium text-stone-200">
                    <li className="flex gap-2 items-start">
                      <span className="bg-brand-yellow text-brand-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Toque no botão de <b>Compartilhar</b> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> no menu do seu Safari (embaixo ou em cima).
                      </span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-brand-yellow text-brand-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Role a lista de ações para baixo até encontrar e clicar em: <b>Adicionar à Tela de Início</b> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                      </span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-brand-yellow text-brand-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Toque em <b>Adicionar</b> no canto superior direito para confirmar seu atalho real!
                      </span>
                    </li>
                  </ul>
                  
                  <div className="flex items-center justify-center gap-2 text-brand-yellow font-bold text-xs pt-1 animate-bounce">
                    <CornerRightDown size={14} /> Toque no Safari e siga estes passos!
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons footer */}
            <div className="px-6 pt-3 flex items-center justify-end gap-3 mt-1.5">
              <button
                onClick={handleCancelClick}
                className="px-4 py-2.5 rounded-xl text-stone-300 hover:text-white hover:bg-neutral-800 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Agora não
              </button>
              
              {!isIOS ? (
                /* PWA trigger installs */
                <button
                  onClick={deferredPrompt ? handleInstallClick : handleCancelClick}
                  className="bg-brand-red hover:bg-red-700 text-white font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-brand-red"
                >
                  <Download size={14} /> Adicionar Atalho 📱
                </button>
              ) : (
                /* iOS has manual steps, so "Entendido" is the best trigger */
                <button
                  onClick={handleCancelClick}
                  className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-brand-yellow"
                >
                  Entendido 👍
                </button>
              )}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
