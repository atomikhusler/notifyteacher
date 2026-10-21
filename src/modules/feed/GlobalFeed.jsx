import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { NoticeRow } from './NoticeRow.jsx';
import { isInSession } from '../../core/timeEngine.js';

export function GlobalFeed({ 
    tasks, commandModeActive, activeFilter, selectedTasks, setSelectedTasks, 
    onTaskCompleted, onTaskUndo, isHistoryView, selectedSession 
}) {
    
    // Strict Filtering Logic based on App.jsx state
    const feedTasks = useMemo(() => {
        let baseTasks = tasks.filter(task => task.isGlobal === true && isInSession(task.deadline_date, selectedSession));

        if (isHistoryView) {
            return baseTasks.filter(t => t.isCompleted === true || t.daysRemaining < 0);
        }

        if (activeFilter === 'This Month') {
            return baseTasks.filter(t => t.daysRemaining >= -30 && t.daysRemaining <= 30);
        }

        let filtered = baseTasks.filter(t => t.isCompleted === false && t.daysRemaining >= 0);

        if (activeFilter === 'Ongoing') {
            filtered = filtered.filter(t => t.daysRemaining === 0);
        } else if (activeFilter === 'Urgent') {
            filtered = filtered.filter(t => t.daysRemaining >= 1 && t.daysRemaining <= 3);
        } else if (activeFilter === 'Upcoming') {
            filtered = filtered.filter(t => t.daysRemaining >= 4 && t.daysRemaining <= 10);
        }

        return filtered;
    }, [tasks, activeFilter, isHistoryView, selectedSession]);

    return (
        <div className="w-full h-full flex flex-col relative px-4 pb-20 pt-4 gpu-accelerate">
            
            {/* The List Renderer (Framer Motion Layout removed for zero-lag CPU) */}
            {feedTasks.length > 0 ? (
                <div className="animate-in fade-in duration-300">
                    {feedTasks.map((task) => (
                        <NoticeRow 
                            key={task.id} 
                            task={task}
                            commandModeActive={commandModeActive}
                            isSelected={selectedTasks.some(t => t.id === task.id)}
                            isHistoryView={isHistoryView} 
                            onCompleted={onTaskCompleted}
                            onUndo={onTaskUndo}
                            onCommandAction={(selectedTask) => {
                                setSelectedTasks(prev => 
                                    prev.some(t => t.id === selectedTask.id) 
                                        ? prev.filter(t => t.id !== selectedTask.id) 
                                        : [...prev, selectedTask] 
                                );
                            }}
                        />
                    ))}
                </div>
            ) : (
                /* The Empty State (CSS Fade-in) */
                <div className="flex flex-col items-center justify-center h-64 text-content-muted mt-10 animate-in fade-in zoom-in-95 duration-300">
                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                        <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-2xl animate-pulse"></div>
                        <div className="absolute inset-0 bg-surface-elevated rounded-full border border-glass-border"></div>
                        <Sparkles size={36} className="text-brand-primary relative z-10" />
                    </div>
                    <h2 className="text-xl font-bold text-content drop-shadow-sm">Workspace Clear</h2>
                    <p className="text-xs text-content-muted text-center mt-2 uppercase tracking-widest leading-relaxed">
                        {isHistoryView ? `No history for ${selectedSession}` : `No ${activeFilter !== 'All' ? activeFilter : ''} notices pending`}
                    </p>
                </div>
            )}
        </div>
    );
}
