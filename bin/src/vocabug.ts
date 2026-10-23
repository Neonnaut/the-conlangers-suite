#!/usr/bin/env node
/// <reference types="node" />

import fs from "fs";
import { Command } from "commander";
import { vocabug } from "../../src/main";
import { VERSION } from "../../src/utils/version";
import {
  Output_Modes,
  green_text,
  yellow_text,
  red_text,
  normal_text,
  payload_text,
  parse_encoding,
  parse_mode
} from "./cli_arg_helpers";

const program = new Command();
program
  .name("vocabug")
  .usage("<path> [options]")
  .version(VERSION, "-v, --version")
  .helpOption("-?, --help")
  .addHelpText(
    "after",
    "\nFor full documentation, visit: https://neonnaut.neocities.org/vocabug_docs"
  );

// Options
program
  .argument("<path>", "path to input file")
  .option("-n, --num_of_words <number>", "number of words to generate", "100")
  .option("-m, --output_mode <mode>", "output mode", parse_mode, "word-list")
  .option("-r, --remove_duplicates", "remove duplicate words", true)
  .option("-l, --force_word_limit", "force word limit", false)
  .option("-s, --sort_words", "sort generated words", true)
  .option("--od, --output_divider <string>", "divider between words", " ")
  .option("--wc, --wordclass_choices <list>", 'comma-separated list of word classes (e.g., "noun,verb")', "")
  .option("-e, --encoding <enc>", "what file encoding to use", parse_encoding, "utf8");

program.action((filePath: string, options) => {
  try {
    const raw = fs.readFileSync(filePath);
    const file_text = raw.toString(options.encoding);

    normal_text(`Generating words with Vocabug version ${VERSION}. This may take up to 30 seconds...`);

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
    for (const debug of run.diagnostics) normal_text(debug);

    if (run.payload) payload_text(run.payload);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      red_text("Error: File not found.");
    } else if (err.code === "EISDIR") {
      red_text("Error: The path to the file was a directory.");
    } else if (err.code === "EACCES" || err.code === "EPERM") {
      red_text("Error: Permission was denied to read this file.");
    } else {
      red_text("Error: " + err.message);
    }
  }
});

program.parse();
