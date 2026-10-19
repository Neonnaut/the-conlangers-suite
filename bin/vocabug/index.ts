#!/usr/bin/env node
/// <reference types="node" />

import fs from "fs";
import { Command, InvalidArgumentError } from "commander";

import { vocabug } from "../../src/main";
import { VERSION } from "../../src/utils/version";

import {
  Output_Modes,
  encodings,
  green_text,
  yellow_text,
  red_text,
  normal_text,
  payload_text
} from "../cli_arg_helpers";

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
  .name("vocabug")
  .usage("<path> [options]")
  .version(VERSION, "-v, --version")
  .helpOption("-?, --help", "Show help")
  .addHelpText(
    "after",
    "\nFor full documentation, visit: https://neonnaut.neocities.org/vocabug_docs"
  );

// ---- Options ----
program
  .argument("<path>", "Path to input file")

  .option("-n, --num_of_words <number>", "Number of words to generate", "100")
  .option(
    "-m, --output_mode <mode>",
    "Output mode",
    (value) => value,
    "word-list"
  )
  .option("-r, --remove_duplicates", "Remove duplicate words", true)
  .option("-l, --force_word_limit", "Force word limit", false)
  .option("-s, --sort_words", "Sort generated words", true)
  .option("-od, --output_divider <string>", "Divider between words", " ")
  .option(
    "-wc, --wordclass_choices <list>",
    'Comma-separated list of word classes (e.g., "noun,verb")',
    ""
  )
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

    normal_text(
      `Generating words with Vocabug version ${VERSION}. This may take up to 30 seconds...`
    );

    const parsed_choices: string[] = options.wordclass_choices
      .split(",")
      .map((choice: string) => choice.trim())
      .filter((choice: string) => choice.length > 0);

    const run = vocabug({
      file: file_text,
      num_of_words: Number(options.num_of_words),
      output_mode: options.output_mode as Output_Modes,
      remove_duplicates: Boolean(options.remove_duplicates),
      force_word_limit: Boolean(options.force_word_limit),
      sort_words: Boolean(options.sort_words),
      output_divider: options.output_divider,
      wordclass_choices: parsed_choices
    });

    for (const warning of run.warnings) yellow_text(warning);
    for (const error of run.errors) red_text(error);
    for (const info of run.infos) green_text(info);

    if (run.payload) payload_text(run.payload);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      red_text(`Error: File not found with path "` + err.path + `"`);
    } else if (err.code === "EISDIR") {
      red_text(
        `Error: You passed a directory where a file was required with path "` +
          err.path +
          `"`
      );
    } else if (err.code === "EACCES" || err.code === "EPERM") {
      red_text(
        `Error: You do not have permission to read or write this file, with path "` +
          err.path +
          `"`
      );
    } else {
      red_text("Error: " + err.message);
    }
  }
});

program.parse();
