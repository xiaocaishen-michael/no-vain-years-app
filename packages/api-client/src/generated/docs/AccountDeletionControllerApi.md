# AccountDeletionControllerApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**_delete**](AccountDeletionControllerApi.md#_delete) | **POST** /api/v1/accounts/me/deletion |  |
| [**sendCode1**](AccountDeletionControllerApi.md#sendcode1) | **POST** /api/v1/accounts/me/deletion-codes |  |



## _delete

> _delete(deleteAccountRequest)



### Example

```ts
import {
  Configuration,
  AccountDeletionControllerApi,
} from '';
import type { DeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountDeletionControllerApi();

  const body = {
    // DeleteAccountRequest
    deleteAccountRequest: ...,
  } satisfies DeleteRequest;

  try {
    const data = await api._delete(body);
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
| **deleteAccountRequest** | [DeleteAccountRequest](DeleteAccountRequest.md) |  | |

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


## sendCode1

> sendCode1()



### Example

```ts
import {
  Configuration,
  AccountDeletionControllerApi,
} from '';
import type { SendCode1Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountDeletionControllerApi();

  try {
    const data = await api.sendCode1();
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

