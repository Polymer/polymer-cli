declare module 'bower-json' {
  export function read(path: string, options: any, callback: (err: any, json: any) => void): void;
}
