// Tipos para o Algoritmo Genético

export type StrategyType = 'counter' | 'balanced' | 'aggressive' | 'tank';
export type StatsPriority = 'balanced' | 'offensive' | 'defensive' | 'speed';

export interface TeamGenes {
    pokemonIds: number[];           // IDs dos 6 Pokemon (1-151)
    typeDistribution: string[];     // Tipos priorizados na seleção
    statsPriority: StatsPriority;   // Prioridade de stats
    strategyType: StrategyType;     // Tipo de estratégia
}

export interface TeamGenome {
    id: string;
    generation: number;
    genes: TeamGenes;
    fitness: number;                // Pontuação de sucesso (0-100)
    wins: number;
    losses: number;
    draws: number;
    battlesPlayed: number;
    parents: [string, string] | null; // IDs dos genomas "pais"
    createdAt: number;              // timestamp
}

export interface GeneticPopulation {
    genomes: TeamGenome[];
    currentGeneration: number;
    totalBattles: number;
    bestFitness: number;
    bestGenomeId: string | null;
    generationHistory: {
        generation: number;
        averageFitness: number;
        bestFitness: number;
        diversity: number;
    }[];
}

export interface GeneticConfig {
    populationSize: number;         // Tamanho da população (padrão: 20)
    elitePercentage: number;        // % mantida entre gerações (padrão: 0.2)
    mutationRate: number;           // Taxa de mutação (padrão: 0.15)
    crossoverRate: number;          // Taxa de crossover (padrão: 0.8)
    tournamentSize: number;         // Tamanho do torneio de seleção (padrão: 4)
}
