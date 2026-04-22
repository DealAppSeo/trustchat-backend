# TrustChat Backend (MVP)

**TrustChat is the consumer-facing MVP for the HyperDAG Protocol ecosystem — a live demo that shows ZKP-anchored AI reputation via HAL (Hallucination Assurance Layer) scoring.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-trustchat.dev-brightgreen?style=flat-square)](https://trustchat.dev)
[![Parent Project](https://img.shields.io/badge/Parent_Project-HyperDAG_Protocol-blue?style=flat-square)](https://github.com/DealAppSeo/hyperdag-protocol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*Author:* [Sean Goodwin](https://github.com/SeanGoodwin) | *Organization:* [DealAppSeo](https://github.com/DealAppSeo)

---

## 📖 Overview

This repository contains the Node.js/Express backend service for the TrustChat MVP. It acts as the bridging layer between raw LLM inference and the on-chain HyperDAG reputation engine. Every prompt is intercepted and scored across five distinct epistemological signals before the response is finalized. For skeptical ERC-8004 builders, this repo demonstrates how to safely route, evaluate, and anchor off-chain AI outputs using strict HAL parameters, ensuring zero-trust hallucination flagging.

## 🏗️ Architecture

```text
+-------------------+       +-----------------------+       +-------------------------+
|                   |       |                       |       |                         |
|  Client /         |------>|  TrustChat Backend    |------>|  LiteLLM (Inference)    |
|  Frontend         |       |  (Node.js/Express)    |       |                         |
|                   |       |                       |       |                         |
+-------------------+       +-----------+-----------+       +-------------------------+
                                        |
                                        v
                            +-----------------------+
                            |  HAL Evaluator        |  <-- 5-Signal Extractor
                            |  (RepID Engine API)   |      (Harm, Epistemic, Evidence,
                            +-----------+-----------+       Scope, Certainty)
                                        |
                                        v
                            +-----------------------+
                            |  Supabase (Logs /     |  <-- Anchors to HyperDAG
                            |  Event Store)         |      Reputation System
                            +-----------------------+
```

## 💻 Tech Stack

- **Runtime:** Node.js, TypeScript
- **Web Framework:** Express.js
- **Database / Event Store:** Supabase (PostgreSQL)
- **Inference Gateway:** LiteLLM (Integration)
- **Reputation Engine:** HyperDAG RepID Engine
- **Deployment:** Railway (Nixpacks)

## 🚀 Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DealAppSeo/trustchat-backend.git
   cd trustchat-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in the required values from your Railway or Supabase dashboard.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The service listens on `PORT` (default 3000).

## 🔐 Environment Variables

Reference the `.env.example` file for the expected schema:

- `SUPABASE_URL` - Your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key for administrative write access.
- `LITELLM_URL` - URL for the LiteLLM routing service.
- `LITELLM_MASTER_KEY` - Master key for model inference.
- `REPID_API_KEY` - API key for the HyperDAG RepID scoring endpoint.
- `PORT` - HTTP Server port (e.g., 3000).

## 🤝 Contributing

We welcome contributions from the community, especially from builders deeply engaged with ERC-8004 standards and verifiable AI infrastructure. 
Please ensure any pull requests maintain strict adherence to our HAL zero-trust principles. For major architectural changes, please open an issue first to discuss your proposed implementation.

## 📜 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
