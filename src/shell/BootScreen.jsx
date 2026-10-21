import React, { useState, useEffect } from 'react';
import { BookOpen, Bell, ShieldCheck, BellRing, LayoutGrid, CheckCircle, User, Building, Phone, ArrowRight, Lock } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { secureLocalStoreWrite, triggerHaptic } from '../core/hardwareBridge.js';

export function BootScreen({ status, onComplete }) {
    const [bootPhase, setBootPhase] = useState(status === 'initializing' ? 'splash' : 'onboard');
    const [isExiting, setIsExiting] = useState(false);
    
    const [profileName, setProfileName] = useState('');
    const [profileSchool, setProfileSchool] = useState('');
    const [profileMobile, setProfileMobile] = useState('');

    const isProfileValid = profileName.trim().length > 0 && 
                           profileSchool.trim().length > 0 && 
                           profileMobile.replace(/\D/g, '').length === 10;

    // Premium Slow Crossfade (600ms exit delay)
    useEffect(() => {
        if (bootPhase === 'splash') {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => {
                    setBootPhase('onboard');
                    setIsExiting(false);
                }, 600); // Matches the new slow fadeOut CSS
            }, 3500); // Let them admire the splash screen slightly longer
            return () => clearTimeout(timer);
        }
    }, [bootPhase]);

    const handleGrantAccessAndContinue = async () => {
        await triggerHaptic('medium');
        try {
            const permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
        } catch (error) {
            console.warn('Browser Environment: Notifications bypassed.');
        }
        await triggerHaptic('light');
        setIsExiting(true);
        setTimeout(() => {
            setBootPhase('profile');
            setIsExiting(false);
        }, 500); // Smooth half-second transition
    };

    const finalizeBoot = async (profileData = null) => {
        await triggerHaptic('success');
        if (profileData) {
            await secureLocalStoreWrite('notify_local_profile', profileData);
        }
        await secureLocalStoreWrite('has_completed_onboarding', true);
        onComplete();
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        if (!isProfileValid) {
            triggerHaptic('warning');
            return; 
        }
        triggerHaptic('success');
        
        // 1. Save the data silently
        if (profileName) {
            secureLocalStoreWrite('notify_local_profile', { name: profileName, school: profileSchool, mobile: profileMobile });
        }
        secureLocalStoreWrite('has_completed_onboarding', true);

        // 2. Trigger the premium transition screen instead of abruptly closing
        setIsExiting(true);
        setTimeout(() => {
            setBootPhase('finalizing');
            setIsExiting(false);
            
            // 3. Wait 1.8 seconds for the cool animation, then officially handoff to the Main Layout
            setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onComplete(), 500);
            }, 1800);
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-app-base bg-noise flex flex-col items-center justify-center p-6 text-center overflow-hidden select-none">
            
            {/* =========================================================
                PREMIUM COMPOSITOR STYLES (0 CPU LOAD, 120 FPS)
                ========================================================= */}
            <style>{`
                :root {
                    /* Apple's signature "long-tail" momentum curve */
                    --ease-premium: cubic-bezier(0.16, 1, 0.3, 1); 
                    /* Smooth, cinematic fade curve */
                    --ease-fade: cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* THE FIX: 'both' ensures elements stay invisible during their delays */
                .anim-fade-in {
                    animation: fadeIn 1.2s var(--ease-fade) both;
                }
                .anim-fade-out {
                    animation: fadeOut 0.6s var(--ease-fade) both;
                }
                .anim-scale-up {
                    animation: scaleUp 1.4s var(--ease-premium) both;
                }
                .anim-slide-up {
                    animation: slideUp 1.4s var(--ease-premium) both;
                }
                
                /* Infinite Animations */
                .anim-bell-ring { animation: bellRing 2.5s ease-in-out infinite; }
                .anim-pulse-glow { animation: pulseGlow 4s ease-in-out infinite; }
                .anim-shimmer-bar { animation: shimmerBar 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

                @keyframes fadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes fadeOut {
                    0% { opacity: 1; transform: scale(1); filter: blur(0px); }
                    100% { opacity: 0; transform: scale(0.98); filter: blur(2px); }
                }
                @keyframes scaleUp {
                    0% { opacity: 0; transform: translate3d(0, 30px, 0) scale(0.85); }
                    100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                }
                @keyframes slideUp {
                    0% { opacity: 0; transform: translate3d(0, 32px, 0); }
                    100% { opacity: 1; transform: translate3d(0, 0, 0); }
                }
                
                @keyframes bellRing {
                    0%, 100% { transform: rotate(0deg); }
                    10% { transform: rotate(-15deg); }
                    20% { transform: rotate(12deg); }
                    30% { transform: rotate(-8deg); }
                    40% { transform: rotate(4deg); }
                    50%, 100% { transform: rotate(0deg); }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.12; transform: translate3d(-50%, -50%, 0) scale(0.9); }
                    50% { opacity: 0.22; transform: translate3d(-50%, -50%, 0) scale(1.1); }
                }
                @keyframes shimmerBar {
                    0% { transform: translate3d(-100%, 0, 0); }
                    100% { transform: translate3d(200%, 0, 0); }
                }

                /* Slower, wider cascading delays for that luxurious, deliberate feel */
                .delay-1 { animation-delay: 0.15s; }
                .delay-2 { animation-delay: 0.30s; }
                .delay-3 { animation-delay: 0.45s; }
                .delay-4 { animation-delay: 0.60s; }
                .delay-5 { animation-delay: 0.75s; }
            `}</style>

            {/* =========================================================
                PHASE 1: THE CINEMATIC SPLASH
                ========================================================= */}
            {bootPhase === 'splash' && (
                <div className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden gpu-accelerate ${isExiting ? 'anim-fade-out' : 'anim-fade-in'}`}>
                    
                    {/* Background Skeleton Wireframe */}
                    <div className="absolute inset-0 px-5 pt-8 pointer-events-none flex flex-col gap-4 z-0 opacity-15">
                        <div className="flex justify-between items-center pb-4 border-b border-glass-border">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-surface-elevated" />
                                <div className="space-y-1.5"><div className="w-24 h-3 bg-surface-elevated rounded-md" /><div className="w-16 h-2 bg-surface-elevated rounded-md" /></div>
                            </div>
                            <div className="flex gap-2"><div className="w-8 h-8 rounded-lg bg-surface-elevated" /><div className="w-8 h-8 rounded-lg bg-surface-elevated" /></div>
                        </div>
                        <div className="flex gap-2 pt-2"><div className="w-16 h-7 rounded-xl bg-surface-elevated" /><div className="w-20 h-7 rounded-xl bg-surface-elevated" /></div>
                        <div className="space-y-3 pt-2">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="w-full h-28 rounded-[22px] bg-surface-elevated/70 border border-glass-border p-4 flex flex-col justify-between">
                                    <div className="space-y-2"><div className="w-3/4 h-4 bg-surface rounded-md" /><div className="w-1/2 h-2.5 bg-surface rounded-md" /></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex flex-col items-center z-10">
                        {/* GPU Ambient Breathing Glow */}
                        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-brand-primary blur-[80px] rounded-full pointer-events-none anim-pulse-glow gpu-accelerate" />

                        {/* Main Logo Container */}
                        <div className="relative w-24 h-24 mb-6 flex items-center justify-center bg-gradient-to-b from-surface-elevated to-surface border border-glass-border rounded-[32px] shadow-expressive gpu-accelerate glass-rim anim-scale-up">
                            <BookOpen size={40} className="text-content mt-1" strokeWidth={1.5} />
                            
                            <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-surface-elevated border border-glass-border flex items-center justify-center shadow-sm gpu-accelerate anim-bell-ring">
                                <Bell size={14} className="text-brand-primary" />
                            </div>
                        </div>

                        <div className="overflow-hidden pb-2 anim-slide-up delay-1">
                            <h1 className="text-2xl font-serif font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-content via-brand-primary to-content">
                                NOTIFY TEACHER
                            </h1>
                        </div>

                        <div className="flex flex-col items-center mt-5 gap-3 anim-slide-up delay-2">
                            <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.25em] text-content-muted">
                                Decrypting Workspace
                            </span>
                            <div className="w-32 h-[2px] bg-glass-border rounded-full overflow-hidden relative">
                                <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-brand-primary rounded-full anim-shimmer-bar" />
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center z-10 anim-slide-up delay-3">
                        <p className="text-[8px] font-medium text-content-muted uppercase tracking-[0.2em]">
                            Engineered by <span className="text-brand-primary font-bold">Sahil Kumar Rout</span>
                        </p>
                    </div>
                </div>
            )}

            {/* =========================================================
                PHASE 2: EFFICIENCY-FIRST ONBOARDING DASHBOARD
                ========================================================= */}
            {bootPhase === 'onboard' && (
                <div className={`flex flex-col items-center justify-center w-full max-w-sm h-full pt-10 pb-6 gpu-accelerate ${isExiting ? 'anim-fade-out' : 'anim-fade-in'}`}>
                    <div className="w-full flex-1 flex flex-col justify-center relative">
                        
                        <div className="absolute top-0 left-1/2 w-48 h-48 bg-brand-primary/15 blur-[60px] rounded-full pointer-events-none anim-pulse-glow" />

                        {/* Top Banner */}
                        <div className="flex flex-col items-center mb-6 relative z-10 anim-slide-up">
                            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-b from-surface-elevated to-surface border border-glass-border flex items-center justify-center shadow-expressive mb-4 glass-rim">
                                <BookOpen size={28} className="text-brand-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-content tracking-tight text-center">
                                Notify <span className="text-brand-primary">Teacher</span>
                            </h1>
                            <p className="text-content-muted text-[10px] mt-1.5 uppercase tracking-widest font-bold">
                                Academic Control Center
                            </p>
                        </div>

                        {/* Features List with Natural CSS Stagger */}
                        <div className="space-y-3.5 my-6 w-full text-left relative z-10">
                            <div className="bg-surface-elevated/80 backdrop-blur-md border border-glass-border rounded-[20px] p-4 flex gap-4 items-start shadow-sm anim-slide-up delay-1">
                                <div className="bg-brand-primary/10 p-2.5 rounded-xl border border-brand-primary/20 shrink-0 text-brand-primary mt-0.5"><LayoutGrid size={18} /></div>
                                <div>
                                    <h3 className="text-xs font-bold text-content uppercase tracking-wider">Global Board</h3>
                                    <p className="text-[11px] text-content-muted mt-1 leading-relaxed">Real-time notices and timetable updates from verified school staff.</p>
                                </div>
                            </div>
                            
                            <div className="bg-surface-elevated/80 backdrop-blur-md border border-glass-border rounded-[20px] p-4 flex gap-4 items-start shadow-sm anim-slide-up delay-2">
                                <div className="bg-brand-primary/10 p-2.5 rounded-xl border border-brand-primary/20 shrink-0 text-brand-primary mt-0.5"><ShieldCheck size={18} /></div>
                                <div>
                                    <h3 className="text-xs font-bold text-content uppercase tracking-wider">Personal Vault</h3>
                                    <p className="text-[11px] text-content-muted mt-1 leading-relaxed">100% offline, client-encrypted local task management.</p>
                                </div>
                            </div>
                            
                            <div className="bg-surface-elevated/80 backdrop-blur-md border border-glass-border rounded-[20px] p-4 flex gap-4 items-start shadow-sm anim-slide-up delay-3">
                                <div className="bg-brand-primary/10 p-2.5 rounded-xl border border-brand-primary/20 shrink-0 text-brand-primary mt-0.5"><BellRing size={18} /></div>
                                <div>
                                    <h3 className="text-xs font-bold text-content uppercase tracking-wider">Smart Alerts</h3>
                                    <p className="text-[11px] text-content-muted mt-1 leading-relaxed">System requires local notification access to ensure deadlines are met.</p>
                                </div>
                            </div>
                        </div>

                        {/* Action CTA */}
                        <div className="anim-slide-up delay-4">
                            <button
                                onClick={handleGrantAccessAndContinue}
                                className="relative w-full flex items-center justify-center gap-2 bg-content text-app-base px-6 py-4 rounded-[20px] font-bold text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-expressive overflow-hidden group z-10"
                            >
                                <span>Enable Alerts & Continue</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                PHASE 3: LOCAL PROFILE SETUP (FRICTIONLESS)
                ========================================================= */}
            {bootPhase === 'profile' && (
                <div className={`flex flex-col items-center justify-center w-full max-w-sm h-full pt-10 pb-6 gpu-accelerate ${isExiting ? 'anim-fade-out' : 'anim-fade-in'}`}>
                    <div className="w-full flex-1 flex flex-col justify-center">
                        
                        <div className="flex flex-col items-center text-center mb-8 anim-slide-up">
                            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-b from-surface-elevated to-surface text-brand-primary border border-glass-border flex items-center justify-center mb-4 shadow-sm glass-rim">
                                <Lock size={22} />
                            </div>
                            <h1 className="text-2xl font-bold text-content tracking-tight mb-1.5">Secure Identity</h1>
                            <p className="text-content-muted text-[11px] leading-relaxed max-w-[240px]">
                                This data acts as your offline signature. It is stored exclusively on this device.
                            </p>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4 mb-8 w-full">
                            <div className="relative flex items-center anim-slide-up delay-1">
                                <User size={18} className="absolute left-4 text-content-muted" />
                                <input 
                                    type="text" placeholder="Full Name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required
                                    className="w-full bg-surface border border-glass-border rounded-xl py-4 pl-[46px] pr-4 text-content text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm"
                                />
                            </div>

                            <div className="relative flex items-center anim-slide-up delay-2">
                                <Building size={18} className="absolute left-4 text-content-muted" />
                                <input 
                                    type="text" placeholder="School Name" value={profileSchool} onChange={(e) => setProfileSchool(e.target.value)} required
                                    className="w-full bg-surface border border-glass-border rounded-xl py-4 pl-[46px] pr-4 text-content text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm"
                                />
                            </div>

                            <div className="relative flex items-center anim-slide-up delay-3">
                                <Phone size={18} className="absolute left-4 text-content-muted" />
                                <span className="absolute left-[46px] text-content font-mono text-sm font-semibold">+91</span>
                                <input 
                                    type="tel" placeholder="Mobile Number" maxLength="10" value={profileMobile} onChange={(e) => setProfileMobile(e.target.value.replace(/\D/g, ''))} required
                                    className="w-full bg-surface border border-glass-border rounded-xl py-4 pl-[84px] pr-4 text-content text-sm font-mono tracking-wide focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm"
                                />
                            </div>

                            <div className="anim-slide-up delay-4">
                                <button 
                                    type="submit" 
                                    disabled={!isProfileValid}
                                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-[20px] font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-expressive mt-2
                                        ${isProfileValid ? 'bg-brand-primary text-app-base hover:brightness-110' : 'bg-surface-elevated border border-glass-border text-content-muted opacity-60 cursor-not-allowed'}`}
                                >
                                    <span>Initialize Vault</span>
                                    <CheckCircle size={16} />
                                </button>
                            </div>
                        </form>

                        <div className="anim-slide-up delay-5">
                            <button 
                                onClick={() => finalizeBoot()} 
                                className="text-content-muted text-[10px] font-bold uppercase tracking-widest active:text-content transition-colors p-3 rounded-xl hover:bg-black/5"
                            >
                                Skip & Configure Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
          {/* =========================================================
                PHASE 4: CRYPTOGRAPHIC HANDOFF (THE PREMIUM TRANSITION)
                ========================================================= */}
            {bootPhase === 'finalizing' && (
                <div className={`flex flex-col items-center justify-center w-full h-full gpu-accelerate ${isExiting ? 'anim-fade-out' : 'anim-fade-in'}`}>
                    <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-brand-primary/20 blur-[60px] rounded-full pointer-events-none anim-pulse-glow" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-[24px] bg-surface-elevated border border-glass-border flex items-center justify-center shadow-expressive mb-6 glass-rim anim-scale-up">
                            {/* Pure CSS Spinning Shield */}
                            <ShieldCheck size={28} className="text-brand-primary anim-bell-ring" />
                        </div>
                        
                        <h2 className="text-lg font-bold text-content tracking-tight anim-slide-up delay-1">
                            Securing Vault
                        </h2>
                        
                        <div className="flex flex-col items-center mt-6 gap-3 anim-slide-up delay-2">
                            <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.2em] text-content-muted">
                                Generating Local Keys
                            </span>
                            <div className="w-32 h-[2px] bg-glass-border rounded-full overflow-hidden relative">
                                <div className="absolute top-0 bottom-0 left-0 w-full bg-brand-primary rounded-full anim-shimmer-bar" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}