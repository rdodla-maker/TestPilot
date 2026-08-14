# TestPilot
An AI teammate that explores, reasons, tests, verifies, and certifies software quality with minimal human guidance.


High-Level Architecture
                        React Frontend
                            │
                            ▼
                        Express API Layer
                            │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
                Agent Orchestrator     Authentication
                        │
                ┌──────┼───────────────┐
                ▼      ▼               ▼
            Browser   AI Engine      Database
            Service    Service        Service
                │         │             │
                ▼         ▼             ▼
            Playwright  OpenAI SDK   PostgreSQL




            Understand the application
                    ↓
            Explore it like a human
                    ↓
            Create testing strategy
                    ↓
            Execute tests
                    ↓
            Find & reproduce bugs
                    ↓
            Analyze failures
                    ↓
            Adapt/self-heal
                    ↓
            Retest
                    ↓
            Generate QA report
                    ↓
            Certify: READY / NOT READY