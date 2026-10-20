import fs from 'fs';

export type Output_Modes = 'word-list' | 'debug' | 'old-to-new' | 'paragraph';
export const output_modes:string[] = ['word-list', 'debug', 'old-to-new' , 'paragraph'];

import { InvalidArgumentError } from "commander";

export const encodings: readonly BufferEncoding[] = [
   'ascii',
   'binary',
   'latin1',
   'ucs-2',
   'ucs2',
   'utf-8',
   'utf16le',
   'utf8'
];

export function parse_encoding(enc: string): BufferEncoding {
  const littleEnc = enc.toLowerCase();
  if (littleEnc === "utf-16le") {return "utf16le";}
  if (!(encodings as string[]).includes(littleEnc)) {
    let errorString =
      'Invalid values for encoding, ' +
      `Given: "${enc}", Choices: ` +
      encodings.map((e) => `"${e}"`).join(", ");
    throw new InvalidArgumentError(errorString);
  }
  return littleEnc as BufferEncoding;
}

export function parse_mode(mode: string): Output_Modes {
   const little_mode = mode.toLowerCase();
   if (!output_modes.includes(little_mode)) {
      let errorString =
         'Invalid values for output mode, ' +
         `Given: "${mode}", Choices: ` +
         output_modes.map((e) => `"${e}"`).join(", ");
      throw new InvalidArgumentError(errorString);
   }
   return little_mode as Output_Modes;
}

export function green_text(s: string) {
   process.stderr.write(`\x1b[32m${s}\x1b[0m\n`);
}
export function yellow_text(s: string) {
   process.stderr.write(`\x1b[33m${s}\x1b[0m\n`);
}
export function red_text(s: string) {
   process.stderr.write(`\x1b[31m${s}\x1b[0m\n`);
}
export function normal_text(s: string) {
   process.stderr.write(`${s}\n`);
}
export function payload_text(s: string) {
   process.stdout.write(s);
}