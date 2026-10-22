# Vocabug API

Install with `npm install the-conlangers-suite`, or `yarn add the-conlangers-suite` and import it with either:

```ts
import { vocabug } from 'the-conlangers-suite'; // ES modules

const { vocabug } = require('the-conlangers-suite'); // CommonJS (Node.js)
```

Below is a minimal use of the program:
```ts
import { vocabug } from 'the-conlangers-suite';
const file_text = ...
const def = vocabug({
    file: file_text
});

console.log(def.payload);
console.log(def.warnings.join(", "));
console.log(def.errors.join(", "));
console.log(def.infos.join(", "));
```

The input signature for `vocabug()` is:
```ts
type Vocabug_Options = {
    file: string; // Your definition file
    num_of_words?: number | string = 100; // Number of words to generate. Must be in range 1 to 100,000
    output_mode?: 'word-list'|'debug'|'paragraph' = "word-list";
    remove_duplicates?: boolean = true; // Remove duplicate words
    force_word_limit?: boolean = false;
    sort_words?: boolean = true; // Sort generated words alphabetically.
    output_divider?: string = " "; // Divider or "delimeter" between words
    wordclass_choices?: string[] = []; // A list of word-classes to choose from. If empty, all word-classes are used.
};
```

The properties of the return of `vocabug()` are:
```ts
type Vocabug_Output = {
    payload: string; // The generated corpus of words.
    errors: string[]; // A list of errors that occurred, that terminated generation.
    warnings: string[]; // A list of warnings that occurred.
    infos: string[]; // Useful information about the generation run.
    diagnostics: string[]; // Useful information about parsing the file on debug mode.
}
```