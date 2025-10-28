import React from 'react';
import type { Pokemon } from '../types/pokemon';

interface PokemonGridProps {
    pokemon: Pokemon[];
    onPokemonSelect: (pokemon: Pokemon) => void;
    selectedPokemon: Pokemon[];
    loading?: boolean;
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    maxSelections?: number;
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

export default function PokemonGrid({ 
    pokemon, 
    onPokemonSelect, 
    selectedPokemon = [], 
    loading = false,
    searchTerm = '',
    onSearchChange,
    maxSelections = 6
}: PokemonGridProps) {
    const isSelected = (pokemonItem: Pokemon) => 
        selectedPokemon.some(p => p.id === pokemonItem.id);

    const canSelect = (pokemonItem: Pokemon) => 
        isSelected(pokemonItem) || selectedPokemon.length < maxSelections;

    return (
        <div className="w-full">
            {/* Barra de Pesquisa */}
            {onSearchChange && (
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Buscar Pokemon por nome ou tipo..."
                            className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Indicador de Loading */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando Pokemon...</span>
                </div>
            )}

            {/* Grid de Pokemon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pokemon.map((pokemonItem) => (
                    <div
                        key={pokemonItem.id}
                        onClick={() => canSelect(pokemonItem) && onPokemonSelect(pokemonItem)}
                        className={`
                            relative bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 p-4 cursor-pointer
                            transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1
                            ${isSelected(pokemonItem) 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                            }
                            ${!canSelect(pokemonItem) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {/* Badge de Selecionado */}
                        {isSelected(pokemonItem) && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                ✓
                            </div>
                        )}

                        {/* Imagem do Pokemon */}
                        <div className="flex justify-center mb-3">
                            <img
                                src={pokemonItem.sprites?.other?.['official-artwork']?.front_default || FALLBACK_IMAGE}
                                alt={pokemonItem.name}
                                className="w-20 h-20 object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const paddedId = String(pokemonItem.id).padStart(3, '0');
                                    const serebiiUrl = `https://www.serebii.net/pokemon/art/${paddedId}.png`;
                                    
                                    if (!target.src.includes('serebii') && target.src !== FALLBACK_IMAGE) {
                                        target.src = serebiiUrl;
                                    } else if (target.src.includes('serebii')) {
                                        target.src = FALLBACK_IMAGE;
                                    }
                                }}
                            />
                        </div>

                        {/* Nome do Pokemon */}
                        <h3 className="text-center font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize">
                            #{pokemonItem.id.toString().padStart(3, '0')} {pokemonItem.name}
                        </h3>

                        {/* Tipos */}
                        <div className="flex justify-center gap-1 mb-3">
                            {pokemonItem.types.map((type, index) => (
                                <span
                                    key={index}
                                    className={`
                                        px-2 py-1 rounded-full text-xs font-medium text-white capitalize
                                        ${typeColors[type.type.name] || 'bg-gray-500'}
                                    `}
                                >
                                    {type.type.name}
                                </span>
                            ))}
                        </div>

                        {/* Stats Principais */}
                        <div className="space-y-1">
                            {pokemonItem.stats.slice(0, 3).map((stat, index) => {
                                const statName = stat.stat.name === 'hp' ? 'HP' : 
                                               stat.stat.name === 'attack' ? 'ATK' : 'DEF';
                                return (
                                    <div key={index} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                                            {statName}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                <div
                                                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, (stat.base_stat / 200) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium w-8 text-right">
                                                {stat.base_stat}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-blue-500 opacity-0 hover:opacity-10 transition-opacity rounded-lg pointer-events-none" />
                    </div>
                ))}
            </div>

            {/* Mensagem de Pokemon não encontrado */}
            {!loading && pokemon.length === 0 && searchTerm && (
                <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.078-2.33l-.553-.553A7.953 7.953 0 016 9c0-4.418 3.582-8 8-8s8 3.582 8 8a7.953 7.953 0 01-.369 2.117l-.553.553A7.962 7.962 0 0112 15z" />
                        </svg>
                        <p className="text-lg font-medium">Nenhum Pokemon encontrado</p>
                        <p className="text-sm">Tente buscar com outros termos</p>
                    </div>
                </div>
            )}
        </div>
    );
}