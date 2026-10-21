import { supabase, adminActionRpc } from '../../core/supabaseClient.js';

// --- NOTIFIER & STAFF MODERATION ---

export async function fetchApplicants() {
  const { data, error } = await supabase.from('applicant_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchActiveStaff() {
  const { data, error } = await supabase.from('authorizations').select('*').eq('is_banned', false).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRestrictedStaff() {
  const { data, error } = await supabase.from('authorizations').select('*').eq('is_banned', true).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function executeApproveApplicant(applicantId) {
    const { data: applicant, error: fetchError } = await supabase.from('applicant_requests').select('*').eq('id', applicantId).single();
    if (fetchError) throw fetchError;

    const { error: insertError } = await supabase.from('authorizations').insert([{ 
        email: applicant.email, 
        assigned_name: applicant.full_name,
        role_level: 1, 
        is_banned: false 
    }]);
    if (insertError) throw insertError;

    const { error: deleteError } = await supabase.from('applicant_requests').delete().eq('id', applicantId);
    if (deleteError) throw deleteError;
    return true;
}

export async function executeSoftBan(targetId) { return await adminActionRpc('ban', targetId); }
export async function executeBanAndPurge(targetId) { return await adminActionRpc('ban_and_purge', targetId); }
export async function executeReinstate(targetId) { return await adminActionRpc('reinstate', targetId); }

// --- NOTICE APPROVAL & MODERATION (NEW) ---

export async function fetchPendingNotices() {
    const { data, error } = await supabase
        .from('global_notices')
        .select('*')
        .eq('syncStatus', 'pending')
        .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
}

export async function executeApproveNotice(noticeId) {
    const { error } = await supabase.from('global_notices').update({ syncStatus: 'published' }).eq('id', noticeId);
    if (error) {
        console.error("Approve Notice Error:", error);
        return false;
    }
    return true;
}

export async function executeRejectNotice(noticeId) {
    const { error } = await supabase.from('global_notices').update({ syncStatus: 'rejected' }).eq('id', noticeId);
    if (error) {
        console.error("Reject Notice Error:", error);
        return false;
    }
    return true;
}

// --- TASK PUBLISHING UTILS ---

const cleanseTaskForDatabase = (task) => {
    const { colorToken, urgencyStatus, daysRemaining, formattedDate, _isShadowDraft, ...pureData } = task;
    return pureData;
};

export async function executePublishTask(task, userRole) {
    const payload = cleanseTaskForDatabase({ ...task, isGlobal: true });
    if (userRole === 1) payload.syncStatus = 'pending';
    if (userRole >= 2) payload.syncStatus = 'published';

    const { error } = await supabase.from('global_notices').insert([payload]);
    if (error) {
        console.error("Publish Error:", error);
        return false;
    }
    return true;
}

export async function executeForceEditTask(updatedTask) {
    const cleanPayload = cleanseTaskForDatabase(updatedTask);
    const { error } = await supabase.from('global_notices').update(cleanPayload).eq('id', cleanPayload.id);
    if (error) return false;
    return true;
}

export async function executePurgeTask(taskId) {
    const { error } = await supabase.from('global_notices').delete().eq('id', taskId);
    if (error) return false;
    return true;
}
// =====================================================================
// NEW MASTER BLUEPRINT ACTIONS 
// =====================================================================

/**
 * executeRejectApplicant: 
 * The "Silent Rejection". Updates the applicant's status to 'rejected' 
 * instead of deleting the row, so they see a polite declined message.
 */
export const executeRejectApplicant = async (appId) => {
    const { error } = await supabase
        .from('applicant_requests')
        .update({ status: 'rejected' })
        .eq('id', appId);
        
    if (error) {
        console.error("Error rejecting applicant:", error);
        throw error;
    }
    return true;
};

/**
 * executePromoteUser: 
 * Upgrades a user's role_level.
 * (Note: If your users are stored in a table other than 'profiles', 
 * change 'profiles' below to match your actual table name).
 */
export const executePromoteUser = async (userId, newRole, adminId) => {
    // We pass adminId here so you can log WHO promoted this user later if you want!
    const { error } = await supabase
        .from('profiles') 
        .update({ role_level: newRole })
        .eq('id', userId);
        
    if (error) {
        console.error("Error promoting user:", error);
        throw error;
    }
    return true;
};

