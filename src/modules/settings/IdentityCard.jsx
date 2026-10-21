import React, { useState, useEffect } from 'react';
import { User, Building, Phone, Edit2, LogOut, ShieldCheck, ChevronDown, Shield, Check } from 'lucide-react';
import { triggerHaptic, secureLocalStoreRead, secureLocalStoreWrite } from '../../core/hardwareBridge.js';
import { supabase } from '../../core/supabaseClient.js';

// Premium Google 'G' Logo
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

export function IdentityCard({ userRole, expandedSection, handleAccordion, onProfileUpdated }) {
    const [isEditing, setIsEditing] = useState(false);
    const [localProfile, setLocalProfile] = useState(null);
    const [form, setForm] = useState({ name: '', school: '', mobile: '' });
  
    // PSYCHOLOGY UX: Default to true (Opt-out consent is frictionless)
    const [isConsentChecked, setIsConsentChecked] = useState(true);
    
    const roleNames = ['Teacher', 'Notifier', 'Admin', 'Developer'];
    const roleString = roleNames[userRole] || 'Teacher';

    useEffect(() => {
        const loadProfile = async () => {
            const saved = await secureLocalStoreRead('notify_local_profile');
            if (saved && saved.name) {
                setLocalProfile(saved);
                setForm(saved);
                setIsEditing(false);
            } else {
                setIsEditing(true);
            }
        };
        loadProfile();
    }, []);

    const isValid = (form.name || '').trim().length > 0 && 
                    (form.school || '').trim().length > 0 && 
                    (form.mobile || '').replace(/\D/g, '').length === 10;

    const handleSave = async () => {
        const digitCount = (form.mobile || '').replace(/\D/g, '').length;
        if (!(form.name || '').trim() || !(form.school || '').trim() || digitCount !== 10) {
            triggerHaptic('error').catch(()=>{});
            return;
        }
        await triggerHaptic('success');
        await secureLocalStoreWrite('notify_local_profile', form);
        setLocalProfile(form);
        setIsEditing(false);
        if (onProfileUpdated) onProfileUpdated(form.name);
    };

    const handleCancel = () => {
        triggerHaptic('light').catch(()=>{});
        if (localProfile) {
            setForm(localProfile);
            setIsEditing(false);
        } else {
            handleAccordion('profile'); 
        }
    };

    const handleDeleteProfile = async () => {
        await triggerHaptic('heavy');
        await secureLocalStoreWrite('notify_local_profile', null);
        setLocalProfile(null);
        setForm({ name: '', school: '', mobile: '' });
        setIsEditing(true);
        if (onProfileUpdated) onProfileUpdated(''); 
    };

    const handleGoogleLogin = async () => {
        if (!isConsentChecked) return;
        await triggerHaptic('medium');
        try {
            await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }});
        } catch (error) {
            console.error("Login Error:", error);
        }
    };

    const handleLogOut = async () => {
        await triggerHaptic('heavy');
        try {
            await supabase.auth.signOut();
            window.location.reload(); 
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <div className="bg-surface-elevated border border-glass-border rounded-[20px] overflow-hidden shadow-sm mb-6">
            
            {/* --- ACCORDION 1: LOCAL PROFILE --- */}
            <div className="border-b border-glass-border/30">
                <button onClick={() => handleAccordion('profile')} className="w-full p-4 flex items-center justify-between text-content active:bg-black/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary border border-brand-primary/20">
                            <User size={18} />
                        </div>
                        <div className="text-left">
                            <span className="font-bold text-sm block leading-tight">Local Profile</span>
                            <span className="text-[10px] text-content-muted uppercase tracking-widest font-bold">
                                {localProfile ? localProfile.name : 'Tap to configure'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown size={18} className={`text-content-muted transition-transform duration-300 ${expandedSection === 'profile' ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`grid transition-all duration-300 ease-out ${expandedSection === 'profile' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden px-4 pb-4">
                        {isEditing || !localProfile ? (
                            <div className="space-y-3 pt-2">
                                <div className="relative flex items-center">
                                    <User size={16} className="absolute left-4 text-content-muted" />
                                    <input type="text" placeholder="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                                        className="w-full bg-surface border border-glass-border rounded-xl py-3.5 pl-11 pr-4 text-content text-sm focus:outline-none focus:border-brand-primary transition-colors shadow-sm" />
                                </div>

                                <div className="relative flex items-center">
                                    <Building size={16} className="absolute left-4 text-content-muted" />
                                    <input type="text" placeholder="School Name" value={form.school} onChange={(e) => setForm({...form, school: e.target.value})}
                                        className="w-full bg-surface border border-glass-border rounded-xl py-3.5 pl-11 pr-4 text-content text-sm focus:outline-none focus:border-brand-primary transition-colors shadow-sm" />
                                </div>

                                <div className="relative flex items-center">
                                    <Phone size={16} className="absolute left-4 text-content-muted" />
                                    <span className="absolute left-11 text-content font-mono text-sm font-semibold">+91</span>
                                    <input 
                                        type="tel" 
                                        placeholder="Mobile Number" 
                                        maxLength="10"
                                        value={form.mobile} 
                                        onChange={(e) => setForm({...form, mobile: (e.target.value || '').replace(/\D/g, '')})}
                                        className="w-full bg-surface border border-glass-border rounded-xl py-3.5 pl-[76px] pr-4 text-content text-sm font-mono tracking-wide focus:outline-none focus:border-brand-primary transition-colors shadow-sm" 
                                    />
                                </div>
                                
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleCancel} className="flex-1 py-3 rounded-xl border border-brand-danger/30 text-brand-danger bg-brand-danger/5 font-bold uppercase tracking-widest text-xs active:scale-95 transition-transform">
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave} 
                                        disabled={!isValid} 
                                        className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all ${isValid ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-green-400' : 'bg-surface border border-glass-border text-content-muted opacity-50'}`}
                                    >
                                        Save
                                    </button>
                                </div>

                                {localProfile && (
                                    <button onClick={handleDeleteProfile} className="w-full mt-2 py-3 text-[10px] font-bold text-brand-danger uppercase tracking-widest active:scale-95 transition-transform">
                                        Delete Local Data
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-surface border border-glass-border rounded-[16px] p-4 flex items-center justify-between shadow-sm mt-2">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-lg font-bold border border-brand-primary/20 shrink-0">
                                        {localProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="overflow-hidden pr-2">
                                        <h4 className="text-content font-bold text-sm truncate">{localProfile?.name || 'User'}</h4>
                                        <p className="text-content-muted text-[11px] truncate mt-0.5">{localProfile?.school || ''}</p>
                                    </div>
                                </div>
                                <button onClick={() => { triggerHaptic('light'); setIsEditing(true); }} className="p-2 bg-surface-elevated border border-glass-border rounded-lg text-brand-primary active:scale-90 transition-transform shrink-0">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ACCORDION 2: CLOUD ACCESS --- */}
            <div>
                <button onClick={() => handleAccordion('cloud')} className="w-full p-4 flex items-center justify-between text-content active:bg-black/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${userRole >= 1 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            <Shield size={18} />
                        </div>
                        <div className="text-left">
                            <span className="font-bold text-sm block leading-tight">Cloud Access</span>
                            <span className={`text-[10px] uppercase tracking-widest font-bold ${userRole >= 1 ? 'text-green-500' : 'text-content-muted'}`}>
                                {userRole >= 1 ? `${roleString} (Connected)` : 'Tap to Login As Notifier/ Admin'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown size={18} className={`text-content-muted transition-transform duration-300 ${expandedSection === 'cloud' ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`grid transition-all duration-300 ease-out ${expandedSection === 'cloud' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden px-4 pb-4">
                        <div className="pt-2">
                            {userRole >= 1 ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 bg-green-500/5 border border-green-500/20 p-4 rounded-[16px]">
                                        <ShieldCheck size={20} className="text-green-500 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-content">Logged in as Staff</p>
                                            <p className="text-[11px] text-content-muted mt-1 leading-relaxed">
                                                You have active permission to manage notices as a {roleString}.
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={handleLogOut} className="w-full flex items-center justify-center gap-2 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-[16px] active:scale-[0.98] transition-transform">
                                        <LogOut size={16} className="text-brand-danger" />
                                        <span className="font-bold text-xs text-brand-danger uppercase tracking-widest">Log Out</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[11px] text-content-muted leading-relaxed px-1">
                                      Log in to post & Manage in Notify Teacher.
                                    </p>
                                    
                                    {/* Telegram-style Quoted Legal Consent */}
                                    <div className="flex items-start gap-2 border-l-4 border-brand-primary/40 bg-brand-primary/5 p-3 rounded-r-xl">
                                        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                                            <input 
                                                type="checkbox" 
                                                checked={isConsentChecked} 
                                                onChange={(e) => {
                                                    triggerHaptic('light').catch(()=>{});
                                                    setIsConsentChecked(e.target.checked);
                                                }} 
                                                className="peer appearance-none w-4 h-4 border border-glass-border rounded bg-surface checked:bg-brand-primary checked:border-brand-primary transition-colors cursor-pointer" 
                                            />
                                            <Check size={12} strokeWidth={3} className="absolute text-app-base opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                        </div>
                                        <p className="text-[10px] text-content-muted leading-relaxed">
                                            By proceeding, I agree to the <button onClick={() => { triggerHaptic('light'); handleAccordion('terms'); }} className="text-content font-bold underline decoration-content-muted/50 hover:decoration-brand-primary transition-colors cursor-pointer">Terms of Service</button> and authorize my local profile details to be securely transmitted to the administration for verification.
                                        </p>
                                    </div>

                                    {/* Google Button */}
                                    <button 
                                        onClick={handleGoogleLogin} 
                                        disabled={!isConsentChecked}
                                        className={`w-full flex items-center justify-center gap-3 p-4 rounded-[16px] transition-all shadow-sm ${
                                            isConsentChecked 
                                            ? 'bg-surface border border-glass-border text-content active:scale-[0.98] hover:brightness-110 cursor-pointer' 
                                            : 'bg-surface-elevated border border-glass-border/40 text-content-muted opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <GoogleIcon />
                                        <span className="font-bold text-xs uppercase tracking-widest">Log in with Google</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}