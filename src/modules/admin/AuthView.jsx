import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, Loader2, BookOpen, X } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';
import { supabase } from '../../core/supabaseClient.js';

const eliteSpring = { type: 'spring', stiffness: 350, damping: 35 };

// Standard Google 'G' Logo for an authentic, premium login button
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

export function AuthView({ isOpen, onClose }) {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        await triggerHaptic('medium');

        try {
            // Initiates Supabase OAuth flow. 
            // The browser will redirect to Google, then seamlessly bounce back to your app.
            const { error } = await supabase.auth.signInWithOAuth({ 
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            
            if (error) throw error;
            
        } catch (error) {
            setErrorMsg(error.message || "Authentication failed. Please try again.");
            triggerHaptic('error');
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                    
                    {/* Backdrop Blur to overlay smoothly on top of Settings */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { triggerHaptic('light'); onClose(); }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Ambient Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-brand-primary/20 blur-[100px] pointer-events-none z-10" />

                    {/* Close Button */}
                    <motion.button 
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { triggerHaptic('light'); onClose(); }}
                        className="absolute top-12 right-6 w-10 h-10 bg-surface-elevated border border-glass-border rounded-full flex items-center justify-center text-content hover:text-brand-primary active:scale-90 transition-all z-30 shadow-sm"
                    >
                        <X size={20} />
                    </motion.button>

                    <motion.div 
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={eliteSpring}
                        className="w-full max-w-sm relative z-20"
                    >
                        {/* Brand Header */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 bg-surface border border-glass-border rounded-2xl flex items-center justify-center mb-4 shadow-expressive">
                                <BookOpen size={28} className="text-brand-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Cloud Authorization</h1>
                            <p className="text-white/70 text-sm mt-1 max-w-[260px] mx-auto leading-relaxed">
                                Verify your identity to apply for Global Notifier or Administrative rights.
                            </p>
                        </div>

                        {/* Form Container */}
                        <div className="bg-surface-elevated border border-glass-border rounded-[32px] p-6 shadow-2xl">
                            
                            {errorMsg && (
                                <div className="flex items-center gap-2 text-brand-danger bg-brand-danger/10 px-3 py-2.5 rounded-xl text-xs font-semibold mb-4 text-left">
                                    <AlertCircle size={16} className="shrink-0" /> 
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <button 
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-surface border border-glass-border text-content py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-transform active:scale-95 shadow-sm disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin text-brand-primary" />
                                ) : (
                                    <>
                                        <GoogleIcon />
                                        <span>Continue with Google</span>
                                    </>
                                )}
                            </button>

                            <div className="mt-5 flex items-start gap-3 bg-brand-primary/10 border border-brand-primary/20 p-3.5 rounded-xl text-left">
                                <ShieldCheck size={18} className="text-brand-primary shrink-0 mt-0.5" />
                                <p className="text-[10px] text-content-muted leading-relaxed">
                                    Your institutional email will be securely verified. No passwords are created or stored by this application.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
