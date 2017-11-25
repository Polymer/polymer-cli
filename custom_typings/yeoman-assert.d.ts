declare module 'yeoman-assert' {
  export function file(filenames: string[]);
  export function fileContent(path: string, content: string);
  export function noFile(filenames: string[]);
}
