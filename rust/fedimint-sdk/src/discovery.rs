//! Federation discovery: fetch a list of known federations from an external
//! discovery endpoint.
//!
//! The fetch itself is platform-specific:
//! - **Native** (iOS, Android, desktop): [`reqwest`], an async HTTP client
//!   already present in the workspace dependency tree.
//! - **WASM** (browser): [`gloo_net`], a thin wrapper around the browser's
//!   built-in `fetch()` API, with effectively zero binary-size cost.
//!
//! Both paths parse the same JSON schema into [`DiscoveredFederation`] via
//! the crate-private [`RawDiscoveredFederation`](crate::types::discovery::RawDiscoveredFederation)
//! intermediate. Each entry's invite code is parsed, its federation ID cross-checked,
//! and expired entries (based on `popup_end_timestamp`) are dropped. Malformed entries
//! are silently skipped.

use fedimint_core::util::SafeUrl;

use crate::types::discovery::RawDiscoveredFederation;
use crate::{DiscoveredFederation, Error, ErrorCode, Result};

/// Fetches a list of federations from the given URL.
///
/// The URL is always app-supplied; there is no default.
///
/// Each entry is validated: its invite code is parsed, its federation ID
/// is cross-checked against the invite code, and entries whose
/// `popup_end_timestamp` is in the past are dropped. Malformed entries
/// are silently skipped.
///
/// # Errors
///
/// [`ErrorCode::Timeout`] when the request times out after 30 seconds.
/// [`ErrorCode::InvalidInput`] when the URL is invalid, exceeds 1MB,
/// or the response is not a JSON array.
/// [`ErrorCode::Internal`] when the HTTP request fails or returns non-2xx.
pub async fn fetch_discovered_federations(
    url: &str,
) -> Result<Vec<DiscoveredFederation>> {
    validate_discovery_url(url)?;

    let body = fetch_body(url).await?;
    parse_discovery_response(&body)
}

fn validate_discovery_url(url: &str) -> Result<()> {
    let parsed_url = SafeUrl::parse(url).map_err(|e| {
        Error::new(
            ErrorCode::InvalidInput,
            format!("Discovery URL is structurally invalid: {e}"),
        )
    })?;

    if parsed_url.scheme() != "https" && parsed_url.scheme() != "http" {
        return Err(Error::new(
            ErrorCode::InvalidInput,
            "Discovery URLs must use the https:// or http:// scheme.",
        ));
    }

    Ok(())
}

fn parse_discovery_response(body: &str) -> Result<Vec<DiscoveredFederation>> {
    if body.len() > 1_000_000 {
        return Err(Error::new(
            ErrorCode::InvalidInput,
            "Discovery parse error: API payload exceeded 1MB limit",
        ));
    }

    let raw_values: Vec<serde_json::Value> = serde_json::from_str(body).map_err(|e| {
        Error::new(
            ErrorCode::InvalidInput,
            format!("Discovery parse error: response is not a JSON array: {e}"),
        )
    })?;

    let federations: Vec<DiscoveredFederation> = raw_values
        .into_iter()
        .filter_map(|val| serde_json::from_value::<RawDiscoveredFederation>(val).ok())
        .filter_map(|r| r.try_into().ok())
        .collect();

    Ok(federations)
}

// ---------------------------------------------------------------------------
// Platform-specific fetch implementations
// ---------------------------------------------------------------------------

/// Native fetch: uses `reqwest` since it is already inside the dependency tree.
#[cfg(not(target_family = "wasm"))]
async fn fetch_body(url: &str) -> Result<String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("fedimint-sdk/discovery")
        .build()
        .map_err(|e| {
            Error::new(
                ErrorCode::Internal,
                format!("Discovery API error: failed to build HTTP client: {e}"),
            )
        })?;

    let mut response = client.get(url).send().await.map_err(|e| {
        if e.is_timeout() {
            Error::new(ErrorCode::Timeout, "Discovery API error: request timed out after 30s")
        } else {
            Error::new(
                ErrorCode::Internal,
                format!("Discovery API error: HTTP request failed: {e}"),
            )
        }
    })?;

    if !response.status().is_success() {
        return Err(Error::new(
            ErrorCode::Internal,
            format!("Discovery API error: endpoint returned HTTP {}", response.status()),
        ));
    }

    if let Some(len) = response.content_length() {
        if len > 1_000_000 {
            return Err(Error::new(
                ErrorCode::InvalidInput,
                "Discovery API error: payload exceeded 1MB limit",
            ));
        }
    }

    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|e| {
        Error::new(
            ErrorCode::Internal,
            format!("Discovery API error: failed to read response chunk: {e}"),
        )
    })? {
        if bytes.len() + chunk.len() > 1_000_000 {
            return Err(Error::new(
                ErrorCode::InvalidInput,
                "Discovery API error: payload exceeded 1MB limit",
            ));
        }
        bytes.extend_from_slice(&chunk);
    }

    String::from_utf8(bytes).map_err(|e| {
        Error::new(
            ErrorCode::InvalidInput,
            format!("Discovery API error: response is not valid UTF-8: {e}"),
        )
    })
}

/// WASM fetch: uses `gloo_net` which delegates to the browser's `fetch()` API.
#[cfg(target_family = "wasm")]
async fn fetch_body(url: &str) -> Result<String> {
    use gloo_net::http::Request;
    use web_sys::AbortController;

    let controller = AbortController::new().map_err(|_| {
        Error::new(ErrorCode::Internal, "failed to create AbortController")
    })?;
    let signal = controller.signal();

    let request = Request::get(url).abort_signal(Some(&signal));

    let fetch_future = async {
        let response = request.send().await.map_err(|e| {
            Error::new(
                ErrorCode::Internal,
                format!("Discovery API error: HTTP request failed: {e}"),
            )
        })?;

        if !response.ok() {
            return Err(Error::new(
                ErrorCode::Internal,
                format!("Discovery API error: endpoint returned HTTP {}", response.status()),
            ));
        }

        if let Some(cl) = response.headers().get("content-length") {
            if let Ok(len) = cl.parse::<usize>() {
                if len > 1_000_000 {
                    return Err(Error::new(
                        ErrorCode::InvalidInput,
                        "Discovery API error: payload exceeded 1MB limit",
                    ));
                }
            }
        }

        response.text().await.map_err(|e| {
            Error::new(
                ErrorCode::Internal,
                format!("Discovery API error: failed to read response body: {e}"),
            )
        })
    };

    let (sender, receiver) = futures::channel::oneshot::channel();
    let timeout_id = gloo_timers::callback::Timeout::new(30_000, move || {
        let _ = sender.send(());
    });

    let result = tokio::select! {
        res = fetch_future => res,
        _ = receiver => {
            controller.abort();
            Err(Error::new(ErrorCode::Timeout, "Discovery API error: request timed out after 30s"))
        }
    };

    timeout_id.cancel();
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{FederationId, InviteCode};

    const CODE: &str =
        "fed11qgqpqrnhwden5te0vehk7tnzv9ez7qqpyq4z52329g4z52329g4z52329g4z52329g4z52329g4z52329g4z5wa8phk";
    const CODE_FEDERATION_ID: &str =
        "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a";

    #[test]
    fn test_parse_discovery_response_valid() {
        let json = format!(
            r#"[
                {{
                    "id": "{CODE_FEDERATION_ID}",
                    "invite": "{CODE}",
                    "federation_name": "Test Fed"
                }}
            ]"#
        );
        let feds = parse_discovery_response(&json).expect("should parse");
        assert_eq!(feds.len(), 1);
        assert_eq!(feds[0].id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(feds[0].invite, CODE.parse::<InviteCode>().unwrap());
        assert_eq!(feds[0].metadata.get("federation_name").unwrap(), "Test Fed");
    }

    #[test]
    fn test_parse_discovery_response_filters_invalid_entries() {
        let json = format!(
            r#"[
                {{ "invalid": true }},
                {{ "id": "{CODE_FEDERATION_ID}" }},
                {{ "invite": "{CODE}" }},
                {{
                    "id": "{CODE_FEDERATION_ID}",
                    "invite": "{CODE}",
                    "popup_end_timestamp": 1000
                }},
                {{
                    "id": "{CODE_FEDERATION_ID}",
                    "invite": "{CODE}",
                    "federation_name": "Valid Fed"
                }}
            ]"#
        );
        let feds = parse_discovery_response(&json).expect("should parse");
        assert_eq!(feds.len(), 1);
        assert_eq!(feds[0].id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(feds[0].metadata.get("federation_name").unwrap(), "Valid Fed");
    }

    #[test]
    fn test_parse_discovery_response_not_an_array() {
        let json = r#"{"not": "an array"}"#;
        let res = parse_discovery_response(json);
        assert!(res.is_err());
        assert_eq!(res.unwrap_err().code, ErrorCode::InvalidInput);
    }

    #[test]
    fn test_parse_discovery_response_empty_array() {
        let json = r#"[]"#;
        let feds = parse_discovery_response(json).expect("should parse");
        assert!(feds.is_empty());
    }

    #[test]
    fn test_parse_discovery_payload_exceeds_1mb() {
        let large_body = " ".repeat(1_000_001);
        let res = parse_discovery_response(&large_body);
        assert!(res.is_err());
        assert_eq!(res.unwrap_err().code, ErrorCode::InvalidInput);
    }

    #[test]
    fn test_validate_url() {
        assert!(validate_discovery_url("https://example.com/federations.json").is_ok());
        assert!(validate_discovery_url("http://127.0.0.1:8080/federations.json").is_ok());
        assert!(validate_discovery_url("http://localhost:3000/federations.json").is_ok());
        assert!(validate_discovery_url("http://192.168.1.100:8080/federations.json").is_ok());
        assert!(validate_discovery_url("http://some.onion/federations.json").is_ok());
        assert!(validate_discovery_url("ftp://example.com/federations.json").is_err());
        assert!(validate_discovery_url("not a url").is_err());
    }
}
