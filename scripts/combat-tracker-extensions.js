/**
 * Combat Tracker Extensions - Modernized for Foundry v12+
 * Replace the original CombatTrackerExtensions.js with this file.
 */

import { registerSettings } from "./settings.js";
import * as Helpers from "./helpers.js";

const MODULE_ID = "combat-tracker-extensions";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings(game.modules.get(MODULE_ID));
});

Hooks.once("setup", () => {
  console.log(`${MODULE_ID} | Setup (no-op)`);
});

Hooks.on("ready", () => {
  console.log(`${MODULE_ID} | Ready`);
});

/**
 * Render hook for the Combat Tracker
 * app: CombatTracker application
 * html: HTMLElement (cheerio-like in older versions, but here it's a DOM fragment)
 * data: the data passed to the template
 */
Hooks.on("renderCombatTracker", (app, html, data) => {
  try {
    // The incoming "html" is a jQuery-like object in some Foundry builds; handle both cases
    const container = (html instanceof HTMLElement) ? html : (html[0] || html);
    if (!container) return;

    // Add our extra controls only once
    if (container.querySelector(".cte-controls")) return;

    // Create controls container
    const controls = document.createElement("div");
    controls.classList.add("cte-controls");
    controls.style.display = "flex";
    controls.style.gap = "6px";
    controls.style.margin = "6px 0";

    // Example: Toggle group initiatives
    const btnGroup = document.createElement("button");
    btnGroup.type = "button";
    btnGroup.className = "cte-button";
    btnGroup.textContent = "Group Initiative";
    btnGroup.title = "Roll initiative for initiative groups (if any)";
    btnGroup.addEventListener("click", async (ev) => {
      ev.preventDefault();
      await onGroupInitiative();
    });

    // Example: Reverse initiative order
    const btnReverse = document.createElement("button");
    btnReverse.type = "button";
    btnReverse.className = "cte-button";
    btnReverse.textContent = "Reverse";
    btnReverse.title = "Reverse the current combat turn order";
    btnReverse.addEventListener("click", async (ev) => {
      ev.preventDefault();
      await onReverseOrder(app);
    });

    controls.appendChild(btnGroup);
    controls.appendChild(btnReverse);

    // Place controls at the top of the Combat Tracker header
    const header = container.querySelector(".directory-search") || container.querySelector(".directory-footer") || container.querySelector(".combat-controls");
    if (header) {
      header.prepend(controls);
    } else {
      // fallback: insert at top
      container.prepend(controls);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | renderCombatTracker error`, err);
  }
});

/* -------------------------
   Core Actions
   ------------------------- */

async function onGroupInitiative() {
  // This function is intentionally generic. The module originally assumed D&D5E modifiers.
  // We'll roll a user-configurable initiative formula (default: "1d20") for each group.
  const formula = game.settings.get(MODULE_ID, "initiativeFormula") || "1d20";
  // Groups should be stored on combatants via flags, or this module can consider all combatants
  const combat = ui.combatTracker?.combat ?? game.combat;
  if (!combat) {
    ui.notifications?.warn("No active combat to roll initiative for.");
    return;
  }

  // Grouping concept: combatants may have a flag "cte.groupId" set. Roll once per group.
  const combatants = combat.combatants.contents ?? Array.from(combat.combatants);
  const groups = new Map();
  for (const c of combatants) {
    const groupId = c.actor?.getFlag(MODULE_ID, "groupId") ?? c.getFlag?.(MODULE_ID, "groupId") ?? null;
    const key = groupId ?? `__ungrouped__:${c.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }

  // For each group that has more than 1 member, roll once and set every member's initiative to that roll.
  for (const [key, members] of groups.entries()) {
    if (members.length === 0) continue;

    // If it's an ungrouped single combatant, skip or roll individually
    if (key.startsWith("__ungrouped__") && members.length === 1) {
      // roll for the single combatant
      const c = members[0];
      const r = await new Roll(formula).evaluate({async: true});
      await c.update({ initiative: r.total });
      continue;
    }

    // roll once for the group
    const roll = await new Roll(formula).evaluate({async: true});
    for (const c of members) {
      await c.update({ initiative: roll.total });
    }
  }

  ui.combatTracker?.render();
}

async function onReverseOrder(app) {
  try {
    const combat = app?.combat ?? ui.combatTracker?.combat ?? game.combat;
    if (!combat) {
      ui.notifications?.warn("No active combat to reverse.");
      return;
    }
    // Reverse sorting: we can invert initiative values by negating them relative to max
    const combatants = combat.combatants.contents ?? Array.from(combat.combatants);
    if (combatants.length === 0) return;
    // Compute max initiative
    let maxInit = Math.max(...combatants.map(c => Number.isFinite(c.initiative) ? c.initiative : -Infinity));
    if (!Number.isFinite(maxInit)) maxInit = 0;
    // mapping: newInit = maxInit - currentInit
    const updates = combatants.map(c => {
      const cur = Number.isFinite(c.initiative) ? c.initiative : 0;
      return { _id: c.id, initiative: (maxInit - cur) };
    });
    await combat.updateEmbeddedDocuments("Combatant", updates);
    ui.combatTracker?.render();
  } catch (err) {
    console.error(`${MODULE_ID} | onReverseOrder`, err);
  }
}

/* -------------------------
   Utilities to expose
   ------------------------- */
export { onGroupInitiative, onReverseOrder };
