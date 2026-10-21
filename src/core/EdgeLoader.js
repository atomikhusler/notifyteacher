/**
 * EdgeLoader.js
 * Premium Top-Edge Progress Bar (Like YouTube / GitHub)
 * Usage:
 * EdgeLoader.start() - Call when fetching data
 * EdgeLoader.complete() - Call when data arrives
 */

class PremiumEdgeLoader {
    constructor() {
        if (typeof document === 'undefined') return;
        
        this.bar = document.createElement('div');
        this.bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: var(--app-accent, #10b981);
            box-shadow: 0 0 10px var(--app-accent, #10b981);
            z-index: 9999;
            transform-origin: left;
            transform: scaleX(0);
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
            opacity: 0;
            pointer-events: none;
            will-change: transform, opacity;
        `;
        document.body.appendChild(this.bar);
        this.timeout = null;
    }

    start() {
        if (!this.bar) return;
        clearTimeout(this.timeout);
        this.bar.style.opacity = '1';
        // Jump to 20%, then slowly crawl to 85% to simulate thinking
        this.bar.style.transform = 'scaleX(0.2)';
        this.timeout = setTimeout(() => {
            this.bar.style.transform = 'scaleX(0.85)';
            this.bar.style.transitionDuration = '10s'; // Crawl slowly
        }, 400);
    }

    complete() {
        if (!this.bar) return;
        clearTimeout(this.timeout);
        // Snap to 100% fast
        this.bar.style.transitionDuration = '0.3s';
        this.bar.style.transform = 'scaleX(1)';
        
        // Fade out and reset
        this.timeout = setTimeout(() => {
            this.bar.style.opacity = '0';
            setTimeout(() => {
                this.bar.style.transitionDuration = '0s';
                this.bar.style.transform = 'scaleX(0)';
            }, 400);
        }, 400);
    }
}

// Export a single global instance
export const EdgeLoader = new PremiumEdgeLoader();