import fs from 'fs';

export type Output_Modes = 'word-list' | 'debug' | 'paragraph';

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