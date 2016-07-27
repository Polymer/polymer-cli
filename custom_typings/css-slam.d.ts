declare module 'css-slam' {

  import {Transform} from 'stream';

  export function css(text: string): string;
  export function html(text: string): string;
  export function gulp(): Transform;
}