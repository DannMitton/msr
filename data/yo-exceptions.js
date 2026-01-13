// Ё Exception Dictionary - words where printed ⟨е⟩ should be ⟨ё⟩
// Grayson p. 275-279

const Ё_EXCEPTION_DICTIONARY = {
            // Common pronouns where printed ⟨е⟩ = ⟨ё⟩ (p. 275-276)
            'ее': { stress: 1, actualForm: 'её', note: 'her (acc./gen. of она)' },
            'нем': { stress: 0, actualForm: 'нём', note: 'him/it (prep. of он/оно)' },
            'мое': { stress: 1, actualForm: 'моё', note: 'my (neut. nom./acc.)' },
            'моем': { stress: 1, actualForm: 'моём', note: 'my (masc./neut. prep.)' },
            'твое': { stress: 1, actualForm: 'твоё', note: 'your (neut. nom./acc.)' },
            'твоем': { stress: 1, actualForm: 'твоём', note: 'your (masc./neut. prep.)' },
            'свое': { stress: 1, actualForm: 'своё', note: 'one\'s own (neut. nom./acc.)' },
            'своем': { stress: 1, actualForm: 'своём', note: 'one\'s own (masc./neut. prep.)' },
            'чье': { stress: 0, actualForm: 'чьё', note: 'whose? (neut. nom./acc.)' },
            'чьем': { stress: 0, actualForm: 'чьём', note: 'whose? (masc./neut. prep.)' },
            
            // всё vs все - default to всё (everything) as more common in lyric poetry
            // User can override if context indicates все (everyone)
            'все': { stress: 0, actualForm: 'всё', note: 'everything (neut.) — or все (everyone) if people', ambiguous: true },
            'всем': { stress: 0, actualForm: 'всём', note: 'everything (prep.) — or всем (instr./dat.) if people', ambiguous: true },
            
            // Common verb forms with ⟨ё⟩ in conjugation (p. 279, Table A)
            // идти conjugation
            'идешь': { stress: 1, actualForm: 'идёшь', note: 'you walk (идти)' },
            'идет': { stress: 1, actualForm: 'идёт', note: 'walks (идти)' },
            'идем': { stress: 1, actualForm: 'идём', note: 'we walk (идти)' },
            'идете': { stress: 1, actualForm: 'идёте', note: 'you (pl.) walk (идти)' },
            
            // нести conjugation
            'несешь': { stress: 1, actualForm: 'несёшь', note: 'you carry (нести)' },
            'несет': { stress: 1, actualForm: 'несёт', note: 'carries (нести)' },
            'несем': { stress: 1, actualForm: 'несём', note: 'we carry (нести)' },
            'несете': { stress: 1, actualForm: 'несёте', note: 'you (pl.) carry (нести)' },
            
            // вставать conjugation
            'встаешь': { stress: 1, actualForm: 'встаёшь', note: 'you stand up (вставать)' },
            'встает': { stress: 1, actualForm: 'встаёт', note: 'stands up (вставать)' },
            'встаем': { stress: 1, actualForm: 'встаём', note: 'we stand up (вставать)' },
            'встаете': { stress: 1, actualForm: 'встаёте', note: 'you (pl.) stand up (вставать)' },
            
            // беречь conjugation
            'бережешь': { stress: 2, actualForm: 'бережёшь', note: 'you save (беречь)' },
            'бережет': { stress: 2, actualForm: 'бережёт', note: 'saves (беречь)' },
            'бережем': { stress: 2, actualForm: 'бережём', note: 'we save (беречь)' },
            'бережете': { stress: 2, actualForm: 'бережёте', note: 'you (pl.) save (беречь)' },
            
            // Nouns with ⟨ё⟩ suffixes (p. 277-278)
            'теленок': { stress: 1, actualForm: 'телёнок', note: 'calf (-ёнок suffix)' },
            'ребенок': { stress: 1, actualForm: 'ребёнок', note: 'child (-ёнок suffix)' },
            'жеребенок': { stress: 2, actualForm: 'жеребёнок', note: 'foal (-ёнок suffix)' },
            'поросенок': { stress: 2, actualForm: 'поросёнок', note: 'piglet (-ёнок suffix)' },
            'цыпленок': { stress: 1, actualForm: 'цыплёнок', note: 'chick (-ёнок suffix)' },
            'котенок': { stress: 1, actualForm: 'котёнок', note: 'kitten (-ёнок suffix)' },
            'щенок': { stress: 1, actualForm: 'щенок', note: 'puppy (stress only, no ё)' },
            
            // -ёр suffix (agent nouns)
            'актер': { stress: 1, actualForm: 'актёр', note: 'actor (-ёр suffix)' },
            'дирижер': { stress: 2, actualForm: 'дирижёр', note: 'conductor (-ёр suffix)' },
            'боксер': { stress: 1, actualForm: 'боксёр', note: 'boxer (-ёр suffix)' },
            'гримёр': { stress: 1, actualForm: 'гримёр', note: 'makeup artist (-ёр suffix)' },
            'суфлер': { stress: 1, actualForm: 'суфлёр', note: 'prompter (-ёр suffix)' },
            'режиссер': { stress: 2, actualForm: 'режиссёр', note: 'director (-ёр suffix)' },
            'стажер': { stress: 1, actualForm: 'стажёр', note: 'trainee (-ёр suffix)' },
            
            // Common words with ⟨ё⟩ frequently seen without dots
            'еще': { stress: 1, actualForm: 'ещё', note: 'still, yet, more' },
            'ее': { stress: 1, actualForm: 'её', note: 'her' },
            'елка': { stress: 0, actualForm: 'ёлка', note: 'fir tree' },
            'елки': { stress: 0, actualForm: 'ёлки', note: 'fir trees' },
            'елку': { stress: 0, actualForm: 'ёлку', note: 'fir tree (acc.)' },
            'елкой': { stress: 0, actualForm: 'ёлкой', note: 'fir tree (instr.)' },
            'елке': { stress: 0, actualForm: 'ёлке', note: 'fir tree (prep./dat.)' },
            'черт': { stress: 0, actualForm: 'чёрт', note: 'devil' },
            'черта': { stress: 1, actualForm: 'чёрта', note: 'devil (gen.)' },
            'желтый': { stress: 0, actualForm: 'жёлтый', note: 'yellow' },
            'желтая': { stress: 0, actualForm: 'жёлтая', note: 'yellow (fem.)' },
            'желтое': { stress: 0, actualForm: 'жёлтое', note: 'yellow (neut.)' },
            'черный': { stress: 0, actualForm: 'чёрный', note: 'black' },
            'черная': { stress: 0, actualForm: 'чёрная', note: 'black (fem.)' },
            'черное': { stress: 0, actualForm: 'чёрное', note: 'black (neut.)' },
            'пчелы': { stress: 0, actualForm: 'пчёлы', note: 'bees' },
            'пчел': { stress: 0, actualForm: 'пчёл', note: 'bees (gen.)' },
            'лед': { stress: 0, actualForm: 'лёд', note: 'ice' },
            'льда': { stress: 1, actualForm: 'льда', note: 'ice (gen.) — no ё' },
            'мед': { stress: 0, actualForm: 'мёд', note: 'honey' },
            'меда': { stress: 1, actualForm: 'мёда', note: 'honey (gen.)' },
            'береза': { stress: 1, actualForm: 'берёза', note: 'birch tree' },
            'березы': { stress: 1, actualForm: 'берёзы', note: 'birch trees' },
            'озера': { stress: 0, actualForm: 'озёра', note: 'lakes' },
            'слезы': { stress: 0, actualForm: 'слёзы', note: 'tears' },
            'звезды': { stress: 0, actualForm: 'звёзды', note: 'stars' },
            
            // ================================================================
            // SECTION 5 PURE EXCEPTIONS (pp. 287-288)
            // Words that defy normal rules — must be memorized
            // ================================================================
            
            // счастье family — /ɑ/ not fronted [a] despite interpalatal position
            'счастье': { stress: 0, exception: 'счастье', note: 'happiness — vowel stays /ɑ/ not [a] (Old Muscovite)', ipa_note: '/ˈʃʲʃʲɑ sʲtʲjɪ/' },
            'счастья': { stress: 0, exception: 'счастье', note: 'счастье gen. — vowel stays /ɑ/' },
            'счастью': { stress: 0, exception: 'счастье', note: 'счастье dat. — vowel stays /ɑ/' },
            'счастьем': { stress: 0, exception: 'счастье', note: 'счастье instr. — vowel stays /ɑ/' },
            'счастлив': { stress: 0, exception: 'счастье', note: 'happy (m.) — vowel stays /ɑ/' },
            'счастлива': { stress: 1, exception: 'счастье', note: 'happy (f.) — vowel stays /ɑ/' },
            'счастливый': { stress: 1, exception: 'счастье', note: 'happy (adj.) — vowel stays /ɑ/' },
            
            // церковь — palatalized р without palatalizing agent
            'церковь': { stress: 0, exception: 'церковь', note: 'church — р palatalized (Old Muscovite)', ipa_note: '/ˈtsɛrʲ kʌfʲ/' },
            'церкви': { stress: 0, exception: 'церковь', note: 'церковь gen./dat./prep. — р palatalized' },
            'церквей': { stress: 1, exception: 'церковь', note: 'церковь gen.pl. — р palatalized' },
            'церковный': { stress: 0, exception: 'церковь', note: 'church (adj.) — р palatalized' },
            
            // ангел — н NOT palatalized before soft г
            'ангел': { stress: 0, exception: 'ангел', note: 'angel — н stays hard before soft г (borrowed word)', ipa_note: '/ˈɑn ɡʲɪɫ/' },
            'ангела': { stress: 0, exception: 'ангел', note: 'angel gen. — н stays hard' },
            'ангелы': { stress: 0, exception: 'ангел', note: 'angels — н stays hard' },
            'ангелов': { stress: 0, exception: 'ангел', note: 'angels gen. — н stays hard' },
            'ангельский': { stress: 0, exception: 'ангел', note: 'angelic — н stays hard' },
            
            // ага — г pronounced as /h/ not /ɡ/ or /x/
            'ага': { stress: 1, exception: 'ага', note: 'aha! — г is /h/ (aspirate), not /x/', ipa_note: '/ɑ ˈhɑ/' },
            
            // сейчас — initial с stays hard
            'сейчас': { stress: 1, exception: 'сейчас', note: 'now — initial с stays HARD (Old Muscovite)', ipa_note: '/si ˈtʃʲɑs/' },
            
            // танцевать family — unstressed -це- uses /ɑ/ not /ɨ/
            'танцевать': { stress: 2, exception: 'танцевать', note: 'to dance — unstressed -це- is /tsɑ/ not /tsɨ/', ipa_note: '/tʌn tsɑ ˈvɑtʲ/' },
            'танцую': { stress: 1, exception: 'танцевать', note: 'I dance — unstressed -це- is /tsɑ/' },
            'танцуешь': { stress: 1, exception: 'танцевать', note: 'you dance — unstressed -це- is /tsɑ/' },
            'танцует': { stress: 1, exception: 'танцевать', note: 'dances — unstressed -це- is /tsɑ/' },
            'танцуем': { stress: 1, exception: 'танцевать', note: 'we dance — unstressed -це- is /tsɑ/' },
            'танцевал': { stress: 2, exception: 'танцевать', note: 'danced (m.) — unstressed -це- is /tsɑ/' },
            'танцевала': { stress: 2, exception: 'танцевать', note: 'danced (f.) — unstressed -це- is /tsɑ/' },
            'танец': { stress: 0, exception: 'танцевать', note: 'dance (noun) — unstressed -це- is /tsɑ/' },
            'танца': { stress: 1, exception: 'танцевать', note: 'dance gen. — unstressed -це- is /tsɑ/' },
            'танцы': { stress: 1, exception: 'танцевать', note: 'dances — unstressed -це- is /tsɑ/' },
            'танцор': { stress: 1, exception: 'танцевать', note: 'dancer — unstressed -це- is /tsɑ/' },
            
            // уединённый — participle/adjective with hidden ⟨ё⟩
            'уединенный': { stress: 3, actualForm: 'уединённый', note: 'solitary, secluded (adj./participle)' },
            'уединенная': { stress: 3, actualForm: 'уединённая', note: 'solitary (fem.)' },
            'уединенное': { stress: 3, actualForm: 'уединённое', note: 'solitary (neut.)' },
            'уединенные': { stress: 3, actualForm: 'уединённые', note: 'solitary (pl.)' },
            'уединенного': { stress: 3, actualForm: 'уединённого', note: 'solitary (gen. m./n.)' },
            'уединенной': { stress: 3, actualForm: 'уединённой', note: 'solitary (gen./dat./instr./prep. f.)' },
            'уединенному': { stress: 3, actualForm: 'уединённому', note: 'solitary (dat. m./n.)' },
            'уединенным': { stress: 3, actualForm: 'уединённым', note: 'solitary (instr. m./n. or dat. pl.)' },
            'уединенных': { stress: 3, actualForm: 'уединённых', note: 'solitary (gen./prep. pl.)' },
            'уединенными': { stress: 3, actualForm: 'уединёнными', note: 'solitary (instr. pl.)' }
};
