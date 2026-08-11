# The Conlanger's Suite

[![version][1]][2] [![license][3]][4] [![Tests]][badge-link]
[![issue count][5]][6] [![git activity][7]][8]

A suite of applications for conlangers built with typescript and the wonderful Vite tool. Each application has its own web-app, CLI, and main function in the API. This allows applications to share modules between themselves to accomplish their tasks.

## Vocabug

![Vocabug logo](./app/vocabug/img/vocabug_logo.svg?raw=true "Vocabug")

Vocabug is a word generator designed to be a successor to the Williams' [Lexifer](https://github.com/bbrk24/lexifer-ts) and to [Awkwords](https://github.com/nai888/awkwords).

Vocabug randomly generates vocabulary from a given definition of graphemes, frequencies and word patterns. You can use it to make words for a constructed language, to get an original nickname or password, or just for fun.

### Major features

- **Character escape**: You can escape any syntax character, and there are named escapes as well for inserting diacritics.

- **Sets**: There are two kinds of sets used when creating words. **Pick‑one** set chooses exactly one option from the set. **Optional** set gives Vocabug a default 10% chance of selecting an option from that set.

- **Supra-set**: Suppose you have a suprasegmental feature, like stress, that appears only once per word but in several possible positions. Supra‑set lets you define all allowable stress positions _within a single_ word‑shape, and you can even assign weights to those positions.

- **An advanced weighting system**: The ordering of items matters for categories, units and word-shapes. The first item will be chosen the most often, the second item the second most often, and so on. You can change the default distributions to be flat, Zipfian, Gusein-Zade, or your own distribution through weights.

- **Control of word forms**: You can control the forms of generated words through the use of transformation rules.

### Vocabug online

Vocabug lives online at [neonnaut.neocities.org/vocabug](https://neonnaut.neocities.org/vocabug)

### Vocabug Documentation

Documentation (also called "help", "instructions" or "manual") lives online at [neonnaut.neocities.org/vocabug_docs](https://neonnaut.neocities.org/vocabug_docs)

### Vocabug API

[Read the API doc here](./docs/vocabug_api.md)

### Vocabug CLI

[Read the CLI (command-line-interface) doc here](./docs/vocabug_cli.md)

## Nesca

![Nesca logo](./app/nesca/img/nesca.svg?raw=true "Nesca")

Nesca, a "sound change applier", applies transformation rules to words to change them. It can be used for historical or fictional sound changes, to spell words differently, or to convert words to other alphabets. Nesca is an easy to use but powerful tool for conlangers and linguists.

### Major features

- **Schema directive**: Instead of giving Nesca a list of plain input words, you can attach custom fields, such as "gloss" or "word class" alongside the required "word" field. Only the "word" field undergoes transformations.

- **Features**: Define feature‑based categories (e.g., [+nasal], [−voice], [+labial]) and use them to build rules.

- **Metathesis**: Swaps the first and last grapheme of a selection of a word.

- **Reference**: You can capture a grapheme or stream of graphemes to be reproduced elsewhere.

- **Routines**: Routines do jobs such as: composing base characters with floating diacritics; capitalisation; converting to and from X-SAMPA and IPA, Latin and Greek, and Latin and Hangul.

- **Chance block**: Indicates a chance that the rules inside the block will occur or not. This is useful for sporadic sound change.

### Nesca online

Nesca lives online at [neonnaut.neocities.org/nesca](https://neonnaut.neocities.org/nesca)

### Nesca Documentation

Documentation lives online at [neonnaut.neocities.org/nesca_docs](neonnaut.neocities.org/nesca_docs)

### Nesca API

[Read the API doc here](./docs/nesca_api.md)

### Nesca CLI

[Read the CLI (command-line-interface) doc here](./docs/nesca_cli.md)

## Development

To build use `npm run build`. For live testing use `npm run dev-vocabug` or `npm run dev-nesca`.

[1]: https://img.shields.io/npm/v/the-conlangers-suite
[2]: https://www.npmjs.com/package/the-conlangers-suite "npm package"
[3]: https://img.shields.io/npm/l/the-conlangers-suite
[4]: https://github.com/Neonnaut/the-conlangers-suite/blob/master/LICENSE "license text"
[5]: https://img.shields.io/github/issues-raw/Neonnaut/the-conlangers-suite
[6]: https://github.com/Neonnaut/the-conlangers-suite/issues "issues page"
[7]: https://img.shields.io/github/commit-activity/m/Neonnaut/the-conlangers-suite
[8]: https://github.com/Neonnaut/the-conlangers-suite/commits "commit log"

[badge-link]: https://github.com/Neonnaut/the-conlangers-suite/actions/workflows/ci.yml
[Tests]: https://github.com/Neonnaut/the-conlangers-suite/actions/workflows/ci.yml/badge.svg



