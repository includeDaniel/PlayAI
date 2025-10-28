import { useState, useEffect, useCallback } from 'react';
import type { 
    TeamGenome, 
    GeneticPopulation, 
    GeneticConfig, 
    TeamGenes,
    StrategyType,
    StatsPriority 
} from '../types/genetic';

const STORAGE_KEY = 'pokemon-genetic-population';

// Configuração padrão
const DEFAULT_CONFIG: GeneticConfig = {
    populationSize: 20,
    elitePercentage: 0.2,
    mutationRate: 0.15,
    crossoverRate: 0.8,
    tournamentSize: 4
};

// Configuração para testes intensivos
export const TESTING_CONFIG: GeneticConfig = {
    populationSize: 100,      // 5x maior população
    elitePercentage: 0.1,     // Mantém top 10 genomas
    mutationRate: 0.20,       // Mais exploração
    crossoverRate: 0.85,      // Mais recombinação
    tournamentSize: 6         // Seleção mais competitiva
};

// Tipos de Pokemon disponíveis
const ALL_TYPES = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// Gerar ID único
function generateId(): string {
    return `genome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Gerar genes aleatórios
function generateRandomGenes(): TeamGenes {
    const pokemonIds: number[] = [];
    while (pokemonIds.length < 6) {
        const id = Math.floor(Math.random() * 151) + 1;
        if (!pokemonIds.includes(id)) {
            pokemonIds.push(id);
        }
    }

    const typeCount = 3 + Math.floor(Math.random() * 4); // 3-6 tipos
    const typeDistribution = Array.from({ length: typeCount }, () => 
        ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)]
    );

    const strategies: StrategyType[] = ['counter', 'balanced', 'aggressive', 'tank'];
    const priorities: StatsPriority[] = ['balanced', 'offensive', 'defensive', 'speed'];

    return {
        pokemonIds,
        typeDistribution,
        statsPriority: priorities[Math.floor(Math.random() * priorities.length)],
        strategyType: strategies[Math.floor(Math.random() * strategies.length)]
    };
}

// Criar genoma inicial
function createGenome(generation: number = 0, parents: [string, string] | null = null): TeamGenome {
    return {
        id: generateId(),
        generation,
        genes: generateRandomGenes(),
        fitness: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        battlesPlayed: 0,
        parents,
        createdAt: Date.now()
    };
}

// Calcular fitness de um genoma
function calculateFitness(genome: TeamGenome, playerTypes?: string[]): number {
    if (genome.battlesPlayed === 0) return 0;

    // 1. Win Rate (0-50 pontos)
    const winRate = genome.wins / genome.battlesPlayed;
    const winScore = winRate * 50;

    // 2. Variedade de Tipos (0-25 pontos)
    const uniqueTypes = new Set(genome.genes.typeDistribution).size;
    const varietyScore = (uniqueTypes / 18) * 25;

    // 3. Experiência (0-15 pontos)
    const experienceScore = Math.min(15, (genome.battlesPlayed / 50) * 15);

    // 4. Bonus de Contra-Estratégia (0-10 pontos)
    let counterBonus = 0;
    if (playerTypes && playerTypes.length > 0) {
        const countersPlayer = genome.genes.typeDistribution.some(type => 
            playerTypes.includes(type)
        );
        counterBonus = countersPlayer ? 10 : 0;
    }

    return Math.min(100, winScore + varietyScore + experienceScore + counterBonus);
}

// Seleção por torneio
function tournamentSelection(population: TeamGenome[], tournamentSize: number): TeamGenome {
    const tournament = [];
    for (let i = 0; i < tournamentSize; i++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        tournament.push(population[randomIndex]);
    }
    
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
}

// Crossover (cruzamento)
function crossover(parent1: TeamGenome, parent2: TeamGenome): TeamGenome {
    const genes: TeamGenes = {
        // Combinar Pokemon IDs (3 de cada pai)
        pokemonIds: [
            ...parent1.genes.pokemonIds.slice(0, 3),
            ...parent2.genes.pokemonIds.slice(3, 6)
        ],
        
        // Combinar tipos (mix dos dois pais)
        typeDistribution: [
            ...parent1.genes.typeDistribution.slice(0, Math.floor(parent1.genes.typeDistribution.length / 2)),
            ...parent2.genes.typeDistribution.slice(Math.floor(parent2.genes.typeDistribution.length / 2))
        ],
        
        // Herdar aleatoriamente
        statsPriority: Math.random() > 0.5 ? parent1.genes.statsPriority : parent2.genes.statsPriority,
        strategyType: Math.random() > 0.5 ? parent1.genes.strategyType : parent2.genes.strategyType
    };

    return {
        id: generateId(),
        generation: Math.max(parent1.generation, parent2.generation) + 1,
        genes,
        fitness: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        battlesPlayed: 0,
        parents: [parent1.id, parent2.id],
        createdAt: Date.now()
    };
}

// Mutação
function mutate(genome: TeamGenome, mutationRate: number): TeamGenome {
    const mutated = { ...genome, genes: { ...genome.genes } };

    // Mutação de Pokemon (trocar 1 Pokemon)
    if (Math.random() < mutationRate) {
        const index = Math.floor(Math.random() * 6);
        let newId = Math.floor(Math.random() * 151) + 1;
        // Garantir que não duplica
        while (mutated.genes.pokemonIds.includes(newId)) {
            newId = Math.floor(Math.random() * 151) + 1;
        }
        mutated.genes.pokemonIds[index] = newId;
    }

    // Mutação de Tipos
    if (Math.random() < mutationRate) {
        const action = Math.random();
        if (action < 0.5 && mutated.genes.typeDistribution.length < 10) {
            // Adicionar tipo
            mutated.genes.typeDistribution.push(
                ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)]
            );
        } else if (mutated.genes.typeDistribution.length > 2) {
            // Remover tipo
            mutated.genes.typeDistribution.splice(
                Math.floor(Math.random() * mutated.genes.typeDistribution.length), 1
            );
        }
    }

    // Mutação de Estratégia
    if (Math.random() < mutationRate) {
        const strategies: StrategyType[] = ['counter', 'balanced', 'aggressive', 'tank'];
        mutated.genes.strategyType = strategies[Math.floor(Math.random() * 4)];
    }

    // Mutação de Prioridade de Stats
    if (Math.random() < mutationRate) {
        const priorities: StatsPriority[] = ['balanced', 'offensive', 'defensive', 'speed'];
        mutated.genes.statsPriority = priorities[Math.floor(Math.random() * 4)];
    }

    return mutated;
}

// Calcular diversidade genética
function calculateDiversity(population: TeamGenome[]): number {
    const uniqueStrategies = new Set(population.map(g => g.genes.strategyType)).size;
    const uniquePriorities = new Set(population.map(g => g.genes.statsPriority)).size;
    
    // Diversidade baseada em variação de estratégias e prioridades
    return ((uniqueStrategies / 4) * 0.5 + (uniquePriorities / 4) * 0.5) * 100;
}

export function useGeneticAI(config: Partial<GeneticConfig> = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    
    const [population, setPopulation] = useState<GeneticPopulation>({
        genomes: [],
        currentGeneration: 0,
        totalBattles: 0,
        bestFitness: 0,
        bestGenomeId: null,
        generationHistory: []
    });

    // Carregar população do localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setPopulation(parsed);
            } catch (error) {
                console.error('Erro ao carregar população genética:', error);
                initializePopulation();
            }
        } else {
            initializePopulation();
        }
    }, []);

    // Salvar população no localStorage
    useEffect(() => {
        if (population.genomes.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(population));
        }
    }, [population]);

    // Inicializar população
    const initializePopulation = useCallback(() => {
        const genomes = Array.from({ length: fullConfig.populationSize }, () => 
            createGenome(0)
        );

        setPopulation({
            genomes,
            currentGeneration: 0,
            totalBattles: 0,
            bestFitness: 0,
            bestGenomeId: null,
            generationHistory: []
        });
    }, [fullConfig.populationSize]);

    // Registrar resultado de batalha
    const recordBattle = useCallback((genomeId: string, result: 'win' | 'loss' | 'draw', playerTypes: string[] = []) => {
        setPopulation(prev => {
            const updated = { ...prev };
            const genome = updated.genomes.find(g => g.id === genomeId);
            
            if (!genome) return prev;

            genome.battlesPlayed++;
            if (result === 'win') genome.wins++;
            else if (result === 'loss') genome.losses++;
            else genome.draws++;

            // Recalcular fitness
            genome.fitness = calculateFitness(genome, playerTypes);

            // Atualizar melhor fitness
            if (genome.fitness > updated.bestFitness) {
                updated.bestFitness = genome.fitness;
                updated.bestGenomeId = genome.id;
            }

            updated.totalBattles++;

            return updated;
        });
    }, []);

    // Evoluir para próxima geração
    const evolveGeneration = useCallback((playerTypes: string[] = []) => {
        setPopulation(prev => {
            // Recalcular fitness de todos
            const genomesWithFitness = prev.genomes.map(genome => ({
                ...genome,
                fitness: calculateFitness(genome, playerTypes)
            }));

            // Ordenar por fitness
            genomesWithFitness.sort((a, b) => b.fitness - a.fitness);

            // Elitismo - manter os melhores
            const eliteCount = Math.ceil(fullConfig.populationSize * fullConfig.elitePercentage);
            const elite = genomesWithFitness.slice(0, eliteCount);

            // Criar nova geração
            const newGenomes = [...elite];

            while (newGenomes.length < fullConfig.populationSize) {
                // Seleção
                const parent1 = tournamentSelection(genomesWithFitness, fullConfig.tournamentSize);
                const parent2 = tournamentSelection(genomesWithFitness, fullConfig.tournamentSize);

                // Crossover
                let child: TeamGenome;
                if (Math.random() < fullConfig.crossoverRate) {
                    child = crossover(parent1, parent2);
                } else {
                    // Se não houver crossover, clone um dos pais
                    child = { ...parent1, id: generateId(), parents: [parent1.id, parent2.id] };
                }

                // Mutação
                child = mutate(child, fullConfig.mutationRate);

                newGenomes.push(child);
            }

            // Calcular estatísticas da geração
            const avgFitness = genomesWithFitness.reduce((sum, g) => sum + g.fitness, 0) / genomesWithFitness.length;
            const diversity = calculateDiversity(genomesWithFitness);

            const newGeneration = prev.currentGeneration + 1;

            return {
                genomes: newGenomes,
                currentGeneration: newGeneration,
                totalBattles: prev.totalBattles,
                bestFitness: Math.max(prev.bestFitness, genomesWithFitness[0].fitness),
                bestGenomeId: genomesWithFitness[0].id,
                generationHistory: [
                    ...prev.generationHistory,
                    {
                        generation: newGeneration,
                        averageFitness: avgFitness,
                        bestFitness: genomesWithFitness[0].fitness,
                        diversity
                    }
                ]
            };
        });
    }, [fullConfig]);

    // Obter melhor genoma
    const getBestGenome = useCallback((): TeamGenome | null => {
        if (population.genomes.length === 0) return null;
        
        const sorted = [...population.genomes].sort((a, b) => 
            calculateFitness(b) - calculateFitness(a)
        );
        
        return sorted[0];
    }, [population.genomes]);

    // Obter genoma por ID
    const getGenomeById = useCallback((id: string): TeamGenome | null => {
        return population.genomes.find(g => g.id === id) || null;
    }, [population.genomes]);

    // Resetar população
    const resetPopulation = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        initializePopulation();
    }, [initializePopulation]);

    // Obter estatísticas
    const getStats = useCallback(() => {
        const totalWins = population.genomes.reduce((sum, g) => sum + g.wins, 0);
        const totalLosses = population.genomes.reduce((sum, g) => sum + g.losses, 0);
        const totalDraws = population.genomes.reduce((sum, g) => sum + g.draws, 0);
        const avgFitness = population.genomes.length > 0
            ? population.genomes.reduce((sum, g) => sum + g.fitness, 0) / population.genomes.length
            : 0;

        return {
            generation: population.currentGeneration,
            populationSize: population.genomes.length,
            totalBattles: population.totalBattles,
            totalWins,
            totalLosses,
            totalDraws,
            bestFitness: population.bestFitness,
            averageFitness: avgFitness,
            diversity: calculateDiversity(population.genomes)
        };
    }, [population]);

    return {
        population,
        recordBattle,
        evolveGeneration,
        getBestGenome,
        getGenomeById,
        resetPopulation,
        getStats,
        initializePopulation
    };
}
