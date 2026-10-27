---
title: "Custom Node & Code Panel"
category: "Visual Scripting"
description: "Inspect the JavaScript behind any node or build your own Custom Nodes with custom ports, roles, and reusable blueprints in the Code Panel."
---

## Overview {#overview}

Every node in Lupis Engine runs JavaScript at runtime. You can open any node in the **Code Panel** to inspect how it works, unlock a built-in node to customize its behavior, or create a [Custom Node](node_library/custom) with your own input and output ports.

:::features
- **Transparent Code**: Double-click any node in the graph to view its JavaScript implementation in the **Code Panel**.
- **Custom Ports & Roles**: Choose **Action**, **Event**, or **Pure** roles and add typed input and output pins.
- **Live Validation**: Catch syntax errors, unused ports, and missing variables in real time while you type.
- **Reusable Blueprints**: Click **Save as Blueprint** to add your custom node to the project's **Node Library**.
:::

## Key concepts {#key-concepts}

When you select a **Custom Node** in the graph or edit it in the **Code Panel**, you configure its interface in the [Property Inspector](interface/property_inspector) and write its logic using four built-in runtime objects.

| Inspector Control | Section | Description |
| --- | --- | --- |
| Title / Color / Description | Header | Sets the node's header label, accent color, and summary notes. |
| Role | Header | Switches between **Action (Exec In + Out)**, **Event (Exec Out only)**, and **Pure (Data only)**. |
| Header Menu (3-dots) | Header | Provides **Save as Blueprint**, **Edit Node Script**, **Revert to Preset** (for unlocked system nodes), and **Delete Node**. |
| + Add Input / Output Port | Ports Configuration | Creates a new custom data port. Click the port name to rename it using alphanumeric characters. |
| Port Options (3-dots) | Ports Configuration | Sets the port **Data Type** (**number**, **string**, or **boolean**), reorders ports with **Move Up** and **Move Down**, or deletes the port. |

Inside the **Code Panel**, your script has access to **inputs**, **outputs**, **context**, and **node**. The top status bar validates your code automatically as you type.

| Object / Statement | Usage | Description |
| --- | --- | --- |
| inputs | inputs.portName | Read-only object containing the current values of all input ports on the node. |
| outputs | outputs.portName = val | Writable object for sending values to output ports and advancing execution flow with **outputs.execOut = true**. |
| context | context.entity, context.dt | Provides safe access to engine domains, variables, assertions, and per-node **context.state**. See [Context System API](visual_scripting/context_system_api). |
| return; | End of script | Every node script must end with an explicit **return;** statement. |

> [!WARNING]
> Custom port names must use alphanumeric characters only (such as **damageAmount** or **isCritical**) with no spaces, hyphens, or underscores. The **Code Panel** shows a warning if a defined port is never read or assigned in your code.

## How it works {#how-it-works}

Follow these steps to create a custom node, configure its ports, and save it as a reusable blueprint.

:::steps
1. In an open script graph, click **+ Add Custom Node** in the **Node Library** panel (or right-click empty canvas space and select **Add Custom Node**).
2. In the **Header** section of the [Property Inspector](interface/property_inspector), set the node **Title** and choose its **Role**.
3. In **Ports Configuration**, click **+ Add Input Port** or **+ Add Output Port**, rename each port, and open the 3-dots menu to set its **Data Type**.
4. Double-click the node header (or right-click the node and click **Edit Code**) to open the **Code Panel** tab.
5. Write your JavaScript logic, read every input port via **inputs**, assign every output port via **outputs**, and verify that the top badge shows **No Issues**.
6. To reuse this node across other scripts in your project, click the 3-dots icon in the **Header** section and select **Save as Blueprint**.
:::

> [!TIP]
> To customize a built-in node, double-click it to open the **Code Panel** and click **Unlock** in the bottom-right status bar. You can restore the original built-in behavior at any time by clicking **Revert to Preset** in the **Header** 3-dots menu.

## Example {#example}

This **Action** custom node calculates damage with a critical hit multiplier, logs the result to the **Console**, and outputs the final damage value. Add two **number** inputs (**baseDamage** and **critMultiplier**), one **boolean** input (**isCrit**), and one **number** output (**finalDamage**), then enter this code in the **Code Panel**:

```javascript
const baseDamage = context.assert.isNumber(inputs.baseDamage, 'baseDamage must be a number');
const critMultiplier = context.assert.isNumber(inputs.critMultiplier, 'critMultiplier must be a number');
const isCrit = Boolean(inputs.isCrit);

const finalDamage = isCrit ? baseDamage * critMultiplier : baseDamage;
context.console.log('Dealt damage:', finalDamage);

outputs.finalDamage = finalDamage;
outputs.execOut = true;
return;
```

For a **Pure (Data only)** calculation node that has no execution pins, omit **outputs.execOut = true;** and assign only your data outputs before **return;**.

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Context System API](visual_scripting/context_system_api) | You need the complete reference for all context properties, methods, and domain facades. |
| [Graph & Node Concepts](visual_scripting/graph_concepts) | You want to connect your custom node into an execution graph. |
| [Variables & Collections](visual_scripting/variables_and_collections) | You want to read or write local and global variables from your node. |
| [Custom Node](node_library/custom) | You want to view the default Custom Node blueprint specification. |
| [Shortcuts Reference](interface/shortcuts#visual-scripting-and-code) | You want keyboard shortcuts for the graph canvas and Code Panel. |
