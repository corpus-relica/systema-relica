# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records (ADRs) for the Systema Relica project.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision made along with its context and consequences. ADRs help us:

- Remember why we made certain decisions
- Avoid repeating failed experiments
- Onboard new team members with historical context
- Make better decisions by learning from the past

## ADR Format

Each ADR follows this structure:

1. **Title**: ADR-NNN: Short descriptive title
2. **Date**: When the decision was made
3. **Status**: Proposed, Accepted, Deprecated, Superseded
4. **Context**: What prompted this decision?
5. **Decision**: What we decided to do
6. **Consequences**: What happens as a result (positive and negative)
7. **Technical Analysis**: Deep dive into the details
8. **Lessons Learned**: What we discovered
9. **References**: Related documents, PRs, issues

## Current ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-websocket-json-over-binary-serialization.md) | WebSocket JSON Communication Over Binary Serialization | Accepted | 2025-07-01 |

## Creating a New ADR

1. Copy the template: `cp TEMPLATE.md NNN-descriptive-name.md`
2. Fill in all sections with relevant information
3. Include concrete data, performance metrics, and code examples
4. Reference related PRs, issues, and documentation
5. Update this README with the new ADR

## Why This Matters

> "Those who cannot remember the past are condemned to repeat it." - George Santayana

In our case: Those who don't document why binary serialization failed will try it again in 6 months!