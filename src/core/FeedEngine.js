import { supabase } from './supabaseClient.js';
import { secureLocalStoreRead, secureLocalStoreWrite } from './hardwareBridge.js';

// The secure local key for our Shadow State dictionary
const SHADOW_CACHE_KEY = 'notify_global_shadow_cache';

/**
 * --- INTERNAL HELPER: GET SHADOW CACHE ---
 * Ensures we always return a valid object, even if storage is empty.
 */
async function getShadowCache() {
    const cache = await secureLocalStoreRead(SHADOW_CACHE_KEY);
    return (cache && typeof cache === 'object') ? cache : {};
}

/**
 * --- SECTION 1: THE MASTER MIXER ---
 * Fetches from Supabase, mixes with local shadow state, and cleans up dead data.
 */
export async function fetchAndMixGlobalFeed() {
    try {
        // 1. Fetch Immutable Source of Truth (With Time Bomb & Privacy Protections)
        const { data: liveNotices, error } = await supabase
            .from('global_notices')
            .select('*')
            .eq('isGlobal', true)
            .eq('syncStatus', 'published') // Security: Hide L1 pending drafts from normal users
            .order('deadline_date', { ascending: true })
            .limit(150); // Performance: Prevent downloading years of old data

        if (error) throw error;
        
        const notices = liveNotices || [];
        
        // 2. Fetch personal completion states from phone memory
        const shadowCache = await getShadowCache();
        
        // 3. Garbage Collection Setup
        let cacheNeedsCleaning = false;
        const activeSupabaseIds = new Set(notices.map(n => n.id));

        // 4. THE MIX: Inject local state into global data
        const mixedFeed = notices.map(notice => {
            if (shadowCache[notice.id]) {
                return { 
                    ...notice, 
                    isCompleted: true, 
                    completed_at: shadowCache[notice.id] 
                };
            }
            return { ...notice, isCompleted: false, completed_at: null };
        });

        // 5. THE SWEEP: Remove cached IDs that Admins deleted from Supabase (or fell off the 150 limit)
        for (const cachedId of Object.keys(shadowCache)) {
            if (!activeSupabaseIds.has(cachedId)) {
                delete shadowCache[cachedId];
                cacheNeedsCleaning = true;
            }
        }

        // Save the cleaned cache back to the phone if ghosts were found
        if (cacheNeedsCleaning) {
            await secureLocalStoreWrite(SHADOW_CACHE_KEY, shadowCache);
        }

        return mixedFeed;

    } catch (error) {
        console.error("FeedEngine Mixer Error:", error);
        return []; // Fail safely, allowing offline mode to continue rendering local vault
    }
}

/**
 * --- SECTION 2: THE STATUS TOGGLE ---
 * Flips a task between "Done" and "Not Done" ONLY on the local device.
 * Never touches Supabase, saving database calls and preserving privacy.
 */
export async function toggleNoticeCompletion(taskId, isCompleted) {
    try {
        const shadowCache = await getShadowCache();
        let timestamp = null;

        if (isCompleted) {
            // Mark as done: Save current ISO time
            timestamp = new Date().toISOString();
            shadowCache[taskId] = timestamp;
        } else {
            // Undo: Delete from dictionary
            delete shadowCache[taskId];
        }

        // Write the updated dictionary back to the phone
        const success = await secureLocalStoreWrite(SHADOW_CACHE_KEY, shadowCache);
        
        if (!success) throw new Error("Failed to write to secure storage");

        // Return the timestamp so the UI knows exactly what time to display in History
        return { success: true, completed_at: timestamp };

    } catch (error) {
        console.error("FeedEngine Local Toggle Error:", error);
        return { success: false, completed_at: null };
    }
}
