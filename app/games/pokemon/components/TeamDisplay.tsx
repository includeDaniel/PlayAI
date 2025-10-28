import React from 'react';
import type { Pokemon } from '../types/pokemon';

interface TeamDisplayProps {
    team: Pokemon[];
    onRemovePokemon?: (pokemon: Pokemon) => void;
    title?: string;
    showRemoveButton?: boolean;
    maxSize?: number;
    className?: string;
}

const typeColors: { [key: string]: string } = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    electric: 'bg-yellow-400',
    grass: 'bg-green-500',
    ice: 'bg-blue-200',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-green-400',
    rock: 'bg-yellow-800',
    ghost: 'bg-purple-700',
    dragon: 'bg-indigo-700',
    dark: 'bg-gray-800',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300'
};

// Imagem fallback em base64 (pokeball simples)
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI0VFRSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0iI0ZGRiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48L3N2Zz4=';

export default function TeamDisplay({ 
    team, 
    onRemovePokemon, 
    title = "Seu Time", 
    showRemoveButton = true,
    maxSize = 6,
    className = ""
}: TeamDisplayProps) {
    
    const emptySlots = Array.from({ length: Math.max(0, maxSize - team.length) });

    const getPokemonStats = (pokemon: Pokemon) => {
        const stats = pokemon.stats.reduce((acc, stat) => {
            acc[stat.stat.name] = stat.base_stat;
            return acc;
        }, {} as { [key: string]: number });
        
        return {
            hp: stats.hp || 0,
            attack: stats.attack || 0,
            defense: stats.defense || 0,
            total: Object.values(stats).reduce((sum, val) => sum + val, 0)
        };
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Cabeçalho */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                        <strong className="text-gray-900 dark:text-gray-100">{team.length}/{maxSize}</strong> Pokemon selecionados
                    </span>
                    {team.length > 0 && (
                        <span>
                            Força Total: <strong className="text-blue-600 dark:text-blue-400">
                                {team.reduce((sum, pokemon) => sum + getPokemonStats(pokemon).total, 0)}
                            </strong>
                        </span>
                    )}
                </div>
            </div>

            {/* Grid do Time */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Pokemon Selecionados */}
                {team.map((pokemon, index) => (
                    <div
                        key={pokemon.id}
                        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 
                                 hover:shadow-lg transition-all duration-200"
                    >
                        {/* Botão de Remover */}
                        {showRemoveButton && onRemovePokemon && (
                            <button
                                onClick={() => onRemovePokemon(pokemon)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 
                                         flex items-center justify-center text-xs transition-colors z-10"
                                title="Remover Pokemon"
                            >
                                ×
                            </button>
                        )}

                        {/* Número da Posição */}
                        <div className="absolute top-2 left-2 bg-gray-500 text-white rounded-full w-5 h-5 
                                      flex items-center justify-center text-xs font-bold">
                            {index + 1}
                        </div>

                        {/* Imagem do Pokemon */}
                        <div className="flex justify-center mb-3 pt-3">
                            <img
                                src={pokemon.sprites?.other?.['official-artwork']?.front_default || FALLBACK_IMAGE}
                                alt={pokemon.name}
                                className="w-16 h-16 object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const paddedId = String(pokemon.id).padStart(3, '0');
                                    const serebiiUrl = `https://www.serebii.net/pokemon/art/${paddedId}.png`;
                                    
                                    if (!target.src.includes('serebii') && target.src !== FALLBACK_IMAGE) {
                                        target.src = serebiiUrl;
                                    } else if (target.src.includes('serebii')) {
                                        target.src = FALLBACK_IMAGE;
                                    }
                                }}
                            />
                        </div>

                        {/* Nome */}
                        <h3 className="text-center font-medium text-gray-900 dark:text-gray-100 mb-2 capitalize text-sm">
                            {pokemon.name}
                        </h3>

                        {/* Tipos */}
                        <div className="flex justify-center gap-1 mb-2 flex-wrap">
                            {pokemon.types.map((type, typeIndex) => (
                                <span
                                    key={typeIndex}
                                    className={`
                                        px-2 py-0.5 rounded-full text-xs font-medium text-white capitalize
                                        ${typeColors[type.type.name] || 'bg-gray-500'}
                                    `}
                                >
                                    {type.type.name}
                                </span>
                            ))}
                        </div>

                        {/* Stats Resumidos */}
                        <div className="space-y-1">
                            {['hp', 'attack', 'defense'].map((statName) => {
                                const stat = pokemon.stats.find(s => s.stat.name === statName);
                                const value = stat?.base_stat || 0;
                                const label = statName === 'hp' ? 'HP' : 
                                            statName === 'attack' ? 'ATK' : 'DEF';
                                
                                return (
                                    <div key={statName} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {label}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <div className="w-8 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                                <div
                                                    className="bg-blue-500 h-1 rounded-full"
                                                    style={{ width: `${Math.min(100, (value / 200) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-900 dark:text-gray-100 w-6 text-right">
                                                {value}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Slots Vazios */}
                {emptySlots.map((_, index) => (
                    <div
                        key={`empty-${index}`}
                        className="bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 
                                 flex flex-col items-center justify-center min-h-[180px] relative"
                    >
                        {/* Número da Posição */}
                        <div className="absolute top-2 left-2 bg-gray-400 text-white rounded-full w-5 h-5 
                                      flex items-center justify-center text-xs">
                            {team.length + index + 1}
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 dark:bg-gray-600 rounded-full 
                                          flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Slot vazio
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumo do Time (se tiver Pokemon) */}
            {team.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Análise do Time</h3>
                    
                    {/* Tipos do Time */}
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipos presentes:</h4>
                        <div className="flex flex-wrap gap-1">
                            {Array.from(new Set(team.flatMap(p => p.types.map(t => t.type.name)))).map(type => (
                                <span
                                    key={type}
                                    className={`px-2 py-1 rounded text-xs font-medium text-white capitalize
                                              ${typeColors[type] || 'bg-gray-500'}`}
                                >
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Stats Médias */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stats médias do time:</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            {['hp', 'attack', 'defense'].map(statName => {
                                const average = team.length > 0 
                                    ? Math.round(team.reduce((sum, pokemon) => {
                                        const stat = pokemon.stats.find(s => s.stat.name === statName);
                                        return sum + (stat?.base_stat || 0);
                                    }, 0) / team.length)
                                    : 0;
                                
                                const label = statName === 'hp' ? 'HP Médio' : 
                                            statName === 'attack' ? 'Ataque Médio' : 'Defesa Média';
                                
                                return (
                                    <div key={statName} className="text-center">
                                        <div className="text-gray-600 dark:text-gray-400">{label}</div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {average}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}