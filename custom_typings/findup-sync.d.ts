declare module 'findup-sync' {

  module findup {
	interface FindupOptions {
		cwd?: string;
	}
  }

function findup(pattern: string[] | string, opts?: findup.FindupOptions): string;

  export = findup;
}