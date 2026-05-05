# AccountSmsCodeControllerApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**requestSmsCode**](AccountSmsCodeControllerApi.md#requestsmscodeoperation) | **POST** /api/v1/sms-codes |  |



## requestSmsCode

> requestSmsCode(requestSmsCodeRequest)



### Example

```ts
import {
  Configuration,
  AccountSmsCodeControllerApi,
} from '';
import type { RequestSmsCodeOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountSmsCodeControllerApi();

  const body = {
    // RequestSmsCodeRequest
    requestSmsCodeRequest: ...,
  } satisfies RequestSmsCodeOperationRequest;

  try {
    const data = await api.requestSmsCode(body);
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
| **requestSmsCodeRequest** | [RequestSmsCodeRequest](RequestSmsCodeRequest.md) |  | |

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

