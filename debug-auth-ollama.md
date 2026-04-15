# [OPEN] Debug Session: auth-ollama

## Context

- User report: `Terminal#91-173`
- Scope: `/Users/bytedance/github/agent/raina-v2`
- Symptoms:
  - Backend starts successfully
  - Requests later hit `Parse token error: JsonWebTokenError: invalid signature`
  - Runtime also shows `TypeError: fetch failed` with `ECONNREFUSED` to `127.0.0.1:11434` / `::1:11434`

## Hypotheses

1. Existing browser token was signed with an old JWT secret, so current backend rejects it as `invalid signature`.
2. Ollama is not running on `http://localhost:11434`, so any AI request fails at runtime even though Nest itself is healthy.
3. Frontend proxy errors are secondary symptoms caused by backend request handling failures, not by Vite proxy misconfiguration.
4. The app may need better invalid-token fallback behavior so stale tokens do not keep spamming guarded endpoints.

## Evidence

- Confirmed from logs:
  - Nest boot success: `Nest application successfully started`
  - JWT verification failure: `JsonWebTokenError: invalid signature`
  - Model endpoint failure: `ECONNREFUSED ... 11434`
- Not yet validated:
  - Whether the current browser token is stale from a previous secret/environment
  - Whether user expects local Ollama dependency or wants graceful degradation

## Next Step

- Analyze current evidence and determine whether this is:
  - pure environment issue,
  - auth state migration issue,
  - or needs code-level mitigation.
