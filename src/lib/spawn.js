const { spawn: spawnFunction } = require("child_process");


export function spawn(args, options) {
  return new Promise((resolve, reject) => {
    if (typeof args === 'string') {
      args = args.split(' ');
    }
    console.log('spawning: ' + args.join (' '));
    const s = spawnFunction(args[0], args.slice(1), options);
    s.stdout.on("data", data => {
        console.log(`${data}`);
    });
    
    s.stderr.on("data", data => {
        console.error(`${data}`);
    });
    
    s.on('error', (error) => {
        console.error(`error: ${error.message}`);
    });
    
    s.on("close", code => {
      if (code === 0) {
        resolve();
      } else {
        reject('Process exited with code ' + code);
      }
    });
  })
}


