import React, { useMemo, useState, useRef, useEffect } from 'react'; 
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';

import { GlobalFeed } from '../modules/feed/GlobalFeed.jsx';
import { PersonalVault } from '../modules/vault/PersonalVault.jsx';
import { SettingsView } from '../modules/settings/SettingsView.jsx';
import { BottomDock } from './BottomDock.jsx';
import { GlobalHeader } from './GlobalHeader.jsx';
import { QuickControls } from '../modules/feed/QuickControls.jsx';
import { DevRoleSwitcher } from './DevRoleSwitcher.jsx'; 
import { calculateTimeDelta, getCurrentSession } from '../core/timeEngine.js';
import { secureLocalStoreWrite } from '../core/hardwareBridge.js';

export function MainLayout({ 
    tasks, userRole, setUserRole, density, setDensity, theme, setTheme, isPingingCloud,
    onTaskCompleted, onTaskUndo, onAddTask, onUpdateTask, onPublishTask, onDeleteTask, onBulkPurge, initialTab
}) {
    const [activeTab, setActiveTab] = useState(initialTab || 'feed'); 
    const [foregroundTick, setForegroundTick] = useState(0);
    const [isScrollingDown, setIsScrollingDown] = useState(false);
    const lastScrollY = useRef(0);
    
    const [isControlsOpen, setIsControlsOpen] = useState(false);
    const [commandModeActive, setCommandModeActive] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState([]);
    
    const [activeFilter, setActiveFilter] = useState('All'); 
    const [isHistoryView, setIsHistoryView] = useState(false); 
    const [selectedSession, setSelectedSession] = useState(getCurrentSession());

    useEffect(() => { 
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') setForegroundTick(prev => prev + 1);
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    // Auto-kill command mode and clear selected items whenever leaving the feed
    const handleTabSwitch = (newTab) => {
        if (newTab !== 'feed') {
            setCommandModeActive(false);
            setSelectedTasks([]);
            setIsControlsOpen(false);
        }
        setActiveTab(newTab);
        secureLocalStoreWrite('last_active_tab', newTab).catch(()=>{});
    };

    useEffect(() => {
        if (activeTab !== 'feed' && commandModeActive) {
            setCommandModeActive(false);
            setSelectedTasks([]);
        }
    }, [activeTab, commandModeActive]);

    const handleScroll = (e) => {
        const currentScrollY = e.target.scrollTop;
        if (currentScrollY > lastScrollY.current + 15 && currentScrollY > 50) setIsScrollingDown(true);
        else if (currentScrollY < lastScrollY.current - 15 || currentScrollY < 10) setIsScrollingDown(false);
        lastScrollY.current = currentScrollY;
    };

    const toggleCommandMode = () => {
        if (commandModeActive) setSelectedTasks([]); 
        setCommandModeActive(!commandModeActive);
        setIsControlsOpen(false); 
    };

    const handleExecuteBulkPurge = async () => {
        await onBulkPurge(selectedTasks);
        setSelectedTasks([]);
        setCommandModeActive(false);
    };

    const processedTasks = useMemo(() => {
        return tasks.map(task => {
            const { urgencyStatus, colorToken, daysRemaining, formattedDate } = calculateTimeDelta(task.deadline_date);
            return { ...task, urgencyStatus, colorToken, daysRemaining, formattedDate };
        });
    }, [tasks, foregroundTick]);

    const themeClass = theme === 'vanilla' || !theme ? "" : `theme-${theme}`;

    return ( 
        <div className={`w-screen h-[100dvh] overflow-hidden relative flex flex-col transition-colors duration-500 bg-app-base text-content ${themeClass}`}>
            <DevRoleSwitcher userRole={userRole} setUserRole={setUserRole} />

            <GlobalHeader 
                activeTab={activeTab} isScrollingDown={isScrollingDown} userRole={userRole}
                toggleControls={() => setIsControlsOpen(!isControlsOpen)}
                commandModeActive={commandModeActive} toggleCommandMode={toggleCommandMode}
                activeFilter={activeFilter} setActiveFilter={setActiveFilter}
                selectedTasks={selectedTasks} onBulkPurge={handleExecuteBulkPurge}
                isHistoryView={isHistoryView} setIsHistoryView={setIsHistoryView}
                tasks={processedTasks} selectedSession={selectedSession} setSelectedSession={setSelectedSession}
            />

            <AnimatePresence>
                {isControlsOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsControlsOpen(false)} className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
                        <QuickControls 
                            density={density} setDensity={setDensity} 
                            theme={theme} setTheme={setTheme} 
                            userRole={userRole} commandModeActive={commandModeActive} toggleCommandMode={toggleCommandMode}
                            currentScreen={activeTab}
                        />
                    </>
                )}
            </AnimatePresence>

            {isPingingCloud && (
                <div className="absolute top-4 right-4 z-[70] flex items-center gap-2 px-3 py-1.5 bg-surface-elevated border border-glass-border backdrop-blur rounded-full text-content text-[10px] uppercase tracking-widest animate-pulse shadow-sm">
                    <RefreshCcw size={10} className="animate-spin" /> Syncing
                </div>
            )}

            <div className="flex-1 overflow-y-auto relative pt-[110px] pb-[72px] transition-transform duration-300 ease-out" onScroll={handleScroll} style={{ transform: `scale(${0.85 + (density * 0.05)})`, transformOrigin: 'top center' }}>
                <div className="w-full min-h-full animate-in fade-in duration-300">
                    {activeTab === 'feed' && (
                        <GlobalFeed 
                            tasks={processedTasks} commandModeActive={commandModeActive} activeFilter={activeFilter} 
                            selectedTasks={selectedTasks} setSelectedTasks={setSelectedTasks} 
                            onTaskCompleted={onTaskCompleted} onTaskUndo={onTaskUndo} 
                            isHistoryView={isHistoryView} selectedSession={selectedSession} 
                        />
                    )}
                    {activeTab === 'vault' && (
                        <PersonalVault 
                            tasks={processedTasks} userRole={userRole}
                            onAddTask={onAddTask} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask}
                            onPublishTask={onPublishTask} onTaskCompleted={onTaskCompleted} onTaskUndo={onTaskUndo} 
                            onTabSwitch={handleTabSwitch}
                        />
                    )}
                    {activeTab === 'settings' && (
                        <SettingsView 
                            userRole={userRole} theme={theme} setTheme={setTheme}
                            density={density} setDensity={setDensity} tasks={tasks.filter(t => !t.isGlobal || t.owner === 'Me')}
                        />
                    )}
                </div>
            </div>

            <BottomDock activeTab={activeTab} onTabSwitch={handleTabSwitch} />
        </div>
    ); 
}
