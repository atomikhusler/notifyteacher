import { secureLocalStoreRead, secureLocalStoreWrite } from './hardwareBridge.js';

const VAULT_KEY = 'notify_personal_vault';

/**
 * --- SECTION 1: LOAD VAULT ---
 * Securely reads the private drafts from the phone's memory.
 */
export async function fetchVaultTasks() {
    const data = await secureLocalStoreRead(VAULT_KEY);
    // Safety check: Ensure it always returns a list, even if it's empty
    return Array.isArray(data) ? data : [];
}

/**
 * --- SECTION 2: SAVE NEW DRAFT ---
 * Adds a new task to the local vault.
 */
export async function saveVaultTask(newTask) {
    const tasks = await fetchVaultTasks();
    tasks.push(newTask);
    return await secureLocalStoreWrite(VAULT_KEY, tasks);
}

/**
 * --- SECTION 3: UPDATE DRAFT ---
 * Finds a specific draft and updates its text, date, or completion status.
 */
export async function updateVaultTask(updatedTask) {
    const tasks = await fetchVaultTasks();
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    return await secureLocalStoreWrite(VAULT_KEY, newTasks);
}

/**
 * --- SECTION 4: DELETE DRAFT ---
 * Permanently erases a draft from the phone's memory.
 */
export async function deleteVaultTask(taskId) {
    const tasks = await fetchVaultTasks();
    const newTasks = tasks.filter(t => t.id !== taskId);
    return await secureLocalStoreWrite(VAULT_KEY, newTasks);
}

/**
 * --- SECTION 5: EXPORT VAULT DATA ---
 * Packages the user's private vault tasks into a downloadable JSON file.
 */
export async function exportVaultData(tasksToExport) {
    try {
        // Pretty-print the JSON for readability
        const dataStr = JSON.stringify(tasksToExport, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        // Create a hidden link and trigger the native browser download
        const link = document.createElement('a');
        link.href = url;
        link.download = `NotifyTeacher_Vault_${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error("Vault Export Failed:", error);
        throw error;
    }
}
