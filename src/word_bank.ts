import Word from "./word";
import Logger from "./logger";

import { final_sentence } from "./utils/utilities";
import type { Output_Mode, Schema } from "./utils/types";
import { collate_words_by_current_form } from "./collator";
import Lettercase_Mapper from "./transforma/lettercase_mapper";

class Word_Bank {
   public logger: Logger;
   private lettercase_mapper: Lettercase_Mapper;
   public build_start: number;

   public schema_input: Schema;
   public schema_output: Schema;

   public words: Word[];

   private input_divider: string;
   private output_divider: string;

   private num_of_rejects = 0;
   private num_of_transformed = 0;
   private num_of_passed = 0;

   private output_mode: Output_Mode;

   public sort_words: boolean;
   public alphabet: string[];
   public invisible: string[];

   constructor(
      logger: Logger,
      lettercase_mapper: Lettercase_Mapper,
      build_start: number,

      schema_input: Schema,
      schema_output: Schema,

      input_words: string,
      input_divider: string,

      output_mode: Output_Mode,
      output_divider: string,

      sort_words: boolean,
      alphabet: string[],
      invisible: string[],
   ) {
      this.logger = logger;
      this.lettercase_mapper = lettercase_mapper;

      this.build_start = build_start;

      this.schema_input = schema_input;
      this.schema_output = schema_output;

      this.num_of_rejects = 0;

      this.input_divider = input_divider;
      this.output_divider = output_divider;

      this.words = [];

      this.output_mode = output_mode;
      Word.output_mode = output_mode;
      Word.fields = schema_output.fields;
      Word.field_delimiters = schema_output.delimiters;

      if (input_words == "") {
         this.logger.validation_error("No input words to transform");
      }

      this.sort_words = sort_words;
      this.alphabet = alphabet;
      this.invisible = invisible;

      const input_word_array = input_words.split(this.input_divider);

      for (let i = 0; i < input_word_array.length; i++) {
         if (input_word_array[i] === "") {
            continue;
         }

         let my_field_values: Record<string, string>;
         if (this.schema_input.fields.length === 0) {
            my_field_values = { word: input_word_array[i].trim() };
         } else {
            my_field_values = this.split_word_by_schema(
               input_word_array[i].trim(),
            );
         }
         const word = new Word(null, my_field_values);
         this.words.push(word);
      }
   }

   make_text() {
      const word_list: string[] = [];

      if (this.sort_words) {
         this.words = collate_words_by_current_form(
            this.logger,
            this.words,
            this.alphabet,
            this.invisible,
         );
      }

      for (let i = 0; i < this.words.length; i++) {
         const my_word = this.words[i];
         if (my_word.rejected) {
            this.num_of_rejects++;
            if (this.output_mode === "debug") {
               word_list.push(my_word.get_word());
            }
         } else {
            word_list.push(my_word.get_word());
            if (my_word.num_of_transformations > 0) {
               this.num_of_transformed++;
            } else {
               this.num_of_passed++;
            }
         }
      }
      this.create_record();
      if (this.output_mode === "debug") {
         this.show_debug();
      }

      if (this.output_mode === "paragraph") {
         // Capitalise word if first word or previous word ended in punctuation
         const paragraph_words: string[] = [];
         let capitalize_next = true;
         for (let i = 0; i < word_list.length; i++) {
            let word = word_list[i];
            if (capitalize_next) {
               word = this.lettercase_mapper.capitalise(word);
               capitalize_next = false;
            }
            paragraph_words.push(word);
            const last_char = word.charAt(word.length - 1);
            if ([".", "!", "?"].includes(last_char)) {
               capitalize_next = true;
            }
         }
         return paragraph_words.join(" ");
      }

      return word_list.join(this.output_divider);
   }

   private split_word_by_schema(raw_word: string): Record<string, string> {
      const values: Record<string, string> = {};

      const fields = this.schema_input.fields;
      const delims = this.schema_input.delimiters;

      let pos = 0;
      let i = 0;

      // 1. consume first delimiter (delims[0])
      const first_delim = delims[0];
      if (first_delim !== "") {
         if (raw_word.startsWith(first_delim)) {
            pos = first_delim.length;
         } else {
            // delimiter mismatch → treat as empty
         }
      }

      // 2. extract each field using the delimiter that follows it
      while (i < fields.length) {
         const field = fields[i];
         const next_delim = delims[i + 1] || "";

         let end;

         if (next_delim === "") {
            // last field consumes rest
            end = raw_word.length;
         } else {
            end = raw_word.indexOf(next_delim, pos);
            if (end === -1) {
               end = raw_word.length;
            }
         }

         values[field] = raw_word.slice(pos, end);

         pos = end + next_delim.length;
         i++;
      }

      return values;
   }

   create_record() {
      const ms = Date.now() - this.build_start;
      const seconds = Math.ceil(ms / 100) / 10;
      const s = seconds.toFixed(seconds % 1 === 0 ? 0 : 1);
      const display = s === "1" ? `${s} second` : `${s} seconds`;

      const records: string[] = [];

      if (this.num_of_transformed == 1) {
         records.push(`1 word had transformations`);
      } else if (this.num_of_transformed > 1) {
         records.push(`${this.num_of_transformed} words had transformations`);
      }

      if (this.num_of_passed == 1) {
         records.push(`1 word unchanged`);
      } else if (this.words.length > 1) {
         records.push(`${this.num_of_passed} words unchanged`);
      }

      if (this.num_of_rejects == 1) {
         records.push(`1 word was rejected`);
      } else if (this.num_of_rejects > 1) {
         records.push(`${this.num_of_rejects} words rejected`);
      }
      this.logger.info(`${final_sentence(records)} -- in ${display}`);
   }

   show_debug(): void {
      const info: string =
         `~ CREATING TEXT ~\n` +
         `\nNum of words: ` +
         this.words.length +
         `\nSchema {\n` +
         `  input fields = "${this.schema_input.fields.join('", "')}"\n` +
         `  input delimiters = "${this.schema_input.delimiters.join('", "')}"\n` +
         `  output fields = "${this.schema_output.fields.join('", "')}"\n` +
         `  output delimiters = "${this.schema_output.delimiters.join('", "')}"\n` +
         `}\n` +
         `\nMode: ` +
         this.output_mode;

      this.logger.diagnostic(info);
   }
}

export default Word_Bank;
