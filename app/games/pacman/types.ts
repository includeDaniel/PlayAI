export type Dir = "left" | "right" | "up" | "down";

export interface Cell {
    r: number;
    c: number;
}
export interface Pos {
    x: number;
    y: number;
}

export interface Pacman {
    cell: Cell; // célula atual
    dir: Dir; // direção atual
    nextDir: Dir; // direção desejada (buffer)
    progress: number; // progresso 0..1 para próxima célula
    speedTiles: number; // velocidade em células/segundo
    alive: boolean;
    mouthPhase: number; // fase da animação da boca
}

export interface Ghost {
    name: string;
    color: string;
    cell: Cell;
    dir: Dir;
    progress: number;
    baseSpeed: number; // células/segundo (base)
    eaten: boolean;
    eyesHome: boolean; // fantasma virou apenas olhos voltando para casa
}

export interface GameState {
    pacman: Pacman;
    ghosts: Ghost[];
    frightenedUntil: number;
    lastTime: number;
    gameOver: boolean;
    won: boolean;
    ghostBrains?: Record<string, any>; // será tipado com GhostBrainState (import circular evitado aqui)
    adaptive?: GhostAdaptiveParams; // parâmetros de aprendizado incremental
    metrics?: GameMetrics; // métricas acumuladas da fase atual
}

// Métricas de performance por fase para ajustar dificuldade
export interface GameMetrics {
    level: number; // fase atual
    startTime: number; // timestamp do início da fase
    pelletsEaten: number; // pellets normais
    powerPelletsEaten: number; // power pellets
    ghostsEaten: number; // fantasmas comidos (em frightened)
    deaths: number; // mortes do Pac-Man
}

// Parâmetros adaptativos que influenciam decisão dos fantasmas
export interface GhostAdaptiveParams {
    predictionAhead: number; // quantas células à frente Pinky / Inky projetam (2..8)
    chaseWeight: number; // peso adicional para escolhas que aproximam do alvo (1..2)
    scatterFactor: number; // fator multiplicador da duração de scatter (0.3..1)
    randomness: number; // probabilidade de escolha aleatória em interseções (0..0.5)
    levelLearned: number; // última fase em que atualização ocorreu
}
