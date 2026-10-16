//! Federation discovery types for Nostr NIP-87 announcements and local dev fixtures.
//!
//! A [`DiscoveredFederation`] is a lightweight record representing a federation
//! discovered either from a local dev mock ([`DiscoverySource::Dev`])
//! or from Nostr NIP-87 (`kind:38173`) federation announcement events
//! ([`DiscoverySource::Nostr`]).
//!
//! Note that the dev mock ([`DiscoverySource::Dev`]) is a display-only placeholder
//! with a dummy test vector invite pointing at `wss://foo.bar/`; attempting to
//! [`Sdk::preview`](crate::Sdk::preview) or [`Sdk::join`](crate::Sdk::join) it
//! will fail to connect.
//!
//! Discovered entries are *advertisements*, not proven federation configuration.
//! To verify a federation, feed its [`invite`](DiscoveredFederation::invite)
//! to [`Sdk::preview`](crate::Sdk::preview) or [`Sdk::join`](crate::Sdk::join).

use std::collections::BTreeMap;

use serde::Deserialize;

use crate::{FederationId, InviteCode, Network};

/// Specifies the source for discovering federations.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DiscoverySource {
    /// Dev mode: returns a hardcoded display-only test federation without network queries.
    ///
    /// This fixture uses a dummy test invite (`wss://foo.bar/`) intended for UI
    /// layout and offline rendering; previewing or joining it will fail to connect.
    Dev,
    /// Production mode: queries Nostr relays for NIP-87 (`kind:38173`) federation announcements.
    Nostr {
        /// Nostr relay websocket URLs (e.g. `["wss://relay.damus.io"]`).
        relays: Vec<String>,
    },
}

impl DiscoverySource {
    /// Default relays to query in production mode when none are explicitly provided.
    pub const DEFAULT_RELAYS: &'static [&'static str] = &[
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.primal.net",
    ];

    /// Convenient constructor for production mode using default community relays.
    pub fn nostr_default() -> Self {
        Self::Nostr {
            relays: Self::DEFAULT_RELAYS.iter().map(|s| s.to_string()).collect(),
        }
    }
}

/// One federation entry discovered from Nostr NIP-87 or a dev fixture.
///
/// This is an *advertisement*, not verified federation state. The `invite`
/// field has been parsed and its embedded federation ID cross-checked against
/// `id`, but the metadata is whatever the publisher claims — not what
/// the guardians serve. Use [`Sdk::preview`](crate::Sdk::preview) or
/// [`Sdk::join`](crate::Sdk::join) to verify.
///
/// This type is `#[non_exhaustive]`: new fields may be added in future releases.
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub struct DiscoveredFederation {
    /// The federation's identifier, parsed and validated.
    pub id: FederationId,
    /// The federation's invite code, parsed, validated, and cross-checked
    /// against `id`.
    pub invite: InviteCode,
    /// The federation's advertised human-readable name, if provided.
    pub name: Option<String>,
    /// The Bitcoin network this federation advertises operating on, if recognized.
    pub network: Option<Network>,
    /// The kind names of modules advertised by the federation (e.g. `["lightning", "wallet", "mint"]`).
    pub modules: Vec<String>,
    /// Publisher-supplied metadata for the entry.
    ///
    /// Extracted from NIP-87 event tags (e.g. `modules`, `network`, `publisher_pubkey`)
    /// and event content (e.g. `name`, `picture`, `about` / `description`).
    pub metadata: BTreeMap<String, String>,
}

fn parse_network(s: &str) -> Option<Network> {
    match s.trim().to_ascii_lowercase().as_str() {
        "bitcoin" | "mainnet" => Some(Network::Bitcoin),
        "testnet" | "testnet3" => Some(Network::Testnet),
        "testnet4" => Some(Network::Testnet4),
        "signet" => Some(Network::Signet),
        "regtest" => Some(Network::Regtest),
        _ => None,
    }
}

impl DiscoveredFederation {
    /// Returns the hardcoded display-only test federation for dev/offline mode.
    ///
    /// The returned entry contains placeholder metadata and a dummy invite code
    /// that cannot be previewed or joined.
    pub fn dev() -> Self {
        dev_federation()
    }
}

/// Returns the hardcoded display-only test federation for dev/offline mode.
///
/// See [`DiscoveredFederation::dev`].
pub(crate) fn dev_federation() -> DiscoveredFederation {
    let id: FederationId = "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a"
        .parse()
        .expect("valid dev federation id");
    let invite = InviteCode::parse(
        "fed11qgqpqrnhwden5te0vehk7tnzv9ez7qqpyq4z52329g4z52329g4z52329g4z52329g4z52329g4z52329g4z5wa8phk"
            .to_string(),
    )
    .expect("valid dev invite code");
    let mut metadata = BTreeMap::new();
    metadata.insert("name".to_string(), "Dev Test Federation".to_string());
    metadata.insert(
        "federation_name".to_string(),
        "Dev Test Federation".to_string(),
    );
    metadata.insert("network".to_string(), "regtest".to_string());
    metadata.insert("modules".to_string(), "lightning,wallet,mint".to_string());
    DiscoveredFederation {
        id,
        invite,
        name: Some("Dev Test Federation".to_string()),
        network: Some(Network::Regtest),
        modules: vec![
            "lightning".to_string(),
            "wallet".to_string(),
            "mint".to_string(),
        ],
        metadata,
    }
}

/// Raw representation of a Nostr NIP-87 `kind:38173` event.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct RawNip87Event {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub pubkey: Option<String>,
    #[serde(default)]
    pub created_at: Option<u64>,
    #[serde(default)]
    pub kind: Option<u64>,
    #[serde(default)]
    pub tags: Vec<Vec<String>>,
    #[serde(default)]
    pub content: String,
}

impl std::convert::TryFrom<RawNip87Event> for DiscoveredFederation {
    type Error = &'static str;

    fn try_from(raw: RawNip87Event) -> std::result::Result<Self, Self::Error> {
        // 1. Verify event kind
        if raw.kind != Some(38173) {
            return Err("missing or unsupported event kind: expected 38173");
        }

        // 2. Extract federation ID from 'd' tag
        let d_tag = raw
            .tags
            .iter()
            .find(|t| t.first().map(String::as_str) == Some("d"))
            .ok_or("missing d tag (federation id)")?;
        let id_str = d_tag
            .get(1)
            .map(String::as_str)
            .map(str::trim)
            .ok_or("empty d tag value")?;
        let id: FederationId = id_str
            .parse()
            .map_err(|_| "invalid federation id in d tag")?;

        // 3. Find first matching invite code from 'u' tags
        let invite = raw
            .tags
            .iter()
            .filter(|t| t.first().map(String::as_str) == Some("u"))
            .filter_map(|tag| tag.get(1).map(String::as_str).map(str::trim))
            .filter_map(|val| InviteCode::parse(val.to_string()).ok())
            .find(|parsed| parsed.federation_id() == id)
            .ok_or("no matching invite code in u tags for declared federation id")?;

        // 4. Build metadata map
        let mut metadata = BTreeMap::new();

        // Parse content: kind:0-style JSON metadata or plain description.
        // Skip reserved protocol keys so untrusted content cannot spoof advertised event metadata.
        let content_trimmed = raw.content.trim();
        if !content_trimmed.is_empty() {
            if let Ok(serde_json::Value::Object(map)) =
                serde_json::from_str::<serde_json::Value>(content_trimmed)
            {
                for (k, v) in map {
                    if matches!(k.as_str(), "publisher_pubkey" | "modules" | "network") {
                        continue;
                    }
                    match v {
                        serde_json::Value::Null => {}
                        serde_json::Value::String(s) => {
                            metadata.insert(k, s);
                        }
                        other => {
                            metadata.insert(k, other.to_string());
                        }
                    }
                }
            } else {
                metadata.insert("description".to_string(), content_trimmed.to_string());
            }
        }

        // Event envelope publisher pubkey (unverified advertisement metadata)
        if let Some(pk) = raw.pubkey {
            metadata.insert("publisher_pubkey".to_string(), pk);
        }

        // Extract advertised NIP-87 tags
        for tag in &raw.tags {
            match tag.first().map(String::as_str) {
                Some("modules") => {
                    if let Some(val) = tag.get(1) {
                        metadata.insert("modules".to_string(), val.trim().to_string());
                    }
                }
                Some("n") => {
                    if let Some(val) = tag.get(1) {
                        metadata.insert("network".to_string(), val.trim().to_string());
                    }
                }
                _ => {}
            }
        }

        let name = metadata
            .get("name")
            .cloned()
            .or_else(|| metadata.get("federation_name").cloned());
        let network = metadata.get("network").and_then(|s| parse_network(s));
        let modules = metadata
            .get("modules")
            .map(|s| {
                s.split(',')
                    .map(str::trim)
                    .filter(|m| !m.is_empty())
                    .map(ToString::to_string)
                    .collect()
            })
            .unwrap_or_default();

        Ok(DiscoveredFederation {
            id,
            invite,
            name,
            network,
            modules,
            metadata,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const CODE: &str = "fed11qgqpqrnhwden5te0vehk7tnzv9ez7qqpyq4z52329g4z52329g4z52329g4z52329g4z52329g4z52329g4z5wa8phk";
    const CODE_FEDERATION_ID: &str =
        "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a";

    #[test]
    fn parses_valid_nip87_event() {
        let json = format!(
            r#"{{
                "kind": 38173,
                "pubkey": "deadbeef1234",
                "content": "{{\"name\": \"Test Fed\", \"picture\": \"https://example.com/logo.png\"}}",
                "tags": [
                    ["d", "{CODE_FEDERATION_ID}"],
                    ["u", "{CODE}"],
                    ["modules", "lightning,wallet,mint"],
                    ["n", "signet"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).expect("should parse");
        assert_eq!(fed.id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(fed.invite, CODE.parse::<InviteCode>().unwrap());
        assert_eq!(fed.name.as_deref(), Some("Test Fed"));
        assert_eq!(fed.network, Some(Network::Signet));
        assert_eq!(
            fed.modules,
            vec![
                "lightning".to_string(),
                "wallet".to_string(),
                "mint".to_string()
            ]
        );
        assert_eq!(fed.metadata.get("name").unwrap(), "Test Fed");
        assert_eq!(
            fed.metadata.get("picture").unwrap(),
            "https://example.com/logo.png"
        );
        assert_eq!(
            fed.metadata.get("modules").unwrap(),
            "lightning,wallet,mint"
        );
        assert_eq!(fed.metadata.get("network").unwrap(), "signet");
        assert_eq!(
            fed.metadata.get("publisher_pubkey").unwrap(),
            "deadbeef1234"
        );
    }

    #[test]
    fn parses_nip87_event_with_multiple_u_tags() {
        let invalid_code = "fed11invalidinvitecodethatfails";
        let other_valid_code = "fed11qgqpqrnhwden5te0vehk7tnzv9ez7qqpyq4z52329g4z52329g4z52329g4z52329g4z52329g4z52329g4z5wa8phk";
        let json = format!(
            r#"{{
                "kind": 38173,
                "tags": [
                    ["d", "{CODE_FEDERATION_ID}"],
                    ["u", "{invalid_code}"],
                    ["u", "{other_valid_code}"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        let fed =
            DiscoveredFederation::try_from(raw).expect("should pick valid matching invite code");
        assert_eq!(fed.id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(fed.invite, CODE.parse::<InviteCode>().unwrap());
    }

    #[test]
    fn parses_nip87_event_with_plain_text_content() {
        let json = format!(
            r#"{{
                "kind": 38173,
                "content": "This is a plain text community mint description",
                "tags": [
                    ["d", "{CODE_FEDERATION_ID}"],
                    ["u", "{CODE}"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).expect("should parse");
        assert_eq!(
            fed.metadata.get("description").unwrap(),
            "This is a plain text community mint description"
        );
    }

    #[test]
    fn drops_event_with_wrong_kind() {
        let json = format!(
            r#"{{
                "kind": 1,
                "tags": [
                    ["d", "{CODE_FEDERATION_ID}"],
                    ["u", "{CODE}"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_event_with_missing_kind() {
        let json = format!(
            r#"{{
                "tags": [
                    ["d", "{CODE_FEDERATION_ID}"],
                    ["u", "{CODE}"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_event_with_missing_d_tag() {
        let json = format!(
            r#"{{
                "kind": 38173,
                "tags": [
                    ["u", "{CODE}"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_event_with_invalid_federation_id() {
        let json = format!(
            r#"{{
                "kind": 38173,
                "tags": [
                    ["d", "not-a-valid-hex-id"],
                    ["u", "{CODE}"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_event_with_id_mismatch() {
        let other_id = "1111111111111111111111111111111111111111111111111111111111111111";
        let json = format!(
            r#"{{
                "kind": 38173,
                "tags": [
                    ["d", "{other_id}"],
                    ["u", "{CODE}"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        let res = DiscoveredFederation::try_from(raw);
        assert!(res.is_err());
        assert_eq!(
            res.unwrap_err(),
            "no matching invite code in u tags for declared federation id"
        );
    }

    #[test]
    fn test_dev_federation_fixture() {
        let dev = dev_federation();
        assert_eq!(dev, DiscoveredFederation::dev());
        assert_eq!(dev.id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(dev.invite, CODE.parse::<InviteCode>().unwrap());
        assert_eq!(dev.name.as_deref(), Some("Dev Test Federation"));
        assert_eq!(dev.network, Some(Network::Regtest));
        assert_eq!(
            dev.modules,
            vec![
                "lightning".to_string(),
                "wallet".to_string(),
                "mint".to_string()
            ]
        );
        assert_eq!(
            dev.metadata.get("federation_name").unwrap(),
            "Dev Test Federation"
        );
        assert_eq!(dev.metadata.get("name").unwrap(), "Dev Test Federation");
        assert_eq!(dev.metadata.get("network").unwrap(), "regtest");
    }

    #[test]
    fn test_content_does_not_overwrite_reserved_metadata_keys() {
        let json = format!(
            r#"{{
                "kind": 38173,
                "pubkey": "real_pubkey_123",
                "content": "{{\"publisher_pubkey\": \"spoofed_pubkey\", \"modules\": \"spoofed_module\", \"network\": \"mainnet\", \"custom_attr\": \"ok\"}}",
                "tags": [
                    ["d", "{CODE_FEDERATION_ID}"],
                    ["u", "{CODE}"],
                    ["modules", "mint,wallet"],
                    ["n", "signet"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).unwrap();
        assert_eq!(
            fed.metadata.get("publisher_pubkey").unwrap(),
            "real_pubkey_123"
        );
        assert_eq!(fed.metadata.get("modules").unwrap(), "mint,wallet");
        assert_eq!(fed.metadata.get("network").unwrap(), "signet");
        assert_eq!(fed.metadata.get("custom_attr").unwrap(), "ok");
    }

    #[test]
    fn test_reserved_metadata_keys_rejected_from_content_when_tags_absent() {
        let json = format!(
            r#"{{
                "kind": 38173,
                "content": "{{\"publisher_pubkey\": \"spoofed_pubkey\", \"modules\": \"spoofed_module\", \"network\": \"spoofed_net\", \"custom_attr\": \"ok\"}}",
                "tags": [
                    ["d", "{CODE_FEDERATION_ID}"],
                    ["u", "{CODE}"]
                ]
            }}"#
        );
        let raw: RawNip87Event = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).unwrap();
        assert!(!fed.metadata.contains_key("publisher_pubkey"));
        assert!(!fed.metadata.contains_key("modules"));
        assert!(!fed.metadata.contains_key("network"));
        assert_eq!(fed.metadata.get("custom_attr").unwrap(), "ok");
    }
}
