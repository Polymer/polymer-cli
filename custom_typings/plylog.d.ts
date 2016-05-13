declare module 'plylog' {

  class PolymerLogger {
    constructor(options: any)
    setLevel(newLevel: string)
    error(message: string, metadata?: any)
    warn(message: string, metadata?: any)
    info(message: string, metadata?: any)
    debug(message: string, metadata?: any)
  }

  export function setVerbose();
  export function setQuiet();
  export function getLogger(name: string): PolymerLogger;
}
