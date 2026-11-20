# Ironwood: Frontier Siege

A tiny original fantasy real-time strategy game inspired by classic 1990s PC RTS games. Play directly on desktop or in a modern mobile browser. No build system, dependencies, or server required.

## Play

Once GitHub Pages has been enabled, open:

**https://jenschristianschroder.github.io/Frontier-Siege/**

Tap **Begin Siege** to play.

## Controls

- **Select:** Tap a friendly unit or building.
- **Move / attack:** Select units, then tap terrain or an enemy.
- **Gather:** Select a worker, then tap a gold deposit or tree.
- **Build:** Select a worker, choose a structure in the command panel, and tap open land near your base.
- **Train:** Select the Keep to train workers or the Barracks to train soldiers.
- **Navigate:** Drag the map to pan, tap the minimap to jump, or use the zoom buttons.
- **Win:** Destroy the enemy keep before losing yours.

## Deployment

The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) publishes the root `index.html` via GitHub Actions on every push to `main`, and can also be launched manually.

**Initial GitHub Pages setup (once):** Open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. Then check the **Actions** tab for the *Deploy Ironwood to GitHub Pages* run.

## Development

Edit `index.html` and push to `main`. Everything is in one HTML file, including CSS, JavaScript, and procedural graphics.

This is an original game and is not affiliated with Blizzard Entertainment or Warcraft.
