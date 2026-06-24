# CHANGELOG

## [1.0.1] - 2025-DEC-17

### Added
- Created changelog
- Added 'greek-to-latin', 'latin-to-greek' and 'hangul-to-latin' 'routines'
- Docs for the above 'routines'
- Added 'syllable-boundary' directive and docs

### Modified
- The hangul "eu" graph's romanisation for the 'routine' is now now <ụ> instead of <ù>
- Renamed "roman-to-hangul" to "latin-to-hangul"
- Fixed an oversight with the 'anythings-mark' not splitting correctly on "|"
- Moved the "number of words" textbox into the config section
- Docs examples now have 'graphemes' inside "<" and ">" instead of "[" and "]"
- CLI works now

## [1.0.2] - 2025-DEC-23

### Added
- Download words button in web app

### Modified
- Features and categories parsing improvement
- conditions and exceptions parsing improvement
- updated docs to reflect this
- updated examples to reflect this

## [1.0.3] - 2026-JAN-27

### Added
- Disable any directive
- Rule line wrapping
- Letter-case field
- Added Nesca - sound change applier

### Modified
- Fixed https://github.com/Neonnaut/vocabug-ts/issues/1#issue-3821895482
- When debug mode was on, there would be a newline at the end of the word list. Now that is not the case.
- Changed this repository to "The Conlangers Suite"

## [1.0.4] - 2026-JAN-27

### Modified
- Finished writing docs
- Finished renaming the package

## [1.0.5] - 2026-JAN-30

### Added
- Chance block
- Naming stages

## [1.0.6] - 2026-FEB-06

### Modified
- The anythings mark blocked by was not parsing properly
- Readme had the wrong URLs to the CLI and API docs

### Added
- Schema directive for Nesca

## [1.0.7] - 2026-FEB-25

### Modified

- Better error message when clusterfield header is empty
- Character escape no longer uses PUA, private use area.
- In the docs, I described the feature system as "non-carryover", I have since learnt that the correct term is "fully-specified" -- "non-inheriting"
- The API was not set up right. Now it is.
- The Vocabug CLI was not printing out the generated words. Now it does.
- Renamed 'geminate-mark' back to 'ditto-mark' in the docs
- Removed section about "kleene-stars" in the docs

## [1.0.8] - 2026-JUN-01

### Modified

- Using the units or words directive with Nesca gives a warning instead of an error, and disables the directive. Using the schema directive with Vocabug gives a warning and disables the directive.
- CLI now uses colours and the payload goes to stdout, while all other messages go to stderr
- Minor CLI error message fixes
- Formatting and spellcheck fixes for the docs and error messages
- The web app UI has cosmetic changes
- A typo on the "default" example of Vocabug had a typo where the words "left" and "right" were switched
- Modified the "Australian-like" example in Vocabug
- Modified the greek and hangul routines

### Added

- Added latin to portuguese example for Nesca
- Added "note" directive. This directive behaves like a multi-line comment
- Added Cyrillic to Latin routine
- Added "Romance-like" example for Vocabug

## [1.0.9] - 2026-JUN-25

### Modified

- Modified the "Australian-like" example in Vocabug
- Restructured the docs. The rule line wrapping feature had not been documented yet

### Added

- Added recast transforms