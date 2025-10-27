const MODULE_ID = "combat-tracker-extensions";

export function registerSettings() {
  // Initiative formula: world scoped, configurable by GMs
  game.settings.register(MODULE_ID, "initiativeFormula", {
    name: "Initiative Formula",
    hint: "The default formula used when rolling group initiative (default: 1d20). Use any Roll expression.",
    scope: "world",
    config: true,
    type: String,
    default: "1d20"
  });

  // Add more settings as needed (button visibility, grouping behavior, etc)
  game.settings.register(MODULE_ID, "showReverseButton", {
    name: "Show Reverse Button",
    hint: "Show a button to reverse initiative order in the Combat Tracker.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
}
