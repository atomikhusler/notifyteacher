import React, { useState } from 'react';
import { ShieldCheck, BookOpen, Code, ChevronDown, Heart, Coffee, Wallet, Copy, Check, ExternalLink, Info } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';

export function SupportSheet({ expandedSection, handleAccordion }) {
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            await triggerHaptic('success');
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            await triggerHaptic('error');
        }
    };

    const handleLinkTap = async (url) => {
        await triggerHaptic('light');
        window.open(url, '_blank'); 
    };

    const wallets = [
        { id: 'btc', name: 'Bitcoin (BTC)', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', icon: Wallet, color: 'text-orange-500' },
        { id: 'eth', name: 'Ethereum (ERC-20)', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', icon: Heart, color: 'text-blue-400' },
        { id: 'upi', name: 'UPI (India)', address: 'developer@upi', icon: Coffee, color: 'text-green-500' }
    ];

    return (
        <div className="bg-surface-elevated border border-glass-border rounded-[20px] overflow-hidden shadow-sm mb-6">
            
            {/* --- SECTION HEADER --- */}
            <div className="p-4 bg-brand-primary/5 border-b border-glass-border/30 flex items-center gap-3">
                <Info size={18} className="text-brand-primary" />
                <span className="font-bold text-sm text-content">About, Legal & Support</span>
            </div>

            {/* --- PRIVACY POLICY ACCORDION --- */}
            <div id="privacy-section" className="border-b border-glass-border/30">
                <button onClick={() => handleAccordion('privacy')} className="w-full p-4 flex items-center justify-between text-content active:bg-black/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={18} className="text-content-muted" />
                        <span className="font-semibold text-sm">Privacy Policy</span>
                    </div>
                    <ChevronDown size={16} className={`text-content-muted transition-transform duration-300 ${expandedSection === 'privacy' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${expandedSection === 'privacy' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden px-4 pb-4 text-[11px] text-content-muted leading-relaxed">
                        Your personal vault data never leaves this device. Global notices are stored securely in Supabase. We do not sell, track, or monetize your data. Frictionless local processing ensures maximum privacy.
                    </div>
                </div>
            </div>

            {/* --- TERMS OF SERVICE ACCORDION --- */}
            <div id="terms-section" className="border-b border-glass-border/30">
                <button onClick={() => handleAccordion('terms')} className="w-full p-4 flex items-center justify-between text-content active:bg-black/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <BookOpen size={18} className="text-content-muted" />
                        <span className="font-semibold text-sm">Terms of Service</span>
                    </div>
                    <ChevronDown size={16} className={`text-content-muted transition-transform duration-300 ${expandedSection === 'terms' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${expandedSection === 'terms' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden px-4 pb-4 text-[11px] text-content-muted leading-relaxed">
                        By using NotifyTeacher, you agree to post responsibly and maintain the integrity of the Notice Board. Misuse of authority or posting inappropriate content may result in immediate revocation of access.
                    </div>
                </div>
            </div>

            {/* --- SOURCE CODE LINK --- */}
            <div id="license-section" className="border-b border-glass-border/30">
                <button onClick={() => handleLinkTap('https://github.com')} className="w-full p-4 flex items-center justify-between text-content active:bg-black/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <Code size={18} className="text-content-muted" />
                        <span className="font-semibold text-sm">View Source Code</span>
                    </div>
                    <ExternalLink size={14} className="text-brand-primary opacity-60" />
                </button>
            </div>

            {/* --- SUPPORT & DONATIONS ACCORDION --- */}
            <div>
                <button onClick={() => handleAccordion('support')} className="w-full p-4 flex items-center justify-between text-content active:bg-black/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <Heart size={18} className="text-pink-500" />
                        <span className="font-semibold text-sm">Support the Developer</span>
                    </div>
                    <ChevronDown size={16} className={`text-content-muted transition-transform duration-300 ${expandedSection === 'support' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${expandedSection === 'support' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden px-4 pb-4 space-y-4">
                        
                        <button onClick={() => handleLinkTap('https://buymeacoffee.com/')} className="w-full flex items-center justify-between p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-[16px] active:scale-[0.98] transition-transform">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-primary/20 rounded-xl text-brand-primary"><Coffee size={18} /></div>
                                <div className="text-left">
                                    <h3 className="font-bold text-sm text-content">Buy me a coffee</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-brand-primary font-bold">Via secure web link</p>
                                </div>
                            </div>
                            <ExternalLink size={18} className="text-brand-primary opacity-60" />
                        </button>

                        <div className="space-y-3">
                            {wallets.map((wallet) => {
                                const Icon = wallet.icon;
                                const isCopied = copiedId === wallet.id;
                                return (
                                    <div key={wallet.id} className="flex items-center justify-between p-4 bg-surface-elevated border border-glass-border rounded-[16px] shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-black/5 rounded-xl border border-glass-border/50 flex-shrink-0"><Icon size={16} className={wallet.color} /></div>
                                            <div className="flex flex-col overflow-hidden pr-2">
                                                <span className="font-bold text-xs text-content">{wallet.name}</span>
                                                <span className="text-[11px] text-content-muted font-mono truncate">{wallet.address}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleCopy(wallet.address, wallet.id)} className={`p-2.5 rounded-xl flex-shrink-0 transition-colors active:scale-90 ${isCopied ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-surface border border-glass-border text-content-muted hover:text-content'}`}>
                                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}