import { ApiClientError, ResponseError } from '@nvy/api-client';

export type DeviceErrorKind =
  | 'session_expired'
  | 'frozen'
  | 'not_found'
  | 'cannot_remove_current'
  | 'rate_limit'
  | 'network'
  | 'unknown';

export function mapDeviceError(e: unknown): DeviceErrorKind {
  if (e instanceof ApiClientError) {
    if (e.status === 401) return 'session_expired';
    if (e.status === 403 && e.code === 'ACCOUNT_IN_FREEZE_PERIOD') return 'frozen';
    if (e.status === 404 && e.code === 'DEVICE_NOT_FOUND') return 'not_found';
    if (e.status === 409 && e.code === 'CANNOT_REMOVE_CURRENT_DEVICE')
      return 'cannot_remove_current';
    if (e.status === 429) return 'rate_limit';
    if (e.status >= 500) return 'network';
    return 'unknown';
  }
  if (e instanceof ResponseError) {
    if (e.response.status === 401) return 'session_expired';
    if (e.response.status === 404) return 'not_found';
    if (e.response.status >= 500) return 'network';
    return 'unknown';
  }
  if (e instanceof TypeError) return 'network';
  return 'unknown';
}

export function deviceErrorCopy(kind: DeviceErrorKind): string {
  switch (kind) {
    case 'session_expired':
      return '会话已失效，请重新登录';
    case 'frozen':
      return '账号已冻结，请联系客服';
    case 'not_found':
      return '该设备不存在或已被移除';
    case 'cannot_remove_current':
      return '当前设备请通过『退出登录』移除';
    case 'rate_limit':
      return '操作太频繁，请稍后再试';
    case 'network':
      return '网络错误，请重试';
    case 'unknown':
      return '发生未知错误';
  }
}
