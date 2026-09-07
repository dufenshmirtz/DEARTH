import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();

function readJson(fileName) {
  const filePath = path.join(workspace, fileName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const privateSources = [
  ['campfire_private_capture_direct.json', readJson('campfire_private_capture_direct.json')],
  ['campfire_private_capture_part2.json', readJson('campfire_private_capture_part2.json')],
  ['campfire_private_capture_part3.json', readJson('campfire_private_capture_part3.json')],
].filter(([, value]) => value);
const publicSource = readJson('campfire_public_capture_fast.json');

if (!privateSources.length || !publicSource) {
  throw new Error('Expected the private and public Campfire capture files in the workspace.');
}

function meaningfulText(value) {
  return String(value || '')
    .replace(/Bookshop Cart|Your cart is empty|Browse books under the|Find More Books/gi, '')
    .replace(/This panel is read-only|No image has been added\.|No links found\.|No list items found\./gi, '')
    .replace(/Start by adding some panels\.|This section is empty\./gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCartOrShell(capture) {
  const text = `${capture.detailText || ''}\n${capture.rawText || ''}`;
  return /Bookshop Cart|Your cart is empty|Browse books under the\s+Read\s+tab/i.test(text);
}

function isGeneric(capture) {
  const text = String(capture.detailText || '');
  return /Start by adding some panels|This section is empty|Use this summary box|When blocks are added/i.test(text);
}

function panelValueCount(capture) {
  return (capture.panels || []).reduce((count, panel) => {
    const fields = (panel.fields || []).filter((field) => meaningfulText(field.value ?? field.text));
    const text = meaningfulText(panel.text || (panel.looseItems || []).join(' '));
    return count + fields.length + (text ? 1 : 0);
  }, 0);
}

function scoreCapture(capture) {
  const detailLength = meaningfulText(capture.detailText).length;
  const panels = (capture.panels || []).length;
  const values = panelValueCount(capture);
  let score = Math.min(detailLength / 80, 55) + panels * 14 + values * 10;
  if (capture.timeline?.connectionDate) score += 120;
  if (capture.captureWarning) score -= 90;
  if (isCartOrShell(capture)) score -= 240;
  if (isGeneric(capture)) score -= 35;
  if (capture.captureSource === 'private-authenticated') score += 8;
  return score;
}

function itemKey(item) {
  return `${item.module}\u0000${item.id}\u0000${item.order}`;
}

function candidateMatches(item, capture) {
  return capture.id === item.id && capture.module === item.module;
}

function extractTimelineDate(capture) {
  const text = `${capture.timeline?.connectionDate || ''}\n${capture.detailText || ''}`;
  return text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{1,4}\s+CE\b/)?.[0] || '';
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCapture(capture, item, source) {
  const output = { ...clone(capture) };
  output.id = item.id;
  output.module = item.module;
  output.name = item.name;
  output.capturedName = item.name;
  output.order = item.order;
  output.sameIdIndex = item.sameIdIndex ?? 0;
  output.url = item.url;
  output.captureSource = source;
  return output;
}

const canonicalItems = [];
const itemByKey = new Map();
for (const source of privateSources) {
  for (const item of source[1].items || []) {
    const key = itemKey(item);
    if (!itemByKey.has(key) || source[0].includes('part3')) {
      itemByKey.set(key, { ...item });
    }
  }
}
for (const item of [...itemByKey.values()].sort((a, b) => a.order - b.order)) {
  canonicalItems.push(item);
}

const privateCandidates = privateSources.flatMap(([fileName, source]) =>
  (source.captures || []).map((capture) => ({
    ...capture,
    captureSource: 'private-authenticated',
    sourceFile: fileName,
  })),
);
const publicCandidates = (publicSource.captures || []).map((capture) => ({
  ...capture,
  captureSource: 'public-fallback',
  sourceFile: 'campfire_public_capture_fast.json',
}));

const mergedCaptures = [];
for (const item of canonicalItems) {
  const privateMatches = privateCandidates.filter((capture) => candidateMatches(item, capture));
  const publicMatches = publicCandidates.filter((capture) => candidateMatches(item, capture));
  const allMatches = [...privateMatches, ...publicMatches];
  const ranked = [...allMatches].sort((a, b) => scoreCapture(b) - scoreCapture(a));
  const best = ranked[0];

  let merged;
  if (best) {
    merged = normalizeCapture(best, item, best.captureSource);
  } else {
    merged = normalizeCapture({
      detailText: '',
      panels: [],
      timeline: {},
      captureWarning: 'No Campfire detail page was captured; the item is preserved from the authenticated project index.',
    }, item, 'private-index-only');
  }

  const privateWithDate = privateMatches.find((capture) => capture.timeline?.connectionDate);
  const anyWithDate = [...privateMatches, ...publicMatches].find((capture) => extractTimelineDate(capture));
  if (privateWithDate || anyWithDate) {
    const connectionDate = privateWithDate?.timeline?.connectionDate || extractTimelineDate(anyWithDate);
    merged.timeline = {
      ...(merged.timeline || {}),
      connectionDate,
    };
    if (merged.captureSource === 'public-fallback' && !privateWithDate) merged.captureSource = 'public-fallback+date';
    if (merged.captureSource === 'public-fallback' && privateWithDate) merged.captureSource = 'public-fallback+private-date';
  }

  const richestPublic = [...publicMatches].sort((a, b) => meaningfulText(b.detailText).length - meaningfulText(a.detailText).length)[0];
  const privatePanelCapture = privateMatches
    .filter((capture) => panelValueCount(capture) > 0)
    .sort((a, b) => scoreCapture(b) - scoreCapture(a))[0];
  if (privatePanelCapture && richestPublic && meaningfulText(richestPublic.detailText).length > meaningfulText(merged.detailText).length * 1.35) {
    merged.detailText = richestPublic.detailText;
    merged.rawText = richestPublic.rawText;
    merged.fullTextLength = richestPublic.fullTextLength;
    merged.captureSource = merged.captureSource.includes('private')
      ? 'private-panels+public-detail'
      : `${merged.captureSource}+private-panels`;
    if (!merged.panels?.length) merged.panels = clone(privatePanelCapture.panels || []);
  }

  merged.name = item.name;
  merged.capturedName = item.name;
  mergedCaptures.push(merged);
}

const privateErrors = privateSources.flatMap(([fileName, source]) =>
  (source.errors || []).map((error) => ({ ...error, sourceFile: fileName })),
);

const arcItem = canonicalItems.find((item) => item.module === 'Arcs');
if (arcItem && !mergedCaptures.some((capture) => itemKey(capture) === itemKey(arcItem))) {
  mergedCaptures.push(normalizeCapture({
    detailText: '',
    panels: [],
    timeline: {},
    captureWarning: 'The Arc detail route did not load during capture. The authenticated project index preserved the item and its name.',
  }, arcItem, 'private-index-only'));
}

mergedCaptures.sort((a, b) => a.order - b.order);

const canonicalByKey = new Map(canonicalItems.map((item) => [itemKey(item), item]));
const canonicalByOrder = new Map(canonicalItems.map((item) => [item.order, item]));
for (const capture of mergedCaptures) {
  const canonical = canonicalByKey.get(itemKey(capture)) || canonicalByOrder.get(capture.order);
  if (canonical) {
    capture.name = canonical.name;
    capture.capturedName = canonical.name;
    capture.url = canonical.url;
  }
}

const output = {
  source: 'Campfire authenticated index plus public rendered fallback',
  storyId: privateSources[0][1].storyId || publicSource.storyId,
  updatedAt: new Date().toISOString(),
  totalItems: canonicalItems.length,
  items: canonicalItems,
  captures: mergedCaptures,
  errors: privateErrors,
};

fs.writeFileSync(
  path.join(workspace, 'campfire_private_capture_merged.json'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
);

const sourceCounts = mergedCaptures.reduce((counts, capture) => {
  counts[capture.captureSource] = (counts[capture.captureSource] || 0) + 1;
  return counts;
}, {});
console.log(JSON.stringify({ totalItems: output.totalItems, captures: mergedCaptures.length, sourceCounts, errors: privateErrors.length }, null, 2));
