# Nesca API

Install with `npm install the-conlangers-suite`, or `yarn add the-conlangers-suite` and import it with either:

```ts
import { nesca } from 'the-conlangers-suite'; // ES modules

const { nesca } = require('the-conlangers-suite'); // CommonJS (Node.js)
```

Below is a minimal use of the program:
```ts
import { nesca } from 'the-conlangers-suite';
const file_text = ...
const def = nesca({
    file: file_text,
    input_words: ["nesca", "doctor", "a"],
    output_divider: ", "
});

console.log(def.payload);
console.log(def.warnings.join(", "));
console.log(def.errors.join(", "));
console.log(def.infos.join(", "));
```

If `input_words` is parsed as an array, `input_divider` is ignored. If `input_words` is parsed as a string, it is split into an array by `input_divider`.

The input signature for `nesca()` is:
```ts
type Nesca_Options = {
   file: string;
   input_words: string | string[];
   output_mode?: Output_Mode;
   sort_words?: boolean;
   input_divider?: string;
   output_divider?: string;
};
```

The properties of the return of `nesca()` are:
```ts
type Nesca_Output = {
    payload: string; // The generated corpus of words.
    errors: string[]; // A list of errors that occurred, that terminated generation.
    warnings: string[]; // A list of warnings that occurred.
    infos: string[]; // Useful information about the generation run.
    diagnostics: string[]; // Useful information about parsing the file on debug mode.
}
```