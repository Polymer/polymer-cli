declare module 'fs-extra' {
  export function copySync(source: string, dest: string);
  export function readdirSync(path: string): string;
}
