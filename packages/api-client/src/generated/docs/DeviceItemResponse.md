
# DeviceItemResponse


## Properties

Name | Type
------------ | -------------
`id` | number
`deviceId` | string
`deviceName` | string
`deviceType` | string
`location` | string
`loginMethod` | string
`lastActiveAt` | Date
`isCurrent` | boolean

## Example

```typescript
import type { DeviceItemResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "deviceId": null,
  "deviceName": null,
  "deviceType": null,
  "location": null,
  "loginMethod": null,
  "lastActiveAt": null,
  "isCurrent": null,
} satisfies DeviceItemResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DeviceItemResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


