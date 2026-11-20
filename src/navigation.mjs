// Weighted routing on an eight-connected grid, with no diagonal corner cutting.
export function route(grid, width, height, sx, sy, goal, distance) {
  const start = Math.floor(sy) * width + Math.floor(sx);
  const scores = new Float64Array(grid.length).fill(Infinity);
  const parents = new Int32Array(grid.length).fill(-1);
  const open = [[start, 0, distance(sx, sy)]];
  scores[start] = 0;
  let best = start;
  let bestDistance = distance(start % width + .5, Math.floor(start / width) + .5);
  while (open.length) {
    let cheapest = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i][2] < open[cheapest][2]) cheapest = i;
    }
    const [cell, cost] = open[cheapest];
    open[cheapest] = open.at(-1);
    open.pop();
    if (cost !== scores[cell]) continue;
    const x = cell % width;
    const y = Math.floor(cell / width);
    const remaining = distance(x + .5, y + .5);
    if (remaining < bestDistance) {
      bestDistance = remaining;
      best = cell;
    }
    if (goal(x + .5, y + .5)) {
      best = cell;
      break;
    }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        const next = ny * width + nx;
        if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= width || ny >= height || grid[next]) continue;
        if (dx && dy && (grid[cell + dx] || grid[cell + dy * width])) continue;
        const step = cost + (dx && dy ? Math.SQRT2 : 1);
        if (step >= scores[next]) continue;
        scores[next] = step;
        parents[next] = cell;
        open.push([next, step, step + distance(nx + .5, ny + .5)]);
      }
    }
  }
  const path = [];
  if (best === start && !goal(sx, sy) && !grid[start]) {
    const x = start % width + .5;
    const y = Math.floor(start / width) + .5;
    if (goal(x, y)) return [{ x, y }];
  }
  for (let cell = best; cell !== start && cell >= 0; cell = parents[cell]) {
    path.push({ x: cell % width + .5, y: Math.floor(cell / width) + .5 });
  }
  return path.reverse();
}

export function footprintDistance(x, y, target) {
  if (target.kind === 'building') {
    return Math.hypot(
      Math.max(target.x - x, x - target.x - target.w, 0),
      Math.max(target.y - y, y - target.y - target.h, 0)
    );
  }
  return Math.hypot(x - target.x, y - target.y);
}

export function formationSlots(x, y, count, width, height, blocked, heading = 0) {
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const slots = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    const sideways = i % columns - (columns - 1) / 2;
    const forward = (rows - 1) / 2 - Math.floor(i / columns);
    const px = x + forward * Math.cos(heading) - sideways * Math.sin(heading);
    const py = y + forward * Math.sin(heading) + sideways * Math.cos(heading);
    let closest = Infinity;
    let slot;
    for (let cy = Math.max(1, Math.floor(py) - 5); cy <= Math.min(height - 2, Math.floor(py) + 5); cy++) {
      for (let cx = Math.max(1, Math.floor(px) - 5); cx <= Math.min(width - 2, Math.floor(px) + 5); cx++) {
        const key = cy * width + cx;
        const distance = Math.hypot(cx + .5 - px, cy + .5 - py);
        if (distance >= closest || used.has(key) || blocked(cx, cy)) continue;
        closest = distance;
        slot = { x: cx + .5, y: cy + .5, key };
      }
    }
    if (!slot) break;
    used.add(slot.key);
    slots.push(slot);
  }
  return slots;
}
