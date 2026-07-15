import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const projectFile = (path) => new URL(`../${path.replace(/^\//, '')}`, import.meta.url);

test('every manifest audio file exists', async () => {
  const manifest = JSON.parse(await readFile(projectFile('public/assets/audio/manifest.json'), 'utf8'));
  const paths = [];

  for (const entry of Object.values(manifest.events)) {
    if (entry.file) paths.push(entry.file);
    if (entry.files) paths.push(...entry.files);
  }
  for (const entry of Object.values(manifest.music)) paths.push(entry.file);
  for (const entry of Object.values(manifest.ambience)) paths.push(entry.file);

  await Promise.all(paths.map((path) => readFile(projectFile(`public${path}`))));
});

test('SFX files are organized into base, alt, and modern folders', async () => {
  const sfxDirectory = projectFile('public/assets/audio/sfx/');
  const rootEntries = await readdir(sfxDirectory, { withFileTypes: true });
  assert.equal(rootEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.wav')).length, 0);

  const expectedCounts = { base: 14, alt: 12, modern: 13 };
  for (const [folder, expected] of Object.entries(expectedCounts)) {
    const files = (await readdir(new URL(`${folder}/`, sfxDirectory))).filter((file) => file.endsWith('.wav'));
    assert.equal(files.length, expected, `${folder} WAV count`);
  }

  const manifest = JSON.parse(await readFile(projectFile('public/assets/audio/manifest.json'), 'utf8'));
  for (const entry of Object.values(manifest.events)) {
    entry.files.forEach((path, index) => {
      const expectedFolder = entry.variantStyles[index] === 'modern-16bit'
        ? '/modern/'
        : path.endsWith('-alt.wav') ? '/alt/' : '/base/';
      assert.ok(path.includes(expectedFolder), `${path} must live in ${expectedFolder}`);
    });
  }
});

test('four CC0 ambience alternatives are valid Ogg loops', async () => {
  const manifest = JSON.parse(await readFile(projectFile('public/assets/audio/manifest.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest.ambience).sort(), [
    'berlin-outside', 'city-night', 'ubahn-wind', 'waiting-room-ambient'
  ]);

  let ambienceBytes = 0;
  for (const [trackId, entry] of Object.entries(manifest.ambience)) {
    const data = await readFile(projectFile(`public${entry.file}`));
    ambienceBytes += data.length;
    assert.equal(data.toString('ascii', 0, 4), 'OggS', `${trackId} must be an Ogg stream`);
    assert.equal(entry.loop, true, `${trackId} must be marked as a loop`);
    assert.equal(entry.license, 'CC0-1.0');
    assert.match(entry.source, /^https:\/\/opengameart\.org\/content\//);
  }
  assert.ok(ambienceBytes < 1_600_000, `ambience pack is unexpectedly large: ${ambienceBytes} bytes`);
});

test('generated SFX are unsigned 8-bit mono PCM at 22.05 kHz', async () => {
  const manifest = JSON.parse(await readFile(projectFile('public/assets/audio/manifest.json'), 'utf8'));
  const wavPaths = Object.values(manifest.events).flatMap((entry) => (
    entry.files.filter((_, index) => entry.variantStyles[index] === 'retro-8bit')
  ));

  for (const path of wavPaths) {
    const data = await readFile(projectFile(`public${path}`));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF', path);
    assert.equal(data.toString('ascii', 8, 12), 'WAVE', path);
    assert.equal(data.readUInt16LE(20), 1, `${path} must use PCM`);
    assert.equal(data.readUInt16LE(22), 1, `${path} must be mono`);
    assert.equal(data.readUInt32LE(24), 22050, `${path} sample rate`);
    assert.equal(data.readUInt16LE(34), 8, `${path} bit depth`);
    assert.ok(data.length > 44, `${path} must contain samples`);
  }
});

test('every event has a modern signed 16-bit mono WAV at 44.1 kHz', async () => {
  const manifest = JSON.parse(await readFile(projectFile('public/assets/audio/manifest.json'), 'utf8'));
  const modernPaths = Object.values(manifest.events).map((entry) => {
    const index = entry.variantStyles.indexOf('modern-16bit');
    assert.notEqual(index, -1);
    return entry.files[index];
  });
  assert.equal(modernPaths.length, 13);
  assert.equal(new Set(modernPaths).size, 13);

  for (const path of modernPaths) {
    const data = await readFile(projectFile(`public${path}`));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF', path);
    assert.equal(data.toString('ascii', 8, 12), 'WAVE', path);
    assert.equal(data.readUInt16LE(20), 1, `${path} must use PCM`);
    assert.equal(data.readUInt16LE(22), 1, `${path} must be mono`);
    assert.equal(data.readUInt32LE(24), 44100, `${path} sample rate`);
    assert.equal(data.readUInt16LE(34), 16, `${path} bit depth`);
  }
});

test('intro and outro are original signed 16-bit mono music WAVs at 44.1 kHz', async () => {
  const manifest = JSON.parse(await readFile(projectFile('public/assets/audio/manifest.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest.music).sort(), [
    'intro-pfand-und-circumstance', 'outro-formular-finale'
  ]);
  for (const [trackId, entry] of Object.entries(manifest.music)) {
    const data = await readFile(projectFile(`public${entry.file}`));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF', trackId);
    assert.equal(data.toString('ascii', 8, 12), 'WAVE', trackId);
    assert.equal(data.readUInt16LE(20), 1, `${trackId} must use PCM`);
    assert.equal(data.readUInt16LE(22), 1, `${trackId} must be mono`);
    assert.equal(data.readUInt32LE(24), 44100, `${trackId} sample rate`);
    assert.equal(data.readUInt16LE(34), 16, `${trackId} bit depth`);
    assert.equal(entry.loop, false);
    assert.equal(entry.license, 'Original project asset');
  }
});

test('manifest covers the complete MVP event contract and stays hackathon-small', async () => {
  const manifest = JSON.parse(await readFile(projectFile('public/assets/audio/manifest.json'), 'utf8'));
  const requiredEvents = [
    'loose-bottle-collected', 'bin-bottles', 'bin-burn', 'bottles-redeemed',
    'food-bought', 'food-denied', 'day-failed', 'day-survived', 'won', 'lost',
    'ui-start', 'step', 'day-night-sting'
  ];
  assert.deepEqual(Object.keys(manifest.events).sort(), requiredEvents.sort());
  assert.equal(manifest.events.step.defaultEnabled, false);
  assert.equal(manifest.ambience['city-night'].license, 'CC0-1.0');
  for (const [eventId, entry] of Object.entries(manifest.events)) {
    assert.equal(entry.files?.length, 3, `${eventId} must have three rotating WAV variants`);
    assert.equal(new Set(entry.files).size, 3, `${eventId} variants must be unique`);
    assert.deepEqual(entry.variantStyles, ['retro-8bit', 'retro-8bit', 'modern-16bit']);
  }

  const sfxPaths = Object.values(manifest.events).flatMap((entry) => entry.files || [entry.file]);
  const sfxBytes = (await Promise.all(
    sfxPaths.map((path) => readFile(projectFile(`public${path}`)))
  )).reduce((sum, data) => sum + data.length, 0);
  const ambienceBytes = (await Promise.all(
    Object.values(manifest.ambience).map((entry) => readFile(projectFile(`public${entry.file}`)))
  )).reduce((sum, data) => sum + data.length, 0);
  const musicBytes = (await Promise.all(
    Object.values(manifest.music).map((entry) => readFile(projectFile(`public${entry.file}`)))
  )).reduce((sum, data) => sum + data.length, 0);

  assert.ok(sfxBytes < 1_400_000, `SFX pack is unexpectedly large: ${sfxBytes} bytes`);
  assert.ok(sfxBytes + ambienceBytes + musicBytes < 4_000_000, 'all audio must remain under 4 MB');
});

test('license ledger records the shipped ambience and non-shipped reference pack', async () => {
  const ledger = await readFile(projectFile('public/assets/audio/SOURCES.md'), 'utf8');
  assert.match(ledger, /Scifi City - Ambient Loop/);
  assert.match(ledger, /TinyWorlds/);
  assert.match(ledger, /CC0 1\.0/);
  assert.match(ledger, /512 Sound Effects \(8-bit style\)/);
  assert.match(ledger, /not\s+redistributed/i);
  assert.match(ledger, /generate-modern-sfx\.mjs/);
  assert.match(ledger, /signed 16-bit PCM/);
  assert.match(ledger, /generate-theme-music\.mjs/);
  assert.match(ledger, /Pfand and pomp/);
  assert.match(ledger, /AMB Outside 1/);
  assert.match(ledger, /wind whoosh loop/);
  assert.match(ledger, /Two Simple Game Music Loops/);
});

test('dialogue locales use unique IDs and required event buckets', async () => {
  const requiredEvents = [
    'character-intro', 'bin-burn', 'bin-bottles', 'food-bought',
    'food-denied', 'day-failed', 'won', 'lost'
  ];
  const characterIds = ['prompt-engineer', 'head-of-marketing', 'qa-engineer'];

  for (const locale of ['en', 'de']) {
    const lines = JSON.parse(await readFile(projectFile(`public/assets/audio/dialogue-lines.${locale}.json`), 'utf8'));
    const ids = new Set(lines.map((line) => line.id));
    const events = new Set(lines.map((line) => line.event));

    assert.equal(ids.size, lines.length, `${locale} dialogue IDs must be unique`);
    for (const event of requiredEvents) assert.ok(events.has(event), `${locale} is missing ${event}`);
    const introIds = lines.filter((line) => line.event === 'character-intro').map((line) => line.characterId);
    assert.deepEqual(introIds.sort(), characterIds.sort(), `${locale} must cover all three character intros`);
    for (const line of lines) assert.ok(line.text.length <= 54, `${line.id} is too long for a short bubble`);
  }
});
