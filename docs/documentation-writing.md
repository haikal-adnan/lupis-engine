# Documentation writing standard

This standard defines how to write the in-editor documentation pages stored in [`editor/public/docs/`](../editor/public/docs/). Follow it for every new or updated page.

| Item | Value |
| :--- | :--- |
| Applies to | Every JSON page under `editor/public/docs/` |
| Audience | **Game developers** who build games with Lupis Engine, from beginners to experienced users. Not engine contributors. |
| Language | English (US spelling) |
| Menu version | **0.1.0**. The menu and submenus are fixed. See [Menu map](#2-menu-map-v010). |
| Component reference | [`cheatSheet.json`](../editor/public/docs/cheatSheet.json), rendered by [`DocsContent.vue`](../editor/src/features/docs/layouts/DocsContent.vue) |

---

## 1. Core principles

1. **Write for the game developer.** Explain what a feature does in the game and how to use it in the editor. Do not explain engine internals, stores, bridges, or source files.
2. **Be direct.** Put the most useful sentence first. Cut words that add nothing.
3. **Be clear for every skill level.** Beginners must be able to follow the page. Experienced users must be able to scan it and find the answer quickly.
4. **Link every related topic.** When you mention a feature that has its own page, link to that page (or to the exact section).
5. **Mix block types.** Use steps, tables, alerts, shortcuts, features, and code blocks. A page made only of text blocks fails review.
6. **Stay accurate to the editor.** Use the same labels the user sees in the editor UI.

---

## 2. Menu map (v0.1.0)

The sidebar is defined in [`useDocsLogic.js`](../editor/src/features/docs/composables/useDocsLogic.js). For version 0.1.0 the menu is **fixed**: do not add, remove, rename, or move pages. Write content only for the pages below.

- **Doc ID** is the path used in links and in the URL (`/docs/<doc-id>`).
- **File** is relative to `editor/public/docs/`.
- **`title`** must match the sidebar name exactly.
- **`category`** is the direct parent shown in the breadcrumb.

### Getting Started

| Sidebar name | Doc ID | `category` |
| :--- | :--- | :--- |
| Introduction | `getting_started/introduction` | Getting Started |
| Installation & Setup | `getting_started/installation` | Getting Started |
| Quick Start | `getting_started/quick_start` | Getting Started |
| Project & Export | `getting_started/project_and_export` | Getting Started |

### Interface

| Sidebar name | Doc ID | `category` |
| :--- | :--- | :--- |
| Editor Overview | `interface/editor_overview` | Interface |
| Scene Viewport | `interface/scene_viewport` | Interface |
| Scene Hierarchy | `interface/scene_hierarchy` | Interface |
| Property Inspector | `interface/property_inspector` | Interface |
| Shortcuts Reference | `interface/shortcuts` | Interface |

### Components

| Sidebar name | Doc ID | `category` |
| :--- | :--- | :--- |
| Entities & Prefabs | `components/entities_and_prefabs` | Components |
| Transform & UI Transform | `components/transform` | Components |
| Visual Renderers | `components/renderers` | Components |
| ↳ Image Renderer | `components/renderers/sprite_renderer` | Visual Renderers |
| ↳ Shape Renderer | `components/renderers/shape_renderer` | Visual Renderers |
| ↳ Text Renderer | `components/renderers/text_renderer` | Visual Renderers |
| ↳ Tilemap | `components/renderers/tilemap` | Visual Renderers |
| Sprite Animator | `components/sprite_animator` | Components |
| Physics Body | `components/physics_body` | Components |
| Multi-Collider | `components/multi_collider` | Components |
| Audio Source | `components/audio_source` | Components |
| Script Controller | `components/script_controller` | Components |

### Visual Scripting

| Sidebar name | Doc ID | `category` |
| :--- | :--- | :--- |
| Graph & Node Concepts | `visual_scripting/graph_concepts` | Visual Scripting |
| Variables & Collections | `visual_scripting/variables_and_collections` | Visual Scripting |
| Custom Node & Code Panel | `visual_scripting/custom_node_and_code` | Visual Scripting |
| Context System API | `visual_scripting/context_system_api` | Visual Scripting |

### Behaviour

| Sidebar name | Doc ID | `category` |
| :--- | :--- | :--- |
| Movement | `behaviour/movement` | Behaviour |
| ↳ Platformer Movement | `behaviour/movement/platformer` | Movement |
| ↳ Top-Down Movement | `behaviour/movement/top_down` | Movement |
| ↳ Patrol & Basic Motion | `behaviour/movement/basic_motion` | Movement |
| Physics & Collision | `behaviour/physics_and_collision` | Behaviour |
| ↳ Physics & Slopes | `behaviour/physics_and_collision/physics_and_slopes` | Physics & Collision |
| ↳ Triggers & Hitboxes | `behaviour/physics_and_collision/triggers_and_hitboxes` | Physics & Collision |
| User Interface | `behaviour/ui` | Behaviour |
| ↳ Interactive Widgets | `behaviour/ui/interactive_widgets` | User Interface |
| ↳ Dynamic UI & Data Binding | `behaviour/ui/dynamic_ui` | User Interface |

### Node Library (generated, do not write)

These pages are generated at runtime from the blueprint definitions. **Do not create JSON files for them.** You can still link to them.

| Sidebar name | Doc ID |
| :--- | :--- |
| Overview & Architecture | `node_library/overview` |
| Flow & Logic | `node_library/flow_logic` |
| Input & Controls | `node_library/input_controls` |
| Entity & Transform | `node_library/game_entity` |
| Physics & Collision | `node_library/game_physics` |
| Rendering & Camera | `node_library/game_renderer` |
| Animation | `node_library/game_animation` |
| Collections & Data | `node_library/data_collections` |
| Math & Random | `node_library/math_operations` |
| Scene & Lifecycle | `node_library/game_lifecycle` |
| Audio & System | `node_library/system_utilities` |
| Helper & Tool | `node_library/helper_tool` |
| Custom Node | `node_library/custom` |

Each node on a generated page has the section ID `node-<nodeType>`. Example: `node_library/flow_logic#node-<nodeType>`.

### Tutorials

| Sidebar name | Doc ID | `category` |
| :--- | :--- | :--- |
| Your First Platformer Game | `tutorials/first_platformer` | Tutorials |
| Your First Top-Down RPG | `tutorials/first_top_down` | Tutorials |
| Your First Visual Novel Game | `tutorials/building_game_ui` | Tutorials |

> [!NOTE]
> Items marked with ↳ are submenu pages. Their parent (for example **Visual Renderers** or **Movement**) is also a real page. Write it as a hub page (see [Page templates](#5-page-templates)).

---

## 3. Page file format

Every page is one JSON file. The file name and folder must match the Doc ID: `components/physics_body` → `editor/public/docs/components/physics_body.json`.

```json
{
  "title": "Physics Body",
  "category": "Components",
  "description": "Adds gravity, velocity, and forces to an entity so it moves and reacts like a physical object.",
  "sections": [
    {
      "id": "overview",
      "title": "Overview",
      "blocks": []
    }
  ]
}
```

| Field | Required | Rule |
| :--- | :--- | :--- |
| `title` | Yes | Same text as the sidebar name. Rendered as the page H1. |
| `category` | Yes | Direct parent from the [Menu map](#2-menu-map-v010). Rendered in the breadcrumb. |
| `description` | Yes | One or two sentences (max ~40 words). Say what the feature is and why the user needs it. Rendered as the lead paragraph. |
| `sections` | Yes | Ordered list. Each section becomes an H2 and an entry in the right-side table of contents. |
| `sections[].id` | Yes | Lowercase English kebab-case, unique on the page: `properties`, `add-a-collider`, `common-issues`. Do not change an ID once published, because other pages link to it. |
| `sections[].title` | Yes | Sentence case: "Add a collider", not "Add A Collider". Max ~5 words. |
| `sections[].blocks` | Yes | Ordered list of content blocks. See [Block reference](#7-block-reference). |

> [!IMPORTANT]
> The JSON must be valid. A broken file falls back to the "work in progress" page. Use double quotes, no trailing commas, and escape line breaks inside strings as `\n`.

---

## 4. Writing style

### 4.1 Voice and tone

| Rule | Do | Don't |
| :--- | :--- | :--- |
| Address the reader as "you" | "You can flip the sprite with **Flip X**." | "The user can flip the sprite..." |
| Use active voice | "The engine applies gravity every frame." | "Gravity is applied every frame." |
| Use present tense | "The entity stops when it hits a wall." | "The entity will stop when it hits a wall." |
| Use imperative verbs in steps | "Select the entity." | "You should now select the entity." |
| One idea per sentence | "Set **Gravity Scale** to 0. The entity now floats." | "Set **Gravity Scale** to 0 which will make it so that the entity floats." |
| Keep sentences short | Aim for 20 words or fewer. | Long sentences with several commas and clauses. |
| Be neutral and factual | "This takes a few steps." | "Simply", "just", "easy", "obviously", "of course". |
| Avoid filler | "Use triggers to detect overlaps." | "It is worth noting that triggers can be used in order to detect overlaps." |

### 4.2 Paragraph length

- Max **3 sentences** per text block. Split longer content into another block or a different block type.
- Do not place more than **2 text blocks in a row**. Break them up with a table, steps, alert, or code block.

### 4.3 Terminology

- Use the **exact UI label** from the editor, in bold: **Property Inspector**, **Scene Hierarchy**, **Add Component**.
- Use one term per concept across all pages. Use **entity**, not "object" or "actor". Use **node**, not "block", for visual scripting.
- Define a term the first time it appears on a page if a beginner may not know it: "A **prefab** is a reusable entity template."
- Spell out abbreviations on first use: "user interface (UI)".

### 4.4 Engine-internal content

Leave out anything a game developer cannot see or use: source file paths, Pinia stores, bridge events, class names, and internal architecture. Engine contributors use the Markdown documents in [`docs/`](README.md) instead.

---

## 5. Page templates

Use the section order for the page type. Section IDs are shown in parentheses. Skip a section only if it has no content.

### Component page (`components/*`)

1. **Overview** (`overview`): what the component does in the game, in 1 to 3 sentences, plus a `features` block for key capabilities.
2. **Add the component** (`add-the-component`): `steps` block.
3. **Properties** (`properties`): `table` block with Property, Type, Default, Description.
4. **Usage examples** (`usage-examples`): common setups, using `steps` or `table`.
5. **Scripting** (`scripting`): which nodes control this component, linked to the [Node Library](#node-library-generated-do-not-write).
6. **Common issues** (`common-issues`): `alert` blocks or a Problem/Solution table.
7. **Related** (`related`): links to related pages.

### Interface page (`interface/*`)

1. **Overview** (`overview`): purpose of the panel. One image placeholder is allowed here (see [Images](#78-image)).
2. **Layout** (`layout`): `table` of areas, buttons, or controls.
3. **Common tasks** (`common-tasks`): `steps` blocks.
4. **Shortcuts** (`shortcuts`): `shortcuts` block for this panel only. Link to [Shortcuts Reference](#interface) for the full list.
5. **Related** (`related`)

### Concept page (`visual_scripting/*`, Getting Started intro)

1. **Overview** (`overview`)
2. **Key concepts** (`key-concepts`): `features` block or `table`.
3. **How it works** (`how-it-works`): short text plus `steps`.
4. **Example** (`example`): `steps` or `code`.
5. **Related** (`related`)

### Behaviour page (`behaviour/*` submenu pages)

1. **Overview** (`overview`): what gameplay result the reader builds.
2. **Requirements** (`requirements`): components and assets needed, with links.
3. **Setup** (`setup`): `steps` block.
4. **Settings** (`settings`): `table` of tunable values.
5. **Variations** (`variations`): optional changes, such as double jump or dash.
6. **Common issues** (`common-issues`)
7. **Related** (`related`)

### Hub page (submenu parent: `components/renderers`, `behaviour/movement`, `behaviour/physics_and_collision`, `behaviour/ui`)

1. **Overview** (`overview`): 1 to 3 sentences.
2. **Choose a page** (`choose-a-page`): `table` with Page, Use it when. Link every child page.
3. **Related** (`related`)

### Tutorial page (`tutorials/*`)

1. **What you will build** (`what-you-will-build`): result and estimated time.
2. **Before you start** (`before-you-start`): requirements, linked to [Quick Start](#getting-started).
3. One section per stage (`create-the-player`, `add-movement`, ...), each with a `steps` block.
4. **Test the game** (`test-the-game`)
5. **Next steps** (`next-steps`): links to deeper pages.

---

## 6. Inline formatting and links

### 6.1 Supported inline syntax

All text fields (`content`, `message`, `desc`, `items`, `caption`, `description`, table cells) support only this syntax:

| Syntax | Result | Use for |
| :--- | :--- | :--- |
| `**text**` | **Bold** | UI labels, property names, key terms on first use |
| `*text*` | *Italic* | Rare emphasis only |
| `[text](doc-id#section-id)` | Internal link | Links to other doc pages or sections |
| `[text](https://...)` | External link (opens a new tab) | External resources only |

> [!WARNING]
> These are **not** supported in text fields:
> - Backticks (`` ` ``) render as literal characters. Use **bold** for property names and a `code` block for code.
> - Raw HTML, such as `<b>` or `<br>`, is injected directly. Never write `<` or `>` as tags. Write "less than" or put the content in a `code` block.
> - A single `*` (for example in `a * b`) can turn the rest of the line italic. Put math in a `code` block.
> - Markdown headings, bullet lists, and line breaks. Use sections, `steps`, or `table` blocks instead.

### 6.2 Link format

| Target | Format | Example |
| :--- | :--- | :--- |
| Another page | `doc-id` | `[Physics Body](components/physics_body)` |
| A section on another page | `doc-id#section-id` | `[Physics Body properties](components/physics_body#properties)` |
| A section on the same page | `#section-id` | `[Common issues](#common-issues)` |
| A generated node | `node_library/<group-id>#node-<nodeType>` | `[Flow & Logic nodes](node_library/flow_logic)` |
| External site | Full `https://` URL | `[MDN: JavaScript](https://developer.mozilla.org/docs/Web/JavaScript)` |

**Rules**

1. Use the Doc ID exactly as listed in the [Menu map](#2-menu-map-v010). Do not add a leading `/`, the `/docs/` prefix, or the `.json` extension. These break navigation.
2. Link to the **section** when the reader needs one specific part, such as `#properties`.
3. Use descriptive link text that names the destination: "see [Multi-Collider](components/multi_collider)". Never write "click here" or "this page".
4. Link a topic on its **first mention** in each section. Do not link the same target repeatedly in one section.
5. End every page (except hub pages) with a **Related** or **Next steps** section that lists 2 to 5 links.
6. Before you submit, open every link in the editor and confirm that it opens the right page and section. A wrong Doc ID opens the "work in progress" fallback page.

---

## 7. Block reference

Only use the block types below. All of them are shown in [`cheatSheet.json`](../editor/public/docs/cheatSheet.json). Open `/docs/cheatSheet` in the editor to preview them.

### Block selection guide

| Content | Block |
| :--- | :--- |
| Explanation, definition, context | `text` |
| Extra information, tip, warning, or risk | `alert` |
| Key capabilities or concepts at a glance (2 to 4 items) | `features` |
| An ordered procedure | `steps` |
| Keyboard or mouse shortcuts | `shortcuts` |
| Code for the Custom Node or Code Panel | `code` |
| Properties, settings, comparisons, problem/solution | `table` |
| Overview screenshot (limited use) | `image` |
| Video | **Not allowed in v0.1.0** |

### 7.1 `text`

```json
{ "type": "text", "content": "A **Physics Body** makes an entity respond to gravity and forces. Pair it with a [Multi-Collider](components/multi_collider) so it can hit other entities." }
```

- Max 3 sentences. Max 2 text blocks in a row.

### 7.2 `alert`

```json
{ "type": "alert", "variant": "tip", "message": "Set **Gravity Scale** to **0** for top-down games." }
```

| Variant | Use it when | Example |
| :--- | :--- | :--- |
| `info` | Useful background the reader can skip | "Positions are measured in pixels." |
| `tip` | A shortcut or better way to do something | "Hold **Shift** to snap to the grid." |
| `warning` | A mistake that causes unexpected results | "Scaling a collider through **Transform** also scales its shape." |
| `danger` | Data loss or an action that cannot be undone | "Deleting a prefab removes all its instances." |

- Max **2 alerts per section**. Do not place two alerts back to back.
- Keep the message to 1 or 2 sentences. Do not start it with "Note:" or "Tip:", because the variant label already shows that.

### 7.3 `features`

```json
{
  "type": "features",
  "items": [
    { "title": "Gravity", "desc": "Pulls the entity down every frame." },
    { "title": "Forces", "desc": "Push the entity with **impulse** or **velocity**." }
  ]
}
```

- Use 2 to 4 items, ideally an even number because the grid has 2 columns.
- `title`: 1 to 3 words. `desc`: one short sentence.

### 7.4 `steps`

```json
{
  "type": "steps",
  "items": [
    "Select the entity in the [Scene Hierarchy](interface/scene_hierarchy).",
    "In the [Property Inspector](interface/property_inspector), click **Add Component**.",
    "Choose **Physics Body**."
  ]
}
```

- One action per step. Start with an imperative verb: Select, Click, Drag, Set, Open, Press.
- Put the location before the action: "In the **Property Inspector**, click **Add Component**."
- Use 3 to 8 steps. Split longer procedures into separate sections.
- If a step has a visible result, add it after the action: "Press **Play**. The player falls onto the ground."

### 7.5 `shortcuts`

```json
{
  "type": "shortcuts",
  "items": [
    { "keys": ["Ctrl", "S"], "description": "Save the project" },
    { "keys": ["Ctrl", "Z"], "description": "Undo" }
  ]
}
```

- One key per array item: `["Ctrl", "Shift", "Z"]`, not `["Ctrl+Shift+Z"]`.
- Key names: `Ctrl`, `Shift`, `Alt`, `Space`, `Enter`, `Esc`, `Delete`, `Tab`, `F2`, uppercase letters, `Left Click`, `Right Click`, `Scroll`.
- Copy key bindings from the editor. Do not guess.

### 7.6 `code`

```json
{
  "type": "code",
  "language": "javascript",
  "snippet": "const score = context.getVariable('score');\ncontext.setGlobal('score', score + 10);\nreturn;"
}
```

- Only for code the game developer writes, such as **Custom Node** or **Code Panel** code. Do not show engine source.
- Keep snippets short (max ~15 lines) and runnable as written.
- Always set `language` (usually `javascript` or `json`).
- Put a `text` block before the snippet to say what it does. Put another one after if the reader must change something.

### 7.7 `table`

```json
{
  "type": "table",
  "headers": ["Property", "Type", "Default", "Description"],
  "rows": [
    ["Gravity Scale", "Number", "1", "Multiplies world gravity for this entity."],
    ["Fixed Rotation", "Boolean", "false", "Stops the entity from rotating on collision."]
  ]
}
```

- The first column renders in monospace cyan. Put the key item there: a property name, setting, or page link.
- The type names `String`, `Number`, `Boolean`, `Vector2`, `Object`, and `Array` render as colored badges when a cell contains only that word. Use these names exactly.
- Every row must have the same number of cells as `headers`.
- Use the property label as shown in the **Property Inspector**.
- Recommended layouts:

| Use | Headers |
| :--- | :--- |
| Component properties | Property, Type, Default, Description |
| Behaviour settings | Setting, Recommended value, Effect |
| Panel layout | Area, Description |
| Troubleshooting | Problem, Solution |
| Hub page | Page, Use it when |

### 7.8 `image`

Keep images to a minimum, because the editor UI still changes. Use images only for **overviews**, for example the overview section of an **Interface** page.

- Max **1 image per page**, and only in the `overview` section.
- Never put information only in an image. The text must still explain everything.
- **Do not add real image files yet.** Insert a text placeholder. The maintainer adds the screenshot later.

Placeholder format:

```json
{
  "type": "image",
  "url": "TODO_IMAGE",
  "alt": "TODO: Screenshot of the full editor window with the Scene Viewport, Scene Hierarchy, and Property Inspector visible.",
  "caption": "The default editor layout."
}
```

| Field | Rule |
| :--- | :--- |
| `url` | Always the literal `TODO_IMAGE` until the maintainer adds the file. Search for `TODO_IMAGE` to find open placeholders. |
| `alt` | Start with `TODO:`. Describe exactly what the screenshot must show. The browser displays this text until the image exists. |
| `caption` | Short final caption, written as if the image already exists. |

When the maintainer adds the image, they save it to `editor/public/docs/images/<folder>/<page>_<subject>.png`, set `url` to an absolute path such as `/docs/images/interface/editor_overview_layout.png`, and remove `TODO:` from `alt`. Use an absolute path, because a relative path resolves against the current page URL and breaks.

### 7.9 `video`

> [!CAUTION]
> Do not use the `video` block in v0.1.0. Describe the process with `steps` instead.

---

## 8. Complete example

A full page for `components/transform`. It is shortened and illustrative only. Check every value against the editor before you publish.

```json
{
  "title": "Transform & UI Transform",
  "category": "Components",
  "description": "Sets where an entity is, how big it is, and how it is rotated. Every entity has a **Transform**. UI entities use **UI Transform**, which adds anchors.",
  "sections": [
    {
      "id": "overview",
      "title": "Overview",
      "blocks": [
        { "type": "text", "content": "The **Transform** component controls position, rotation, scale, and size. You edit it in the [Property Inspector](interface/property_inspector) or with the gizmo in the [Scene Viewport](interface/scene_viewport)." },
        {
          "type": "features",
          "items": [
            { "title": "Position", "desc": "Places the entity in the scene, in pixels." },
            { "title": "Anchors", "desc": "Pins **UI** entities to a screen edge or corner." }
          ]
        }
      ]
    },
    {
      "id": "properties",
      "title": "Properties",
      "blocks": [
        {
          "type": "table",
          "headers": ["Property", "Type", "Default", "Description"],
          "rows": [
            ["Rotation", "Number", "0", "Rotation in degrees."],
            ["Pivot", "Vector2", "0.5, 0.5", "Point the entity rotates and scales around. 0.5, 0.5 is the center."],
            ["Flip X", "Boolean", "false", "Mirrors the entity horizontally."]
          ]
        },
        { "type": "alert", "variant": "tip", "message": "Turn on **Lock Ratio** to keep the width and height proportional while resizing." }
      ]
    },
    {
      "id": "anchor-ui-elements",
      "title": "Anchor UI elements",
      "blocks": [
        {
          "type": "steps",
          "items": [
            "Select a UI entity in the [Scene Hierarchy](interface/scene_hierarchy).",
            "In the **UI Transform** section, set **Anchor** to **1, 0**.",
            "Press **Play** and resize the window. The element stays in the top-right corner."
          ]
        }
      ]
    },
    {
      "id": "scripting",
      "title": "Scripting",
      "blocks": [
        { "type": "text", "content": "To move or rotate an entity at runtime, use the nodes in [Entity & Transform](node_library/game_entity)." }
      ]
    },
    {
      "id": "related",
      "title": "Related",
      "blocks": [
        {
          "type": "table",
          "headers": ["Page", "Use it when"],
          "rows": [
            ["[Entities & Prefabs](components/entities_and_prefabs)", "You want to reuse a configured entity."],
            ["[Dynamic UI & Data Binding](behaviour/ui/dynamic_ui)", "You build UI that reacts to game data."]
          ]
        }
      ]
    }
  ]
}
```

---

## 9. Review checklist

Check every item before you submit a page.

**Structure**

- [ ] The file path matches the Doc ID in the [Menu map](#2-menu-map-v010). No pages were added, renamed, or moved.
- [ ] `title` matches the sidebar name. `category` matches the direct parent.
- [ ] `description` has 1 to 2 sentences.
- [ ] The sections follow the [page template](#5-page-templates) for the page type.
- [ ] Section IDs are unique, lowercase, kebab-case English.
- [ ] The JSON is valid.

**Content**

- [ ] The page is written for game developers, with no engine internals.
- [ ] Sentences are short and active, and use "you". No "simply", "just", or "easy".
- [ ] UI labels are bold and match the editor exactly.
- [ ] No text block has more than 3 sentences. No more than 2 text blocks appear in a row.
- [ ] The page uses at least two non-text block types.

**Links**

- [ ] Every related feature is linked on its first mention in a section.
- [ ] Links use `doc-id` or `doc-id#section-id`, with no leading `/`, `/docs/`, or `.json`.
- [ ] Every link was clicked in the editor and opens the right page and section.
- [ ] The page ends with **Related** or **Next steps** (except hub pages).

**Blocks**

- [ ] Text fields contain no backticks, HTML tags, or stray `*`.
- [ ] `features` have short titles and single-sentence descriptions.
- [ ] Table rows match the header count.
- [ ] The page has max 1 image, in `overview`, using the `TODO_IMAGE` placeholder.
- [ ] The page has no `video` blocks.
