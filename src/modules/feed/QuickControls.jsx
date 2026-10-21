import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Leaf, Palette, Minus, Plus, ShieldAlert, CircleDot, Droplet, Zap, Hexagon } from 'lucide-react';
import { triggerHaptic, secureLocalStoreWrite } from '../../core/hardwareBridge.js'; 
import { SlideToSync } from './SlideToSync.jsx';

export function QuickControls({ density, setDensity, theme, setTheme, userRole, toggleCommandMode, commandModeActive, currentScreen }) {
    
    const isDark = theme.startsWith('dark-');

    const handleDensityChange = (newDensity) => {
        if (newDensity >= 1 && newDensity <= 5) {
            setDensity(newDensity);
            document.documentElement.style.setProperty('--app-scale', 0.85 + (newDensity * 0.05));
            triggerHaptic('light').catch(() => {});
            secureLocalStoreWrite('app_density', newDensity).catch(() => {}); 
        }
    };

    const handleThemeChange = (newTheme) => {
        if (theme === newTheme) return;
        setTheme(newTheme);
        triggerHaptic('medium').catch(() => {});
        secureLocalStoreWrite('app_theme', newTheme).catch(() => {}); 
    };

    const toggleDayNight = (toDark) => {
        if (toDark && !isDark) handleThemeChange('dark-amoled');
        else if (!toDark && isDark) handleThemeChange('light-pure');
    };

    const lightThemes = [
        { id: 'light-pure', icon: CircleDot, label: 'Pure' },
        { id: 'light-vanilla', icon: Sun, label: 'Cream' },
        { id: 'light-matcha', icon: Leaf, label: 'Matcha' },
        { id: 'light-terra', icon: Palette, label: 'Terra' }
    ];

    const darkThemes = [
        { id: 'dark-amoled', icon: Moon, label: 'AMOLED' },
        { id: 'dark-ocean', icon: Droplet, label: 'Ocean' },
        { id: 'dark-cyber', icon: Zap, label: 'Cyber' },
        { id: 'dark-midnight', icon: Hexagon, label: 'Midnight' }
    ];

    const activeSubThemes = isDark ? darkThemes : lightThemes;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-20 right-4 w-64 bg-surface rounded-2xl p-4 z-[70] origin-top-right border border-glass-border shadow-expressive"
        >
            {/* --- 1. ADMIN COMMAND MODE (ONLY VISIBLE ON GLOBAL FEED) --- */}
            {userRole >= 2 && currentScreen === 'feed' && (
                <div className="mb-4 pb-4 border-b border-glass-border/50">
                    <button 
                        onClick={toggleCommandMode} 
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all active:scale-95 shadow-sm ${
                            commandModeActive 
                            ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/30' 
                            : 'bg-surface-elevated text-content border-glass-border hover:brightness-95'
                        }`}
                    >
                        <ShieldAlert size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {commandModeActive ? 'Exit Edit / Delete' : 'Edit / Delete Mode'}
                        </span>
                    </button>
                </div>
            )}

            {/* --- 2. WORKSPACE SCALE --- */}
            <div className="mb-5">
                <h4 className="text-[10px] font-bold text-content-muted uppercase tracking-widest mb-2">Workspace Scale</h4>
                <div className="flex items-center justify-between bg-surface-elevated rounded-full p-1 border border-glass-border shadow-inner">
                    <button onClick={() => handleDensityChange(density - 1)} className="p-1.5 text-content-muted active:text-content transition-colors">
                        <Minus size={14} />
                    </button>
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(step => (
                            <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${step <= density ? 'bg-brand-primary w-4' : 'bg-content-muted/30 w-1.5'}`} />
                        ))}
                    </div>
                    <button onClick={() => handleDensityChange(density + 1)} className="p-1.5 text-content-muted active:text-content transition-colors">
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* --- 3. ENVIRONMENT & THEMES --- */}
            <div>
                <div className="flex justify-between items-end mb-3">
                    <h4 className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Environment</h4>
                    
                    <div className="flex bg-surface-elevated border border-glass-border rounded-lg p-0.5 shadow-inner">
                        <button onClick={() => toggleDayNight(false)} className={`p-1.5 rounded-md transition-colors ${!isDark ? 'bg-surface text-brand-primary shadow-sm' : 'text-content-muted hover:text-content'}`}>
                            <Sun size={16} />
                        </button>
                        <button onClick={() => toggleDayNight(true)} className={`p-1.5 rounded-md transition-colors ${isDark ? 'bg-surface text-brand-primary shadow-sm' : 'text-content-muted hover:text-content'}`}>
                            <Moon size={16} />
                        </button>
                    </div>
                </div>
                
                <div className="flex overflow-x-auto gap-2 pb-2 snap-x hide-scrollbar -mx-2 px-2">
                    {activeSubThemes.map(t => (
                        <button 
                            key={t.id}
                            onClick={() => handleThemeChange(t.id)} 
                            className={`flex flex-col items-center justify-center min-w-[56px] py-2 rounded-xl border transition-all active:scale-95 snap-start ${
                                theme === t.id 
                                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-sm' 
                                : 'bg-surface-elevated border-glass-border text-content-muted hover:text-content'
                            }`}
                        >
                            <t.icon size={16} className="mb-2" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- 4. CLOUD SYNC SLIDER --- */}
            <div className="w-full pt-4 mt-2 border-t border-glass-border/50">
                <SlideToSync 
                  onSyncAction={() => {
                    console.log("Slider triggered! Supabase sync will happen here.");
                  }}
                />
            </div>
            
        </motion.div>
    );
}