(async () => {
const controls = document.querySelectorAll('#word, #accent, #available-word, #clear, #copy, .audio-button');
controls.forEach(control => { control.disabled = true; });
document.querySelector('#status').textContent = 'Loading pronunciation dictionary…';
try {
const { accents, words, translate } = await window.AccentDictionaryReady;

class TranslatorScene extends Phaser.Scene {
  constructor() { super('Translator'); }
  create() {
    controls.forEach(control => { control.disabled = false; });
    const input = document.querySelector('#word');
    const availableWord = document.querySelector('#available-word');
    const accent = document.querySelector('#accent');
    accent.replaceChildren();
    const groups = new Map();
    for (const [id, definition] of Object.entries(accents)) {
      if (!groups.has(definition.group)) {
        const group = document.createElement('optgroup');
        group.label = definition.group;
        groups.set(definition.group, group);
        accent.append(group);
      }
      const option = document.createElement('option');
      option.value = id;
      option.textContent = definition.label;
      groups.get(definition.group).append(option);
    }
    const copy = document.querySelector('#copy');
    const ipa = document.querySelector('#ipa');
    const guide = document.querySelector('#respelling');
    const message = document.querySelector('#message');
    const status = document.querySelector('#status');
    const defaultStatus = `${Object.keys(accents).length} accents. A little more connection.`;
    status.textContent = defaultStatus;
    let current;
    let copyTimer;
    const audioButton = document.querySelector('.audio-button');
    const audioLabel = audioButton.querySelector('span');
    const synth = window.speechSynthesis;
    const audioSupported = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
    let utterance = null;
    const refreshAudio = () => {
      audioButton.disabled = !audioSupported || !current?.ipa;
      audioLabel.textContent = !audioSupported ? 'Audio unavailable' : utterance ? 'Stop playback' : 'Listen';
      audioButton.setAttribute('aria-label', audioLabel.textContent);
      audioButton.title = 'Browser voice approximation; regional IPA may differ.';
    };
    const stopAudio = () => {
      const wasPlaying = !!utterance;
      utterance = null;
      if (wasPlaying) synth.cancel();
      refreshAudio();
    };
    audioButton.addEventListener('click', () => {
      if (!audioSupported || !current?.ipa) return;
      clearTimeout(copyTimer);
      if (utterance) { stopAudio(); status.textContent = 'Playback stopped.'; return; }
      const targetLang = accent.value.startsWith('american') ? 'en-US'
        : accent.value === 'australian' ? 'en-AU'
        : accent.value === 'irish' ? 'en-IE' : 'en-GB';
      const normalize = lang => lang.toLowerCase().replaceAll('_', '-');
      const voices = synth.getVoices().filter(voice => /^en(?:-|$)/.test(normalize(voice.lang)));
      const regionalName = accents[accent.value].name.split(' · ')[1];
      const regionalVoice = accent.value === 'scottish'
        ? voices.find(voice => /scottish|scotland/i.test(voice.name) || normalize(voice.lang) === 'en-gb-scotland')
        : regionalName ? voices.find(voice => normalize(voice.lang) === normalize(targetLang) && voice.name.toLowerCase().includes(regionalName.toLowerCase())) : null;
      const voice = regionalVoice || voices.find(voice => normalize(voice.lang) === normalize(targetLang)) || voices.find(voice => voice.default) || voices[0];
      if (!voice) { status.textContent = 'No English voice is available yet. Try again or enable an English voice on your device.'; return; }
      // Speak the word, not IPA or English respelling: browser TTS cannot reliably parse those.
      const speech = new SpeechSynthesisUtterance(current.word);
      speech.voice = voice;
      speech.lang = voice.lang;
      speech.rate = 0.85;
      utterance = speech;
      refreshAudio();
      status.textContent = `Voice: ${voice.name} (${voice.lang}). Approximate audio; regional IPA may differ.`;
      speech.onend = () => { if (utterance === speech) { utterance = null; refreshAudio(); } };
      speech.onerror = () => {
        if (utterance !== speech) return;
        utterance = null;
        refreshAudio();
        status.textContent = 'Playback failed. Try again or check your device’s speech settings.';
      };
      try { synth.speak(speech); } catch { speech.onerror(); }
    });
    if (audioSupported) {
      synth.getVoices();
      synth.addEventListener('voiceschanged', refreshAudio);
      window.addEventListener('pagehide', stopAudio);
    }
    const update = () => {
      stopAudio();
      clearTimeout(copyTimer);
      status.textContent = defaultStatus;
      current = translate(input.value, accent.value);
      refreshAudio();
      availableWord.value = current.word || '';
      document.querySelector('#count').textContent = `${input.value.length} / 50`;
      document.querySelector('#result-label').textContent = `${accents[accent.value].name.toUpperCase()} PRONUNCIATION`;
      ipa.textContent = current.ipa || (current.empty ? '…' : '—');
      guide.textContent = current.guide || '';
      message.textContent = current.error || current.note || '';
      copy.disabled = !current.ipa;
      document.querySelectorAll('[data-word]').forEach(button => button.classList.toggle('selected', button.dataset.word === current.word));
      this.events.emit('pronunciation', current);
    };
    input.addEventListener('input', update);
    availableWord.addEventListener('change', () => {
      input.value = availableWord.value;
      update();
    });
    input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); update(); } });
    accent.addEventListener('change', update);
    document.querySelector('#clear').addEventListener('click', () => { input.value = ''; update(); input.focus(); });
    document.querySelector('#word-total').textContent = words.length;
    const supported = document.querySelector('#supported');
    words.forEach(word => {
      const option = document.createElement('option');
      option.value = word;
      option.textContent = word;
      availableWord.append(option);
      const button = document.createElement('button');
      button.textContent = word;
      button.dataset.word = word;
      supported.append(button);
    });
    document.querySelectorAll('[data-word]').forEach(button => button.addEventListener('click', () => {
      input.value = button.dataset.word;
      update();
      input.focus();
    }));
    copy.addEventListener('click', async () => {
      if (!current.ipa) return;
      try {
        await navigator.clipboard.writeText(`${current.word} · ${accents[accent.value].name}: ${current.ipa} (${current.guide})`);
        status.textContent = 'Pronunciation copied!';
      } catch { status.textContent = 'Could not copy. Select the pronunciation to copy it manually.'; }
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { status.textContent = defaultStatus; }, 4000);
    });
    update();
    document.querySelector('#engine-status')?.remove();
  }
}

// Phaser owns the application scene and translation events. Native DOM controls
// preserve text selection, keyboard access, screen readers, and mobile keyboards.
const host = document.createElement('div');
host.id = 'phaser-engine';
host.setAttribute('aria-hidden', 'true');
document.body.append(host);
new Phaser.Game({
  type: Phaser.HEADLESS,
  width: 1,
  height: 1,
  parent: host,
  banner: false,
  audio: { noAudio: true },
  fps: { target: 24 },
  scene: TranslatorScene,
});
} catch (error) {
  controls.forEach(control => { control.disabled = true; });
  document.querySelector('#status').textContent = window.location.protocol === 'file:'
    ? 'Open this app through a static web server to load the JSON files.'
    : 'Unable to start the app. Check the connection, src/accents.json, and src/pronunciations.json, then reload.';
  console.error('Accent startup failed:', error);
}
})();
