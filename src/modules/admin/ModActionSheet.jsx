import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2, X } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';
import { eliteSpring } from '../../core/animations.js';

export function ModActionSheet({ task, onClose, userRole, onExecuteAction }) {
    if (!task) return null;

    const handleAction = async (actionType) => {
        await triggerHaptic('heavy');
        onClose(); // Instantly dismiss the UI for speed
        if (onExecuteAction) {
            onExecuteAction(actionType, task); // Pass the action back to App.jsx to run ModActions.js
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            {/* Dark Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* The Action Sheet (Fixed Theming) */}
            <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={eliteSpring}
                className="w-full max-w-md bg-surface border-t border-glass-border rounded-t-3xl p-6 relative z-10 shadow-expressive"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-content font-bold text-lg leading-tight">Target: {task.author_name}</h3>
                        <p className="text-xs text-content-muted truncate max-w-[250px]">{task.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-surface-elevated rounded-full text-content-muted active:scale-90 border border-glass-border">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Both Notifiers and Admins can Propose Edits */}
                    <button onClick={() => handleAction('edit')} className="flex items-center gap-3 p-4 bg-surface-elevated rounded-xl text-content font-semibold active:scale-95 transition-transform border border-glass-border">
                        <Edit3 size={18} className="text-brand-primary" />
                        {userRole === 1 ? 'Propose Edit (To Admin)' : 'Force Edit Live Data'}
                    </button>

                    {/* ONLY Admins (Level 2+) can Purge Data directly from the feed */}
                    {userRole >= 2 && (
                        <button onClick={() => handleAction('purge')} className="flex items-center gap-3 p-4 bg-brand-danger/10 rounded-xl text-brand-danger font-semibold active:scale-95 transition-transform border border-brand-danger/20">
                            <Trash2 size={18} />
                            Purge Notice Permanently
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
