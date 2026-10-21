import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, SlidersHorizontal, Trash2, X, Edit3, History, ChevronDown } from 'lucide-react'; 
import { triggerHaptic } from '../core/hardwareBridge.js';
import { extractDynamicSessions } from '../core/timeEngine.js';
import { eliteSpring } from '../core/animations.js';
import { FilterShelf } from "../modules/feed/FilterShelf.jsx";

// INJECTION 1: Import the new ActionCenter component
import { ActionCenter } from '../modules/admin/ActionCenter.jsx';

export function GlobalHeader({ 
  activeTab, isScrollingDown, userRole, userEmail, // Ensure userEmail is passed from App.jsx if you have it
  toggleControls, commandModeActive, toggleCommandMode, 
  activeFilter, setActiveFilter, selectedTasks, onBulkPurge, 
  isHistoryView, setIsHistoryView, tasks, selectedSession, setSelectedSession 
}) {
  const hasSelection = selectedTasks?.length > 0;
  
  // INJECTION 2: State to control the Action Center Drawer
  const [isActionCenterOpen, setIsActionCenterOpen] = useState(false);
  
  const roleNames = ['Teacher', 'Notifier', 'Admin', 'Developer'];
  const currentRoleName = roleNames[userRole] || 'Teacher';
  
  const sessionList = useMemo(() => extractDynamicSessions(tasks), [tasks]);

  return (
    <>
      {/* INJECTION 3: The Action Center Component rendered at the root layer so it overlays everything */}
      <ActionCenter 
        isOpen={isActionCenterOpen} 
        onClose={() => setIsActionCenterOpen(false)} 
        userRole={userRole} 
        userEmail={userEmail} 
      />

      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: isScrollingDown ? -80 : 0 }}
        transition={eliteSpring}
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2 bg-app-base/90 backdrop-blur-xl border-b border-glass-border shadow-sm transition-colors duration-300"
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            
            {/* INJECTION 4: The Bell Icon becomes the trigger button */}
            <button 
              onClick={() => { triggerHaptic('light'); setIsActionCenterOpen(true); }}
              className="relative w-8 h-8 rounded-lg bg-surface-elevated shadow-sm flex items-center justify-center border border-glass-border active:scale-90 transition-transform"
            >
              <Bell size={16} className="text-brand-primary" />
              
              {/* Optional: Add a conditional red dot here later if you build unread-count logic */}
              {userRole >= 2 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-danger rounded-full animate-pulse border-2 border-app-base" />
              )}
            </button>
            
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-bold text-content leading-tight tracking-tight">
                {activeTab === 'feed' ? 'Notice Board' : 
                 activeTab === 'vault' ? 'Your Tasks' : 
                 activeTab === 'admin' ? 'Command Center' : 'Preferences'}
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className={userRole >= 2 ? 'text-brand-primary' : 'text-blue-400'}>
                  {currentRoleName}
                </span>
                <span className="text-content-muted opacity-40">•</span>
                <span className="text-content-muted">
                  {activeTab === 'feed' ? 'Global Feed' : activeTab === 'vault' ? 'Personal' : 'System'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'feed' && !commandModeActive && (
              <button 
                onClick={() => { triggerHaptic('light'); setIsHistoryView(!isHistoryView); }}
                className={`p-1.5 rounded-md flex items-center gap-1 transition-colors border shadow-sm active:scale-95 transition-transform ${
                  isHistoryView 
                  ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary' 
                  : 'bg-surface-elevated border-glass-border text-content-muted hover:text-content'
                }`}
              >
                <History size={16} />
              </button>
            )}

            <button 
              onClick={() => { triggerHaptic('light'); toggleControls(); }} 
              className="p-1.5 bg-surface-elevated rounded-md border border-glass-border text-content-muted shadow-sm active:scale-95 transition-transform"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>
        
        <div className="pointer-events-auto">
          {activeTab === 'feed' && !commandModeActive && !isHistoryView && (
            <div className="w-full mt-2">
              <FilterShelf activeFilter={activeFilter} setActiveFilter={setActiveFilter} tasks={tasks} />
            </div>
          )}

          <AnimatePresence>
            {activeTab === 'feed' && !commandModeActive && isHistoryView && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-1 py-1.5 mt-1"
              >
                <span className="text-[10px] font-bold text-brand-primary tracking-widest uppercase">
                  • Viewing Past Events
                </span>
                
                <div className="relative">
                  <select 
                    value={selectedSession} 
                    onChange={(e) => { triggerHaptic('light'); setSelectedSession(e.target.value); }}
                    className="appearance-none bg-surface-elevated border border-brand-primary/30 text-content text-[10px] font-bold tracking-widest uppercase rounded-lg pl-2 pr-6 py-1 focus:outline-none focus:border-brand-primary shadow-sm"
                  >
                    {sessionList.map(session => (
                      <option key={session} value={session}>{session}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'feed' && commandModeActive && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex items-center justify-between bg-surface-elevated border border-brand-danger/30 rounded-xl px-2 py-2 mt-2 shadow-expressive backdrop-blur-md"
            >
              <button 
                onClick={() => { triggerHaptic('light').catch(()=>{}); toggleCommandMode(); }} 
                className="flex items-center gap-1 px-2 py-1 bg-glass-border rounded-lg border border-glass-border text-content-muted hover:text-content font-bold text-[10px] uppercase tracking-widest transition-colors active:scale-95"
              >
                <X size={12}/> Cancel
              </button>

              <span className="text-[10px] font-bold text-content tracking-widest ml-1">
                {selectedTasks?.length || 0} Selected
              </span>
              
              <div className="flex gap-2 mr-1">
                <button disabled={!hasSelection} className={`flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest transition-colors px-2 py-1 rounded-lg ${hasSelection ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'text-content-muted opacity-50'}`}>
                  <Edit3 size={12}/> Edit
                </button>
                
                {userRole >= 2 && (
                  <button onClick={onBulkPurge} disabled={!hasSelection} className={`flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest transition-colors px-2 py-1 rounded-lg ${hasSelection ? 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20' : 'text-content-muted opacity-50'}`}>
                    <Trash2 size={12}/> Delete
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div> 
    </>
  );
}
