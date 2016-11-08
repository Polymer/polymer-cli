declare module 'plylog' {

  class PolymerLogger {
    constructor(options: any);
    setLevel(newLevel: string): void;
    error(message: string, metadata?: any): void;
    warn(message: string, metadata?: any): void;
    info(message: string, metadata?: any): void;
    debug(message: string, metadata?: any): void;
  }

  export function setVerbose(): void;
  export function setQuiet(): void;
  export function getLogger(name: string): PolymerLogger;
}
