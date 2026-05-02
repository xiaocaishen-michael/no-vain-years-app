// Public surface of @nvy/api-client.

export {
  apiFetch,
  apiJson,
  ApiClientError,
  DEFAULT_BASE_URL,
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
  LoginByPasswordRequest,
  LoginByPhoneSmsRequest,
  LoginResponse,
  RefreshTokenRequest,
  RegisterByPhoneRequest,
  RegisterByPhoneResponse,
  RequestSmsCodeRequest,
} from './generated';
export { ResponseError } from './generated';
