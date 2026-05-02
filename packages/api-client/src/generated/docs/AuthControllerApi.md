# AuthControllerApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**loginByPassword**](AuthControllerApi.md#loginbypasswordoperation) | **POST** /api/v1/auth/login-by-password |  |
| [**loginByPhoneSms**](AuthControllerApi.md#loginbyphonesmsoperation) | **POST** /api/v1/auth/login-by-phone-sms |  |
| [**logoutAll**](AuthControllerApi.md#logoutall) | **POST** /api/v1/auth/logout-all |  |
| [**refreshToken**](AuthControllerApi.md#refreshtokenoperation) | **POST** /api/v1/auth/refresh-token |  |



## loginByPassword

> LoginResponse loginByPassword(loginByPasswordRequest)



### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { LoginByPasswordOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthControllerApi();

  const body = {
    // LoginByPasswordRequest
    loginByPasswordRequest: ...,
  } satisfies LoginByPasswordOperationRequest;

  try {
    const data = await api.loginByPassword(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **loginByPasswordRequest** | [LoginByPasswordRequest](LoginByPasswordRequest.md) |  | |

### Return type

[**LoginResponse**](LoginResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## loginByPhoneSms

> LoginResponse loginByPhoneSms(loginByPhoneSmsRequest)



### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { LoginByPhoneSmsOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthControllerApi();

  const body = {
    // LoginByPhoneSmsRequest
    loginByPhoneSmsRequest: ...,
  } satisfies LoginByPhoneSmsOperationRequest;

  try {
    const data = await api.loginByPhoneSms(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **loginByPhoneSmsRequest** | [LoginByPhoneSmsRequest](LoginByPhoneSmsRequest.md) |  | |

### Return type

[**LoginResponse**](LoginResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## logoutAll

> logoutAll()



### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { LogoutAllRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthControllerApi();

  try {
    const data = await api.logoutAll();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## refreshToken

> LoginResponse refreshToken(refreshTokenRequest)



### Example

```ts
import {
  Configuration,
  AuthControllerApi,
} from '';
import type { RefreshTokenOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthControllerApi();

  const body = {
    // RefreshTokenRequest
    refreshTokenRequest: ...,
  } satisfies RefreshTokenOperationRequest;

  try {
    const data = await api.refreshToken(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **refreshTokenRequest** | [RefreshTokenRequest](RefreshTokenRequest.md) |  | |

### Return type

[**LoginResponse**](LoginResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

