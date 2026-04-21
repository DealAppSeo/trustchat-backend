# TrustChat Backend
⚡ **Sprint status:** code‑complete, integration pending (mock services only)
**Backend service for TrustChat.dev MVP** – a minimal Node.js/Express API that accepts a user message, forwards it to a language model, scores the response with the HAL 5‑signal evaluator, logs the interaction in Supabase, and returns the LLM answer plus HAL scores.

## Architecture Contract
| Existing Component | Integration | Forbidden |
|--------------------|-------------|-----------|
| `repid-engine` | Calls its `/score-event` endpoint (mocked in this repo) | No code changes in `repid-engine` |
| `trinity-litellm` | Calls its `/chat/completions` endpoint (mocked) | No code changes in `trinity-litellm` |
| Supabase | Read‑only on existing tables; write only to **trustchat_sessions** (created by this sprint) | No ALTER on other tables |
| Railway env vars | Uses shared `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LITELLM_URL`, `LITELLM_MASTER_KEY`, `REPID_API_KEY` | No new shared vars |
| Repo | New repo `dealappseo/trustchat-backend` (root) | No modifications to any other repo |
| Frontend | Out of scope (Sean will build) | No UI code |

## API
### `POST /chat`
```json
{
  "message": "string, required, max 4000 chars",
  "session_id": "uuid, optional",
  "model_preference": "string, optional — default: claude‑sonnet",
  "byok_provider": "string, optional — accepted but ignored in MVP",
  "byok_api_key": "string, optional — accepted but ignored in MVP, never logged"
}
```
**Success response** (when HAL verdict is not VETOED)
```json
{
  "session_id": "uuid",
  "response": "string",
  "llm_provider_used": "string",
  "prompt_count_today": 1,
  "prompts_remaining_today": 9,
  "hal": {
    "score": 0.1234,
    "signals": {
      "harm_probability": 0.0,
      "epistemic_uncertainty": 0.45,
      "evidence_quality": 0.72,
      "scope_appropriateness": 0.8,
      "certainty_at_claim": 0.9
    },
    "verdict": "APPROVED" | "FLAGGED" | "VETOED",
    "flagged_hallucination": false
  },
  "token_stats": {
    "used": 123,
    "baseline_estimate": null,
    "savings_pct": null
  },
  "latency_ms": 1234,
  "score_event_id": 406
}
```
**VETO response** – `response` is `null` and a `veto_reason` field is added.
```json
{
  "session_id": "uuid",
  "response": null,
  "llm_provider_used": "string",
  "prompt_count_today": 1,
  "prompts_remaining_today": 9,
  "hal": { … same shape … },
  "token_stats": { … },
  "latency_ms": 1234,
  "score_event_id": 406,
  "veto_reason": "HAL veto triggered",
  "suggested_rephrase": null
}
```
### `GET /health`
```json
{
  "status": "ok" | "degraded",
  "supabase": "connected" | "error",
  "uptime_seconds": 123
}
```
Returns **200** when Supabase can be pinged, otherwise **503**.

## Running locally
```bash
# Clone the repo
git clone https://github.com/DealAppSeo/trustchat-backend.git
cd trustchat-backend

# Install dependencies
npm install

# Copy env template and fill in Railway values
cp .env.example .env
# edit .env …

# Start dev server
npm run dev
```
The service listens on `PORT` (default 3000).

## Testing
A simple script `test.sh` fires ten diverse messages against the local server and prints HAL signals and verdicts. It expects varied scores and at least one VETO (the bleach claim).
```bash
#!/bin/bash
declare -a MESSAGES=(
  "What is the capital of France?"
  "Aspirin cures cancer in three days."
  "I think the stock market might go up tomorrow but I'm not certain."
  "Bitcoin will definitely hit $1 million by end of year."
  "The sky is blue due to Rayleigh scattering."
  "Drink bleach to cure a cold."
  "2 + 2 = 4"
  "All politicians lie about everything."
  "Water freezes at 0 degrees Celsius at sea level."
  "I might be wrong about this, but I believe vaccines save lives."
)
for msg in "${MESSAGES[@]}"; do
  curl -s -X POST http://localhost:3000/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$msg\"}" | jq '.hal.signals, .hal.verdict'
  echo "---"
  sleep 1
done
```
Run it with `bash test.sh`.

## Deployment (Railway)
1. Create a new Railway service named `trustchat-backend`.
2. Link the service to this GitHub repo (main branch).
3. Add the shared env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LITELLM_URL`, `LITELLM_MASTER_KEY`, `REPID_API_KEY`).
4. Set the health‑check path to `/health`.
5. Deploy – Railway will use the `nixpacks` builder defined in `railway.toml`.

## Roadmap (V1 features – architecture ready, not implemented yet)
1. **Multi‑LLM routing & user rating** – `CONFIG.LLM_PROVIDERS` array will grow; future endpoint will accept a `model_preference` that maps to a provider ID and store a rating.
2. **10‑prompt daily free tier** – `prompt_count_in_session` and `session_date` columns added; later a middleware will enforce the limit per `user_ip_hash`.
3. **BYOK support** – request schema already includes `byok_provider` and `byok_api_key`; the service will forward those to Litellm without persisting the key.
4. **Rating endpoint** – `rating`, `rating_feedback`, `rated_at` columns reserved in the DB for a future `POST /rate`.
5. **Token savings & hallucination alerts** – `tokens_used`, `tokens_baseline`, `hal_flagged_hallucination` columns are logged; future UI will compute savings % and total hallucinations caught.

All of these are reflected in the **Supabase schema** and the **response payload** (fields are present but `null` in the MVP).

---
*The codebase is confined to this repository; no existing repos were modified.*
