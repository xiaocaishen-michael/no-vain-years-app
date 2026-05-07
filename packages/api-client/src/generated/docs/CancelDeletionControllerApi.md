# CancelDeletionControllerApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**cancel**](CancelDeletionControllerApi.md#cancel) | **POST** /api/v1/auth/cancel-deletion |  |
| [**sendCode**](CancelDeletionControllerApi.md#sendcode) | **POST** /api/v1/auth/cancel-deletion/sms-codes |  |



## cancel

> LoginResponse cancel(cancelDeletionRequest)



### Example

```ts
import {
  Configuration,
  CancelDeletionControllerApi,
} from '';
import type { CancelRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CancelDeletionControllerApi();

  const body = {
    // CancelDeletionRequest
    cancelDeletionRequest: ...,
  } satisfies CancelRequest;

  try {
    const data = await api.cancel(body);
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
| **cancelDeletionRequest** | [CancelDeletionRequest](CancelDeletionRequest.md) |  | |

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


## sendCode

> sendCode(sendCancelDeletionCodeRequest)



### Example

```ts
import {
  Configuration,
  CancelDeletionControllerApi,
} from '';
import type { SendCodeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CancelDeletionControllerApi();

  const body = {
    // SendCancelDeletionCodeRequest
    sendCancelDeletionCodeRequest: ...,
  } satisfies SendCodeRequest;

  try {
    const data = await api.sendCode(body);
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
| **sendCancelDeletionCodeRequest** | [SendCancelDeletionCodeRequest](SendCancelDeletionCodeRequest.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

