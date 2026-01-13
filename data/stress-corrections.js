// Stress Corrections - manual overrides for Vuizur/Wiktionary errors
// These override the dictionary when there are homograph issues

const STRESS_CORRECTIONS = {
            // Nouns incorrectly stressed due to verb homographs
            'душа': 1,      // душа́ (soul) - not ду́ша (verb form)
            'вода': 1,      // вода́ (water) - not во́да
            'земля': 1,     // земля́ (earth/land)
            'весна': 1,     // весна́ (spring)
            'зима': 1,      // зима́ (winter)
            'жена': 1,      // жена́ (wife)
            'сестра': 1,    // сестра́ (sister)
            'стена': 1,     // стена́ (wall)
            'война': 1,     // война́ (war)
            'волна': 1,     // волна́ (wave)
            'гора': 1,      // гора́ (mountain)
            'доска': 1,     // доска́ (board)
            'игра': 1,      // игра́ (game)
            'нога': 1,      // нога́ (leg)
            'рука': 1,      // рука́ (hand)
            'спина': 1,     // спина́ (back)
            'страна': 1,    // страна́ (country)
            'пространство': 1, // простра́нство (space)
            'группа': 0,    // гру́ппа (group)
            'трава': 1,     // трава́ (grass)
            'труба': 1,     // труба́ (pipe/trumpet)
            'щека': 1,      // щека́ (cheek)
            
            // Common words missing or wrong
            'молоко': 2,    // молоко́ (milk)
            'потому': 2,    // потому́ (therefore)
            'почему': 2,    // почему́ (why)
            'всегда': 1,    // всегда́ (always)
            'тогда': 1,     // тогда́ (then)
            'сюда': 1,      // сюда́ (here/hither)
            'туда': 1,      // туда́ (there/thither)
            'куда': 1,      // куда́ (where to)
            'никуда': 2,    // никуда́ (nowhere)
            'откуда': 1,    // отку́да (from where)
            
            // Adjective/adverb forms
            'молодой': 2,   // молодо́й (young)
            'золотой': 2,   // золото́й (golden)
            'голубой': 2,   // голубо́й (light blue)
            'дорогой': 2,   // дорого́й (dear/expensive)
            
            // Nouns commonly used in songs
            'объявление': 2, // объявле́ние (announcement)
            'любовь': 1,    // любо́вь (love)
            
            // Verbs commonly used in songs
            'люблю': 1,     // люблю́ (I love)
            'хочу': 1,      // хочу́ (I want)
            'могу': 1,      // могу́ (I can)
            'пойду': 1,     // пойду́ (I will go)
            'приду': 1,     // приду́ (I will come)
};
