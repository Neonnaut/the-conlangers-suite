#!/usr/bin/env node
/// <reference types="node" />

import fs from "fs";
import { Command } from "commander";
import { nesca } from "../../src/main";
import { VERSION } from "../../src/utils/version";
import {
  Output_Modes,
  green_text,
  yellow_text,
  red_text,
  normal_text,
  payload_text,
  parse_encoding,
  parse_mode,
} from "../cli_arg_helpers";

const program = new Command();
program
  .name("nesca")
  .usage("<path> [options]")
  .version(VERSION, "-v, --version")
  .helpOption("-?, --help")
  .addHelpText("after", "\nFor full documentation, visit: https://neonnaut.neocities.org/nesca_docs");

// Options
program
  .argument("<path>", "path to input file")
  .option("-m, --output_mode <mode>", "output mode", parse_mode, "word-list")
  .option("-s, --sort_words", "sort generated words", true)
  .argument("--iw, --input_words <string>", "input words to transform")
  .option("--id, --input_divider <string>", "divider between words", " ")
  .option("--od, --output_divider <string>", "divider between words", " ")
  .option("-e, --encoding <enc>", "what file encoding to use", parse_encoding, "utf8"
);

program.action((filePath: string, options) => {
  try {
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