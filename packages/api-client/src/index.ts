// Public surface of @nvy/api-client.

export {
  apiFetch,
  apiJson,
  ApiClientError,
  DEFAULT_BASE_URL,
  getAccountAuthApi,
  getAccountDeletionApi,
  getAccountProfileApi,
  getAccountSmsCodeApi,
  getAuthApi,
  getCancelDeletionApi,
  getDeviceManagementApi,
  resetClientForTests,
  setDeviceGetter,
  setDeviceNameGetter,
  setDeviceTypeGetter,
  setTokenGetter,
  setTokenRefresher,
} from './client';
export type { ApiErrorBody } from './client';

// Typed APIs and request/response models from the generated client.
// Consumers MUST import from this entry point — no deep imports into generated/.
export type {
  AccountProfileResponse,
  CancelDeletionRequest,
  DeleteAccountRequest,
  LoginResponse,
  PhoneSmsAuthRequest,
  RefreshTokenRequest,
  RequestSmsCodeRequest,
  SendCancelDeletionCodeRequest,
  UpdateDisplayNameRequest,
} from './generated';
export { FetchError, ResponseError } from './generated';
