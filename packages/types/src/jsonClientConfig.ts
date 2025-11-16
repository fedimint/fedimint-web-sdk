import { JSONValue } from './utils'

// TODO: add types for the various module configs
export interface JsonClientConfig extends Record<string, JSONValue> {
  global: GlobalClientConfig
  modules: Record<string, ModuleConfig> // ModuleInstanceId (u16) as string key
}

export interface GlobalClientConfig extends Record<string, JSONValue> {
  api_endpoints: Record<string, PeerUrl> // PeerId (u16) as string key
  broadcast_public_keys: Record<string, string> | null
  consensus_version: CoreConsensusVersion
  meta: Record<string, string> // Additional config, includes "federation_name" if set
}

export interface PeerUrl extends Record<string, JSONValue> {
  url: string // SafeUrl, e.g. "wss://..."
  name: string // The peer's name
}

export interface CoreConsensusVersion extends Record<string, JSONValue> {
  major: number // u32
  minor: number // u32
}

export interface ModuleConfig {
  kind: string // ModuleKind, e.g. "ln", "mint", "wallet"
  [key: string]: JSONValue // Module-specific configuration fields
}
