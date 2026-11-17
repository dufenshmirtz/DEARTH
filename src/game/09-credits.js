// ---------- Credits (main menu: Options > Credits) ----------
// Everything the screen lists. Each section has a heading and its lines; a line is either plain text
// or { name, note } (name in the display face, note under it in the book face).
// Before release: replace the placeholder soundtrack line with the composer, and add any asset the
// third-party audit turns up (every Pixabay sound that needs a name, art, etc.).
const CREDITS_SECTIONS = [
  {
    heading: "A game by",
    team: true,
    lines: [{ name: "TheodenKink" }, { name: "Omagkas" }, { name: "Dufenshmirtz" }]
  },
  {
    heading: "Seal designs",
    lines: [
      { name: "Giannis Chrysomallis", note: "Seal of Zilon" },
      { name: "Thanasis Chrysomallis", note: "Seal of Kalha" },
      { name: "Iro Hartopoulou", note: "Seal of Padma" },
      { name: "Zoe Tatsoglou", note: "Seal of Petros & Pavlos" },
      { name: "Maria Xaralampou", note: "Seal of Serafeim" },
      { name: "TheodenKink", note: "Seal of Dantre" },
      { name: "skarnatis", note: "Seal of Pyros" },
      { name: "Dufenshmirtz", note: "Seal of Threon" }
    ]
  },
  {
    heading: "Music",
    lines: [{ name: "Hell Is Round the Corner", note: "Tricky · placeholder for the playtest" }]
  },
  {
    heading: "Sound",
    lines: [
      { name: "Dragon Studio", note: "Pixabay" },
      { name: "Universfield", note: "Pixabay" },
      { name: "IdoBerg", note: "Pixabay" },
      { name: "SoundReality", note: "Pixabay" },
      { name: "DJARTMUSIC", note: "Pixabay" },
      { name: "EduFigueres (Freesound)", note: "Pixabay" },
      { name: "freesound_gamestudio", note: "Pixabay" },
      { name: "Additional sound effects", note: "Pixabay contributors" }
    ]
  },
  {
    heading: "Fonts",
    lines: [
      { name: "Razor Keen", note: "Ray Larabie, Typodermic Fonts · CC0" },
      { name: "Alegreya", note: "The Alegreya Project Authors, Huerta Tipográfica · SIL Open Font License 1.1" }
    ]
  }
];

const CREDITS_CLOSING_LINE = "Thank you for playing, sinner.";

function renderCreditsMenu() {
  const line = (entry) => typeof entry === "string"
    ? `<li class="credits-line"><span class="credits-note">${escapeHtml(entry)}</span></li>`
    : `<li class="credits-line"><span class="credits-name">${escapeHtml(entry.name)}</span>${entry.note ? `<span class="credits-note">${escapeHtml(entry.note)}</span>` : ""}</li>`;
  const sections = CREDITS_SECTIONS.map((section) => `
      <section class="credits-section${section.team ? " credits-team" : ""}">
        <h3 class="credits-heading">${escapeHtml(section.heading)}</h3>
        <ul class="credits-lines">${section.lines.map(line).join("")}</ul>
      </section>`).join("");
  return `
    <div class="records-menu credits-menu">
      <h2 class="records-title credits-title">Credits</h2>
      <div class="credits-scroll">
        ${sections}
        <p class="credits-closing">${escapeHtml(CREDITS_CLOSING_LINE)}</p>
      </div>
      <button class="menu-button secondary-menu-button" data-menu-action="options">Back</button>
    </div>
  `;
}
