import React, { useEffect, useRef, useState } from "react";
import type { Dir, Cell, Pos, Pacman, Ghost, GameState } from "./types";
import {
    TILE,
    DIRS,
    ALL_DIRS,
    REVERSE,
    PAC_SPEED,
    GHOST_SPEED,
    FRIGHTENED_SPEED,
    FRIGHTENED_MS,
} from "./constants";
import {
    MAP,
    ROWS,
    COLS,
    replaceMapChar,
    resetMapToOriginal,
    autoFillPellets,
} from "./map";
import {
    isWall,
    isPellet,
    isPower,
    nextCell,
    manhattan,
    choice,
    cellCenter,
    lerp,
    validDirs,
    canTurn,
    chooseClosest,
} from "./logic";
import { drawMap, drawPacman, drawGhost, overlay } from "./render";
import {
    initGhostBrain,
    updateGhostBrain,
    decideGhostDirection,
} from "./ghostAI";
import type { GhostBrainState } from "./ghostAI";
import {
    ensureAdaptive,
    ensureMetrics,
    computePerformanceScore,
    updateAdaptiveParams,
} from "./learning";
// GA / pacAI removido (substituído exclusivamente por RL)
import {
    ensureRL,
    chooseRLAction,
    selectDirFromAction,
    updateQLearning,
    computeReward,
    endEpisode,
    nearestPelletDistance,
    minGhostDistance,
} from "./rl";
import "../pacman/styles/index.css";

// Funções de lógica removidas (agora importadas de ./logic)

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [running, setRunning] = useState<boolean>(true);
    const [score, setScore] = useState<number>(0);
    const [lives, setLives] = useState<number>(3);
    const [level, setLevel] = useState<number>(1);
    const [iaMode, setIaMode] = useState<boolean>(false); // IA (Q-Learning) único modo automático
    const iaModeRef = useRef<boolean>(false);
    useEffect(() => {
        iaModeRef.current = iaMode;
    }, [iaMode]);
    const pelletsLeftRef = useRef<number>(0);
    const stateRef = useRef<GameState | null>(null);
    const lastLogRef = useRef<Record<string, number>>({});
    const lastDirRef = useRef<Record<string, Dir>>({});
    const lastModeRef = useRef<Record<string, string>>({});

    useEffect(() => {
        resetMapToOriginal();
        resetLevel(true);
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (!s) return;
            // Reiniciar mesmo em game over
            if (e.key === "r" || e.key === "R") {
                setScore(0);
                setLives(3);
                setLevel(1);
                resetMapToOriginal();
                resetLevel(true);
                setRunning(true);
                return;
            }
            // Bloqueia demais controles se game over
            if (s.gameOver) return;
            if (e.key === "p" || e.key === "P") {
                setRunning((v) => !v);
                return;
            }
            if (iaModeRef.current) return; // ignora setas em modo IA
            if (e.key === "ArrowLeft") s.pacman.nextDir = "left";
            else if (e.key === "ArrowRight") s.pacman.nextDir = "right";
            else if (e.key === "ArrowUp") s.pacman.nextDir = "up";
            else if (e.key === "ArrowDown") s.pacman.nextDir = "down";
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        let raf: number | null = null;
        function frame() {
            const s = stateRef.current;
            if (!s) {
                raf = requestAnimationFrame(frame);
                return;
            }
            const now = performance.now();
            let dt = now - s.lastTime;
            // clamp para evitar saltos em background
            if (dt > 50) dt = 50;
            s.lastTime = now;
            if (running && !s.gameOver) {
                updateGame(s, dt / 1000);
            }
            draw(canvasRef.current, s);
            raf = requestAnimationFrame(frame);
        }
        raf = requestAnimationFrame(frame);
        return () => {
            if (raf !== null) cancelAnimationFrame(raf);
        };
    }, [running]);

    function resetLevel(hard = false): void {
        // Selecionar mapa conforme fase atual
        resetMapToOriginal(level);
        if (hard) {
            // Recria pellets deterministicamente (fantasma da aleatoriedade removido)
            autoFillPellets();
        }
        // contar pellets sempre após possível refill
        let pellets = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (isPellet(r, c) || isPower(r, c)) pellets++;
            }
        }
        pelletsLeftRef.current = pellets;

        const pacSpawn: Cell = { r: 11, c: 9 };
        const ghostHome: Cell = { r: 8, c: 9 };

        const pacman: Pacman = {
            cell: { ...pacSpawn },
            dir: "left",
            nextDir: "left",
            progress: 0,
            speedTiles: PAC_SPEED,
            alive: true,
            mouthPhase: 0,
        };
        const ghosts: Ghost[] = [
            makeGhost("blinky", "#ff0000", ghostHome),
            makeGhost("pinky", "#ffb8ff", {
                r: ghostHome.r,
                c: ghostHome.c - 1,
            }),
            makeGhost("inky", "#00ffff", {
                r: ghostHome.r,
                c: ghostHome.c + 1,
            }),
            makeGhost("clyde", "#ffb852", {
                r: ghostHome.r - 1,
                c: ghostHome.c,
            }),
        ];

        const ghostBrains: Record<string, GhostBrainState> = {};
        for (const g of ghosts) ghostBrains[g.name] = initGhostBrain();
        const adaptive = ensureAdaptive({} as any as GameState); // inicialização isolada
        const metrics = ensureMetrics({ adaptive } as any as GameState, level);

        const st: GameState = {
            pacman,
            ghosts,
            frightenedUntil: 0,
            lastTime: performance.now(),
            gameOver: false,
            won: false,
            ghostBrains,
            adaptive,
            metrics,
        };
        stateRef.current = st;
    }

    function makeGhost(name: string, color: string, cell: Cell): Ghost {
        return {
            name,
            color,
            cell: { ...cell },
            dir: "left",
            progress: 0,
            baseSpeed: GHOST_SPEED,
            eaten: false,
            eyesHome: false,
        };
    }

    function updateGame(s: GameState, dt: number): void {
        // Single Pac-Man only
        const pac = s.pacman; // referência principal

        // Helper: BFS limitada para encontrar primeiro passo em direção a pellet/power pouco visitado
        function planPathToFreshPellet(maxDepth = 40): Dir | null {
            const rlAny = (s.rl as any) || {};
            const visitCounts = rlAny._visitCounts || {};
            type Node = { r: number; c: number; path: Dir[] };
            const start: Node = { r: pac.cell.r, c: pac.cell.c, path: [] };
            const queue: Node[] = [start];
            const seen = new Set<string>([start.r + "," + start.c]);
            let iters = 0;
            while (queue.length && iters < 1200) {
                // guarda de segurança
                const cur = queue.shift()!;
                iters++;
                const depth = cur.path.length;
                if (depth > maxDepth) continue;
                const ch = MAP[cur.r][cur.c];
                const key = cur.r + "," + cur.c;
                const visits = visitCounts[key] || 0;
                // Critério de alvo: pellet/power nunca visitado ou muito pouco visitado
                if ((ch === "." || ch === "o") && visits === 0 && depth > 0) {
                    return cur.path[0];
                }
                // Expandir vizinhos
                const dirsHere = validDirs({ r: cur.r, c: cur.c });
                for (const d of dirsHere) {
                    const nc = nextCell({ r: cur.r, c: cur.c }, d);
                    const nKey = nc.r + "," + nc.c;
                    if (seen.has(nKey)) continue;
                    if (isWall(nc.r, nc.c)) continue;
                    seen.add(nKey);
                    queue.push({ r: nc.r, c: nc.c, path: [...cur.path, d] });
                }
            }
            return null;
        }

        // Helper: detecção de "canto" / confinamento (bounding box muito pequena recentemente)
        function detectCornerTrap(): boolean {
            const rlAny = (s.rl as any) || {};
            rlAny._recentPositions = rlAny._recentPositions || [];
            rlAny._recentPositions.push(pac.cell.r + "," + pac.cell.c);
            if (rlAny._recentPositions.length > 30)
                rlAny._recentPositions.shift();
            const coords = rlAny._recentPositions.map((k: string) =>
                k.split(",").map(Number)
            );
            let minR = Infinity,
                maxR = -Infinity,
                minC = Infinity,
                maxC = -Infinity;
            for (const [r, c] of coords) {
                if (r < minR) minR = r;
                if (r > maxR) maxR = r;
                if (c < minC) minC = c;
                if (c > maxC) maxC = c;
            }
            const width = maxC - minC + 1;
            const height = maxR - minR + 1;
            const uniq = new Set(rlAny._recentPositions).size;
            // Pequena caixa e baixa diversidade => possível aprisionamento
            return width + height <= 6 && uniq <= 0.6 * (width * height);
        }

        // Atualiza fase da boca com velocidade constante (estilo clássico)
        const MOUTH_ANIM_SPEED = 6; // ciclos por segundo
        pac.mouthPhase += dt * MOUTH_ANIM_SPEED * Math.PI; // escala para radianos
        if (pac.mouthPhase > Math.PI * 2) pac.mouthPhase -= Math.PI * 2;

        if (iaModeRef.current) {
            // IA (Q-Learning) decide a cada célula / quando pode virar
            if (pac.progress < 0.2) {
                const rl = ensureRL(s);
                const actionIdx = chooseRLAction(s);
                let dir = selectDirFromAction(actionIdx);
                if (s.rl) s.rl.prevActionIndex = actionIdx as any;

                // (Revertido) Sem override especial para perseguir fantasmas em modo frightened

                // ================= Anti Ping-Pong / Anti-Stuck =================
                const rlAny = s.rl as any;
                rlAny._cellSequence = rlAny._cellSequence || [];
                const cellKey = pac.cell.r + "," + pac.cell.c;
                rlAny._cellSequence.push(cellKey);
                if (rlAny._cellSequence.length > 12)
                    rlAny._cellSequence.shift();

                // Detecta ping-pong simples ABAB nas últimas 4 posições
                if (rlAny._cellSequence.length >= 4) {
                    const a =
                        rlAny._cellSequence[rlAny._cellSequence.length - 4];
                    const b =
                        rlAny._cellSequence[rlAny._cellSequence.length - 3];
                    const c =
                        rlAny._cellSequence[rlAny._cellSequence.length - 2];
                    const d =
                        rlAny._cellSequence[rlAny._cellSequence.length - 1];
                    const pingPong = a === c && b === d && a !== b;
                    if (pingPong) {
                        // Se existe mais de uma direção livre, evita reverter
                        const dirsLivres = validDirs(pac.cell);
                        const reverseDir = REVERSE[pac.dir];
                        const alternativas = dirsLivres.filter(
                            (d) => d !== reverseDir
                        );
                        if (alternativas.length > 0) {
                            // Escolhe alternativa com menor distância Manhattan a algum pellet (heurística simples)
                            let melhor = alternativas[0];
                            let melhorScore = Infinity;
                            for (const cand of alternativas) {
                                const nc = nextCell(pac.cell, cand);
                                // heurística: distância para encontrar pellet mais próximo a partir da célula vizinha
                                // reutiliza nearestPelletDistance de forma aproximada: criar estado temporário
                                const tmpState: GameState = {
                                    ...s,
                                    pacman: { ...pac, cell: nc },
                                } as GameState;
                                const dist = nearestPelletDistance(
                                    tmpState,
                                    20
                                );
                                if (dist < melhorScore) {
                                    melhorScore = dist;
                                    melhor = cand;
                                }
                            }
                            dir = melhor;
                        }
                    }
                }

                // Detecta ficar parado (mesma célula repetida várias vezes) e força rotação
                if (rlAny._cellSequence.length >= 6) {
                    const last6 = rlAny._cellSequence.slice(-6);
                    const uniq = new Set(last6);
                    if (uniq.size <= 2) {
                        const dirsLivres = validDirs(pac.cell);
                        const reverseDir = REVERSE[pac.dir];
                        const alternativas = dirsLivres.filter(
                            (d) => d !== reverseDir
                        );
                        if (alternativas.length > 0) {
                            dir =
                                alternativas[
                                    Math.floor(
                                        Math.random() * alternativas.length
                                    )
                                ];
                        }
                    }
                }
                // Viés exploratório adicional: quando epsilon já está baixo, escolher direção que leva a célula menos visitada / com pellet
                if (s.rl && s.rl.params.epsilon < 0.25) {
                    rlAny._visitCounts =
                        rlAny._visitCounts || Object.create(null);
                    const dirsValid = validDirs(pac.cell);
                    if (dirsValid.length > 1) {
                        const reverseDir = REVERSE[pac.dir];
                        const candidates = dirsValid.filter(
                            (d) => d !== reverseDir
                        );
                        const usable = candidates.length
                            ? candidates
                            : dirsValid;
                        let bestDir = dir;
                        let bestScore = -Infinity;
                        for (const cand of usable) {
                            const nc = nextCell(pac.cell, cand);
                            const key = nc.r + "," + nc.c;
                            const visits = rlAny._visitCounts[key] || 0;
                            // Peso maior para células nunca visitadas
                            let score =
                                visits === 0 ? 12 : 5 - Math.min(visits, 5);
                            const tileCh = MAP[nc.r][nc.c];
                            if (tileCh === ".") score += visits === 0 ? 3.5 : 2;
                            else if (tileCh === "o")
                                score += visits === 0 ? 6 : 4;
                            // bônus leve se todas as adjacentes já visitadas (escassez local)
                            const adj = validDirs(nc);
                            let freshAdj = 0;
                            for (const ad of adj) {
                                const ac = nextCell(nc, ad);
                                if (
                                    !(rlAny._visitCounts[ac.r + "," + ac.c] > 0)
                                )
                                    freshAdj++;
                            }
                            score += freshAdj * 0.4;
                            score += Math.random() * 0.05; // pequena aleatoriedade
                            if (score > bestScore) {
                                bestScore = score;
                                bestDir = cand;
                            }
                        }
                        dir = bestDir;
                    }
                }

                // Corner escape: se detectado confinamento, tentar planejar saída
                if (detectCornerTrap()) {
                    const planned = planPathToFreshPellet(60);
                    if (planned) {
                        dir = planned;
                        (s.rl as any)._forcedEscape = true;
                    }
                } else if ((s.rl as any)?._forcedEscape) {
                    // Reset flag quando já não confinado
                    (s.rl as any)._forcedEscape = false;
                }

                // Planejamento BFS quando nenhuma opção realmente fresca imediata
                if (s.rl) {
                    const dirsValid = validDirs(pac.cell);
                    const reverseDir = REVERSE[pac.dir];
                    const usable =
                        dirsValid.filter((d) => d !== reverseDir) || dirsValid;
                    const allVisited = usable.every((d) => {
                        const nc = nextCell(pac.cell, d);
                        const key = nc.r + "," + nc.c;
                        return (
                            rlAny._visitCounts &&
                            rlAny._visitCounts[key] > 0 &&
                            MAP[nc.r][nc.c] !== "." &&
                            MAP[nc.r][nc.c] !== "o"
                        );
                    });
                    if (allVisited) {
                        const step = planPathToFreshPellet();
                        if (step) dir = step;
                    }
                }
                // ================================================================

                pac.nextDir = dir;
                const tryCell = nextCell(pac.cell, dir);
                if (!isWall(tryCell.r, tryCell.c)) pac.dir = dir;
                if (rl) {
                    (rl as any)._lastPelletDist = nearestPelletDistance(s);
                    (rl as any)._lastGhostMinDist = minGhostDistance(s);
                }
            }
        }

        // Buffer de virada: permitir virar próximo ao centro
        const applyTurn = (pc: Pacman) => {
            if (
                pc.nextDir &&
                canTurn(pc.cell, pc.nextDir) &&
                pc.progress < 0.15
            )
                pc.dir = pc.nextDir;
        };
        applyTurn(pac);

        const moveAndConsume = (pc: Pacman) => {
            const target = nextCell(pc.cell, pc.dir);
            const blockedLocal = isWall(target.r, target.c);
            if (!blockedLocal) {
                pc.progress += pc.speedTiles * dt;
                while (pc.progress >= 1) {
                    pc.progress -= 1;
                    pc.cell = nextCell(pc.cell, pc.dir);
                    const ch = MAP[pc.cell.r][pc.cell.c];
                    let pelletEaten = false;
                    let powerEaten = false;
                    if (ch === "." || ch === "o") {
                        setScore((prev) => prev + (ch === "o" ? 50 : 10));
                        pelletsLeftRef.current -= 1;
                        replaceMapChar(pc.cell.r, pc.cell.c, " ");
                        const st = stateRef.current;
                        if (st?.metrics) {
                            if (ch === "o") st.metrics.powerPelletsEaten += 1;
                            else st.metrics.pelletsEaten += 1;
                        }
                        pelletEaten = ch === ".";
                        powerEaten = ch === "o";
                        if (ch === "o") {
                            s.frightenedUntil =
                                performance.now() + FRIGHTENED_MS;
                            s.ghosts.forEach((g) => (g.eaten = false));
                            s.ghosts.forEach((g) => {
                                if (!g.eyesHome) {
                                    g.dir = REVERSE[g.dir];
                                    const brain = s.ghostBrains?.[g.name];
                                    if (brain) brain.mode = "frightened";
                                }
                            });
                        }
                        if (pelletsLeftRef.current <= 0) {
                            s.won = true;
                            setLevel((l) => {
                                const next = l + 1;
                                if (s.metrics && s.adaptive) {
                                    const perf = computePerformanceScore(
                                        s.metrics
                                    );
                                    const after = updateAdaptiveParams(
                                        s.adaptive,
                                        perf,
                                        next
                                    );
                                    s.adaptive = after;
                                }
                                resetMapToOriginal(next);
                                autoFillPellets();
                                setTimeout(() => resetLevel(false), 50);
                                return next;
                            });
                            if (iaModeRef.current) {
                                // Recompensa de vitória mais alta
                                updateQLearning(s, 50);
                                endEpisode(s, "win");
                                if (s.rl) {
                                    const rlAny = s.rl as any;
                                    rlAny._visitCounts = {};
                                    rlAny._decayTick = 0;
                                }
                            }
                            return;
                        }
                    }
                    // Recompensa por passo se RL
                    if (iaModeRef.current && s.rl) {
                        // base reward (event based)
                        // Penalização de looping: se Pac-Man visitou a mesma célula X vezes seguidas sem colher pellet/power, aplicar custo.
                        const rlAny = s.rl as any;
                        rlAny._visitHist = rlAny._visitHist || [];
                        rlAny._starve = rlAny._starve || 0;
                        const cellKey = pac.cell.r + "," + pac.cell.c;
                        rlAny._visitHist.push(cellKey);
                        if (rlAny._visitHist.length > 30)
                            rlAny._visitHist.shift();
                        // Contagem cumulativa de visitas para exploração
                        rlAny._visitCounts =
                            rlAny._visitCounts || Object.create(null);
                        rlAny._visitCounts[cellKey] =
                            (rlAny._visitCounts[cellKey] || 0) + 1;
                        let loopPenalty = 0;
                        if (!pelletEaten && !powerEaten) {
                            rlAny._starve += 1;
                            // contar últimas 10 visitas
                            const recent = rlAny._visitHist.slice(-10);
                            const repeats = recent.filter(
                                (v: string) => v === cellKey
                            ).length;
                            // se repetido muitas vezes recentemente, penaliza de forma crescente
                            if (repeats >= 4) {
                                loopPenalty = -0.05 * (repeats - 3); // -0.05, -0.10, ...
                            }
                        } else {
                            rlAny._starve = 0; // reset starvation quando coleta
                            // limpamos histórico parcial quando faz progresso
                            rlAny._visitHist = rlAny._visitHist.slice(-5); // mantém uma cauda pequena
                        }
                        let reward = computeReward(s, s, {
                            pelletEaten,
                            powerEaten,
                            loopPenalty,
                            starvationSteps: rlAny._starve,
                        });
                        // Bônus de novidade focado em coleta (estrutura robusta): usar objeto simples para evitar inconsistências de serialização
                        if (
                            !rlAny._collectedCells ||
                            typeof rlAny._collectedCells !== "object" ||
                            Array.isArray(rlAny._collectedCells)
                        ) {
                            rlAny._collectedCells = Object.create(null); // mapa plano
                        }
                        if (pelletEaten || powerEaten) {
                            if (!rlAny._collectedCells[cellKey]) {
                                rlAny._collectedCells[cellKey] = 1;
                                reward += 0.5; // bônus por remover pellet/power inédito
                            }
                        }
                        // Bônus de primeira visita (exploração pura) apenas se não coletou nada aqui
                        if (!pelletEaten && !powerEaten) {
                            const visits = rlAny._visitCounts[cellKey];
                            if (visits === 1) reward += 0.2; // primeira vez (aumentado novamente)
                        }
                        // Penalidade leve por revisitar exageradamente sem coletar (um pouco menor)
                        const visitsNow = rlAny._visitCounts[cellKey];
                        if (!pelletEaten && !powerEaten && visitsNow > 8) {
                            // Penalidade progressiva mais cedo e um pouco mais forte
                            reward += -0.012 * Math.min(visitsNow - 8, 14); // até ~ -0.168
                        }
                        // Decaimento suave periódico das contagens para reabrir exploração depois de muito tempo
                        rlAny._decayTick = (rlAny._decayTick || 0) + 1;
                        if (rlAny._decayTick >= 120) {
                            // a cada ~120 passos
                            rlAny._decayTick = 0;
                            for (const k in rlAny._visitCounts) {
                                rlAny._visitCounts[k] *= 0.85; // reduz 15%
                                if (rlAny._visitCounts[k] < 0.5)
                                    delete rlAny._visitCounts[k];
                            }
                        }
                        // incremental shaping (pellet distance improvement)
                        const rl = s.rl as any;
                        const newPelletDist = nearestPelletDistance(s);
                        if (typeof rl._lastPelletDist === "number") {
                            const delta = rl._lastPelletDist - newPelletDist;
                            // bonus for getting closer, small penalty for going away
                            reward += delta * 0.06; // ligeiramente mais forte
                        }
                        rl._lastPelletDist = newPelletDist;
                        const newGhostDist = minGhostDistance(s);
                        if (typeof rl._lastGhostMinDist === "number") {
                            const gdelta = newGhostDist - rl._lastGhostMinDist;
                            // Revertido: apenas recompensa leve por aumentar distância mínima dos fantasmas
                            reward += gdelta * 0.015;
                        }
                        rl._lastGhostMinDist = newGhostDist;
                        updateQLearning(s, reward);
                        // Timeout de episódio se exceder 1000 passos sem vitória
                        if (
                            s.rl &&
                            s.rl.metrics.steps >= 1000 &&
                            !s.won &&
                            !s.gameOver
                        ) {
                            // penalidade explícita por estagnação longa
                            updateQLearning(s, -5);
                            endEpisode(s, "timeout");
                            // Limpa históricos de exploração para novo episódio (novidade renovada)
                            if (s.rl) {
                                const rlX = s.rl as any;
                                rlX._visitHist = [];
                                rlX._visitCounts = {};
                                rlX._cellSequence = [];
                                rlX._starve = 0;
                                rlX._decayTick = 0;
                            }
                            // Reinicia posições (mantém mapa/pellets restantes) para novo episódio de exploração
                            const pacSpawn: Cell = { r: 11, c: 9 };
                            s.pacman = {
                                cell: { ...pacSpawn },
                                dir: "left",
                                nextDir: "left",
                                progress: 0,
                                speedTiles: PAC_SPEED,
                                alive: true,
                                mouthPhase: 0,
                            };
                            // Fantasmas reset básicos
                            s.ghosts = [
                                {
                                    name: "blinky",
                                    color: "#ff0000",
                                    cell: { r: 8, c: 9 },
                                    dir: "left",
                                    progress: 0,
                                    baseSpeed: GHOST_SPEED,
                                    eaten: false,
                                    eyesHome: false,
                                },
                                {
                                    name: "pinky",
                                    color: "#ffb8ff",
                                    cell: { r: 8, c: 8 },
                                    dir: "left",
                                    progress: 0,
                                    baseSpeed: GHOST_SPEED,
                                    eaten: false,
                                    eyesHome: false,
                                },
                                {
                                    name: "inky",
                                    color: "#00ffff",
                                    cell: { r: 8, c: 10 },
                                    dir: "left",
                                    progress: 0,
                                    baseSpeed: GHOST_SPEED,
                                    eaten: false,
                                    eyesHome: false,
                                },
                                {
                                    name: "clyde",
                                    color: "#ffb852",
                                    cell: { r: 7, c: 9 },
                                    dir: "left",
                                    progress: 0,
                                    baseSpeed: GHOST_SPEED,
                                    eaten: false,
                                    eyesHome: false,
                                },
                            ];
                            // Reinicia cérebros dos fantasmas
                            const ghostBrains: Record<string, GhostBrainState> =
                                {};
                            for (const g of s.ghosts)
                                ghostBrains[g.name] = initGhostBrain();
                            s.ghostBrains = ghostBrains;
                            s.frightenedUntil = 0;
                        }
                    }
                }
            } else pc.progress = 0;
        };
        moveAndConsume(pac);

        // (Decisão da IA já executada antes do bloco de movimento acima para reação mais rápida)

        // Atualizar Fantasmas (direção decide ao chegar no centro)
        const frightened = performance.now() < s.frightenedUntil;
        // Atualiza cérebro dos fantasmas (scatter/chase alternância)
        for (const g of s.ghosts) {
            const brain = s.ghostBrains?.[g.name];
            if (brain) {
                // Se ainda frightened, manter modo frightened; senão atualizar ciclo
                if (!frightened && brain.mode === "frightened") {
                    // Sai de frightened retomando ciclo
                    brain.mode = "scatter"; // reinicia em scatter para simplificar
                    brain.modeEndsAt = performance.now() + 3000; // pequeno período scatter antes de chase
                }
                if (!frightened) updateGhostBrain(brain, s);
            }
        }
        for (const g of s.ghosts) {
            const speedTiles = g.eyesHome
                ? GHOST_SPEED
                : frightened
                  ? FRIGHTENED_SPEED
                  : g.baseSpeed;
            const targetG = nextCell(g.cell, g.dir);
            const blockedG = isWall(targetG.r, targetG.c);

            // decisão de direção só quando no centro (progress ~ 0)
            if (g.progress < 0.0001) {
                const opts = validDirs(g.cell);
                const brain = s.ghostBrains?.[g.name];
                if (brain) {
                    // Ajustar modo se olhos ou terminado frightened
                    if (g.eyesHome) brain.mode = "eyes";
                    else if (frightened && !g.eaten) brain.mode = "frightened";
                    else if (brain.mode === "frightened" && !frightened)
                        brain.mode = "scatter";
                    const prevDir = g.dir;
                    g.dir = decideGhostDirection(
                        g,
                        brain,
                        pac,
                        s.ghosts,
                        opts,
                        s.adaptive
                    );
                    // Throttled logging: only when direction or mode changes and >300ms since last log for this ghost
                    const now = performance.now();
                    const lastT = lastLogRef.current[g.name] || 0;
                    const prevLoggedDir = lastDirRef.current[g.name];
                    const prevLoggedMode = lastModeRef.current[g.name];
                    if (
                        (prevDir !== g.dir || prevLoggedMode !== brain.mode) &&
                        now - lastT > 300
                    ) {
                        // Derivar target para log (simplificado: rely on mode logic similar to decideGhostDirection)
                        let target: Cell;
                        if (brain.mode === "eyes") target = { r: 8, c: 9 };
                        else if (brain.mode === "frightened")
                            target = g.cell; // random
                        else {
                            // recompute using chase/scatter helpers inline to avoid circular import; minimal duplication
                            if (brain.mode === "scatter") {
                                if (g.name === "blinky")
                                    target = { r: 0, c: MAP[0].length - 1 };
                                else if (g.name === "pinky")
                                    target = { r: 0, c: 0 };
                                else if (g.name === "inky")
                                    target = {
                                        r: MAP.length - 1,
                                        c: MAP[0].length - 1,
                                    };
                                else target = { r: MAP.length - 1, c: 0 };
                            } else {
                                // chase target approximation mirroring personality logic
                                if (g.name === "blinky") target = pac.cell;
                                else if (g.name === "pinky") {
                                    target = pac.cell;
                                    for (let i = 0; i < 4; i++)
                                        target = nextCell(target, pac.dir);
                                } else if (g.name === "inky") {
                                    let twoAhead = pac.cell;
                                    for (let i = 0; i < 2; i++)
                                        twoAhead = nextCell(twoAhead, pac.dir);
                                    const blinky = s.ghosts.find(
                                        (x) => x.name === "blinky"
                                    );
                                    if (blinky) {
                                        const vecR = twoAhead.r - blinky.cell.r;
                                        const vecC = twoAhead.c - blinky.cell.c;
                                        target = {
                                            r: twoAhead.r + vecR,
                                            c: twoAhead.c + vecC,
                                        };
                                    } else target = twoAhead;
                                } else {
                                    // clyde
                                    const dist =
                                        Math.abs(g.cell.r - pac.cell.r) +
                                        Math.abs(g.cell.c - pac.cell.c);
                                    if (dist > 8) target = pac.cell;
                                    else target = { r: MAP.length - 1, c: 0 };
                                }
                            }
                        }
                        // Distância Manhattan ao alvo (para chase/scatter)
                        const dist =
                            Math.abs(g.cell.r - target.r) +
                            Math.abs(g.cell.c - target.c);
                        // Razão textual
                        let razao: string;
                        if (brain.mode === "frightened")
                            razao = "Modo assustado: movimento aleatório";
                        else if (brain.mode === "eyes")
                            razao = "Olhos retornando para casa";
                        else if (brain.mode === "scatter")
                            razao = "Espalhar: indo para canto designado";
                        else {
                            if (g.name === "blinky")
                                razao = "Perseguição: alvo = Pac-Man";
                            else if (g.name === "pinky")
                                razao = "Perseguição: 4 células à frente";
                            else if (g.name === "inky")
                                razao = "Perseguição: vetor duplo (Inky)";
                            else
                                razao =
                                    "Perseguição: alterna canto vs distância (Clyde)";
                        }
                        // Tempo no modo (aprox: diferença desde última mudança de modo)
                        const modeChanged = prevLoggedMode !== brain.mode;
                        const elapsedModoMs = modeChanged
                            ? 0
                            : Math.round(now - lastT);
                        const pelletsRestantes = pelletsLeftRef.current;
                        const cor = g.color;
                        console.log(
                            `%c[FANTASMA] nome=${g.name} cor=${cor} modo=${brain.mode} célula=(${g.cell.r},${g.cell.c}) alvo=(${target.r},${target.c}) dir=${g.dir} distância=${dist} msModo=${elapsedModoMs} pelletsRestantes=${pelletsRestantes} razão="${razao}"`,
                            `color:${cor}; font-weight:bold;`
                        );
                        lastLogRef.current[g.name] = now;
                        lastDirRef.current[g.name] = g.dir;
                        lastModeRef.current[g.name] = brain.mode;
                    }
                } else {
                    // fallback antigo
                    const filtered = opts.filter((d) => d !== REVERSE[g.dir]);
                    if (filtered.length)
                        g.dir = chooseClosest(filtered, g.cell, pac.cell);
                }
            }

            if (!blockedG) {
                g.progress += speedTiles * dt;
                while (g.progress >= 1) {
                    g.progress -= 1;
                    g.cell = nextCell(g.cell, g.dir);
                    // se chegou na casa com olhos, sai do modo eyesHome
                    if (g.eyesHome && g.cell.r === 8 && g.cell.c === 9) {
                        g.eyesHome = false;
                        g.dir = "left";
                        const brain = s.ghostBrains?.[g.name];
                        if (brain)
                            brain.mode = frightened ? "frightened" : "scatter";
                    }
                }
            } else {
                g.progress = 0;
                // se bloqueado, tente outra direção válida
                const opts = validDirs(g.cell);
                const alt = opts.find((d) => d !== REVERSE[g.dir]);
                if (alt) g.dir = alt;
            }
        }

        const collideAgent = (pc: Pacman) => {
            const pPos = lerp(
                cellCenter(pc.cell),
                cellCenter(nextCell(pc.cell, pc.dir)),
                pc.progress
            );
            for (const g of s.ghosts) {
                const gPos = lerp(
                    cellCenter(g.cell),
                    cellCenter(nextCell(g.cell, g.dir)),
                    g.progress
                );
                const dx = pPos.x - gPos.x;
                const dy = pPos.y - gPos.y;
                const dist2 = dx * dx + dy * dy;
                const collide = dist2 < (TILE * 0.45 + TILE * 0.4) ** 2;
                if (!collide) continue;
                const ghostIsFrightened = frightened && !g.eyesHome;
                if (ghostIsFrightened && !g.eaten) {
                    g.eaten = true;
                    g.eyesHome = true;
                    setScore((prev) => prev + 200);
                    const st2 = stateRef.current;
                    if (st2?.metrics) st2.metrics.ghostsEaten += 1;
                    if (iaModeRef.current)
                        updateQLearning(
                            s,
                            computeReward(s, s, { ghostEaten: true })
                        );
                } else if (!g.eyesHome) {
                    handleDeath();
                    break;
                }
            }
        };
        collideAgent(pac);
    }

    function handleDeath(): void {
        const s = stateRef.current;
        if (!s) return;
        s.pacman.alive = false;
        setLives((v) => {
            const nv = v - 1;
            if (nv <= 0) {
                s.gameOver = true;
            } else {
                // reset posições, manter pellets
                const pacSpawn: Cell = { r: 11, c: 9 };
                // Mantenha o mesmo mapa da fase atual (não chamar resetMapToOriginal aqui)
                s.pacman = {
                    cell: pacSpawn,
                    dir: "left",
                    nextDir: "left",
                    progress: 0,
                    speedTiles: PAC_SPEED,
                    alive: true,
                    mouthPhase: 0,
                };
                s.ghosts = [
                    makeGhost("blinky", "#ff0000", { r: 8, c: 9 }),
                    makeGhost("pinky", "#ffb8ff", { r: 8, c: 8 }),
                    makeGhost("inky", "#00ffff", { r: 8, c: 10 }),
                    makeGhost("clyde", "#ffb852", { r: 7, c: 9 }),
                ];
                // reinit brains
                const ghostBrains: Record<string, GhostBrainState> = {};
                for (const g of s.ghosts)
                    ghostBrains[g.name] = initGhostBrain();
                s.ghostBrains = ghostBrains;
                s.frightenedUntil = 0;
            }
            if (s.metrics) s.metrics.deaths += 1;
            if (iaModeRef.current) {
                updateQLearning(s, computeReward(s, s, { died: true }));
                endEpisode(s, "death");
                // Limpa contagens de exploração para novo episódio
                if (s.rl) {
                    const rlAny = s.rl as any;
                    rlAny._visitCounts = {};
                    rlAny._decayTick = 0;
                }
            }
            return nv;
        });
    }

    function draw(canvas: HTMLCanvasElement | null, s: GameState | null): void {
        const dpi = window.devicePixelRatio || 1;
        const width = COLS * TILE;
        const height = ROWS * TILE;
        if (!canvas) return;
        if (canvas.width !== width * dpi || canvas.height !== height * dpi) {
            canvas.width = width * dpi;
            canvas.height = height * dpi;
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // mapa
        drawMap(ctx);
        if (!s) return;

        // posições interpoladas para desenho suave
        const pac = s.pacman;
        const pacPos = lerp(
            cellCenter(pac.cell),
            cellCenter(nextCell(pac.cell, pac.dir)),
            pac.progress
        );
        if (iaModeRef.current) {
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0,255,200,0.65)";
            ctx.lineWidth = 4;
            ctx.shadowColor = "rgba(0,255,200,0.8)";
            ctx.shadowBlur = 12;
            ctx.arc(pacPos.x, pacPos.y, TILE * 0.65, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        drawPacman(ctx, pacPos, pac);

        const frightened = performance.now() < s.frightenedUntil;
        for (const g of s.ghosts) {
            const gPos = lerp(
                cellCenter(g.cell),
                cellCenter(nextCell(g.cell, g.dir)),
                g.progress
            );
            drawGhost(ctx, gPos, g, frightened && !g.eyesHome);
        }

        if (iaModeRef.current && s.rl) {
            // Badge IA
            ctx.save();
            ctx.font = "bold 18px sans-serif";
            ctx.fillStyle = "rgba(255,220,0,0.9)";
            ctx.textAlign = "right";
            ctx.fillText("IA", width - 8, 22);
            ctx.restore();
            // Métricas IA (RL interno)
            {
                const rl = s.rl;
                const lines = [
                    `IA Ep ${rl.metrics.episode} ε=${rl.params.epsilon.toFixed(2)}`,
                    `RewTot ${rl.metrics.totalReward.toFixed(1)} last ${rl.metrics.lastReward.toFixed(2)}`,
                    `AvgWin ${rl.metrics.avgRewardWindow.toFixed(2)} steps ${rl.metrics.steps}`,
                ];
                ctx.save();
                ctx.font = "12px monospace";
                ctx.textAlign = "left";
                ctx.fillStyle = "rgba(255,220,0,0.8)";
                const longest = lines.reduce(
                    (m, l) => (l.length > m ? l.length : m),
                    0
                );
                const boxW = longest * 7.2 + 12;
                const boxH = lines.length * 14 + 8;
                ctx.fillStyle = "rgba(0,0,0,0.45)";
                ctx.fillRect(width - boxW - 4, 4, boxW, boxH);
                ctx.fillStyle = "rgba(255,220,0,0.85)";
                lines.forEach((ln, i) =>
                    ctx.fillText(ln, width - boxW + 6, 20 + i * 14)
                );
                ctx.restore();
            }
        }
        if (s.gameOver) {
            overlay(ctx, "GAME OVER", "R para reiniciar");
        } else if (s.won) {
            overlay(ctx, "Fase completa!", "Carregando próxima...");
        }
    }

    // (Funções de desenho movidas para render.ts)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
            }}
        >
            <div className="hud" role="toolbar" aria-label="Painel do jogo">
                <div className="stat" aria-label={`Pontuação atual ${score}`}>
                    <span className="stat-icon" aria-hidden="true">
                        🍒
                    </span>
                    <span>Score</span>
                    <strong style={{ minWidth: 50, textAlign: "right" }}>
                        {score}
                    </strong>
                </div>
                <div className="stat" aria-label={`Vidas restantes ${lives}`}>
                    <span className="stat-icon" aria-hidden="true">
                        💖
                    </span>
                    <span>Vidas</span>
                    <div className="lives" aria-hidden="true">
                        {Array.from({ length: lives }).map((_, i) => (
                            <span key={i} className="life-icon">
                                💛
                            </span>
                        ))}
                    </div>
                </div>
                <div className="stat" aria-label={`Fase atual ${level}`}>
                    <span className="stat-icon" aria-hidden="true">
                        🚀
                    </span>
                    <span>Fase</span>
                    <strong style={{ minWidth: 28, textAlign: "right" }}>
                        {level}
                    </strong>
                </div>
                <button
                    className="btn"
                    onClick={() => setRunning((v) => !v)}
                    aria-label={running ? "Pausar jogo" : "Retomar jogo"}
                >
                    <span className="emoji" aria-hidden="true">
                        {running ? "⏸" : "▶️"}
                    </span>
                    {running ? "Pausar" : "Retomar"}
                </button>
                <button
                    className="btn secondary"
                    onClick={() => {
                        setScore(0);
                        setLives(3);
                        setLevel(1);
                        resetMapToOriginal();
                        resetLevel(true);
                        setRunning(true);
                        // RL único modo automático
                    }}
                    aria-label="Reiniciar jogo"
                >
                    <span className="emoji" aria-hidden="true">
                        🔄
                    </span>
                    Reiniciar
                </button>
                <button
                    className="btn"
                    onClick={() => {
                        setIaMode((v) => {
                            const nv = !v;
                            const gs = stateRef.current;
                            if (gs && nv) ensureRL(gs);
                            return nv;
                        });
                    }}
                    aria-label={iaMode ? "Desativar modo IA" : "Ativar modo IA"}
                >
                    <span className="emoji" aria-hidden="true">
                        🧠
                    </span>
                    {iaMode ? "IA: ON" : "IA: OFF"}
                </button>
            </div>
            <canvas
                ref={canvasRef}
                width={COLS * TILE}
                height={ROWS * TILE}
                className={iaMode ? "ai-active" : undefined}
            />
            <section className="ai-explain" aria-labelledby="ai-heading">
                <h2 id="ai-heading">Inteligência Artificial – Visão Geral</h2>
                <div className="ai-grid">
                    <article className="ai-card" aria-labelledby="pac-rl-title">
                        <h3 id="pac-rl-title">
                            Pac-Man (Aprendizado por Reforço)
                        </h3>
                        {stateRef.current?.rl && (
                            <div
                                className="ai-live"
                                aria-label="Métricas em tempo real do RL"
                            >
                                {(() => {
                                    const gs = stateRef.current!;
                                    const rl = gs.rl!;
                                    const pelletsLeft = pelletsLeftRef.current;
                                    // distância heurística (salva em runtime via campos auxiliares)
                                    const lastPelletDist = (rl as any)
                                        ._lastPelletDist;
                                    const lastGhostMin = (rl as any)
                                        ._lastGhostMinDist;
                                    return (
                                        <ul className="live-metrics">
                                            <li>
                                                <span className="k">
                                                    Episódio
                                                </span>
                                                <span className="v">
                                                    {rl.metrics.episode}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">ε</span>
                                                <span className="v">
                                                    {rl.params.epsilon.toFixed(
                                                        3
                                                    )}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">Steps</span>
                                                <span className="v">
                                                    {rl.metrics.steps}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">
                                                    Reward Tot
                                                </span>
                                                <span className="v">
                                                    {rl.metrics.totalReward.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">
                                                    Reward Último
                                                </span>
                                                <span className="v">
                                                    {rl.metrics.lastReward.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">
                                                    Reward Média (exp)
                                                </span>
                                                <span className="v">
                                                    {rl.metrics.avgRewardWindow.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">
                                                    Pellets Rest.
                                                </span>
                                                <span className="v">
                                                    {pelletsLeft}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">
                                                    Power Pellets
                                                </span>
                                                <span className="v">
                                                    {gs.metrics
                                                        ?.powerPelletsEaten ??
                                                        0}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">
                                                    Pellets Colet.
                                                </span>
                                                <span className="v">
                                                    {gs.metrics?.pelletsEaten ??
                                                        0}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">
                                                    Fantasmas Comidos
                                                </span>
                                                <span className="v">
                                                    {gs.metrics?.ghostsEaten ??
                                                        0}
                                                </span>
                                            </li>
                                            <li>
                                                <span className="k">
                                                    Mortes
                                                </span>
                                                <span className="v">
                                                    {gs.metrics?.deaths ?? 0}
                                                </span>
                                            </li>
                                            {typeof lastPelletDist ===
                                                "number" && (
                                                <li>
                                                    <span className="k">
                                                        Dist. Próx. Pellet
                                                    </span>
                                                    <span className="v">
                                                        {lastPelletDist}
                                                    </span>
                                                </li>
                                            )}
                                            {typeof lastGhostMin ===
                                                "number" && (
                                                <li>
                                                    <span className="k">
                                                        Dist. Fantasma Min
                                                    </span>
                                                    <span className="v">
                                                        {lastGhostMin}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    );
                                })()}
                            </div>
                        )}
                        <ul className="ai-points">
                            <li>
                                <strong>Algoritmo:</strong> Q-Learning tabular
                                com política ε-greedy adaptativa.
                            </li>
                            <li>
                                <strong>Estado Compacto:</strong> posição,
                                máscara de direções livres, proximidade das 2
                                ameaças mais próximas e se há pellet / power no
                                tile.
                            </li>
                            <li>
                                <strong>Ações:</strong> {`{←, →, ↑, ↓}`}{" "}
                                filtrando movimentos inválidos (paredes).
                            </li>
                            <li>
                                <strong>Recompensas Base:</strong> pellet +1.2,
                                power +10, fantasma +8, vitória +50, morte −30,
                                passo neutro −0.02.
                            </li>
                            <li>
                                <strong>Penalizações Dinâmicas:</strong>{" "}
                                starvation (cresce quadrático), looping
                                (detecção local), revisita excessiva escalonada.
                            </li>
                            <li>
                                <strong>Shaping Positivo:</strong> aproximação
                                de pellets, maior distância mínima de fantasmas,
                                bônus primeira visita e primeira coleta.
                            </li>
                            <li>
                                <strong>Exploração Direcionada:</strong> viés
                                forte para células nunca visitadas / com
                                pellets; decaimento periódico de contagens.
                            </li>
                            <li>
                                <strong>Planejamento Local:</strong> BFS
                                limitada para encontrar rota ao próximo pellet
                                fresco quando entorno está esgotado.
                            </li>
                            <li>
                                <strong>Escape de Confinamento:</strong>{" "}
                                detecção de "caixa" (bounding box reduzida +
                                baixa diversidade) gera rota forçada de saída.
                            </li>
                            <li>
                                <strong>Adaptação de ε:</strong> vitória acelera
                                redução; morte precoce ou timeout aumentam /
                                mantêm exploração controlada.
                            </li>
                        </ul>
                    </article>
                    <article
                        className="ai-card"
                        aria-labelledby="ghost-ai-title"
                    >
                        <h3 id="ghost-ai-title">
                            Fantasmas (Personalidades & Modos)
                        </h3>
                        {stateRef.current && (
                            <div
                                className="ai-live"
                                aria-label="Estado atual dos fantasmas"
                            >
                                <ul className="ghost-status">
                                    {stateRef.current.ghosts.map((g) => {
                                        const brain =
                                            stateRef.current!.ghostBrains?.[
                                                g.name
                                            ];
                                        const pac = stateRef.current!.pacman;
                                        const d =
                                            Math.abs(g.cell.r - pac.cell.r) +
                                            Math.abs(g.cell.c - pac.cell.c);
                                        return (
                                            <li
                                                key={g.name}
                                                className="ghost-line"
                                            >
                                                <span
                                                    className="dot"
                                                    style={{
                                                        background: g.color,
                                                    }}
                                                    aria-hidden="true"
                                                />
                                                <span
                                                    className="g-name"
                                                    style={{ color: g.color }}
                                                >
                                                    {g.name}
                                                </span>
                                                <span className="g-mode">
                                                    {brain?.mode}
                                                </span>
                                                <span className="g-dist">
                                                    d={d}
                                                </span>
                                                <span className="g-cell">
                                                    ({g.cell.r},{g.cell.c})
                                                </span>
                                                {g.eyesHome && (
                                                    <span className="g-flag">
                                                        eyes
                                                    </span>
                                                )}
                                                {g.eaten && !g.eyesHome && (
                                                    <span className="g-flag">
                                                        eaten
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                        <ul className="ai-points">
                            <li>
                                <strong>Modos:</strong> scatter (cantinhos),
                                chase (perseguição), frightened (aleatório
                                lento), eyes (retorno à casa).
                            </li>
                            <li>
                                <strong>Ciclo Temporal:</strong> alternância
                                scatter↔chase baseada em tabela reduzida;
                                frightened interrompe ciclo temporariamente.
                            </li>
                            <li>
                                <strong>
                                    <span style={{ color: "#ff0000" }}>
                                        Blinky
                                    </span>
                                    :
                                </strong>{" "}
                                mira diretamente o Pac-Man (pressão constante).
                            </li>
                            <li>
                                <strong>
                                    <span style={{ color: "#ffb8ff" }}>
                                        Pinky
                                    </span>
                                    :
                                </strong>{" "}
                                projeta 4+ células à frente da direção atual do
                                Pac-Man.
                            </li>
                            <li>
                                <strong>
                                    <span style={{ color: "#00ffff" }}>
                                        Inky
                                    </span>
                                    :
                                </strong>{" "}
                                vetoriza combinação de posição projetada do
                                Pac-Man e Blinky (efeito de cerco).
                            </li>
                            <li>
                                <strong>
                                    <span style={{ color: "#ffb852" }}>
                                        Clyde
                                    </span>
                                    :
                                </strong>{" "}
                                persegue se distante; recua ao canto se perto
                                (&lt;=8 células).
                            </li>
                            <li>
                                <strong>Frightened:</strong> movimento
                                pseudo-aleatório + velocidade reduzida; captura
                                gera olhos retornando.
                            </li>
                            <li>
                                <strong>Decisão em Interseções:</strong> evita
                                reversões gratuitas e escolhe direção que
                                minimiza distância ao alvo contextual.
                            </li>
                            <li>
                                <strong>Parâmetros Adaptativos:</strong> fatores
                                (ex.: scatterFactor, predictionAhead,
                                randomness) ajustam agressividade /
                                previsibilidade.
                            </li>
                            <li>
                                <strong>Separação de Responsabilidades:</strong>{" "}
                                Game controla transições especiais (frightened /
                                olhos); ghostAI gerencia alvo e direção.
                            </li>
                        </ul>
                    </article>
                    <article
                        className="ai-card"
                        aria-labelledby="design-rationale-title"
                    >
                        <h3 id="design-rationale-title">
                            Racional & Estratégias
                        </h3>
                        <ul className="ai-points">
                            <li>
                                <strong>Equilíbrio:</strong> forte incentivo a
                                novidade evita estagnação; penalidades calibram
                                risco vs. progresso.
                            </li>
                            <li>
                                <strong>Complexidade Controlada:</strong> estado
                                discretizado reduz explosão de Q-table mantendo
                                sinais suficientes.
                            </li>
                            <li>
                                <strong>Pathfinding Híbrido:</strong> Q-Learning
                                lida com longo prazo; BFS fornece
                                micro-planejamento imediato em zonas exploradas.
                            </li>
                            <li>
                                <strong>Anti-Stuck:</strong> múltiplas camadas
                                (ping-pong, baixa diversidade, starvation,
                                corner escape).
                            </li>
                            <li>
                                <strong>Transparência:</strong> painel expõe
                                heurísticas para análise acadêmica e ajustes
                                futuros.
                            </li>
                        </ul>
                    </article>
                </div>
                <p className="ai-footnote">
                    Trabalho acadêmico – Demonstração de integração de
                    Q-Learning com heurísticas de exploração e IA clássica
                    baseada em estados para inimigos.
                </p>
            </section>
        </div>
    );

    // respawnPellets substituída por lógica determinística via autoFillPellets (mantida apenas se necessário).
    // function respawnPellets() {}

    // resetMapToOriginal importada de map.ts

    // Overlay genérico
    // overlay movida para render.ts
}

// Painel de IA removido a pedido do usuário; histórico permanece apenas interno.
