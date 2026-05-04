// Public surface of @nvy/api-client.

export {
  apiFetch,
  apiJson,
  ApiClientError,
  DEFAULT_BASE_URL,
  getAccountAuthApi,
  getAccountRegisterApi,
  getAuthApi,
  resetClientForTests,
  setTokenGetter,
  setTokenRefresher,
} from './client';
export type { ApiErrorBody } from './client';

// Typed APIs and request/response models from the generated client.
// Consumers MUST import from this entry point — no deep imports into generated/.
export type {
  LoginResponse,
  PhoneSmsAuthRequest,
  RefreshTokenRequest,
  RequestSmsCodeRequest,
} from './generated';
export { FetchError, ResponseError } from './generated';
