# AccountAuthControllerApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**phoneSmsAuth**](AccountAuthControllerApi.md#phonesmsauthoperation) | **POST** /api/v1/accounts/phone-sms-auth |  |



## phoneSmsAuth

> LoginResponse phoneSmsAuth(phoneSmsAuthRequest)



### Example

```ts
import {
  Configuration,
  AccountAuthControllerApi,
} from '';
import type { PhoneSmsAuthOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AccountAuthControllerApi();

  const body = {
    // PhoneSmsAuthRequest
    phoneSmsAuthRequest: ...,
  } satisfies PhoneSmsAuthOperationRequest;

  try {
    const data = await api.phoneSmsAuth(body);
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
| **phoneSmsAuthRequest** | [PhoneSmsAuthRequest](PhoneSmsAuthRequest.md) |  | |

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

