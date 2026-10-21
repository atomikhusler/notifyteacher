import React, { useEffect, useState } from 'react'; 
import { BootScreen } from './shell/BootScreen.jsx';
import { MainLayout } from './shell/MainLayout.jsx';

import { supabase } from './core/supabaseClient.js';
import { fetchAndMixGlobalFeed, toggleNoticeCompletion } from './core/FeedEngine.js';
import { fetchVaultTasks, saveVaultTask, updateVaultTask, deleteVaultTask } from './core/vaultEngine.js';
import { executePublishTask, executePurgeTask } from './modules/admin/ModActions.js';
import { scheduleTaskEscalation, cancelTaskEscalation } from './core/NotificationEngine.js';
import { secureLocalStoreRead, triggerHaptic, initHaptics } from './core/hardwareBridge.js';

const ACCENT_PALETTE = [
  { id: 'emerald', hex: '#10b981' }, { id: 'sapphire', hex: '#2563eb' },
  { id: 'violet', hex: '#a855f7' }, { id: 'crimson', hex: '#f43f5e' },
  { id: 'amber', hex: '#f59e0b' }, { id: 'coral', hex: '#ff6b4a' },
  { id: 'cyan', hex: '#06b6d4' }, { id: 'indigo', hex: '#6366f1' },
  { id: 'fuchsia', hex: '#d946ef' }, { id: 'lime', hex: '#84cc16' },
  { id: 'sky', hex: '#38bdf8' }, { id: 'adaptive', hex: 'var(--theme-text-main)' }
];

export function App() { 
    const [systemStatus, setSystemStatus] = useState('initializing'); 
    const [initialTab, setInitialTab] = useState('feed');
    const [tasks, setTasks] = useState([]); 
    const [sessionData, setSessionData] = useState(null); 
    const [isPingingCloud, setIsPingingCloud] = useState(false);
    const [userRole, setUserRole] = useState(0); 
    const [density, setDensity] = useState(3); 
    const [theme, setTheme] = useState(null);

    useEffect(() => { 
        executeBootSequence(); 
    }, []);
  
    const executeBootSequence = async () => {
        try {
            await initHaptics();
            const hasOnboarded = await secureLocalStoreRead('has_completed_onboarding');
            
            // --- 1. SILENT AUTHENTICATION CHECK ---
            // Wrapped in try/catch so mock client failure doesn't WSOD the app
            try {
                if (supabase && supabase.auth) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        const { data } = await supabase
                            .from('authorizations')
                            .select('role_level')
                            .eq('email', session.user.email)
                            .maybeSingle();
                        
                        setUserRole(data ? data.role_level : 0);
                        setSessionData(session.user);
                    }
                }
            } catch (e) {
                console.warn("Silent Auth Check Bypassed (Mock Mode)");
            }

            // --- 2. LOCAL MEMORY LOAD ---
            const lastTab = await secureLocalStoreRead('last_active_tab');
            if (lastTab && typeof lastTab === 'string') setInitialTab(lastTab);

            const safeVault = await fetchVaultTasks();
            setTasks(safeVault);

            let savedTheme = await secureLocalStoreRead('app_theme');
            if (typeof savedTheme !== 'string' || !savedTheme) savedTheme = 'light-vanilla';
            setTheme(savedTheme);

            let savedAccentId = await secureLocalStoreRead('app_accent');
            if (savedAccentId) {
                const found = ACCENT_PALETTE.find(a => a.id === savedAccentId);
                if (found) document.documentElement.style.setProperty('--app-accent', found.hex);
            }

            let savedDensity = Number(await secureLocalStoreRead('app_density'));
            if (isNaN(savedDensity) || savedDensity < 1 || savedDensity > 5) savedDensity = 3; 
            setDensity(savedDensity);
            document.documentElement.style.setProperty('--app-scale', 0.85 + (savedDensity * 0.05));

            // --- 3. ROUTING LOGIC ---
            // If they haven't onboarded, show boot sequence. Otherwise, skip straight to app.
            if (hasOnboarded !== true && hasOnboarded !== 'true') {
                setSystemStatus('onboarding');
            } else {
                setSystemStatus('ready');
            }

            // --- 4. CLOUD SYNC ---
            setIsPingingCloud(true);
            const mixedCloudData = await fetchAndMixGlobalFeed(); 
            setTasks(prev => {
                const localOnly = prev.filter(t => !t.isGlobal);
                return [...mixedCloudData, ...localOnly];
            });

        } catch (error) {
            console.error("Boot Architecture Failure:", error);
            setSystemStatus('ready'); 
        } finally {
            setIsPingingCloud(false);
        }
    };

    // ... [KEEP ALL YOUR TASK HANDLERS (handleTaskCompleted, handleAddTask, etc.) EXACTLY AS THEY WERE] ...

    const handleTaskCompleted = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.isGlobal) {
            const { success, completed_at } = await toggleNoticeCompletion(taskId, true);
            if (success) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true, completed_at } : t));
                await cancelTaskEscalation(taskId);
            }
        } else {
            const timeNow = new Date().toISOString();
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true, completed_at: timeNow } : t));
            await cancelTaskEscalation(taskId);
            await updateVaultTask({ ...task, isCompleted: true, completed_at: timeNow });
        }
    };
    
    const handleTaskUndo = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.isGlobal) {
            const { success } = await toggleNoticeCompletion(taskId, false);
            if (success) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: false, completed_at: null } : t));
                await scheduleTaskEscalation(task);
            }
        } else {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: false, completed_at: null } : t));
            await scheduleTaskEscalation(task); 
            await updateVaultTask({ ...task, isCompleted: false, completed_at: null });
        }
    };

    const handleAddTask = async (newTask) => {
        setTasks(prev => [...prev, newTask]);
        await saveVaultTask(newTask);
        await scheduleTaskEscalation(newTask);
    };

    const handleUpdateTask = async (updatedTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        await updateVaultTask(updatedTask);
        await scheduleTaskEscalation(updatedTask); 
    };

    const handlePublishTask = async (task) => {
        const success = await executePublishTask(task, userRole);
        if (success) {
            const publishedTask = { ...task, isGlobal: true, owner: 'Me', syncStatus: userRole >= 2 ? 'published' : 'pending' };
            await updateVaultTask(publishedTask);
            setTasks(prev => [...prev.filter(t => t.id !== task.id), publishedTask]);
            await scheduleTaskEscalation(publishedTask);
            await triggerHaptic('success');
        } else {
            triggerHaptic('error');
            alert("Database Error: Could not publish task.");
        }
    };

    const handleDeleteTask = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        if (task.isGlobal) {
            const success = await executePurgeTask(taskId);
            if (!success) {
                triggerHaptic('error');
                alert("Cloud Error: Supabase rejected the deletion.");
                return;
            }
        }
        await deleteVaultTask(taskId);
        await cancelTaskEscalation(taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        await triggerHaptic('success');
    };
  
    const handleBulkPurge = async (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) return;
        await triggerHaptic('heavy');
        
        let successfullyPurgedIds = [];
        for (const id of selectedIds) {
            const task = tasks.find(t => t.id === id);
            if (!task) continue;

            if (task.isGlobal) {
                const success = await executePurgeTask(id);
                if (success) successfullyPurgedIds.push(id);
                else {
                    triggerHaptic('error').catch(()=>{});
                    alert(`Database Error: Could not delete "${task.title}".`);
                }
            } else {
                await deleteVaultTask(id);
                successfullyPurgedIds.push(id);
            }
        }
        
        setTasks(prev => prev.map(t => {
            if (successfullyPurgedIds.includes(t.id)) {
                if (t.isGlobal && (t.owner === 'Me' || t.author_name === 'Me' || t.author_name === 'Admin')) {
                    const demotedTask = { ...t, isGlobal: false, syncStatus: 'rejected' };
                    updateVaultTask(demotedTask).catch(()=>{});
                    return demotedTask;
                }
                cancelTaskEscalation(t.id).catch(()=>{});
                return null;
            }
            return t;
        }).filter(Boolean));
    };

    useEffect(() => {
        if (!theme) return; 
        const root = document.documentElement;
        root.className = root.className.replace(/\btheme-\S+/g, '');
        root.classList.add(`theme-${theme}`);
    }, [theme]);

    if (systemStatus === 'initializing' || systemStatus === 'onboarding') {
        return (
            <BootScreen 
                key="bootscreen" 
                status={systemStatus} 
                onComplete={() => setSystemStatus('ready')} 
            />
        );
    }

    return (
        <MainLayout 
            tasks={tasks} userRole={userRole} setUserRole={setUserRole}
            density={density} setDensity={setDensity} theme={theme} setTheme={setTheme}
            isPingingCloud={isPingingCloud} initialTab={initialTab}
            onTaskCompleted={handleTaskCompleted} onTaskUndo={handleTaskUndo}
            onAddTask={handleAddTask} onUpdateTask={handleUpdateTask}
            onPublishTask={handlePublishTask} onDeleteTask={handleDeleteTask}
            onBulkPurge={handleBulkPurge}
            sessionData={sessionData} // Pass session data down to layout
        />
    ); 
}

