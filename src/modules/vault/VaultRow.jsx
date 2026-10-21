import React, { useState } from 'react';
import { MoreVertical, User, ChevronDown, CheckCircle, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';

export function VaultRow({ task, onOptionsClick, onCompleted, onUndo }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleRowTap = () => {
        triggerHaptic('light').catch(()=>{});
        setIsExpanded(!isExpanded);
    };

    const handleAction = async (e, actionFn, requireHaptic = 'medium') => {
        e.stopPropagation(); 
        await triggerHaptic(requireHaptic);
        if (actionFn) await actionFn(task.id);
    };

    const hasDetails = !!(task.description || task.letter_no);
    const author = task.author_name || task.owner || 'Me';

    // --- SMART STATUS TAG ENGINE ---
    const getStatusTag = () => {
        if (task.syncStatus === 'published') return { label: 'Published', style: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' };
        if (task.syncStatus === 'pending') return { label: 'Pending', style: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20' };
        if (task.syncStatus === 'rejected') return { label: 'Rejected', style: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20' };
        return { label: 'Draft', style: 'bg-content-muted/10 text-content-muted border-glass-border' };
    };
    const tag = getStatusTag();

    return (
        <div className="relative w-full h-max mb-2.5 z-10 overflow-hidden rounded-[20px]">
            <div
                onClick={handleRowTap}
                className={`gpu-accelerate px-4 py-3.5 relative z-10 bg-surface hover:brightness-95 border border-glass-border shadow-expressive transition-colors duration-300 w-full cursor-pointer ${task.isCompleted ? 'opacity-60' : 'opacity-100'}`}
                style={{ borderRadius: '20px' }}
            >
                {/* --- SECTION 1: VAULT HEADER --- */}
                <div className="flex justify-between items-start pointer-events-none">
                    
                    {/* Title & Author */}
                    <div className="flex flex-col gap-1.5 pr-3 flex-1">
                        <h3 className={`text-content font-bold text-[15px] leading-snug break-words tracking-tight ${task.isCompleted ? 'line-through text-content-muted' : ''}`}>
                            {task.title}
                        </h3>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-content-muted">
                            <User size={10} /> By {author}
                        </span>
                    </div>
                    
                    {/* Date, 3-Dot, and Status Badge */}
                    <div className="flex flex-col items-end flex-shrink-0 gap-1.5">
                        <div className="flex items-start gap-1">
                            <span className="text-[10px] font-semibold text-content-muted pt-1">
                                {task.isCompleted && task.completed_at 
                                    ? `Done • ${new Date(task.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                                    : task.formattedDate
                                }
                            </span>
                            
                            {onOptionsClick && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onOptionsClick(task); }} 
                                    className="pointer-events-auto p-1.5 -mr-1 -mt-1 text-content-muted hover:text-content bg-surface-elevated rounded-md border border-glass-border shadow-sm active:scale-90 transition-transform"
                                >
                                    <MoreVertical size={14} />
                                </button>
                            )}
                        </div>
                        
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${tag.style}`}>
                            {tag.label}
                        </span>
                    </div>
                </div>

                {/* --- SECTION 2: HIDDEN DRAWER --- */}
                <div className={`grid transition-all duration-300 ease-out overflow-hidden ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2.5 pt-3 border-t border-glass-border/30' : 'grid-rows-[0fr] opacity-0'}`}>
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
