const latin_to_greek_code_map: Record<string, string> = {
   oh: "ω",
   óh: "ώ",
   òh: "ὼ",
   eh: "η",
   éh: "ή",
   èh: "ὴ",
   a: "α",
   á: "ά",
   à: "ὰ",
   e: "ε",
   é: "έ",
   è: "ὲ",
   i: "ι",
   í: "ί",
   ì: "ὶ",
   o: "ο",
   ó: "ό",
   ò: "ὸ",
   u: "υ",
   ú: "ύ",
   ù: "ὺ",
   b: "β",
   d: "δ",
   f: "φ",
   g: "γ",
   k: "κ",
   l: "λ",
   m: "μ",
   n: "ν",
   p: "π",
   r: "ρ",
   s: "σ",
   t: "τ",
   x: "χ",
   z: "ζ",

   ch: "ͷ",
   c: "ϛ",
   q: "ξ",
   th: "θ",
   ph: "ψ",
   sh: "ϸ",
   w: "ϝ",
   j: "ϳ",
};

// Build inverse map automatically
const greek_to_latin_code_map: Record<string, string> = Object.fromEntries(
   Object.entries(latin_to_greek_code_map).map(([latin, greek]) => [
      greek,
      latin,
   ]),
);

export function latin_to_greek(input: string): string {
   let out = "";
   for (const char of input) {
      out += latin_to_greek_code_map[char] ?? char;
   }
   return out;
}

export function greek_to_latin(input: string): string {
   let out = "";
   for (const char of input) {
      out += greek_to_latin_code_map[char] ?? char;
   }
   return out;
}
