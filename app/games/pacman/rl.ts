import type { GameState, PacmanRLState, PacmanRLParams } from "./types";
import { manhattan, nextCell, validDirs, isWall } from "./logic";
import { MAP } from "./map";

const LS_RL_KEY = "pacman_rl_state_v1";

export function initRLState(): PacmanRLState {
    return {
        qTable: {},
        params: {
            epsilon: 0.25,
            epsilonMin: 0.02,
            epsilonDecay: 0.985,
            alpha: 0.18,
            gamma: 0.92,
        },
        metrics: {
            episode: 1,
            totalReward: 0,
            lastReward: 0,
            avgRewardWindow: 0,
            steps: 0,
        },
        lastUpdateTime: performance.now(),
    };
}

export function ensureRL(state: GameState): PacmanRLState {
    if (!state.rl) {
        state.rl = loadRLState() || initRLState();
    }
    return state.rl;
}

export function resetRLEpisodes(state: GameState) {
    const rl = ensureRL(state);
    rl.metrics.episode = 1;
    rl.metrics.totalReward = 0;
    rl.metrics.lastReward = 0;
    rl.metrics.avgRewardWindow = 0;
    rl.metrics.steps = 0;
    rl.prevStateKey = undefined;
    rl.prevActionIndex = undefined;
    persistRLState(rl);
}

// Encode state into compact string (coarse features to limit table size)
export function encodeState(state: GameState): string {
    const pac = state.pacman;
    const ghosts = state.ghosts;
    // Distâncias Manhattan aos 2 fantasmas mais próximos (clamped)
    const dists = ghosts
        .map((g) => manhattan(pac.cell, g.cell))
        .sort((a, b) => a - b)
        .slice(0, 2)
        .map((d) => Math.min(d, 12));
    while (dists.length < 2) dists.push(12);
    // Pellet / power pellet proximidade básica
    const pelletHere = MAP[pac.cell.r][pac.cell.c] === "." ? 1 : 0;
    const powerHere = MAP[pac.cell.r][pac.cell.c] === "o" ? 1 : 0;
    // Direções livres (bitmask)
    const dirs = validDirs(pac.cell);
    const mask = ["left", "right", "up", "down"]
        .map((d) => (dirs.includes(d as any) ? 1 : 0))
        .join("");
    return `${pac.cell.r},${pac.cell.c}|${dists[0]},${dists[1]}|${pelletHere}${powerHere}|${mask}`;
}

function ensureQ(qTable: Record<string, number[]>, key: string): number[] {
    if (!qTable[key]) qTable[key] = [0, 0, 0, 0];
    return qTable[key];
}

const ACTIONS = ["left", "right", "up", "down"] as const;
export type ActionIndex = 0 | 1 | 2 | 3;

export function chooseRLAction(state: GameState): ActionIndex {
    const rl = ensureRL(state);
    const key = encodeState(state); // estado corrente S_t
    if (rl.prevStateKey == null) rl.prevStateKey = key;
    const q = ensureQ(rl.qTable, key);

    // Filtrar apenas ações que levam a células não bloqueadas
    const pac = state.pacman;
    const DIR_INDEX: Record<string, ActionIndex> = {
        left: 0,
        right: 1,
        up: 2,
        down: 3,
    };
    const candidates: ActionIndex[] = validDirs(pac.cell).map(
        (d) => DIR_INDEX[d]
    );
    // Se por algum motivo não houver candidatos (não deveria), retorna 0
    if (!candidates.length) return 0;

    // Exploração: escolher aleatório dentre válidos
    if (Math.random() < rl.params.epsilon) {
        const rnd = Math.floor(Math.random() * candidates.length);
        return candidates[rnd];
    }

    // Exploração dirigida: melhor Q dentre candidatos
    let best = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
        const idx = candidates[i];
        if (q[idx] > q[best]) best = idx;
    }
    return best;
}

// Reward shaping heuristics
// Recompensa base remodelada:
//  - Passo neutro: penalidade ligeiramente maior (-0.02) para evitar stalling.
//  - Comer pellet normal: +1.2
//  - Comer power pellet: +10
//  - Comer fantasma: +8
//  - Morte: -30 (mais forte para desencorajar rotas arriscadas)
//  - Vitória (fase completa) tratada externamente: +50
//  - Penalização de looping (quando detectada externamente): aplicada via reward adicional negativo.
export function computeReward(
    prevState: GameState,
    newState: GameState,
    options: {
        pelletEaten?: boolean;
        powerEaten?: boolean;
        ghostEaten?: boolean;
        died?: boolean;
        loopPenalty?: number; // valor negativo adicional se repetindo caminho
        starvationSteps?: number; // passos consecutivos sem coletar
        stepTime?: number;
    }
): number {
    let r = -0.02; // passo base
    if (options.pelletEaten) r += 1.2;
    if (options.powerEaten) r += 10.0;
    if (options.ghostEaten) r += 8.0;
    if (options.died) r -= 30.0;
    if (options.loopPenalty) r += options.loopPenalty; // já negativo
    if (!options.pelletEaten && !options.powerEaten) {
        // Penalidade forte crescente (starvation) para encorajar avanço
        const st = options.starvationSteps || 0;
        if (st > 5) {
            // escala quadrática suave após 5 passos sem coletar
            const extra = -0.01 * (st - 5) * (st - 5); // -0.01, -0.04, -0.09, ...
            r += extra * 4; // amplifica => -0.04, -0.16, -0.36 ...
        }
        if (st > 20) {
            // endurecer ainda mais depois de 20
            r -= 1.0; // choque adicional
        }
    }
    return r;
}

export function updateQLearning(state: GameState, reward: number) {
    const rl = ensureRL(state);
    const newKey = encodeState(state); // S_{t+1}
    const qNow = ensureQ(rl.qTable, newKey);
    if (rl.prevStateKey != null && rl.prevActionIndex != null) {
        const qPrev = ensureQ(rl.qTable, rl.prevStateKey); // S_t
        const maxNext = Math.max(...qNow);
        const a = rl.prevActionIndex;
        qPrev[a] =
            qPrev[a] +
            rl.params.alpha * (reward + rl.params.gamma * maxNext - qPrev[a]);
    }
    // Não atualizamos prevStateKey aqui; isso acontecerá no próximo chooseRLAction se estiver undefined
    rl.metrics.totalReward += reward;
    rl.metrics.lastReward = reward;
    rl.metrics.steps += 1;
    rl.metrics.avgRewardWindow =
        rl.metrics.avgRewardWindow * 0.98 + reward * 0.02;
    persistRLState(rl);
}

// ===== Reward shaping avançado util =====
export function nearestPelletDistance(
    state: GameState,
    maxSearch = 30
): number {
    const start = state.pacman.cell;
    const visited = new Set<string>();
    const q: { r: number; c: number; d: number }[] = [
        { r: start.r, c: start.c, d: 0 },
    ];
    while (q.length) {
        const { r, c, d } = q.shift()!;
        const key = r + ":" + c;
        if (visited.has(key)) continue;
        visited.add(key);
        if (MAP[r][c] === ".") return d;
        if (d < maxSearch) {
            for (const dir of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ]) {
                let nr = r + dir[0];
                let nc = c + dir[1];
                if (nc < 0) nc = MAP[0].length - 1;
                if (nc >= MAP[0].length) nc = 0;
                if (nr < 0 || nr >= MAP.length) continue;
                if (MAP[nr][nc] === "#") continue;
                q.push({ r: nr, c: nc, d: d + 1 });
            }
        }
    }
    return maxSearch + 1; // none
}

export function minGhostDistance(state: GameState): number {
    const pac = state.pacman.cell;
    let best = Infinity;
    for (const g of state.ghosts) {
        const d = Math.abs(pac.r - g.cell.r) + Math.abs(pac.c - g.cell.c);
        if (d < best) best = d;
    }
    return best === Infinity ? 0 : best;
}

export type EpisodeEndReason = "win" | "death" | "timeout" | "other";

export function endEpisode(
    state: GameState,
    reason: EpisodeEndReason = "other"
) {
    const rl = ensureRL(state);
    // Adaptativo: ajusta fator conforme performance e razão
    const baseDecay = rl.params.epsilonDecay; // 0.985 original
    let effectiveDecay = baseDecay;
    const avg = rl.metrics.avgRewardWindow;
    const steps = rl.metrics.steps;

    if (reason === "win") {
        // Acelera redução: aproxima do min mais rápido
        effectiveDecay = 0.9; // queda forte neste episódio
    } else if (reason === "death") {
        // Se morte muito cedo (poucos passos) e reward ruim, manter ou até subir levemente para explorar
        if (steps < 40 && avg < -0.2) {
            // pequeno aumento exploratório (desfaz parte do decay)
            rl.params.epsilon = Math.min(0.5, rl.params.epsilon * 1.08);
        } else {
            effectiveDecay = 0.992; // decai mais devagar para manter exploração
        }
    } else if (reason === "timeout") {
        // Episódio longo sem ganhar: leve ajuste para mais exploração
        rl.params.epsilon = Math.min(0.45, rl.params.epsilon * 1.02);
        effectiveDecay = 0.99;
    } else {
        // default: usar base, mas se reward médio muito negativo, segura exploração
        if (avg < -0.5) {
            rl.params.epsilon = Math.min(0.6, rl.params.epsilon * 1.05);
            effectiveDecay = 0.995;
        }
    }

    if (rl.params.epsilon > rl.params.epsilonMin) {
        rl.params.epsilon = Math.max(
            rl.params.epsilonMin,
            rl.params.epsilon * effectiveDecay
        );
    }
    rl.metrics.episode += 1;
    rl.metrics.totalReward = 0;
    rl.metrics.steps = 0;
    rl.metrics.lastReward = 0;
    rl.prevStateKey = undefined;
    rl.prevActionIndex = undefined;
    persistRLState(rl);
}

export function persistRLState(rl: PacmanRLState) {
    try {
        localStorage.setItem(LS_RL_KEY, JSON.stringify(rl));
    } catch {}
}

export function loadRLState(): PacmanRLState | null {
    try {
        const raw = localStorage.getItem(LS_RL_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as PacmanRLState;
    } catch {
        return null;
    }
}

export function selectDirFromAction(
    idx: ActionIndex
): "left" | "right" | "up" | "down" {
    return ACTIONS[idx];
}

// ===== Utilidades extras =====
export function hardResetRL(state?: GameState) {
    try {
        localStorage.removeItem(LS_RL_KEY);
    } catch {}
    if (state) state.rl = initRLState();
}

export function exportRLState(state: GameState): string {
    const rl = ensureRL(state);
    return JSON.stringify(rl);
}

export function importRLState(state: GameState, json: string): boolean {
    try {
        const parsed = JSON.parse(json);
        if (!parsed || typeof parsed !== "object") return false;
        if (!parsed.qTable || !parsed.params || !parsed.metrics) return false;
        state.rl = parsed as PacmanRLState;
        persistRLState(state.rl);
        return true;
    } catch {
        return false;
    }
}
