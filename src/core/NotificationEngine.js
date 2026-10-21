// src/core/NotificationEngine.js
// Assuming you use Capacitor or a similar native bridge for notifications.
// We will route this through your existing hardwareBridge if needed.

/**
 * --- SECTION 1: THE ESCALATION MATH ---
 * Calculates the exact timestamps for the 4-day to 1-day alerts.
 */
function calculateAlertTimes(deadlineDate) {
    const deadline = new Date(deadlineDate);
    const times = [];

    // T-4, T-3, T-2 Days (Scheduled for 9:00 AM)
    for (let i = 4; i >= 2; i--) {
        const alertTime = new Date(deadline);
        alertTime.setDate(alertTime.getDate() - i);
        alertTime.setHours(9, 0, 0, 0); // 9:00 AM
        
        // Only schedule if the time is still in the future
        if (alertTime > new Date()) {
            times.push({ idOffset: i, time: alertTime, type: 'daily' });
        }
    }

    // --- SECTION 2: THE FINAL DAY DOUBLE-TAP ---
    // T-1 Day (1 day remaining): Scheduled at 8:00 AM and 1:00 PM
    const dayBefore8AM = new Date(deadline);
    dayBefore8AM.setDate(dayBefore8AM.getDate() - 1);
    dayBefore8AM.setHours(8, 0, 0, 0);
    
    if (dayBefore8AM > new Date()) {
        times.push({ idOffset: 18, time: dayBefore8AM, type: 'urgent_morning' });
    }

    const dayBefore1PM = new Date(deadline);
    dayBefore1PM.setDate(dayBefore1PM.getDate() - 1);
    dayBefore1PM.setHours(13, 0, 0, 0);

    if (dayBefore1PM > new Date()) {
        times.push({ idOffset: 113, time: dayBefore1PM, type: 'urgent_afternoon' });
    }

    return times;
}

/**
 * Schedules all background notifications for a newly created or updated task.
 */
export async function scheduleTaskEscalation(task) {
    if (!task.deadline_date || task.isCompleted) return;

    const alertTimes = calculateAlertTimes(task.deadline_date);
    
    for (const alert of alertTimes) {
        // We generate a unique numeric ID for each specific alert so we can cancel it later
        const uniqueNotificationId = parseInt(task.id.replace(/\D/g, '').substring(0, 5)) + alert.idOffset;

        let title = "Upcoming Notice";
        let body = `${task.title} is due in a few days.`;

        if (alert.type === 'urgent_morning') {
            title = "⚠️ URGENT: Due Tomorrow";
            body = `Action required: ${task.title}`;
        } else if (alert.type === 'urgent_afternoon') {
            title = "🚨 FINAL REMINDER";
            body = `${task.title} is due tomorrow. Please complete it today.`;
        }

        // Send to your native hardware bridge (e.g., Capacitor Local Notifications)
        // Example: await LocalNotifications.schedule({ ... })
        console.log(`[Notification Engine] Scheduled: ${title} for ${alert.time}`);
    }
}

/**
 * --- SECTION 3: THE CANCELLATION TRIGGER ---
 * Instantly wipes all scheduled notifications for a task when it is marked 'Done'.
 */
export async function cancelTaskEscalation(taskId) {
    // Tell the native hardware bridge to cancel all pending alerts tied to this Task ID
    // Example: await LocalNotifications.cancel({ notifications: [{ id: taskId }] })
    console.log(`[Notification Engine] Cancelled all pending alerts for task: ${taskId}`);
}

