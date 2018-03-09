declare module 'vinyl-fs-fake' {
  import * as vinyl from 'vinyl-fs';
  export interface File {
    path: string;
    contents: string;
  }
  export interface Options { cwdbase: boolean; }
  export function src(files: File[], options?: Options);
}
