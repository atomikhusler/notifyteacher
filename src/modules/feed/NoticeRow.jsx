import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, RotateCcw, Check, User, ChevronDown } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';

export function NoticeRow({ 
    task, commandModeActive, isSelected, isHistoryView, 
    onCompleted, onUndo, onCommandAction 
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleRowTap = () => {
        if (commandModeActive && onCommandAction) {
            triggerHaptic('light').catch(()=>{});
            onCommandAction(task);
            return;
        }
        triggerHaptic('light').catch(()=>{});
        setIsExpanded(!isExpanded);
    };

    const handleAction = async (e, actionFn, requireHaptic = 'medium') => {
        e.stopPropagation(); 
        await triggerHaptic(requireHaptic);
        if (actionFn) await actionFn(task.id);
    };

    const getHumanTime = (daysRemaining, deadlineDate) => {
        if (daysRemaining === 0) return 'Today';
        if (daysRemaining === 1) return 'Tomorrow';
        if (daysRemaining === -1) return 'Yesterday';
        if (daysRemaining > 1 && daysRemaining <= 6 && deadlineDate) {
            const dateObj = new Date(deadlineDate);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return `On ${days[dateObj.getDay()]}`;
        }
        if (daysRemaining < -1) return `${Math.abs(daysRemaining)} days ago`;
        return `${daysRemaining} days left`;
    };

    const getCompletionStamp = () => {
        const dateStr = task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : task.formattedDate;
        return `Done • ${dateStr}`;
    };

    const hasDetails = !!(task.description || task.letter_no);
    const author = task.author_name || 'Admin';

    return (
        <div className="relative w-full h-max mb-2.5 z-10 overflow-hidden rounded-[20px]">
            <div
                onClick={handleRowTap}
                className={`gpu-accelerate px-5 py-3.5 relative z-10 transition-colors duration-300 w-full cursor-pointer ${
                    commandModeActive && isSelected 
                    ? 'bg-brand-primary/10 border border-brand-primary/40 shadow-sm' 
                    : 'bg-surface hover:brightness-95 border border-glass-border shadow-expressive'
                } ${task.isCompleted ? 'opacity-60' : 'opacity-100'}`}
                style={{ borderRadius: '20px' }}
            >
                {/* --- SECTION 1: GLANCE HEADER --- */}
                <div className="flex justify-between items-start pointer-events-none">
                    
                    {/* Left side: Dot, Title, Author */}
                    <div className="flex flex-col gap-1.5 pr-3 flex-1">
                        <div className="flex items-start gap-2.5">
                            {!task.isCompleted && (
                                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                                    task.colorToken === 'red' ? 'bg-brand-danger shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' : 
                                    (task.colorToken === 'yellow' ? 'bg-brand-warning' : 'bg-brand-primary')
                                }`} />
                            )}
                            <h3 className={`text-content font-bold text-[15px] leading-snug break-words tracking-tight ${task.isCompleted ? 'line-through text-content-muted' : ''}`}>
                                {task.title}
                            </h3>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-content-muted">
                            <User size={10} /> By {author}
                        </span>
                    </div>
                    
                    {/* Right side: Command Checkbox OR Time Engine */}
                    <div className="flex flex-col items-end flex-shrink-0">
                        {commandModeActive ? (
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${isSelected ? 'bg-brand-primary border-brand-primary text-app-base' : 'border-content-muted/50'}`}>
                                {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                        ) : (
                            <div className="flex flex-col items-end gap-1">
                                <div className={`flex items-center gap-1.5 text-[11px] font-bold ${task.isCompleted || isHistoryView ? 'text-content-muted' : (task.colorToken === 'red' ? 'text-brand-danger' : 'text-brand-primary')}`}>
                                    {task.isCompleted || isHistoryView ? (
                                        <CheckCircle size={12} className="opacity-70" />
                                    ) : (
                                        task.urgencyStatus === 'critical' ? <AlertCircle size={12} /> : <Clock size={12} />
                                    )}
                                    <span className="tracking-wide">
                                        {task.isCompleted || isHistoryView ? getCompletionStamp() : getHumanTime(task.daysRemaining, task.deadline_date)}
                                    </span>
                                </div>
                                {!task.isCompleted && !isHistoryView && (
                                    <span className="text-[10px] font-semibold text-content-muted">{task.formattedDate}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- SECTION 2: HIDDEN DRAWER --- */}
                <div className={`grid transition-all duration-300 ease-out overflow-hidden ${isExpanded && !commandModeActive ? 'grid-rows-[1fr] opacity-100 mt-2.5 pt-3 border-t border-glass-border/30' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden flex flex-col">
                        
                        {/* 2A. REF Badge (Fixed: Placed above description) */}
                        {task.letter_no && (
                            <div className="mb-3">
                                <span className="text-[10px] font-mono font-bold text-brand-primary bg-surface-elevated border border-glass-border px-2.5 py-1 rounded-md shadow-sm">
                                    REF: {task.letter_no}
                                </span>
                            </div>
                        )}

                        {/* 2B. Details HTML Renderer */}
                        {task.description && (
                            <div 
                                onClick={(e) => { if (e.target.tagName === 'A') e.stopPropagation(); }}
                                className="text-[14px] text-content-muted leading-relaxed whitespace-pre-wrap pointer-events-auto mb-2
                                [&_blockquote]:border-l-4 [&_blockquote]:border-brand-primary [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:text-content-muted [&_blockquote]:bg-brand-primary/5 [&_blockquote]:rounded-r-lg
                                [&_a]:text-brand-primary [&_a]:underline [&_a]:decoration-brand-primary/40 [&_a]:font-bold"
                                dangerouslySetInnerHTML={{ __html: task.description }}
                            />
                        )}

                        {/* 2C. Ultra-Compact Action Button (Bottom Right) */}
                        <div className="flex items-center justify-end pointer-events-auto mt-1">
                            <button 
                                onClick={(e) => handleAction(e, task.isCompleted ? onUndo : onCompleted, task.isCompleted ? 'medium' : 'success')} 
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 border ${
                                    task.isCompleted 
                                    ? 'bg-surface-elevated border-glass-border text-content-muted hover:text-content' 
                                    : 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20 shadow-sm'
                                }`}
                            >
                                {task.isCompleted ? <RotateCcw size={13} /> : <CheckCircle size={13} />}
                                {task.isCompleted ? 'Undo' : 'Mark Done'}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* --- SECTION 3: EXPANSION ARROW --- */}
                {!isExpanded && hasDetails && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-none">
                        <ChevronDown size={20} className="text-brand-primary opacity-80" />
                    </div>
                )}
            </div>
        </div>
    );
}
