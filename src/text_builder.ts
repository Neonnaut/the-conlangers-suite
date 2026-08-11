import Word from "./word";
import Logger from "./logger";
import { collate_words_by_current_form } from "./collator";
import { final_sentence } from "./utils/utilities";
import type { Output_Mode } from "./utils/types";
import Lettercase_Mapper from "./transforma/lettercase_mapper";

class Text_Builder {
   private logger: Logger;
   private lettercase_mapper: Lettercase_Mapper;
   private build_start: number;

   private num_of_words: number;
   private output_mode: Output_Mode;
   private remove_duplicates: boolean;
   private force_word_limit: boolean;
   private sort_words: boolean;
   private output_divider: string;
   private alphabet: string[];
   private invisible: string[];

   public terminated: boolean;
   private words: Word[];
   private wordclasses: {
      name: string | null;
      words: Word[];
   }[];

   private num_of_duplicates: number;
   private num_of_rejects: number;
   private num_of_duds: number;
   private upper_gen_limit: number;

   constructor(
      logger: Logger,
      lettercase_mapper: Lettercase_Mapper,
      build_start: number,

      num_of_words: number,
      //input_words: string,
      //input_divider: string,

      remove_duplicates: boolean,
      force_word_limit: boolean,

      output_mode: Output_Mode,
      output_divider: string,

      sort_words: boolean,
      alphabet: string[],
      invisible: string[],
   ) {
      this.logger = logger;
      this.lettercase_mapper = lettercase_mapper;
      this.build_start = build_start;

      this.num_of_words = num_of_words;
      this.output_mode = output_mode;
      this.remove_duplicates = remove_duplicates;
      this.force_word_limit = force_word_limit;
      this.sort_words = sort_words;
      this.output_divider = output_divider;
      this.alphabet = alphabet;
      this.invisible = invisible;

      this.terminated = false;
      this.words = [];

      this.wordclasses = [];

      this.num_of_duplicates = 0;
      this.num_of_rejects = 0;
      this.num_of_duds = 0;

      this.upper_gen_limit = num_of_words * 5;
      if (this.upper_gen_limit > 1000000) {
         this.upper_gen_limit = 1000000;
      }
      if (this.output_mode === "debug") {
         this.show_debug();
      }
   }

   reset_for_wordclass(name: string | null) {
      this.wordclasses.push({ name: name, words: this.words });

      this.words = [];
      this.num_of_duplicates = 0;
      this.num_of_rejects = 0;
      this.num_of_duds = 0;

      this.terminated = false;
   }

   add_word(word: Word) {
      let do_it: boolean = false;

      if (word.rejected && Word.output_mode !== "debug") {
         this.num_of_rejects++;
         this.num_of_duds++; // Record num of reject
      } else if (this.remove_duplicates) {
         let found_duplicate: boolean = false;
         const current_word_form = word.get_last_form();

         for (let i = 0; i < this.words.length; i++) {
            if (this.words[i].get_last_form() === current_word_form) {
               found_duplicate = true;
               break; // early exit. very important for speed.
            }
         }

         if (found_duplicate) {
            this.num_of_duplicates++; // A duplicate word
            this.num_of_duds++;
         } else {
            do_it = true; // A unique word
         }
      } else {
         do_it = true;
      }

      if (do_it) {
         this.words.push(word);
      }

      // Work out if we need to terminate -- stop more words being made.
      if (this.words.length >= this.num_of_words) {
         this.terminated = true; // Generated enough words !!
      } else if (Date.now() - this.build_start >= 30000) {
         this.terminated = true;
         if (this.remove_duplicates) {
            this.logger.warn(
               `Could not generate the requested amount of words. Try adding more unique word-shapes or remove some reject transforms`,
            );
         } else {
            this.logger.warn(
               `Could not generate the requested amount of words. Try adding more word-shapes or remove some reject transforms`,
            );
         }
      } else if (
         this.num_of_duds >= this.upper_gen_limit &&
         !this.force_word_limit
      ) {
         this.terminated = true;
         if (this.remove_duplicates) {
            this.logger.warn(
               `Could not generate the requested amount of words. Try adding more unique word-shapes or remove some reject transforms`,
            );
         } else {
            this.logger.warn(
               `Could not generate the requested amount of words. Try adding more word-shapes or remove some reject transforms`,
            );
         }
      }
   }

   create_record() {
      const ms = Date.now() - this.build_start;
      const seconds = Math.ceil(ms / 100) / 10;
      const s = seconds.toFixed(seconds % 1 === 0 ? 0 : 1);
      const display = s === "1" ? `${s} second` : `${s} seconds`;

      const only_one_unnamed =
         this.wordclasses.length === 1 && this.wordclasses[0].name === null;

      for (const w_class of this.wordclasses) {
         const count = w_class.words.length;

         // --- unified suffix logic ---
         const class_suffix = only_one_unnamed
            ? "" // original behaviour
            : ` in word-class "${w_class.name ?? "default"}"`;

         const records: string[] = [];

         // --- word count ---
         if (count === 1) {
            records.push(`1 word generated${class_suffix}`);
         } else if (count > 1) {
            records.push(`${count} words generated${class_suffix}`);
         } else {
            records.push(`Zero words generated${class_suffix}`);
         }

         // --- duplicates ---
         if (this.num_of_duplicates === 1) {
            records.push(`1 duplicate word removed${class_suffix}`);
         } else if (this.num_of_duplicates > 1) {
            records.push(
               `${this.num_of_duplicates} duplicate words removed${class_suffix}`,
            );
         }

         // --- rejects ---
         if (this.num_of_rejects === 1) {
            records.push(`1 word rejected${class_suffix}`);
         } else if (this.num_of_rejects > 1) {
            records.push(
               `${this.num_of_rejects} words rejected${class_suffix}`,
            );
         }

         this.logger.info(`${final_sentence(records)}`);
      }
      this.logger.info(`Completed in ${display}`);
   }

   make_text(): string {
      this.create_record();

      const blocks: string[] = [];

      const only_one_unnamed =
         this.wordclasses.length === 1 && this.wordclasses[0].name === null;

      for (const w_class of this.wordclasses) {
         // --- Sort words if sort words ---
         let my_words = w_class.words;

         if (this.sort_words) {
            my_words = collate_words_by_current_form(
               this.logger,
               my_words,
               this.alphabet,
               this.invisible,
            );
         }

         // Convert Word objects to strings
         const word_list = my_words.map((w) => w.get_word());

         let my_class_output: string = "";
         if (this.output_mode === "paragraph") {
            my_class_output = this.paragraphify(word_list);
         } else {
            my_class_output = word_list.join(this.output_divider);
         }

         let my_header: string = "";
         if (!only_one_unnamed) {
            my_header = w_class.name ?? "default";
            my_header += ":\n\n";
         } else {
            my_header = "";
         }

         blocks.push(my_header + my_class_output);
      }

      return blocks.join("\n\n");
   }

   paragraphify(words: string[]): string {
      if (words.length === 0) return "";
      if (words.length === 1)
         return (
            this.lettercase_mapper.capitalise(words[0]) +
            this.random_end_punctuation()
         );

      const result: string[] = [];

      let should_capitalise = true;
      for (let i = 0; i < words.length; i++) {
         let word = words[i];

         if (should_capitalise) {
            word = this.lettercase_mapper.capitalise(word);
            should_capitalise = false;
         }

         if (i === words.length - 1) {
            result.push(word); // Hold final punctuation until the end
         } else if (i % 7 === 0 && i !== 0) {
            const punctuation = this.random_end_punctuation();
            result.push(word + punctuation);
            should_capitalise = true; // Capitalize next word
         } else if (i % 6 === 0 && i !== 0) {
            result.push(word + ","); // Sprinkle commas
         } else {
            result.push(word);
         }
      }

      let paragraph = result.join(" ");

      // Remove any dangling punctuation at the end
      paragraph = paragraph.replace(/[,\s]*$/, "");

      // Add final punctuation (., ?, or ! with weighted odds)
      paragraph += this.random_end_punctuation();

      return paragraph;
   }

   random_end_punctuation(): string {
      const roll = Math.random();
      if (roll < 0.005) return "..."; // 0.4% chance of ellipsis
      if (roll < 0.03) return "!"; // 2% chance of exclamation
      if (roll < 0.08) return "?"; // 5% chance of question
      return "."; // 93% chance of full stop
   }

   show_debug(): void {
      // Options
      const option_info: string =
         `Options {` +
         `\n  Number of words: ${this.num_of_words}` +
         `\n  Output mode: ${this.output_mode}` +
         `\n  Remove duplicates: ${this.remove_duplicates}` +
         `\n  Force word limit: ${this.force_word_limit}` +
         `\n  Sort words: ${this.sort_words}` +
         `\n  Output divider: "${this.output_divider}"` +
         `\n}`;

      this.logger.diagnostic(option_info);

      // Collator info
      const sort_info: string =
         `Collator {` +
         `\n  Alphabet: ${this.alphabet.join(", ")}` +
         `\n  Invisible: ${this.invisible.join(", ")}` +
         `\n}`;

      this.logger.diagnostic(sort_info);

      // Word‑classes
      const class_blocks: string[] = [];

      for (let i = 0; i < this.wordclasses.length; i++) {
         const w_class = this.wordclasses[i];
         const name = w_class.name ?? "default";

         const words = w_class.words.length
            ? w_class.words.join(", ")
            : "(none)";

         class_blocks.push(
            `Word-class "${name}" {` + `\n  Words: ${words}` + `\n}`,
         );
      }

      this.logger.diagnostic(class_blocks.join("\n\n"));
   }
}

export default Text_Builder;
