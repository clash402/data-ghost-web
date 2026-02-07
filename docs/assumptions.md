# Data Ghost Web v1 Assumptions

1. Every backend response is wrapped in an envelope with at least a `data` field and optional `error` / `request_id` fields.
2. `GET /dataset/summary` returns `404` when no dataset has been uploaded yet; the UI maps this to a normal empty state.
3. `POST /ask` returns one of two mutually exclusive payloads: clarification response or final answer response.
4. Clarification question `type` values may vary; unsupported values are rendered as free-text inputs.
5. Chart payload `data` can be treated as an array of row objects where at least one numeric metric exists.
6. For v1 context docs, uploaded documents are tracked in client state because no list endpoint was provided.
