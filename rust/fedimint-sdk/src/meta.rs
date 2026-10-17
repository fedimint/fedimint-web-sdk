//! Federation metadata, from configuration, from the override document, and from consensus.

use std::collections::BTreeMap;
use std::sync::Arc;
use std::time::Duration;

use fedimint_core::util::FmtCompact as _;

use crate::{Error, ErrorCode, Result};

/// How long `get`/`all`/`consensus_metadata` wait for the consensus data
/// before returning a timeout error.
const CONSENSUS_FETCH_TIMEOUT: Duration = Duration::from_secs(5);

/// How long `get`/`all` wait for fedimint-client's cached override entries.
///
/// Short, because the override is best-effort: once cached, the read is a local database read,
/// and before that fedimint-client's first fetch can retry for tens of seconds.
const OVERRIDE_CACHE_TIMEOUT: Duration = Duration::from_millis(500);

/// The metadata facade for one federation.
///
/// Obtained from [`Federation::meta`](crate::Federation::meta). Unlike the
/// capability facades this is unconditional: every federation has
/// configuration metadata, so there is always something here to read.
///
/// # Three sources, one merged view
///
/// A federation can describe itself in three places, and they are genuinely
/// different things:
///
/// - **Configuration metadata** is baked into the federation's consensus
///   configuration. It is fixed for the life of that configuration, is
///   available locally without asking anyone, and is what a
///   [`FederationPreview`](crate::FederationPreview) shows before joining.
/// - **Override metadata** is a JSON document the federation publishes at
///   the URL its configuration names under `meta_override_url`, keyed by
///   federation id. Whoever hosts that URL can change it without a new
///   configuration. fedimint-client fetches it for every client the SDK
///   builds and refreshes it in the background; the SDK reads that cached
///   copy and does not fetch it itself. Only `meta_override_url` is read:
///   the older `meta_external_url` key is not, because fedimint-client does
///   not read it either.
/// - **Consensus metadata** lives in the federation's meta module, is
///   agreed by the guardians at runtime, and is *revisioned*: the
///   guardians can change it, and each change bumps a revision number.
///   Not every federation runs a meta module.
///
/// Most applications want none of those specifically; they want to know
/// "what is this federation's welcome message" and to get the current
/// answer. [`Meta::get`] and [`Meta::all`] provide that as a merged view,
/// with a single precedence order, applied **per key**:
///
/// **consensus metadata, then override metadata, then configuration
/// metadata.**
///
/// A key takes its value from the first source in that order that defines
/// it; keys present in only one source appear unchanged. This is the order
/// fedimint-client itself uses: its legacy meta source lays the override
/// document over the configuration metadata, and its meta-module source
/// prefers the meta module's consensus value over that legacy source. The
/// SDK applies both steps per key rather than per document, so a key the
/// meta module does not define still shows the override or configuration
/// value.
///
/// The configuration and consensus sources stay available separately:
/// [`Meta::config_metadata`] and [`Meta::consensus_metadata`], so an
/// application that needs to know *where* a value came from, or that needs
/// the consensus revision, is not forced to work backwards from the merged
/// result. The override document has no accessor of its own: fedimint-client
/// caches it already laid over the configuration metadata, so which source a
/// value came from is gone by the time the SDK reads it.
///
/// # When the override document contributes
///
/// The override document is a JSON object, and its entries are projected by
/// rules 4 and 5 below, exactly like the consensus document's: one set of
/// rules for both JSON sources. A nested object or array in the override is
/// skipped, and the configuration value for that key stands.
///
/// An override document that fedimint-client has not fetched, because the
/// URL is unreachable, returns something other than a JSON object keyed by
/// federation id, or has no entry for this federation, contributes nothing.
/// The SDK waits only briefly for the override, so it never holds up the
/// merged view: until fedimint-client has fetched and cached the document,
/// it contributes nothing. In particular, **the first reads after joining,
/// or after the app starts with nothing cached, may not include the
/// override.** It is cached and refreshed in the background, so a later read
/// picks it up. Until that first fetch finishes, each `get` or `all` call can
/// wait up to 500 ms for it.
///
/// **Known limitation: after the federation's configuration changes, old
/// configuration values can show for a while.** fedimint-client caches the
/// configuration metadata together with the override document, as one set of
/// entries, and the SDK lays that cache over the current configuration. The
/// cache does not record which entries came from the override, so the SDK
/// cannot drop only the old configuration values. Until fedimint-client
/// fetches the override document again, the old values, and keys the new
/// configuration removed, win over the current configuration. That is
/// briefly after the app starts, or for as long as the override URL stays
/// unreachable. This happens only for federations whose configuration names a
/// `meta_override_url`, and consensus values are not affected.
///
/// # The merged view is a lossy projection, and these are its exact rules
///
/// The meta module stores arbitrary bytes ([`ConsensusMetadata::value`]),
/// in practice a UTF-8 JSON document but with no guarantee of either.
/// Turning those bytes into the flat `BTreeMap<String, String>` that
/// [`Meta::get`] and [`Meta::all`] return is a defined, lossy projection.
/// Every binding must behave identically here, so the rules are written down
/// rather than left to each implementation to settle:
///
/// 1. **Decode as UTF-8.** If the bytes are not valid UTF-8, the consensus
///    document contributes **nothing**: no keys at all, and the merged view
///    is the override and configuration metadata alone.
/// 2. **Parse as JSON.** If the decoded text does not parse as JSON, the
///    consensus document again contributes nothing.
/// 3. **Require a top-level object.** If the document parses to anything
///    other than a JSON object (an array, a bare string, a number, a
///    boolean, `null`), it has no top-level entries to project, so it
///    contributes nothing.
/// 4. **Project each top-level entry by its value's type.** A **string**
///    value contributes its contents, unquoted. A **number**, **boolean**,
///    or **`null`** contributes its JSON text (`42`, `true`, `null`) and
///    stops being distinguishable from a string that happens to read the
///    same. A **nested object or array** cannot be projected to a string and
///    is **skipped**: that key contributes nothing from that document.
/// 5. **Skipped is "not defined", never "defined as empty".** A key skipped
///    by rule 4 is treated exactly as though that document had not defined
///    it: the value from the next source down in the precedence order stands
///    if there is one, and if there is none the key is absent from the
///    merged view entirely. An unprojectable value never surfaces as an
///    empty string and never blanks out a value it would otherwise have
///    overridden.
///
/// Note what rules 1 to 3 mean in practice: a consensus document that is not
/// UTF-8 JSON with an object at its root is *invisible* to the merged view.
/// That is deliberate: a partial or guessed projection would be worse than
/// none, and it is also why the merged view is never evidence that the meta
/// module is empty.
///
/// None of this destroys anything. Everything the projection skips or
/// flattens is still in [`ConsensusMetadata::value`] exactly as consensus
/// stores it, which is what to read for anything that depends on the
/// document's structure, its scalar types, or its precise bytes.
#[derive(Debug, Clone)]
#[cfg_attr(feature = "uniffi", derive(uniffi::Object))]
pub struct Meta {
    inner: Arc<MetaInner>,
}

#[cfg_attr(
    all(feature = "uniffi", not(target_family = "wasm")),
    uniffi::export(async_runtime = "tokio")
)]
#[cfg_attr(all(feature = "uniffi", target_family = "wasm"), uniffi::export)]
impl Meta {
    /// Looks up one key in the merged view.
    ///
    /// Returns the consensus value if the meta module defines this key with
    /// a value the projection can represent, otherwise the override value if
    /// the override document defines it, otherwise the configuration value,
    /// and `None` if no source does. Asynchronous and fallible because
    /// reading consensus metadata may require contacting the federation.
    ///
    /// **`None` is not proof the key is unset.** The projection is governed
    /// by the rules on [`Meta`] and it declines rather than guesses: a
    /// consensus document that is not valid UTF-8, does not parse as JSON, or
    /// is not a JSON object contributes no keys at all, and a key whose value
    /// is a nested object or array is skipped as though consensus had not
    /// defined it (the override or configuration value, if any, then
    /// stands). The override document follows the same rules, and an
    /// override document that has not been fetched contributes nothing. A
    /// caller that needs to distinguish "absent" from "present but not
    /// projectable" must read [`Meta::consensus_metadata`] and interpret
    /// [`ConsensusMetadata::value`] itself.
    ///
    /// # Errors
    ///
    /// [`FederationUnreachable`](crate::ErrorCode::FederationUnreachable),
    /// [`Timeout`](crate::ErrorCode::Timeout), and
    /// [`FederationClosed`](crate::ErrorCode::FederationClosed).
    pub async fn get(&self, key: &str) -> Result<Option<String>> {
        let merged = self.merged_view().await?;
        Ok(merged.get(key).cloned())
    }

    /// The whole merged view.
    ///
    /// Every key from any source, with consensus values winning over override
    /// values and override values winning over configuration values where
    /// more than one defines a key, subject to the same projection rules as
    /// [`Meta::get`]. A key is present here only if the projection could
    /// represent it as a string: an undecodable, unparseable, or non-object
    /// consensus document contributes no keys, and a key whose consensus
    /// value is a nested object or array is skipped in favour of the
    /// override or configuration value, or omitted if there is neither. This
    /// map is therefore a view for rendering, never an inventory of what the
    /// federation's metadata contains; [`Meta::consensus_metadata`] is that.
    ///
    /// Ordered by key: the map is a
    /// [`BTreeMap`](std::collections::BTreeMap) rather than a hash map so
    /// that iteration order is deterministic, which matters both for
    /// rendering a stable list and for tests. Bindings receive it as their
    /// host language's ordinary map or dictionary type.
    ///
    /// # Errors
    ///
    /// The same as [`Meta::get`].
    pub async fn all(&self) -> Result<BTreeMap<String, String>> {
        self.merged_view().await
    }

    /// The raw configuration metadata, exactly as the federation's
    /// configuration declares it.
    ///
    /// Synchronous and infallible: this comes from configuration the SDK
    /// already holds locally, so there is nothing to fetch and nothing to
    /// fail. No override or consensus values are merged in.
    pub fn config_metadata(&self) -> BTreeMap<String, String> {
        self.inner.federation.config_meta()
    }

    /// The raw consensus metadata, or `None` if this federation has no meta
    /// module.
    ///
    /// `None` is an ordinary answer, not a failure: a federation without a
    /// meta module is perfectly well-formed, and this is why [`Meta`]
    /// itself is unconditional while the capability facades are
    /// `Option`-returning: the absence lives here, at the level of the one
    /// thing that can actually be absent.
    ///
    /// The returned value is unprojected and carries its revision, so an
    /// application can parse the document itself and can tell whether it
    /// has changed since it last looked.
    ///
    /// # Errors
    ///
    /// The same as [`Meta::get`].
    pub async fn consensus_metadata(&self) -> Result<Option<ConsensusMetadata>> {
        let client = self.inner.federation.client(false).await?;
        let Ok(module) = client.get_first_module::<fedimint_meta_client::MetaClientModule>() else {
            return Ok(None);
        };

        let result = fedimint_core::runtime::timeout(
            CONSENSUS_FETCH_TIMEOUT,
            module.get_consensus_value(fedimint_meta_common::DEFAULT_META_KEY),
        )
        .await
        .map_err(|_| Error::new(ErrorCode::Timeout, "consensus metadata fetch timed out"))?;

        let maybe_mcv = result.map_err(|err| {
            Error::new(
                ErrorCode::FederationUnreachable,
                format!("failed to fetch consensus metadata: {}", err.fmt_compact()),
            )
        })?;

        Ok(maybe_mcv.map(|mcv| ConsensusMetadata {
            revision: mcv.revision,
            value: mcv.value.as_slice().to_vec(),
        }))
    }
}

impl Meta {
    /// Builds the facade for one federation. Handed out by `Federation::meta`.
    pub(crate) fn new(federation: Arc<crate::federation::FederationInner>) -> Meta {
        Meta {
            inner: Arc::new(MetaInner { federation }),
        }
    }

    /// fedimint-client's cached meta entries: the configuration metadata with the override
    /// document laid over it, or `None` if the configuration names no override URL or the
    /// document is not cached within [`OVERRIDE_CACHE_TIMEOUT`].
    async fn overridden_config(&self) -> Result<Option<JsonObject>> {
        let client = self.inner.federation.client(false).await?;
        let config = client.config().await.global.meta;
        if !config.contains_key(META_OVERRIDE_URL_KEY) {
            return Ok(None);
        }

        // This relies on the client's meta service being fedimint-client's default,
        // `LegacyMetaSource`, whose cache holds configuration metadata with the override document
        // laid over it and nothing else. The SDK never calls `ClientBuilder::with_meta_service`.
        // Installing `MetaModuleMetaSourceWithFallback` there would put consensus values in this
        // cache, projected by its rules rather than the ones on `Meta`.
        // `entries` waits for fedimint-client's first fetch when nothing is cached, and that
        // fetch retries for tens of seconds. The override is best-effort, so give up quickly.
        let entries = fedimint_core::runtime::timeout(
            OVERRIDE_CACHE_TIMEOUT,
            client.meta_service().entries(client.db()),
        )
        .await
        .ok()
        .flatten();

        Ok(entries.map(|entries| entries.into_iter().collect()))
    }

    async fn merged_view(&self) -> Result<BTreeMap<String, String>> {
        let (consensus, overrides) =
            futures::join!(self.consensus_metadata(), self.overridden_config());
        let consensus = consensus?;
        let overrides = overrides?;

        Ok(merge_sources(
            self.inner.federation.config_meta(),
            overrides,
            consensus.as_ref().map(|mcv| mcv.value.as_slice()),
        ))
    }
}

type JsonObject = serde_json::Map<String, serde_json::Value>;

/// The configuration key naming the override document's URL, as fedimint-client's legacy meta
/// source reads it.
const META_OVERRIDE_URL_KEY: &str = "meta_override_url";

/// The merged view: `overrides` laid over `config`, then `consensus` over both, per key, each by
/// the projection rules on [`Meta`].
fn merge_sources(
    config: BTreeMap<String, String>,
    overrides: Option<JsonObject>,
    consensus: Option<&[u8]>,
) -> BTreeMap<String, String> {
    let merged = match overrides {
        Some(overrides) => project_object(&config, overrides),
        None => config,
    };
    match consensus {
        Some(bytes) => apply_consensus_bytes(&merged, bytes),
        None => merged,
    }
}

/// Lays the consensus document over `base`, by rules 1 to 5 on [`Meta`].
fn apply_consensus_bytes(
    base: &BTreeMap<String, String>,
    consensus_bytes: &[u8],
) -> BTreeMap<String, String> {
    let Ok(json_str) = std::str::from_utf8(consensus_bytes) else {
        return base.clone();
    };
    let Ok(serde_json::Value::Object(map)) = serde_json::from_str(json_str) else {
        return base.clone();
    };
    project_object(base, map)
}

/// Lays a JSON object's entries over `base`, by rules 4 and 5 on [`Meta`].
fn project_object(base: &BTreeMap<String, String>, map: JsonObject) -> BTreeMap<String, String> {
    let mut merged = base.clone();
    for (key, value) in map {
        match value {
            serde_json::Value::String(s) => {
                merged.insert(key, s);
            }
            serde_json::Value::Number(n) => {
                merged.insert(key, n.to_string());
            }
            serde_json::Value::Bool(b) => {
                merged.insert(key, b.to_string());
            }
            serde_json::Value::Null => {
                merged.insert(key, "null".to_owned());
            }
            // Object and Array are skipped, not projected to empty.
            serde_json::Value::Object(_) | serde_json::Value::Array(_) => {}
        }
    }
    merged
}

/// A revision of a federation's consensus metadata.
///
/// The guardians can change consensus metadata while the federation runs;
/// each agreed change increments [`ConsensusMetadata::revision`]. Comparing
/// revisions is how an application detects a change without diffing the
/// document.
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "uniffi", derive(uniffi::Record))]
#[non_exhaustive]
pub struct ConsensusMetadata {
    /// The revision number of this metadata. Monotonically increasing;
    /// a larger number is a later version of the same document.
    pub revision: u64,
    /// The metadata document as raw bytes, exactly as consensus stores it.
    ///
    /// Commonly, but not necessarily, UTF-8 JSON. The meta module's value is
    /// an arbitrary byte string with no encoding guarantee, so this field is
    /// `Vec<u8>` rather than `String`: a `String` could not hold what the
    /// guardians actually agreed on, and anything that did not decode would
    /// have to be mangled or dropped to fit. The SDK does not require,
    /// validate, reformat, or re-encode any of it: this is the unprojected
    /// value, byte for byte, for the application to interpret.
    ///
    /// The flat, string-valued projection used by [`Meta::get`] and
    /// [`Meta::all`] is derived from these bytes and is lossy; see the
    /// type-level documentation on [`Meta`] for exactly what it drops. This
    /// field is what remains authoritative when it does.
    pub value: Vec<u8>,
}

/// The federation this facade reads metadata from.
///
/// Unconditional, unlike the three capability facades: every federation has configuration
/// metadata even when it runs no meta module.
#[derive(Debug)]
struct MetaInner {
    federation: Arc<crate::federation::FederationInner>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn apply_consensus_bytes_maps_types_and_prioritizes_consensus() {
        let mut config = BTreeMap::new();
        config.insert("only_config".to_owned(), "c1".to_owned());
        config.insert("overlap".to_owned(), "c2".to_owned());
        config.insert("null_overlap".to_owned(), "c3".to_owned());

        let payload = json!({
            "overlap": "m1",
            "only_consensus": "m2",
            "num": 42,
            "bool": true,
            "null": null,
            "null_overlap": null,
            "obj": {"a": 1},
            "arr": [1, 2]
        })
        .to_string();

        let merged = apply_consensus_bytes(&config, payload.as_bytes());

        assert_eq!(merged.len(), 7);
        assert_eq!(merged.get("only_config"), Some(&"c1".to_owned()));
        assert_eq!(merged.get("overlap"), Some(&"m1".to_owned())); // consensus wins
        assert_eq!(merged.get("only_consensus"), Some(&"m2".to_owned()));
        assert_eq!(merged.get("num"), Some(&"42".to_owned()));
        assert_eq!(merged.get("bool"), Some(&"true".to_owned()));
        assert_eq!(merged.get("null"), Some(&"null".to_owned()));
        assert_eq!(merged.get("null_overlap"), Some(&"null".to_owned()));
        assert!(!merged.contains_key("obj"));
        assert!(!merged.contains_key("arr"));
    }

    #[test]
    fn apply_consensus_bytes_handles_invalid_utf8_by_returning_config() {
        let mut config = BTreeMap::new();
        config.insert("c1".to_owned(), "v1".to_owned());

        let invalid_utf8 = vec![0xff, 0xff, 0xff];
        let merged = apply_consensus_bytes(&config, &invalid_utf8);
        assert_eq!(merged, config);
    }

    #[test]
    fn apply_consensus_bytes_handles_non_json_by_returning_config() {
        let mut config = BTreeMap::new();
        config.insert("c1".to_owned(), "v1".to_owned());

        let invalid_json = b"not valid json";
        let merged = apply_consensus_bytes(&config, invalid_json);
        assert_eq!(merged, config);
    }

    #[test]
    fn apply_consensus_bytes_handles_non_object_json_by_returning_config() {
        let mut config = BTreeMap::new();
        config.insert("c1".to_owned(), "v1".to_owned());

        for payload in [
            b"[]".as_slice(),
            b"\"string\"".as_slice(),
            b"123".as_slice(),
            b"true".as_slice(),
            b"null".as_slice(),
        ] {
            let merged = apply_consensus_bytes(&config, payload);
            assert_eq!(merged, config);
        }
    }

    #[test]
    fn apply_consensus_bytes_preserves_config_when_key_skipped() {
        let mut config = BTreeMap::new();
        config.insert("server".to_owned(), "https://example.com".to_owned());

        // Nested object violates Rule 4 and should be skipped under Rule 5.
        let payload = br#"{"server": {"host": "example.com"}}"#;

        let merged = apply_consensus_bytes(&config, payload);

        assert_eq!(
            merged.get("server"),
            Some(&"https://example.com".to_owned())
        );
    }

    fn map(entries: &[(&str, &str)]) -> BTreeMap<String, String> {
        entries
            .iter()
            .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
            .collect()
    }

    fn object(value: serde_json::Value) -> JsonObject {
        let serde_json::Value::Object(map) = value else {
            panic!("not a JSON object: {value}");
        };
        map
    }

    #[test]
    fn merge_sources_prefers_consensus_then_override_then_config() {
        let config = map(&[
            ("only_config", "c"),
            ("config_and_override", "c"),
            ("config_and_consensus", "c"),
            ("all_three", "c"),
        ]);
        let overrides = object(json!({
            "only_override": "o",
            "config_and_override": "o",
            "override_and_consensus": "o",
            "all_three": "o",
        }));
        let consensus = json!({
            "only_consensus": "m",
            "config_and_consensus": "m",
            "override_and_consensus": "m",
            "all_three": "m",
        })
        .to_string();

        let merged = merge_sources(config, Some(overrides), Some(consensus.as_bytes()));

        assert_eq!(
            merged,
            map(&[
                ("only_config", "c"),
                ("only_override", "o"),
                ("only_consensus", "m"),
                ("config_and_override", "o"),
                ("config_and_consensus", "m"),
                ("override_and_consensus", "m"),
                ("all_three", "m"),
            ])
        );
    }

    #[test]
    fn merge_sources_without_override_or_consensus_is_config() {
        let config = map(&[("name", "c")]);
        assert_eq!(merge_sources(config.clone(), None, None), config);
    }

    #[test]
    fn merge_sources_skipped_consensus_key_falls_back_to_override() {
        let config = map(&[("welcome", "c")]);
        let overrides = object(json!({"welcome": "o"}));
        let consensus = br#"{"welcome": {"text": "m"}}"#;

        let merged = merge_sources(config, Some(overrides), Some(consensus.as_slice()));

        assert_eq!(merged.get("welcome"), Some(&"o".to_owned()));
    }

    #[test]
    fn merge_sources_unreadable_consensus_leaves_override_over_config() {
        let config = map(&[("welcome", "c")]);
        let overrides = object(json!({"welcome": "o"}));

        let merged = merge_sources(config, Some(overrides), Some(b"not json".as_slice()));

        assert_eq!(merged, map(&[("welcome", "o")]));
    }

    #[test]
    fn merge_sources_projects_the_cached_override_over_config() {
        // fedimint-client caches the configuration with the override document laid over it:
        // configuration entries as strings, override entries replacing them with any JSON value.
        let config = map(&[("same", "v"), ("changed", "c"), ("nested", "c")]);
        let cached = object(json!({
            "same": "v",
            "changed": "o",
            "nested": {"a": [1, 2]},
            "added": 42,
            "flag": true,
            "none": null,
        }));

        let merged = merge_sources(config, Some(cached), None);

        assert_eq!(
            merged,
            map(&[
                ("same", "v"),
                ("changed", "o"),
                // Skipped under rule 4, so configuration stands under rule 5.
                ("nested", "c"),
                ("added", "42"),
                ("flag", "true"),
                ("none", "null"),
            ])
        );
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn public_api_get_and_all_return_federation_closed_error() {
        use crate::FederationStatus;
        use crate::db::{FederationRecord, StoredCapabilities, StoredNetwork, StoredStatus};
        use crate::federation::FederationInner;
        use fedimint_core::PeerId;
        use fedimint_core::config::FederationId;
        use fedimint_core::util::SafeUrl;
        use std::sync::{Arc, Weak};

        let id = FederationId::dummy();
        let capabilities = StoredCapabilities {
            ecash: true,
            lightning: true,
            onchain: true,
        };
        let record = FederationRecord {
            invite: fedimint_core::invite_code::InviteCode::new(
                SafeUrl::parse("wss://guardian.example:5000").expect("a valid url"),
                PeerId::from(0),
                id,
                None,
            ),
            network: StoredNetwork::Regtest,
            status: StoredStatus::Closed,
            capabilities,
            generation: Some(1),
            name: Some("Test Federation".to_owned()),
        };

        let root = crate::db::in_memory_root();
        let mut initial_config_meta = BTreeMap::new();
        initial_config_meta.insert("name".to_owned(), "Config Name".to_owned());
        let federation_inner = Arc::new(FederationInner::new(
            id,
            Weak::new(),
            root.with_prefix(crate::db::federation_prefix(&id).to_vec()),
            record,
            initial_config_meta.clone(),
            FederationStatus::Closed,
            None,
        ));

        let meta = Meta::new(federation_inner);

        // config_metadata remains synchronous and infallible even if the federation is closed
        assert_eq!(meta.config_metadata(), initial_config_meta);

        // consensus_metadata, get, and all return FederationClosed error
        let consensus_err = meta.consensus_metadata().await.expect_err("should fail");
        assert_eq!(consensus_err.code, ErrorCode::FederationClosed);

        let get_err = meta.get("any_key").await.expect_err("should fail");
        assert_eq!(get_err.code, ErrorCode::FederationClosed);

        let all_err = meta.all().await.expect_err("should fail");
        assert_eq!(all_err.code, ErrorCode::FederationClosed);
    }

    #[test]
    fn test_numeric_projection_preserves_large_integers() {
        let config = BTreeMap::new();
        // 18446744073709551617 is u64::MAX + 2, triggering f64 parsing without arbitrary_precision
        let json = r#"{"n":18446744073709551617}"#;
        let projected = apply_consensus_bytes(&config, json.as_bytes());
        assert_eq!(projected.get("n").unwrap(), "18446744073709551617");
    }
}
