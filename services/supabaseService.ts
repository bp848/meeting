import { Meeting, SupabaseConfig, User } from "../types";

/**
 * Saves a meeting object to a Supabase table using standard fetch
 * This avoids needing the full @supabase/supabase-js client for simple inserts
 */
export const saveMeetingToSupabase = async (meeting: Meeting, config: SupabaseConfig): Promise<void> => {
  if (!config.url || !config.key || !config.tableName) {
    throw new Error("Supabaseの設定が不完全です。URL、APIキー、テーブル名を確認してください。");
  }

  // Remove trailing slash from URL if present and trim whitespace
  const baseUrl = config.url.trim().replace(/\/$/, "");
  const apiKey = config.key.trim();
  const tableName = config.tableName.trim();
  const endpoint = `${baseUrl}/rest/v1/${tableName}`;

  // Prepare payload (convert objects/arrays to JSON-friendly format if needed, 
  // though Supabase handles JSONB well)
  const payload = {
    title: meeting.title,
    date: meeting.date,
    duration_seconds: meeting.durationSeconds,
    transcript: meeting.transcript,
    summary: meeting.summary,
    action_items: meeting.actionItems, // Assumes the table has a JSONB column named action_items
    created_at: new Date().toISOString(),
    // Include audio data if available. Note: This assumes the table has 'audio_base64' and 'mime_type' columns
    // and that the payload size doesn't exceed server limits (typically OK for short meetings, but storage buckets are better for large files)
    audio_base64: meeting.audioData || null,
    mime_type: meeting.mimeType || null
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: "Unknown error" };
      }
      console.error("Supabase Error Data:", errorData);
      throw new Error(`API Error ${response.status}: ${JSON.stringify(errorData)}`);
    }
  } catch (error: any) {
    // If it's a network error (like CORS or invalid URL domain)
    if (error.message.includes('Failed to fetch')) {
      throw new Error("接続に失敗しました。URLが正しいか、CORS設定が許可されているか確認してください。");
    }
    throw error;
  }
};

/**
 * Fetches users from a Supabase table.
 * Assumes the table has 'id' and 'name' columns.
 */
export const fetchUsersFromSupabase = async (config: SupabaseConfig): Promise<User[]> => {
  if (!config.url || !config.key || !config.usersTableName) {
    console.warn("Supabaseのユーザーテーブル設定が不完全なため、ユーザーはフェッチされません。");
    return [];
  }

  const baseUrl = config.url.trim().replace(/\/$/, "");
  const apiKey = config.key.trim();
  const usersTableName = config.usersTableName.trim();
  // Assuming a 'users' table with 'id' and 'name' columns
  const endpoint = `${baseUrl}/rest/v1/${usersTableName}?select=id,name`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Supabase Users Fetch Error Data:", errorData);
      throw new Error(`API Error ${response.status} fetching users: ${JSON.stringify(errorData)}`);
    }
    const data: User[] = await response.json();
    return data;
  } catch (error: any) {
    console.error("ユーザー情報の取得に失敗しました:", error);
    // Return empty array on error, so the app can continue without user prediction
    return []; 
  }
};