# Experiments Registry: KhataGenie.com

This document records all structured experiments, hypotheses, methods, and results.

---

## EXP-001: Structured JSON Extraction from Low-Resolution Thermal Receipts
- **Objective**: Determine whether Vision LLMs can reliably parse faded 58mm/80mm thermal paper receipts into valid GST JSON without preprocessing.
- **Hypothesis**: Giving specific system prompt guidelines on thermal bill structures (item names often truncated, totals at bottom right, tax breakdown implicit) increases parsing accuracy above 85%.
- **Baseline**: Standard generic invoice extraction prompt (62% field accuracy).
- **Change**: Added Indian GST-specific prompt instructions + math parity validation rule.
- **Method**: Run 20 sample thermal receipt images through NVIDIA Nemotron / GPT-4o-mini vision prompt.
- **Result**: Planned.
- **Metrics**: Field accuracy (%), Mathematical balance rate (%).
- **Conclusion**: Pending execution in Phase 5.
