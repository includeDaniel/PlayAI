import React, { useState } from 'react';
import type { BattleResult } from '../types/pokemon';

interface TestResult {
    battleNumber: number;
    result: BattleResult;
    timestamp: number;
}

interface AutomatedTestBatteryProps {
    onRunTests: (numberOfBattles: number) => Promise<TestResult[]>;
    isRunning: boolean;
    progress: { current: number; total: number };
}

export function AutomatedTestBattery({ onRunTests, isRunning, progress }: AutomatedTestBatteryProps) {
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [expandedBattle, setExpandedBattle] = useState<number | null>(null);
    const [numberOfBattles, setNumberOfBattles] = useState<number>(100);

    const handleRunTests = async () => {
        const results = await onRunTests(numberOfBattles);
        setTestResults(results);
    };

    const toggleBattle = (battleNumber: number) => {
        setExpandedBattle(expandedBattle === battleNumber ? null : battleNumber);
    };

    const getStats = () => {
        if (testResults.length === 0) return null;

        const playerWins = testResults.filter(r => r.result.winner === 'player').length;
        const aiWins = testResults.filter(r => r.result.winner === 'ai').length;
        const draws = testResults.filter(r => r.result.winner === 'draw').length;

        return {
            total: testResults.length,
            playerWins,
            aiWins,
            draws,
            playerWinRate: ((playerWins / testResults.length) * 100).toFixed(1),
            aiWinRate: ((aiWins / testResults.length) * 100).toFixed(1)
        };
    };

    const stats = getStats();

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Bateria de Testes Automatizados
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Execute múltiplas batalhas automáticas para testar a evolução da IA genética
                </p>

                <div className="flex gap-4 items-end mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número de Batalhas:
                        </label>
                        <input
                            type="number"
                            min="10"
                            max="500"
                            value={numberOfBattles}
                            onChange={(e) => setNumberOfBattles(parseInt(e.target.value) || 100)}
                            disabled={isRunning}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <button
                        onClick={handleRunTests}
                        disabled={isRunning}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                                 text-white rounded-lg font-semibold transition-colors
                                 disabled:cursor-not-allowed"
                    >
                        {isRunning ? 'Executando...' : 'Iniciar Testes'}
                    </button>

                    {testResults.length > 0 && (
                        <button
                            onClick={() => setTestResults([])}
                            disabled={isRunning}
                            className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 
                                     text-white rounded-lg font-semibold transition-colors
                                     disabled:cursor-not-allowed"
                        >
                            Limpar Resultados
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                {isRunning && (
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span>Progresso:</span>
                            <span>{progress.current} / {progress.total} batalhas</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div
                                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Statistics Summary */}
            {stats && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Estatísticas Gerais
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Batalhas</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Vitórias Jogador</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.playerWins}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{stats.playerWinRate}%</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Vitórias IA</p>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.aiWins}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{stats.aiWinRate}%</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Empates</p>
                            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draws}</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Vantagem IA</p>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {stats.aiWins > stats.playerWins ? '+' : '-'}
                                {Math.abs(stats.aiWins - stats.playerWins)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Battle Results List */}
            {testResults.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Resultados Detalhados ({testResults.length} batalhas)
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {testResults.map((test) => (
                            <div key={test.battleNumber} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                {/* Battle Header */}
                                <button
                                    onClick={() => toggleBattle(test.battleNumber)}
                                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg ${
                                        test.result.winner === 'player' 
                                            ? 'bg-green-50 dark:bg-green-900/20' 
                                            : test.result.winner === 'ai'
                                            ? 'bg-red-50 dark:bg-red-900/20'
                                            : 'bg-yellow-50 dark:bg-yellow-900/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                            #{test.battleNumber}
                                        </span>
                                        <span className={`font-semibold ${
                                            test.result.winner === 'player'
                                                ? 'text-green-600 dark:text-green-400'
                                                : test.result.winner === 'ai'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-yellow-600 dark:text-yellow-400'
                                        }`}>
                                            {test.result.winner === 'player' ? '🏆 Vitória Jogador' : 
                                             test.result.winner === 'ai' ? '🤖 Vitória IA' : 
                                             '🤝 Empate'}
                                        </span>
                                    </div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {expandedBattle === test.battleNumber ? '▼' : '▶'}
                                    </span>
                                </button>

                                {/* Battle Details (Expanded) */}
                                {expandedBattle === test.battleNumber && (
                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            {test.result.analysis}
                                        </p>

                                        {/* Individual Matchups */}
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Confrontos Individuais:
                                            </h4>
                                            {test.result.battles.map((battle, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg border ${
                                                        battle.winner === 'player'
                                                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                                                {battle.playerPokemon.name}
                                                            </p>
                                                            <div className="flex gap-1 mt-1">
                                                                {battle.playerPokemon.types.map((type) => (
                                                                    <span
                                                                        key={type.type.name}
                                                                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded capitalize"
                                                                    >
                                                                        {type.type.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="px-4 text-center">
                                                            <span className={`text-2xl font-bold ${
                                                                battle.winner === 'player'
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                VS
                                                            </span>
                                                        </div>

                                                        <div className="flex-1 text-right">
                                                            <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                                                {battle.aiPokemon.name}
                                                            </p>
                                                            <div className="flex gap-1 mt-1 justify-end">
                                                                {battle.aiPokemon.types.map((type) => (
                                                                    <span
                                                                        key={type.type.name}
                                                                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded capitalize"
                                                                    >
                                                                        {type.type.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                                                        {battle.reasoning}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
