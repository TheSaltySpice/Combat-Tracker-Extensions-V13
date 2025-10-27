const MODULE_ID = "combat-tracker-extensions";

/**
 * Safe get token document from a combatant or token-like object
 */
export function getTokenDocument(tokenOrCombatant) {
  if (!tokenOrCombatant) return null;
  if (tokenOrCombatant.document) return tokenOrCombatant.document;
  if (tokenOrCombatant.token) return tokenOrCombatant.token.document ?? tokenOrCombatant.token;
  return null;
}

/**
 * Safely get actor system data
 */
export function getActorSystemData(actor) {
  if (!actor) return {};
  return actor.system ?? actor.data?.data ?? {};
}
