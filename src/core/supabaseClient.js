// A robust, chainable mock to handle complex Supabase queries during local development
const mockChain = {
  select: function() { return this; },
  eq: function() { return this; },
  order: function() { return this; },
  limit: async function() { 
    // Return the dummy data instead of an empty array
    return {
      error: null,
      data: [
        {
          id: 'mock-1',
          title: 'Submit Final Grades',
          description: 'All grades must be submitted to the portal.',
          deadline_date: '2026-08-25',
          syncStatus: 'published',
          author_name: 'Admin Team',
          isGlobal: true
        },
        {
          id: 'mock-2',
          title: 'Staff Meeting in Hall B',
          description: 'Mandatory meeting for all senior staff members.',
          deadline_date: '2026-08-20',
          syncStatus: 'published',
          author_name: 'Principal',
          isGlobal: true
        }
      ]
    };
  },
  insert: async function() { return { error: null }; },
  update: async function() { return { error: null }; },
  delete: function() { return this; }
};

export const supabase = {
  from: () => mockChain,
  rpc: async () => ({ data: true, error: null }),
  // ADD THIS BLOCK SO THE APP DOESN'T CRASH:
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithOAuth: async () => { alert("Mock Mode: Google Auth Triggered"); return { error: null }; },
    signOut: async () => { alert("Mock Mode: Logged Out"); return { error: null }; }
  }
};

export async function adminActionRpc(actionType, targetId) {
  console.log("Mock Admin Action:", actionType, targetId);
  return true;
}
