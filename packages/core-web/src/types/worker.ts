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
] as const

export type WorkerMessageType = (typeof WorkerMessageTypes)[number]
