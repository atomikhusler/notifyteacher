import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

let globalHapticsEnabled = false;

export const initHaptics = async () => {
  const val = await secureLocalStoreRead('haptics_enabled');
  globalHapticsEnabled = (val === true || val === 'true');
};

export const setGlobalHaptics = (val) => {
  globalHapticsEnabled = val;
};

export async function triggerHaptic(type = 'light') {
  if (!globalHapticsEnabled) return; 
  
  try {
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
      success: ImpactStyle.Medium,
      error: ImpactStyle.Heavy,
      warning: ImpactStyle.Medium
    };
    await Haptics.impact({ style: styleMap[type] || ImpactStyle.Light });
  } catch (error) {
    console.log(`[Haptic Fallback]: ${type}`);
  }
}

export async function scheduleTaskAlarms(task, baseHash) {
  try {
    console.log(`[Mock Alarm Scheduled] for task: ${task.title}`);
    return true;
  } catch (error) {
    return false;
  }
}

export async function cancelTaskAlarms(taskId, baseHash) {
  try {
    console.log(`[Mock Alarm Canceled] for task ID: ${taskId}`);
    return true;
  } catch (error) {
    return false;
  }
}

export async function syncAndPurgeGhostAlarms(validTaskIds) {
  try {
    console.log(`[Mock Ghost Alarms Purged]`);
    return true;
  } catch (error) {
    return false;
  }
}

export async function secureLocalStoreWrite(key, data) {
  try {
    const valueToStore = typeof data === 'object' ? JSON.stringify(data) : String(data);
    await Preferences.set({ key, value: valueToStore });
    return true;
  } catch (error) {
    console.error(`LocalStore Write Error [${key}]:`, error);
    return false;
  }
}

export async function secureLocalStoreRead(key) {
  try {
    const { value } = await Preferences.get({ key });
    if (!value) return null; 
    
    try {
      return JSON.parse(value);
    } catch (parseError) {
      return value;
    }
  } catch (error) {
    await Preferences.remove({ key });
    return null;
  }
}

export async function secureLocalStoreClear() {
  try {
    await Preferences.clear(); 
    return true;
  } catch (error) {
    console.error("Failed to clear secure storage:", error);
    return false;
  }
}
