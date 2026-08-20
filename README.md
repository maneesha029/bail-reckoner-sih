# Bail Reckoner

**SIH260405 · Ministry of Law & Justice · Smart Automation, Software**

![Python](https://img.shields.io/badge/Python-3.11-blue) ![React](https://img.shields.io/badge/React-Vite-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-microservices-009688) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED) ![Tests](https://img.shields.io/badge/tests-47%20passing-brightgreen) ![License](https://img.shields.io/badge/license-see%20LICENSE-lightgrey)

An automated eligibility, precedent, and audit system for undertrial bail review under Section 436A of the CrPC (Section 479 of the BNSS) — built for judges, legal aid providers, and undertrial prisoners.

**76% of India's prison population are undertrials, not convicts. This is the system that finds the ones who already qualify for release — automatically, continuously, and provably.**

> This system does not grant bail and makes no recommendation. It surfaces verified legal signals — eligibility, precedent, procedure, and discretion factors — for a human authority to review. The final decision always rests with the judge.

<!--
Add a real screenshot or short GIF here once ready — this is the single
highest-impact thing you can add to this README. Create docs/images/,
drop the PNG in, then uncomment the line below with your filename:

![Judge dashboard showing a live eligibility result](docs/images/judge-dashboard.png)
-->

---

## The problem

Undertrials make up **76% of India's entire prison population** (NCRB, Prison Statistics India 2023). An undertrial who has served half their maximum possible sentence — one-third if it's a first offense — is legally entitled to release under Section 436A/479. In practice, this depends entirely on someone manually noticing. Nobody tracks it at scale.

## What this does

- Computes bail eligibility automatically from custody duration, offense, first-offender status, and multiple charges — resolving which charge governs when more than one applies, and correctly excluding offenses carrying death or life imprisonment from the automatic threshold, per the statute's own terms
- Retrieves matching statutes and real Supreme Court precedent for every case
- Generates a category-specific procedural checklist — bond type, fine, required documents, filing steps — sourced from CrPC Chapter XXXIII / BNSS bond provisions
- Flags indigency-based bond-waiver eligibility
- Surfaces transparent, rule-based judicial-discretion indicators (flight risk, witness influence) — every factor named, advisory only
- Scans every case automatically every 5 minutes and raises a persisted alert the moment someone crosses the eligibility threshold
- Writes a SHA-256 hash-chained audit entry for every action, independently verifiable on demand
- Gives judges, legal aid providers, and undertrial prisoners each a dedicated interface

---

## Coverage against the official Problem Statement

| PS requirement | Status |
|---|---|
| Multiple charges, compoundability | Built — `case_offenses` join, `is_compoundable` per section, governing charge resolved automatically |
| IPC / BNS / BSA + all 7 special-statute categories (cyber, SC/ST, women, children, state, economic, foreigners) | Built — all 8 categories represented |
| Track time served, eligibility timeline | Built — exact day-count against statutory threshold |
| Death/life-imprisonment exclusion | Built — Section 436A/479 excludes these from automatic relief; enforced at the data and logic layer |
| Delay attributable to the accused excluded from custody count | Built |
| Judicial discretion — flight risk, witness/evidence influence | Built — transparent, rule-based, named factors, advisory only |
| Procedural pre-requisites (bonds, fines, documents, identity verification) | Built — category-specific checklist, sourced from CrPC §§441-450 / BNSS §§485-496 |
| Judicial pronouncements on bail eligibility | Built — 4 real Supreme Court judgments (Satender Kumar Antil, Hussainara Khatoon, Moti Ram, Arnesh Kumar) + statutory citations |
| Auto-identify eligible undertrials | Built — automatic scan every 5 minutes, persisted alerts |
| Interfaces for prisoners, legal aid, judicial authorities | Built — three dedicated frontend views |
| Plug-and-play, integrable | Built — single REST gateway, stateless services |

---

## Architecture

```
                         ┌─────────────┐
   Browser (React) ───►  │   Gateway   │  single entry point, :8000
                         └──────┬──────┘
        ┌───────────┬──────────┼──────────┬───────────┬──────────────┐
        ▼           ▼          ▼          ▼           ▼              ▼
  eligibility-  precedent-  compliance- trust-access- monitoring-   monitoring-
   engine        engine      engine      layer          engine       scheduler
   :8001         :8002       :8003       :8004          :8005      (Celery beat)
        │           │          │            │              │
        ▼           ▼          │            ▼              │
   Postgres     Chroma      ───┘        Postgres      ───┘
   (offenses,   (13-doc                 (users,
    cases)       corpus)                 audit_logs,
                                          alerts)
                                              ▲
                                              │
                                          Redis (Celery broker)
```

Six independently deployable services, each owning one concern and its own data. Chosen deliberately to mirror how a real government deployment would be built and staffed — the operational cost (11 containers, service-to-service auth) is a tradeoff we made intentionally, not an oversight.

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Python, FastAPI — 6 microservices + gateway |
| Structured data | PostgreSQL |
| Precedent retrieval | Chroma vector search, with a deterministic lexical fallback (3-second timeout, so a slow/unavailable Chroma degrades gracefully instead of failing) |
| Case summarization | Anthropic API — grounded in retrieved sources, with a hard-coded output guardrail blocking recommendation language ("grant bail," "recommend," "eligible for release") before it ever reaches a user |
| Scheduling | Redis + Celery Beat — automatic 5-minute eligibility scan |
| Auth | JWT, role-based access control |
| Audit integrity | SHA-256 hash chaining, live verification endpoint |
| Containerization | Docker Compose — 11 containers |

**On the AI/rule-based distinction, since it matters:** eligibility computation and discretion scoring are 100% deterministic, auditable logic — no model involved. The only place an LLM touches this system is optional case-summary language generation, and that's guardrailed against ever producing a decision-shaped sentence.

---

## Data provenance

| Data | Source | Status |
|---|---|---|
| Offense sections (IPC, BNS, IT Act, POCSO, SC/ST Act, PMLA, Foreigners Act) | India Code | Real — 10 sections seeded across all 8 categories |
| Supreme Court judgments | Verified against Indian Kanoon | Real — 4 judgments, correctly cited |
| Procedural checklist data | Compiled from CrPC Ch. XXXIII / BNSS bond provisions | Draft, cross-referenced, pending final primary-source sign-off — disclosed honestly, not claimed as fully verified |
| Case records (20 demo cases) | Synthetic | Fictional names and custody durations, built to exercise every offense category and both eligible/not-yet-eligible outcomes |
| Demo accounts | Synthetic | `demo_judge`, `demo_legal_aid`, `demo_jail_officer`, `demo_admin` |

The legal reference material is real. The case records are synthetic — real undertrial data isn't available or appropriate for a hackathon build. The schema already supports real `prisoner_id`/custody records from an actual jail/court system with no structural change.

---

## Testing

47 automated tests across all 6 backend services, plus a 12-query precedent-retrieval evaluation set validating that discretion-factor queries correctly retrieve the governing judgment.

---

## Known, honestly disclosed limitations

- Statute coverage is 10 representative sections today, not the full IPC/BNS corpus — the schema and seeding pipeline scale directly against the same structure, this is a data-entry task, not an architecture change
- Procedural checklist data is compiled and cross-referenced but not yet verified against India Code primary text section-by-section
- Discretion-scoring inputs are supplied via API; no dedicated intake form is wired to the frontend yet
- Single Postgres instance, no read replicas or backup tooling
- Undertrial-role login currently goes through the same authentication as judge/legal aid roles, which doesn't reflect how a real undertrial would access the system — scoped as the next fix

---

## Quick start

```powershell
docker-compose up --build -d postgres redis chroma
docker-compose up --build -d
docker-compose exec eligibility-engine python seed_offenses.py
docker-compose exec eligibility-engine python seed_cases.py
docker-compose exec trust-access-layer python seed_users.py
```
Then open `http://localhost:5173`.

---

## Team

| Name |
|---|
| Maneesha G |
| Ronit Kapar |
| Vansh Baranwal |
| D Venkata Abhishek |
| Sanjana Ramesh H |
| Tanmay B Patil |

Built as a six-person team, one microservice per member — matching the architecture's own division of concerns.

---

## License

See [LICENSE](LICENSE).