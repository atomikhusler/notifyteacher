import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, User, Star, Terminal } from 'lucide-react';
import { triggerHaptic } from '../core/hardwareBridge.js';
import { eliteSpring } from '../core/animations.js';

export function DevRoleSwitcher({ userRole, setUserRole }) {
    // 🚨 SECURITY LOCK: If this is built for production, render absolutely nothing.
    if (!import.meta.env.DEV) return null;

    const roles = [
        { level: 0, name: 'Teacher', icon: User, color: 'text-zinc-400' },
        { level: 1, name: 'Notifier', icon: Star, color: 'text-blue-400' },
        { level: 2, name: 'Admin', icon: ShieldAlert, color: 'text-emerald-400' },
        { level: 3, name: 'Dev', icon: Terminal, color: 'text-red-500' }
    ];

    const currentRole = roles[userRole] || roles[0];
    const Icon = currentRole.icon;

    const handleToggle = async () => {
        await triggerHaptic('light');
        setUserRole((prev) => (prev + 1) % 4);
    };

    return (
        <motion.div
            drag
            // Allow dragging down the screen, but constrain it from flying off the edges
            dragConstraints={{ left: -150, right: 150, top: 0, bottom: window.innerHeight - 100 }}
            dragElastic={0.1}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            transition={eliteSpring}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] cursor-grab active:cursor-grabbing"
        >
            <div 
                onClick={handleToggle}
                className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.8)] active:scale-95 transition-transform"
            >
                <Icon size={14} className={currentRole.color} />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest select-none">
                    L{currentRole.level}: {currentRole.name}
                </span>
            </div>
        </motion.div>
    );
}

