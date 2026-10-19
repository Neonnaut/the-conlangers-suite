#!/usr/bin/env node
/// <reference types="node" />

import fs from "fs";
import { Command, InvalidArgumentError } from "commander";

import { nesca } from "../../src/main";
import { VERSION } from "../../src/utils/version";

// ---- Output modes ----
type Output_Modes = "word-list" | "debug" | "paragraph";

// ---- Encodings ----
const encodings: readonly BufferEncoding[] = [
  "ascii",
  "binary",
  "latin1",
  "ucs-2",
  "ucs2",
  "utf-8",
  "utf16le",
  "utf8"
];

// ---- Encoding coercion ----
function coerceEncoding(enc: string): BufferEncoding {
  const littleEnc = enc.toLowerCase();

  if (littleEnc === "utf-16le") {
    return "utf16le";
  }

  if (!(encodings as string[]).includes(littleEnc)) {
    let errorString =
      'Invalid values:\n  Argument: encoding, ' +
      `Given: "${enc}", Choices: ` +
      encodings.map((e) => `"${e}"`).join(", ");
    throw new InvalidArgumentError(errorString);
  }

  return littleEnc as BufferEncoding;
}

const program = new Command();

program
  .name("nesca")
  .usage("<path> [options]")
  .version(VERSION, "-v, --version")
  .helpOption("-?, --help", "Show help")
  .addHelpText(
    "after",
    "\nFor full documentation, visit: https://neonnaut.neocities.org/nesca_docs"
  );

// ---- Options ----
program
  .argument("<path>", "Path to input file")

  .option(
    "-m, --output_mode <mode>",
    "Output mode",
    (value) => value,
    "word-list"
  )
  .option("-s, --sort_words", "Sort generated words", true)
  .option("-iw, --input_words <string>", "Input words to transform", "")
  .option("-id, --input_divider <string>", "Divider between words", " ")
  .option("-od, --output_divider <string>", "Divider between words", " ")
  .option(
    "-e, --encoding <enc>",
    "What file encoding to use",
    coerceEncoding,
    "utf8"
  );

// ---- Main ----
program.action((filePath: string, options) => {
  try {
    // Always convert to string to avoid NonSharedBuffer issues
    const raw = fs.readFileSync(filePath);
    const file_text = raw.toString(options.encoding);

    normal_text(`Transforming words with Nesca version ${VERSION}...`);

    const run = nesca({
      file: file_text,
      input_words: options.input_words,
      output_mode: options.output_mode as Output_Modes,
      input_divider: options.input_divider,
      output_divider: options.output_divider,
      sort_words: Boolean(options.sort_words)
    });

    for (const warning of run.warnings) yellow_text(warning);
    for (const error of run.errors) red_text(error);
    for (const info of run.infos) green_text(info);
    for (const debug of run.diagnostics) normal_text(debug);

    if (run.payload) payload_text(run.payload);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      red_text(`Error: File not found with path "` + err.path + `"`);
    } else if (err.code === "EISDIR") {
      red_text(
        `Error: Path was a directory where a file was required, with path "` +
          err.path +
          `"`
      );
    } else if (err.code === "EACCES" || err.code === "EPERM") {
      red_text(
        `Error: Denied permission to read or write this file, with path "` +
          err.path +
          `"`
      );
    } else {
      red_text("Error: " + err.message);
    }
  }
});

program.parse();

// ---- Color functions ----
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
