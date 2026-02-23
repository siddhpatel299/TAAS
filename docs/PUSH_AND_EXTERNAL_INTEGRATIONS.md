# Push and external integrations

## Current state: no outbound push to external systems

TAAS does **not** currently support pushing events or data to external systems (e.g. your server, Zapier, or a user-configured webhook).

| Kind | What exists |
|------|-------------|
| **Inbound webhook** | Twilio call status: TAAS receives `POST /api/call-reminder/webhook/twilio-status` when a call completes. |
| **Internal events** | Flow automation: `flow.service.emitEvent()` triggers in-app workflows only (no HTTP outbound). |
| **Outbound to third parties** | TAAS calls Telegram, Twilio, Serp/Hunter (job tracker), MF API (investments), etc. These are fixed integrations, not user-defined URLs. |

So today:

- There is **no** user- or plugin-configurable webhook URL.
- There is **no** “notify this URL when X happens” (e.g. when a job application is added).
- External systems can only **pull** from TAAS by calling the REST API with a user token (and there is no public API key for third-party access).

---

## What “push” could look like (future)

To support **push** from TAAS to someone’s system or “use plugins in their system” via events, you could add:

1. **Webhook URL (per user or per plugin)**  
   - Stored in plugin settings or user/account settings.  
   - Optional secret for signing payloads (e.g. `HMAC-SHA256`).

2. **Events to push** (examples)  
   - Job Tracker: `job_application.created`, `job_application.updated`, `job_application.deleted`, `task.created`, etc.  
   - Other plugins: e.g. `note.created`, `expense.added`, `subscription.renewed`.

3. **Delivery**  
   - On each event, `POST` to the configured URL with a JSON body (event type, payload, timestamp, optional signature).  
   - Retries with backoff and optional dead-letter or “recent failures” in UI.

4. **Docs**  
   - List of event types and payload shapes.  
   - How to configure the URL and (if added) verify the signature.

This doc can be updated when/if outbound webhooks are implemented.
