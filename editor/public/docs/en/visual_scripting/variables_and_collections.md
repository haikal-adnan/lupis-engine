---
title: "Variables & Collections"
category: "Visual Scripting"
description: "Store and share game data using Local and Global variables, ordered Lists, and key-value Maps. Manage values in the Variable Manager and bind them to nodes."
---

## Overview {#overview}

Variables store data that your game reads and updates at runtime, such as player health, score, inventory lists, or dialogue tables. You manage variables in the **Variables** panel on the left side of the [visual scripting](visual_scripting/graph_concepts) workspace.

:::features
- **Local & Global Scopes**: Keep data private to one script instance (**Local**) or share it across every scene (**Global**).
- **Lists & Maps**: Build nested arrays and key-value dictionaries visually or with the **Raw JSON Editor**.
- **Direct Port Binding**: Bind variables directly to node input ports and apply inline modifiers without extra nodes.
- **Inspector Overrides**: Tune **Local** primitive variables per entity in the [Script Controller](components/script_controller) inspector.
:::

## Key concepts {#key-concepts}

Every variable has a **Scope** that controls where it can be accessed and a **Type** that defines the kind of value it holds.

| Scope | Lifetime & Visibility | Inspector Override | Best For |
| --- | --- | --- | --- |
| Local | Isolated to each entity running the script. Resets when the entity or scene unloads. | Yes (Number, String, and Boolean appear in Script Controller) | Movement speed, enemy patrol range, entity health, cooldown flags. |
| Global | Shared across all scripts and scenes in the project for the entire game session. | No (managed in Variable Manager) | Total score, collected coins, player inventory, audio settings, quest state. |

Lupis Engine supports three primitive types and two structured collection types.

| Type | Badge | Default | Description |
| --- | --- | --- | --- |
| string | String | "" | Text values such as names, dialogue lines, tags, or asset IDs. |
| number | Number | 0 | Numeric values for counters, timers, stats, and coordinates. |
| boolean | Boolean | false | True or false flags for states and conditions. |
| list | Array | [] | Zero-indexed ordered list of items. Elements can be primitives or nested lists and maps. |
| map | Object | {} | Key-value dictionary accessed by string keys. Values can be primitives or nested collections. |

> [!NOTE]
> Check the **Panel** checkbox on a variable row in the **Variable Manager** to expose that variable in the left **Variables** sidebar for quick editing and drag-and-drop.

## How it works {#how-it-works}

Create and structure your variables in the **Variable Manager** modal, then drag or bind them into your node graph.

:::steps
1. Open a script tab and click the **Manage Variables** sliders icon in the **Variables** panel header.
2. Select **Local** or **Global** at the top-left of the **Variable Manager** and click **Add New Variable**.
3. Check the **Panel** box to pin the variable to the sidebar, enter a **Variable Name**, and choose a **Type**.
4. For a **number**, **string**, or **boolean**, enter its starting value directly in **Value / Structure**.
5. For a **list** or **map**, click **Configure LIST** or **Configure MAP** to add nested items, or click the **Edit Raw JSON** icon in the header to paste a JSON array or object.
6. Click the modal close button. You can add variables to your graph canvas in several practical ways:
   - **From the Variables Sidebar**: Drag the variable onto the canvas while holding **Ctrl** (to spawn **Get Variable**) or **Alt** (to spawn **Set Variable**).
   - **From the Variable Manager Modal**: Press **Ctrl + Double Click** on a variable row to spawn a **Get Variable** node, press **Alt + Double Click** to spawn a **Set Variable** node, or open the 3-dots row menu and select **Add Get to Graph** or **Add Set to Graph**.
:::

You can also bind a variable directly to an unconnected node input port in the [Property Inspector](interface/property_inspector) or manipulate collections with [Collections & Data](node_library/data_collections) nodes.

| Method / Node | Description |
| --- | --- |
| Switch to Variable (Port Toggle) | Click the variable icon next to any input in **Parameters** to bind a variable directly and apply inline modifiers such as **Add (+)**, **Invert (NOT !)**, or **Random Item**. |
| [Get Variable](node_library/system_utilities#node-variableGet) / [Set Variable](node_library/system_utilities#node-variableSet) | Reads or writes a **Local** or **Global** variable in the graph. |
| [List Get](node_library/data_collections#node-listGet) / [List Set](node_library/data_collections#node-listSet) | Reads or updates an item at a specific zero-based index in a **List**. |
| [List Push](node_library/data_collections#node-listPush) / [List Remove At](node_library/data_collections#node-listRemoveAt) | Appends a new item to the end of a **List** or removes an item by index. |
| [Map Get](node_library/data_collections#node-mapGet) / [Map Set](node_library/data_collections#node-mapSet) | Reads or updates a value associated with a string key in a **Map**. |
| [Get Value by Path](node_library/data_collections#node-getFromPath) / [Set Value by Path](node_library/data_collections#node-setFromPath) | Reads or writes nested values inside a **List** or **Map** using a dot or bracket path such as **player.stats.hp** or **items[0].name**. |

> [!TIP]
> When you bind a **String** variable directly to a node input port, type text around **{value}** in the format box (for example, **Score: {value}**) to format the output string inline.

## Example {#example}

Create a global **Score** variable, add 10 points when an event triggers, and display the formatted score on a [Text Renderer](components/renderers/text_renderer).

:::steps
1. Open the **Variable Manager**, switch to **Global**, and click **Add New Variable**.
2. Check **Panel**, name the variable **Score**, set **Type** to **number**, and set its value to **0**.
3. Hold **Alt** and drag **Score** from the **Variables** panel onto the canvas to create a **Set Score** node.
4. In the **Parameters** section of **Set Score**, click **Switch to Variable** next to **Value**, select **Score (Global)**, and apply the **Add (+)** modifier with a value of **10**.
5. Add a [Set Text](node_library/game_renderer#node-setText) node, connect **execOut** from **Set Score** to **execIn** on **Set Text**, and set **targetEntity** to your score label ID.
6. On the **Set Text** node, click **Switch to Variable** next to **text**, select **Score (Global)**, and enter **Score: {value}** in the format field.
:::

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Graph & Node Concepts](visual_scripting/graph_concepts) | You want to learn how nodes, ports, and execution wires work. |
| [Script Controller](components/script_controller) | You want to override local variables on individual entities in the scene. |
| [Collections & Data](node_library/data_collections) | You want the full reference for all 20 list, map, and path nodes. |
| [Dynamic UI & Data Binding](behaviour/ui/dynamic_ui) | You want to bind game variables to health bars, counters, and UI text. |
| [Context System API](visual_scripting/context_system_api) | You want to read and write local or global variables in custom JavaScript code. |
