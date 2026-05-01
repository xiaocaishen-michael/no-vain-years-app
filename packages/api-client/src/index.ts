// Public surface of @nvy/api-client.
//
// Phase 3 (this PR): low-level fetch wrapper + ApiClientError.
// Phase 4 will populate src/generated/ via openapi-generator-cli and re-export
// typed APIs from here (consumers MUST NOT deep-import generated paths).
export { apiFetch, apiJson, ApiClientError, DEFAULT_BASE_URL } from './client';
export type { ApiErrorBody } from './client';
