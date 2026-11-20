const KEY = 'ironwood.frontier.match';

export function storeMatch(storage, match) {
  try {
    storage.setItem(KEY, JSON.stringify({ version: 1, match }));
    return true;
  } catch {
    return false;
  }
}

export function readMatch(storage) {
  try {
    const saved = JSON.parse(storage.getItem(KEY));
    if (saved?.version !== 1) return null;
    const state = saved.match;
    if (!state || !Number.isFinite(state.gameTime) || !Number.isInteger(state.idCounter) ||
        !['units', 'buildings', 'nodes', 'effects', 'explored'].every(key => Array.isArray(state[key])) ||
        !state.cam || !state.redStock || !state.story) return null;
    return state;
  } catch {
    return null;
  }
}

export function removeMatch(storage) {
  try { storage.removeItem(KEY); } catch { /* Storage can be disabled. */ }
}
