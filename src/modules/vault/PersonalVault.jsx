import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Rocket, Sparkles, Send, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { VaultRow } from './VaultRow.jsx';
import { TaskStepper } from './TaskStepper.jsx';
import { triggerHaptic, secureLocalStoreRead } from '../../core/hardwareBridge.js';
import { eliteSpring } from '../../core/animations.js';

export function PersonalVault({ tasks, onAddTask, onUpdateTask, onDeleteTask, onPublishTask, userRole, onTabSwitch }) {
    const [isStepperOpen, setIsStepperOpen] = useState(false);
    const [selectedTaskForMenu, setSelectedTaskForMenu] = useState(null);
    const [taskToEdit, setTaskToEdit] = useState(null);
    
    // Gatekeeper State
    const [hasLocalProfile, setHasLocalProfile] = useState(null);

    const personalTasks = tasks.filter(t => t.owner === 'Me' || !t.isGlobal);

    // Boot Check: Does the user have an identity?
    useEffect(() => {
        const checkProfile = async () => {
            const profile = await secureLocalStoreRead('notify_local_profile');
            setHasLocalProfile(!!(profile && profile.name));
        };
        checkProfile();
    }, []);

    const handleActionClick = async (action, task) => {
        await triggerHaptic('medium');
        setSelectedTaskForMenu(null);
        if (action === 'promote' && onPublishTask) {
            onPublishTask(task);
        } else if (action === 'edit') {
            setTaskToEdit(task);
            setIsStepperOpen(true);
        } else if (action === 'delete' && onDeleteTask) {
            onDeleteTask(task.id);
        }
    };

    const handleUnlockRequest = () => {
        triggerHaptic('medium').catch(()=>{});
        onTabSwitch('settings'); // Jump to Settings Tab
        // Fire custom event to trigger the Identity Sheet slightly after the tab switches
        setTimeout(() => {
            window.dispatchEvent(new Event('open-identity-sheet'));
        }, 150); 
    };

    // --- GATEKEEPER UI (L0 + No Profile) ---
    if (userRole === 0 && hasLocalProfile === false) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center relative px-6 pb-32">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={eliteSpring}
                    className="flex flex-col items-center text-center bg-surface-elevated border border-glass-border p-8 rounded-[32px] shadow-expressive w-full max-w-sm"
                >
                    <div className="w-20 h-20 rounded-[24px] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6 shadow-sm">
                        <ShieldAlert size={36} className="text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-content mb-2">Vault Locked</h2>
                    <p className="text-xs text-content-muted leading-relaxed mb-8">
                        The Personal Vault is your private, encrypted workspace. Set up your Personal Profile to unlock offline task management.
                    </p>
                    <button 
                        onClick={handleUnlockRequest}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-brand-primary text-app-base rounded-[16px] font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-sm"
                    >
                        <span>Setup Profile</span>
                        <ArrowRight size={16} />
                    </button>
                </motion.div>
            </div>
        );
    }

    // --- STANDARD VAULT UI ---
    return (
        <div className="w-full h-full flex flex-col relative px-4 pb-32 pt-2">
            
            <button
                onClick={() => { triggerHaptic('medium'); setTaskToEdit(null); setIsStepperOpen(true); }}
                className="w-full border-2 border-dashed border-glass-border bg-surface-elevated rounded-2xl p-4 flex items-center justify-center gap-2 text-content-muted hover:text-content hover:border-brand-primary/50 transition-all mb-4 active:scale-95"
            >
                <Plus size={18} />
                <span className="text-sm font-bold tracking-wide">New Private Entry</span>
            </button>

            <AnimatePresence>
                {personalTasks.length > 0 ? (
                    personalTasks.map((task) => (
                        <VaultRow key={task.id} task={task} onOptionsClick={(t) => setSelectedTaskForMenu(t)} />
                    ))
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-content-muted mt-4">
                        <Sparkles size={28} className="mb-3 opacity-30" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70">Vault is clear</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isStepperOpen && (
                    <TaskStepper
                        initialData={taskToEdit}
                        onSave={(savedTask) => {
                            const taskWithOwnership = { ...savedTask, owner: 'Me', syncStatus: savedTask.syncStatus || 'draft' };
                            if (taskToEdit) onUpdateTask(taskWithOwnership);
                            else onAddTask(taskWithOwnership);
                            setIsStepperOpen(false);
                        }}
                        onClose={() => setIsStepperOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedTaskForMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTaskForMenu(null)}
                            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                            transition={eliteSpring}
                            className="fixed bottom-6 left-4 right-4 z-[130] bg-surface border border-glass-border rounded-[32px] p-6 shadow-expressive"
                        >
                            <div className="flex justify-between items-start mb-6 border-b border-glass-border pb-4">
                                <div className="pr-4">
                                    <h3 className="text-content font-bold text-lg mb-1 truncate">{selectedTaskForMenu.title}</h3>
                                    <p className="text-content-muted text-[10px] uppercase tracking-widest font-bold">Manage entry</p>
                                </div>
                                <button onClick={() => setSelectedTaskForMenu(null)} className="p-2 bg-surface-elevated rounded-full text-content-muted active:scale-90 border border-glass-border">
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {userRole >= 1 && selectedTaskForMenu.syncStatus !== 'published' && (
                                    <button onClick={() => handleActionClick('promote', selectedTaskForMenu)} className="w-full flex items-center gap-3 bg-brand-primary/10 text-brand-primary p-4 rounded-2xl font-bold active:scale-95 transition-all border border-brand-primary/20">
                                        {userRole >= 2 ? <Rocket size={18} /> : <Send size={18} />}
                                        {userRole >= 2 ? 'Publish Live to Notice Board' : 'Propose to Admin'}
                                    </button>
                                )}
                                <button onClick={() => handleActionClick('edit', selectedTaskForMenu)} className="w-full flex items-center gap-3 bg-surface-elevated text-content p-4 rounded-2xl font-semibold active:scale-95 transition-all border border-glass-border">
                                    <Edit2 size={18} /> Edit Details
                                </button>
                                <button onClick={() => handleActionClick('delete', selectedTaskForMenu)} className="w-full flex items-center gap-3 bg-brand-danger/10 text-brand-danger p-4 rounded-2xl font-semibold active:scale-95 transition-all border border-brand-danger/20">
                                    <Trash2 size={18} /> Delete Entry
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
