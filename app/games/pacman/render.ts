import type { Pacman, Ghost, Pos } from "./types";
import { TILE } from "./constants";
import { MAP, COLS, ROWS } from "./map";

// Desenho do mapa (paredes e pellets)
export function drawMap(ctx: CanvasRenderingContext2D): void {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const ch = MAP[r][c];
            const x = c * TILE;
            const y = r * TILE;
            if (ch === "#") {
                ctx.fillStyle = "#0a1e7a";
                ctx.fillRect(x, y, TILE, TILE);
                ctx.strokeStyle = "#1a4cff";
                ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
            } else {
                ctx.fillStyle = "#000";
                ctx.fillRect(x, y, TILE, TILE);
                if (ch === ".") {
                    ctx.fillStyle = "#f7f7f7";
                    ctx.beginPath();
                    ctx.arc(x + TILE / 2, y + TILE / 2, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (ch === "o") {
                    ctx.fillStyle = "#f7f7f7";
                    ctx.beginPath();
                    ctx.arc(x + TILE / 2, y + TILE / 2, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}

export function drawPacman(
    ctx: CanvasRenderingContext2D,
    pos: Pos,
    pac: Pacman
): void {
    const dir = pac.dir;
    const baseAngle =
        dir === "left"
            ? Math.PI
            : dir === "right"
              ? 0
              : dir === "up"
                ? -Math.PI / 2
                : Math.PI / 2;
    const cycle = (Math.sin(pac.mouthPhase) + 1) / 2;
    const maxOpen = 0.7;
    const mouthAngle = cycle * maxOpen;
    const R = TILE * 0.5 - 1;
    ctx.fillStyle = "#ffec00";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.arc(
        pos.x,
        pos.y,
        R,
        baseAngle + mouthAngle,
        baseAngle - mouthAngle,
        true
    );
    ctx.lineTo(pos.x, pos.y);
    ctx.closePath();
    ctx.fill();
}

export function drawGhost(
    ctx: CanvasRenderingContext2D,
    pos: Pos,
    g: Ghost,
    frightened: boolean
): void {
    const r = TILE * 0.45;
    const baseY = pos.y + r * 0.6;
    ctx.beginPath();
    ctx.fillStyle = g.eyesHome ? "#ffffff" : frightened ? "#1e90ff" : g.color;
    ctx.moveTo(pos.x - r, baseY);
    ctx.quadraticCurveTo(pos.x - r, pos.y - r, pos.x, pos.y - r);
    ctx.quadraticCurveTo(pos.x + r, pos.y - r, pos.x + r, baseY);
    for (let i = 3; i >= -3; i--) {
        const dx = (i / 3) * r;
        const dy = i % 2 === 0 ? 0 : 4;
        ctx.lineTo(pos.x + dx, baseY + dy);
    }
    ctx.closePath();
    ctx.fill();
    // olhos
    ctx.fillStyle = "#fff";
    const eyeDx = g.dir === "left" ? -4 : g.dir === "right" ? 4 : 0;
    const eyeDy = g.dir === "up" ? -4 : g.dir === "down" ? 4 : 0;
    for (const ex of [-6, 6]) {
        ctx.beginPath();
        ctx.arc(pos.x + ex, pos.y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a2bff";
        ctx.beginPath();
        ctx.arc(
            pos.x + ex + eyeDx / 2,
            pos.y - 2 + eyeDy / 2,
            2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = "#fff";
    }
}

export function overlay(
    ctx: CanvasRenderingContext2D,
    title: string,
    subtitle: string
): void {
    const dpi = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpi;
    const h = ctx.canvas.height / dpi;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffd800";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, w / 2, h / 2 - 8);
    ctx.fillStyle = "#e6e8ef";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(subtitle, w / 2, h / 2 + 18);
}
