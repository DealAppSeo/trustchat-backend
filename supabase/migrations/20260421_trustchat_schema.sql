CREATE TABLE tc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT,
  display_name TEXT,
  session_repid INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tc_catches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES tc_sessions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  question TEXT NOT NULL,
  llm_choice TEXT NOT NULL,
  llm_answer TEXT,
  hal_answer TEXT,
  evidence_quality NUMERIC(3,2),
  certainty_at_claim NUMERIC(3,2),
  epistemic_uncertainty NUMERIC(3,2),
  harm_probability NUMERIC(3,2),
  scope_appropriateness NUMERIC(3,2),
  dissonance_tier TEXT,
  verdict TEXT NOT NULL,
  user_vote TEXT,
  is_public BOOLEAN DEFAULT true,
  repid_delta INTEGER DEFAULT 0
);

CREATE TABLE tc_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catch_id UUID REFERENCES tc_catches(id),
  session_id UUID REFERENCES tc_sessions(id),
  voted_for TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tc_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  session_id UUID REFERENCES tc_sessions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'magic_link'
);

CREATE INDEX idx_catches_public ON tc_catches(is_public, created_at DESC);
CREATE INDEX idx_catches_verdict ON tc_catches(verdict, created_at DESC);
CREATE INDEX idx_sessions_email ON tc_sessions(email);

ALTER TABLE tc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_catches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on public catches" ON tc_catches FOR SELECT USING (is_public = true);

-- In a real app we'd have more policies. For this MVP, we rely on service role for server-side mutations.

-- Inserting seed data
INSERT INTO tc_sessions (id, email, question_count) VALUES 
('11111111-1111-1111-1111-111111111111', 'seed@trustchat.dev', 5);

INSERT INTO tc_catches (id, session_id, question, llm_choice, llm_answer, hal_answer, verdict, is_public) VALUES
('22222222-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Who won the 2024 Nobel Peace Prize?', 'claude', 'I won it.', 'The 2024 Nobel Peace Prize was awarded to...', 'HALLUCINATION_CAUGHT', true),
('33333333-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Who wrote Hamlet?', 'gpt4', 'William Shakespeare wrote Hamlet.', 'William Shakespeare is universally recognized by scholars as the author of Hamlet.', 'TRUTH_VERIFIED', true),
('44444444-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Is cold fusion real?', 'gemini', 'Yes, it is used in cars today.', 'Cold fusion remains unproven and is not used in commercial products.', 'HALLUCINATION_CAUGHT', true),
('55555555-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Will AI take over next year?', 'claude', 'Most likely, a lot of experts predict it.', 'There is broad disagreement; timelines vary greatly among experts.', 'HAL_FLAGGED_UNCERTAIN', true),
('66666666-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'What is the speed of light?', 'gpt4', '299,792,458 meters per second.', '299,792,458 meters per second in a vacuum.', 'TRUTH_VERIFIED', true);
