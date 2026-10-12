//! Federation discovery types for app-supplied discovery endpoints.
//!
//! A [`DiscoveredFederation`] is a lightweight record returned by an
//! app-supplied federation index or discovery endpoint. It carries typed,
//! validated identifiers: a [`FederationId`] and an [`InviteCode`] that has
//! been verified to match the declared federation ID. Any additional
//! publisher-supplied fields (such as `federation_name`, `federation_icon_url`,
//! `welcome_message`, `popup_end_timestamp`) are collected into a metadata map.
//!
//! Discovered entries are *advertisements*, not proven federation configuration.
//! To verify a federation, feed its [`invite`](DiscoveredFederation::invite)
//! to [`Sdk::preview`](crate::Sdk::preview) or [`Sdk::join`](crate::Sdk::join).

use std::collections::BTreeMap;

use serde::Deserialize;

use crate::{FederationId, InviteCode};

/// One federation entry from an app-supplied discovery endpoint.
///
/// This is an *advertisement*, not verified federation state. The `invite`
/// field has been parsed and its embedded federation ID cross-checked against
/// `id`, but the metadata is whatever the list publisher claims — not what
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
    /// Publisher-supplied metadata for the entry.
    ///
    /// Key names follow the same conventions as
    /// [`FederationPreview::meta`](crate::FederationPreview) (e.g.
    /// `federation_name`, `federation_icon_url`, `welcome_message`,
    /// `popup_end_timestamp`), but this data is unverified: it is what the
    /// list publisher states, not what the guardians serve.
    pub metadata: BTreeMap<String, String>,
}

/// The raw JSON shape an app-supplied discovery endpoint returns per entry.
///
/// `id` and `invite` are extracted as typed fields; every other key lands
/// in `metadata` via `#[serde(flatten)]`.
#[derive(Deserialize)]
pub(crate) struct RawDiscoveredFederation {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub invite: Option<String>,
    /// All remaining JSON keys become metadata entries.
    #[serde(flatten)]
    pub metadata: BTreeMap<String, serde_json::Value>,
}

impl std::convert::TryFrom<RawDiscoveredFederation> for DiscoveredFederation {
    type Error = &'static str;

    fn try_from(raw: RawDiscoveredFederation) -> std::result::Result<Self, Self::Error> {
        // 1. Both id and invite must be present (trimmed of whitespace)
        let id_str = raw.id.as_deref().map(str::trim).ok_or("missing id")?;
        let invite_str = raw.invite.as_deref().map(str::trim).ok_or("missing invite")?;

        // 2. Parse id into FederationId
        let id: FederationId = id_str.parse().map_err(|_| "invalid federation id")?;

        // 3. Parse invite into InviteCode
        let invite = InviteCode::parse(invite_str.to_string()).map_err(|_| "invalid invite code")?;

        // 4. Cross-check: invite's embedded federation ID must match the declared id
        if invite.federation_id() != id {
            return Err("invite code federation id does not match declared id");
        }

        // 5. Check popup_end_timestamp expiry (if present)
        if let Some(ts_val) = raw.metadata.get("popup_end_timestamp") {
            let ts_opt = match ts_val {
                serde_json::Value::Number(n) => n.as_u64(),
                serde_json::Value::String(s) => s.parse::<u64>().ok(),
                _ => None,
            };
            if let Some(ts) = ts_opt {
                let now = fedimint_core::time::duration_since_epoch().as_secs();
                if ts < now {
                    return Err("entry expired (popup_end_timestamp in the past)");
                }
            }
        }

        // 6. Convert remaining metadata values to strings, dropping explicit nulls
        let metadata: BTreeMap<String, String> = raw
            .metadata
            .into_iter()
            .filter_map(|(k, v)| match v {
                serde_json::Value::Null => None,
                serde_json::Value::String(s) => Some((k, s)),
                other => Some((k, other.to_string())),
            })
            .collect();

        Ok(DiscoveredFederation { id, invite, metadata })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const CODE: &str =
        "fed11qgqpqrnhwden5te0vehk7tnzv9ez7qqpyq4z52329g4z52329g4z52329g4z52329g4z52329g4z52329g4z5wa8phk";
    const CODE_FEDERATION_ID: &str =
        "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a";

    #[test]
    fn parses_a_minimal_valid_entry() {
        let json = format!(r#"{{"id":"{CODE_FEDERATION_ID}","invite":"{CODE}"}}"#);
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).expect("Failed to parse");
        assert_eq!(fed.id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(fed.invite, CODE.parse::<InviteCode>().unwrap());
        assert!(fed.metadata.is_empty());
    }

    #[test]
    fn parses_entry_with_metadata() {
        let json = format!(
            r#"{{
                "id": "{CODE_FEDERATION_ID}",
                "invite": "{CODE}",
                "federation_name": "Test Federation",
                "custom_metric": 42,
                "is_active": true
            }}"#
        );
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).expect("Failed to parse");
        assert_eq!(fed.id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(fed.metadata.get("federation_name").unwrap(), "Test Federation");
        assert_eq!(fed.metadata.get("custom_metric").unwrap(), "42");
        assert_eq!(fed.metadata.get("is_active").unwrap(), "true");
    }

    #[test]
    fn drops_entry_with_missing_id() {
        let json = format!(r#"{{"invite":"{CODE}"}}"#);
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_entry_with_missing_invite() {
        let json = format!(r#"{{"id":"{CODE_FEDERATION_ID}"}}"#);
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_entry_with_invalid_id() {
        let json = format!(r#"{{"id":"not-a-valid-hex-id","invite":"{CODE}"}}"#);
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_entry_with_invalid_invite() {
        let json = format!(r#"{{"id":"{CODE_FEDERATION_ID}","invite":"fed1invalid"}}"#);
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_entry_with_id_mismatch() {
        let other_id = "1111111111111111111111111111111111111111111111111111111111111111";
        let json = format!(r#"{{"id":"{other_id}","invite":"{CODE}"}}"#);
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        let res = DiscoveredFederation::try_from(raw);
        assert!(res.is_err());
        assert_eq!(
            res.unwrap_err(),
            "invite code federation id does not match declared id"
        );
    }

    #[test]
    fn drops_expired_entry_by_numeric_timestamp() {
        let json = format!(
            r#"{{
                "id": "{CODE_FEDERATION_ID}",
                "invite": "{CODE}",
                "popup_end_timestamp": 1000
            }}"#
        );
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        let res = DiscoveredFederation::try_from(raw);
        assert!(res.is_err());
        assert_eq!(
            res.unwrap_err(),
            "entry expired (popup_end_timestamp in the past)"
        );
    }

    #[test]
    fn drops_expired_entry_by_string_timestamp() {
        let json = format!(
            r#"{{
                "id": "{CODE_FEDERATION_ID}",
                "invite": "{CODE}",
                "popup_end_timestamp": "1000"
            }}"#
        );
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        let res = DiscoveredFederation::try_from(raw);
        assert!(res.is_err());
        assert_eq!(
            res.unwrap_err(),
            "entry expired (popup_end_timestamp in the past)"
        );
    }

    #[test]
    fn accepts_future_timestamp() {
        // Far in the future
        let future_ts = 4102444800u64;
        let json = format!(
            r#"{{
                "id": "{CODE_FEDERATION_ID}",
                "invite": "{CODE}",
                "popup_end_timestamp": {future_ts}
            }}"#
        );
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).expect("should parse");
        assert_eq!(
            fed.metadata.get("popup_end_timestamp").unwrap(),
            &future_ts.to_string()
        );
    }

    #[test]
    fn drops_empty_object() {
        let json = r#"{}"#;
        let raw: RawDiscoveredFederation = serde_json::from_str(json).unwrap();
        assert!(DiscoveredFederation::try_from(raw).is_err());
    }

    #[test]
    fn drops_null_metadata_values() {
        let json = format!(
            r#"{{
                "id": "{CODE_FEDERATION_ID}",
                "invite": "{CODE}",
                "federation_name": "Valid Name",
                "null_field": null
            }}"#
        );
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).expect("should parse");
        assert_eq!(fed.metadata.get("federation_name").unwrap(), "Valid Name");
        assert!(fed.metadata.get("null_field").is_none());
    }

    #[test]
    fn trims_whitespace_on_id_and_invite() {
        let json = format!(
            r#"{{
                "id": "   {CODE_FEDERATION_ID}   ",
                "invite": "   {CODE}   "
            }}"#
        );
        let raw: RawDiscoveredFederation = serde_json::from_str(&json).unwrap();
        let fed = DiscoveredFederation::try_from(raw).expect("should parse");
        assert_eq!(fed.id, CODE_FEDERATION_ID.parse::<FederationId>().unwrap());
        assert_eq!(fed.invite, CODE.parse::<InviteCode>().unwrap());
    }
}
