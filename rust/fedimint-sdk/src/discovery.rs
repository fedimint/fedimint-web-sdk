//! Federation discovery: discover joinable federations either from a local
//! dev fixture or by querying Nostr relays for NIP-87 (`kind:38173`) announcements.

use std::collections::BTreeMap;
use std::time::Duration;

use crate::types::discovery::{DiscoverySource, RawNip87Event};
use crate::{DiscoveredFederation, Error, ErrorCode, FederationId, Result};

/// Discovers federations from the requested source (Dev fixture or Nostr relays).
pub async fn discover_federations(
    source: DiscoverySource,
) -> Result<Vec<DiscoveredFederation>> {
    match source {
        DiscoverySource::Dev => Ok(vec![crate::types::dev_federation()]),
        DiscoverySource::Nostr { relays } => fetch_from_nostr(relays).await,
    }
}

async fn fetch_from_nostr(relays: Vec<String>) -> Result<Vec<DiscoveredFederation>> {
    if relays.is_empty() {
        return Err(Error::new(
            ErrorCode::InvalidInput,
            "Discovery error: at least one Nostr relay must be specified",
        ));
    }

    let mut query_tasks = Vec::new();
    for relay in relays {
        query_tasks.push(query_single_relay(relay));
    }

    let results = futures::future::join_all(query_tasks).await;

    let mut all_federations: BTreeMap<FederationId, DiscoveredFederation> = BTreeMap::new();
    let mut any_success = false;

    for res in results {
        match res {
            Ok(events) => {
                any_success = true;
                for event in events {
                    if let Ok(fed) = DiscoveredFederation::try_from(event) {
                        all_federations.entry(fed.id).or_insert(fed);
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Failed to query Nostr relay: {e}");
            }
        }
    }

    if !any_success {
        return Err(Error::new(
            ErrorCode::FederationUnreachable,
            "Discovery error: all Nostr relays failed to respond",
        ));
    }

    Ok(all_federations.into_values().collect())
}

/// The Nostr subscription identifier sent to relays.
const SUB_ID: &str = "fedimint_discovery";

fn make_req_message() -> String {
    serde_json::json!(["REQ", SUB_ID, { "kinds": [38173] }]).to_string()
}

fn make_close_message() -> String {
    serde_json::json!(["CLOSE", SUB_ID]).to_string()
}

#[derive(Debug, PartialEq)]
enum RelayAction {
    Event(RawNip87Event),
    Eose,
    Ignore,
}

fn parse_relay_message(msg_str: &str) -> RelayAction {
    let Ok(val) = serde_json::from_str::<serde_json::Value>(msg_str) else {
        return RelayAction::Ignore;
    };
    let Some(arr) = val.as_array() else {
        return RelayAction::Ignore;
    };

    let msg_type = arr.first().and_then(|v| v.as_str()).unwrap_or("");
    match msg_type {
        "EVENT" => {
            if let Some(event_val) = arr.get(2) {
                if let Ok(event) = serde_json::from_value::<RawNip87Event>(event_val.clone()) {
                    return RelayAction::Event(event);
                }
            }
            RelayAction::Ignore
        }
        "EOSE" => RelayAction::Eose,
        _ => RelayAction::Ignore,
    }
}

// ---------------------------------------------------------------------------
// Platform-specific relay query implementations
// ---------------------------------------------------------------------------

#[cfg(not(target_family = "wasm"))]
async fn query_single_relay(relay_url: String) -> Result<Vec<RawNip87Event>> {
    use futures::{SinkExt, StreamExt};
    use tokio_tungstenite::connect_async;
    use tokio_tungstenite::tungstenite::Message;

    let timeout_duration = Duration::from_secs(5);
    tokio::time::timeout(timeout_duration, async {
        let (mut ws_stream, _) = connect_async(&relay_url).await.map_err(|e| {
            Error::new(
                ErrorCode::FederationUnreachable,
                format!("Discovery error: failed to connect to relay {relay_url}: {e}"),
            )
        })?;

        ws_stream
            .send(Message::text(make_req_message()))
            .await
            .map_err(|e| {
                Error::new(
                    ErrorCode::Internal,
                    format!("Discovery error: failed to send REQ to {relay_url}: {e}"),
                )
            })?;

        let mut events = Vec::new();
        while let Some(msg_result) = ws_stream.next().await {
            match msg_result {
                Ok(Message::Text(text)) => match parse_relay_message(&text) {
                    RelayAction::Event(ev) => events.push(ev),
                    RelayAction::Eose => break,
                    RelayAction::Ignore => {}
                },
                Ok(Message::Close(_)) => break,
                Err(e) => {
                    tracing::warn!("Relay {relay_url} stream error: {e}");
                    break;
                }
                _ => {}
            }
        }

        let _ = ws_stream.send(Message::text(make_close_message())).await;
        Ok(events)
    })
    .await
    .unwrap_or_else(|_| {
        tracing::warn!("Relay {relay_url} timed out after 5s");
        Ok(Vec::new())
    })
}

#[cfg(target_family = "wasm")]
async fn query_single_relay(relay_url: String) -> Result<Vec<RawNip87Event>> {
    use futures::{SinkExt, StreamExt};
    use gloo_net::websocket::futures::WebSocket;
    use gloo_net::websocket::Message;

    let mut ws = WebSocket::open(&relay_url).map_err(|e| {
        Error::new(
            ErrorCode::FederationUnreachable,
            format!("Discovery error: failed to open websocket {relay_url}: {e}"),
        )
    })?;

    ws.send(Message::Text(make_req_message()))
        .await
        .map_err(|e| {
            Error::new(
                ErrorCode::Internal,
                format!("Discovery error: failed to send REQ to {relay_url}: {e}"),
            )
        })?;

    let mut events = Vec::new();

    let (tx, mut rx) = futures::channel::oneshot::channel();
    let timeout = gloo_timers::callback::Timeout::new(5000, move || {
        let _ = tx.send(());
    });

    loop {
        tokio::select! {
            msg = ws.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => match parse_relay_message(&text) {
                        RelayAction::Event(ev) => events.push(ev),
                        RelayAction::Eose => break,
                        RelayAction::Ignore => {}
                    },
                    Some(Ok(Message::Bytes(_))) => {}
                    _ => break,
                }
            }
            _ = &mut rx => {
                tracing::warn!("Relay {relay_url} timed out on WASM");
                break;
            }
        }
    }

    timeout.cancel();
    let _ = ws.send(Message::Text(make_close_message())).await;
    Ok(events)
}

#[cfg(test)]
mod tests {
    use super::*;

    const CODE: &str =
        "fed11qgqpqrnhwden5te0vehk7tnzv9ez7qqpyq4z52329g4z52329g4z52329g4z52329g4z52329g4z52329g4z5wa8phk";
    const CODE_FEDERATION_ID: &str =
        "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a";

    #[tokio::test]
    async fn test_discover_federations_dev() {
        let feds = discover_federations(DiscoverySource::Dev)
            .await
            .expect("dev mode should succeed");
        assert_eq!(feds.len(), 1);
        assert_eq!(feds[0].id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(feds[0].metadata.get("federation_name").unwrap(), "Dev Test Federation");
    }

    #[tokio::test]
    async fn test_discover_federations_empty_relays_fails() {
        let res = discover_federations(DiscoverySource::Nostr { relays: vec![] }).await;
        assert!(res.is_err());
        assert_eq!(res.unwrap_err().code, ErrorCode::InvalidInput);
    }

    #[test]
    fn test_parse_relay_event_message() {
        let raw_msg = format!(
            r#"["EVENT", "{SUB_ID}", {{
                "kind": 38173,
                "pubkey": "pubkey123",
                "content": "{{\"name\": \"Community Fed\"}}",
                "tags": [
                    ["d", "{CODE_FEDERATION_ID}"],
                    ["u", "{CODE}"]
                ]
            }}]"#
        );
        match parse_relay_message(&raw_msg) {
            RelayAction::Event(ev) => {
                assert_eq!(ev.kind, Some(38173));
                assert_eq!(ev.pubkey.as_deref(), Some("pubkey123"));
            }
            other => panic!("expected RelayAction::Event, got {other:?}"),
        }
    }

    #[test]
    fn test_parse_relay_eose_message() {
        let raw_msg = format!(r#"["EOSE", "{SUB_ID}"]"#);
        assert_eq!(parse_relay_message(&raw_msg), RelayAction::Eose);
    }

    #[test]
    fn test_parse_relay_ignore_message() {
        let notice_msg = r#"["NOTICE", "rate-limited"]"#;
        assert_eq!(parse_relay_message(notice_msg), RelayAction::Ignore);

        let garbage_msg = r#"not json"#;
        assert_eq!(parse_relay_message(garbage_msg), RelayAction::Ignore);
    }
}
