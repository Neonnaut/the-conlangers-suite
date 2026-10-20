# Nesca CLI

## 📦 Installation

Install globally via npm or yarn:

```bash
npm install -g the-conlangers-suite
# or
yarn global add the-conlangers-suite
```

## Usage

The general syntax of the CLI is:
```
nesca <path> --iw <input_words> [options...]
```

- `<path>`.
The required path to the definition file, typically a text file.

- `--input_words` or `--iw` and `<string>`.
Input words to transform

### Options:

- `--help` or `-?`.
Show help

- `--version` or `-v`.
Show version number

- `--output_mode` or `-m` and `<mode>`.
Output mode. `<mode>` must be `word-list`, `old-to-new`, `debug`, `old-to-new` or `paragraph`. Default is `word-list`

- `--sort_words` or `-s`.
Sort generated words alphabetically. Default is true

- `--input_divider` or `--id` and `<string>`.
Input divider between words

- `--output_divider` or `--od` and `<string>`.
Divider or "delimeter" between words. Default is a space

- `--encoding` or `-e` and  `<encoding>`.
File encoding to use. `<encoding>` must be `ascii`, `binary`, `latin1`, `ucs-2`, `ucs2`, `utf8`, `utf-8`, `utf16le`, `utf-16le` -- default is `utf8`