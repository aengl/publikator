const path = require('path');
const debugModule = require('debug');
const fs = require('fs-extra');
const program = require('caporal');
const packageJson = require('../package.json');
const scan = require('./scan');
const organise = require('./organise');
const generate = require('./generate');

const debug = debugModule('publikator:cli');

process.on('unhandledRejection', error => {
  throw error;
});

program.version(packageJson.version);

/* ~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^
 * Command: organise
 * ~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^ */

program
  .command(
    'organise',
    'Recursively finds all tracks in a folder, reads their tags and re-organises them'
  )
  .argument('<source>', 'Root folder for the recursive search')
  .argument('<target>', 'Target folder for the restructured output')
  .option('-d, --delete', 'Completely delete the target folder first')
  .action(async (args, options) => {
    if (!process.env.DEBUG) {
      debugModule.enable('publikator:*');
    }
    const source = path.resolve(args.source);
    const target = path.resolve(args.target);
    if (options.delete) {
      debug(`deleting folder '${target}'`);
      fs.removeSync(target);
    }
    fs.ensureDirSync(args.target);
    const files = scan.findFilesSync(source);
    const taggedFiles = await scan.readTags(files);
    const organisedFiles = await organise.byAlbum(target, taggedFiles);
    await generate.generateReleaseInfo(target, organisedFiles);
  });

debug(process.argv);
program.parse(process.argv);
