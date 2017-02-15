declare module 'bower-logger' {
  interface BowerLogger extends NodeJS.EventEmitter {}
  class BowerLogger {}

  export = BowerLogger;
}
