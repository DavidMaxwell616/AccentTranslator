window.AccentDictionaryReady = (async () => {
async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Could not load ' + path + ' (' + response.status + ').');
  return response.json();
}
const [accents, entries] = await Promise.all([
  loadJson('./src/accents.json'),
  loadJson('./src/pronunciations.json'),
]);
if (!accents || typeof accents !== 'object' || Array.isArray(accents) || !Object.keys(accents).length) {
  throw new Error('Accent data must be a nonempty object.');
}
for (const [id, accent] of Object.entries(accents)) {
  if (!/^[a-z][a-z_]*$/.test(id) || !accent ||
      !['name', 'note', 'group', 'label'].every(key => typeof accent[key] === 'string' && accent[key].trim()) ||
      !Number.isInteger(accent.column) || accent.column < 0 || accent.column > 2) {
    throw new Error('Invalid accent entry: ' + id);
  }
}

// Broad, illustrative IPA. Each pair is [IPA, approximate English respelling].
if (!entries || typeof entries !== 'object' || Array.isArray(entries) || !Object.keys(entries).length) {
  throw new Error('The pronunciation dictionary must be a nonempty object.');
}
for (const [word, variants] of Object.entries(entries)) {
  if (!/^[a-z]+$/.test(word) || !Array.isArray(variants) || variants.length !== 3 ||
      !variants.every(pair => Array.isArray(pair) && pair.length === 2 && pair.every(value => typeof value === 'string' && value.trim()))) {
    throw new Error(`Invalid pronunciation entry: ${word}`);
  }
}
// Regional examples, not universal rules for every speaker in each region.
// Missing regional entries use the labeled base accent selected by column.
const regionalEntries = {
  // One illustrative London style; the city includes many accent varieties.
  english_london: {
    water: ['ˈwɔːʔə', 'WAW-uh (glottal stop)'],
    better: ['ˈbɛʔə', 'BEH-uh (glottal stop)'],
    butter: ['ˈbʌʔə', 'BUH-uh (glottal stop)'],
    night: ['naɪʔ', 'NIGH (glottal stop)'],
    hot: ['hɒʔ', 'HOH (glottal stop)'],
    lot: ['lɒʔ', 'LOH (glottal stop)'],
    hello: ['həˈləʊ', 'huh-LOH'],
    home: ['həʊm', 'HOHM'],
    day: ['deɪ', 'DAY'],
    bath: ['bɑːθ', 'BAHth'],
  },
  english_cockney: {
    water: ['ˈwɔːʔə', 'WAW-uh (glottal stop)'],
    better: ['ˈbɛʔə', 'BEH-uh (glottal stop)'],
    butter: ['ˈbʌʔə', 'BUH-uh (glottal stop)'],
    bath: ['bɑːf', 'BAHF'],
    mother: ['ˈmʌvə', 'MUH-vuh'],
    father: ['ˈfɑːvə', 'FAH-vuh'],
    day: ['daɪ', 'DYE'],
    night: ['nɑɪʔ', 'NIGH (glottal stop)'],
    home: ['əʊm', 'OHM'],
    hello: ['əˈləʊ', 'uh-LOH'],
    hot: ['ɒʔ', 'OH (glottal stop)'],
  },
  english_geordie: {
    dance: ['dans', 'DANS'],
    bath: ['baθ', 'BAth'],
    glass: ['ɡlas', 'GLASS'],
    grass: ['ɡras', 'GRASS'],
    class: ['klas', 'CLASS'],
    after: ['ˈaftə', 'AF-tuh'],
    butter: ['ˈbʊtə', 'BUUT-uh'],
    mother: ['ˈmʊðə', 'MUU-thuh'],
    day: ['deː', 'DAY (steady vowel)'],
    home: ['hoːm', 'HOHM (steady vowel)'],
    go: ['ɡoː', 'GOH (steady vowel)'],
    no: ['noː', 'NOH (steady vowel)'],
  },
  english_scouse: {
    dance: ['dans', 'DANS'],
    bath: ['baθ', 'BAth'],
    glass: ['ɡlas', 'GLASS'],
    grass: ['ɡras', 'GRASS'],
    class: ['klas', 'CLASS'],
    after: ['ˈaftə', 'AF-tuh'],
    butter: ['ˈbʊtə', 'BUUT-uh'],
    mother: ['ˈmʊðə', 'MUU-thuh'],
    bird: ['bɛːd', 'BEHD'],
    world: ['wɛːld', 'WEHLD'],
    park: ['paːx', 'PAHK (fricative ending)'],
  },
  english_brummie: {
    dance: ['dans', 'DANS'],
    bath: ['baθ', 'BAth'],
    glass: ['ɡlas', 'GLASS'],
    grass: ['ɡras', 'GRASS'],
    class: ['klas', 'CLASS'],
    after: ['ˈaftə', 'AF-tuh'],
    butter: ['ˈbʊtə', 'BUUT-uh'],
    mother: ['ˈmʊðə', 'MUU-thuh'],
    day: ['dʌɪ', 'DUH-ih'],
    night: ['nɔɪt', 'NOYT'],
    home: ['əʊm', 'OHM'],
  },
  english_west_country: {
    water: ['ˈwɔːtər', 'WAW-ter'],
    car: ['kɑːr', 'KAR'],
    park: ['pɑːrk', 'PARK'],
    better: ['ˈbɛtər', 'BET-er'],
    butter: ['ˈbʌtər', 'BUT-er'],
    after: ['ˈɑːftər', 'AHF-ter'],
    father: ['ˈfɑːðər', 'FAH-ther'],
    mother: ['ˈmʌðər', 'MUH-ther'],
    bird: ['bɜːrd', 'BURD'],
    world: ['wɜːrld', 'WURLD'],
  },
  // Broad illustrative English pronunciations, not Irish Gaelic or Scots.
  irish: {
    water: ['ˈwɔːtər', 'WAW-ter'],
    tomato: ['təˈmɑːtoː', 'tuh-MAH-toh'],
    dance: ['dans', 'DANS'],
    coffee: ['ˈkɒfi', 'KOF-ee'],
    hello: ['həˈloː', 'huh-LOH'],
    car: ['kɑːr', 'KAR'],
    park: ['pɑːrk', 'PARK'],
    better: ['ˈbɛtər', 'BET-er'],
    butter: ['ˈbʊtər', 'BUUT-er'],
    bath: ['bat̪', 'BAT (dental t)'],
    glass: ['ɡlas', 'GLASS'],
    grass: ['ɡras', 'GRASS'],
    class: ['klas', 'CLASS'],
    after: ['ˈaftər', 'AF-ter'],
    banana: ['bəˈnanə', 'buh-NAN-uh'],
    father: ['ˈfɑːd̪ər', 'FAH-der (dental d)'],
    mother: ['ˈmʊd̪ər', 'MUUD-er (dental d)'],
    bird: ['bɜːrd', 'BURD'],
    world: ['wɜːrld', 'WURLD'],
    day: ['deː', 'DAY'],
    night: ['naɪt', 'NITE'],
    home: ['hoːm', 'HOHM'],
    go: ['ɡoː', 'GOH'],
    no: ['noː', 'NOH'],
    cat: ['kat', 'KAT'],
    dog: ['dɒɡ', 'DOG'],
    hot: ['hɒt', 'HOT'],
    lot: ['lɒt', 'LOT'],
    schedule: ['ˈʃɛdjuːl', 'SHED-yool'],
    zebra: ['ˈzɛbrə', 'ZEB-ruh'],
    new: ['njuː', 'NYOO'],
    tune: ['tjuːn', 'TYOON'],
  },
  scottish: {
    water: ['ˈwɔtər', 'WAW-ter'],
    tomato: ['təˈmato', 'tuh-MAH-toh'],
    dance: ['dans', 'DANS'],
    coffee: ['ˈkɔfi', 'KOF-ee'],
    hello: ['həˈlo', 'huh-LOH'],
    car: ['kar', 'KAR'],
    park: ['park', 'PARK'],
    better: ['ˈbɛtər', 'BET-er'],
    butter: ['ˈbʌtər', 'BUT-er'],
    bath: ['baθ', 'BAth'],
    glass: ['ɡlas', 'GLASS'],
    grass: ['ɡras', 'GRASS'],
    class: ['klas', 'CLASS'],
    after: ['ˈaftər', 'AF-ter'],
    banana: ['bəˈnanə', 'buh-NAN-uh'],
    father: ['ˈfaðər', 'FAH-ther'],
    mother: ['ˈmʌðər', 'MUH-ther'],
    bird: ['bɪrd', 'BIRD (short i)'],
    world: ['wʌrld', 'WURLD'],
    day: ['de', 'DAY'],
    night: ['nʌɪt', 'NUH-ite'],
    home: ['hom', 'HOHM'],
    go: ['ɡo', 'GOH'],
    no: ['no', 'NOH'],
    cat: ['kat', 'KAT'],
    dog: ['dɔɡ', 'DOG'],
    hot: ['hɔt', 'HOT'],
    lot: ['lɔt', 'LOT'],
    schedule: ['ˈʃɛdjul', 'SHED-yool'],
    zebra: ['ˈzɛbrə', 'ZEB-ruh'],
    new: ['njʉ', 'NYOO'],
    tune: ['tjʉn', 'TYOON'],
  },
  american_new_york: {
    water: ['ˈwɔətə', 'WAW-uh-tuh'],
    coffee: ['ˈkɔəfi', 'KAW-uh-fee'],
    dog: ['dɔəɡ', 'DAW-uhg'],
    car: ['kɑə', 'KAH-uh'],
    park: ['pɑək', 'PAH-uhk'],
    better: ['ˈbɛtə', 'BET-uh'],
    butter: ['ˈbʌtə', 'BUT-uh'],
    father: ['ˈfɑðə', 'FAH-thuh'],
    mother: ['ˈmʌðə', 'MUH-thuh'],
  },
  american_philadelphia: {
    water: ['ˈwʊɾɚ', 'WOOD-er'],
    night: ['nʌɪt', 'NUH-ite'],
    bath: ['beəθ', 'BEH-uhth'],
    glass: ['ɡleəs', 'GLEH-uhs'],
    grass: ['ɡreəs', 'GREH-uhs'],
    class: ['kleəs', 'KLEH-uhs'],
    dance: ['deəns', 'DEH-uhns'],
  },
  american_boston: {
    water: ['ˈwɒtə', 'WOT-uh'],
    coffee: ['ˈkɒfi', 'KOF-ee'],
    car: ['kɑː', 'KAH'],
    park: ['pɑːk', 'PAHK'],
    better: ['ˈbɛtə', 'BET-uh'],
    butter: ['ˈbʌtə', 'BUT-uh'],
    father: ['ˈfɑðə', 'FAH-thuh'],
    mother: ['ˈmʌðə', 'MUH-thuh'],
    hot: ['hɒt', 'HOT'],
    lot: ['lɒt', 'LOT'],
    dog: ['dɒɡ', 'DOG'],
  },
  american_texas: {
    night: ['naːt', 'NAHT'],
    cat: ['kæjət', 'KAY-uht'],
    bath: ['bæjəθ', 'BAY-uhth'],
    glass: ['ɡlæjəs', 'GLAY-uhs'],
    grass: ['ɡræjəs', 'GRAY-uhs'],
    class: ['klæjəs', 'KLAY-uhs'],
  },
  american_minnesota: {
    home: ['hoːm', 'HOHM'],
    go: ['ɡoː', 'GOH'],
    no: ['noː', 'NOH'],
    day: ['deː', 'DAY'],
    night: ['nʌɪt', 'NUH-ite'],
  },
};
const words = Object.keys(entries).sort();
function translate(input, accent) {
  const word = input.trim().toLowerCase();
  if (!Object.hasOwn(accents, accent)) return { error: 'Choose an available accent.' };
  if (!word) return { error: 'Type a word to discover its pronunciation.', empty: true };
  if (!/^[a-z]+$/.test(word)) return { error: 'Enter one English word using letters only.' };
  if (!Object.hasOwn(entries, word)) return { error: 'This word isn’t in our dictionary yet. Try an example or explore the supported words below.' };
  const regional = regionalEntries[accent];
  const regionalEntry = regional?.[word];
  const [ipa, guide] = regionalEntry || entries[word][accents[accent].column];
  const baseName = ['Southern England', 'General American', 'General Australian'][accents[accent].column];
  const note = regional && !regionalEntry
    ? `${baseName} guide shown; a regional example for this word isn’t available yet.`
    : regional ? 'Illustrative regional pronunciation; individual speakers vary.' : '';
  return { word, ipa: `/${ipa}/`, guide, note };
}
window.AccentDictionary = { accents, words, translate };
return window.AccentDictionary;
})();
