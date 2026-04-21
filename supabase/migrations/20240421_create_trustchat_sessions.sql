CREATE TABLE trustchat_sessions (
  id                      bigserial PRIMARY KEY,
  session_id              uuid NOT NULL DEFAULT gen_random_uuid(),
  session_date            date NOT NULL DEFAULT CURRENT_DATE,
  prompt_count_in_session integer NOT NULL DEFAULT 1,
  user_ip_hash            text,
  user_message            text NOT NULL,
  byok_provider           text,
  llm_provider_used       text NOT NULL,
  llm_model               text,
  llm_response            text,
  hal_score               numeric(6,4),
  hal_signals             jsonb,
  hal_verdict             text,
  hal_flagged_hallucination boolean DEFAULT false,
  tokens_used             integer,
  tokens_baseline         integer,
  latency_ms              integer,
  score_event_id          bigint,
  rating                  smallint,
  rating_feedback         text,
  rated_at                timestamptz,
  created_at              timestamptz DEFAULT NOW()
);

CREATE INDEX idx_trustchat_sessions_created_at ON trustchat_sessions(created_at DESC);
CREATE INDEX idx_trustchat_sessions_session_id ON trustchat_sessions(session_id);
CREATE INDEX idx_trustchat_sessions_session_date ON trustchat_sessions(session_date);
CREATE INDEX idx_trustchat_sessions_user_ip_hash ON trustchat_sessions(user_ip_hash, session_date);
