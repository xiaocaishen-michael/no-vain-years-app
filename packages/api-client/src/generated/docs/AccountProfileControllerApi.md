# AccountProfileControllerApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getMe**](AccountProfileControllerApi.md#getme) | **GET** /api/v1/accounts/me |  |
| [**patchMe**](AccountProfileControllerApi.md#patchme) | **PATCH** /api/v1/accounts/me |  |



## getMe

> AccountProfileResponse getMe()



### Example

```ts
import {
  Configuration,
  AccountProfileControllerApi,
} from '';
import type { GetMeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountProfileControllerApi();

  try {
    const data = await api.getMe();
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

[**AccountProfileResponse**](AccountProfileResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## patchMe

> AccountProfileResponse patchMe(updateDisplayNameRequest)



### Example

```ts
import {
  Configuration,
  AccountProfileControllerApi,
} from '';
import type { PatchMeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountProfileControllerApi();

  const body = {
    // UpdateDisplayNameRequest
    updateDisplayNameRequest: ...,
  } satisfies PatchMeRequest;

  try {
    const data = await api.patchMe(body);
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
| **updateDisplayNameRequest** | [UpdateDisplayNameRequest](UpdateDisplayNameRequest.md) |  | |

### Return type

[**AccountProfileResponse**](AccountProfileResponse.md)

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

