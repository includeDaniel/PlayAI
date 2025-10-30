import type { Dir } from "./types";

export const TILE = 24;

export const DIRS: Record<
    Dir,
    { r: number; c: number; vx: number; vy: number }
> = {
    left: { r: 0, c: -1, vx: -1, vy: 0 },
    right: { r: 0, c: 1, vx: 1, vy: 0 },
    up: { r: -1, c: 0, vx: 0, vy: -1 },
    down: { r: 1, c: 0, vx: 0, vy: 1 },
};

export const ALL_DIRS: Dir[] = ["left", "right", "up", "down"];
export const REVERSE: Record<Dir, Dir> = {
    left: "right",
    right: "left",
    up: "down",
    down: "up",
};

export const PAC_SPEED = 4.4; // células/seg
export const GHOST_SPEED = 4.0; // células/seg
export const FRIGHTENED_SPEED = 3.2;
export const FRIGHTENED_MS = 6000;
