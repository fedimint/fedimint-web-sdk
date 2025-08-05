export const WorkerMessageTypes = [
  'init',
  'client_rpc',
  'open_client',
  'close_client',
  'join_federation',
  'cancel_rpc',
  'parse_invite_code',
  'preview_federation',
  'parse_bolt11_invoice',
  'set_mnemonic',
  'generate_mnemonic',
  'get_mnemonic',
] as const

export type WorkerMessageType = (typeof WorkerMessageTypes)[number]
