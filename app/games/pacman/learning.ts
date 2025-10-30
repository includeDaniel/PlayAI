import type { GhostAdaptiveParams, GameMetrics, GameState } from "./types";

// Valor base referencial para scatter (usado nos cálculos de ajuste)
const BASE_SCATTER_MS = 7000;

// Inicializa parâmetros adaptativos
export function initAdaptiveParams(): GhostAdaptiveParams {
    return {
        predictionAhead: 4, // parecido com Pinky clássico
        chaseWeight: 1.05,
        scatterFactor: 1.0,
        randomness: 0.12,
        levelLearned: 1,
    };
}

export function initMetrics(level: number): GameMetrics {
    return {
        level,
        startTime: performance.now(),
        pelletsEaten: 0,
        powerPelletsEaten: 0,
        ghostsEaten: 0,
        deaths: 0,
    };
}

// Calcula pontuação de performance da fase
export function computePerformanceScore(m: GameMetrics): number {
    const elapsedSec = (performance.now() - m.startTime) / 1000;
    return (
        m.pelletsEaten * 1 +
        m.powerPelletsEaten * 8 +
        m.ghostsEaten * 15 -
        m.deaths * 25 -
        elapsedSec * 0.02
    );
}

export function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v;
}

// Atualiza parâmetros adaptativos sem histórico persistido
export function updateAdaptiveParams(
    prev: GhostAdaptiveParams,
    score: number,
    level: number
): GhostAdaptiveParams {
    const targetScore = 360;
    const ratio = score / targetScore;
    let { predictionAhead, chaseWeight, scatterFactor, randomness } = prev;

    if (ratio > 1.05) {
        const boost = Math.min(ratio - 1.0, 0.6);
        predictionAhead += 0.6 + boost * 0.6;
        chaseWeight += 0.08 + boost * 0.12;
        scatterFactor -= 0.12 + boost * 0.15;
        randomness -= 0.05 + boost * 0.06;
    } else if (ratio < 0.75) {
        const drop = Math.min(1 - ratio, 0.6);
        predictionAhead -= 0.45 + drop * 0.5;
        chaseWeight -= 0.06 + drop * 0.09;
        scatterFactor += 0.15 + drop * 0.2;
        randomness += 0.06 + drop * 0.1;
    } else {
        predictionAhead += (ratio - 1) * 0.4;
        chaseWeight += (ratio - 1) * 0.07;
        scatterFactor += ratio < 1 ? (1 - ratio) * 0.1 : (ratio - 1) * -0.1;
    }

    predictionAhead = clamp(predictionAhead, 2, 8);
    chaseWeight = clamp(chaseWeight, 1.0, 1.6);
    scatterFactor = clamp(scatterFactor, 0.2, 1.1);
    randomness = clamp(randomness, 0.0, 0.5);

    return {
        predictionAhead,
        chaseWeight,
        scatterFactor,
        randomness,
        levelLearned: level,
    };
}

export function ensureAdaptive(state: GameState): GhostAdaptiveParams {
    if (!state.adaptive) state.adaptive = initAdaptiveParams();
    return state.adaptive;
}

export function ensureMetrics(state: GameState, level: number): GameMetrics {
    if (!state.metrics || state.metrics.level !== level) {
        state.metrics = initMetrics(level);
    }
    return state.metrics;
}
