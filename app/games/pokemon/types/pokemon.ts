// Interfaces TypeScript para o Pokemon Battle AI
export interface Pokemon {
    id: number;
    name: string;
    sprites: {
        front_default: string;
        other: {
            'official-artwork': {
                front_default: string;
            };
        };
    };
    types: Array<{
        type: {
            name: string;
        };
    }>;
    stats: Array<{
        base_stat: number;
        stat: {
            name: string;
        };
    }>;
    abilities: Array<{
        ability: {
            name: string;
        };
    }>;
    height: number;
    weight: number;
}

export interface TeamAnalysis {
    weaknesses: string[];
    resistances: string[];
    recommendations: string[];
    overallStrength: number;
}

export interface IndividualBattle {
    playerPokemon: Pokemon;
    aiPokemon: Pokemon;
    winner: 'player' | 'ai';
    playerDamage: number;
    aiDamage: number;
    typeAdvantage: 'player' | 'ai' | 'neutral';
    reasoning: string;
}

export interface BattleResult {
    playerTeam: Pokemon[];
    aiTeam: Pokemon[];
    winner: 'player' | 'ai' | 'draw';
    analysis: string;
    battles: IndividualBattle[];
    playerScore: number;
    aiScore: number;
}

export type ViewType = 'menu' | 'setup' | 'analysis' | 'battle' | 'automated-tests';
