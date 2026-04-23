"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
exports.supabaseClient = (0, supabase_js_1.createClient)(config_1.CONFIG.SUPABASE_URL, config_1.CONFIG.SUPABASE_SERVICE_ROLE_KEY);
