import type { Cell, Dir, Pos } from "./types";
import { ALL_DIRS, DIRS } from "./constants";
import { MAP, COLS, ROWS } from "./map";

export function isWall(r: number, c: number): boolean {
    if (c < 0 || c >= COLS) return true;
    if (r < 0 || r >= ROWS) return true;
    return MAP[r][c] === "#";
}
export function isPellet(r: number, c: number): boolean {
    return MAP[r][c] === ".";
}
export function isPower(r: number, c: number): boolean {
    return MAP[r][c] === "o";
}
export function nextCell(cell: Cell, dir: Dir): Cell {
    const d = DIRS[dir];
    let nr = cell.r + d.r;
    let nc = cell.c + d.c;
    if (nc < 0) nc = COLS - 1; // túnel horizontal
    if (nc >= COLS) nc = 0;
    return { r: nr, c: nc };
}
export function manhattan(a: Cell, b: Cell): number {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}
export function choice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
export function cellCenter(cell: Cell): Pos {
    return { x: cell.c * 24 + 12, y: cell.r * 24 + 12 }; // usa TILE fixo local para evitar import circular
}
export function lerp(a: Pos, b: Pos, t: number): Pos {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
export function validDirs(cell: Cell): Dir[] {
    const res: Dir[] = [];
    for (const d of ALL_DIRS) {
        const n = nextCell(cell, d);
        if (!isWall(n.r, n.c)) res.push(d);
    }
    return res;
}
export function canTurn(cell: Cell, dir: Dir): boolean {
    const n = nextCell(cell, dir);
    return !isWall(n.r, n.c);
}
export function chooseClosest(
    opts: Dir[],
    fromCell: Cell,
    targetCell: Cell
): Dir {
    let best = opts[0];
    let bestDist = Infinity;
    for (const d of opts) {
        const n = nextCell(fromCell, d);
        const dist = manhattan(n, targetCell);
        if (dist < bestDist) {
            bestDist = dist;
            best = d;
        }
    }
    return best;
}
