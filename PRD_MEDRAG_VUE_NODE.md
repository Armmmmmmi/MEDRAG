# Product Requirements Document (PRD)

## 1. Summary
Build a new Drug-Drug Interaction (DDI) Clinical Decision Support System (CDSS) that preserves the exact workflow of the current MEDRAG system, but with a new stack:
- Frontend: Vue
- Backend: Node.js + TypeScript
- Relational DB: SQLite3
- Vector DB: Qdrant
- Embedding model: `qwen3-embedding:4b`
- RAG generation model: `MedAIBase/MedGemma1.5:4b`

Add one new capability: **RAG Q&A** (free-form clinical question answering) while keeping the existing DDI workflows intact.

## 2. Goals
- Preserve current DDI workflows and outputs, including strict “context-only” answering.
- Move all AI, database, and vector operations to a backend service.
- Provide deterministic, auditable outputs with transparent context display.
- Add RAG Q&A with the same strict safety and disclosure rules.

## 3. Non-Goals
- Replacing clinician judgment or providing final medical decisions.
- Introducing new knowledge sources beyond uploaded/imported datasets.
- Building a fully automated EHR integration.

## 4. Personas
- **Clinical Pharmacist**: checks interactions and needs evidence with references.
- **Physician**: needs fast screening of patient medication list.
- **Admin/IT**: maintains datasets, models, and connectivity.

## 5. User Stories
1. As a pharmacist, I can check a single drug pair and get a structured interaction report with references.
2. As a clinician, I can input a list of medications and screen all pairs quickly.
3. As a pharmacist, I can pull a patient’s meds by HN and visit date and run interaction checks.
4. As an admin, I can import/export datasets and re-index embeddings.
5. As a clinician, I can ask a question (RAG Q&A) and see the answer tied only to retrieved context.

## 6. Functional Requirements

### 6.1 DDI Single-Pair Check
- Input: drugA, drugB
- Workflow:
  1. Exact match lookup in SQLite3
  2. If no exact match, vector search in Qdrant
  3. If similarity >= 0.65, use that context; else “No interaction found”
  4. Send context to LLM and render structured output
- Output: clinical report in Thai using fixed template

### 6.2 DDI Multi-Drug Check
- Input: free-text list
- Workflow:
  1. Extract/normalize drug names via LLM; fallback regex if LLM fails
  2. Generate all pairs (nC2)
  3. Pre-screen with exact match then vector search
  4. Only send candidates with score >= 0.70 to LLM
  5. Non-candidates return “no interaction found”
- Output:
  - Normalized drug list
  - Results per pair, with similarity score and context

### 6.3 Patient Mode
- Input: HN, Date
- Workflow:
  1. Run SQL template query against SQLite3
  2. Extract drug names from first column
  3. User selects drugs to check
- Output: same as Multi-Drug Check

### 6.4 Admin Panel
- Configure model endpoints (embedding + generation)
- Configure SQLite query templates
- Import CSV data
- Export data (SQLite dump + Qdrant backup)
- Re-embed/re-index all records
- View records (paginated)

### 6.5 New Feature: RAG Q&A
- Input: free-form question (e.g., “ยานี้มีปฏิกิริยากับอะไรบ้าง?”)
- Workflow:
  1. Vector search on Qdrant for topK relevant documents
  2. Build context from top results (limit by token budget)
  3. LLM responds **strictly from context**
  4. If context is empty or irrelevant, respond with “ไม่พบข้อมูลในฐานข้อมูล”
- Output:
  - Answer in Thai
  - Context preview with similarity scores

## 7. AI Behavior & Safety
- **Context-only rule:** the model must not use outside knowledge.
- **No hallucinations:** missing fields must be “ไม่ระบุ”.
- **Fallback:** if no context, return “ไม่พบข้อมูลในฐานข้อมูล”.
- **Rate limit handling:** exponential backoff for generation; adjustable delay in batch mode.

## 8. Data Requirements

### 8.1 Interaction Records (SQLite3)
Table: `interaction_records`
- id TEXT PRIMARY KEY
- drugA TEXT
- drugB TEXT
- Significance TEXT
- Onset TEXT
- severity TEXT
- Documentation TEXT
- effect TEXT
- mechanism TEXT
- management TEXT
- ddisscuss TEXT
- dbiblio TEXT
- reference TEXT
- source TEXT
- created_at DATETIME

### 8.2 Vector Collection (Qdrant)
Collection: `ddi_vectors`
- id = interaction_records.id
- vector = embedding from `qwen3-embedding:4b`
- payload = metadata fields

### 8.3 CSV Import Format
12 columns in fixed order:
1. Drug A
2. Drug B
3. Significance
4. Onset
5. Severity
6. Documentation
7. Effect
8. Mechanism
9. Management
10. Discussion
11. Biblio
12. Reference

## 9. System Architecture

### 9.1 Backend Services
- API server (Node.js + TypeScript)
- Embedding service wrapper
- Generation/RAG service wrapper
- SQLite3 data layer
- Qdrant client

### 9.2 Frontend
- Vue UI with 3 primary modes (Single, Multi, Patient)
- RAG Q&A tab
- Admin panel

## 10. API Contracts (Draft)

### Health
- `GET /api/status`

### Single Pair
- `POST /api/interaction/single`
- Body: `{ drugA: string, drugB: string }`
- Response:
  - `{ rawResponse: string, retrievedContext: string, similarityScore: number }`

### Multi Drug
- `POST /api/interaction/multi`
- Body: `{ text: string }`
- Response:
  - `{ normalizedDrugs: string[], results: { pair: [string, string], rawResponse: string, retrievedContext: string, similarityScore: number }[] }`

### Patient Fetch
- `POST /api/patient/fetch`
- Body: `{ hn: string, date: string }`
- Response: `{ hn: string, date: string, drugs: string[] }`

### RAG Q&A
- `POST /api/rag/qa`
- Body: `{ question: string, topK?: number }`
- Response: `{ answer: string, contexts: { id: string, score: number, content: string }[] }`

### Admin
- `POST /api/admin/import`
- `GET /api/admin/export`
- `POST /api/admin/reindex`
- `GET /api/admin/records?limit=...&offset=...`

## 11. UX Requirements
- Clear mode selection (Single / Multi / Patient / Q&A)
- Progress and status states (indexing, searching, analyzing)
- Context display for every AI response
- Downloadable export + import flows

## 12. Performance Requirements
- Single-pair response under 2-4 seconds (local model dependent)
- Multi-drug batch uses rate-limiting and progressive results display
- Qdrant search latency < 200ms for topK=3-5

## 13. Security & Compliance
- All AI calls should be local or internal where possible
- No patient identifiers sent to external APIs
- Admin-only access to import/export and settings

## 14. Risks
- Model availability and VRAM constraints
- Inconsistent embeddings if model changes
- Large vector DB increasing Qdrant memory usage

## 15. Milestones
1. Backend API + SQLite3 schema + Qdrant integration
2. Single-pair flow end-to-end
3. Multi-drug flow + rate limit handling
4. Patient mode
5. Admin + import/export + reindex
6. RAG Q&A
7. Final QA + regression checks vs original system

