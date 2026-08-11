import Logger from "../logger";
import Supra_Builder from "../generata/supra_builder";

import { recursive_expansion } from "../utils/utilities";
import { get_distribution } from "../utils/picker_utilities";
import type { Distribution, Output_Mode } from "../utils/types";

class Generation_Resolver {
   private logger: Logger;
   public supra_builder: Supra_Builder;
   private output_mode: Output_Mode;

   public units: Map<string, { content: string; line_num: number }>;

   private wordshape_classes_pending: {
      content: string;

      optionals_weight: number;
      wordshape_distribution: Distribution;

      name: string | null;
      line_num: number;
   }[];
   public wordshape_classes: {
      wordshapes: { items: string[]; masks: string[]; weights: number[] };

      optionals_weight: number;
      wordshape_distribution: Distribution;

      name: string | null;
      line_num: number;
   }[];
   private word_class_choices: string[];

   constructor(
      logger: Logger,
      output_mode: Output_Mode,
      supra_builder: Supra_Builder,
      units: Map<string, { content: string; line_num: number }>,
      wordshape_classes_pending: {
         content: string;
         wordshape_distribution: Distribution;
         optionals_weight: number;
         line_num: number;
         name: string | null;
      }[],
      word_class_choices: string[],
   ) {
      this.logger = logger;
      this.output_mode = output_mode;

      this.supra_builder = supra_builder;

      this.units = units;

      this.wordshape_classes_pending = wordshape_classes_pending;
      this.wordshape_classes = [];
      this.word_class_choices = word_class_choices;

      this.expand_units();
      this.expand_wordshape_units();
      this.set_wordshape_classes();
      if (this.output_mode === "debug") {
         this.show_debug();
      }
   }

   private set_wordshape_classes() {
      this.wordshape_classes = [];

      if (this.wordshape_classes_pending.length === 0) {
         this.logger.validation_error(
            "No words directives to choose word-shapes from",
            null,
         );
      }

      if (this.word_class_choices.length > 0) {
         let matched_any = false;

         for (const pending of this.wordshape_classes_pending) {
            if (!pending.name) {
               continue;
            }
            if (this.word_class_choices.includes(pending.name)) {
               matched_any = true;
               const parsed = this.set_wordshapes(pending);
               this.wordshape_classes.push(parsed);
            }
         }

         if (!matched_any) {
            this.logger.validation_error(
               `No word-shape classes matched any of the choices: ${this.word_class_choices.join(", ")}`,
               null,
            );
         }

         return;
      } else {
         for (const pending of this.wordshape_classes_pending) {
            const parsed = this.set_wordshapes(pending);
            this.wordshape_classes.push(parsed);
         }
      }
   }

   private set_wordshapes(pending: {
      content: string;
      line_num: number;
      name: string | null;
      optionals_weight: number;
      wordshape_distribution: Distribution;
   }) {
      const result: string[] = [];
      let buffer = "";
      let inside_brackets = 0;

      const masks: string[] = [];

      // If no word shapes at all
      if (pending.content.trim().length === 0) {
         const name_display = pending.name
            ? ` in word-class "${pending.name}"`
            : "";
         this.logger.validation_error(
            `No word-shapes to choose from${name_display}`,
            pending.line_num,
         );
      }

      // Stage 1: supra-builder processing
      const processed = this.supra_builder.process_string(
         pending.content,
         pending.line_num,
      );

      // Stage 2: validations
      if (!this.valid_words_brackets(processed)) {
         this.logger.validation_error(
            `Word-shapes had mismatched brackets in word-class "${pending.name}"`,
            pending.line_num,
         );
      }

      if (!this.valid_words_weights(processed)) {
         this.logger.validation_error(
            `Word-shapes had invalid weights in word-class "${pending.name}"`,
            pending.line_num,
         );
      }

      // Stage 3: tokenize respecting bracket depth
      for (let i = 0; i < processed.length; i++) {
         const char = processed[i];

         if (char === "{" || char === "(") inside_brackets++;
         else if (char === "}" || char === ")") inside_brackets--;

         if ((char === " " || char === ",") && inside_brackets === 0) {
            if (buffer.length > 0) {
               result.push(buffer);
               buffer = "";
            }
         } else {
            buffer += char;
         }
      }

      if (buffer.length > 0) {
         result.push(buffer);
      }

      // Stage 4: extract values + weights
      const [items, weights] = this.extract_wordshape_value_and_weight(
         result,
         pending.wordshape_distribution,
      );

      // Create wordshape masks
      for (const j of items) {
         masks.push(this.supra_builder.replace_for_mask(j));
      }
      console.log(masks);

      // Stage 5: return a fully-formed class object
      return {
         wordshapes: { items, masks, weights },
         optionals_weight: pending.optionals_weight,
         wordshape_distribution: pending.wordshape_distribution,
         name: pending.name,
         line_num: pending.line_num,
      };
   }

   private valid_words_brackets(str: string): boolean {
      const stack: string[] = [];
      const bracket_pairs: Record<string, string> = {
         ")": "(",
         ">": "<",
         "}": "{",
      };
      for (const char of str) {
         if (Object.values(bracket_pairs).includes(char)) {
            stack.push(char); // Push opening brackets onto stack
         } else if (Object.keys(bracket_pairs).includes(char)) {
            if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
               return false; // Unmatched closing bracket
            }
         }
      }
      return stack.length === 0; // Stack should be empty if balanced
   }

   private extract_wordshape_value_and_weight(
      input_list: string[],
      default_distribution: string,
   ): [string[], number[]] {
      const my_values: string[] = [];
      const my_weights: number[] = [];

      const combine_adjacent_chunks = (str: string): string[] => {
         const chunks: string[] = [];
         let buffer = "";
         let bracket_depth = 0;
         let paren_depth = 0;

         for (let i = 0; i < str.length; i++) {
            const char = str[i];
            buffer += char;

            if (char === "{") bracket_depth++;
            if (char === "}") bracket_depth--;
            if (char === "(") paren_depth++;
            if (char === ")") paren_depth--;

            const atEnd = i === str.length - 1;

            if (
               (char === "," && bracket_depth === 0 && paren_depth === 0) ||
               atEnd
            ) {
               if (char !== "," && atEnd) {
                  // Final character is part of buffer
               } else {
                  buffer = buffer.slice(0, -1); // remove comma
               }
               if (buffer.trim()) chunks.push(buffer.trim());
               buffer = "";
            }
         }
         return chunks;
      };

      const all_parts = input_list.flatMap(combine_adjacent_chunks);

      const all_default_weights = all_parts.every(
         (part) => !/^(?:\{.*\}|[^*]+)\*[\d.]+$/.test(part),
      );

      if (all_default_weights) {
         const trimmed_values = all_parts.map((part) => part.trim());
         const total_items = trimmed_values.length;

         const chosen_distribution: number[] = get_distribution(
            total_items,
            default_distribution,
         );

         my_values.push(...trimmed_values);
         my_weights.push(...chosen_distribution);

         return [my_values, my_weights];
      }

      for (const part of all_parts) {
         const trimmed = part.trim();
         const match = trimmed.match(/^(.*)\*([\d.]+)$/);

         if (match && !/\{.*\*.*\}$/.test(match[1])) {
            my_values.push(match[1]);
            my_weights.push(parseFloat(match[2]));
         } else if (/^\{.*\}\*[\d.]+$/.test(trimmed)) {
            const i = trimmed.lastIndexOf("*");
            my_values.push(trimmed.slice(0, i));
            my_weights.push(parseFloat(trimmed.slice(i + 1)));
         } else {
            my_values.push(trimmed);
            my_weights.push(1);
         }
      }

      return [my_values, my_weights];
   }

   private valid_words_weights(str: string): boolean {
      // Rule 1: asterisk must be followed by a number (integer or decimal)
      const asterisk_without_number = /\*(?!\d+(\.\d+)?)/g;

      // Rule 2: asterisk must not appear at the start
      const asterisk_at_start = /^\*/; // Returns false if follows rule

      // Rule 3: asterisk must not be preceded by space or comma
      const asterisk_after_space_or_comma = /[ ,]\*/g; // Returns false if follows rule

      // Rule 4: asterisk-number (int or decimal) pair
      // must be followed by space, comma, }, ], ), or end of string
      const asterisk_number_bad_suffix =
         /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,}\])\n]|$)/g;

      // If any are true return false
      if (
         asterisk_without_number.test(str) ||
         asterisk_at_start.test(str) ||
         asterisk_after_space_or_comma.test(str) ||
         asterisk_number_bad_suffix.test(str)
      ) {
         return false;
      }
      return true;
   }

   private expand_wordshape_units() {
      for (let i = 0; i < this.wordshape_classes_pending.length; i++) {
         const w_class = this.wordshape_classes_pending[i];

         // Expand units inside the raw wordshape content
         w_class.content = recursive_expansion(w_class.content, this.units);

         // Detect dud units in the expanded content
         const match = w_class.content.match(/<[A-Za-z+$-]+>/);
         if (match) {
            this.logger.validation_error(
               `Nonexistent unit detected in word-class "${w_class.name}": "${match[0]}"`,
               w_class.line_num,
            );
         }
      }
   }

   private expand_units() {
      for (const [key, value] of this.units.entries()) {
         const expanded_content = recursive_expansion(
            value.content,
            this.units,
         );
         this.units.set(key, {
            content: expanded_content,
            line_num: value.line_num, // Preserve original line_num
         });
      }
   }

   show_debug(): void {
      // --- Units ---
      const units: string[] = [];
      for (const [key, value] of this.units) {
         units.push(`  ${key.slice(1, -1)} = ${value.content}`);
      }

      // --- Wordshape classes ---
      const classes: string[] = [];

      for (let i = 0; i < this.wordshape_classes.length; i++) {
         const w_class = this.wordshape_classes[i];

         const shapes: string[] = [];
         for (let j = 0; j < w_class.wordshapes.items.length; j++) {
            shapes.push(
               `    ${w_class.wordshapes.masks[j]}*${w_class.wordshapes.weights[j]}`,
            );
         }

         classes.push(
            `Word-class ${i} "${w_class.name}" {\n` +
               `  Distribution: ${w_class.wordshape_distribution}\n` +
               `  Optionals-weight: ${w_class.optionals_weight}\n` +
               `  Wordshapes:\n` +
               shapes.join("\n") +
               `\n}`,
         );
      }

      // --- Final diagnostic output ---
      const info: string =
         `Units {\n` + units.join("\n") + `\n}\n` + classes.join("\n\n");

      this.logger.diagnostic(info);
   }
}

export default Generation_Resolver;
