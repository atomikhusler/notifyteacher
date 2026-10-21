import React, { useState, useRef } from 'react';
import { ChevronRight, CloudSync } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';
import { EdgeLoader } from '../../core/EdgeLoader.js';

export function SlideToSync({ onSyncAction }) {
    const containerRef = useRef(null);
    
    const [pxOffset, setPxOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // FLAWLESS h-8 (32px) MATH:
    // Track inner space = 30px (due to 1px borders).
    // Orb = 28px. 
    // Gap = 1px on all sides.
    const KNOB_SIZE = 28; 
    const OFFSET_X = 1; 
    const PADDING_TOTAL = OFFSET_X * 2; // 2px total side padding

    const handlePointerDown = (e) => {
        if (isSyncing) return;
        setIsDragging(true);
        triggerHaptic('light').catch(()=>{});
        e.target.setPointerCapture(e.pointerId); 
    };

    const handlePointerMove = (e) => {
        if (!isDragging || isSyncing || !containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - (KNOB_SIZE / 2);
        
        const currentMax = containerRect.width - KNOB_SIZE - PADDING_TOTAL;
        if (newX < 0) newX = 0;
        if (newX > currentMax) newX = currentMax;

        setPxOffset(newX);
    };

    const handlePointerUp = async (e) => {
        if (!isDragging || isSyncing) return;
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);

        const currentMax = containerRef.current.offsetWidth - KNOB_SIZE - PADDING_TOTAL;
        
        if (pxOffset > currentMax * 0.85) {
            setPxOffset(currentMax);
            await triggerHaptic('success');
            
            if (EdgeLoader) EdgeLoader.start();
            if (onSyncAction) onSyncAction();

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsSyncing(true); 
                    setPxOffset(0);     

                    setTimeout(() => {
                        setIsSyncing(false);
                        if (EdgeLoader) EdgeLoader.complete();
                        triggerHaptic('light'); 
                    }, 6000);
                });
            });
        } else {
            triggerHaptic('warning').catch(()=>{});
            setPxOffset(0);
        }
    };

    const maxOffset = containerRef.current ? containerRef.current.offsetWidth - KNOB_SIZE - PADDING_TOTAL : 250;
    const progressPercent = maxOffset > 0 ? (pxOffset / maxOffset) : 0;

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-8 bg-black/5 dark:bg-white/5 border border-glass-border rounded-full overflow-hidden select-none shadow-inner gpu-accelerate mt-2"
            style={{ touchAction: 'none' }}
        >
            {/* --- 1. IDLE HINT TEXT --- */}
            <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
                style={{ opacity: isSyncing ? 0 : Math.max(0, 1 - (progressPercent * 2)) }}
            >
                <span className="text-[11px] font-semibold tracking-wide text-content-muted/80">
                    Slide to sync
                </span>
            </div>

            {/* --- 2. SYNCING TEXT --- */}
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${isSyncing ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-primary animate-pulse flex items-center gap-1.5">
                    <CloudSync size={12} /> Synchronizing
                </span>
            </div>

            {/* --- 3. LIQUID FILL TAIL --- */}
            <div 
                className={`absolute bg-brand-primary/15 rounded-full border border-brand-primary/20
                    ${!isDragging && !isSyncing ? 'transition-all duration-300 ease-out' : ''} 
                    ${isSyncing ? 'transition-all duration-[6000ms] ease-linear' : ''}
                `}
                style={{ 
                    top: '1px', left: '1px', height: '28px', // Fixed alignment
                    width: `${pxOffset + KNOB_SIZE}px` 
                }}
            />

            {/* --- 4. THE PERFECT CIRCULAR ORB --- */}
            <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp} 
                className={`absolute bg-surface border border-glass-border flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-grab active:cursor-grabbing z-10 rounded-full glass-rim
                    ${!isDragging && !isSyncing ? 'transition-transform duration-300 ease-out' : ''}
                    ${isSyncing ? 'transition-transform duration-[6000ms] ease-linear' : ''}
                `}
                style={{ 
                    top: '1px', left: '1px', width: '28px', height: '28px', // Fixed alignment
                    transform: `translateX(${pxOffset}px)` 
                }}
            >
                <div className={`transition-transform duration-300 flex items-center justify-center ${isSyncing ? 'rotate-180 opacity-50 text-brand-primary' : 'rotate-0 text-content'}`}>
                    {isSyncing ? <CloudSync size={14} /> : <ChevronRight size={16} className="text-content-muted ml-0.5" />}
                </div>
            </div>
        </div>
    );
}
