const WorkerMessageTypes = [
  'init',
  'initialized',
  'client_rpc',
  'log',
  'open',
  'join',
  'error',
  'unsubscribe',
  'cleanup',
] as const

export type WorkerMessageType = (typeof WorkerMessageTypes)[number]
