import { useState, useEffect, useCallback, useMemo } from 'react';
import { PokemonClient } from 'pokenode-ts';
import type { Pokemon as PokeNodePokemon } from 'pokenode-ts';
import type { Pokemon } from '../types/pokemon';

// Constantes
const MAX_POKEMON = 905; // Até a 8ª geração
const POKEMON_PER_PAGE = 48; // 6x8 grid
const POKEMON_CACHE_KEY = 'pokemon-data-cache';
const CACHE_VERSION = 'v1'; // Incrementar quando mudar estrutura de dados

// Gerações Pokemon (ranges de ID)
export const GENERATIONS = [
    { gen: 1, name: 'Kanto', start: 1, end: 151 },
    { gen: 2, name: 'Johto', start: 152, end: 251 },
    { gen: 3, name: 'Hoenn', start: 252, end: 386 },
    { gen: 4, name: 'Sinnoh', start: 387, end: 493 },
    { gen: 5, name: 'Unova', start: 494, end: 649 },
    { gen: 6, name: 'Kalos', start: 650, end: 721 },
    { gen: 7, name: 'Alola', start: 722, end: 809 },
    { gen: 8, name: 'Galar', start: 810, end: 905 }
];

// Função para obter geração de um Pokemon
export function getPokemonGeneration(id: number): { gen: number; name: string } {
    const generation = GENERATIONS.find(g => id >= g.start && id <= g.end);
    return generation ? { gen: generation.gen, name: generation.name } : { gen: 1, name: 'Kanto' };
}

// Função para converter Pokemon do pokenode-ts para nosso tipo
function convertPokemon(pkNodePokemon: PokeNodePokemon): Pokemon {
    const pokemonId = pkNodePokemon.id;
    const paddedId = String(pokemonId).padStart(3, '0');
    
    // URLs de CDNs alternativos (SEM GitHub para evitar rate limit)
    const pokemonComCdn = `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${paddedId}.png`;
    
    return {
        id: pokemonId,
        name: pkNodePokemon.name,
        sprites: {
            // Usar CDN Pokemon.com (não tem rate limit)
            front_default: pokemonComCdn,
            other: {
                'official-artwork': {
                    // Prioridade: Pokemon.com > Serebii > API original
                    front_default: pokemonComCdn
                }
            }
        },
        types: pkNodePokemon.types,
        stats: pkNodePokemon.stats,
        abilities: pkNodePokemon.abilities,
        height: pkNodePokemon.height,
        weight: pkNodePokemon.weight
    };
}

export function usePokemonData() {
    const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
    const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    // Criar instância do PokemonClient com cache
    const api = useMemo(() => new PokemonClient(), []);

    // Carregar do cache localStorage
    const loadFromCache = useCallback((): Pokemon[] | null => {
        try {
            const cached = localStorage.getItem(POKEMON_CACHE_KEY);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            if (data.version !== CACHE_VERSION) {
                localStorage.removeItem(POKEMON_CACHE_KEY);
                return null;
            }
            
            console.log(`✅ ${data.pokemon.length} Pokemon carregados do cache!`);
            return data.pokemon;
        } catch (error) {
            console.error('Erro ao carregar cache:', error);
            return null;
        }
    }, []);

    // Salvar no cache localStorage
    const saveToCache = useCallback((pokemon: Pokemon[]) => {
        try {
            const data = {
                version: CACHE_VERSION,
                pokemon,
                timestamp: Date.now()
            };
            localStorage.setItem(POKEMON_CACHE_KEY, JSON.stringify(data));
            console.log(`💾 ${pokemon.length} Pokemon salvos no cache!`);
        } catch (error) {
            console.error('Erro ao salvar cache:', error);
        }
    }, []);

    // Calcular páginas baseado nos Pokemon filtrados
    useEffect(() => {
        const total = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
        setTotalPages(total);
    }, [filteredPokemon]);

    // Pokemon da página atual
    const paginatedPokemon = useMemo(() => {
        const startIndex = (currentPage - 1) * POKEMON_PER_PAGE;
        const endIndex = startIndex + POKEMON_PER_PAGE;
        return filteredPokemon.slice(startIndex, endIndex);
    }, [filteredPokemon, currentPage]);

    const loadInitialPokemon = useCallback(async () => {
        // Tentar carregar do cache primeiro
        const cachedPokemon = loadFromCache();
        if (cachedPokemon && cachedPokemon.length > 0) {
            setAllPokemon(cachedPokemon);
            setFilteredPokemon(cachedPokemon);
            setCurrentPage(1);
            return;
        }

        // Se não tiver cache, carregar da API
        setLoading(true);
        setError(null);
        
        try {
            // Carregar TODOS os Pokemon de uma vez (API tem cache)
            // Fazer em lotes para evitar sobrecarga
            const BATCH_SIZE = 100;
            const allPokemonData: Pokemon[] = [];
            
            for (let batch = 0; batch < Math.ceil(MAX_POKEMON / BATCH_SIZE); batch++) {
                const start = batch * BATCH_SIZE + 1;
                const end = Math.min((batch + 1) * BATCH_SIZE, MAX_POKEMON);
                
                const batchPromises = Array.from({ length: end - start + 1 }, (_, i) => 
                    api.getPokemonById(start + i)
                        .then(convertPokemon)
                        .catch(err => {
                            console.error(`Erro ao carregar Pokemon ${start + i}:`, err);
                            return null;
                        })
                );

                const batchResults = (await Promise.all(batchPromises)).filter(Boolean) as Pokemon[];
                allPokemonData.push(...batchResults);
                
                // Atualizar progresso
                console.log(`Carregados ${allPokemonData.length} de ${MAX_POKEMON} Pokemon...`);
            }
            
            setAllPokemon(allPokemonData);
            setFilteredPokemon(allPokemonData);
            setCurrentPage(1);
            saveToCache(allPokemonData); // Salvar no cache
            console.log(`✅ Total de ${allPokemonData.length} Pokemon carregados!`);
        } catch (error) {
            console.error('Erro ao carregar Pokemon:', error);
            setError('Erro ao carregar dados dos Pokemon. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [api, loadFromCache, saveToCache]);

    const fetchPokemon = useCallback(async (nameOrId: string | number): Promise<Pokemon | null> => {
        try {
            const pokemon = await api.getPokemonByName(nameOrId.toString().toLowerCase());
            return convertPokemon(pokemon);
        } catch (error) {
            console.error(`Erro ao buscar ${nameOrId}:`, error);
            return null;
        }
    }, [api]);

    const generateRandomTeam = useCallback(async (size: number = 6): Promise<Pokemon[]> => {
        const team: Pokemon[] = [];
        
        // Se já temos todos os Pokemon carregados, selecionar aleatoriamente deles
        if (allPokemon.length >= MAX_POKEMON * 0.9) { // Pelo menos 90% carregados
            const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, size);
        }
        
        // Fallback: buscar na API
        const maxAttempts = 20;
        for (let i = 0; i < size && team.length < maxAttempts; i++) {
            const randomId = Math.floor(Math.random() * MAX_POKEMON) + 1;
            const pokemon = await fetchPokemon(randomId.toString());
            
            if (pokemon && !team.find(p => p.id === pokemon.id)) {
                team.push(pokemon);
            } else {
                i--;
            }
        }
        
        return team;
    }, [allPokemon, fetchPokemon]);

    const searchPokemon = useCallback((term: string) => {
        setSearchTerm(term);
        setCurrentPage(1); // Voltar para primeira página ao buscar
        
        if (!term.trim()) {
            setFilteredPokemon(allPokemon);
            return;
        }

        const filtered = allPokemon.filter(pokemon => 
            pokemon.name.toLowerCase().includes(term.toLowerCase()) ||
            pokemon.types.some(type => type.type.name.toLowerCase().includes(term.toLowerCase()))
        );
        
        setFilteredPokemon(filtered);
    }, [allPokemon]);

    const getPokemonById = useCallback(async (id: number): Promise<Pokemon | null> => {
        // Verificar se já está carregado
        const existing = allPokemon.find(p => p.id === id);
        if (existing) return existing;

        // Buscar na API se não estiver carregado
        return await fetchPokemon(id.toString());
    }, [allPokemon, fetchPokemon]);

    // Simplificado - todos os Pokemon já estão carregados
    const loadMorePokemon = useCallback(async () => {
        // Não faz nada, todos já estão carregados
        console.log('Todos os Pokemon já estão carregados!');
    }, []);

    const goToPage = useCallback((page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    }, [totalPages]);

    const nextPage = useCallback(() => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    }, [currentPage, totalPages, goToPage]);

    const prevPage = useCallback(() => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    }, [currentPage, goToPage]);

    // Carregar Pokemon iniciais na montagem do componente
    useEffect(() => {
        if (allPokemon.length === 0) {
            loadInitialPokemon();
        }
    }, [loadInitialPokemon, allPokemon.length]);

    return {
        allPokemon,
        filteredPokemon,
        paginatedPokemon,
        loading,
        error,
        searchTerm,
        currentPage,
        totalPages,
        loadInitialPokemon,
        fetchPokemon,
        generateRandomTeam,
        searchPokemon,
        getPokemonById,
        loadMorePokemon,
        goToPage,
        nextPage,
        prevPage
    };
}