// This function creates a unique, unchangeable number ID for native phone alarms
export function generateDeterministicHash(title, deadline, author_id) {
  // FIX: Using proper template literal backticks to combine the strings
  const rawString = `${title}-${deadline}-${author_id}`;
  let hash = 0;

  // Loop through the string to create a unique integer out of the text
  for (let i = 0; i < rawString.length; i++) {
    const charCode = rawString.charCodeAt(i);
    // Shift left by 5 bits, subtract current hash, add char code
    hash = (hash << 5) - hash + charCode;
    // Force to 32-bit integer for Capacitor native OS compatibility
    hash &= hash;
  }

  // Ensure absolute positive integer for OS alarm schedulers (no negative numbers)
  return Math.abs(hash);
}
