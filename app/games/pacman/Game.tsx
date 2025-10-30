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

// Funções de lógica removidas (agora importadas de ./logic)

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [running, setRunning] = useState<boolean>(true);
    const [score, setScore] = useState<number>(0);
    const [lives, setLives] = useState<number>(3);
    const [level, setLevel] = useState<number>(1);
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

        stateRef.current = {
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
        const pac = s.pacman;

        // Atualiza fase da boca com velocidade constante (estilo clássico)
        const MOUTH_ANIM_SPEED = 6; // ciclos por segundo
        pac.mouthPhase += dt * MOUTH_ANIM_SPEED * Math.PI; // escala para radianos
        if (pac.mouthPhase > Math.PI * 2) pac.mouthPhase -= Math.PI * 2;

        // Buffer de virada: permitir virar próximo ao centro
        if (
            pac.nextDir &&
            canTurn(pac.cell, pac.nextDir) &&
            pac.progress < 0.15
        ) {
            pac.dir = pac.nextDir;
        }

        // Avançar Pac‑Man com movimento contínuo entre centros das células
        const targetPac = nextCell(pac.cell, pac.dir);
        const blocked = isWall(targetPac.r, targetPac.c);
        if (!blocked) {
            pac.progress += pac.speedTiles * dt;
            // pode atravessar várias células se dt grande, mas normalmente é < 1
            while (pac.progress >= 1) {
                pac.progress -= 1;
                pac.cell = nextCell(pac.cell, pac.dir);

                // wrap horizontal já acontece em nextCell
                // consumir pellet ao chegar ao centro da célula
                const ch = MAP[pac.cell.r][pac.cell.c];
                if (ch === "." || ch === "o") {
                    setScore((prev) => prev + (ch === "o" ? 50 : 10));
                    pelletsLeftRef.current -= 1;
                    replaceMapChar(pac.cell.r, pac.cell.c, " ");
                    const st = stateRef.current;
                    if (st?.metrics) {
                        if (ch === "o") st.metrics.powerPelletsEaten += 1;
                        else st.metrics.pelletsEaten += 1;
                    }
                    if (ch === "o") {
                        s.frightenedUntil = performance.now() + FRIGHTENED_MS;
                        s.ghosts.forEach((g) => {
                            g.eaten = false;
                        });
                        // Reversão de direção clássica ao entrar em frightened
                        s.ghosts.forEach((g) => {
                            if (!g.eyesHome) {
                                g.dir = REVERSE[g.dir];
                                // brain entra em modo frightened
                                const brain = s.ghostBrains?.[g.name];
                                if (brain) brain.mode = "frightened";
                            }
                        });
                    }
                    if (pelletsLeftRef.current <= 0) {
                        s.won = true;
                        setLevel((l) => {
                            const next = l + 1;
                            // mudar mapa para próxima fase
                            // Antes de avançar, aplicar aprendizado
                            if (s.metrics && s.adaptive) {
                                const perf = computePerformanceScore(s.metrics);
                                const before = { ...s.adaptive };
                                const after = updateAdaptiveParams(
                                    s.adaptive,
                                    perf,
                                    next
                                );
                                s.adaptive = after;
                                console.log(
                                    "%c[LEARNING] Atualizado parâmetros adaptativos:",
                                    "color:#ffd800;font-weight:bold;"
                                );
                                console.table(after);
                            }
                            resetMapToOriginal(next);
                            autoFillPellets();
                            setTimeout(() => {
                                resetLevel(false);
                            }, 50);
                            return next;
                        });
                        return;
                    }
                }
            }
        } else {
            // parado no centro até poder virar
            pac.progress = 0;
        }

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

        // Colisão Pac‑Man x Fantasmas (verificar posição interpolada)
        const pacPos = lerp(
            cellCenter(pac.cell),
            cellCenter(nextCell(pac.cell, pac.dir)),
            pac.progress
        );
        for (const g of s.ghosts) {
            const gPos = lerp(
                cellCenter(g.cell),
                cellCenter(nextCell(g.cell, g.dir)),
                g.progress
            );
            const dx = pacPos.x - gPos.x;
            const dy = pacPos.y - gPos.y;
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
            } else if (!g.eyesHome) {
                handleDeath();
                break;
            }
        }
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
                    }}
                    aria-label="Reiniciar jogo"
                >
                    <span className="emoji" aria-hidden="true">
                        🔄
                    </span>
                    Reiniciar
                </button>
            </div>
            <canvas ref={canvasRef} width={COLS * TILE} height={ROWS * TILE} />
        </div>
    );

    // respawnPellets substituída por lógica determinística via autoFillPellets (mantida apenas se necessário).
    // function respawnPellets() {}

    // resetMapToOriginal importada de map.ts

    // Overlay genérico
    // overlay movida para render.ts
}

// Painel de IA removido a pedido do usuário; histórico permanece apenas interno.
