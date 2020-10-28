const args = require('minimist')(process.argv.slice(2));
import { createApp, deleteApp, listApps } from './create-app';
import { EOL } from 'os';
import fs from 'fs-extra';
import { config } from './config';

async function init() {
  for (const d of Object.values(config.dirs)) {
    if (!await fs.pathExists(d)) {
      console.log('Creating directory: ' + d);
      // @ts-ignore
      await fs.mkdir(d, { recursive: true });
    }
  }
}

async function main() {
  await init();
  const command = args._[0];
  const commandArgs = args._.slice(1);
  switch (command) {
    case 'create-app':
      await createApp(commandArgs[0]);
      return;
    case 'delete-app':
      await deleteApp(commandArgs[0]);
      return;
    case 'ls':
      console.log((await listApps()).join(EOL));
      return;
    default:
      console.log('Unknown command:', command);
  }
}

main().then(() => { }, error => console.log('Error occured:', error))