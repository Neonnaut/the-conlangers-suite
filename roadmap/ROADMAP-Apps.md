## ADDM

steep learning curve

heavy data input

cannot edit fields to suite language. one to one meaning

intrusive UI

want: extendibility. modularity. readability. mass editing of entries. export formats. recoverable file. type warnings. receive user defined input. documentational database with XML structure. the structure can be chosen froma template and then edited

add entries in the way I read entries



Are you a weirdo who types their dictionary out in latex? Or have you mistakeningly typed out your

dictionary in a spreadsheet, only to find out the data type of dictionariesis too complex?

Your meaning does not exist in the websites database?

Your dictionary is now saved in a non-human-readable database file?

  

I want to write a dictionary in the same way I read a dictionary

  

mass editing

  

The dictionary is made of a collection of entries
An entry is a collection of fields
Each field has a data-type, format, types, and if a multiple data-type: a delimiter

  

Field data-types:

```txt
   KEY
   BRANCHER
   SINGLE
   MULTIPLE
   SINGLE OPTIONAL
   MULTIPLE OPTIONAL
```

Field format-tags:

```txt
   [b]           bold
   [i]           italics
   [u]           underline
   [superscript] superscript
   [subscript]   subscript
   [small-caps]  small caps
```

Field format-entities:

```
   &[branch-incrementor-number]
   &[branch-incrementor-letter]
   &[newline]
```

alphabet:

```txt
alphabet:
  a, b, c, c', d, ...
```

invisible:

```txt
invisible:
  ., l
```

order-by:

```txt
order-by:  
  <word> descending
```

Entry:

```txt
format, types, delimiter, 

entry-fields:
  KEY word {
     
	 format = [b]_[/b]
  }

  SINGLE ipa {
	 format = \[_\]
  }

  BRANCHER pos {
	 types = n|noun, "v"|"verb", "adj"
	 format = "[superscript]<branch-incrementor-num>[/superscript] [i]_[/i]."
  }

  MULTIPLE meaning {
	 delimiter: "; "
  }

  MULTIPLE OPTIONAL note {
	 format: "Note: [i]<note>[/i]",
	 delimeter: ";"
  }
```

Dictionary:
```txt
right
raɪt 
{class} n.
  a direction
  A note here
| an additional note here separated by a pipe
{class} n.
  <meaning> To be healthy
  <meaning> To be appropriate
  <note> another optional note belonging to this branch
{class} v.
  <meaning> To return to normal upright position.
```

```txt
<word> right
<ipa> raɪt 
{class} n.
  <meaning> a direction
  <note> A note here
  <note> an additional note here separated by a pipe
{class} n.
  <meaning> To be healthy
  <meaning> To be appropriate
  <note> another optional note belonging to this branch
{class} v.
  <meaning> To return to normal upright position.

foo
<ipa> bar
{class} n.
  <meaning> A placeholder word
```

```txt
- right
- raɪt
= noun
  - a direction 
  - A note here
  + an additional note here separated by a plus sign
= noun
  - To be healthy
  - To be appropriate
  - Note belonging to this branch
= verb
  - To return to a normal upright position.
```
## Frequenta

  

## Conjugator

  

## Phonology table creator

  

## Documenta

  

## Scripta

  

```txt

grapheme = "a" {

   path {

      12, 31

      straight

      4, 11

      curved

      node = 8, 9

      serif = "1"

   }

}

```