# Ironwood: Frontier Siege

An original fantasy real-time strategy game inspired by classic 1990s PC RTS games. Play directly on desktop or in a modern mobile browser. No build system, dependencies, or server required.

## Play

Once GitHub Pages has been enabled, open:

**https://jenschristianschroder.github.io/Frontier-Siege/**

Tap **Begin Campaign** to play.

## Controls

- **Select:** Tap a friendly unit or building.
- **Move / attack:** Select units, then tap terrain or an enemy.
- **Gather:** Select a worker, then tap a gold deposit or tree.
- **Build:** Select a worker, choose a structure in the command panel, and tap open land near your base.
- **Train:** Select the Keep to train workers or the Barracks to train soldiers.
- **Navigate:** Drag the map to pan, tap the minimap to jump, pinch to zoom, or use the zoom buttons.
- **Squads:** Tap the box-select button and drag around nearby troops, or hold Shift and drag with a mouse. Use **Attack move** to engage enemies along the route.
- **Save:** Matches autosave locally. Pause to save immediately or choose **Continue saved match** after reopening the game.
- **Win:** Destroy the enemy Keep before losing your last completed Keep.

## Deployment

The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) runs the match tests and publishes `index.html` and `src/` via GitHub Actions on every push to `main`, and can also be launched manually.

**Initial GitHub Pages setup (once):** Open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. Then check the **Actions** tab for the *Deploy Ironwood to GitHub Pages* run.

## Development

Run the game through a local static server so the browser can load ES modules. To test the same subdirectory layout as GitHub Pages, run `python3 -m http.server 8000` from the directory above the checkout and visit `http://localhost:8000/Frontier-Siege/`.

Run `node --test tests/*.test.mjs` with Node.js 22 or later. The suite covers route finding, formations, resource gathering, training, CPU raids, save/resume, and match outcomes.

This is an original game and is not affiliated with Blizzard Entertainment or Warcraft.
