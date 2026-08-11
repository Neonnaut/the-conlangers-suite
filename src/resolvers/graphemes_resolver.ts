import type Escape_Mapper from "../escape_mapper";
import Logger from "../logger";
import type { Associateme_Mapper } from "../utils/types";

class Graphemes_Resolver {
   private logger: Logger;
   private escape_mapper: Escape_Mapper;

   private graphemorphs_pending: string;
   graphemorphs: string[];

   private syllable_boundaries_pending: string;
   syllable_boundaries: string[];

   associateme_mapper: Associateme_Mapper;

   constructor(
      logger: Logger,
      escape_mapper: Escape_Mapper,
      graphemorphs_pending: string,
      syllable_boundaries_pending: string,
   ) {
      this.logger = logger;
      this.escape_mapper = escape_mapper;

      this.graphemorphs_pending = graphemorphs_pending;
      this.graphemorphs = [];

      this.syllable_boundaries_pending = syllable_boundaries_pending;
      this.syllable_boundaries = [];

      this.associateme_mapper = [];

      this.resolve_graphemorphs();
      this.resolve_syllable_boundaries();
      this.resolve_associatemes();
   }

   resolve_graphemorphs() {
      const new_graphemorphs = this.graphemorphs_pending.replace(
         /(<\{|\})/g,
         ",",
      );

      const graphemorphs = new_graphemorphs.split(/[,\s]+/).filter(Boolean);
      for (let i: number = 0; i < graphemorphs.length; i++) {
         graphemorphs[i] = this.escape_mapper.get_escaped_chars(
            graphemorphs[i],
         );
      }
      this.graphemorphs = Array.from(new Set(graphemorphs));
   }

   resolve_syllable_boundaries() {
      const sy_bs = this.syllable_boundaries_pending
         .split(/[,\s]+/)
         .filter(Boolean);
      for (let i = 0; i < sy_bs.length; i++) {
         sy_bs[i] = this.escape_mapper.get_escaped_chars(sy_bs[i]).trim();

         if (sy_bs[i].length > 1) {
            this.graphemorphs.push(sy_bs[i]);
         }
      }
      this.syllable_boundaries = Array.from(new Set(sy_bs));
   }

   resolve_associatemes() {
      const mapper: Associateme_Mapper = [];
      const input = this.graphemorphs_pending ?? "";

      // Match sequences like {a,i,u}<{á,í,ú}<{à,ì,ù}
      const setRegex = /\{[^}]+\}(?:\s*<\s*\{[^}]+\})*/g;

      // Gather all matched chains with ranges
      const matches = [...input.matchAll(setRegex)];

      // 1) Detect stray "<" not belonging to a valid chain
      let scrubbed = input;
      for (const m of matches) {
         scrubbed = scrubbed.replace(m[0], "");
      }
      if (scrubbed.includes("<")) {
         this.logger.validation_error(
            `Stray "<" found outside of a valid associateme entry`,
         );
      }

      // 2) Parse and validate each chain
      for (const m of matches) {
         const segment = m[0];

         // Split into groups by comma or whitespace
         const groups = segment.split("<").map((g) =>
            g
               .replace(/[{}]/g, "")
               .trim()
               .split(/[,\s]+/) // <-- key change
               .map((x) => x.trim())
               .map((x) => this.escape_mapper.get_escaped_chars(x.trim())) // <-- restore
               .filter((x) => x.length > 0),
         );

         if (groups.length === 0) {
            this.logger.validation_error(
               `A base associateme was empty in the graphemes directive`,
            );
         }

         const bases = groups[0];
         if (bases.length === 0) {
            this.logger.validation_error(
               `A base associateme was empty in the graphemes directive`,
            );
         }

         const expected_len = bases.length;
         for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            if (g.length !== expected_len) {
               const label = i === 0 ? "bases" : `variant ${i}`;
               this.logger.validation_error(
                  `Mismatched associateme entry variant group length in "${segment}": ${label} had a length of ${g.length} -- expected length of ${expected_len}`,
               );
            }
         }

         const variants = [...groups];
         mapper.push({ bases, variants });
      }

      this.associateme_mapper = mapper;
   }
}

export default Graphemes_Resolver;
