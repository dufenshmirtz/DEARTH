import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const mergedPath = path.join(workspace, 'campfire_private_capture_merged.json');
const fallbackPath = path.join(workspace, 'campfire_public_capture_fast.json');
const inputPath = fs.existsSync(mergedPath) ? mergedPath : fallbackPath;
const outputDir = path.join(workspace, 'Pandorium_Obsidian_Vault');
const dataDir = path.join(outputDir, '_data');
const templateDir = path.join(outputDir, '_Templates');
const canvasDir = path.join(outputDir, '_Canvases');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const captures = [...(data.captures || [])].sort((a, b) => (a.order ?? a.sequence ?? 0) - (b.order ?? b.sequence ?? 0));

const TIMELINE_PAGES = ['Throwback Saga', 'Reconciliation Saga', 'Action Saga'];
const DEFAULT_TIMELINE_PAGE = 'Throwback Saga';

const CHARACTER_TRAIT_FIELDS = [
  'Aggression',
  'Confidence',
  'Honesty',
  'Passion',
  'Drive',
  'Enthusiasm',
  'Tolerance',
  'Extraversion',
  'Agreeableness',
  'Openness',
  'Neuroticism',
  'Intuitive',
  'Thinking',
  'Feeling',
  'Observant',
  'Judging',
  'Assertive',
  'Turbulent',
  'Choleric',
];

const CHARACTER_MAIN_FIELDS = [
  'Full Name',
  'Given Name',
  'Nickname',
  'Former Names',
  'Role',
  'Gender',
  'Age',
  'Birthday',
  'Birthplace',
  'Place of Residence',
  'Social Class',
  'Religion (Sect)',
];

const CHARACTER_PERSONALITY_ROWS = [
  ['Psychosynthesis Chart', ['Basic Psychosynthesis Chart', 'Psychosynthesis Chart']],
  ['Political Chart', ['Political Chart']],
  ['Imawa Chart', ['Imawa Chart']],
];

const LOCATION_DETAIL_FIELDS = [
  'Location Type',
  'Location Age',
  'Date Created/Built',
  'Previous Use',
  'Location Significance',
];

const LOCATION_BASIC_FIELDS = [
  'Area',
  'Ethnic Groups',
  'Languages',
  'Population',
  'Average Temperature',
  'Biome',
  'Natural Resources',
  'Aliases',
];

const SPECIES_FIELDS = [
  'Common Name',
  'Scientific Name',
  'Strengths',
  'Weaknesses',
  'Origin',
  'Native Habitat',
  'Avg. Height',
  'Avg. Weight',
  'Population',
  'Endangerment',
];

const SIMPLE_MODULE_SECTIONS = {
  Manuscript: ['Manuscript', 'Notes'],
  Maps: ['Map Details', 'Pins', 'Notes'],
  Arcs: ['Arc Details', 'Stages', 'Notes'],
  Relationships: ['Relationship Web', 'Notes'],
  Encyclopedia: ['Details', 'Notes'],
  Items: ['Item Details', 'Description', 'History', 'Notes'],
  Systems: ['System Details', 'Structure', 'Notes'],
  Religions: ['Religion Details', 'Beliefs', 'Practices', 'History', 'Notes'],
};

const TEMPLATE_FILE_NAMES = {
  Manuscript: 'Manuscript Section.md',
  Characters: 'Character.md',
  Locations: 'Location.md',
  Maps: 'Map.md',
  Timeline: 'Timeline Event.md',
  Arcs: 'Arc.md',
  Relationships: 'Relationship Web.md',
  Encyclopedia: 'Encyclopedia Article.md',
  Magic: 'Magic.md',
  Species: 'Species.md',
  Items: 'Item.md',
  Systems: 'System.md',
  Religions: 'Religion.md',
};

function safeFilename(value) {
  const cleaned = String(value || 'Untitled')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
  return cleaned || 'Untitled';
}

function moduleSlug(moduleName) {
  return safeFilename(moduleName);
}

function captureKey(item) {
  return `${item.module}\u0000${item.id}\u0000${item.order ?? item.sequence ?? ''}`;
}

function normalizeLabel(value) {
  return String(value || '')
    .replace(/\uFEFF/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const OMIT_CHARACTER_FIELDS = new Set(CHARACTER_TRAIT_FIELDS.map(normalizeLabel));

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeTable(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>')
    .trim();
}

const nameCounts = new Map();
for (const capture of captures) {
  const key = `${capture.module}\u0000${capture.name}`;
  nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
}

const fileInfo = new Map();
for (const capture of captures) {
  const duplicate = nameCounts.get(`${capture.module}\u0000${capture.name}`) > 1;
  const suffix = duplicate ? ` - ${String(capture.id).slice(0, 8)}` : '';
  const baseName = `${safeFilename(capture.name)}${suffix}`;
  fileInfo.set(captureKey(capture), {
    moduleDir: moduleSlug(capture.module),
    baseName,
    relativePath: `${moduleSlug(capture.module)}/${baseName}.md`,
  });
}

const byName = new Map();
for (const capture of captures) {
  if (!byName.has(capture.name)) byName.set(capture.name, []);
  byName.get(capture.name).push(capture);
}
const linkNames = [...byName.keys()].sort((a, b) => b.length - a.length);

function linkFor(capture) {
  const info = fileInfo.get(captureKey(capture));
  return `[[${info.moduleDir}/${info.baseName}|${capture.name}]]`;
}

function convertCampfireLinks(text) {
  let output = String(text || '').replace(/[\uFEFF\u200B-\u200D]/g, '');
  for (const name of linkNames) {
    const targets = byName.get(name) || [];
    const target = targets.length === 1
      ? targets[0]
      : targets.find((item) => item.module === 'Characters')
        || targets.find((item) => item.module === 'Locations')
        || null;
    if (!target) continue;
    const info = fileInfo.get(captureKey(target));
    if (!info) continue;
    const replacement = `[[${info.moduleDir}/${info.baseName}|${name}]]`;
    const pattern = new RegExp(`@${escapeRegex(name)}(?=$|[\\s.,;:!?;)'\"]|\\n)`, 'gu');
    output = output.replace(pattern, replacement);
  }
  return output.trim();
}

function linkPlainName(value) {
  const text = String(value || '').replace(/[\uFEFF\u200B-\u200D]/g, '').trim();
  if (!text) return '';
  const targets = byName.get(text) || [];
  if (targets.length === 1) return linkFor(targets[0]);
  const preferred = targets.find((item) => item.module === 'Characters') || targets.find((item) => item.module === 'Locations');
  if (preferred) return linkFor(preferred);
  return convertCampfireLinks(text);
}

const hiddenLines = new Set([
  'Elements', 'Details', 'Dashboard', 'My Projects', 'File', 'Edit', 'View', 'Publish', 'Help',
  'Auto', 'Overview', 'Guidebook', 'Basics', 'Bookshop Cart', 'Your cart is empty',
  'No image has been added.', 'No links found.', 'No list items found.', 'This panel is read-only',
  'Start by adding some panels.', 'This section is empty.', 'Use this summary box to add a short summary.',
  'When blocks are added, they will appear here.', 'Lists help organize your work.',
  'Click', 'Add List Item', 'Add Stat', 'Select Images', 'Research', 'Calendar', 'Cultures',
  'Languages', 'Philosophies', 'Upgrade', '20 / 20 Events Left', '0 / 20 Events Left',
  'Add Panel', 'This page is empty.', 'Connection', 'Color Key', 'Manage Colors',
  'Canvas', 'Add Event', 'Search Events', 'Enter some text...', '6ο Πανεπιστήμιο',
  'Gh', 'New Species',
]);

const sidebarNames = new Set(captures.map((capture) => capture.name));
const moduleNames = new Set(captures.map((capture) => capture.module));

function cleanLines(text, item) {
  const source = String(text || '').replace(/\uFFFD/g, '').replace(/\uFEFF/g, '');
  const lines = source.split(/\r?\n/).map((line) => line.trim());
  const result = [];
  let skippedBreadcrumb = false;
  for (const line of lines) {
    if (!line) {
      if (result.length && result.at(-1) !== '') result.push('');
      continue;
    }
    if (!skippedBreadcrumb && /^.+\s*\/\s*.+$/.test(line)) {
      skippedBreadcrumb = true;
      continue;
    }
    if (hiddenLines.has(line)) continue;
    if (/^(Browse books under the|Read|Find More Books)/i.test(line)) continue;
    if (/^(Use panels to detail|Use the timeline|You're here to write|Every story requires research|Keep track of the dates|Culture permeates every aspect|Need a fictional language|Does your setting have an analogue|You're using the Free Version|What.s a strong character|Upload maps of your world|Characters and other story elements|Visualize the relationships|The Encyclopedia is|Is your magic system|The flora and fauna|Here you can store|Visually map the hierarchies|Create or detail your world)/i.test(line)) continue;
    if (/^(Links connect|Add Link|Upload new images|Image Gallery|Type here to add notes|To pick up a draggable item)/i.test(line)) continue;
    if (/^This panel is read-only/.test(line)) continue;
    if (line === item.name || line === item.module || sidebarNames.has(line) || moduleNames.has(line)) continue;
    result.push(line);
  }
  while (result.at(-1) === '') result.pop();
  return result;
}

function isFieldLine(line) {
  return /^.{1,80}:/.test(line) && !/^[^:]{1,20}:\/\//.test(line);
}

function parseFields(lines) {
  const fields = [];
  const notes = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const match = line.match(/^(.{1,80}?):\s*(.*)$/);
    if (!match || !isFieldLine(line)) {
      if (line) notes.push(line);
      index += 1;
      continue;
    }
    const label = match[1].trim().replace(/\s+$/, '');
    const values = [];
    if (match[2].trim()) values.push(match[2].trim());
    index += 1;
    while (index < lines.length && lines[index] !== '' && !isFieldLine(lines[index])) {
      if (lines[index].length > 180 || /[.!?]\s/.test(lines[index])) break;
      values.push(lines[index]);
      index += 1;
    }
    fields.push({ label, value: values.join(' ').replace(/\s+,\s*/g, ', ') });
  }
  return { fields, notes };
}

function panelFieldValue(field) {
  if (field == null) return '';
  if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') return String(field);
  if (Array.isArray(field)) return field.map(panelFieldValue).filter(Boolean).join(', ');
  return field.value ?? field.text ?? field.content ?? field.label ?? field.name ?? '';
}

function isPlaceholderText(value) {
  const text = String(value || '').trim();
  return !text || /^(Lists help organize your work|Use stats to detail|Upload new images|Click|Add List Item|Add Stat|Select Images|Add Panel|below to begin|to get started|Links connect|Add Link|Use panels to detail|Often considered the life of a good story|You're here to write|This page is empty|Type here to add notes|Enter some text)/i.test(text);
}

function panelTitle(panel, index) {
  const title = String(panel.title || '').trim();
  if (title && !/^New Panel$/i.test(title)) return title;
  if (panel.kind === 'Text') return 'Notes';
  if (panel.kind === 'Image') return 'Image';
  return panel.kind || `Panel ${index + 1}`;
}

function getPanel(capture, title) {
  const target = normalizeLabel(title);
  return (capture.panels || []).find((panel, index) => normalizeLabel(panelTitle(panel, index)) === target);
}

function fieldMapFromPanel(panel) {
  const values = new Map();
  for (const field of panel?.fields || []) {
    const label = field.label ?? field.name ?? field.key ?? 'Value';
    values.set(normalizeLabel(label), panelFieldValue(field.value ?? field.text ?? field.content ?? field));
  }
  return values;
}

const fallbackCache = new Map();
function fallbackParts(capture) {
  const key = captureKey(capture);
  if (fallbackCache.has(key)) return fallbackCache.get(key);
  const lines = cleanLines(capture.detailText, capture);
  const { fields, notes } = parseFields(lines);
  const date = capture.timeline?.connectionDate || '';
  const fieldMap = new Map(fields.map((field) => [normalizeLabel(field.label), field.value]));
  const noteLines = notes
    .filter((line) => line && line !== date && !isPlaceholderText(line))
    .filter((line) => !/^No (statistics|image|links|list)/i.test(line));
  const output = { fields, fieldMap, notes: noteLines.join('\n') };
  fallbackCache.set(key, output);
  return output;
}

function fieldValue(capture, labels, panelTitles = []) {
  const aliases = Array.isArray(labels) ? labels : [labels];
  for (const panelTitleName of panelTitles) {
    const map = fieldMapFromPanel(getPanel(capture, panelTitleName));
    for (const label of aliases) {
      const value = map.get(normalizeLabel(label));
      if (value != null && String(value).trim() !== '') return value;
    }
  }
  for (const panel of capture.panels || []) {
    const map = fieldMapFromPanel(panel);
    for (const label of aliases) {
      const normalized = normalizeLabel(label);
      if (OMIT_CHARACTER_FIELDS.has(normalized) && capture.module === 'Characters') continue;
      const value = map.get(normalized);
      if (value != null && String(value).trim() !== '') return value;
    }
  }
  const fallback = fallbackParts(capture);
  for (const label of aliases) {
    const value = fallback.fieldMap.get(normalizeLabel(label));
    if (value != null && String(value).trim() !== '') return value;
  }
  return '';
}

function listSectionValue(panel, labels) {
  const aliases = Array.isArray(labels) ? labels : [labels];
  for (const section of panel?.sections || []) {
    if (!aliases.some((label) => normalizeLabel(label) === normalizeLabel(section.title || section.name))) continue;
    return (section.items || section.values || [])
      .map((value) => panelFieldValue(value))
      .filter((value) => !isPlaceholderText(value))
      .join(', ');
  }
  return '';
}

function renderTable(fields) {
  const lines = ['| Field | Value |', '| --- | --- |'];
  for (const field of fields) {
    lines.push(`| ${escapeTable(field.label)} | ${escapeTable(convertCampfireLinks(panelFieldValue(field.value)))} |`);
  }
  return lines.join('\n');
}

function renderFieldTable(labels, valueFor) {
  return renderTable(labels.map((label) => ({ label, value: valueFor(label) || '' })));
}

function renderTextContent(capture, title) {
  const panel = getPanel(capture, title);
  const text = String(panel?.text || '').trim();
  if (text && !isPlaceholderText(text)) return convertCampfireLinks(text);
  const loose = (panel?.looseItems || [])
    .map((item) => panelFieldValue(item))
    .filter((item) => !isPlaceholderText(item));
  if (loose.length) return convertCampfireLinks(loose.join('\n\n'));
  return '';
}

function uniqueTextValues(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const text = String(value || '').replace(/[\uFEFF\u200B-\u200D]/g, '').trim();
    if (!text || isPlaceholderText(text) || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }
  return output;
}

function hasReadablePanelContent(capture) {
  return (capture.panels || []).some((panel) => {
    if ((panel.images || []).length) return true;
    if ((panel.fields || []).some((field) => String(panelFieldValue(field.value ?? field.text ?? field.content ?? field)).trim() !== '')) return true;
    if ((panel.sections || []).some((section) => (section.items || section.values || []).some((item) => !isPlaceholderText(panelFieldValue(item))))) return true;
    if ((panel.looseItems || []).some((item) => !isPlaceholderText(panelFieldValue(item)))) return true;
    return !isPlaceholderText(panel.text);
  });
}

function renderListContent(capture, title) {
  const panel = getPanel(capture, title);
  if (!panel) return '';
  const lines = [];
  for (const section of panel.sections || []) {
    const items = (section.items || section.values || [])
      .map((item) => panelFieldValue(item))
      .filter((item) => !isPlaceholderText(item));
    if (!items.length && !section.title && !section.name) continue;
    lines.push(`### ${section.title || section.name || 'Items'}`, '');
    for (const item of items) lines.push(`- ${convertCampfireLinks(item)}`);
    lines.push('');
  }
  if (!lines.length) {
    const text = String(panel.text || '').trim();
    if (text && !isPlaceholderText(text)) lines.push(convertCampfireLinks(text));
  }
  return lines.join('\n').trim();
}

function allImages(capture) {
  return (capture.panels || []).flatMap((panel) => panel.images || []);
}

function renderImages(capture) {
  const images = allImages(capture);
  if (!images.length) return '';
  return images
    .map((image) => {
      const source = image.url || image.src || image.name || panelFieldValue(image);
      return source && /^https?:\/\//i.test(source) ? `- ![](${source})` : `- ${source}`;
    })
    .join('\n');
}

function renderLinks(capture) {
  const values = [];
  for (const panel of capture.panels || []) {
    if (normalizeLabel(panelTitle(panel, 0)) === 'links') {
      values.push(...String(panel.text || '').split(/\r?\n/));
    }
    values.push(...(panel.links || []).map((link) => panelFieldValue(link)));
  }
  const seen = new Set();
  const lines = [];
  for (const value of values) {
    const text = String(value || '').replace(/[\uFEFF\u200B-\u200D]/g, '').trim();
    if (!text || isPlaceholderText(text) || seen.has(text)) continue;
    seen.add(text);
    lines.push(`- ${linkPlainName(text)}`);
  }
  return lines.join('\n');
}

function section(lines, title, body = '') {
  lines.push(`## ${title}`, '');
  if (body) lines.push(body, '');
}

function hierarchyTable(labels = ['Parent Items', 'Child Items', 'Related Items']) {
  return renderFieldTable(labels, () => '');
}

function characterValue(capture, label) {
  if (label === 'Full Name') return fieldValue(capture, ['Full Name'], ['Basic Information']) || capture.name;
  if (label === 'Given Name') return fieldValue(capture, ['Given Name', 'Full Name'], ['Basic Information']) || capture.name;
  return fieldValue(capture, [label], ['Basic Information']);
}

function renderCharacter(capture) {
  const lines = [];
  section(lines, 'Main Profile', renderFieldTable(CHARACTER_MAIN_FIELDS, (label) => characterValue(capture, label)));
  const personalityPanel = getPanel(capture, 'Personality Traits');
  section(lines, 'Personality Charts', renderTable(CHARACTER_PERSONALITY_ROWS.map(([label, aliases]) => ({
    label,
    value: listSectionValue(personalityPanel, aliases),
  }))));
  section(lines, 'Bio', renderTextContent(capture, 'Bio'));
  section(lines, 'Physical Traits', renderListContent(capture, 'Physical Traits'));
  section(lines, 'Statistics', renderListContent(capture, 'Statistics'));
  section(lines, 'Images', renderImages(capture));
  section(lines, 'Links', renderLinks(capture));
  section(lines, 'Database Hierarchy', hierarchyTable());
  return lines.join('\n').trim();
}

function renderLocation(capture) {
  const lines = [];
  section(lines, 'Location Details', renderFieldTable(LOCATION_DETAIL_FIELDS, (label) => fieldValue(capture, label, ['Location Details'])));
  section(lines, 'Location Hierarchy', hierarchyTable(['Parent Locations', 'Sublocations', 'Related Items']));
  section(lines, 'Overview', renderTextContent(capture, 'Overview'));
  section(lines, 'Geography', renderTextContent(capture, 'Geography'));
  section(lines, 'History', renderTextContent(capture, 'History'));
  section(lines, 'Government', renderTextContent(capture, 'Government'));
  section(lines, 'Basic Information', renderFieldTable(LOCATION_BASIC_FIELDS, (label) => fieldValue(capture, label, ['Basic Information'])));
  section(lines, 'Notes', hasReadablePanelContent(capture) ? '' : fallbackParts(capture).notes);
  section(lines, 'Links', renderLinks(capture));
  return lines.join('\n').trim();
}

function renderSpecies(capture) {
  const lines = [];
  section(lines, 'Basic Information', renderFieldTable(SPECIES_FIELDS, (label) => fieldValue(capture, label, ['Basic Information'])));
  section(lines, 'Description', renderTextContent(capture, 'Description') || fallbackParts(capture).notes);
  section(lines, 'Behavior & Reproduction', renderListContent(capture, 'Behavior & Reproduction'));
  section(lines, 'Ecology, Diet, & Predators', renderListContent(capture, 'Ecology, Diet, & Predators'));
  section(lines, 'History & Interactions', renderListContent(capture, 'History & Interactions'));
  section(lines, 'Images', renderImages(capture));
  section(lines, 'Links', renderLinks(capture));
  section(lines, 'Database Hierarchy', hierarchyTable());
  return lines.join('\n').trim();
}

function renderMagic(capture) {
  const lines = [];
  for (const title of ['Overview', 'Source', 'Costs', 'Limitations', 'History', 'Magical People & Places']) {
    section(lines, title, renderTextContent(capture, title) || renderListContent(capture, title));
  }
  section(lines, 'Links', renderLinks(capture));
  section(lines, 'Database Hierarchy', hierarchyTable());
  return lines.join('\n').trim();
}

function timelinePage(capture) {
  return capture.timeline?.pageName || capture.timeline?.timelineName || capture.timeline?.saga || DEFAULT_TIMELINE_PAGE;
}

function renderTimeline(capture) {
  const lines = [];
  section(lines, 'Timeline', renderTable([
    { label: 'Date', value: capture.timeline?.connectionDate || '' },
    { label: 'Timeline Page', value: timelinePage(capture) },
    { label: 'Sequence', value: String(capture.order ?? capture.sequence ?? '') },
  ]));
  const panelNotes = uniqueTextValues((capture.panels || [])
    .flatMap((panel) => [panel.text, ...(panel.looseItems || [])])
    .map((value) => panelFieldValue(value)))
    .join('\n\n');
  section(lines, 'Event Notes', convertCampfireLinks(panelNotes) || fallbackParts(capture).notes);
  section(lines, 'Links', renderLinks(capture));
  section(lines, 'Database Hierarchy', hierarchyTable());
  return lines.join('\n').trim();
}

function renderGeneric(capture) {
  const sections = SIMPLE_MODULE_SECTIONS[capture.module] || ['Details', 'Notes'];
  const lines = [];
  const fallback = fallbackParts(capture);
  let usedNotes = false;
  for (const title of sections) {
    let body = renderTextContent(capture, title) || renderListContent(capture, title);
    if (!body && /details/i.test(title) && fallback.fields.length) body = renderTable(fallback.fields);
    if (!body && title === 'Notes') {
      body = fallback.notes;
      usedNotes = true;
    }
    section(lines, title, body);
  }
  if (!usedNotes && fallback.notes) section(lines, 'Notes', fallback.notes);
  section(lines, 'Links', renderLinks(capture));
  section(lines, 'Database Hierarchy', hierarchyTable());
  return lines.join('\n').trim();
}

function noteCore(capture) {
  if (capture.module === 'Characters') return renderCharacter(capture);
  if (capture.module === 'Locations') return renderLocation(capture);
  if (capture.module === 'Species') return renderSpecies(capture);
  if (capture.module === 'Magic') return renderMagic(capture);
  if (capture.module === 'Timeline') return renderTimeline(capture);
  return renderGeneric(capture);
}

function noteBody(capture, options = {}) {
  const { template = false } = options;
  const sections = [`# ${capture.name}`, '', `Category: ${capture.module}`, '', noteCore(capture)];
  if (!template && capture.captureWarning) sections.push('', `> Capture note: ${capture.captureWarning}`);
  if (!template && capture.url) sections.push('', `Source: [Campfire](${capture.url})`);
  return `${sections.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

function indexBody() {
  const grouped = new Map();
  for (const capture of captures) {
    if (!grouped.has(capture.module)) grouped.set(capture.module, []);
    grouped.get(capture.module).push(capture);
  }
  const lines = [
    '# Pandorium', '',
    'Campfire project database rebuilt as an Obsidian vault.', '',
    `Records: ${captures.length}`, '',
    '## Modules', '',
    '| Module | Count |', '| --- | ---: |',
  ];
  for (const [moduleName, items] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| [[${moduleSlug(moduleName)}]] | ${items.length} |`);
  }
  lines.push('', '## Timeline Canvases', '');
  lines.push('- [[_Canvases/Timeline Overview.canvas|Timeline Overview]]');
  for (const page of TIMELINE_PAGES) lines.push(`- [[_Canvases/Timeline - ${page}.canvas|Timeline - ${page}]]`);
  lines.push('', '## Templates', '');
  for (const moduleName of Object.keys(TEMPLATE_FILE_NAMES)) {
    lines.push(`- [[_Templates/${TEMPLATE_FILE_NAMES[moduleName]}|${moduleName} template]]`);
  }
  lines.push('', '## Items', '');
  for (const [moduleName, items] of grouped) {
    lines.push(`### ${moduleName}`, '');
    for (const item of items) lines.push(`- ${linkFor(item)}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function moduleIndexBody(moduleName, items) {
  const templateName = TEMPLATE_FILE_NAMES[moduleName] || 'Generic Item.md';
  const lines = [`# ${moduleName}`, '', `Items: ${items.length}`, '', `Template: [[_Templates/${templateName}]]`, ''];
  for (const item of items) lines.push(`- ${linkFor(item)}`);
  return `${lines.join('\n')}\n`;
}

const monthOrder = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function timelineSortValue(event) {
  const date = event.timeline?.connectionDate || '';
  const match = date.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{1,4})\s+(CE|BCE|BC)$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const [, month, day, year, era] = match;
  const signedYear = /BC|BCE/.test(era) ? -Number(year) : Number(year);
  return signedYear * 10000 + monthOrder[month] * 100 + Number(day);
}

function timelineEvents() {
  return captures
    .filter((capture) => capture.module === 'Timeline')
    .sort((a, b) => timelineSortValue(a) - timelineSortValue(b));
}

function timelineIndexBody() {
  const events = timelineEvents();
  const lines = [
    '# Timeline', '',
    '## Visual Timelines', '',
    '- [[_Canvases/Timeline Overview.canvas|Timeline Overview]]',
  ];
  for (const page of TIMELINE_PAGES) lines.push(`- [[_Canvases/Timeline - ${page}.canvas|Timeline - ${page}]]`);
  lines.push('', '## Events', '', '| Date | Timeline Page | Event | Notes |', '| --- | --- | --- | --- |');
  for (const event of events) {
    const date = event.timeline?.connectionDate || '';
    const panelNote = uniqueTextValues((event.panels || [])
      .flatMap((panel) => [panel.text, ...(panel.looseItems || [])])
      .map((value) => panelFieldValue(value)))
      .join(' ');
    const note = panelNote || fallbackParts(event).notes || '';
    lines.push(`| ${escapeTable(date)} | ${escapeTable(timelinePage(event))} | ${linkFor(event)} | ${escapeTable(note.slice(0, 240))} |`);
  }
  return `${lines.join('\n')}\n`;
}

function canvasNodeId(prefix, value) {
  return `${prefix}-${String(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)}`;
}

function canvasEventText(event) {
  const date = event.timeline?.connectionDate || '';
  return `**${event.name}**\n${date}\n\n${linkFor(event)}`;
}

function buildTimelineCanvas(pageName = null) {
  const events = timelineEvents();
  const visiblePages = pageName ? [pageName] : TIMELINE_PAGES;
  const nodes = [];
  const edges = [];
  const cardWidth = 320;
  const cardHeight = 170;
  const stepX = 380;
  const rowGap = 230;
  const groupHeight = 570;
  const maxEvents = Math.max(1, events.length);
  const groupWidth = Math.max(760, (maxEvents - 1) * stepX + cardWidth + 220);

  visiblePages.forEach((page, pageIndex) => {
    const yBase = pageIndex * (groupHeight + 120);
    const pageEvents = events.filter((event) => timelinePage(event) === page);
    nodes.push({
      id: canvasNodeId('group', page),
      type: 'group',
      x: -90,
      y: yBase - 60,
      width: groupWidth,
      height: groupHeight,
      label: page,
      color: page === 'Throwback Saga' ? '6' : page === 'Reconciliation Saga' ? '4' : '2',
    });

    pageEvents.forEach((event, index) => {
      const id = canvasNodeId('event', `${page}-${event.id}`);
      const row = index % 2;
      const x = index * stepX;
      const y = yBase + row * rowGap;
      nodes.push({
        id,
        type: 'text',
        text: canvasEventText(event),
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        color: '1',
      });
      if (index > 0) {
        const previous = canvasNodeId('event', `${page}-${pageEvents[index - 1].id}`);
        edges.push({
          id: canvasNodeId('edge', `${previous}-${id}`),
          fromNode: previous,
          fromSide: 'right',
          toNode: id,
          toSide: 'left',
          color: '1',
        });
      }
    });
  });

  return `${JSON.stringify({ nodes, edges }, null, 2)}\n`;
}

function writeTemplates(grouped) {
  fs.mkdirSync(templateDir, { recursive: true });
  for (const moduleName of grouped.keys()) {
    const fileName = TEMPLATE_FILE_NAMES[moduleName] || `${safeFilename(moduleName)} Item.md`;
    const templateCapture = {
      id: `template-${moduleName}`,
      module: moduleName,
      name: '{{title}}',
      order: '',
      panels: [],
      detailText: '',
      timeline: moduleName === 'Timeline' ? { connectionDate: '', pageName: DEFAULT_TIMELINE_PAGE } : {},
      url: '',
    };
    fs.writeFileSync(path.join(templateDir, fileName), noteBody(templateCapture, { template: true }), 'utf8');
  }
}

function writeTimelineCanvases() {
  fs.mkdirSync(canvasDir, { recursive: true });
  fs.writeFileSync(path.join(canvasDir, 'Timeline Overview.canvas'), buildTimelineCanvas(), 'utf8');
  for (const page of TIMELINE_PAGES) {
    fs.writeFileSync(path.join(canvasDir, `Timeline - ${page}.canvas`), buildTimelineCanvas(page), 'utf8');
  }
}

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });
fs.copyFileSync(inputPath, path.join(dataDir, 'campfire_capture_merged.json'));

const grouped = new Map();
for (const capture of captures) {
  const info = fileInfo.get(captureKey(capture));
  const dir = path.join(outputDir, info.moduleDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, info.relativePath), noteBody(capture), 'utf8');
  if (!grouped.has(capture.module)) grouped.set(capture.module, []);
  grouped.get(capture.module).push(capture);
}

for (const [moduleName, items] of grouped) {
  fs.writeFileSync(path.join(outputDir, `${moduleSlug(moduleName)}.md`), moduleIndexBody(moduleName, items), 'utf8');
}
writeTemplates(grouped);
writeTimelineCanvases();
fs.writeFileSync(path.join(outputDir, 'Pandorium.md'), indexBody(), 'utf8');
fs.mkdirSync(path.join(outputDir, '_Indexes'), { recursive: true });
fs.writeFileSync(path.join(outputDir, '_Indexes', 'Timeline.md'), timelineIndexBody(), 'utf8');

console.log(`Exported ${captures.length} notes to ${outputDir}`);
