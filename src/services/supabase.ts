import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

export const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY);
