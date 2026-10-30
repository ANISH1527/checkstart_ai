# 07. AI / ML & LLM Architecture Audit

This document provides a thorough, evidence-based audit of all artificial intelligence, machine learning, natural language processing, vector embedding, and prompt engineering subsystems in the project.

---

## 1. AI Models, Providers & Inference Architecture

| Model / Subsystem | Provider / Library | Version | Inference Location | Dimension / Spec | Purpose in System |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gemini Pro** | Google Generative AI | `v1` SDK (`google-generativeai>=0.3.2`) | Cloud API (`generativelanguage.googleapis.com`) | Context: 32k tokens | Primary LLM for venture validation analysis, market reasoning, and comparative synthesis. |
| **all-MiniLM-L6-v2** | HuggingFace / SentenceTransformers | `v1.0` (`sentence-transformers>=2.3.1`) | Local CPU / Host | 384-dimensional dense vectors | Generates semantic text embeddings of startup titles and descriptions for similarity search. |
| **MockProvider** | Custom Internal Engine | `2.0-profile-aware` | Local Python in-process | Rule-based heuristics | Deterministic, zero-cost fallback AI model that dynamically responds to idea completeness. |
| **Cosine Similarity** | Scikit-learn / Math | Pure Math / NumPy | Local CPU | Range `[-1.0, 1.0]` | Measures semantic angle between target idea vector and stored database vectors. |
| **RAGService** | Custom Internal Stub | `0.1` | Local Python in-process | N/A (returns `[]`) | Abstract knowledge-base retrieval service (currently disabled). |

---

## 2. The 15-Layer Validation Pipeline Architecture

The core intellectual property of the backend is the 15-layer sequential validation pipeline defined in `backend/app/services/validation_service.py:42-390`. Every layer is timed independently and logged to `pipeline_timing`:

```
               [Founder Startup Idea Input]
                            │
  Layer 1   [IdeaProfileExtractor: Structural Attribute Parsing]
                            │
  Layer 2   [NLPService: Keyword & Sentence Indicator Extraction]
                            │
  Layer 3   [EmbeddingService: 384-Dim Vector Generation & Caching]
                            │
  Layer 4   [SimilarityService: Semantic Overlap & Competitor Match]
                            │
  Layer 5   [RuleService: Input Length & Prompt Injection Filter]
                            │
  Layer 6   [EvidenceService: Benchmark Evidence Retrieval & Tagging]
                            │
  Layer 7   [LLMProvider: Gemini Pro or Mock Analysis]
                            │
  Layer 8   [VerificationService: Deterministic Score Overrides]
                            │
  Layer 9   [ScoringService: 9-Dimensional Weighted Math]
                            │
  Layer 10  [ConfidenceService: Calibrated Confidence Formula]
                            │
  Layer 11  [InformationGapService: Missing Element Detection]
                            │
  Layer 12  [RootCauseService: Deep Defect Diagnosis]
                            │
  Layer 13  [ImprovementStrategyService: Strategy Formulation]
                            │
  Layer 14  [ActionPrioritizationService: Top-3 Action Ranking]
                            │
  Layer 15  [ImprovementImpactService: Score Gain Prediction]
                            │
               [Final Report & Database Persistence]
```

---

## 3. Pipeline Layers Deep-Dive

### Layer 1: Structured Idea Profile Extraction (`idea_profile_service.py`)
- Analyzes raw submission dictionary.
- Computes `completeness_score` and flags `is_vague` if essential fields (problem, customer, solution) are missing or generic (e.g. customer is "everyone" or "students").

### Layer 2: NLP Attribute Extraction (`nlp_service.py`)
- Extracts top 10 keywords by filtering common English stopwords.
- Uses regex heuristics to identify problem cues (`problem`, `struggle`, `pain point`), customer cues (`student`, `developer`, `business`), and solution cues (`app`, `platform`, `tool`).

### Layer 3: Vector Embeddings (`embedding_service.py`)
- Uses `SentenceTransformer("all-MiniLM-L6-v2")` to generate a 384-dimensional dense vector representation of `"{title} {description}"`.
- Checked first against `EmbeddingCacheService` (Redis/in-memory dictionary) using SHA-256 hash.
- Vector is serialized into JSON array and persisted in `embeddings` table.

### Layer 4: Semantic Similarity Search (`similarity_service.py`)
- Calculates cosine similarity against all other idea embeddings in the database:
  $$\text{Cosine Similarity} = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
- Thresholds:
  - $\ge 0.85$: `HIGH_OVERLAP` (Competitor flag raised if ideas belong to different users)
  - $\ge 0.72$: `MODERATE_OVERLAP`
  - $< 0.72$: `UNIQUE`
- Extracts top 5 overlapping keywords between concepts.

### Layer 5: Rule Engine Evaluation (`rule_service.py`)
- Evaluates deterministic constraints:
  - Minimum 10 words, maximum 3000 words.
  - Problem and target customer minimum length ($\ge 5$ characters).
  - External high semantic similarity warning.
  - Prompt injection pattern matching (`ignore previous instructions`, `DAN`, etc.).

### Layer 6: Evidence Retrieval & Classification (`evidence_service.py`)
- Classifies citations into four reliability categories:
  - `VERIFIED`: Known authoritative sources (Gartner, Statista, SEC, Census, PitchBook).
  - `ESTIMATED`: Standard web URL sources.
  - `GENERATED`: LLM or synthetic data.
  - `UNKNOWN`: Unclassified claims.

### Layer 7: LLM Inference (`gemini_provider.py` & `mock_provider.py`)
- Uses prompt template `v1.3` (`backend/app/prompts/prompt_versions.py`).
- Requests strict JSON structure evaluating:
  1. `market_demand`
  2. `problem_solution_fit`
  3. `target_customer_clarity`
  4. `competition`
  5. `uniqueness_innovation`
  6. `technical_feasibility`
  7. `business_potential`
  8. `scalability`
  9. `risk_level`

### Layer 8: Post-LLM Verification & Deterministic Overrides (`verification_service.py`)
- Intercepts raw LLM scores and enforces strict domain guardrails:
  - **Rule 1 (Revenue Model Missing)**: If revenue model is unspecified, caps `business_potential` at 45.0. If user explicitly states "no revenue" or "don't want to sell", overrides to 10.0.
  - **Rule 2 (Vague Target Customer)**: If customer is "everyone" or unspecified, caps `target_customer_clarity` at 25.0.
  - **Rule 3 (Fraudulent Product Signals)**: If concepts mention "magic", "invisible water", or "guaranteed crore", overrides core scores to $\le 15.0$.
  - **Rule 4 (Anti-Marketing Stance)**: If founder states "will not market", caps `market_demand` and `business_potential` at 20.0.
  - All overrides are recorded in `validation_results.score_overrides`.

### Layer 9: Authoritative Scoring Engine (`scoring_service.py`)
- Calculates overall score using deterministic 9-dimensional weights summing to 1.00:

| Parameter | Backend Weight | Range | Contribution Calculation |
| :--- | :--- | :--- | :--- |
| **Market Demand** | `0.25` (25%) | 0-100 | $\text{score} \times 0.25$ |
| **Problem-Solution Fit** | `0.20` (20%) | 0-100 | $\text{score} \times 0.20$ |
| **Target Customer Clarity**| `0.10` (10%) | 0-100 | $\text{score} \times 0.10$ |
| **Competition Environment**| `0.10` (10%) | 0-100 | $\text{score} \times 0.10$ |
| **Uniqueness & Innovation**| `0.10` (10%) | 0-100 | $\text{score} \times 0.10$ |
| **Technical Feasibility** | `0.10` (10%) | 0-100 | $\text{score} \times 0.10$ |
| **Business Potential** | `0.10` (10%) | 0-100 | $\text{score} \times 0.10$ |
| **Scalability** | `0.03` (3%) | 0-100 | $\text{score} \times 0.03$ |
| **Risk Level (Inverted)** | `0.02` (2%) | 0-100 | $(100 - \text{raw\_risk}) \times 0.02$ |
| **Total Sum** | **1.00 (100%)**| | **Overall Score = $\sum \text{Contributions}$** |

- **7-Parameter Visual Rollup**:
  Backend rolls up the 9 parameters to 7 parameters scaled from 1.0 to 10.0 for frontend visual components:
  1. `marketDemand` = `market_demand / 10.0`
  2. `problemSeverity` = `problem_solution_fit / 10.0`
  3. `competition` = `competition / 10.0`
  4. `targetCustomer` = `target_customer_clarity / 10.0`
  5. `innovation` = `uniqueness_innovation / 10.0`
  6. `feasibility` = `technical_feasibility / 10.0`
  7. `revenuePotential` = `business_potential / 10.0`

- **5-Band Classification**:
  - $\ge 90.0$: `EXCEPTIONAL` ("Highly Promising")
  - $75.0 - 89.9$: `STRONG` ("Promising")
  - $60.0 - 74.9$: `MODERATE` ("Promising")
  - $40.0 - 59.9$: `WEAK` ("Needs Improvement")
  - $< 40.0$: `VERY_WEAK` ("High Risk")

### Layer 10: Calibrated Confidence Formula (`confidence_service.py`)
- Base confidence is calculated as:
  $$\text{Base} = (0.35 \times \text{Completeness}) + (0.35 \times \text{Model Agreement}) + (0.15 \times \text{Evidence Quality}) + (0.15 \times \text{Rule Consistency})$$
- Deductions applied:
  - $-5.0$ per Layer 8 override applied
  - $-15.0$ if zero evidence exists (or $-12.0$ if all evidence is generated)
  - $-20.0$ if running on `MockProvider`
  - $-15.0$ if text length $< 150$ characters (or $-8.0$ if $< 300$)
  - Hard ceiling of $40.0\%$ in mock mode.

### Layers 11-15: Improvement Pipeline (`recommendation_engine_service.py`)
- **Layer 11 (Information Gaps)**: Detects missing unit economics, user acquisition channels, and pricing elasticity.
- **Layer 12 (Root Causes)**: Determines structural root causes for low parameter scores.
- **Layer 13 (Strategies)**: Generates actionable experiments (e.g. landing page test, 10 customer discovery interviews).
- **Layer 14 (Action Prioritization)**: Ranks actions into `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` based on severity and effort.
- **Layer 15 (Impact Prediction)**: Predicts anticipated score gain upon completion of each recommendation.

---

## 4. Prompt Engineering & Versioning

Located in `backend/app/prompts/prompt_versions.py`:

- **Version `v1.0`**: Initial zero-shot JSON prompt.
- **Version `v1.1`**: Added parameter sub-keys (`score`, `confidence`, `reason`).
- **Version `v1.2`**: Added strict JSON schema enforcement and evidence requirements.
- **Version `v1.3` (Active)**: Added explicit anti-sycophancy instructions, collegiate context, competitive moat scrutiny, and strict Pydantic JSON structure.

### Conversational System Prompt (`chat_service.py:19-34`)
- Establishes persona as "CheckStart AI, an expert startup validation mentor assisting collegiate founders."
- Enforces concise Markdown replies, limits follow-up questions to 1-2 sharp queries, forbids repeating answered questions, and grounds responses strictly in report data.

---

## 5. RAG Pipeline Assessment & Limitations

- **Current Status**: **Stub / Not Implemented**.
- **Inspection Findings**: In `backend/app/services/rag_service.py`, the class `RAGService` is instantiated with `enabled = False` and returns `[]`.
- **Impact**: The platform does not currently perform live retrieval-augmented generation against external patent databases, live SEC filings, or dynamic web scrapes. All evidence is derived from pre-configured benchmark patterns in `evidence_service.py`.
