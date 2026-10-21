import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, RotateCcw, ChevronDown, Palette, Vibrate, Check, BookOpen, Bell, Sliders, Moon } from 'lucide-react';
import { triggerHaptic, secureLocalStoreClear, secureLocalStoreWrite, secureLocalStoreRead, setGlobalHaptics } from '../../core/hardwareBridge.js';
import { exportVaultData, saveVaultTask } from '../../core/vaultEngine.js';
import { IdentityCard } from './IdentityCard.jsx';
import { SupportSheet } from './SupportSheet.jsx';

const THEME_OPTIONS = [
  'light-pure', 'light-vanilla', 'light-matcha', 'light-terra', 
  'dark-amoled', 'dark-ocean', 'dark-cyber', 'dark-midnight'
];

const ACCENT_PALETTE = [
  { id: 'emerald', hex: '#10b981' }, 
  { id: 'sapphire', hex: '#2563eb' }, 
  { id: 'violet', hex: '#a855f7' },   
  { id: 'crimson', hex: '#f43f5e' },  
  { id: 'amber', hex: '#f59e0b' },    
  { id: 'coral', hex: '#ff6b4a' },    
  { id: 'cyan', hex: '#06b6d4' },     
  { id: 'indigo', hex: '#6366f1' },   
  { id: 'fuchsia', hex: '#d946ef' },  
  { id: 'lime', hex: '#84cc16' },     
  { id: 'sky', hex: '#38bdf8' },      
  { id: 'adaptive', hex: 'var(--theme-text-main)' } 
];

export function SettingsView({ userRole, theme, setTheme, density, setDensity, tasks }) {
  // A SINGLE state controls all accordions perfectly across both cards
  const [expandedSection, setExpandedSection] = useState(null); 
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const [activeAccent, setActiveAccent] = useState('emerald'); 
  const fileInputRef = useRef(null);
  
  // --- VAULT GATEKEEPER LISTENER ---
  useEffect(() => {
    const handleOpenProfile = () => setExpandedSection('profile');
    window.addEventListener('open-identity-sheet', handleOpenProfile);
    return () => window.removeEventListener('open-identity-sheet', handleOpenProfile);
  }, []);

  useEffect(() => {
    const loadPrefs = async () => {
      const savedHaptic = await secureLocalStoreRead('haptics_enabled');
      if (savedHaptic !== null) {
        const isEnabled = savedHaptic === true || savedHaptic === 'true';
        setHapticsEnabled(isEnabled);
        setGlobalHaptics(isEnabled);
      }
      
      const savedAccentId = await secureLocalStoreRead('app_accent');
      if (savedAccentId) {
        const found = ACCENT_PALETTE.find(a => a.id === savedAccentId);
        if (found) {
          setActiveAccent(found.id);
          document.documentElement.style.setProperty('--app-accent', found.hex);
        }
      }
    };
    loadPrefs();
  }, []);

  const handleAccordion = async (section) => {
    await triggerHaptic('light');
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const handleOpenSupport = async (section) => {
    await handleAccordion(section);
    // Wait 150ms for the CSS grid expansion to begin, then scroll
    setTimeout(() => {
      const element = document.getElementById(`${section}-section`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150); 
  };
  
  const handleThemeChange = async (t) => {
    await triggerHaptic('light');
    setTheme(t);
    await secureLocalStoreWrite('app_theme', t);
  };

  const handleAccentChange = async (accent) => {
    await triggerHaptic('light');
    setActiveAccent(accent.id);
    document.documentElement.style.setProperty('--app-accent', accent.hex);
    await secureLocalStoreWrite('app_accent', accent.id);
  };

  const toggleHaptics = async () => {
    const newState = !hapticsEnabled;
    setHapticsEnabled(newState);
    setGlobalHaptics(newState); 
    await secureLocalStoreWrite('haptics_enabled', newState);
    if (newState) await triggerHaptic('success');
  };

  const handleExport = async () => {
    await triggerHaptic('medium');
    try { await exportVaultData(tasks); } 
    catch (err) { console.error("Export failed", err); }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedTasks = JSON.parse(e.target.result);
        if (Array.isArray(importedTasks)) {
          for (const task of importedTasks) await saveVaultTask(task);
          await triggerHaptic('success');
          alert('Data imported successfully. Please restart the app.');
          window.location.reload();
        }
      } catch (err) {
        await triggerHaptic('error');
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = async () => {
    await triggerHaptic('heavy');
    try {
      await secureLocalStoreClear();
      window.location.reload(); 
    } catch (err) { console.error("Reset failed", err); }
  };

  const formatThemeName = (themeString) => {
    const parts = themeString.split('-');
    return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  };

  return (
    <div className="w-full h-full flex flex-col pt-6 px-4 relative overflow-y-auto pb-32 hide-scrollbar">

      <div className="space-y-6">
        
                {/* --- TIER 1: IDENTITY & CLOUD ACCESS --- */}
        <IdentityCard 
            userRole={userRole} 
            expandedSection={expandedSection} 
            handleAccordion={handleAccordion} 
            onOpenSupport={handleOpenSupport} /* <-- Point this to the new scroll function */
        />

        {/* --- TIER 2: WORKSPACE PREFERENCES --- */}
        <div className="bg-surface-elevated border border-glass-border rounded-[20px] p-5 shadow-sm space-y-6">
          <h3 className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Workspace Preferences</h3>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-content">
              <Moon size={16} className="text-content-muted" />
              <span className="text-sm font-semibold">Architecture Theme</span>
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 w-full snap-x">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t} onClick={() => handleThemeChange(t)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex-shrink-0 snap-start ${theme === t ? 'bg-brand-primary text-app-base shadow-md scale-105' : 'bg-surface border border-glass-border text-content-muted hover:text-content'}`}
                >
                  {formatThemeName(t)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center gap-2 text-content">
              <Palette size={16} className="text-content-muted" />
              <span className="text-sm font-semibold">Accent Palette</span>
            </div>
            
            <div className="grid grid-cols-6 gap-2.5">
              {ACCENT_PALETTE.map((accent) => {
                const isActive = activeAccent === accent.id;
                const isAdaptive = accent.id === 'adaptive';
                
                return (
                  <button
                    key={accent.id}
                    onClick={() => handleAccentChange(accent)}
                    className={`relative w-full aspect-square rounded-full flex items-center justify-center transition-all ${
                      isActive ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface ring-content shadow-sm' : 'hover:scale-105 opacity-90'
                    }`}
                    style={{ 
                      background: isAdaptive ? 'linear-gradient(135deg, #1A1C1E 50%, #F8F9FA 50%)' : accent.hex,
                      border: isAdaptive ? '1px solid var(--theme-border-glass)' : 'none'
                    }}
                  >
                    {isActive && (
                      <Check size={14} className={isAdaptive ? 'text-brand-danger mix-blend-difference' : 'text-white'} strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-content">
              <Sliders size={16} className="text-content-muted" />
              <span className="text-sm font-semibold">Display Scale</span>
            </div>
            <div className="flex items-center gap-3 bg-surface p-1 rounded-xl border border-glass-border">
              <button onClick={async () => { await triggerHaptic('light'); setDensity(Math.max(1, density - 1)); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-content-muted hover:text-content bg-surface-elevated active:scale-95 transition-all">-</button>
              <span className="text-xs font-mono font-bold w-10 text-center text-brand-primary">Lvl {density}</span>
              <button onClick={async () => { await triggerHaptic('light'); setDensity(Math.min(5, density + 1)); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-content-muted hover:text-content bg-surface-elevated active:scale-95 transition-all">+</button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-content">
              <Vibrate size={16} className="text-content-muted" />
              <span className="text-sm font-semibold">Haptics</span>
            </div>
            <button 
              onClick={toggleHaptics} 
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-out focus:outline-none ${hapticsEnabled ? 'bg-brand-primary' : 'bg-surface-elevated border border-glass-border'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out will-change-transform ${hapticsEnabled ? 'translate-x-6' : 'translate-x-0 bg-content-muted'}`} 
              />
            </button>
          </div>
        </div>

        {/* --- TIER 3: DATA SOVEREIGNTY --- */}
        <div className="bg-surface-elevated border border-glass-border rounded-[20px] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-glass-border/30">
            <h3 className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Data Sovereignty</h3>
          </div>
          
          <div className="flex border-b border-glass-border/30">
            <button onClick={handleExport} className="flex-1 p-4 flex flex-col items-center justify-center gap-2 text-content active:bg-black/5 transition-colors border-r border-glass-border/30">
              <Download size={18} className="text-brand-primary" />
              <span className="font-semibold text-xs">Backup Vault</span>
            </button>
            
            <button onClick={() => fileInputRef.current.click()} className="flex-1 p-4 flex flex-col items-center justify-center gap-2 text-content active:bg-black/5 transition-colors">
              <Upload size={18} className="text-brand-primary" />
              <span className="font-semibold text-xs">Restore Vault</span>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            </button>
          </div>

          <button onClick={() => handleAccordion('reset')} className="w-full p-4 flex items-center justify-between text-brand-danger active:bg-brand-danger/5 transition-colors">
            <div className="flex items-center gap-3"><RotateCcw size={18} /><span className="font-semibold text-sm">Factory Reset Settings</span></div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${expandedSection === 'reset' ? 'rotate-180' : ''}`} />
          </button>
          <div className={`grid transition-all duration-300 ease-out ${expandedSection === 'reset' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden px-4 pb-4 bg-brand-danger/5">
              <p className="text-xs text-brand-danger mb-3 pt-2">Warning: This will permanently delete your personal vault and app settings.</p>
              <button onClick={handleFactoryReset} className="w-full py-2 bg-brand-danger text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm">Confirm Wipe</button>
            </div>
          </div>
        </div>
        
        {/* --- TIER 4: ABOUT, LEGAL & SUPPORT (INLINE ACCORDION CARD) --- */}
        <SupportSheet 
            expandedSection={expandedSection} 
            handleAccordion={handleAccordion} 
        />
        
        {/* --- TIER 5: PREMIUM BRANDING FOOTER --- */}
        <div className="mt-12 mb-8 flex flex-col items-center justify-center text-center relative pointer-events-none select-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-primary/10 blur-2xl rounded-full animate-pulse pointer-events-none" />
          
          <div className="relative w-14 h-14 mb-4 flex items-center justify-center bg-gradient-to-b from-surface-elevated to-surface border border-glass-border rounded-2xl shadow-[0_4px_20px_rgba(var(--brand-primary-rgb),0.15)] z-10">
            <BookOpen size={24} className="text-content mt-1" strokeWidth={1.5} />
            <Bell size={13} className="text-brand-primary absolute top-3 right-3 animate-pulse" />
          </div>

          <h2 className="text-lg font-serif font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-content to-content-muted relative z-10">
            NOTIFY TEACHER
          </h2>
          <p className="text-[10px] font-medium text-content-muted mt-2 uppercase tracking-[0.15em] relative z-10">
            Engineered by <span className="text-brand-primary font-bold">Sahil Kumar Rout</span>
          </p>
        </div>

      </div>
    </div>
  );
}