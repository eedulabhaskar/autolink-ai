
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjghdbrqwbnzebeawvfg.supabase.co';
const supabaseKey = 'sb_publishable_cecJvTPntPgw9VfmwN5eCg_8sOx4Pq0';

/**
 * Initialize Supabase Client
 * This client is used to interact with the 'orders' table.
 * Make sure to create the 'orders' table in your Supabase dashboard with the following columns:
 * id (uuid), user_email (text), user_name (text), plan_id (text), amount (decimal), status (text), created_at (timestamp)
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
