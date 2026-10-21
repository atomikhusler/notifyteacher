// src/core/timeEngine.js

// Safely parses a date string (handles both YYYY-MM-DD from DB or DD-MM-YYYY) 
// locally to prevent UTC timezone drift shifts.
export function safeParseLocal(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        let year, month, day;
        // Check if year is first (YYYY-MM-DD) or last (DD-MM-YYYY)
        if (parts[0].length === 4) {
            year = parts[0]; month = parts[1]; day = parts[2];
        } else {
            day = parts[0]; month = parts[1]; year = parts[2];
        }
        return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
}

export function calculateTimeDelta(deadlineDateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = safeParseLocal(deadlineDateString);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline - today;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let urgencyStatus = "safe";
  let colorToken = "emerald";

  if (daysRemaining < 0) {
    urgencyStatus = "past";
    colorToken = "zinc";
  } else if (daysRemaining >= 0 && daysRemaining <= 2) {
    urgencyStatus = "critical";
    colorToken = "red";
  } else if (daysRemaining >= 3 && daysRemaining <= 5) {
    urgencyStatus = "warning";
    colorToken = "yellow";
  }

  // Formatting strictly to Indian Standard: DD-MM-YYYY
  const dd = String(deadline.getDate()).padStart(2, '0');
  const mm = String(deadline.getMonth() + 1).padStart(2, '0');
  const yyyy = deadline.getFullYear();
  const formattedDate = `${dd}-${mm}-${yyyy}`;

  return {
    daysRemaining,
    urgencyStatus,
    colorToken,
    formattedDate
  };
}

export function getCurrentSession(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; 
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function isInSession(dateString, sessionString) {
    if (!dateString || !sessionString) return false;
    const taskDate = safeParseLocal(dateString);
    const [startYear, endYear] = sessionString.split('-');
    const sessionStart = new Date(startYear, 3, 1); // April 1st
    const sessionEnd = new Date(endYear, 2, 31, 23, 59, 59); // March 31st
    return taskDate >= sessionStart && taskDate <= sessionEnd;
}

// Dynamically extracts only the academic sessions that actually exist in your data
export function extractDynamicSessions(tasks) {
    const current = getCurrentSession();
    const sessionSet = new Set([current]); // Guarantee current session is always an option
    
    tasks.forEach(task => {
        if (task.deadline_date) {
            const taskDate = safeParseLocal(task.deadline_date);
            sessionSet.add(getCurrentSession(taskDate));
        }
    });

    // Sort descending (e.g., 2026-2027, then 2025-2026)
    return Array.from(sessionSet).sort((a, b) => b.localeCompare(a));
}
