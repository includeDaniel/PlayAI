import type { IndividualBattle } from '../types/pokemon';

interface BattleMatchupProps {
    battle: IndividualBattle;
    index: number;
}

const TYPE_COLORS: { [key: string]: string } = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
};

export function BattleMatchup({ battle, index }: BattleMatchupProps) {
    const { playerPokemon, aiPokemon, winner, playerDamage, aiDamage, typeAdvantage, reasoning } = battle;

    const getAdvantageIcon = () => {
        if (typeAdvantage === 'player') return '→';
        if (typeAdvantage === 'ai') return '←';
        return '⚔';
    };

    const getAdvantageColor = () => {
        if (typeAdvantage === 'player') return 'text-green-500';
        if (typeAdvantage === 'ai') return 'text-red-500';
        return 'text-yellow-500';
    };

    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Batalha {index + 1}</h3>
                <span className={`text-2xl font-bold ${getAdvantageColor()}`}>
                    {getAdvantageIcon()}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center mb-4">
                {/* Player Pokemon */}
                <div className={`text-center p-3 rounded-lg ${winner === 'player' ? 'bg-green-500/20 border-2 border-green-500' : 'bg-white/5'}`}>
                    <img
                        src={playerPokemon.sprites?.other?.['official-artwork']?.front_default || playerPokemon.sprites.front_default}
                        alt={playerPokemon.name}
                        className="w-20 h-20 mx-auto"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const paddedId = String(playerPokemon.id).padStart(3, '0');
                            const serebiiUrl = `https://www.serebii.net/pokemon/art/${paddedId}.png`;
                            
                            if (!target.src.includes('serebii')) {
                                target.src = serebiiUrl;
                            }
                        }}
                    />
                    <p className="font-bold text-white capitalize mt-2">{playerPokemon.name}</p>
                    <div className="flex gap-1 justify-center mt-1">
                        {playerPokemon.types.map(type => (
                            <span
                                key={type.type.name}
                                className="text-xs px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: TYPE_COLORS[type.type.name] }}
                            >
                                {type.type.name}
                            </span>
                        ))}
                    </div>
                    <p className="text-sm text-yellow-400 mt-2">Dano: {playerDamage}</p>
                </div>

                {/* VS Divider */}
                <div className="text-center">
                    <p className="text-2xl font-bold text-white">VS</p>
                </div>

                {/* AI Pokemon */}
                <div className={`text-center p-3 rounded-lg ${winner === 'ai' ? 'bg-red-500/20 border-2 border-red-500' : 'bg-white/5'}`}>
                    <img
                        src={aiPokemon.sprites?.other?.['official-artwork']?.front_default || aiPokemon.sprites.front_default}
                        alt={aiPokemon.name}
                        className="w-20 h-20 mx-auto"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const paddedId = String(aiPokemon.id).padStart(3, '0');
                            const serebiiUrl = `https://www.serebii.net/pokemon/art/${paddedId}.png`;
                            
                            if (!target.src.includes('serebii')) {
                                target.src = serebiiUrl;
                            }
                        }}
                    />
                    <p className="font-bold text-white capitalize mt-2">{aiPokemon.name}</p>
                    <div className="flex gap-1 justify-center mt-1">
                        {aiPokemon.types.map(type => (
                            <span
                                key={type.type.name}
                                className="text-xs px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: TYPE_COLORS[type.type.name] }}
                            >
                                {type.type.name}
                            </span>
                        ))}
                    </div>
                    <p className="text-sm text-yellow-400 mt-2">Dano: {aiDamage}</p>
                </div>
            </div>

            {/* Reasoning */}
            <div className="bg-white/5 rounded p-3">
                <p className="text-sm text-gray-300">
                    <span className="font-bold text-white">Análise: </span>
                    {reasoning}
                </p>
            </div>
        </div>
    );
}
