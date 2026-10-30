# Gemini API smoke test — 24/10/2026

User explicitly requested one paid generation test within the 20,000 VND Short cap. No secret values are recorded here.

- GET metadata for `veo-3.1-lite-generate-preview` succeeded and advertised `predictLongRunning`.
- Exactly one generation POST was sent for `api-smoke-test-20261024`: 8 seconds, 720p, one sample.
- Google rejected the POST with HTTP 404: the model is no longer available. Its response recommends `gemini-omni-1.1-flash` and the Interactions API. This is an error-message recommendation, not a verified replacement integration or price quote.
- No operation ID or clip was returned. No retry, model fallback, download or composition render occurred. Existing active footage/takes were not changed.
- The generation policy was restored to `generationEnabled: false` immediately afterward.
- Conservative reservation: 12,490 VND = ceil(8 × $0.05 × 26,020 × 1.20). Remaining local Short allowance: 7,510 VND. The failed attempt remains reserved under the existing no-automatic-refund policy.
- The reservation is **not evidence of a Google charge**. Actual deduction is unverified; compare AI Studio Usage/Spend and credit balance. Do not claim the request was free merely because Google rejected it.

The current public pricing/model metadata was insufficient to predict availability of the generation endpoint. Before another attempt, verify the replacement model's official request schema, video capabilities and price; obtain approval for any new paid attempt. Do not automatically resend this scene or reset its ledger.
