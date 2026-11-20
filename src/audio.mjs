let context;
let muted = false;
let lastNote = 0;

export function setMuted(value) {
  muted = value;
}

export function unlockAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio || muted) return;
  try {
    context ||= new Audio();
    if (context.state === 'suspended') context.resume().catch(() => {});
  } catch {
    // The game also runs when audio is unavailable.
  }
}

export function playSound(kind) {
  if (muted || context?.state !== 'running') return;
  const time = context.currentTime;
  if (time - lastNote < .07) return;
  lastNote = time;
  const tone = context.createOscillator();
  const volume = context.createGain();
  const [from, to, duration] = {
    order: [435, 610, .08], hit: [140, 48, .12], arrow: [520, 240, .09],
    complete: [391, 784, .31], raid: [185, 110, .44]
  }[kind];
  tone.type = kind === 'hit' ? 'triangle' : 'sine';
  tone.frequency.setValueAtTime(from, time);
  tone.frequency.exponentialRampToValueAtTime(to, time + duration);
  volume.gain.setValueAtTime(.0001, time);
  volume.gain.exponentialRampToValueAtTime(.07, time + .02);
  volume.gain.exponentialRampToValueAtTime(.0001, time + duration);
  tone.connect(volume);
  volume.connect(context.destination);
  tone.start(time);
  tone.stop(time + duration);
}
