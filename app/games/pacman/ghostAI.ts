import type {
    Ghost,
    Pacman,
    GameState,
    Cell,
    Dir,
    GhostAdaptiveParams,
} from "./types";
import { REVERSE, ALL_DIRS } from "./constants";
import { nextCell } from "./logic";
import { MAP } from "./map";
import { chooseClosest } from "./logic";

// Modos globais: scatter (fantasmas miram cantos), chase (perseguem Pac-Man), frightened (já tratado em Game), eyes (voltando casa)
export type GhostMode = "scatter" | "chase" | "frightened" | "eyes";

export interface GhostBrainState {
    mode: GhostMode;
    // timestamps para alternância
    modeEndsAt: number; // quando o modo atual termina (scatter <-> chase)
    scatterIndex: number; // ciclo atual
}

// Duração dos ciclos iniciais (simplificado)
// Arcade clássico tem uma sequência específica; aqui uma versão reduzida.
const BASE_SCATTER_CHASE_CYCLE: { scatter: number; chase: number }[] = [
    { scatter: 7000, chase: 20000 },
    { scatter: 7000, chase: 20000 },
    { scatter: 5000, chase: 20000 },
    { scatter: 5000, chase: 20000 }, // depois fica chase contínuo
];

// Cantos alvo para scatter
const SCATTER_TARGETS: Record<string, Cell> = {
    blinky: { r: 0, c: MAP[0].length - 1 }, // topo-direito
    pinky: { r: 0, c: 0 }, // topo-esquerdo
    inky: { r: MAP.length - 1, c: MAP[0].length - 1 }, // baixo-direito
    clyde: { r: MAP.length - 1, c: 0 }, // baixo-esquerdo
};

// Calcula célula alvo no modo chase conforme personalidade
export function computeChaseTarget(
    g: Ghost,
    pac: Pacman,
    ghosts: Ghost[]
): Cell {
    switch (g.name) {
        case "blinky":
            return pac.cell; // direto
        case "pinky": {
            // quatro células à frente na direção de Pac-Man
            const ahead = projectAhead(pac.cell, pac.dir, 4);
            return ahead;
        }
        case "inky": {
            // Inky usa posição 2 à frente do Pac-Man combinada com Blinky
            const blinky = ghosts.find((x) => x.name === "blinky");
            const twoAhead = projectAhead(pac.cell, pac.dir, 2);
            if (blinky) {
                const vecR = twoAhead.r - blinky.cell.r;
                const vecC = twoAhead.c - blinky.cell.c;
                return { r: twoAhead.r + vecR, c: twoAhead.c + vecC }; // dobra vetor
            }
            return twoAhead;
        }
        case "clyde": {
            // Se distante (>8) persegue; se perto retorna canto scatter
            const dist =
                Math.abs(g.cell.r - pac.cell.r) +
                Math.abs(g.cell.c - pac.cell.c);
            if (dist > 8) return pac.cell;
            return SCATTER_TARGETS.clyde;
        }
        default:
            return pac.cell;
    }
}

function projectAhead(start: Cell, dir: Dir, steps: number): Cell {
    let cell = { ...start };
    for (let i = 0; i < steps; i++) {
        cell = nextCell(cell, dir);
    }
    return cell;
}

export function initGhostBrain(): GhostBrainState {
    const now = performance.now();
    return {
        mode: "scatter",
        modeEndsAt: now + BASE_SCATTER_CHASE_CYCLE[0].scatter,
        scatterIndex: 0,
    };
}

export function updateGhostBrain(
    brain: GhostBrainState,
    state: GameState
): void {
    const now = performance.now();
    if (brain.mode === "frightened" || brain.mode === "eyes") {
        // controle desses modos fica em Game; aqui só mantemos até serem desativados
        return;
    }
    const adaptive: GhostAdaptiveParams | undefined = state.adaptive;
    const cycle =
        BASE_SCATTER_CHASE_CYCLE[brain.scatterIndex] ||
        BASE_SCATTER_CHASE_CYCLE[BASE_SCATTER_CHASE_CYCLE.length - 1];
    const scatterScaled = adaptive
        ? cycle.scatter * adaptive.scatterFactor
        : cycle.scatter;
    if (brain.scatterIndex >= BASE_SCATTER_CHASE_CYCLE.length) {
        // chase permanente depois do último ciclo
        brain.mode = "chase";
        return;
    }
    if (now >= brain.modeEndsAt) {
        if (brain.mode === "scatter") {
            brain.mode = "chase";
            brain.modeEndsAt = now + cycle.chase; // chase não escalado
        } else if (brain.mode === "chase") {
            brain.scatterIndex += 1;
            brain.mode = "scatter";
            const nextBase =
                BASE_SCATTER_CHASE_CYCLE[
                    Math.min(
                        brain.scatterIndex,
                        BASE_SCATTER_CHASE_CYCLE.length - 1
                    )
                ];
            const nextScatterScaled = adaptive
                ? nextBase.scatter * adaptive.scatterFactor
                : nextBase.scatter;
            brain.modeEndsAt = now + nextScatterScaled;
        }
    }
}

// Decide direção em interseção conforme modo/personalidade
export function decideGhostDirection(
    g: Ghost,
    brain: GhostBrainState,
    pac: Pacman,
    ghosts: Ghost[],
    validDirs: Dir[],
    adaptive?: GhostAdaptiveParams
): Dir {
    // Remove reverso para evitar oscilar
    const opts = validDirs.filter((d) => d !== REVERSE[g.dir]);
    if (!opts.length) return g.dir;

    if (g.eyesHome) {
        // Volta para casa (fixo)
        return chooseClosest(opts, g.cell, { r: 8, c: 9 });
    }

    if (brain.mode === "frightened" && !g.eaten) {
        // aleatório
        return opts[Math.floor(Math.random() * opts.length)];
    }

    // adaptive é passado pelo chamador (Game) para evitar dependência direta de state
    // Randomness oportunidade
    if (adaptive && Math.random() < adaptive.randomness) {
        return opts[Math.floor(Math.random() * opts.length)];
    }
    let target: Cell;
    if (brain.mode === "scatter") {
        target = SCATTER_TARGETS[g.name] || pac.cell;
    } else {
        // Usar predictionAhead adaptativo para Pinky/Inky
        target = computeChaseTargetAdaptive(g, pac, ghosts, adaptive);
    }
    // Escolha ponderada por chaseWeight: diminuir distância ao alvo
    if (!adaptive || adaptive.chaseWeight === 1) {
        return chooseClosest(opts, g.cell, target);
    }
    // Avalia cada opção
    let best: Dir = opts[0];
    let bestScore = Infinity;
    for (const d of opts) {
        const nc = nextCell(g.cell, d);
        const dist = Math.abs(nc.r - target.r) + Math.abs(nc.c - target.c);
        const score = dist * (1 / adaptive.chaseWeight); // menor é melhor
        if (score < bestScore) {
            bestScore = score;
            best = d;
        }
    }
    return best;
}

function computeChaseTargetAdaptive(
    g: Ghost,
    pac: Pacman,
    ghosts: Ghost[],
    adaptive?: GhostAdaptiveParams
): Cell {
    // Reusa personalidade, mas ajusta projeções
    const ahead = adaptive?.predictionAhead || 4;
    switch (g.name) {
        case "blinky":
            return pac.cell;
        case "pinky": {
            return projectAhead(pac.cell, pac.dir, ahead);
        }
        case "inky": {
            const blinky = ghosts.find((x) => x.name === "blinky");
            const twoAhead = projectAhead(
                pac.cell,
                pac.dir,
                Math.max(2, Math.round(ahead / 2))
            );
            if (blinky) {
                const vecR = twoAhead.r - blinky.cell.r;
                const vecC = twoAhead.c - blinky.cell.c;
                return { r: twoAhead.r + vecR, c: twoAhead.c + vecC };
            }
            return twoAhead;
        }
        case "clyde": {
            const dist =
                Math.abs(g.cell.r - pac.cell.r) +
                Math.abs(g.cell.c - pac.cell.c);
            if (dist > 8) return pac.cell;
            return SCATTER_TARGETS.clyde;
        }
        default:
            return pac.cell;
    }
}
