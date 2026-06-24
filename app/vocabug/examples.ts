const examples: { [key: string]: string } = {
  default: 
`; Anything after a semicolon is a comment until the end of the line.

; A Category is a group of graphemes assigned to a key.
; By default, graphemes in a category furthest to the left
; are picked more often than graphemes to the right.
categories:
  C = {t*9, tr} n {k*13, kr} m r s {p*12, pr} ch h w y
  L = ee oo aa ii uu
  V = a i e o u L
  F = n r s

; A Unit provides abbreviation of parts of a word-shape.
; Here we are using <$> to define the main syllable.
; Items enclosed in '(' and ')' only appear 10% of the time by default.
units:
  $ = CV(F)

; The first word-shape is picked the most often, the last, the least often.
words:
  (V)<$>, (V)<$><$>, (V)<$><$><$>, (V)<$><$><$><$>, V

; The 'graphemes' directive prevents transforms targeting
; only part of a grapheme. It also has additional uses.
graphemes:
  ee, oo, aa, ii, uu, ch

; Vocabug uses 'transforms' to change words, or outright reject them.
; Transforms are all placed inside the 'stage' directive.
stage:
  nn, nm, np, sh, ss -> ny, m, mp, s, s
  V: -> V / #_# ; Words that are a long vowel become short.
  yi -> 0 ; Remove words with <yi>

; Click the green 'Generate' button in the taskbar below to generate words!!
; Read the instructions linked above, or by clicking 'Help' in the taskbar below.`,
  tonal:
`; A somewhat Yoruba-like tonal language
categories:
  I = k t ^ {p f} n r b m s l d c ç ş h y w g {kp gb}
  C = t k {f p} n r b m s d h l ŋ g c ş ç l y w {mb nd ŋg} {kp gb ŋgb}
  V = a i e o u
  W = a i ẹ ọ u
  T = ^*3.7 &[Acute]*3.3 &[Grave]*3 ; Gives mid-tone, high-tone, low-tone

units:
; + ATR harmony 
  A = IVT
  B = CVT
  C = CVT(n)

; - ATR harmony
  X = IWT
  Y = CWT
  Z = CWT(n)

words:
  <A><C> <A><B><C> <A><B><B><C>
  <X><Z> <X><Y><Z> <X><Y><Y><Z>
  <A>    <Z>

graphemes:
  {a e ẹ i o ọ u}<{á é ẹ́ í ó ọ́ ú}<{à è ẹ̀ ì ò ọ̀ ù} kp gb

stage:
; Combine vowels and diacritics into one character, if possible.
  <routine = compose>
; Palatalise <c> and <s> after <i> and its tonal variants.
  c s -> ç ş / _i~`,
  japanese: 
`; Japanese-like based on interpreting wikipedia.org/wiki/Japanese_phonology 
; and Phonological Unit Frequencies in Japanese... by Katsuo Tamaoka.

categories:
  I = k ^ t s n m h d g r z b w p
  C = k t s r n ^ h m d g z b w p
  V = a i u o e ; - The short vowels.
; <ʀ> yields long vowels.
  W = a i u o e {oʀ aʀ iʀ eʀ uʀ yu yo ya {yoʀ yuʀ yaʀ}}
; <ɴ> is the syllable final nasal.
; <ɢ> yields geminate consonants.
  F = ɴ ɢ

units:
  F = IW(F) ; First syllable of slightly different consonant distribution.
  $ = CW(F) ; Gives type C(y)V(ʀ)(ɴ,ɢ)
  L = CW(ɴ) ; Last syllable of type C(y)V(ʀ)(ɴ)

; Where light syllable is (C)V, and heavy is (C){VF,Vʀ(F)}
; The final two syllables are least likely to be light + heavy...

words:
  <F><$><L> <F><$><$><L> <F> <F><$><$><$><L> <F><L>

graphemes:
  a b ch d e f g h i j k l m n o p r s sh t ts u w y z

stage:
V+ -> ^ / ʀ_ ; No vowels after a long vowel.
V?[3,] -> V: ; Sequence of 3+ vowels becomes 2.

ɢ -> ɴ / _V

; "Yotsugana": <dz> and <dy> neutralise to <z> and <j>.
<  i   u   e   o   ya   yu   yo
s  shi +   +   +   sha  shu  sho
z  ji  +   +   +   ja   ju   jo 
t  chi tsu +   +   cha  chu  cho
d  ji  zu  +   +   ja   ju   jo
h  +   fu  +   +   +    +    +
w  i   yu  yo  yo  ya   yu   yo
ɴ  n'a n'u n'e n'o n'ya n'yu n'yo
>

; <ɴ> assimilation, and <ɢ> gemination.
< ch   sh    ts   j  k   g  s   z  t   d  n  h   b  p   m  r  l  f   w
ɢ ɢtch ɢshsh ɢtts j  ɢkk g  ɢss z  ɢtt d  n  ɢpp b  ɢpp m  r  l  ɢpp ɢpp
ɴ nch  nsh   nts  nj nk  ng ns  nz nt  nd nn nh  mb mp  mm nr nl nf  nw
>

ʀɢ ɴ ɢ -> ^ n ^ ; <ʀ> + <ɢ> is illegal.

; Vowel sequences:
<  a   i   u   e  o
a  ai  +   oʀ  +  +
i  ya  ui  yuʀ +  yo
u  uʀ  +   ui  ai ai
e  eʀ  eʀ  yoʀ ai yo
o  oʀ  +   +   +  o
ʀ  ʀ   ʀ   ʀ   ʀ  ʀ
>

y -> ^ / sh_ / j_ / ch_

ʀ -> ^ / #*_# ; Collapse long vowel words into short vowel words.

Vʀ -> V: ; Get long vowels.

note:
  This gives very Japanese-like words, however:
  * The pitch accent is not represented here
  * /ɢn/ and /ɴV/ sequences are possibly overrepresented
  * Where light syllable is (C)V, and heavy is (C){VF,Vʀ(F)},
    in Japanese, the final two syllables of a word
    are least likely to be light followed by heavy`,
  australian: 
`note:
  This does not represent a single Australian language,
  nor does it represent the average Australian language,
  it creates Australian looking words.

  CONSONANTS:
  p  t  ṭ  č  k
  m  n  ṇ  ň  ŋ
     l  ḷ  y  w
     r  ṛ  

  VOWELS:
  i ii    u uu
  a aa ai

  Words begin with <a> or a consonant that is not <r, ṛ, l, ḷ, ṇ>.
  No monosyllabic words. Disylabic words DON'T begin with <a>
  Medial Singleton consonants are unrestricted.
  There are intervocalic consonant clusters.
  Any vowel or <ai> occurs bettween any two consonants.
  Words end in <a, i, u> or <n, l, r, ṛ, t>

categories:
; Initials:
  I = k p m w ŋ y n t č ň ṭ
; Clusters
  X = {mp nt ṇṭ nč ňč ŋk nk} {rp rč rk rm lk lp} {rm rň} {ḷp ḷṭ ḷk} {nm nň nŋ np}
; Medials
  C = k m ṛ l r w y n t č p ŋ ḷ ṭ ň X {d ṇ}
; Finals
  F = n l r ṛ t
; Vowels
  V = a i u {aa*1 ii {uu e ai}} 
  W = a i u

units:
  First = {IV*18, a}
  Di-first = IV
  Medial = CV
  Last = C{W*11,VF}

words:
  <First><Medial><Last>, <First><Medial><Medial><Last>,
  <First><Medial><Medial><Medial><Last>, <Di-first><Last>,
  <First><Medial><Medial><Medial><Medial><Last>

graphemes:
  č ň ṛ aa uu ii

stage:
  i -> ^ / a_{y,ň,č,w} ; <ai> becomes <a> before palatals or <w>

  e -> a / _#
  <@chance = 70%
    e → u / _(C)u
  >
  <@chance = 70%
    e → i / _(C)i
  >
  e -> a

  d -> ṛ / u_
  d -> t`,
romance:
`; This gives somewhat Spanish looking words 
; Let's name this language "Espamogus"

categories:
  C = {t*9,tr} s ^ {k*12,kr*2,kl} {d*12,dr} n {p*12,pr*2,pl} l m r {b*9,br*2,bl} g h {č*12 f z}
  V = a i o u e
  F = n r l s m
  X = n r l s
  T = &[Acute]

units:
  $ = CV(F)
  X = CV{[T*1]*9,[T*3]F} ; 3rd last syllable
  Y = CV{[^*80]*9,[^*95]F} ; 2nd last syllable
  Z = CV{[T*3]*10,[T*9]X} ; last syllable

words:
  <Y><Z> <X><Y><Z> <$><X><Y><Z> <$><$><X><Y><Z>

stage:
<routine = compose> ; Get stressed vowels
{a,e,i,o,u}?[3,] -> {a,e,i,o,u} ; Vowels of 2+ length become 1
áa,ée,íi,óo,úu -> á,é,í,ó,ú
{a,e,o,u,á,é,í,ó,ú}V -> 0 / #_#

; Enlace y Hiato
<  a  e  i  o  u
a  a  aj aj o  aw
e  +  e  ej +  ew
i  ja je i  jo ju
o  +  e  oj o  ju
u  wa we wi wo u
>

nj gj gn gl -> ň ň ň ʎ
jg jn jj jl ww -> ň ň j ʎ w

<  b  k  g  č  d  f  h  l  m  n  p  r  s  t  z  
m  +  nk ng nč nd nf h  nl m  ň  +  r  +  nt nz 
n  mb +  +  +  +  +  h  l  ň  ň  mp r  +  +  +  
r  +  +  +  +  +  +  h  l  +  +  +  +  +  +  z  
l  +  +  +  +  +  +  h  ʎ  +  ʎ  +  r  +  +  z
s  +  +  +  +  +  f  h  +  +  +  +  +  s  +  z 
>

; Taco-taco, burrito-burrito
č ň ʎ j w -> ch ñ ll i u`
};

export { examples };