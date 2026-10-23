/// <reference types="node" />

export type Output_Modes = 'word-list' | 'debug' | 'old-to-new' | 'paragraph';
export const output_modes:string[] = ['word-list', 'debug', 'old-to-new' , 'paragraph'];

import { InvalidArgumentError } from "commander";
import { exit, exitCode } from "process";

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
  const little_enc = enc.toLowerCase();
  if (little_enc === "utf-16le") {return "utf16le";}
  if (!(encodings as string[]).includes(little_enc)) {
    let error_string =
      `Invalid encoding "${enc}", Encodings: ` +
      encodings.map((e) => `"${e}"`).join(", ") + `.`;
      red_text(error_string);
      process.exit(1);
  }
  return little_enc as BufferEncoding;
}

export function parse_mode(mode: string): Output_Modes {
   const little_mode = mode.toLowerCase();
   if (!output_modes.includes(little_mode)) {
      let error_string =
         `Invalid choice "${mode}". The choices are: ` +
         output_modes.map((e) => `"${e}"`).join(", ") + `.`;
      red_text(error_string);
      process.exit(1);
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