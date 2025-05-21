const WorkerMessageTypes = [
  'init',
  'initialized',
  'rpc',
  'log',
  'open',
  'join',
  'error',
  'unsubscribe',
  'cleanup',
  'parseInviteCode',
  'parseBolt11Invoice',
  'previewFederation',
] as const

export type WorkerMessageType = (typeof WorkerMessageTypes)[number]
