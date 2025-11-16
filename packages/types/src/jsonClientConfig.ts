import { JSONValue } from './utils'

// TODO: add types for the various module configs
export interface JsonClientConfig {
  global: GlobalClientConfig
  modules: Record<string, ModuleConfig> // ModuleInstanceId (u16) as string key
}

export interface GlobalClientConfig {
  api_endpoints: Record<string, PeerUrl> // PeerId (u16) as string key
  broadcast_public_keys?: Record<string, string> | null // PeerId -> PublicKey (hex string), optional for 0.3.x backwards compatibility
  consensus_version: CoreConsensusVersion
  meta: Record<string, string> // Additional config, includes "federation_name" if set
}

export interface PeerUrl {
  url: string // SafeUrl, e.g. "wss://fedimint-server-1:5000"
  name: string // The peer's name
}

export interface CoreConsensusVersion {
  major: number // u32
  minor: number // u32
}

export interface ModuleConfig {
  kind: string // ModuleKind, e.g. "ln", "mint", "wallet"
  [key: string]: JSONValue // Module-specific configuration fields
}
