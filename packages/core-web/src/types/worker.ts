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
] as const

export type WorkerMessageType = (typeof WorkerMessageTypes)[number]
