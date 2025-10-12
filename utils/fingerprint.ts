import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize FingerprintJS
let fpPromise: Promise<any> | null = null;

const initFingerprint = () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
};

// Get browser fingerprint
export const getBrowserFingerprint = async () => {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    
    return {
      fingerprintId: result.visitorId,
      components: result.components,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('Error getting fingerprint:', error);
    return null;
  }
};

// Get device information
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenResolution = `${screen.width}x${screen.height}`;
  const colorDepth = screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Detect browser
  let browserName = 'Unknown';
  if (userAgent.includes('Chrome')) browserName = 'Chrome';
  else if (userAgent.includes('Firefox')) browserName = 'Firefox';
  else if (userAgent.includes('Safari')) browserName = 'Safari';
  else if (userAgent.includes('Edge')) browserName = 'Edge';
  else if (userAgent.includes('Opera')) browserName = 'Opera';

  // Detect OS
  let osName = 'Unknown';
  if (userAgent.includes('Windows')) osName = 'Windows';
  else if (userAgent.includes('Mac')) osName = 'macOS';
  else if (userAgent.includes('Linux')) osName = 'Linux';
  else if (userAgent.includes('Android')) osName = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) osName = 'iOS';

  // Detect device type
  let deviceType = 'Desktop';
  if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
  else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

  return {
    browser: browserName,
    os: osName,
    platform,
    deviceType,
    language,
    screenResolution,
    colorDepth,
    timezone,
    userAgent
  };
};

// Get IP address (using external service)
export const getIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return 'unknown';
  }
};

// Check if fingerprint is already registered for another user
export const checkFingerprintConflict = async (
  fingerprintId: string,
  userId: string,
  competitionId?: string
): Promise<{ conflict: boolean; existingUser?: string; message?: string }> => {
  try {
    let query = supabase
      .from('competition_browser_fingerprints')
      .select('user_id, fingerprint_id, created_at')
      .eq('fingerprint_id', fingerprintId)
      .neq('user_id', userId);

    // If checking for a specific competition
    if (competitionId) {
      query = query.eq('competition_id', competitionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking fingerprint:', error);
      return { conflict: false };
    }

    if (data && data.length > 0) {
      return {
        conflict: true,
        existingUser: data[0].user_id,
        message: 'This device is already registered to another account.'
      };
    }

    return { conflict: false };
  } catch (error) {
    console.error('Error in checkFingerprintConflict:', error);
    return { conflict: false };
  }
};

// Save fingerprint to database
export const saveBrowserFingerprint = async (
  competitionId: string,
  userId: string,
  fingerprintId: string,
  deviceInfo: any,
  ipAddress: string
) => {
  try {
    const { data, error } = await supabase
      .from('competition_browser_fingerprints')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        fingerprint_id: fingerprintId,
        user_agent: navigator.userAgent,
        ip_address: ipAddress,
        device_info: deviceInfo,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving fingerprint:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in saveBrowserFingerprint:', error);
    return { success: false, error };
  }
};

// Log suspicious fingerprint activity
export const logFingerprintCheat = async (
  competitionId: string,
  userId: string,
  sessionId: string | null,
  fingerprintId: string,
  conflictDetails: any
) => {
  try {
    const { error } = await supabase
      .from('competition_cheat_actions')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        action_type: 'flag',
        reason: `Duplicate device detected: Fingerprint ${fingerprintId} already registered to user ${conflictDetails.existingUser}. Device conflict detected.`,
      });

    if (error) {
      console.warn('Could not log fingerprint cheat action:', error);
      return false;
    }

    console.log('✅ Cheat action logged: Duplicate device');
    return true;
  } catch (error) {
    console.warn('Error logging fingerprint cheat:', error);
    return false;
  }
};

// Centralized cheat action logging
export const logCheatAction = async (
  competitionId: string,
  userId: string,
  actionType: 'flag' | 'block' | 'ban',
  reason: string,
  createdBy?: string
): Promise<boolean> => {
  try {
    const insertData: any = {
      competition_id: competitionId,
      user_id: userId,
      action_type: actionType,
      reason: reason,
    };

    // Add created_by if provided (for admin actions)
    if (createdBy) {
      insertData.created_by = createdBy;
    }

    const { error } = await supabase
      .from('competition_cheat_actions')
      .insert(insertData);

    if (error) {
      console.error('Error logging cheat action:', error);
      return false;
    }

    console.log(`✅ Cheat action logged: ${actionType} - ${reason}`);
    return true;
  } catch (error) {
    console.error('Error in logCheatAction:', error);
    return false;
  }
};

// Check for active sessions
export const checkActiveSession = async (userId: string): Promise<{
  hasActiveSession: boolean;
  sessionData?: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_active_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking active session:', error);
      return { hasActiveSession: false };
    }

    if (data) {
      return {
        hasActiveSession: true,
        sessionData: data
      };
    }

    return { hasActiveSession: false };
  } catch (error) {
    console.error('Error in checkActiveSession:', error);
    return { hasActiveSession: false };
  }
};

// Create a new active session
export const createActiveSession = async (
  userId: string,
  fingerprintId: string,
  deviceInfo: any,
  competitionId: string = 'global_login'
): Promise<{ success: boolean; sessionId?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_active_sessions')
      .insert({
        user_id: userId,
        fingerprint_id: fingerprintId,
        device_info: deviceInfo,
        competition_id: competitionId,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating active session:', error);
      return { success: false };
    }

    return {
      success: true,
      sessionId: data.session_id
    };
  } catch (error) {
    console.error('Error in createActiveSession:', error);
    return { success: false };
  }
};

// Deactivate old sessions
export const deactivateOldSessions = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_active_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error deactivating old sessions:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deactivateOldSessions:', error);
    return false;
  }
};

// Update session activity
export const updateSessionActivity = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_active_sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error updating session activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSessionActivity:', error);
    return false;
  }
};

// Handle force login (login anyway)
export const handleForceLogin = async (
  userId: string,
  fingerprintId: string,
  deviceInfo: any,
  competitionId: string = 'global_login'
): Promise<{ success: boolean; sessionId?: string }> => {
  try {
    // Deactivate all old sessions
    await deactivateOldSessions(userId);

    // Create new session
    const result = await createActiveSession(userId, fingerprintId, deviceInfo, competitionId);

    return result;
  } catch (error) {
    console.error('Error in handleForceLogin:', error);
    return { success: false };
  }
};

// Main function to handle fingerprint check and registration
export const handleFingerprintCheck = async (
  competitionId: string,
  userId: string,
  sessionId: string | null = null
): Promise<{
  allowed: boolean;
  message?: string;
  fingerprintId?: string;
}> => {
  try {
    // Get fingerprint
    const fingerprintData = await getBrowserFingerprint();
    if (!fingerprintData) {
      return {
        allowed: true,
        message: 'Could not verify device fingerprint'
      };
    }

    const { fingerprintId } = fingerprintData;

    // Check for conflicts
    const conflict = await checkFingerprintConflict(fingerprintId, userId, competitionId);

    if (conflict.conflict) {
      // Log the cheating attempt
      await logFingerprintCheat(competitionId, userId, sessionId, fingerprintId, conflict);

      return {
        allowed: false,
        message: 'This device is already being used by another account in this competition. Multiple accounts per device are not allowed.',
        fingerprintId
      };
    }

    // Get additional device info
    const deviceInfo = getDeviceInfo();
    const ipAddress = await getIPAddress();

    // Save fingerprint
    await saveBrowserFingerprint(competitionId, userId, fingerprintId, deviceInfo, ipAddress);

    return {
      allowed: true,
      message: 'Device verified successfully',
      fingerprintId
    };
  } catch (error) {
    console.error('Error in handleFingerprintCheck:', error);
    // Allow access if fingerprinting fails (graceful degradation)
    return {
      allowed: true,
      message: 'Device verification unavailable'
    };
  }
};
