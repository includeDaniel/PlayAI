"use client";
import { useState, useCallback, useMemo } from 'react';
import { PokemonClient } from 'pokenode-ts';
import type { Pokemon as PokeNodePokemon } from 'pokenode-ts';
import { usePokemonData } from './hooks/usePokemonData';
import { useGeneticAI, TESTING_CONFIG } from './hooks/useGeneticAI';
import PokemonGrid from './components/PokemonGrid';
import TeamDisplay from './components/TeamDisplay';
import { BattleMatchup } from './components/BattleMatchup';
import { AutomatedTestBattery } from './components/AutomatedTestBattery';
import type { Pokemon, ViewType, TeamAnalysis, BattleResult, IndividualBattle } from './types/pokemon';
import type { TeamGenome } from './types/genetic';

// Função helper para converter Pokemon do pokenode-ts
function convertPokemon(pkNodePokemon: PokeNodePokemon): Pokemon {
    return {
        id: pkNodePokemon.id,
        name: pkNodePokemon.name,
        sprites: {
            front_default: pkNodePokemon.sprites.front_default || '',
            other: {
                'official-artwork': {
                    front_default: pkNodePokemon.sprites.other?.['official-artwork']?.front_default || pkNodePokemon.sprites.front_default || ''
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

export default function PokemonBattleAI() {
    const [currentView, setCurrentView] = useState<ViewType>('menu');
    const [playerTeam, setPlayerTeam] = useState<Pokemon[]>([]);
    const [aiTeam, setAiTeam] = useState<Pokemon[]>([]);
    const [currentGenomeId, setCurrentGenomeId] = useState<string | null>(null);
    const [teamAnalysis, setTeamAnalysis] = useState<TeamAnalysis | null>(null);
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
    const [isTestingMode, setIsTestingMode] = useState<boolean>(false);
    const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
    const [testProgress, setTestProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

    // Criar instância do PokemonClient
    const pokemonApi = useMemo(() => new PokemonClient(), []);

    const { 
        paginatedPokemon,
        loading, 
        error, 
        searchTerm,
        currentPage,
        totalPages,
        searchPokemon, 
        generateRandomTeam,
        nextPage,
        prevPage,
        goToPage
    } = usePokemonData();

    const {
        population,
        recordBattle,
        evolveGeneration,
        getBestGenome,
        getGenomeById,
        resetPopulation,
        getStats
    } = useGeneticAI(isTestingMode ? TESTING_CONFIG : {});

    // Gerenciamento do time do jogador
    const handlePokemonSelect = useCallback((pokemon: Pokemon) => {
        setPlayerTeam(prevTeam => {
            const isAlreadySelected = prevTeam.some(p => p.id === pokemon.id);
            
            if (isAlreadySelected) {
                return prevTeam.filter(p => p.id !== pokemon.id);
            } else if (prevTeam.length < 6) {
                return [...prevTeam, pokemon];
            }
            
            return prevTeam;
        });
    }, []);

    const handleRemovePokemon = useCallback((pokemon: Pokemon) => {
        setPlayerTeam(prevTeam => prevTeam.filter(p => p.id !== pokemon.id));
    }, []);

    const handleGenerateRandomTeam = useCallback(async () => {
        try {
            const randomTeam = await generateRandomTeam(6);
            setPlayerTeam(randomTeam);
        } catch (error) {
            console.error('Erro ao gerar time aleatório:', error);
        }
    }, [generateRandomTeam]);

    // Análise de tipos e fraquezas
    const analyzeTeam = useCallback((team: Pokemon[]): TeamAnalysis => {
        const typeEffectiveness: { [key: string]: { weakTo: string[]; strongAgainst: string[] } } = {
            fire: { weakTo: ['water', 'ground', 'rock'], strongAgainst: ['grass', 'ice', 'bug', 'steel'] },
            water: { weakTo: ['electric', 'grass'], strongAgainst: ['fire', 'ground', 'rock'] },
            grass: { weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'], strongAgainst: ['water', 'ground', 'rock'] },
            electric: { weakTo: ['ground'], strongAgainst: ['water', 'flying'] },
            ground: { weakTo: ['water', 'grass', 'ice'], strongAgainst: ['fire', 'electric', 'poison', 'rock', 'steel'] },
            rock: { weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'], strongAgainst: ['fire', 'ice', 'flying', 'bug'] },
            psychic: { weakTo: ['bug', 'ghost', 'dark'], strongAgainst: ['fighting', 'poison'] },
            ice: { weakTo: ['fire', 'fighting', 'rock', 'steel'], strongAgainst: ['grass', 'ground', 'flying', 'dragon'] },
            dragon: { weakTo: ['ice', 'dragon', 'fairy'], strongAgainst: ['dragon'] },
            dark: { weakTo: ['fighting', 'bug', 'fairy'], strongAgainst: ['psychic', 'ghost'] },
            fairy: { weakTo: ['poison', 'steel'], strongAgainst: ['fighting', 'dragon', 'dark'] },
            fighting: { weakTo: ['flying', 'psychic', 'fairy'], strongAgainst: ['normal', 'ice', 'rock', 'dark', 'steel'] },
            poison: { weakTo: ['ground', 'psychic'], strongAgainst: ['grass', 'fairy'] },
            flying: { weakTo: ['electric', 'ice', 'rock'], strongAgainst: ['grass', 'fighting', 'bug'] },
            bug: { weakTo: ['fire', 'flying', 'rock'], strongAgainst: ['grass', 'psychic', 'dark'] },
            ghost: { weakTo: ['ghost', 'dark'], strongAgainst: ['psychic', 'ghost'] },
            steel: { weakTo: ['fire', 'fighting', 'ground'], strongAgainst: ['ice', 'rock', 'fairy'] },
            normal: { weakTo: ['fighting'], strongAgainst: [] }
        };

        const teamTypes = team.flatMap(pokemon => pokemon.types.map(t => t.type.name));
        const typeCount = teamTypes.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        // Calcular fraquezas comuns
        const weaknesses = Object.entries(typeCount)
            .flatMap(([type]) => typeEffectiveness[type]?.weakTo || [])
            .reduce((acc, weakness) => {
                acc[weakness] = (acc[weakness] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });

        // Calcular resistências
        const resistances = Object.entries(typeCount)
            .flatMap(([type]) => typeEffectiveness[type]?.strongAgainst || [])
            .reduce((acc, resistance) => {
                acc[resistance] = (acc[resistance] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });

        // Gerar recomendações
        const recommendations: string[] = [];
        
        const majorWeaknesses = Object.entries(weaknesses)
            .filter(([, count]) => count >= 3)
            .map(([type]) => type);

        if (majorWeaknesses.length > 0) {
            recommendations.push(`Cuidado! Seu time é muito vulnerável a ataques do tipo ${majorWeaknesses.join(', ')}.`);
        }

        const typeVariety = Object.keys(typeCount).length;
        if (typeVariety < 4) {
            recommendations.push('Considere diversificar mais os tipos do seu time para maior versatilidade.');
        }

        const avgStats = team.reduce((sum, pokemon) => {
            return sum + pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
        }, 0) / (team.length || 1);

        if (avgStats < 400) {
            recommendations.push('Considere adicionar Pokemon com stats mais altos para aumentar a força do time.');
        }

        // Calcular força geral (0-100)
        const overallStrength = Math.min(100, Math.round(
            (avgStats / 6) * 0.6 + // 60% baseado em stats
            (typeVariety / 6) * 20 + // 20% baseado em variedade
            (Object.keys(resistances).length / 10) * 20 // 20% baseado em resistências
        ));

        return {
            weaknesses: Object.keys(weaknesses),
            resistances: Object.keys(resistances),
            recommendations,
            overallStrength
        };
    }, []);

    // Exportar dados de teste
    const exportTestData = useCallback(() => {
        const stats = getStats();
        const testData = {
            metadata: {
                exportDate: new Date().toISOString(),
                testMode: isTestingMode ? 'TESTING_100' : 'NORMAL_20',
                config: {
                    populationSize: stats.populationSize,
                    elitePercentage: isTestingMode ? 0.1 : 0.2,
                    mutationRate: isTestingMode ? 0.20 : 0.15,
                    crossoverRate: isTestingMode ? 0.85 : 0.80,
                    tournamentSize: isTestingMode ? 6 : 4
                }
            },
            currentStats: {
                generation: stats.generation,
                totalBattles: stats.totalBattles,
                totalWins: stats.totalWins,
                totalLosses: stats.totalLosses,
                totalDraws: stats.totalDraws,
                winRate: stats.totalBattles > 0 ? (stats.totalWins / stats.totalBattles) : 0,
                bestFitness: stats.bestFitness,
                averageFitness: stats.averageFitness,
                diversity: stats.diversity
            },
            population: {
                genomes: population.genomes.map(g => ({
                    id: g.id,
                    fitness: g.fitness,
                    wins: g.wins,
                    losses: g.losses,
                    draws: g.draws,
                    battlesPlayed: g.battlesPlayed,
                    generation: g.generation,
                    strategyType: g.genes.strategyType,
                    statsPriority: g.genes.statsPriority,
                    typeDistribution: g.genes.typeDistribution,
                    pokemonIds: g.genes.pokemonIds
                })),
                totalGenomes: population.genomes.length
            },
            generationHistory: population.generationHistory
        };

        const blob = new Blob([JSON.stringify(testData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pokemon-genetic-test-${isTestingMode ? '100pop' : '20pop'}-gen${stats.generation}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [population, getStats, isTestingMode]);

    // Gerar time da IA usando algoritmo genético
    const generateCounterTeam = useCallback(async (playerTeam: Pokemon[]): Promise<{ team: Pokemon[], genomeId: string }> => {
        try {
            // Obter o melhor genoma da população
            const bestGenome = getBestGenome();
            
            if (!bestGenome) {
                // Fallback: gerar time aleatório
                const randomTeam = await generateRandomTeam(6);
                return { team: randomTeam, genomeId: '' };
            }

            // Construir time baseado nos genes do melhor genoma
            const counterTeam: Pokemon[] = [];
            
            for (const pokemonId of bestGenome.genes.pokemonIds) {
                try {
                    const pkNodePokemon = await pokemonApi.getPokemonById(pokemonId);
                    const pokemon = convertPokemon(pkNodePokemon);
                    counterTeam.push(pokemon);
                } catch (error) {
                    console.error(`Erro ao buscar Pokemon ${pokemonId}:`, error);
                    // Tentar um substituto aleatório
                    const randomId = Math.floor(Math.random() * 151) + 1;
                    try {
                        const pkNodePokemon = await pokemonApi.getPokemonById(randomId);
                        const pokemon = convertPokemon(pkNodePokemon);
                        counterTeam.push(pokemon);
                    } catch {
                        // Ignorar se falhar
                    }
                }
            }

            // Preencher slots restantes se necessário
            while (counterTeam.length < 6) {
                const randomId = Math.floor(Math.random() * 151) + 1;
                try {
                    const pkNodePokemon = await pokemonApi.getPokemonById(randomId);
                    const pokemon = convertPokemon(pkNodePokemon);
                    if (!counterTeam.some(p => p.id === pokemon.id)) {
                        counterTeam.push(pokemon);
                    }
                } catch (error) {
                    console.error('Erro ao preencher time da IA:', error);
                }
            }
            
            return { team: counterTeam, genomeId: bestGenome.id };
        } catch (error) {
            console.error('Erro ao gerar time da IA:', error);
            const randomTeam = await generateRandomTeam(6);
            return { team: randomTeam, genomeId: '' };
        }
    }, [getBestGenome, pokemonApi, generateRandomTeam]);

    const calculateTypeAdvantage = useCallback((attacker: Pokemon, defender: Pokemon): number => {
        const typeEffectiveness: { [key: string]: { [key: string]: number } } = {
            fire: { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
            water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
            grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
            electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
            ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
            fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
            poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
            ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
            flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
            psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
            bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
            rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
            ghost: { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
            dragon: { dragon: 2, steel: 0.5, fairy: 0 },
            dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
            steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
            fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
        };

        let multiplier = 1;
        const attackerTypes = attacker.types.map(t => t.type.name);
        const defenderTypes = defender.types.map(t => t.type.name);

        attackerTypes.forEach(atkType => {
            defenderTypes.forEach(defType => {
                if (typeEffectiveness[atkType]?.[defType]) {
                    multiplier *= typeEffectiveness[atkType][defType];
                }
            });
        });

        return multiplier;
    }, []);

    // Simular batalha individual entre dois Pokemon
    const simulateIndividualBattle = useCallback((playerPokemon: Pokemon, aiPokemon: Pokemon): IndividualBattle => {
        const playerStats = playerPokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
        const aiStats = aiPokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);

        const playerAdvantage = calculateTypeAdvantage(playerPokemon, aiPokemon);
        const aiAdvantage = calculateTypeAdvantage(aiPokemon, playerPokemon);

        const playerDamage = Math.round(playerStats * playerAdvantage * (0.8 + Math.random() * 0.4));
        const aiDamage = Math.round(aiStats * aiAdvantage * (0.8 + Math.random() * 0.4));

        const winner = playerDamage > aiDamage ? 'player' : 'ai';
        
        let typeAdvantage: 'player' | 'ai' | 'neutral' = 'neutral';
        
        const playerHasAdvantage = playerAdvantage >= 2.0;
        const aiHasAdvantage = aiAdvantage >= 2.0;
        
        if (playerHasAdvantage && !aiHasAdvantage) {
            typeAdvantage = 'player';
        } else if (aiHasAdvantage && !playerHasAdvantage) {
            typeAdvantage = 'ai';
        } else if (playerHasAdvantage && aiHasAdvantage) {
            // Ambos têm vantagem, mostrar quem tem maior
            typeAdvantage = playerAdvantage > aiAdvantage ? 'player' : 'ai';
        }
        // Se nenhum tem vantagem (ambos < 2.0), permanece neutral

        let reasoning = '';
        if (typeAdvantage === 'player') {
            reasoning = `${playerPokemon.name} tem vantagem de tipo SUPER EFETIVA (${playerAdvantage.toFixed(1)}x) sobre ${aiPokemon.name}!`;
        } else if (typeAdvantage === 'ai') {
            reasoning = `${aiPokemon.name} tem vantagem de tipo SUPER EFETIVA (${aiAdvantage.toFixed(1)}x) sobre ${playerPokemon.name}!`;
        } else if (playerAdvantage < 1.0 || aiAdvantage < 1.0) {
            // Mencionar se há resistência
            const resistantPokemon = playerAdvantage < 1.0 ? aiPokemon.name : playerPokemon.name;
            const multiplier = playerAdvantage < 1.0 ? playerAdvantage : aiAdvantage;
            reasoning = `${resistantPokemon} resiste ao ataque (${multiplier.toFixed(1)}x). Vencedor decidido por stats totais.`;
        } else {
            reasoning = `Confronto equilibrado! Ambos com dano neutro (1.0x). Vencedor decidido por stats totais.`;
        }

        return {
            playerPokemon,
            aiPokemon,
            winner,
            playerDamage,
            aiDamage,
            typeAdvantage,
            reasoning
        };
    }, [calculateTypeAdvantage]);

    // Simular batalha
    const simulateBattle = useCallback((playerTeam: Pokemon[], aiTeam: Pokemon[], genomeId: string | null): BattleResult => {
        // Simular todas as batalhas individuais
        const battles: IndividualBattle[] = [];
        let playerScore = 0;
        let aiScore = 0;

        for (let i = 0; i < Math.min(playerTeam.length, aiTeam.length); i++) {
            const battle = simulateIndividualBattle(playerTeam[i], aiTeam[i]);
            battles.push(battle);
            
            if (battle.winner === 'player') playerScore++;
            else aiScore++;
        }

        let winner: 'player' | 'ai' | 'draw';
        let analysis: string;
        
        if (playerScore === aiScore) {
            winner = 'draw';
            analysis = `Empate incrível! ${playerScore} vitórias para cada lado. Ambos os times mostraram grande força e estratégia.`;
        } else if (playerScore > aiScore) {
            winner = 'player';
            analysis = playerScore - aiScore >= 3
                ? `Vitória dominante! Você venceu ${playerScore} de ${battles.length} confrontos. Seu time demonstrou superioridade clara!`
                : `Vitória conquistada! ${playerScore} vitórias contra ${aiScore} da IA. Uma batalha acirrada, mas sua estratégia prevaleceu.`;
        } else {
            winner = 'ai';
            analysis = aiScore - playerScore >= 3
                ? `A IA dominou com ${aiScore} vitórias! Seu time precisa de ajustes estratégicos.`
                : `Derrota por ${aiScore} a ${playerScore}. Foi uma batalha próxima, você está quase lá!`;
        }

        // Registrar resultado no sistema genético
        if (genomeId) {
            const playerTypes = playerTeam.flatMap(p => p.types.map(t => t.type.name));
            const result = winner === 'ai' ? 'win' : winner === 'player' ? 'loss' : 'draw';
            recordBattle(genomeId, result, playerTypes);
        }
        
        return { playerTeam, aiTeam, winner, analysis, battles, playerScore, aiScore };
    }, [simulateIndividualBattle, recordBattle]);

    // Executar bateria de testes automatizados
    const runAutomatedTests = useCallback(async (numberOfBattles: number): Promise<{
        battleNumber: number;
        result: BattleResult;
        timestamp: number;
    }[]> => {
        setIsRunningTests(true);
        setTestProgress({ current: 0, total: numberOfBattles });
        
        const results: {
            battleNumber: number;
            result: BattleResult;
            timestamp: number;
        }[] = [];

        try {
            for (let i = 0; i < numberOfBattles; i++) {
                // Gerar time aleatório do jogador
                const randomPlayerTeam = await generateRandomTeam(6);
                
                // Gerar time da IA contra esse time
                const { team: aiCounterTeam, genomeId } = await generateCounterTeam(randomPlayerTeam);
                
                // Simular batalha (já registra o resultado internamente via recordBattle)
                const battleResult = simulateBattle(randomPlayerTeam, aiCounterTeam, genomeId);
                
                // Armazenar resultado
                results.push({
                    battleNumber: i + 1,
                    result: battleResult,
                    timestamp: Date.now()
                });

                // Atualizar progresso
                setTestProgress({ current: i + 1, total: numberOfBattles });

                // Evoluir população a cada 5 batalhas usando dados acumulados
                // A evolução usa todos os resultados registrados via recordBattle, não apenas o último time
                if ((i + 1) % 5 === 0) {
                    // Coletar tipos únicos de todos os times de jogadores testados até agora
                    const allPlayerTypes = results
                        .slice(Math.max(0, results.length - 5), results.length) // Últimas 5 batalhas
                        .flatMap(r => r.result.playerTeam.flatMap(p => p.types.map(t => t.type.name)));
                    
                    // Remover duplicatas
                    const uniquePlayerTypes = Array.from(new Set(allPlayerTypes));
                    
                    // Estatísticas antes da evolução
                    const recentWins = results.slice(-5).filter(r => r.result.winner === 'ai').length;
                    console.log(`🧬 Evolução #${Math.floor((i + 1) / 5)} - Batalhas ${i - 3}-${i + 1}: ${recentWins}/5 vitórias da IA (${(recentWins/5*100).toFixed(1)}%)`);
                    
                    evolveGeneration(uniquePlayerTypes);
                }

                // Pequeno delay para não travar a UI
                if ((i + 1) % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Evolução final consolidada com TODOS os tipos encontrados nos testes
            if (results.length > 0) {
                const allPlayerTypes = results
                    .flatMap(r => r.result.playerTeam.flatMap(p => p.types.map(t => t.type.name)));
                const uniquePlayerTypes = Array.from(new Set(allPlayerTypes));
                
                // Estatísticas finais
                const totalAiWins = results.filter(r => r.result.winner === 'ai').length;
                const finalWinRate = (totalAiWins / results.length * 100).toFixed(1);
                
                console.log(`\n🎯 EVOLUÇÃO FINAL CONSOLIDADA`);
                console.log(`📊 ${results.length} batalhas | ${totalAiWins} vitórias IA (${finalWinRate}%)`);
                console.log(`🧬 ${uniquePlayerTypes.length} tipos únicos encontrados: ${uniquePlayerTypes.slice(0, 10).join(', ')}${uniquePlayerTypes.length > 10 ? '...' : ''}`);
                
                evolveGeneration(uniquePlayerTypes);
                
                console.log(`✅ População evoluída com base em todos os resultados!\n`);
            }
        } finally {
            setIsRunningTests(false);
        }

        return results;
    }, [generateRandomTeam, generateCounterTeam, simulateBattle, evolveGeneration]);

    // Handlers dos views
    const handleStartSetup = () => setCurrentView('setup');
    const handleAnalyzeTeam = () => {
        if (playerTeam.length > 0) {
            const analysis = analyzeTeam(playerTeam);
            setTeamAnalysis(analysis);
            setCurrentView('analysis');
        }
    };
    
    const handleStartBattle = async () => {
        if (playerTeam.length > 0) {
            const { team: aiCounterTeam, genomeId } = await generateCounterTeam(playerTeam);
            setAiTeam(aiCounterTeam);
            setCurrentGenomeId(genomeId);
            const result = simulateBattle(playerTeam, aiCounterTeam, genomeId);
            setBattleResult(result);
            setCurrentView('battle');
            
            // Evoluir população a cada 5 batalhas
            const stats = getStats();
            if (stats.totalBattles % 5 === 0 && stats.totalBattles > 0) {
                const playerTypes = playerTeam.flatMap(p => p.types.map(t => t.type.name));
                evolveGeneration(playerTypes);
            }
        }
    };

    const handleBackToMenu = () => {
        setCurrentView('menu');
        setPlayerTeam([]);
        setAiTeam([]);
        setTeamAnalysis(null);
        setBattleResult(null);
    };

    // Views do componente
    const renderMenuView = () => {
        const stats = getStats();
        const winRate = stats.totalBattles > 0 
            ? ((stats.totalWins / stats.totalBattles) * 100).toFixed(1)
            : '0.0';

        return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center">
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* Pokéball Icon SVG */}
                        <svg className="w-16 h-16 animate-pulse" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="48" fill="#fff" stroke="#000" strokeWidth="2"/>
                            <path d="M 2 50 L 98 50" stroke="#000" strokeWidth="3" fill="none"/>
                            <path d="M 2 50 A 48 48 0 0 1 98 50" fill="#ef4444"/>
                            <circle cx="50" cy="50" r="15" fill="#fff" stroke="#000" strokeWidth="2"/>
                            <circle cx="50" cy="50" r="8" fill="#fff" stroke="#000" strokeWidth="2"/>
                        </svg>
                        
                        <h1 className="text-6xl font-bold text-white">
                            Pokemon Battle AI
                        </h1>
                        
                        <svg className="w-16 h-16 animate-pulse" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="48" fill="#fff" stroke="#000" strokeWidth="2"/>
                            <path d="M 2 50 L 98 50" stroke="#000" strokeWidth="3" fill="none"/>
                            <path d="M 2 50 A 48 48 0 0 1 98 50" fill="#ef4444"/>
                            <circle cx="50" cy="50" r="15" fill="#fff" stroke="#000" strokeWidth="2"/>
                            <circle cx="50" cy="50" r="8" fill="#fff" stroke="#000" strokeWidth="2"/>
                        </svg>
                    </div>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Monte seu time estratégico e enfrente uma IA com Algoritmo Genético que evolui a cada batalha!
                    </p>
                </div>

                {/* AI Stats Display */}
                {stats.totalBattles > 0 && (
                    <div className="mb-6 bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">Estatísticas Genéticas da IA</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-white">
                            <div>
                                <p className="text-sm text-gray-300">Geração</p>
                                <p className="text-2xl font-bold text-purple-400">{stats.generation}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-300">Batalhas</p>
                                <p className="text-2xl font-bold">{stats.totalBattles}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-300">Vitórias da IA</p>
                                <p className="text-2xl font-bold text-green-400">{stats.totalWins}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-300">Taxa de Vitória</p>
                                <p className="text-2xl font-bold text-yellow-400">{winRate}%</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-300">Fitness Médio</p>
                                <p className="text-2xl font-bold text-cyan-400">{stats.averageFitness.toFixed(1)}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded p-3">
                                <p className="text-sm text-gray-300 mb-1">Melhor Fitness</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                                            style={{ width: `${stats.bestFitness}%` }}
                                        />
                                    </div>
                                    <span className="text-lg font-bold text-white">{stats.bestFitness.toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded p-3">
                                <p className="text-sm text-gray-300 mb-1">Diversidade Genética</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                                            style={{ width: `${stats.diversity}%` }}
                                        />
                                    </div>
                                    <span className="text-lg font-bold text-white">{stats.diversity.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={resetPopulation}
                            className="mt-4 px-4 py-2 bg-red-500/50 hover:bg-red-600/50 text-white text-sm rounded-lg transition-colors"
                        >
                            Resetar População Genética
                        </button>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-2">Estratégia</h3>
                        <p className="text-gray-300 text-sm">
                            Escolha Pokemon com tipos complementares e stats equilibrados
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-2">IA com Algoritmo Genético</h3>
                        <p className="text-gray-300 text-sm">
                            Evolução real através de crossover, mutação e seleção natural!
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-2">Batalhas Individuais</h3>
                        <p className="text-gray-300 text-sm">
                            Veja cada confronto 1v1 com análise de tipos
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleStartSetup}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                             text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 
                             shadow-lg hover:shadow-xl mb-8"
                >
                    Começar Aventura
                </button>

                <button
                    onClick={() => setCurrentView('automated-tests')}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 
                             text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 
                             shadow-lg hover:shadow-xl"
                >
                    Bateria de Testes Automatizados
                </button>
            </div>
        </div>
        );
    };

    const renderSetupView = () => (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Monte seu Time Pokemon
                    </h1>
                    <button
                        onClick={handleBackToMenu}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Voltar ao Menu
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg">
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                    <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <div>
                                <p className="text-blue-700 dark:text-blue-300 font-semibold">
                                    Carregando Pokemon...
                                </p>
                                <p className="text-blue-600 dark:text-blue-400 text-sm">
                                    Primeira vez pode levar alguns segundos. Próximas vezes serão instantâneas!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Display */}
                <div className="mb-8">
                    <TeamDisplay
                        team={playerTeam}
                        onRemovePokemon={handleRemovePokemon}
                        title="Seu Time"
                        showRemoveButton={true}
                    />
                    
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={handleGenerateRandomTeam}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Time Aleatório
                        </button>
                        
                        <button
                            onClick={handleAnalyzeTeam}
                            disabled={playerTeam.length === 0}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors 
                                     disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Analisar Time
                        </button>
                        
                        <button
                            onClick={handleStartBattle}
                            disabled={playerTeam.length === 0}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors 
                                     disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Iniciar Batalha
                        </button>
                    </div>
                </div>

                {/* Generation Filter */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Filtrar por Geração:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => goToPage(1)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Gen 1: Kanto (1-151)
                        </button>
                        <button
                            onClick={() => goToPage(4)}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Gen 2: Johto (152-251)
                        </button>
                        <button
                            onClick={() => goToPage(6)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Gen 3: Hoenn (252-386)
                        </button>
                        <button
                            onClick={() => goToPage(9)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Gen 4: Sinnoh (387-493)
                        </button>
                        <button
                            onClick={() => goToPage(11)}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Gen 5: Unova (494-649)
                        </button>
                        <button
                            onClick={() => goToPage(14)}
                            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Gen 6: Kalos (650-721)
                        </button>
                        <button
                            onClick={() => goToPage(16)}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Gen 7: Alola (722-809)
                        </button>
                        <button
                            onClick={() => goToPage(17)}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Gen 8: Galar (810-905)
                        </button>
                    </div>
                </div>

                {/* Pokemon Grid */}
                <PokemonGrid
                    pokemon={paginatedPokemon}
                    onPokemonSelect={handlePokemonSelect}
                    selectedPokemon={playerTeam}
                    loading={loading}
                    searchTerm={searchTerm}
                    onSearchChange={searchPokemon}
                    maxSelections={6}
                />

                {/* Pagination Controls */}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed 
                                 text-white rounded-lg transition-colors font-semibold"
                    >
                        ← Anterior
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700 dark:text-gray-300">
                            Página <span className="font-bold text-blue-600 dark:text-blue-400">{currentPage}</span> de <span className="font-bold">{totalPages}</span>
                        </span>
                        
                        {/* Quick page jumps */}
                        {totalPages > 1 && (
                            <div className="flex gap-1 ml-2">
                                {[1, 2, 3, 4, 5].map(page => {
                                    if (page > totalPages) return null;
                                    const isCurrentPage = page === currentPage;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            disabled={loading}
                                            className={`w-8 h-8 rounded transition-colors ${
                                                isCurrentPage
                                                    ? 'bg-blue-600 text-white font-bold'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            } disabled:opacity-50`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && <span className="text-gray-500 px-1">...</span>}
                                {totalPages > 5 && (
                                    <button
                                        onClick={() => goToPage(totalPages)}
                                        disabled={loading || currentPage === totalPages}
                                        className={`w-8 h-8 rounded transition-colors ${
                                            currentPage === totalPages
                                                ? 'bg-blue-600 text-white font-bold'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        } disabled:opacity-50`}
                                    >
                                        {totalPages}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages || loading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed 
                                 text-white rounded-lg transition-colors font-semibold"
                    >
                        Próxima →
                    </button>
                </div>

                {/* Pokemon count info */}
                <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {paginatedPokemon.length} Pokemon (Total: até 905 Pokemon das gerações 1-8)
                </div>
            </div>
        </div>
    );

    const renderAnalysisView = () => (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Análise do Time
                    </h1>
                    <button
                        onClick={() => setCurrentView('setup')}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Voltar ao Setup
                    </button>
                </div>

                {teamAnalysis && (
                    <div className="space-y-6">
                        {/* Força Geral */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Força Geral do Time
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all"
                                        style={{ width: `${teamAnalysis.overallStrength}%` }}
                                    />
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {teamAnalysis.overallStrength}%
                                </span>
                            </div>
                        </div>

                        {/* Team Display */}
                        <TeamDisplay
                            team={playerTeam}
                            showRemoveButton={false}
                            title="Time Analisado"
                        />

                        {/* Análise Detalhada */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Fraquezas */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                                    Principais Fraquezas
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {teamAnalysis.weaknesses.map(weakness => (
                                        <span key={weakness} className="px-3 py-1 bg-red-100 dark:bg-red-900/50 
                                                                      text-red-800 dark:text-red-300 rounded-full text-sm capitalize">
                                            {weakness}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Resistências */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">
                                    ✅ Resistências
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {teamAnalysis.resistances.map(resistance => (
                                        <span key={resistance} className="px-3 py-1 bg-green-100 dark:bg-green-900/50 
                                                                        text-green-800 dark:text-green-300 rounded-full text-sm capitalize">
                                            {resistance}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recomendações */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                                Recomendações Estratégicas
                            </h3>
                            <ul className="space-y-2">
                                {teamAnalysis.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                        <span className="text-blue-500 mt-1">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setCurrentView('setup')}
                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                                Ajustar Time
                            </button>
                            <button
                                onClick={handleStartBattle}
                                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            >
                                Partir para Batalha
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderBattleView = () => (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">
                        Batalha Pokemon
                    </h1>
                    <button
                        onClick={handleBackToMenu}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        Menu Principal
                    </button>
                </div>

                {battleResult && (
                    <div className="space-y-8">
                        {/* Resultado da Batalha */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-lg p-8 border border-white/20">
                            <h2 className="text-3xl font-bold text-white mb-4">
                                {battleResult.winner === 'player' ? 'VITÓRIA!' : 
                                 battleResult.winner === 'ai' ? 'DERROTA!' : 'EMPATE!'}
                            </h2>
                            <div className="flex justify-center gap-8 mb-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-300">Você</p>
                                    <p className="text-4xl font-bold text-green-400">{battleResult.playerScore}</p>
                                </div>
                                <div className="text-5xl text-white">-</div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-300">IA</p>
                                    <p className="text-4xl font-bold text-red-400">{battleResult.aiScore}</p>
                                </div>
                            </div>
                            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
                                {battleResult.analysis}
                            </p>
                        </div>

                        {/* Individual Battles Section */}
                        <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                Confrontos Individuais
                            </h2>
                            <div className="space-y-4">
                                {battleResult.battles.map((battle, index) => (
                                    <BattleMatchup key={index} battle={battle} index={index} />
                                ))}
                            </div>
                        </div>

                        {/* Times da Batalha */}
                        <div className="grid lg:grid-cols-2 gap-8">
                            <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
                                <h2 className="text-2xl font-bold text-white mb-4">Seu Time</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {battleResult.playerTeam.map((pokemon, index) => (
                                        <div
                                            key={pokemon.id}
                                            className="relative bg-white/10 backdrop-blur rounded-lg shadow-md border border-white/20 p-3 
                                                     hover:shadow-lg transition-all duration-200"
                                        >
                                            {/* Número da Posição */}
                                            <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-5 h-5 
                                                          flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </div>

                                            {/* Imagem do Pokemon */}
                                            <div className="flex justify-center mb-2 pt-3">
                                                <img
                                                    src={pokemon.sprites?.other?.['official-artwork']?.front_default || 
                                                         'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI0VFRSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0iI0ZGRiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48L3N2Zz4='}
                                                    alt={pokemon.name}
                                                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        const paddedId = String(pokemon.id).padStart(3, '0');
                                                        const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI0VFRSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0iI0ZGRiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48L3N2Zz4=';
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
                                            <h3 className="text-center font-medium text-white mb-2 capitalize text-xs sm:text-sm truncate px-1">
                                                {pokemon.name}
                                            </h3>

                                            {/* Tipos */}
                                            <div className="flex justify-center gap-1 mb-2 flex-wrap">
                                                {pokemon.types.map((type, typeIndex) => {
                                                    const typeColors: { [key: string]: string } = {
                                                        normal: 'bg-gray-400', fire: 'bg-red-500', water: 'bg-blue-500',
                                                        electric: 'bg-yellow-400', grass: 'bg-green-500', ice: 'bg-blue-200',
                                                        fighting: 'bg-red-700', poison: 'bg-purple-500', ground: 'bg-yellow-600',
                                                        flying: 'bg-indigo-400', psychic: 'bg-pink-500', bug: 'bg-green-400',
                                                        rock: 'bg-yellow-800', ghost: 'bg-purple-700', dragon: 'bg-indigo-700',
                                                        dark: 'bg-gray-800', steel: 'bg-gray-500', fairy: 'bg-pink-300'
                                                    };
                                                    return (
                                                        <span
                                                            key={typeIndex}
                                                            className={`px-2 py-0.5 rounded-full text-xs font-medium text-white capitalize
                                                                      ${typeColors[type.type.name] || 'bg-gray-500'}`}
                                                        >
                                                            {type.type.name}
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            {/* Stats Resumidos */}
                                            <div className="space-y-0.5">
                                                {['hp', 'attack', 'defense'].map((statName) => {
                                                    const stat = pokemon.stats.find(s => s.stat.name === statName);
                                                    const value = stat?.base_stat || 0;
                                                    const label = statName === 'hp' ? 'HP' : 
                                                                statName === 'attack' ? 'ATK' : 'DEF';
                                                    
                                                    return (
                                                        <div key={statName} className="flex justify-between items-center text-[10px] sm:text-xs">
                                                            <span className="text-gray-300 min-w-[28px]">
                                                                {label}
                                                            </span>
                                                            <div className="flex items-center gap-1 flex-1 ml-1">
                                                                <div className="flex-1 max-w-[50px] bg-white/20 rounded-full h-1">
                                                                    <div
                                                                        className="bg-blue-400 h-1 rounded-full"
                                                                        style={{ width: `${Math.min(100, (value / 200) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-white w-7 text-right font-medium">
                                                                    {value}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
                                <h2 className="text-2xl font-bold text-white mb-4">Time da IA</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {battleResult.aiTeam.map((pokemon, index) => (
                                        <div
                                            key={pokemon.id}
                                            className="relative bg-white/10 backdrop-blur rounded-lg shadow-md border border-white/20 p-3 
                                                     hover:shadow-lg transition-all duration-200"
                                        >
                                            {/* Número da Posição */}
                                            <div className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-5 h-5 
                                                          flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </div>

                                            {/* Imagem do Pokemon */}
                                            <div className="flex justify-center mb-2 pt-3">
                                                <img
                                                    src={pokemon.sprites?.other?.['official-artwork']?.front_default || 
                                                         'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI0VFRSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0iI0ZGRiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48L3N2Zz4='}
                                                    alt={pokemon.name}
                                                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        const paddedId = String(pokemon.id).padStart(3, '0');
                                                        const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI0VFRSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0iI0ZGRiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48L3N2Zz4=';
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
                                            <h3 className="text-center font-medium text-white mb-2 capitalize text-xs sm:text-sm truncate px-1">
                                                {pokemon.name}
                                            </h3>

                                            {/* Tipos */}
                                            <div className="flex justify-center gap-1 mb-2 flex-wrap">
                                                {pokemon.types.map((type, typeIndex) => {
                                                    const typeColors: { [key: string]: string } = {
                                                        normal: 'bg-gray-400', fire: 'bg-red-500', water: 'bg-blue-500',
                                                        electric: 'bg-yellow-400', grass: 'bg-green-500', ice: 'bg-blue-200',
                                                        fighting: 'bg-red-700', poison: 'bg-purple-500', ground: 'bg-yellow-600',
                                                        flying: 'bg-indigo-400', psychic: 'bg-pink-500', bug: 'bg-green-400',
                                                        rock: 'bg-yellow-800', ghost: 'bg-purple-700', dragon: 'bg-indigo-700',
                                                        dark: 'bg-gray-800', steel: 'bg-gray-500', fairy: 'bg-pink-300'
                                                    };
                                                    return (
                                                        <span
                                                            key={typeIndex}
                                                            className={`px-2 py-0.5 rounded-full text-xs font-medium text-white capitalize
                                                                      ${typeColors[type.type.name] || 'bg-gray-500'}`}
                                                        >
                                                            {type.type.name}
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            {/* Stats Resumidos */}
                                            <div className="space-y-0.5">
                                                {['hp', 'attack', 'defense'].map((statName) => {
                                                    const stat = pokemon.stats.find(s => s.stat.name === statName);
                                                    const value = stat?.base_stat || 0;
                                                    const label = statName === 'hp' ? 'HP' : 
                                                                statName === 'attack' ? 'ATK' : 'DEF';
                                                    
                                                    return (
                                                        <div key={statName} className="flex justify-between items-center text-[10px] sm:text-xs">
                                                            <span className="text-gray-300 min-w-[28px]">
                                                                {label}
                                                            </span>
                                                            <div className="flex items-center gap-1 flex-1 ml-1">
                                                                <div className="flex-1 max-w-[50px] bg-white/20 rounded-full h-1">
                                                                    <div
                                                                        className="bg-red-400 h-1 rounded-full"
                                                                        style={{ width: `${Math.min(100, (value / 200) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-white w-7 text-right font-medium">
                                                                    {value}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleBackToMenu}
                                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                                         text-white font-bold rounded-full text-lg transition-all transform hover:scale-105"
                            >
                                Nova Batalha
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Render principal baseado na view atual
    const renderAutomatedTestsView = () => (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="mb-6 flex justify-between items-center max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    🧪 Testes Automatizados
                </h1>
                <button
                    onClick={() => setCurrentView('menu')}
                    disabled={isRunningTests}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 
                             text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                    Voltar ao Menu
                </button>
            </div>

            <AutomatedTestBattery
                onRunTests={runAutomatedTests}
                isRunning={isRunningTests}
                progress={testProgress}
            />
        </div>
    );

    switch (currentView) {
        case 'setup': return renderSetupView();
        case 'analysis': return renderAnalysisView();
        case 'battle': return renderBattleView();
        case 'automated-tests': return renderAutomatedTestsView();
        default: return renderMenuView();
    }
}