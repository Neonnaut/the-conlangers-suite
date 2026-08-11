//import Logger from './logger';
import Word from "../word";
import Escape_Mapper from "../escape_mapper";
import Supra_Builder from "./supra_builder";
import {
   weighted_random_pick,
   weighted_random_pick_and_id,
   supra_weighted_random_pick,
   get_distribution,
} from "../utils/picker_utilities";
import type { Output_Mode, Distribution } from "../utils/types";

class Word_Builder {
   private escape_mapper: Escape_Mapper;
   private supra_builder: Supra_Builder;
   private categories: Map<string, { graphemes: string[]; weights: number[] }>;
   private category_distribution: string;

   private wordshape_classes: {
      name: string | null;
      wordshapes: { items: string[]; masks: string[]; weights: number[] };
      optionals_weight: number;
      wordshape_distribution: string;
      line_num: number;
   }[];

   private cwc_index: number = 0;

   constructor(
      escape_mapper: Escape_Mapper,
      supra_builder: Supra_Builder,
      categories: Map<string, { graphemes: string[]; weights: number[] }>,
      category_distribution: string,
      wordshape_classes: {
         name: string | null;
         wordshapes: { items: string[]; masks: string[]; weights: number[] };
         optionals_weight: number;
         wordshape_distribution: Distribution;
         line_num: number;
      }[],
      output_mode: Output_Mode,
   ) {
      this.escape_mapper = escape_mapper;
      this.supra_builder = supra_builder;
      this.categories = categories;
      this.category_distribution = category_distribution;

      this.wordshape_classes = wordshape_classes;
      this.cwc_index = 0;

      Word.output_mode = output_mode;
   }

   next_wordshape_class(): void {
      this.cwc_index++;
      if (this.cwc_index >= this.wordshape_classes.length) {
         this.cwc_index = 0;
      }
   }
   get_wordshape_class_length(): number {
      return this.wordshape_classes.length;
   }
   get_current_wordshape_class_name(): string | null {
      return this.wordshape_classes[this.cwc_index].name;
   }

   make_word(): Word {
      // Stage one looks like `CV(@, !)CVF{@, !}`
      const [stage_one, wordshape_id] = weighted_random_pick_and_id(
         this.wordshape_classes[this.cwc_index].wordshapes.items,
         this.wordshape_classes[this.cwc_index].wordshapes.weights,
      );

      let mask: string =
         this.wordshape_classes[this.cwc_index].wordshapes.masks[wordshape_id];
      mask = this.escape_mapper.get_mask_stream(mask);

      // Stage two looks like `CVCVF!`
      const stage_two: string = this.resolve_wordshape_sets(
         stage_one,
         this.category_distribution,
         this.wordshape_classes[this.cwc_index].optionals_weight,
      );

      // Stage three, resolved supra-set
      let stage_three = stage_two;
      if (this.supra_builder.id_counter != 1) {
         // Is 1 if no supra-set
         const [ids, weights] =
            this.supra_builder.extract_content_and_weights(stage_two);
         const chosen_id = supra_weighted_random_pick(ids, weights);
         stage_three = this.supra_builder.replace_letter_and_clean(
            stage_two,
            Number(chosen_id),
         );
      }

      // Stage four looks like `tacan!`. ready to be transformed and added to text
      let stage_four: string = "";
      for (let i = 0; i < stage_three.length; i++) {
         // going through each char of stage three,
         // if it's a category like C, V, F, replace it with
         // a weighted random pick from that category's graphemes
         let new_char: string = stage_three[i];

         for (const [category_key, category_field] of this.categories) {
            //going through C = [[a, b, c], [1, 2, 3]]
            if (category_key == new_char) {
               new_char = weighted_random_pick(
                  category_field.graphemes,
                  category_field.weights,
               );
               break;
            }
         }
         stage_four += new_char;
      }

      // Stage five, remove caret from word
      let stage_five = stage_four.replace(/\^/g, "");

      if (this.escape_mapper.counter != 0) {
         stage_five = this.escape_mapper.get_escaped_chars(stage_five);
      }

      return new Word(mask, { word: stage_five });
   }

   resolve_wordshape_sets(
      input_list: string,
      distribution: string,
      optionals_weight: number, // percentage chance to include optionals (0–100)
   ): string {
      const curly_pattern = /\{[^{}]*\}/g;
      const round_pattern = /\([^()]*\)/g;
      let matches: RegExpMatchArray | null;

      let items: string[] = [];
      let outputs: [string[], number[]];

      // console.log(`Starting with input: "${input_list}"`);

      // Resolve optional sets in round brackets based on weight
      while ((matches = input_list.match(round_pattern)) !== null) {
         const group = matches[matches.length - 1]; // "(a, b, c|10%)"
         const inner = group.slice(1, -1); // "a, b, c|10%"

         // --- 1. Detect trailing optional weight -------------------------
         let local_weight = optionals_weight; // default global weight
         let cleaned_inner = inner;

         const weight_match = inner.match(/\|\s*(\d+)%\s*$/);
         if (weight_match) {
            local_weight = Number(weight_match[1]); // override with local weight
            cleaned_inner = inner.replace(/\|\s*\d+%\s*$/, "");
         }

         // --- 2. Extract candidates --------------------------------------
         const candidates = cleaned_inner.split(/[,\s]+/).filter(Boolean);

         // --- 3. Roll optionality ----------------------------------------
         const include = Math.random() * 100 < local_weight;

         if (include && candidates.length > 0) {
            const uses_explicit_weights = candidates.some((c) =>
               c.includes("*"),
            );
            const dist_type = uses_explicit_weights ? "flat" : distribution;

            outputs = this.extract_value_and_weight(candidates, dist_type);
            const selected = weighted_random_pick(outputs[0], outputs[1]);

            input_list = input_list.replace(group, selected);
         } else {
            input_list = input_list.replace(group, "");
         }
      }

      // Resolve nested sets in square brackets
      while ((matches = input_list.match(curly_pattern)) !== null) {
         const most_nested = matches[matches.length - 1];
         items = most_nested
            .slice(1, -1)
            .split(/[,\s]+/)
            .filter(Boolean);

         // console.log(`Resolving nested set: [${items.join(", ")}]`);

         if (items.length === 0) {
            items = ["^"];
            // console.log(`Empty set, defaulting to '^'`);
         } else {
            const uses_explicit_weights = items.some((c) => c.includes("*"));
            const dist_type = uses_explicit_weights ? "flat" : distribution;
            // console.log(`Resolving with distribution: ${dist_type}`);

            outputs = this.extract_value_and_weight(items, dist_type);
            const picked = weighted_random_pick(outputs[0], outputs[1]);
            // console.log(`Selected from nested: ${picked}`);
            items = [picked];
         }

         input_list = input_list.replace(most_nested, items[0]);
         // console.log(`Updated input: "${input_list}"`);
      }

      // Final resolution
      const final_pick = input_list;
      // console.log(`Final token: ${final_pick}`);

      return final_pick;
   }

   extract_value_and_weight(
      input_list: string[],
      default_distribution: string,
   ): [string[], number[]] {
      let my_values: string[] = [];
      let my_weights: number[] = [];

      // Check if all items lack a weight (i.e., none contain "*")
      const all_default_weights = input_list.every(
         (item) => !item.includes("*"),
      );

      if (all_default_weights) {
         my_values = input_list;
         my_weights = get_distribution(input_list.length, default_distribution);
         return [my_values, my_weights];
      }

      input_list.forEach((item) => {
         const [value, weight_str] = item.split("*");
         const weight =
            weight_str && !isNaN(Number(weight_str))
               ? parseFloat(weight_str)
               : 1;
         my_values.push(value);
         my_weights.push(weight);
      });

      return [my_values, my_weights];
   }
}

export default Word_Builder;
