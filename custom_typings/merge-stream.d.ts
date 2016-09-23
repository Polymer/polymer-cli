declare module "merge-stream" {

  module mergeStream {
    interface MergedStream extends NodeJS.ReadWriteStream {
      add: (source: NodeJS.ReadableStream) => MergedStream;
    }
	}

  function mergeStream<T extends NodeJS.ReadableStream>(...streams: T[]): mergeStream.MergedStream;
  export = mergeStream;

}