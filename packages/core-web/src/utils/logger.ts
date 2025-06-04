const logLevels = ['debug', 'info', 'warn', 'error', 'none'] as const
export type LogLevel = (typeof logLevels)[number]

export class Logger {
  private level: LogLevel

  constructor(level: LogLevel = 'none') {
    this.level = level
  }

  setLevel(level: LogLevel) {
    this.level = level
  }

  coerceLevel(level: LogLevel) {
    if (logLevels.includes(level)) return level
    return 'info'
  }

  log(level: LogLevel, message: string, ...args: any[]) {
    const logLevel = this.coerceLevel(level)
    if (!this.shouldLog(logLevel)) {
      return
    }
    const consoleFn = console[logLevel]
    consoleFn(`[${logLevel.toUpperCase()}] ${message}`, ...args)
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args)
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args)
  }

  private shouldLog(
    messageLevel: LogLevel,
  ): messageLevel is Exclude<LogLevel, 'none'> {
    const messageLevelIndex = logLevels.indexOf(messageLevel)
    const currentLevelIndex = logLevels.indexOf(this.level)
    return (
      currentLevelIndex <= messageLevelIndex &&
      this.level !== 'none' &&
      messageLevel !== 'none'
    )
  }
}

export const logger = new Logger()
