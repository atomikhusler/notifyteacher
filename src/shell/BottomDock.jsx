import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, User, Settings } from 'lucide-react';
import { triggerHaptic } from '../core/hardwareBridge.js';

export function BottomDock({ activeTab, onTabSwitch }) {
    
    const handleTabClick = (tabId) => {
        if (activeTab !== tabId) {
            triggerHaptic('light').catch(() => {});
            onTabSwitch(tabId);
        }
    };

    // A permanently stable dock builds muscle memory
    const navItems = [
        { id: 'feed', icon: LayoutGrid, label: 'Board' },
        { id: 'vault', icon: User, label: 'Vault' },
        { id: 'settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center px-4">
            {/* The Floating Chassis */}
            <div className="bg-surface-elevated/90 backdrop-blur-2xl border border-glass-border rounded-[32px] p-1.5 flex items-center shadow-expressive pointer-events-auto transition-colors duration-500">
                
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon; 
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`relative flex items-center justify-center h-14 rounded-[26px] transition-all duration-300 ease-out active:scale-95 z-10 ${
                                isActive ? 'w-28 text-brand-primary' : 'w-16 text-content-muted hover:text-content'
                            }`}
                        >
                            {/* The Fluid Sliding Background Pill */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeDockPill"
                                    className="absolute inset-0 bg-brand-primary/10 border border-brand-primary/20 rounded-[26px] -z-10"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            
                            {/* Icon & Shifting Text Container */}
                            <div className="flex items-center justify-center gap-2">
                                <Icon 
                                    size={20} 
                                    strokeWidth={isActive ? 2.5 : 2} 
                                    className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
                                />
                                
                                {/* Text only appears when active */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.span 
                                            initial={{ opacity: 0, width: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, width: 'auto', scale: 1 }}
                                            exit={{ opacity: 0, width: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-[11px] font-bold tracking-wide whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </button>
                    );
                })}
                
            </div>
        </div>
    );
}
