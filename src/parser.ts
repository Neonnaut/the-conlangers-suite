import type Escape_Mapper from "./escape_mapper";
import type lettercase_mapper from "./transforma/lettercase_mapper";
import Logger from "./logger";

import type { App, Schema } from "./utils/types";

import { make_percentage, get_last } from "./utils/utilities";
import {
   Output_Mode,
   Distribution,
   Directive,
   Directive_List,
   Routine,
   Transform_Pending,
   SYNTAX_CHARS_CAT_KEY,
} from "./utils/types";

import type Chance_Mapper from "./transforma/chance_mapper";

class Parser {
   private logger: Logger;
   private escape_mapper: Escape_Mapper;
   public lettercase_mapper: lettercase_mapper;

   public chance_mapper: Chance_Mapper;

   public num_of_words: number;
   public output_mode: Output_Mode;
   public remove_duplicates: boolean;
   public force_word_limit: boolean;
   public sort_words: boolean;
   public input_divider: string;
   public output_divider: string;

   public directive: Directive = "none";

   public disable_directive: "p" | boolean = false;

   public directive_name: string;

   public category_distribution: Distribution;
   public category_pending: Map<string, { content: string; line_num: number }>;

   public units: Map<string, { content: string; line_num: number }>;

   public optionals_weight: number;
   public wordshape_distribution: Distribution;

   public wordshape_classes_pending: {
      content: string;
      wordshape_distribution: Distribution;
      optionals_weight: number;
      line_num: number;
      name: string | null;
   }[];

   public feature_pending: Map<string, { content: string; line_num: number }>;

   public schema_input: Schema;
   public schema_output: Schema;

   public stages_pending: {
      transforms_pending: Transform_Pending[];
      name: string;
   }[] = [];
   public substages_pending: {
      transforms_pending: Transform_Pending[];
      name: string;
   }[] = [];

   public syllable_boundaries_pending: string;
   public graphemorphs_pending: string = "";

   public alphabet: string[];
   public invisible: string[];

   private file_line_num = 0;

   private app: App;
   private current_stage_name: string;
   private current_wordclass_name: string | null;

   constructor(
      logger: Logger,
      app: App,
      escape_mapper: Escape_Mapper,
      lettercase_mapper: lettercase_mapper,
      chance_mapper: Chance_Mapper,

      num_of_words_string: number | string, // gen

      output_mode: Output_Mode,
      sort_words: boolean,
      remove_duplicates: boolean, // gen
      force_word_limit: boolean, // gen
      input_divider: string,
      output_divider: string,
   ) {
      this.logger = logger;
      this.app = app;
      this.escape_mapper = escape_mapper;
      this.lettercase_mapper = lettercase_mapper;
      this.chance_mapper = chance_mapper;

      if (num_of_words_string === "") {
         num_of_words_string = "100";
      }
      let num_of_words: number = Number(num_of_words_string);
      if (isNaN(num_of_words)) {
         this.logger.warn(
            `Number of words '${num_of_words}' was not a number. Genearating 100 words instead`,
         );
         num_of_words = 100;
      } else if (!Number.isInteger(num_of_words)) {
         this.logger.warn(
            `Number of words '${num_of_words}' was rounded to the nearest whole number`,
         );
         num_of_words = Math.ceil(num_of_words);
      }
      if (num_of_words > 900_000 || num_of_words < 1) {
         this.logger.warn(
            `Number of words '${num_of_words}' was not between 1 and 900,000. Genearating 100 words instead`,
         );
         num_of_words = 100;
      }
      this.num_of_words = num_of_words;

      this.output_mode = output_mode;

      this.sort_words = sort_words;
      this.remove_duplicates = remove_duplicates;
      this.force_word_limit = force_word_limit;

      this.input_divider = input_divider === "" ? "\\n" : input_divider;
      this.input_divider = this.input_divider.replace(
         new RegExp("\\\\n", "g"),
         "\n",
      );

      if (app === "vocabug") {
         this.output_divider = output_divider === "" ? " " : output_divider;
      } else {
         this.output_divider = output_divider === "" ? "\n" : output_divider;
      }
      this.output_divider = this.output_divider.replace(
         new RegExp("\\\\n", "g"),
         "\n",
      );

      if (this.output_mode === "paragraph") {
         this.sort_words = false;
         this.remove_duplicates = false;
         this.force_word_limit = false;
         this.output_divider = " ";
      } else if (this.output_mode === "debug") {
         this.sort_words = false;
         this.remove_duplicates = false;
         this.force_word_limit = false;
         this.output_divider = "\n\n";
      }

      this.category_distribution = "gusein-zade";
      this.category_pending = new Map();
      this.optionals_weight = 10;
      this.units = new Map();
      this.wordshape_distribution = "zipfian";

      this.wordshape_classes_pending = [];

      this.stages_pending = [];
      this.substages_pending = [];

      this.feature_pending = new Map();

      this.alphabet = [];
      this.invisible = [];

      this.graphemorphs_pending = "";

      this.syllable_boundaries_pending = "";

      this.disable_directive = false;
      this.directive_name = "";

      this.current_stage_name = "";
      this.current_wordclass_name = null;

      this.schema_input = { fields: [], delimiters: [] };
      this.schema_output = { fields: [], delimiters: [] };
   }

   private get_line(file_array: string[]) {
      let line = file_array[this.file_line_num];
      line = line.replace(/(?<!\\);.*/u, "").trim(); // Remove comment!!

      line = this.escape_mapper.set_backslash_escape(line);
      line = this.escape_mapper.get_named_escape(line);
      const stray_check: boolean = this.escape_mapper.has_stray_escape(line);
      if (stray_check) {
         this.logger.validation_error(
            `Invalid named escape`,
            this.file_line_num,
         );
      }
      return line;
   }

   parse_file(file: string) {
      const file_array = file.split("\n");

      let my_decorator: string = "none";
      let my_directive: string = "none";
      let my_subdirective: string = "none";
      let my_header: string[] = [];
      let my_clusterfield_transform: Transform_Pending[] = [];

      let my_wrapped_rule = "";

      for (; this.file_line_num < file_array.length; ++this.file_line_num) {
         let line = this.get_line(file_array);
         if (line === "") {
            continue; // Blank line !!
         }

         // check for decorator
         if (line.startsWith("@")) {
            my_decorator = this.parse_decorator(line, my_decorator);
            if (my_decorator != "none") {
               my_header = [];
               continue; // It's a decorator
            }
         }

         // check for directive change
         const temp_directive = this.parse_directive(line, my_decorator);
         if (temp_directive != "none") {
            if (my_subdirective != "none") {
               this.logger.validation_error(
                  `"${my_subdirective}" was not closed before directive change`,
                  this.file_line_num,
               );
            }
            my_directive = temp_directive;
            my_decorator = "none";
            if (this.disable_directive === true) {
               this.disable_directive = false;
            } else if (this.disable_directive === "p") {
               this.disable_directive = true;
            }
            if (my_directive === "stage") {
               const stage = {
                  transforms_pending: [],
                  name: this.current_stage_name,
               };
               this.current_stage_name = "";
               this.stages_pending.push(stage);
            }
            if (my_directive === "words") {
               if (this.current_wordclass_name === "") {
                  this.logger.validation_error(
                     `Multiple words directive used without using a word-class decorator`,
                     this.file_line_num,
                  );
               }

               const wordshape_class = {
                  content: "",
                  line_num: this.file_line_num,
                  name: this.current_wordclass_name,
                  optionals_weight: this.optionals_weight,
                  wordshape_distribution: this.wordshape_distribution,
               };
               this.wordshape_classes_pending.push(wordshape_class);

               this.current_wordclass_name = "";
            }
            if (my_wrapped_rule.length > 0) {
               this.logger.validation_error(
                  `Wrapped rule was not completed before directive change`,
                  this.file_line_num,
               );
            }
            if (my_directive === "feature-field") {
               my_header = [];
            }
            continue; // It's a directive change
         }

         if (this.disable_directive) {
            continue;
         }

         // NO DIRECTIVE
         if (my_directive === "none") {
            this.logger.validation_error(
               `Invalid syntax -- expected a decorator or directive`,
               this.file_line_num,
            );
         }

         // NOTES
         if (my_directive === "notes") {
            continue; // Ignore notes
         }

         // STAGE
         if (my_directive === "stage") {
            // I need to push each transform to the last stage in stages_pending

            if (my_subdirective === "clusterfield") {
               if (line.startsWith(">")) {
                  for (const transform of my_clusterfield_transform) {
                     this.push_transform_to_stage(transform);
                  }

                  my_subdirective = "none";
                  my_header = [];
                  my_clusterfield_transform = [];
                  continue;
               }

               // Do actual line of clusterfield
               my_clusterfield_transform = this.parse_clusterfield(
                  line,
                  my_header,
                  my_clusterfield_transform,
               );
               continue;
            } else if (line === "<") {
               this.logger.validation_error(
                  `Feature-field header was empty`,
                  this.file_line_num,
               );
            } else if (line.startsWith("< ")) {
               if (my_wrapped_rule.length != 0) {
                  this.logger.validation_error(
                     `Wrapped rule was not completed before starting cluster-field`,
                     this.file_line_num,
                  );
               }
               if (my_clusterfield_transform) {
                  my_clusterfield_transform.push({
                     t_type: "cluster-field",
                     target: "",
                     result: "",
                     conditions: [],
                     exceptions: [],
                     chance: this.chance_mapper.get_last_chance(),
                     line_num: this.file_line_num,
                  });
               }
               line = line.substring(2).trim(); // Remove '< ' from start
               const top_row = line.split(/[\s]+/).filter(Boolean);
               if (top_row.length < 2) {
                  this.logger.validation_error(
                     `Feature-field header too short`,
                     this.file_line_num,
                  );
               }
               my_subdirective = "clusterfield";
               my_header = top_row;
               continue;
            } else if (
               line.startsWith("<routine") ||
               line.startsWith("<recasts")
            ) {
               if (my_wrapped_rule.length != 0) {
                  this.logger.validation_error(
                     `Wrapped rule was not completed before starting routine`,
                     this.file_line_num,
                  );
               }

               // Routine
               const my_routine = this.parse_routine(line);
               this.push_transform_to_stage({
                  t_type: my_routine,
                  target: "\\",
                  result: "\\",
                  conditions: [],
                  exceptions: [],
                  chance: this.chance_mapper.get_last_chance(),
                  line_num: this.file_line_num,
               });
               continue;
            } else if (line.startsWith("<@chance")) {
               const match = line.match(/^<@chance\s*=\s*(\d+(?:\.\d+)?)%$/);
               if (this.chance_mapper.check_parsing) {
                  this.logger.validation_error(
                     `Cannot start a new chance while another chance is being parsed`,
                     this.file_line_num,
                  );
               }
               if (match) {
                  const percent = match[1];
                  this.chance_mapper.add_chance(Number(percent));
                  this.chance_mapper.check_parsing = true;
               } else {
                  this.logger.validation_error(
                     `Invalid chance syntax`,
                     this.file_line_num,
                  );
               }
               continue;
            } else if (line === ">") {
               if (!this.chance_mapper.check_parsing) {
                  this.logger.validation_error(
                     `Block ending found without a corresponding start`,
                     this.file_line_num,
                  );
               }
               this.chance_mapper.check_parsing = false;
            } else {
               // Else it's a normal transform rule

               const continuation_regex = /(>|->|=>|>>|⇒|→|\/|!)$/;
               // If the line ends with a continuation operator, keep reading
               if (continuation_regex.test(line)) {
                  my_wrapped_rule += " " + line;
                  continue;
               }
               line = my_wrapped_rule + " " + line;
               my_wrapped_rule = "";

               const [target, result, conditions, exceptions, is_recast] =
                  this.get_transform(line);

               let t_type: "rule" | Routine | "recast" = "rule";
               if (is_recast) {
                  t_type = "recast";
               }

               this.push_transform_to_stage({
                  t_type: t_type,
                  target: target,
                  result: result,
                  conditions: conditions,
                  exceptions: exceptions,
                  chance: this.chance_mapper.get_last_chance(),
                  line_num: this.file_line_num,
               });

               continue;
            }
         }

         // WORDS
         if (my_directive === "words") {
            // Word classes

            if (this.app !== "vocabug") {
               this.logger.warn(
                  `Words directive is only valid in Vocabug`,
                  this.file_line_num,
               );
               this.disable_directive = "p";
               return;
            }
            if (!this.valid_words_brackets(line)) {
               this.logger.validation_error(
                  `Wordshapes had missmatched brackets`,
                  this.file_line_num,
               );
            }

            let parabol = get_last(this.wordshape_classes_pending);
            if (!parabol) {
               parabol = {
                  content: "",
                  optionals_weight: this.optionals_weight,
                  wordshape_distribution: this.wordshape_distribution,
                  line_num: this.file_line_num,
                  name: this.current_wordclass_name,
               };
               this.wordshape_classes_pending.push(parabol);
            }
            parabol.content += " " + line.trim();

            continue; // Added some wordshapes
         }

         // UNITS
         if (my_directive === "units") {
            if (this.app !== "vocabug") {
               this.logger.warn(
                  `Words directive is only valid in Vocabug`,
                  this.file_line_num,
               );
               this.disable_directive = "p";
               return;
            }
            const [key, field, valid] = this.get_cat_seg_fea(line, "unit");
            if (!valid) {
               this.logger.validation_error(
                  `"${line}" is not a unit declaration`,
                  this.file_line_num,
               );
            }
            if (!this.validate_unit(field)) {
               this.logger.validation_error(
                  `The unit "${key}" had separator(s) outside sets -- expected separators for units to appear only in sets`,
                  this.file_line_num,
               );
            }
            if (!this.valid_words_brackets(field)) {
               this.logger.validation_error(
                  `The unit "${key}" had missmatched brackets`,
                  this.file_line_num,
               );
            }
            this.units.set(`<${key}>`, {
               content: `${field}`,
               line_num: this.file_line_num,
            });
         }

         // SCHEMA
         if (my_directive === "schema") {
            if (this.app === "vocabug") {
               this.logger.warn(
                  `Schema directive is not valid in Vocabug`,
                  this.file_line_num,
               );
               this.disable_directive = "p";
               return;
            }

            const [type, fields, delimiters] = this.get_schema(line);
            if (type === "input") {
               if (!fields.includes("word")) {
                  this.logger.validation_error(
                     `Input schema must include a "word" field`,
                     this.file_line_num,
                  );
               }
               this.schema_input = { fields, delimiters };
            } else if (type === "output") {
               this.schema_output = { fields, delimiters };
            }
         }

         // CATEGORIES
         if (my_directive === "categories") {
            const [key, field, valid] = this.get_cat_seg_fea(line, "category");

            let effective_key = key;
            let effective_content = field;
            let effective_line_num = this.file_line_num;

            if (!valid) {
               const lastEntry = Array.from(this.category_pending.entries()).at(
                  -1,
               );

               if (lastEntry) {
                  // Oh my, it's a line wrapped category
                  const [prevKey, prev] = lastEntry;
                  effective_key = prevKey;
                  effective_content = prev.content + ", " + line.trim();
                  effective_line_num = prev.line_num; // keep original line number
               } else {
                  this.logger.validation_error(
                     `"${line}" is not a category declaration`,
                     this.file_line_num,
                  );
               }
            }
            this.category_pending.set(effective_key, {
               content: effective_content,
               line_num: effective_line_num,
            });
         }

         // FEATURES
         if (my_directive === "features") {
            const [key, field, valid] = this.get_cat_seg_fea(line, "feature");
            if (!valid) {
               this.logger.validation_error(
                  `"${line}" is not a feature declaration`,
                  this.file_line_num,
               );
            }
            const graphemes = field.split(/[,\s]+/).filter(Boolean);
            if (graphemes.length == 0) {
               this.logger.validation_error(
                  `Feature "${key}" had no graphemes`,
                  this.file_line_num,
               );
            }
            this.feature_pending.set(key, {
               content: graphemes.join(","),
               line_num: this.file_line_num,
            });
         }

         // FEATURE-FIELD
         if (my_directive === "feature-field") {
            if (my_header.length === 0) {
               const top_row = line.split(/[\s]+/).filter(Boolean);
               if (top_row.length < 2) {
                  this.logger.validation_error(
                     `Feature-field header too short`,
                     this.file_line_num,
                  );
               }
               my_header = top_row;
               continue;
            } else {
               this.parse_featurefield(line, my_header);
            }
         }

         // GRAPHEMES
         if (my_directive === "graphemes") {
            this.graphemorphs_pending += " " + line;
            continue; // Added some graphemes
         }

         // SYLLABLE-BOUNDARIES
         if (my_directive === "syllable-boundaries") {
            this.syllable_boundaries_pending += " " + line;
            continue;
         }

         // ALPHABET
         if (my_directive === "alphabet") {
            const alphabet = line.split(/[,\s]+/).filter(Boolean);
            for (let i = 0; i < alphabet.length; i++) {
               alphabet[i] = this.escape_mapper
                  .get_escaped_chars(alphabet[i])
                  .trim();
            }
            // Add alphabet items to this.alphabet
            this.alphabet.push(...alphabet);
         }

         // INVISIBLE
         if (my_directive === "invisible") {
            const invisible = line.split(/[,\s]+/).filter(Boolean);
            for (let i = 0; i < invisible.length; i++) {
               invisible[i] = this.escape_mapper
                  .get_escaped_chars(invisible[i])
                  .trim();
            }
            // Add invisible items to this.invisible
            this.invisible.push(...invisible);
         }

         // LETTER-CASE-FIELD
         if (my_directive === "letter-case-field") {
            this.parse_lettercasefield(line);
         }
      }
      // out of line loop now
      if (my_decorator != "none") {
         this.logger.validation_error(
            `Decorator "${my_decorator}" was not followed by a directive`,
            this.file_line_num,
         );
      }

      if (my_wrapped_rule.length > 0) {
         this.logger.validation_error(
            `Wrapped rule was not completed before end of file`,
            this.file_line_num,
         );
      }
   }

   push_transform_to_stage(transform: Transform_Pending) {
      // Get last stage and push the transform into it.
      // if no stage exists, create one called "default"
      let stage = get_last(this.stages_pending);
      if (!stage) {
         stage = { transforms_pending: [], name: "default" };
         this.stages_pending.push(stage);
      }
      stage.transforms_pending.push(transform);
   }

   get_cat_seg_fea(
      input: string,
      mode: "category" | "unit" | "feature",
   ): [string, string, boolean] {
      const divider = "=";

      if (input === "") {
         return ["", "", false]; // Handle invalid inputs
      }
      const divided = input.split(divider);
      if (divided.length !== 2) {
         return [input, "", false]; // Ensure division results in exactly two parts
      }
      const key = divided[0].trim();
      const field = divided[1].trim();
      if (key === "" || field === "") {
         return [input, "", false]; // Handle empty parts
      }

      // Construct dynamic regexes
      const categoryRegex = new RegExp(`^.$`);
      const unitRegex = /^[A-Za-z+$-]+$/;
      const featureRegex = /^(\+|-|>)[a-zA-Z+-]+$/;

      if (mode === "category") {
         if (categoryRegex.test(key)) {
            if (!SYNTAX_CHARS_CAT_KEY.includes(key)) {
               return [key, field, true];
            }
         }
      } else if (mode === "unit") {
         if (unitRegex.test(key)) {
            return [key, field, true];
         }
      } else if (mode === "feature") {
         if (featureRegex.test(key)) {
            return [key, field, true];
         }
      }

      return [input, "", false];
   }

   private parse_distribution(value: string): Distribution {
      if (value.toLowerCase().startsWith("g")) {
         return "gusein-zade";
      } else if (value.toLowerCase().startsWith("z")) {
         return "zipfian";
      } else if (value.toLowerCase().startsWith("s")) {
         return "shallow";
      }
      return "flat";
   }

   private validate_unit(str: string): boolean {
      let inside_square = false;
      let inside_paren = false;

      // We don't want random space or comma inside unit
      for (let i = 0; i < str.length; i++) {
         const char = str[i];

         if (char === "{") inside_square = true;
         else if (char === "}") inside_square = false;
         else if (char === "(") inside_paren = true;
         else if (char === ")") inside_paren = false;

         if (
            (char === "," || char === " ") &&
            !inside_square &&
            !inside_paren
         ) {
            return false;
         }
      }
      return true;
   }

   private parse_decorator(line: string, old_decorator: string): string {
      let new_decorator: string = "none";
      line = line.substring(1); // remove '@' sign

      // Count occurrences
      const dotCount = (line.match(/\./g) || []).length;
      const eqCount = (line.match(/=/g) || []).length;

      if (dotCount !== 1) {
         this.logger.validation_error(
            `Invalid decorator format`,
            this.file_line_num,
         );
      }
      // Split at the first "."
      const [my_directive, my_thing] = line.split(/\.(.+)/).filter(Boolean);

      if (eqCount === 1) {
         // It's a property and value
         // Split the remainder at "="
         let [my_property, my_value] = my_thing.split("=");
         my_property = my_property.trim();
         my_value = my_value.trim();

         my_value = this.escape_mapper.get_mask_stream(my_value);

         if (my_directive === "words") {
            if (my_property === "distribution") {
               this.wordshape_distribution = this.parse_distribution(my_value);
               new_decorator = "words";
            } else if (my_property === "word-class") {
               // if my value is a-z, -, +, or space, then it's a valid word class name
               const escaped_value =
                  this.escape_mapper.get_mask_stream(my_value);
               if (!/^[a-zA-Z0-9\-+ ]+$/.test(escaped_value)) {
                  this.logger.validation_error(
                     `Invalid word-class name "${escaped_value}" -- expected a-z, A-Z, 0-9, -, +, or space`,
                     this.file_line_num,
                  );
               }
               this.current_wordclass_name = escaped_value;
               new_decorator = "words";
            } else if (my_property === "optionals-weight") {
               let escaped_value = this.escape_mapper.get_mask_stream(my_value);
               if (!my_value.endsWith("%")) {
                  this.logger.validation_error(
                     `Invalid optionals-weight "${escaped_value}" -- expected a percentage value ending with "%"`,
                     this.file_line_num,
                  );
               }
               escaped_value = escaped_value.slice(0, -1).trim(); // Remove '%' sign
               const optionals_weight = make_percentage(my_value);
               if (optionals_weight == null) {
                  this.logger.validation_error(
                     `Invalid optionals-weight "${my_value}" -- expected a number between 1 and 100`,
                     this.file_line_num,
                  );
               }
               this.optionals_weight = optionals_weight;
               new_decorator = "words";
            }
         } else if (my_directive === "categories") {
            if (my_property === "distribution") {
               this.category_distribution = this.parse_distribution(my_value);
               new_decorator = "categories";
            }
         } else if (my_directive === "stage") {
            if (my_property === "name") {
               this.current_stage_name = my_value;
               new_decorator = "stage";
            }
         }
      } else {
         // It's a boolean flag
         if (my_thing === "disabled") {
            new_decorator = my_directive;
            this.disable_directive = "p";
         }
      }

      // Errors
      if (new_decorator === "none") {
         this.logger.validation_error(`Invalid decorator`, this.file_line_num);
      } else if (old_decorator !== "none" && old_decorator !== new_decorator) {
         this.logger.validation_error(
            `Decorator mismatch -- expected "${old_decorator}" decorator after "${old_decorator}" decorator`,
            this.file_line_num,
         );
      }
      return new_decorator;
   }

   private parse_directive(line: string, current_decorator: string): string {
      let temp_directive: string = "none";

      for (const d of Directive_List) {
         if (`${d}:` === line) {
            temp_directive = d;
         }
      }

      if (temp_directive === "none") {
         return "none"; // Not a directive change
      }

      // Errors
      if (current_decorator != "none" && temp_directive != current_decorator) {
         this.logger.validation_error(
            `Directive mismatch -- expected "${current_decorator}" directive after "${current_decorator}" decorator`,
            this.file_line_num,
         );
      }
      return temp_directive;
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

   private parse_clusterfield(
      line: string,
      my_header: string[],
      my_transforms: Transform_Pending[],
   ): Transform_Pending[] {
      // This is called on each line of a clusterfield,
      // not including the header or footer. The footer is the > character
      if (my_transforms.length === 0) {
         this.logger.validation_error(
            `Clusterfield transform not started properly`,
            this.file_line_num,
         );
      }
      const my_transform = my_transforms[0];

      /// -------------

      //        my_header
      // my_key my_row

      // my_transform

      const my_row = line.split(/[\s]+/).filter(Boolean);
      const my_key = my_row.shift();

      if (my_row.length !== my_header.length || my_key === undefined) {
         this.logger.validation_error(
            `Cluster-field row length mismatch with header length -- expected row length of ${my_header.length} but got length of ${my_row.length}`,
            this.file_line_num,
         );
      }

      const my_target: string[] = [];
      const my_result: string[] = [];

      for (let i = 0; i < my_header.length; ++i) {
         if (my_row[i] === "+") {
            continue;
         } else {
            my_target.push(my_key + my_header[i]);
            my_result.push(my_row[i]);
         }
      }

      // Only append if this row actually produced something
      if (my_result.length !== 0) {
         if (my_transform.target.length > 0) my_transform.target += ", ";
         if (my_transform.result.length > 0) my_transform.result += ", ";

         my_transform.target += my_target.join(", ");
         my_transform.result += my_result.join(", ");
      }

      return [my_transform];
   }

   private parse_routine(line: string): Routine {
      // Count occurrences
      const eqCount = (line.match(/=/g) || []).length;
      if (eqCount !== 1) {
         this.logger.validation_error(
            `Invalid routine format "${line}"`,
            this.file_line_num,
         );
      }

      // Split at "="
      let [, right] = line.split("=");
      right = right.trim();

      const gtCount = (right.match(/>/g) || []).length;
      if (gtCount !== 1) {
         this.logger.validation_error(
            `Invalid routine format "${line}"`,
            this.file_line_num,
         );
      }

      // Split at ">"
      let [routine] = right.split(">");
      routine = routine.trim();

      routine = routine.replace(/\bcapitalize\b/g, "capitalise");
      routine = routine.replace(/\bdecapitalize\b/g, "decapitalise");
      routine = routine.replace(/\blatin-to-hangeul\b/g, "latin-to-hangul");

      switch (routine) {
         case "reverse":
         case "compose":
         case "decompose":
         case "capitalise":
         case "decapitalise":
         case "to-uppercase":
         case "to-lowercase":
         case "latin-to-hangul":
         case "hangul-to-latin":
         case "greek-to-latin":
         case "latin-to-greek":
         case "cyrillic-to-latin":
         case "latin-to-cyrillic":
         case "xsampa-to-ipa":
         case "ipa-to-xsampa":
            return routine as Routine;
      }
      this.logger.validation_error(
         `Invalid routine "${routine}"`,
         this.file_line_num,
      );
   }

   // TRANSFORMS !!!

   // This is run on parsing file. We then have to run resolve_transforms after parse file
   private get_transform(
      input: string,
   ): [string, string, string[], string[], boolean] {
      if (input === "") {
         this.logger.validation_error(`No input`, this.file_line_num);
      }

      const is_recast = input.includes("<recast-as>");

      input = input.replace(/\/\//g, "!"); // Replace '//' with '!'
      const divided = is_recast
         ? input.split("<recast-as>")
         : input.split(/>|>>|->|→|=>|⇒/);

      if (divided.length === 1) {
         this.logger.validation_error(
            `No arrows in transform`,
            this.file_line_num,
         );
      }
      if (divided.length !== 2) {
         this.logger.validation_error(
            `Too many arrows in transform`,
            this.file_line_num,
         );
      }

      const target = divided[0].trim();
      if (target === "") {
         this.logger.validation_error(
            `Target is empty in transform`,
            this.file_line_num,
         );
      }
      if (!this.valid_transform_brackets(target)) {
         this.logger.validation_error(
            `Target had missmatched brackets`,
            this.file_line_num,
         );
      }

      const slash_index = divided[1].indexOf("/");
      const bang_index = divided[1].indexOf("!");

      const delimiter_index = Math.min(
         slash_index === -1 ? Infinity : slash_index,
         bang_index === -1 ? Infinity : bang_index,
      );

      const result =
         delimiter_index === Infinity
            ? divided[1].trim()
            : divided[1].slice(0, delimiter_index).trim();

      if (result == "") {
         this.logger.validation_error(
            `Result is empty in transform`,
            this.file_line_num,
         );
      }
      if (!this.valid_transform_brackets(result)) {
         this.logger.validation_error(
            `Result had missmatched brackets`,
            this.file_line_num,
         );
      }

      const environment =
         delimiter_index === Infinity
            ? ""
            : divided[1].slice(delimiter_index).trim();

      const { conditions, exceptions } = this.get_environment(environment);

      return [target, result, conditions, exceptions, is_recast];
   }

   private get_schema(input: string): ["input" | "output", string[], string[]] {
      const divider = "=";

      if (input === "") {
         this.logger.validation_error(
            `Schema declaration cannot be empty`,
            this.file_line_num,
         );
      }

      const divided = input.split(divider);
      if (divided.length !== 2) {
         this.logger.validation_error(
            `Schema declaration was invalid`,
            this.file_line_num,
         );
      }

      const key = divided[0].trim();
      if (key !== "input" && key !== "output") {
         this.logger.validation_error(
            `Schema declaration was not for "input" or "output"`,
            this.file_line_num,
         );
      }

      const pattern = divided[1].trim();

      const fields: string[] = [];
      const delimiters: string[] = [];

      let i = 0;
      const n = pattern.length;

      // if pattern starts with <field>, first delimiter is ""
      if (pattern.startsWith("<")) {
         delimiters.push("");
      }

      while (i < n) {
         const ch = pattern[i];

         if (ch === "<") {
            const start = i + 1;
            let end = start;

            while (end < n && pattern[end] !== ">") end++;
            if (end >= n) {
               this.logger.validation_error(
                  "Unterminated field",
                  this.file_line_num,
               );
            }

            const name = pattern.slice(start, end);
            fields.push(name);

            i = end + 1;
            continue;
         }

         const start = i;
         while (i < n && pattern[i] !== "<") {
            i++;
         }

         const d = pattern.slice(start, i);
         delimiters.push(d);
      }

      // FINAL FIX: ensure trailing empty delimiter exists
      if (delimiters.length < fields.length + 1) {
         delimiters.push("");
      }

      for (let i = 0; i < delimiters.length; i++) {
         delimiters[i] = this.escape_mapper.get_escaped_chars(delimiters[i]);
      }
      for (let i = 0; i < fields.length; i++) {
         fields[i] = this.escape_mapper.get_escaped_chars(fields[i]);
      }

      return [key as "input" | "output", fields, delimiters];
   }

   private get_environment(environment_string: string): {
      conditions: string[];
      exceptions: string[];
   } {
      const conditions: string[] = [];
      const exceptions: string[] = [];

      let buffer = "";
      let mode: "condition" | "exception" = "condition";

      for (let i = 0; i < environment_string.length; i++) {
         const ch = environment_string[i];

         if (ch === "/") {
            if (buffer.trim()) {
               const validated = this.validate_environment(buffer.trim(), mode);
               (mode === "condition" ? conditions : exceptions).push(validated);
            }
            buffer = "";
            mode = "condition";
         } else if (ch === "!") {
            if (buffer.trim()) {
               const validated = this.validate_environment(buffer.trim(), mode);
               (mode === "condition" ? conditions : exceptions).push(validated);
            }
            buffer = "";
            mode = "exception";
         } else {
            buffer += ch;
         }
      }

      if (buffer.trim()) {
         const unit = buffer.trim();

         const validated = this.validate_environment(unit, mode);
         (mode === "condition" ? conditions : exceptions).push(validated);
      }

      return {
         conditions: conditions,
         exceptions: exceptions,
      };
   }

   private validate_environment(
      unit: string,
      kind: "condition" | "exception",
   ): string {
      const parts = unit.split("_");
      if (parts.length !== 2) {
         this.logger.validation_error(
            `${kind} "${unit}" must contain exactly one underscore`,
            this.file_line_num,
         );
      }

      const [before, after] = parts;
      if (!before && !after) {
         this.logger.validation_error(
            `${kind} "${unit}" must have content on at least one side of "_"`,
            this.file_line_num,
         );
      }

      return `${before}_${after}`;
   }

   private parse_featurefield(line: string, top_row: string[]) {
      const my_row = line.split(/[\s]+/).filter(Boolean);
      const my_key = my_row.shift();
      if (my_row.length !== top_row.length || my_key === undefined) {
         this.logger.validation_error(
            `Feature-field row length mismatch with header length -- expected row length of ${top_row.length} but got length of ${my_row.length}`,
            this.file_line_num,
         );
      }

      const keyRegex = /^[a-zA-Z+-]+$/;
      if (!keyRegex.test(my_key)) {
         this.logger.validation_error(
            `A feature in a feature-field must be of lowercase letters only.`,
            this.file_line_num,
         );
      }

      const my_pro_graphemes: string[] = [];
      const my_anti_graphemes: string[] = [];
      const row_length = top_row.length;

      for (let i = 0; i < row_length; ++i) {
         if (my_row[i] === ".") {
            continue;
         } else if (my_row[i] === "+") {
            my_pro_graphemes.push(top_row[i]);
         } else if (my_row[i] === "-") {
            my_anti_graphemes.push(top_row[i]);
         } else {
            this.logger.validation_error(
               `Feature-field values must be either "+", "-", or "." -- found "${my_row[i]}" instead.`,
               this.file_line_num,
            );
         }
      }
      if (my_pro_graphemes.length > 0) {
         this.feature_pending.set(`+${my_key}`, {
            content: my_pro_graphemes.join(","),
            line_num: this.file_line_num,
         });
      }
      if (my_anti_graphemes.length > 0) {
         this.feature_pending.set(`-${my_key}`, {
            content: my_anti_graphemes.join(","),
            line_num: this.file_line_num,
         });
      }
   }

   private parse_lettercasefield(line: string): void {
      const my_row = line.split(/[\s]+/).filter(Boolean);
      if (my_row.length < 2) {
         this.logger.validation_error(
            `Letter-case-field row too short`,
            this.file_line_num,
         );
      }
      const my_key = my_row.shift();
      for (let i = 0; i < my_row.length; i++) {
         my_row[i] = this.escape_mapper.get_escaped_chars(my_row[i]);
      }

      if (my_key === "uppercase") {
         this.lettercase_mapper.custom_uppercase_row = my_row;
      } else if (my_key === "lowercase") {
         this.lettercase_mapper.custom_lowercase_row = my_row;
      } else {
         this.logger.validation_error(
            `Invalid row key "${my_key}" in letter-case-field -- expected "uppercase" or "lowercase"`,
            this.file_line_num,
         );
      }

      const lower = this.lettercase_mapper.custom_lowercase_row;
      const upper = this.lettercase_mapper.custom_uppercase_row;

      if (lower.length > 0 && upper.length > 0) {
         if (lower.length !== upper.length) {
            this.logger.validation_error(
               `Letter-case-field row length mismatch -- expected both rows to have the same length but got lowercase row length of ${lower.length} and uppercase row length of ${upper.length}`,
               this.file_line_num,
            );
         } else if (lower.length === upper.length) {
            // Okay, we have both rows and they are the same length. Let's create the mapping
            const my_map = new Map<string, string>(
               lower.map((k, i): [string, string] => [k, upper[i]]),
            );
            this.lettercase_mapper.create_map(my_map);
         }
      }
   }

   private valid_transform_brackets(str: string): boolean {
      const stack: string[] = [];
      const bracket_pairs: Record<string, string> = {
         ")": "(",
         "}": "{",
         "]": "[",
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
}

export default Parser;
