# Pandorium Database Migration Plan

## Current Result

The Campfire project was rebuilt from the authenticated project index plus public rendered-page fallbacks:

- 101 records imported.
- 13 timeline events imported, with all 13 dates recovered.
- Raw merged capture saved as `campfire_private_capture_merged.json` and copied into the vault's `_data/` folder.
- Clean Obsidian vault generated at `Pandorium_Obsidian_Vault/`.
- Fixed Markdown templates generated for every imported Campfire category in `_Templates/`.
- Campfire-style visual timeline canvases generated in `_Canvases/`.

The public Campfire project remains available at:

https://www.campfirewriting.com/write/public/story/659b388d366efbc6ae6a49ad/project

One Arc, `Ζήλων`, is preserved from the authenticated index, but its detail route did not load during capture. Its note is marked as index-only so it can be completed manually.

## Imported Modules

| Module | Count |
| --- | ---: |
| Characters | 25 |
| Locations | 28 |
| Timeline | 13 |
| Arcs | 1 |
| Encyclopedia | 13 |
| Species | 9 |
| Items | 5 |
| Religions | 2 |
| Manuscript | 1 |
| Maps | 1 |
| Relationships | 1 |
| Magic | 1 |
| Systems | 1 |

## Data Model

Each Campfire item is a Markdown note with readable headings and tables. Technical capture data is stored separately in `_data/campfire_capture_merged.json`, so the notes do not display a large metadata block.

Each category now has a fixed note template. For example, all 25 character notes use the same sections: Main Profile, Personality Charts, Bio, Physical Traits, Statistics, Images, Links, and Database Hierarchy. The Campfire slider trait labels from Aggression through Choleric were removed from the visible character notes because the captured pages exposed the labels but no slider values.

Any note can link to any other note:

```md
Ο Θρέων γεννήθηκε στο [[Locations/Κασλάρ|Κασλάρ]].
```

This keeps the structure flexible enough for universal parent, child, and related links later. A character can belong to a location, an item can belong to a religion, and a timeline event can link to any of them.

Locations additionally include a Location Hierarchy table with Parent Locations and Sublocations fields, so a place can contain other places without changing the template.

The logged-in Campfire timeline selector showed three pages: Throwback Saga, Reconciliation Saga, and Action Saga. The captured visible events all belonged to the Throwback Saga view, so that canvas is populated and the other two canvases are present as ready-to-fill timeline pages.

## Vault Structure

```text
Pandorium_Obsidian_Vault/
  Pandorium.md
  Characters/
  Locations/
  Timeline/
  Arcs/
  Encyclopedia/
  Species/
  Items/
  Religions/
  Manuscript/
  Maps/
  Relationships/
  Magic/
  Systems/
  _Canvases/
    Timeline Overview.canvas
    Timeline - Throwback Saga.canvas
    Timeline - Reconciliation Saga.canvas
    Timeline - Action Saga.canvas
  _Indexes/
    Timeline.md
  _Templates/
    Character.md
    Location.md
    Timeline Event.md
    ...
  _data/
    campfire_capture_merged.json
```

## GitHub Workflow

1. Open `Pandorium_Obsidian_Vault` in Obsidian.
2. Create a private GitHub repository for the vault.
3. Commit the vault with GitHub Desktop, command-line Git, or the Obsidian Git plugin.
4. Use Obsidian for writing and GitHub for backup, history, and remote updates.

## Future App

If Obsidian eventually feels limiting, a custom app can read the same Markdown and JSON files. Possible later features include a typed relationship graph, Campfire-style panels, universal nesting, search, a timeline visualizer, relationship editing, maps, and JSON import/export.

## Remaining Limits

Campfire's internal backup format, private attachments, and some hidden panel metadata were not available through the rendered pages. Images and files therefore remain a later migration task. The raw capture is preserved so a future native backup can be compared before replacing anything.
