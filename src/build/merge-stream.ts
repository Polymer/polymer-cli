import {PassThrough, Stream} from 'stream';

export function mergeStreams(/* ...inputs: Stream[] */) {
  let inputs = Array.from(arguments);
  let openCount = inputs.length;
  let output = new PassThrough({objectMode: true});

  inputs.forEach((stream) => {
    stream.on('finish', (stream) => {
      console.log('finish in mergeStreams', openCount);
    });
    stream.on('end', (stream) => {
      console.log('end in mergeStreams', openCount);
      openCount--;
      if (openCount === 0) {
        console.log('ending the output');
        output.end();
      }
    });
    stream.on('close', (e) => {
      console.log('close in mergeStreams', openCount);
    });
    stream.on('error', (e) => {
      console.error('input error', e);
      console.error(e.stace);
    })
    // stream.pipe(output, {end: false});
    stream.on('data', (data) => {
      output.write(data);
    });
  });

  output.on('unpipe', (source) => {
    console.log('output unpipe!!!');
  });

  output.on('close', (source) => {
    console.log('output close!!!');
  });


  output.on('error', (e) => {
    console.error('output error', e);
    console.error(e.stace);
  });

  return output;
}
