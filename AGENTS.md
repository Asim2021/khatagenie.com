## Core Execution Directives

Assign the following constraint block to the agent's system prompt to enforce strict output boundaries, prevent scope creep, and trigger internal logic verification:

```text
Provide highly concise, actionable outputs without conversational fluff. Make zero assumptions, introduce no out-of-scope changes, and strictly avoid over-engineering. Retain all critical technical details in your solution. Briefly outline your reasoning to verify accuracy before providing the final answer.
```

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                             | Use when                                               |
| -------------------------------- | ------------------------------------------------------ |
| `detect_changes_tool`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context_tool`        | Need source snippets for review — token-efficient      |
| `get_impact_radius_tool`         | Understanding blast radius of a change                 |
| `get_affected_flows_tool`        | Finding which execution paths are impacted             |
| `query_graph_tool`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview_tool` | Understanding high-level codebase structure            |
| `refactor_tool`                  | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

---

# Feature Flag Gating Mandate (MANDATORY)

**Every new feature added to this codebase MUST be hidden behind a feature flag with a default value of `false`.**

### Mandatory Implementation Steps for New Features:

1. **Declare in Shared Types (`packages/types/src/featureFlags.ts`)**:
    - Add the new flag key constant to `FEATURE_FLAGS` (e.g. `NEW_FEATURE: 'feature_new_feature'`).
    - Add its type definition and set its baseline default value to `false` in `TIER_FEATURE_DEFAULTS.free` (and other tiers as appropriate).
2. **Backend Route Protection (`apps/api`)**:
    - Guard all associated REST routes or actions using the `requireFeature(FEATURE_FLAGS.<NAME>)` pre-handler middleware (`apps/api/src/middleware/featureGuard.ts`).
    - If disabled, the API must return `403 Forbidden` (`FEATURE_DISABLED`).
3. **Frontend UI Gating (`apps/web` & `apps/extension`)**:
    - Wrap all related UI controls, action buttons, modals, or pages in `<FeatureGate flag={FEATURE_FLAGS.<NAME>}>` or evaluate with `useFeatureFlag(FEATURE_FLAGS.<NAME>)`.
4. **Superadmin Metadata**:
    - Register the new flag's label and description in `AdminFeatureFlags.tsx` so root administrators can toggle and override it for any tenant or in bulk.
5. **Zero Ungated Features**:
    - No agent may merge, commit, or deliver a new feature without verifying feature flag protection and default `false` state.

---

# Project Work Protocol

## Purpose

This repository uses a **living project-memory and documentation process**.

`AGENTS.md` defines **how every agent must work**.

The `/docs` directory records **what has happened, what is currently true, why decisions were made, what was learned, and what remains to be done**.

This protocol applies to **every agent, every session, and every meaningful piece of work** performed in this repository, including:

- coding
- debugging
- refactoring
- architecture changes
- testing
- research
- AI/agent development
- prompt development
- configuration changes
- performance work
- documentation
- planning
- dependency changes

Do not treat project documentation as optional.

**Documentation is part of the definition of done.**

---

# 1. Mandatory Start-of-Work Protocol

Before beginning any meaningful work, the agent MUST:

1. Read this `AGENTS.md`.
2. Inspect `docs/README.md` if it exists, if not create one and mention that this is a new project.
3. Read `docs/STATUS.md` if it exist s, if not create one and mention that this is a new project.
4. Read `docs/ROADMAP.md` if it exists, if not create one and mention that this is a new project.
5. Read `docs/HANDOFF.md` if it exists, if not create one and mention that this is a new project.
6. Read the relevant documentation for the task.
7. Inspect the actual repository state.
8. Determine what has already been implemented.
9. Determine what is currently in progress.
10. Check for relevant open problems, decisions, experiments, and improvements.

Do not assume that an older plan or previous agent's summary is still correct.

**The actual repository state is the source of truth for implementation status.**

---

# 2. Documentation Source of Truth

Use the following documents as the canonical source for each category of information.

| Information                | Source of truth               |
| -------------------------- | ----------------------------- |
| Agent working rules        | `AGENTS.md`                   |
| Documentation index        | `docs/README.md`              |
| Current project state      | `docs/STATUS.md`              |
| Project direction          | `docs/ROADMAP.md`             |
| Implementation plan        | `docs/IMPLEMENTATION_PLAN.md` |
| Project history            | `docs/JOURNAL.md`             |
| Important decisions        | `docs/DECISIONS.md`           |
| Experiments and tests      | `docs/EXPERIMENTS.md`         |
| Problems and failures      | `docs/PROBLEMS.md`            |
| Improvement ideas          | `docs/IMPROVEMENTS.md`        |
| Lessons learned            | `docs/LESSONS.md`             |
| Agent decision records     | `docs/AGENT_TRACE.md`         |
| Metrics                    | `docs/METRICS.md`             |
| Major milestones           | `docs/MILESTONES.md`          |
| Meaningful project changes | `docs/CHANGELOG.md`           |
| Current session handoff    | `docs/HANDOFF.md`             |

Do not create competing sources of truth for the same information.

---

# 3. Mandatory During-Work Behaviour

While working, the agent MUST keep track of meaningful project events.

Important events include:

- significant technical decisions
- architecture changes
- experiments
- unexpected behaviour
- failures
- discoveries
- changes in assumptions
- changes in project direction
- newly discovered risks
- important performance results
- newly identified improvements
- important agent decisions
- human overrides of agent decisions

Do not wait until the end of a long session and rely entirely on memory.

Capture important information as it happens or immediately afterward.

---

# 4. Mandatory End-of-Work Protocol

After completing meaningful work, the agent MUST:

1. Verify what actually changed.
2. Run appropriate tests or validation.
3. Compare the result against the original objective.
4. Update the relevant documentation.
5. Update current project status.
6. Record important decisions.
7. Record meaningful experiments.
8. Record important problems.
9. Record meaningful discoveries or lessons.
10. Record newly identified improvements.
11. Record remaining work.
12. Record the recommended next action.
13. Update the session handoff when appropriate.

A task is **not complete from a project-management perspective** until the relevant documentation has been synchronized with the actual repository state.

Do not update irrelevant documentation merely for the sake of making changes.

---

# 5. Definition of Done

For every meaningful implementation task, verify:

- [ ] Work completed or current state clearly documented.
- [ ] Actual result verified.
- [ ] Appropriate tests/validation performed.
- [ ] `docs/STATUS.md` updated when project state changed.
- [ ] `docs/JOURNAL.md` updated for meaningful work.
- [ ] `docs/DECISIONS.md` updated when a significant decision was made.
- [ ] `docs/EXPERIMENTS.md` updated when an experiment was performed.
- [ ] `docs/PROBLEMS.md` updated when a significant problem was discovered.
- [ ] `docs/IMPROVEMENTS.md` updated when a meaningful improvement was identified.
- [ ] `docs/LESSONS.md` updated when a reusable lesson was learned.
- [ ] `docs/CHANGELOG.md` updated when the change materially affects project behaviour.
- [ ] `docs/HANDOFF.md` updated when another agent may need the current context.

Only update the documents that are actually relevant.

---

# 6. Never Claim Unverified Progress

Documentation MUST reflect reality.

Never claim that something is:

- implemented
- working
- tested
- validated
- complete
- production-ready

unless there is evidence.

Use explicit states when appropriate:

- Planned
- In Progress
- Blocked
- Partially Complete
- Implemented
- Tested
- Validated
- Complete
- Deferred
- Superseded
- Rejected
- Unknown
- Needs Verification

When uncertain, say so.

Do not fabricate progress, results, dates, metrics, decisions, or historical events.

---

# 7. Preserve Project History

Do not rewrite historical records simply to make the current project look cleaner.

The documentation should preserve how the project evolved.

For example:

```text
Original approach
    ↓
Problem discovered
    ↓
Experiment
    ↓
Result
    ↓
Decision
    ↓
New approach
```

When a plan changes, record:

- what the previous plan was
- what changed
- why it changed
- what replaced it

Use historical documents such as `JOURNAL.md`, `DECISIONS.md`, `EXPERIMENTS.md`, and `CHANGELOG.md` for this purpose.

---

# 8. Use Stable IDs

Use stable identifiers for important project records.

Examples:

```text
TASK-001
DEC-001
EXP-001
PROB-001
IMP-001
ADR-001
MILESTONE-001
```

When information is related, cross-reference the IDs.

Example:

```text
EXP-014
    ↓
DEC-009
    ↓
TASK-043
    ↓
IMP-021
```

This creates a traceable history of how evidence led to decisions and implementation.

---

# 9. Decision Recording Protocol

When a significant decision is made, record:

- decision ID
- date/time
- context
- problem
- alternatives considered
- selected option
- reason for selection
- trade-offs
- risks
- supporting evidence
- consequences
- related tasks/experiments

The purpose is to make it possible to answer:

> Why did we choose this approach instead of the alternatives?

Do not record or attempt to reconstruct private chain-of-thought.

Record concise, auditable decision rationale, evidence, constraints, assumptions, trade-offs, and confidence instead.

---

# 10. Experiment Recording Protocol

When an experiment is performed, record:

- objective
- hypothesis
- baseline
- change
- method
- result
- metrics
- conclusion
- decision resulting from the experiment
- next experiment, if applicable

Failed experiments are valuable project history.

Do not hide or delete failed approaches simply because they did not work.

---

# 11. Problem and Failure Recording Protocol

When an important problem is discovered, record:

- problem ID
- date discovered
- severity
- symptoms
- impact
- suspected/root cause
- attempts made
- current solution
- remaining risk
- next action

When a problem is resolved, retain its historical record and mark it as resolved.

---

# 12. Improvement Recording Protocol

When meaningful improvement opportunities are discovered, record them in `docs/IMPROVEMENTS.md`.

Separate:

- current required work
- planned work
- optional improvements
- future ideas

Do not silently turn every idea into a committed task.

Record expected benefit, effort, risk, and evidence when known.

---

# 13. Daily Journal Protocol

For meaningful work sessions, maintain a chronological entry in `docs/JOURNAL.md`.

Each entry should capture:

```markdown
## YYYY-MM-DD

### Objective

...

### Completed

...

### In Progress

...

### Problems

...

### Decisions

...

### Experiments

...

### Discoveries

...

### Lessons

...

### Improvements

...

### Next Actions

...
```

Keep entries concise.

The journal should answer:

> What actually happened during this period of work?

Do not fill the journal with trivial activity.

---

# 14. Time and Date Requirements

Documentation is time-aware.

When updating documentation:

- Use the actual current date.
- Use the actual current time when meaningful.
- Use the user's local timezone when known.
- Never invent timestamps.
- Never backdate events without evidence.
- Preserve chronological order.
- Update "Last Updated" fields where they exist.

If exact time is unavailable, use the date rather than inventing a time.

---

# 15. Agent Decision / Action Trace

For autonomous or semi-autonomous agent behaviour, record important decisions using structured information.

Use:

```text
Task
Input / Context
Candidate Actions
Selected Action
Evidence Used
Decision Criteria
Constraints
Confidence
Uncertainty
Outcome
Human Override
Follow-up
```

Do not record hidden chain-of-thought.

The purpose is to provide a concise audit trail explaining what the agent did and what information supported the decision.

---

# 16. Documentation Synchronization Rules

When the repository changes, determine which documentation is affected.

Examples:

### Feature implemented

Potentially update:

```text
STATUS.md
IMPLEMENTATION_PLAN.md
JOURNAL.md
CHANGELOG.md
```

### Architecture decision

Potentially update:

```text
DECISIONS.md
ARCHITECTURE.md
JOURNAL.md
```

### Experiment completed

Potentially update:

```text
EXPERIMENTS.md
METRICS.md
JOURNAL.md
```

### Problem discovered

Potentially update:

```text
PROBLEMS.md
STATUS.md
JOURNAL.md
```

### Problem resolved

Potentially update:

```text
PROBLEMS.md
STATUS.md
CHANGELOG.md
JOURNAL.md
```

### New improvement identified

Potentially update:

```text
IMPROVEMENTS.md
JOURNAL.md
```

The exact files depend on what actually changed.

---

# 17. Handoff Protocol

When a session ends, leave enough context for another agent to continue without relying on the previous conversation.

Maintain `docs/HANDOFF.md` with:

```text
Current objective:
Current state:
Recently completed:
Currently in progress:
Open problems:
Important decisions:
Important discoveries:
Files/components being worked on:
Things the next agent should know:
Recommended next actions:
```

Keep this focused on **current actionable context**.

Historical information belongs in the appropriate project documentation.

---

# 18. New-Agent Handoff

When starting work after another agent, do not assume previous context.

Read:

```text
AGENTS.md
docs/README.md
docs/STATUS.md
docs/HANDOFF.md
```

Then read any relevant deeper documentation.

Use the repository itself to verify the current state.

---

# 19. Documentation Integrity Check

Before finishing substantial work, check:

- Does `STATUS.md` match reality?
- Does the implementation plan still match reality?
- Did the work create a significant decision that is not recorded?
- Did the work create an experiment that is not recorded?
- Did the work reveal a problem that is not recorded?
- Did the work reveal a reusable lesson?
- Did the work create an improvement opportunity?
- Did the work invalidate a previous assumption?
- Are dates accurate?
- Are cross-references valid?
- Are completed items still incorrectly marked as pending?
- Are obsolete plans still presented as current?

Correct stale documentation when evidence is available.

---

# 20. Plan vs Reality

Always distinguish between:

```text
PLANNED
```

and

```text
ACTUALLY IMPLEMENTED
```

Never treat the implementation plan as evidence that something exists.

When implementation differs from the plan, document the difference and the reason for it.

---

# 21. Do Not Over-Document

The objective is not to create paperwork.

Do not:

- duplicate the same information across many documents unnecessarily
- document trivial code edits
- create a new document for every minor event
- write long prose where structured information is sufficient
- invent documentation simply to satisfy a checklist

Capture information that helps future agents or humans:

- understand the project
- continue the work
- reproduce a result
- debug a problem
- understand a decision
- evaluate progress
- improve the system
- understand historical context

---

# 22. Project Documentation Is Part of the Engineering Process

Treat these two activities as one workflow:

```text
Engineering Work
      +
Project Memory
```

Do not think:

```text
First code.
Later document.
```

Think:

```text
Plan
  ↓
Work
  ↓
Observe
  ↓
Decide
  ↓
Verify
  ↓
Document
  ↓
Update Project State
  ↓
Continue
```

---

# 23. Completion Report

At the end of a meaningful task, provide a concise final report containing:

```text
Completed:
Changed:
Verified:
Decisions:
Problems:
Lessons:
Improvements:
Remaining:
Next recommended action:
Documentation updated:
```

Do not claim completion if important work remains.

---

# 24. Repository as Long-Term Project Memory

The objective of this protocol is that a new agent should be able to enter this repository at any future point, with no previous conversation context, and understand:

- what the project is
- where it currently stands
- what has already been tried
- what succeeded
- what failed
- why important decisions were made
- what remains
- what risks exist
- what should happen next

Every agent should leave the repository in a state that allows the next agent to continue effectively.

**The repository, not the conversation, is the long-term memory of the project.**
