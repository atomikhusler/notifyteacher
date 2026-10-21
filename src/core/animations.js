// src/core/animations.js

// 1. Centralized Motion Tokens (Durations in seconds)
export const appTimings = {
    fast: 0.15,
    base: 0.2,   // Standard snappy UI duration
    slow: 0.3
};

// 2. Elite Prime Physics
export const eliteSpring = { 
    type: "spring", 
    stiffness: 500, 
    damping: 35 
};

export const swipeSpring = { 
    type: "spring", 
    stiffness: 400, 
    damping: 30 
};

// 3. The GPU Swipe Exit
export const gpuSwipeExit = {
    initial: { opacity: 1, scale: 1, height: 'auto', marginBottom: 12 },
    exit: { 
        opacity: 0, 
        scale: 0.9, 
        height: 0, 
        marginBottom: 0,
        paddingTop: 0, 
        paddingBottom: 0,
        transition: { duration: appTimings.base, ease: "easeInOut" } 
    }
};

// 4. CSS-Based GPU Staggering
export const getGpuStagger = (index) => ({
    animationName: 'slideUpFade',
    animationDuration: `${appTimings.slow}s`,
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    animationDelay: `${index * 0.05}s`,
    animationFillMode: 'both'
});
