# Code Review Checklist (Humans + Claude Code)

> Prompt Claude with:
> “Review this PR against codereviewchecklist.md. Use the Output Format.
> Prioritise correctness & security first, then maintainability, then
> performance. Include file:line refs where helpful.”

## Output Format (Claude must follow)
- Summary (1–2 short paragraphs)
- Blocking (must-fix before merge)
- Strong suggestions
- Nits
- Test gaps (with example tests)
- Risk & rollout plan

---

## 0) Quick Triage
- [ ] Smallest sensible PR; clear title & why.
- [ ] Linked issue; screenshots/logs if UI or prod issues.
- [ ] Ops/migration notes if schema/config changes.

## 1) Correctness & Safety
- [ ] Matches requirements; covers edge cases.
- [ ] Inputs validated; outputs constrained; error paths tested.
- [ ] Timezones/locales/null/NaN/empty/overflow considered.
- [ ] Concurrency/race/order assumptions explicit; idempotency where
      relevant.

## 2) Security & Privacy
- [ ] Untrusted input sanitised; injection risks addressed.
- [ ] AuthN/AuthZ at boundaries; least-privilege access.
- [ ] No secrets in code/logs; secure storage used.
- [ ] PII minimised; retention documented; deps free of known CVEs.

## 3) Design & Maintainability
- [ ] Single responsibility; low coupling/high cohesion.
- [ ] Stable interfaces; contracts/invariants documented.
- [ ] Avoid needless duplication/abstraction; precise naming.

## 4) Readability & Style
- [ ] Code self-explains or comments explain *why*.
- [ ] Lints/formatters pass; dead/debug code removed.
- [ ] Errors actionable; logs have level/context/IDs.

## 5) Tests & Quality Gates
- [ ] Unit: happy + edge cases; meaningful assertions.
- [ ] Integration/e2e where boundaries are crossed.
- [ ] Deterministic; avoids time/network flakiness.
- [ ] CI green; lints/types/static analysis addressed.

## 6) Performance, Reliability, Ops
- [ ] Avoid obvious hot-path issues and N+1s.
- [ ] Timeouts/retries/back-pressure/circuit breakers as needed.
- [ ] Resource usage bounded (files/sockets/DB).
- [ ] Observability (metrics/traces/log fields) added if new paths.

## 7) Data, Schemas, Migrations
- [ ] Reversible; expand-migrate-contract if needed.
- [ ] Indexes/constraints match query patterns.
- [ ] Data quality checks; privacy constraints preserved.

## 8) APIs & Integrations
- [ ] Versioned or backwards-compatible.
- [ ] Clear error model; idempotent where appropriate.
- [ ] Pagination/filtering/rate limits considered.
- [ ] External contracts mocked; sandbox creds only.

## 9) Front-End (if applicable)
- [ ] Accessibility: roles/labels/focus/contrast.
- [ ] Responsive across key viewports.
- [ ] Predictable state; effects cleanup correct.
- [ ] Network errors handled; skeletons/spinners sensible.
- [ ] Bundle size reasonable; code-split heavy routes.

## 10) Docs & DevEx
- [ ] README/ADR/changelog updated if user-visible.
- [ ] Public APIs have docstrings.
- [ ] Setup/run/test instructions still accurate.

## 11) Git Hygiene
- [ ] Atomic commits with clear messages.
- [ ] No secrets/large binaries accidentally committed.
- [ ] PR limited to required code/assets.

## 12) Risk & Rollout
- [ ] Feature flag/staged deploy/canary if risky.
- [ ] Monitoring & rollback steps defined.
- [ ] Clear ownership for on-call/escalation.

---

## React + TypeScript + Vite Addendum (MRT Meds)
- [ ] TS strict not weakened; props/state precisely typed (no `any`).
- [ ] Components pure; side-effects isolated in hooks.
- [ ] State colocated/lifted appropriately; error boundaries around
      risky trees.
- [ ] Code-split heavy routes/components; measure bundle impact.
- [ ] Use `import.meta.env`; never ship secrets.
- [ ] Tests: Vitest + RTL (query by role/label); Playwright e2e for add/
      edit/remove medication, expiry filters, offline refresh.
- [ ] A11y: labels/aria-describedby, keyboard nav, aria-busy/live for
      async, contrast AA.
- [ ] Time/expiry: store UTC ISO-8601; display Europe/London; include
      last-day-of-month edge cases.
- [ ] Data minimisation: inventory fields only; exports (CSV/JSON) avoid
      sensitive internal notes by default.

---

## Optional Claude Prompts (copy as needed)
- **Edge-case sweep**: “List realistic edge cases and propose tests that
  would fail today; include example inputs.”
- **Threat model**: “Enumerate trust boundaries and likely abuse cases;
  rank by impact × likelihood; propose mitigations.”
- **Complexity refactor**: “Top 3 complex functions by cyclomatic
  complexity; suggest simpler, safer refactors.”
- **Observability review**: “Given new code paths, propose metrics/spans/
  log fields to debug prod failures.”
- **Migration safety**: “Simulate rolling deploy N/N-1; identify schema/
  contract hazards and a phased plan.”

---

## PR Comment Template
**Summary**
- What is changing and why?

**Checklist results**
- Blocking:
- Strong suggestions:
- Nits:

**Test gaps**
-

**Risk & rollout**
-
