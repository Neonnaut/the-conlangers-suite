#!/usr/bin/env node
/// <reference types="node" />
import fs from 'fs';
import yargs from 'yargs/yargs';

import { hideBin } from 'yargs/helpers';

// Type-only import (safe in CommonJS with TypeScript)
import type { Arguments } from 'yargs';

import { vocabug } from '../../src/main';
import { VERSION } from '../../src/utils/version';


type CLI_Args = Arguments<{
   num_of_words: number;
   output_mode: string;
   remove_duplicates: boolean;
   force_word_limit: boolean;
   sort_words: boolean;
   output_divider: string;
   wordclass_choices: string;
   encoding: BufferEncoding;
}> & {
   _: string[]; // positional args
};

type Output_Modes = 'word-list' | 'debug' | 'paragraph';


const encodings: readonly BufferEncoding[] = [
   'ascii',
   'binary',
   'latin1',
   'ucs-2',
   'ucs2',
   'utf-8',
   'utf16le',
   'utf8'
];

const argv = yargs(hideBin(process.argv))
   .usage('Usage: $0 <path> [options]')

   // aliases for default flags
     .help("help")
     .wrap(null) // prevents line wrapping
     .epilog("For full documentation, visit: https://neonnaut.neocities.org/vocabug_docs")
   .alias({ help: '?', version: 'v' })
   // custom options

   .option('num_of_words', {
      alias: 'n',
      describe: 'Number of words to generate',
      type: 'number',
      default: 100,
   })
   .option('output_mode', {
      alias: 'm',
      describe: 'Output mode',
      choices: ['word-list', 'debug', 'paragraph'] as const,
      default: 'word-list'
   })
   .option('remove_duplicates', {
      alias: 'r',
      describe: 'Remove duplicate words',
      type: 'boolean',
      default: true
   })
   .option('force_word_limit', {
      alias: 'l',
      describe: 'Force word limit',
      type: 'boolean',
      default: false
   })
   .option('sort_words', {
      alias: 's',
      describe: 'Sort generated words',
      type: 'boolean',
      default: true
   })
   .option('output_divider', {
      alias: 'od',
      describe: 'Divider between words',
      type: 'string',
      default: ' '
   })
   .option('wordclass_choices', {
      alias: 'wc',
      describe: 'Comma-separated list of word classes to generate (e.g., "noun,verb")',
      type: 'string',
      default: ''
   })
   .option('encoding', {
      alias:       'e',
      choices:     encodings,
      describe:    'What file encoding to use',
      default:     'utf8',
      requiresArg: true,
      coerce:      (enc: string) => {
         // ignore case, and allow 'utf-16le' as a synonym for 'utf16le'
         const littleEnc = enc.toLowerCase();
         if (littleEnc === 'utf-16le') {
            return 'utf16le';
         } else if (!(<string[]>encodings).includes(littleEnc)) {
            // throw an error indicating an invalid encoding
            let errorString = 'Invalid values:\n  Argument: encoding, '
               + `Given: "${enc}", Choices: `;

            for (let i = 0; i < encodings.length; ++i) {
               if (i !== 0) {
                  errorString += ', ';
               }
               errorString += `"${encodings[i]}"`;
            }
            throw new Error(errorString);
         }
         return littleEnc;
      }
   })

   .check(argv => {
      return true;
   })
   .parseSync() as CLI_Args;

const filePath = argv._[0]; // first positional arg

try {
   const file_text = fs.readFileSync(filePath, argv.encoding);
   normal_text(`Generating words with Vocabug version ${VERSION}. This may take up to 30 seconds...`);

   const parsed_choices: string[] = argv.wordclass_choices
      .split(",")
      .map((choice) => choice.trim())
      .filter((choice) => choice.length > 0);

   const run = vocabug({
      file: file_text,
      num_of_words: argv.num_of_words,
      output_mode: argv.output_mode as Output_Modes,
      remove_duplicates: argv.remove_duplicates,
      force_word_limit: argv.force_word_limit,
      sort_words: argv.sort_words,
      output_divider: argv.output_divider,
      wordclass_choices: parsed_choices
   });

   for (const warning of run.warnings) {
      yellow_text(warning);
   }
   for (const error of run.errors) {
      red_text(error);
   }
   for (const info of run.infos) {
      green_text(info);
   }
   if (run.payload) {
      payload_text(run.payload);
   }
} catch (err: any) {
   if (err.code === "ENOENT") {
      red_text(`Error: File not found with path "` + err.path +`"`);
   } else if (err.code === "EISDIR") {
      red_text(`Error: You passed a directory where a file was required with path "` + err.path +`"`);
   } else if (err.code === "EACCES" || err.code === "EPERM") {
      red_text(`Error: You do not have permission to read or write this file, with path "` + err.path +`"`);
   } else {
      red_text("Error: " + err.message);
   }
}

function green_text(s: string) {
   process.stderr.write(`\x1b[32m${s}\x1b[0m\n`);
}
function yellow_text(s: string) {
   process.stderr.write(`\x1b[33m${s}\x1b[0m\n`);
}
function red_text(s: string) {
   process.stderr.write(`\x1b[31m${s}\x1b[0m\n`);
}
function normal_text(s: string) {
   process.stderr.write(`${s}\n`);
}
function payload_text(s: string) {
   process.stdout.write(s);
}