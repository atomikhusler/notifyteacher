import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle, XCircle, Trash2, ShieldOff, UserCheck, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';
import {
  fetchApplicants, 
  fetchActiveStaff, 
  fetchRestrictedStaff, 
  executeSoftBan, 
  executeBanAndPurge, 
  executeReinstate 
  // Make sure to add executeApproveApplicant in your ModActions.js
} from './ModActions.js';

export function CommandHub() {
  const [activeTab, setActiveTab] = useState('pending');
  
  const [applicants, setApplicants] = useState([]);
  const [staff, setStaff] = useState([]);
  const [restricted, setRestricted] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Replaces the buggy hold-to-purge with a safe 2-step confirmation
  const [pendingPurgeId, setPendingPurgeId] = useState(null);

  useEffect(() => {
    loadDashboardData();
    // Reset confirmation state when switching tabs
    setPendingPurgeId(null);
  }, [activeTab]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'pending') setApplicants(await fetchApplicants());
      if (activeTab === 'staff') setStaff(await fetchActiveStaff());
      if (activeTab === 'restricted') setRestricted(await fetchRestrictedStaff());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallApplicant = async (phone) => {
    await triggerHaptic('light');
    window.location.href = `tel:${phone}`;
  };

  // Note: Tokens are no longer passed. Supabase reads the user's JWT automatically.
  const handleApprove = async (targetId) => {
    await triggerHaptic('success');
    // await executeApproveApplicant(targetId); // Uncomment when wired in ModActions
    setApplicants(prev => prev.filter(app => app.id !== targetId));
  };

  const handleSoftBan = async (targetId) => {
    await triggerHaptic('warning');
    await executeSoftBan(targetId); 
    setStaff(prev => prev.filter(user => user.id !== targetId));
  };

  const handlePurge = async (targetId) => {
    if (pendingPurgeId !== targetId) {
      // Step 1: Prime the confirmation
      await triggerHaptic('medium');
      setPendingPurgeId(targetId);
      return;
    }
    
    // Step 2: Execute the purge
    await triggerHaptic('heavy');
    await executeBanAndPurge(targetId);
    setPendingPurgeId(null);
    setStaff(prev => prev.filter(user => user.id !== targetId));
  };

  const handleReinstate = async (targetId) => {
    await triggerHaptic('success');
    await executeReinstate(targetId);
    setRestricted(prev => prev.filter(user => user.id !== targetId));
  };

  return (
    <div className="w-full flex flex-col gap-4 pt-2">
      
      {/* --- MODULAR TABS --- */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {['pending', 'staff', 'restricted'].map((tab) => (
          <button
            key={tab}
            onClick={() => { triggerHaptic('light'); setActiveTab(tab); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab 
              ? 'bg-brand-primary text-app-base shadow-sm' 
              : 'bg-surface-elevated text-content-muted border border-glass-border hover:text-content'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- CONTENT RENDERER --- */}
      <div className="flex flex-col min-h-[200px]">
        {isLoading ? (
           <div className="space-y-3">
             {[1, 2].map((skeleton) => (
               <div key={skeleton} className="w-full h-24 bg-surface-elevated border border-glass-border rounded-[16px] animate-pulse" />
             ))}
           </div>
        ) : (
          <div className="space-y-3">
            
            {/* PENDING APPLICANTS */}
            {activeTab === 'pending' && applicants.length === 0 && (
                <p className="text-center text-content-muted text-xs uppercase tracking-widest mt-8">No pending requests</p>
            )}
            {activeTab === 'pending' && applicants.map((app) => (
              <div key={app.id} className="bg-surface border border-glass-border rounded-[16px] p-4 shadow-sm">
                <h3 className="text-content font-bold text-sm">{app.full_name}</h3>
                <p className="text-content-muted text-xs mb-4">{app.school_office}</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCallApplicant(app.mobile_number)} 
                    className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-surface-elevated border border-glass-border text-content-muted hover:text-content active:scale-95 transition-all text-xs font-bold"
                  >
                    <Phone size={14} /> Verify
                  </button>
                  <button 
                    onClick={() => handleApprove(app.id)}
                    className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-brand-primary/10 border border-brand-primary/30 text-brand-primary active:scale-95 transition-all text-xs font-bold"
                  >
                    <UserCheck size={14} /> Approve
                  </button>
                </div>
              </div>
            ))}

            {/* ACTIVE STAFF */}
            {activeTab === 'staff' && staff.length === 0 && (
                <p className="text-center text-content-muted text-xs uppercase tracking-widest mt-8">No active staff found</p>
            )}
            {activeTab === 'staff' && staff.map((user) => (
              <div key={user.id} className="bg-surface border border-glass-border rounded-[16px] p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-content font-bold text-sm">{user.assigned_name}</h3>
                    <p className="text-content-muted text-[10px] uppercase tracking-widest mt-0.5">Role Level: {user.role_level}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleSoftBan(user.id)} 
                    className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-brand-warning/10 border border-brand-warning/30 text-brand-warning active:scale-[0.98] transition-all text-xs font-bold"
                  >
                    <ShieldOff size={14} /> Revoke Publishing Rights
                  </button>
                  
                  {/* 2-Step Safe Purge Button */}
                  <button 
                    onClick={() => handlePurge(user.id)}
                    className={`w-full flex justify-center items-center gap-2 py-2.5 rounded-xl border transition-all text-xs font-bold active:scale-[0.98] ${
                      pendingPurgeId === user.id 
                      ? 'bg-brand-danger text-white border-brand-danger shadow-sm' 
                      : 'bg-brand-danger/5 border-brand-danger/20 text-brand-danger'
                    }`}
                  >
                    <Trash2 size={14} /> 
                    {pendingPurgeId === user.id ? "Are you sure? (Tap to Delete)" : "Ban & Purge User"}
                  </button>
                </div>
              </div>
            ))}

            {/* RESTRICTED / BANNED */}
            {activeTab === 'restricted' && restricted.length === 0 && (
                <p className="text-center text-content-muted text-xs uppercase tracking-widest mt-8">No restricted users</p>
            )}
            {activeTab === 'restricted' && restricted.map((user) => (
              <div key={user.id} className="bg-brand-danger/5 border border-brand-danger/20 rounded-[16px] p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-content font-bold text-sm">{user.assigned_name}</h3>
                    <p className="text-brand-danger text-[10px] uppercase tracking-widest mt-0.5 font-bold">Status: Banned</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleReinstate(user.id)} 
                  className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-surface-elevated border border-glass-border text-content hover:text-brand-primary active:scale-[0.98] transition-all text-xs font-bold"
                >
                  <CheckCircle size={14} /> Reinstate Access
                </button>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}
