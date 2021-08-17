#!/usr/bin/env node

const process = require('process');
const fs      = require('fs');

const program = require('commander');
const shell   = require('shelljs');

const logger     = require('./logger.js');
const xlfHandler = require('./xlf-handler');

function parseFileContent (fileName, allItems, duplicateItems) {
    const fileContent = fs.readFileSync(fileName).toString();
    const parser      = xlfHandler.createParser(fileContent);

    const parsedFileContent = parser.parse(fileContent);

    console.log(allItems , duplicateItems)

    if (!allItems.length) {
        allItems.push(...parsedFileContent);

        return;
    }

    for (const parsedItem of parsedFileContent) {
        const duplicateItem = allItems.find(({ id, text }) => id === parsedItem.id && text === parsedItem.text);

        if (duplicateItem) {
            duplicateItems.push({ ...duplicateItem, fileName })
        } else {
            allItems.push(parsedItem)
        }
    }

    logger.info(`Parsed translations in file ${fileName}`);
}

function readInputs (inputPaths, operation) {
    for (const fileName of shell.ls(inputPaths)) {
        try {
            operation(fileName);
        } catch (err) {
            logger.error('Couldn\'t parse file ' + fileName);
            throw err;
        }
    }
}

function extractDuplicateUnits (inputPaths, outputPath) {
    const allItems       = [];
    const duplicateItems = [];
    const filePaths = [];

    let locale = null;

    readInputs(inputPaths, fileName => {
        let fileLocale = parseFileContent(fileName, allItems, duplicateItems);
        if (locale && fileLocale && locale !== fileLocale) {
            throw new Error(`Locales among input file don't match. File ${fileName} has locale ${fileLocale}, expected ${locale}.`);
        }

        locale = fileLocale;

        filePaths.push(fileName)
    });

    logger.info(`All input files parsed. Found ${duplicateItems.length} translated texts.`);

    if (duplicateItems.length) {
        const output  = xlfHandler.save(duplicateItems, locale);

        fs.writeFileSync(outputPath, output);
        logger.success('xlf-merge generated output file ' + outputPath);

        filePaths.forEach((filePath) => {
            removeDuplicateUnits(filePath, duplicateItems);
        })
    }
}

function removeDuplicateUnits(fileName, duplicateItems) {
    const fileContent = fs.readFileSync(fileName).toString();
    const parser      = xlfHandler.createParser(fileContent);

    const parsedFileContent = parser.parse(fileContent);

    const newFileContent = [];

    for (const parsedItem of parsedFileContent) {
        if (!duplicateItems.some(({ id }) => id === parsedItem.id)) {
            newFileContent.push(parsedItem);
        }
    }
    const output  = xlfHandler.save(newFileContent);

    fs.writeFileSync(fileName, output);
}

program
  .name('xlf-common')
  .version('1.0.0')
  .usage('[options] <input files or pattern such as *.xlf, *.json ...>')
  .option('-o --output <output>', 'Output file name')
      .addOption(new program.Option('-c --convert <format>', 'Converts all input files in place').choices([
          'xlf',
          'json',
          'arb',
      ]))
  .option('-q --quiet', 'Quiet mode. Doesn\'t show warnings and info messages.')
  .addHelpText('after', '\nEither --output or --convert option is required')
  .parse(process.argv);

const options = program.opts();

if (program.args === 0 || (!options.output && !options.convert)) {
    program.help();
}

if (options.quiet) {
    logger.quietMode = true;
}

try {
    if (options.convert) {
        convertTranslationFiles(program.args, options.convert, options.allowConflicts);
    }

    if (options.output) {
        extractDuplicateUnits(program.args, options.output, options.allowConflicts);
    }
} catch (err) {
    logger.error('xlf-merge failed\n' + err.toString());
    process.exitCode = 1;
}
