// Mapa e operações diretas de mutação do texto
// Mapa base original (imutável)
// Mapa base original (imutável) - variante 1
const MAP_VARIANT_1: string[] = [
    "###################",
    "#........#........#",
    "#.####.#.#.#.####.#",
    "#o#  #.#.#.#.#  #o#",
    "#.####.#.#.#.####.#",
    "#.................#",
    "#####.#.#####.#.###",
    "#####.#.#####.#.###",
    "#.....#...GG..#...#",
    "###.#.#######.#.###",
    "#...#...###...#...#",
    "#.#####.#.#.#####.#",
    "#o....#.#.#.#....o#",
    "#####.#.#.#.#.#####",
    "#.....#.....#.....#",
    "###################",
];

// Variante 2: corredores alternados, menos bloqueios centrais
const MAP_VARIANT_2: string[] = [
    "###################",
    "#...#......#.....o#",
    "#.##.#.####.#.##..#",
    "#o..#.#....#.#..o.#",
    "#.##.#.####.#.##..#",
    "#.................#",
    "###.#.###GG###.#.##",
    "###.#.###GG###.#.##",
    "#...#....##....#..#",
    "#.#######..#######.#",
    "#.....##....##.....#",
    "#.###.#.####.#.###.#",
    "#o..#.#....#.#..o.#",
    "#.##.#.####.#.##..#",
    "#.....#......#.....#",
    "###################",
];

// Variante 3: mais áreas abertas e power pellets posicionados nos quatro cantos
const MAP_VARIANT_3: string[] = [
    "###################",
    "#o.....##..##.....o#",
    "#.###..#....#..###.#",
    "#.....###..###.....#",
    "#.###.#......#.###.#",
    "#....#...##...#....#",
    "###.#.###GG###.#.###",
    "###.#.###GG###.#.###",
    "#....#...##...#....#",
    "#.###.#......#.###.#",
    "#.....###..###.....#",
    "#.###..#....#..###.#",
    "#o.....##..##.....o#",
    "#..................#",
    "#........##........#",
    "###################",
];

// Lista de variantes
const MAP_VARIANTS: string[][] = [MAP_VARIANT_1, MAP_VARIANT_2, MAP_VARIANT_3];

// Seleciona variante pelo nível (1-based)
export function selectMapForLevel(level: number): string[] {
    const idx = (level - 1) % MAP_VARIANTS.length;
    // retorna cópia nova para mutação
    return MAP_VARIANTS[idx].map((r) => r);
}

// Mapa mutável usado pelo jogo (inicialmente variante 1)
export let MAP: string[] = MAP_VARIANT_1.map((row) => row);

export const ROWS = MAP.length;
export const COLS = MAP[0].length;

export function replaceMapChar(r: number, c: number, toChar: string): void {
    const row = MAP[r];
    MAP[r] = row.substring(0, c) + toChar + row.substring(c + 1);
}

// Placeholder para futura restauração de estado original (se for clonado)
export function resetMapToOriginal(newLevel?: number): void {
    // Se nível informado, troca variante conforme level
    if (typeof newLevel === "number" && newLevel > 0) {
        MAP = selectMapForLevel(newLevel);
    } else {
        MAP = MAP_VARIANT_1.map((r) => r);
    }
    // Após trocar o mapa, remover pellets inalcançáveis
    sanitizePellets();
}

// Preenche automaticamente pellets em espaços vazios caminháveis (exceto dentro da casa dos fantasmas)
export function autoFillPellets(): void {
    for (let r = 0; r < MAP.length; r++) {
        for (let c = 0; c < MAP[0].length; c++) {
            const ch = MAP[r][c];
            if (ch === " ") {
                if (r === 8 && c >= 7 && c <= 11) continue;
                MAP[r] = MAP[r].substring(0, c) + "." + MAP[r].substring(c + 1);
            }
        }
    }
    sanitizePellets();
}

// Remove pellets que não possuem caminho até o spawn de Pac-Man (assumido 11,9)
function sanitizePellets(): void {
    const spawnR = 11;
    const spawnC = 9;
    if (spawnR < 0 || spawnR >= MAP.length) return;
    if (spawnC < 0 || spawnC >= MAP[0].length) return;
    const rows = MAP.length;
    const cols = MAP[0].length;
    const visited: boolean[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(false)
    );
    const q: [number, number][] = [];
    if (MAP[spawnR][spawnC] !== "#") {
        q.push([spawnR, spawnC]);
        visited[spawnR][spawnC] = true;
    }
    const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
    ];
    while (q.length) {
        const [r, c] = q.shift()!;
        for (const [dr, dc] of dirs) {
            let nr = r + dr;
            let nc = c + dc;
            // túnel horizontal wrap
            if (nc < 0) nc = cols - 1;
            if (nc >= cols) nc = 0;
            if (nr < 0 || nr >= rows) continue;
            if (visited[nr][nc]) continue;
            if (MAP[nr][nc] === "#") continue;
            visited[nr][nc] = true;
            q.push([nr, nc]);
        }
    }
    // Convert pellets inalcançáveis em espaço vazio
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const ch = MAP[r][c];
            if ((ch === "." || ch === "o") && !visited[r][c]) {
                // Se era power pellet, apenas remover (vira espaço)
                MAP[r] = MAP[r].substring(0, c) + " " + MAP[r].substring(c + 1);
            }
        }
    }
}
