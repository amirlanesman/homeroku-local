import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs-extra';
import path from 'path';
import { config } from './config';
import { spawn } from './lib/spawn';
import { createUser } from './lib/mongo';
import { generateRandomString, getRandomInt } from './lib/util';
import { useTemplate } from './lib/templates';

// const args = require('minimist')(process.argv.slice(2));
const gitExtension = '.git';
const gitHooksDir = 'hooks';
const gitPostReceiveHook = 'post-receive';
const dotenvFilename = '.env';
const portEnvVar = 'PORT';
const mongoUrlEnvVar = 'MONGO_URL';


/**
 * @param {string} appName
 */
function getDirs(appName) {
  return {
    appDir: path.join(config.dirs.appsHome, appName),
    gitDir: path.join(config.dirs.gitHome, appName + gitExtension),
    userDir: path.join(config.dirs.userDir, appName),
  };
}

/**
 * @param {string} appName
 */
export async function createApp(appName) {
  console.log('Creating new homeroku app: ' + appName);
  if (typeof appName !== 'string' || appName.length <= 1) {
    throw new Error(`Cannot create app '${appName}' because name to short`);
  }
  const dirs = getDirs(appName);
  const { appDir, gitDir, userDir } = dirs;
  if ((await Promise.all(Object.values(dirs).map(d => fs.pathExists(d)))).every(e => !!e)) {
    throw new Error(`Cannot create app '${appName}' because already exists`);
  }
  try {
    console.log('creating git dir: ', gitDir);
    await fs.mkdir(gitDir);
    console.log('creating app dir: ', appDir);
    await fs.mkdir(appDir);
    console.log('creating user dir: ', userDir);
    await fs.ensureDir(userDir);
    console.log('Configuring git.');
    await configGit(appName);
    console.log('Configuring app.');
    await configApp(appName);
    console.log();
    console.log('App created successfully!!');
    console.log();
    const gitRemote = toAppGitRemote(appName);
    console.log('add git remote at: ' + gitRemote);
    console.log();
    console.log(`You could execute:\ngit remote add home ${gitRemote}`);
  } catch (err) {
    console.log('Error occured while creating app.')
    console.log('clearing app because unsuccessful.');
    await fs.remove(gitDir);
    await fs.remove(appDir);
    throw err;
  }
}

/**
 * @param {string} appName
 */
export function toAppGitRemote(appName) {
  return config.git.remotePrefix + appName;
}

async function configGit(appName) {
  const { appDir, gitDir, userDir } = getDirs(appName);
  await spawn('git init --bare', { cwd: gitDir });
  const gitHooks = path.join(gitDir, gitHooksDir)
  console.log('ensuring git hooks dir: ', gitHooks);
  await fs.ensureDir(gitHooks);
  const gitPostReceiveHookFile = path.join(gitHooks, gitPostReceiveHook);
  console.log('creating post receive git hook: ', gitPostReceiveHookFile);
  await useTemplate(gitPostReceiveHookFile, path.join('git', gitPostReceiveHook), { appDir, appName, userDir });
  await fs.chmod(gitPostReceiveHookFile, '755');
}

/**
 * @param {string} appName
 */
async function configApp(appName) {
  const {appDir, userDir} = getDirs(appName);
  const mongoUsername = appName + generateRandomString(5);
  console.log('configuring MongoDB.');
  const appMongoUrl = await createUser(config.mongo.mongoUrl, mongoUsername, generateRandomString(config.mongo.passwordLength), appName)
  console.log('configuring app web port.');
  const occupiedPorts = await getAllAppPorts();
  let port = getRandomInt(config.system.ports.min, config.system.ports.max);
  while (occupiedPorts.includes('' + port)) {
    port = getRandomInt(config.system.ports.min, config.system.ports.max);
  }
  console.log('configuring app dotenv.');
  const env = toEnv({port: port, mongoUrl: appMongoUrl, userDir});
  await useTemplate(path.join(appDir, dotenvFilename), path.join('app', dotenvFilename), { env });
  console.log('Successfully configured app.');
}

/**
 * @param {string} appName
 * @param {any} env
 */
async function writeDotEnv(appName, env) {
  const {appDir} = getDirs(appName);
  await useTemplate(path.join(appDir, dotenvFilename), path.join('app', dotenvFilename), { env });
}

/**
 * @param {{ port: number; mongoUrl: string; userDir: string }} [options]
 */
function toEnv(options) {
  const {port, mongoUrl, userDir} = options;
  return [
    [portEnvVar, port],
    [mongoUrlEnvVar, mongoUrl],
    ['USER_DIR', userDir],
  ]
}

/**
 * @param {string} appName
 */
export async function deleteApp(appName) {
  console.log('Deleting homeroku app: ' + appName);
  const { appDir, gitDir } = getDirs(appName);
  console.log('deleting dirs: ' + gitDir);
  await fs.remove(gitDir);
  console.log('deleting dirs: ' + appDir);
  await fs.remove(appDir);
  console.log();
  console.log('Homeroku app ' + appName + ' deleted');
}

export async function listApps() {
  const appsList = await fs.readdir(config.dirs.appsHome);
  const gitList = (await fs.readdir(config.dirs.gitHome)).filter(p => p.endsWith(gitExtension)).map(p => p.slice(0, p.length - gitExtension.length));
  return appsList.filter(x => gitList.includes(x));
}


/**
 * @param {string} appName
 */
export async function getAppEnv(appName) {
  const { appDir } = getDirs(appName);
  const dotenvFile = path.join(appDir, dotenvFilename);
  if (!await fs.pathExists(dotenvFile)) {
    return {};
  }
  const env = dotenv.parse(await fs.readFile(dotenvFile));
  return env
}

/**
 * @param {string} appName
 * @param {string} key
 */
export async function getAppEnvVar(appName, key) {
  return (await getAppEnv(appName))[key];
}

export async function getAllAppPorts() {
  const apps = await listApps();
  const ports = await Promise.all(apps.map(async app => await getAppEnvVar(app,portEnvVar)));
  return ports;
}

/**
 * @param {string} appName
 * @param {string | number} key
 * @param {string} value
 */
export async function setAppEnvVar(appName, key, value) {
  const env = await getAppEnv(appName);
  env[key] = value;
  await writeDotEnv(appName, env);
  return `${key}=${env[key]}`;
}


// main().then(() => console.log('Done!'), error => console.log('Error occured:', error))