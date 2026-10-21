import React, { useEffect, useState, useRef } from 'react';
import { 
  X, Phone, CheckCircle, XCircle, Trash2, ShieldOff, 
  UserCheck, ShieldAlert, Bell, Info, FileText, ChevronDown, 
  Archive, Users, Shield, Ban, TrendingUp 
} from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';
import { supabase } from '../../core/supabaseClient.js';
import {
  fetchApplicants, 
  fetchActiveStaff, 
  fetchRestrictedStaff, 
  executeSoftBan, 
  executeBanAndPurge, 
  executeReinstate,
  executeApproveApplicant,
  executeRejectApplicant, // NOTE: Ensure you add this to ModActions.js
  fetchPendingNotices,
  executeApproveNotice,
  executeRejectNotice,
  executePromoteUser      // NOTE: Ensure you add this to ModActions.js
} from './ModActions.js';


// =====================================================================
// 1. ELITE FINTECH HOLD-TO-PURGE BUTTON (0 CPU STRESS)
// =====================================================================
const HoldToPurgeButton = ({ onConfirm }) => {
    const [isPressing, setIsPressing] = useState(false);
    const pressTimer = useRef(null);

    const handlePointerDown = () => {
        setIsPressing(true);
        triggerHaptic('light').catch(()=>{}); // Start hum
        
        // Timer for 1.5 seconds hold
        pressTimer.current = setTimeout(() => {
            triggerHaptic('heavy').catch(()=>{}); // Final execution pop
            onConfirm();
            setIsPressing(false);
        }, 1500);
    };

    const handlePointerUp = () => {
        if (isPressing) {
            setIsPressing(false);
            clearTimeout(pressTimer.current); // Cancel if they let go early
        }
    };

    return (
        <div 
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full h-10 rounded-xl border border-brand-danger/20 bg-brand-danger/5 overflow-hidden select-none cursor-pointer group active:scale-[0.98] transition-transform flex items-center justify-center"
            style={{ touchAction: 'none' }}
        >
            {/* Pure CSS Liquid Fill (scaleX) - GPU Accelerated */}
            <div 
                className={`absolute inset-0 bg-brand-danger origin-left will-change-transform 
                    ${isPressing ? 'transition-transform ease-linear duration-[1500ms]' : 'transition-transform duration-300 ease-out'}
                `}
                style={{ transform: isPressing ? 'scaleX(1)' : 'scaleX(0)' }}
            />
            {/* Dynamic Text Color */}
            <div className={`relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${isPressing ? 'text-white' : 'text-brand-danger'}`}>
                <Trash2 size={14} /> {isPressing ? 'Hold to Purge...' : 'Purge User'}
            </div>
        </div>
    );
};


// =====================================================================
// 2. MAIN ACTION CENTER COMPONENT
// =====================================================================
export function ActionCenter({ isOpen, onClose, userRole, userEmail }) {
  
  // --- A. 0-CPU MOUNTING ORCHESTRATION ---
  // Replaces Framer Motion to prevent WSOD crashes.
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Double requestAnimationFrame ensures the DOM is painted before the slide-in class fires
      requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)));
    } else {
      setIsVisible(false);
      // Wait for CSS slide-out to finish (400ms) before destroying the DOM node
      const timer = setTimeout(() => setIsMounted(false), 400); 
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // --- B. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('drafts');
  const [isLoading, setIsLoading] = useState(true);
  
  // L0/L1 Inbox State
  const [userStatus, setUserStatus] = useState(null);
  
  // Admin Lists
  const [pendingNotices, setPendingNotices] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [staff, setStaff] = useState([]);
  const [restricted, setRestricted] = useState([]);
  
  // UI State
  const [expandedApplicant, setExpandedApplicant] = useState(null); // Controls the Inline Accordion

  // --- C. PARALLEL DATA CACHING ---
  // Fires ONCE when panel opens. Fetches everything simultaneously.
  useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (userRole >= 2) {
          // Promise.all fetches all 4 lists at the exact same time
          const [notices, apps, active, banned] = await Promise.all([
            fetchPendingNotices(),
            fetchApplicants(),
            fetchActiveStaff(),
            fetchRestrictedStaff()
          ]);
          setPendingNotices(notices);
          setApplicants(apps);
          setStaff(active);
          setRestricted(banned);
        } else {
          // L0/L1 Logic
          if (userRole === 1) {
            setUserStatus('approved');
          } else if (userEmail) {
            const { data } = await supabase.from('applicant_requests').select('status').eq('email', userEmail).maybeSingle();
            setUserStatus(data ? data.status : 'none'); // Identifies if they are 'pending' or silently 'rejected'
          } else {
            setUserStatus('none');
          }
        }
      } catch (error) {
        console.error("Action Center Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isOpen, userRole, userEmail]);


  // --- D. GOVERNANCE & ACTION HANDLERS ---
  const handleAccordion = async (id) => {
    await triggerHaptic('light');
    setExpandedApplicant(expandedApplicant === id ? null : id);
  };

  const handleNoticeAction = async (noticeId, action) => {
    await triggerHaptic(action === 'approve' ? 'success' : 'warning');
    // Audit Logging: Pass current user ID as the approver
    if (action === 'approve') await executeApproveNotice(noticeId, supabase.auth.user()?.id);
    if (action === 'reject') await executeRejectNotice(noticeId);
    setPendingNotices(prev => prev.filter(n => n.id !== noticeId)); // Instantly remove from UI
  };

  const handleApplicantAction = async (appId, action) => {
    await triggerHaptic(action === 'approve' ? 'success' : 'warning');
    if (action === 'approve') await executeApproveApplicant(appId, supabase.auth.user()?.id);
    if (action === 'reject') await executeRejectApplicant(appId); // Updates to 'rejected' silently
    setApplicants(prev => prev.filter(a => a.id !== appId));
  };

  const handlePromote = async (userId, currentRole) => {
    await triggerHaptic('success');
    const newRole = currentRole + 1;
    await executePromoteUser(userId, newRole, supabase.auth.user()?.id);
    // Move user up in the local UI instantly without reloading
    setStaff(prev => prev.map(u => u.id === userId ? { ...u, role_level: newRole } : u));
  };

  const handleSoftBan = async (userId) => {
    await triggerHaptic('warning');
    await executeSoftBan(userId); 
    const target = staff.find(u => u.id === userId);
    setStaff(prev => prev.filter(u => u.id !== userId));
    if (target) setRestricted(prev => [...prev, target]); // Move to Restricted tab
  };

  const handlePurge = async (userId) => {
    // No haptic needed here, the HoldToPurge button handles it
    await executeBanAndPurge(userId);
    setStaff(prev => prev.filter(u => u.id !== userId));
  };

  const handleReinstate = async (userId) => {
    await triggerHaptic('success');
    await executeReinstate(userId);
    const target = restricted.find(u => u.id === userId);
    setRestricted(prev => prev.filter(u => u.id !== userId));
    if (target) setStaff(prev => [...prev, target]); // Move back to Active Staff
  };
  
  // =====================================================================
  // 3. UI RENDERERS (THE GHOST INBOX & COMMAND HUB)
  // =====================================================================

  // --- A. THE "GHOST INBOX" EMPTY STATE ---
  const renderEmptyState = (IconComponent, text) => (
    <div className="flex flex-col items-center justify-center pt-24 text-content-muted opacity-60 select-none">
        <IconComponent size={72} strokeWidth={1} className="mb-5 text-brand-primary opacity-50" />
        <h3 className="text-sm font-bold text-content tracking-tight">{text}</h3>
        <p className="text-[10px] uppercase tracking-widest mt-1.5 font-semibold">Inbox Zero</p>
    </div>
  );

  // --- B. USER INBOX (L0 / L1) ---
  const renderUserInbox = () => (
    <div className="space-y-4 pt-4">
      {isLoading ? (
        <div className="w-full h-24 bg-surface-elevated animate-pulse rounded-2xl" />
      ) : userStatus === 'pending' ? (
        <div className="bg-brand-warning/10 border border-brand-warning/30 rounded-[20px] p-5 shadow-sm">
          <div className="flex gap-4 items-start">
            <Info size={22} className="text-brand-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-content font-bold text-sm">Request Pending</h3>
              <p className="text-content-muted text-[11px] mt-1.5 leading-relaxed">
                Your application to become a Notifier is under review by the administration. You will be notified here once a decision is made.
              </p>
            </div>
          </div>
        </div>
      ) : userStatus === 'rejected' ? (
        <div className="bg-brand-danger/10 border border-brand-danger/20 rounded-[20px] p-5 shadow-sm">
          <div className="flex gap-4 items-start">
            <XCircle size={22} className="text-brand-danger flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-content font-bold text-sm">Application Declined</h3>
              <p className="text-content-muted text-[11px] mt-1.5 leading-relaxed">
                Your request to become a Notifier was not approved by the administration.
              </p>
            </div>
          </div>
        </div>
      ) : userStatus === 'approved' ? (
        <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-[20px] p-5 shadow-sm">
          <div className="flex gap-4 items-start">
            <CheckCircle size={22} className="text-brand-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-content font-bold text-sm">Notifier Access Active</h3>
              <p className="text-content-muted text-[11px] mt-1.5 leading-relaxed">
                You have been verified and granted publishing rights. You can now broadcast global notices to the school.
              </p>
            </div>
          </div>
        </div>
      ) : renderEmptyState(Bell, "Inbox Empty")}
    </div>
  );

  // --- C. ADMIN COMMAND HUB (L2 / L3) ---
  const renderAdminHub = () => (
    <div className="flex flex-col h-full">
      
      {/* Sleek Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 pt-2 shrink-0">
        {['drafts', 'users', 'staff', 'restricted'].map((tab) => (
          <button
            key={tab}
            onClick={() => { triggerHaptic('light'); setActiveTab(tab); }}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${
              activeTab === tab 
              ? 'bg-brand-primary text-app-base shadow-sm scale-105' 
              : 'bg-surface border border-glass-border text-content-muted hover:text-content'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-12 space-y-3 relative">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="w-full h-24 bg-surface-elevated rounded-[20px] animate-pulse" />)
        ) : (
          <>
            {/* --- TAB 1: DRAFTS --- */}
            {activeTab === 'drafts' && pendingNotices.length === 0 && renderEmptyState(Archive, "No Pending Drafts")}
            {activeTab === 'drafts' && pendingNotices.map((notice) => (
              <div key={notice.id} className="bg-surface border border-glass-border rounded-[20px] p-4 shadow-sm glass-rim">
                <div className="flex items-center justify-between mb-2 border-b border-glass-border/30 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-brand-primary" />
                    <span className="text-[10px] uppercase tracking-widest text-brand-primary font-bold truncate max-w-[120px]">{notice.author_name}</span>
                  </div>
                  <span className="text-[10px] text-content-muted font-mono">{new Date(notice.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-content font-bold text-sm leading-tight mb-2">{notice.title}</h3>
                <p className="text-content-muted text-[11px] mb-4 line-clamp-3 leading-relaxed">{notice.content}</p>
                
                <div className="flex gap-2">
                  <button onClick={() => handleNoticeAction(notice.id, 'reject')} className="flex-1 py-2.5 rounded-xl bg-surface-elevated border border-glass-border text-content-muted hover:text-brand-danger active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-2">
                    <XCircle size={14} /> Reject
                  </button>
                  <button onClick={() => handleNoticeAction(notice.id, 'approve')} className="flex-1 py-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-app-base active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
                    <CheckCircle size={14} /> Publish
                  </button>
                </div>
              </div>
            ))}

            {/* --- TAB 2: USERS (APPLICANTS WITH ACCORDION) --- */}
            {activeTab === 'users' && applicants.length === 0 && renderEmptyState(Users, "No Pending Requests")}
            {activeTab === 'users' && applicants.map((app) => (
              <div key={app.id} className="bg-surface border border-glass-border rounded-[20px] overflow-hidden shadow-sm glass-rim">
                <button onClick={() => handleAccordion(app.id)} className="w-full p-4 flex items-center justify-between text-content active:bg-black/5 transition-colors">
                  <div className="text-left">
                    <h3 className="font-bold text-sm">{app.full_name}</h3>
                    <p className="text-[10px] text-content-muted uppercase tracking-widest mt-0.5 font-semibold">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <ChevronDown size={16} className={`text-content-muted transition-transform duration-300 ${expandedApplicant === app.id ? 'rotate-180' : ''}`} />
                </button>
                
                {/* 0-CPU Inline Accordion Expansion */}
                <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${expandedApplicant === app.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden px-4 pb-4">
                    <div className="bg-surface-elevated border border-glass-border rounded-xl p-3 mb-4 space-y-2.5">
                        <div className="flex justify-between items-center"><span className="text-[9px] text-content-muted uppercase font-bold tracking-widest">School</span><span className="text-xs text-content font-medium">{app.school_office}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[9px] text-content-muted uppercase font-bold tracking-widest">Phone</span><span className="text-xs text-content font-mono font-bold tracking-wide">{app.mobile_number}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApplicantAction(app.id, 'reject')} className="flex-1 py-2.5 rounded-xl bg-brand-danger/10 text-brand-danger border border-brand-danger/20 font-bold text-xs active:scale-95 transition-transform">Reject</button>
                      <button onClick={() => window.open(`tel:${app.mobile_number}`)} className="flex-[0.8] py-2.5 rounded-xl bg-surface-elevated border border-glass-border text-content font-bold text-xs active:scale-95 transition-transform"><Phone size={14} className="mx-auto"/></button>
                      <button onClick={() => handleApplicantAction(app.id, 'approve')} className="flex-[1.5] py-2.5 rounded-xl bg-brand-primary text-app-base font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-transform shadow-expressive">Approve</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* --- TAB 3: ACTIVE STAFF (WITH GOVERNANCE) --- */}
            {activeTab === 'staff' && staff.length === 0 && renderEmptyState(Shield, "No Active Staff")}
            {activeTab === 'staff' && staff.map((user) => {
              // THE GOVERNANCE MATRIX: You can only manage people BELOW your level.
              // We show their card so you know who is who, but we hide the action buttons if they outrank you or equal you.
              const canManage = userRole > user.role_level;

              return (
                <div key={user.id} className="bg-surface border border-glass-border rounded-[20px] p-4 shadow-sm glass-rim">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-content font-bold text-sm">{user.assigned_name}</h3>
                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${user.role_level >= 2 ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'bg-surface-elevated text-content-muted border border-glass-border'}`}>
                        Level {user.role_level}
                    </span>
                  </div>
                  <p className="text-[10px] text-content-muted font-mono mb-4">{user.email}</p>
                  
                  {/* Only render action buttons if the user is authorized to manage this person */}
                  {canManage ? (
                    <div className="flex flex-col gap-2 pt-2 border-t border-glass-border/30">
                        {/* L3 Developer can promote L1s to L2 Admin */}
                        {userRole === 3 && user.role_level < 3 && (
                            <button onClick={() => handlePromote(user.id, user.role_level)} className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary active:scale-[0.98] transition-all text-xs font-bold">
                            <TrendingUp size={14} /> Promote to L{user.role_level + 1} Admin
                            </button>
                        )}
                        <button onClick={() => handleSoftBan(user.id)} className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-brand-warning/10 border border-brand-warning/20 text-brand-warning active:scale-[0.98] transition-all text-xs font-bold">
                        <ShieldOff size={14} /> Suspend Rights
                        </button>
                        {/* 0-CPU Elite Hold-to-Purge Component */}
                        <HoldToPurgeButton onConfirm={() => handlePurge(user.id)} />
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-glass-border/30">
                        <p className="text-[9px] uppercase tracking-widest text-content-muted/60 font-bold text-center">Protected System Administrator</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* --- TAB 4: RESTRICTED (SUSPENDED) --- */}
            {activeTab === 'restricted' && restricted.length === 0 && renderEmptyState(Ban, "No Restricted Users")}
            {activeTab === 'restricted' && restricted.map((user) => (
              <div key={user.id} className="bg-brand-danger/5 border border-brand-danger/20 rounded-[20px] p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-danger/10 blur-2xl rounded-full pointer-events-none" />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="text-content font-bold text-sm">{user.assigned_name}</h3>
                    <p className="text-[10px] text-content-muted font-mono mt-0.5">{user.email}</p>
                  </div>
                  <span className="text-brand-danger text-[9px] uppercase tracking-widest font-bold bg-brand-danger/10 border border-brand-danger/20 px-2 py-1 rounded-md">Suspended</span>
                </div>
                <button onClick={() => handleReinstate(user.id)} className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-surface-elevated border border-glass-border text-content hover:text-brand-primary active:scale-[0.98] transition-all text-xs font-bold shadow-sm relative z-10">
                  <CheckCircle size={14} className="text-brand-primary" /> Reinstate Access
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  // =====================================================================
  // 4. THE PURE CSS COMPOSITOR PANEL (0-CPU)
  // =====================================================================
  if (!isMounted) return null;

  return (
    <>
        {/* PURE CSS BACKDROP */}
        <div 
            onClick={() => { triggerHaptic('light'); onClose(); }}
            className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* PURE CSS SLIDING PANEL */}
        <div 
            className={`fixed top-0 right-0 bottom-0 w-full max-w-[360px] bg-app-base border-l border-glass-border shadow-2xl z-[110] flex flex-col transform will-change-transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Header */}
            <div className="px-6 pt-12 pb-4 border-b border-glass-border/50 flex justify-between items-center shrink-0 bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand-primary/10 rounded-[12px] border border-brand-primary/20">
                        {userRole >= 2 ? <ShieldAlert size={18} className="text-brand-primary" /> : <Bell size={18} className="text-brand-primary" />}
                    </div>
                    <h2 className="text-lg font-bold text-content tracking-tight">{userRole >= 2 ? 'Command Hub' : 'Action Centre'}</h2>
                </div>
                <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-2 bg-surface-elevated border border-glass-border rounded-full text-content-muted hover:text-content active:scale-90 transition-transform">
                    <X size={16} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-hidden px-5">
                {userRole >= 2 ? renderAdminHub() : renderUserInbox()}
            </div>
        </div>
    </>
  );
}

