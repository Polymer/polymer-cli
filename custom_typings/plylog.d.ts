declare module 'plylog' {

  class PolymerLogger {
    constructor(options: any)
    setLevel(newLevel: string)
    error(...data: any[])
    warn(...data: any[])
    info(...data: any[])
    debug(...data: any[])
  }

  export function setVerbose();
  export function setQuiet();
  export function getLogger(name: string): PolymerLogger;
}
