const WorkerMessageTypes = ['init', 'initialized', 'client_rpc'] as const

export type WorkerMessageType = (typeof WorkerMessageTypes)[number]
