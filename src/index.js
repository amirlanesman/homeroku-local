const args = require('minimist')(process.argv.slice(2));
import { createApp, deleteApp, listApps } from './create-app';
import {EOL} from 'os';

async function main() {
  const command = args._[0];
  const commandArgs = args._.slice(1);
  switch(command) {
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
      console.log ('Unknown command:', command);
  }
}

main().then(() => {}, error => console.log('Error occured:', error))