import path from 'path';
import fs from 'fs-extra';
import ejs from 'ejs';
import { EOL } from 'os';

const templateDir = 'templates';
const templateExtension = '.ejs';
/**
 * @param {string | number | import("url").URL | Buffer} destinationFile
 * @param {string} templatePath
 * @param {any} options
 */
export async function useTemplate(destinationFile, templatePath, options) {
  const templateFile = path.join(__dirname, '..', templateDir, templatePath + templateExtension);
  const fileContent = await ejs.renderFile(templateFile, { ...options, EOL });
  await fs.writeFile(destinationFile, fileContent);
}