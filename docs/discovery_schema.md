# Federation Discovery Endpoint Schema

This document specifies the JSON response schema expected by `fedimint-sdk` when querying an app-supplied federation discovery endpoint via `Sdk::discover_federations(url)`.

## Overview

The discovery endpoint must return an HTTP 200 response with `Content-Type: application/json` containing a JSON array of federation objects.

An application or community maintainer can host this file statically (e.g. on GitHub Pages, S3, or a standard web server) or serve it dynamically from a backend API.

## Requirements & Constraints

1. **Transport**:
   - The URL must use the `https://` or `http://` scheme.
2. **Payload Size Limit**:
   - The response payload must not exceed **1 MB** (1,000,000 bytes). Responses exceeding this limit are rejected with `ErrorCode::InvalidInput`.
3. **Resilience**:
   - The SDK validates each entry individually. Entries missing required fields, containing invalid invite codes, or carrying an expired timestamp are silently skipped. A malformed entry does not fail the entire query.

---

## JSON Schema

The root of the response must be a JSON array:

```json
[
  {
    "id": "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a",
    "invite": "fed11qgqpqrnhwden5te0vehk7tnzv9ez7qqpyq4z52329g4z52329g4z52329g4z52329g4z52329g4z52329g4z5wa8phk",
    "federation_name": "Community Federation",
    "federation_icon_url": "https://example.com/icon.png",
    "welcome_message": "Welcome to our community federation!",
    "popup_end_timestamp": 1893456000
  }
]
```

### Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | The 64-character lowercase hex federation identifier (`FederationId`). |
| `invite` | `string` | The canonical `fed1...` bech32m invite code (`InviteCode`). |

### Standard Metadata Fields

Publishers should reuse the standard key conventions from `fedimint`'s `docs/meta_fields/`:

| Field | Type | Description |
|---|---|---|
| `federation_name` | `string` | Human-readable name of the federation. |
| `federation_icon_url` | `string` | HTTPS URL pointing to the federation's icon/avatar. |
| `welcome_message` | `string` | A short welcome or introductory message for users previewing the federation. |
| `popup_end_timestamp` | `number` or `string` | Unix timestamp in seconds. If this timestamp is in the past, the SDK drops the entry as expired. |

### Arbitrary Metadata Fields

Any additional keys present in the JSON object will be captured and exposed in the `metadata` map (`BTreeMap<String, String>`) on [`DiscoveredFederation`].

Non-string primitive values (integers, booleans) are automatically converted to their string representations.

---

## Client Validation Pipeline

When `fedimint-sdk` processes each entry:

1. **Required Fields Check**: Verifies that both `id` and `invite` are present.
2. **Federation ID Parsing**: Parses `id` as a valid 32-byte hex `FederationId`.
3. **Invite Code Parsing**: Parses `invite` as a valid bech32m `InviteCode`.
4. **Cross-Check**: Verifies that the federation ID embedded in the invite code exactly matches the declared `id`.
5. **Expiry Check**: If `popup_end_timestamp` is present and earlier than the current system time (in seconds), the entry is dropped.
6. **Metadata Extraction**: All remaining fields are collected into the `metadata` key-value map.
