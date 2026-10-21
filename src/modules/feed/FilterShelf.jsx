import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, Activity, Flame, CalendarDays, Calendar } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';
import { getCurrentSession, isInSession } from '../../core/timeEngine.js';

const filters = [
    { id: 'All', icon: Layers },
    { id: 'Ongoing', icon: Activity, color: 'text-blue-400', badgeColor: 'bg-blue-400' },
    { id: 'Urgent', icon: Flame, color: 'text-brand-danger', badgeColor: 'bg-brand-danger' },
    { id: 'Upcoming', icon: CalendarDays, color: 'text-brand-warning', badgeColor: 'bg-brand-warning' },
    { id: 'This Month', icon: Calendar, color: 'text-purple-400', badgeColor: 'bg-purple-400' }
];

export function FilterShelf({ activeFilter, setActiveFilter, tasks = [] }) {
    const handleTap = async (id) => {
        if (activeFilter === id) return;
        triggerHaptic('light').catch(() => {});
        setActiveFilter(id);
    };

    const badges = useMemo(() => {
        const currentSession = getCurrentSession();
        const activeTasks = tasks.filter(t => t.isGlobal && !t.isCompleted && isInSession(t.deadline_date, currentSession));
        
        return {
            Ongoing: activeTasks.some(t => t.daysRemaining === 0),
            Urgent: activeTasks.some(t => t.daysRemaining >= 1 && t.daysRemaining <= 3),
            Upcoming: activeTasks.some(t => t.daysRemaining >= 4 && t.daysRemaining <= 10)
        };
    }, [tasks]);

    return (
        <div className="relative w-full">
            <div className="flex overflow-x-auto gap-2 px-4 pb-2 pt-1 overscroll-x-contain snap-x">
                {filters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;
                    const hasBadge = badges[filter.id];
                    
                    return (
                        <button
                            key={filter.id}
                            onClick={() => handleTap(filter.id)}
                            /* THE FIX: Replaced hardcoded text with semantic variables */
                            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-colors whitespace-nowrap snap-start z-10 ${
                                isActive ? 'text-app-base' : 'text-content-muted hover:text-content'
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeFilterPill"
                                    /* THE FIX: bg-content dynamically changes based on theme */
                                    className="absolute inset-0 bg-content rounded-full -z-10 shadow-sm"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            
                            <Icon 
                                size={12} 
                                /* THE FIX: Active icon pulls the app-base color */
                                className={isActive ? 'text-app-base' : filter.color || 'text-content-muted'} 
                                strokeWidth={2.5} 
                            />
                            <span className="tracking-wider uppercase">{filter.id}</span>
                            
                            {hasBadge && !isActive && (
                                <span className="absolute top-0.5 right-0.5 flex h-1.5 w-1.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${filter.badgeColor || 'bg-brand-primary'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 shadow-sm ${filter.badgeColor || 'bg-brand-primary'}`}></span>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
