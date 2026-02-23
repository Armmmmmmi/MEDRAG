# MEDRAG V2

A web application for checking medical drug interactions using Retrieval-Augmented Generation (RAG). The system is built with **Vue 3** (Frontend), **Node.js/Express** (Backend), **SQLite** (Relational Backup Data), **Qdrant** (Vector Database), and **Ollama** (Local AI Models).

## Features
- **Single Pair Check:** Check interaction severity and references between two specific medications.
- **Multi Drug Check:** Automatically extract drug names from a clinical text blob and cross-check all possible pairs.
- **Patient Mode:** Fetch prescriptions from a mock Hospital Information System via Hospital Number (HN) and Visit Date.
- **Literature Q&A:** A natural language chat assistant to query the medical interaction knowledge base.
- **Admin Panel:** Centralized location for AI model configuration and uploading `CSV` datasets to generate vector embeddings.
- **Bilingual Interface:** Supports English and Thai languages via `vue-i18n`.

---

## Prerequisites

Before running the project, make sure you have installed the following:
- **Node.js** (v18 or higher)
- **Docker** (Required for running Qdrant Vector DB)
- **Git**

## Installation & Setup

### 1. Clone the repository
Clone the project to your local machine:
```bash
git clone https://github.com/Armmmmmmi/MEDRAG.git
cd MEDRAG
```

### 2. Start the Vector Database (Qdrant)
Run Qdrant via Docker. It will run on ports `6333` and `6334`. A persistent volume `qdrant_storage` is mapped to prevent data loss.
```bash
docker run -d -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage:z qdrant/qdrant
```

### 3. Setup the Backend
The backend application handles the API logic, SQLite operations, logic parsing, and connections to the AI models.

Open a terminal at the project root:
```bash
cd backend
npm install
```
Start the backend development server (defaults to port `3000`):
```bash
npm run dev
```

### 4. Setup the Frontend
The frontend is built using Vite, Vue 3, and Tailwind CSS.
Open a **new** terminal at the project root:
```bash
cd frontend
npm install
```
Start the frontend development server (defaults to `http://localhost:5173`):
```bash
npm run dev
```

### 5. AI Models (Ollama) Setup
MEDRAG V2 requires an embedding model to vectorize text and a generation model (LLM) to perform RAG-based answering.
You need to install [Ollama](https://ollama.com/) locally and pull the necessary models:
```bash
# Pull the embedding model (Required for indexing database)
ollama pull nomic-embed-text

# Pull the text generation model (LLM) (e.g., Llama 3, Gemma 2, etc.)
ollama pull llama3 
# or 
ollama pull gemma2
```
Ollama usually runs locally on `http://localhost:11434`.

---

## First-Time Configuration & Initializing Database

After you have started the Backend (Step 3) and Frontend (Step 4), open your browser and go to `http://localhost:5173`.

1. Go to the **Admin Panel** tab on the website.
2. In the System Configuration section, review the AI Engine endpoints. Ensure they point to your local Ollama instance (e.g., `http://localhost:11434/api/embeddings`) and Qdrant server (`http://localhost:6333`).
3. Set the embedding model (e.g., `nomic-embed-text`) and the generation model (e.g., `llama3`).
4. In the **Import Data (CSV)** section, click to upload your interaction rules database file (a `.csv` file with 12 columns).
5. The system will parse the records, chunk them, build embeddings via Ollama, and store everything in both SQLite and Qdrant. **Note: This process may take a while depending on the CSV size.**

Once the table in the Admin panel populates with database records, the application is fully seeded and ready for use!
