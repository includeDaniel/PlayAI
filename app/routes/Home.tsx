import type { Route } from "./+types/Home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "PlayAI - Jogos com Inteligência Artificial" },
        { name: "description", content: "Explore jogos inovadores que utilizam inteligência artificial para criar experiências únicas e desafiadoras." },
    ];
}

export default function Home() {
    const games = [
        {
            id: 'flappybird',
            title: 'Flappy Bird AI',
            description: 'Uma IA em Python que aprende a jogar Flappy Bird sozinha usando aprendizado por reforço!',
            image: '/PythonFlappyBird/FlappyBirdIcon.png',
            gradient: 'from-yellow-500 to-orange-600',
            route: '/pythonFlappyBird',
            tags: ['Python', 'IA', 'Aprendizado']
        },
        {
            id: 'pokemon',
            title: 'Pokemon Battle AI',
            description: 'Monte seu time estratégico e enfrente uma IA que analisa suas fraquezas para criar o contra-ataque perfeito!',
            image: '/Pokemon/PokemonIcon.svg',
            gradient: 'from-blue-500 to-purple-600',
            route: '/games/pokemon',
            tags: ['Estratégia', 'Pokemon', 'IA Adaptativa']
        },
        {
            id: 'physics',
            title: 'Physics Playground',
            description: 'Experimente com simulações físicas interativas usando Matter.js e PIXI.js para criar mundos dinâmicos.',
            icon: '🌟',
            gradient: 'from-purple-500 to-pink-500',
            route: '/games/physics',
            tags: ['Física', 'Simulação', 'Interativo']
        },
        {
            id: 'pong',
            title: 'Pong AI',
            description: 'Jogue Pong contra uma IA desafiadora que se adapta ao seu estilo de jogo!',
            icon: '🏓',
            gradient: 'from-green-500 to-teal-600',
            route: '/games/pong-game-js',
            tags: ['Clássico', 'IA', 'Arcade']
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
                <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-pulse">
                            🎮 <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">PlayAI</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
                            Explore o futuro dos jogos com <strong className="text-blue-400">Inteligência Artificial</strong>. 
                            Cada jogo oferece uma experiência única onde a IA não apenas desafia, mas aprende e evolui.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                            <span className="bg-white/10 px-3 py-1 rounded-full">React Router v7</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full">TypeScript</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full">TailwindCSS v4</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full">PIXI.js</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full">Matter.js</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Games Grid */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Escolha sua Aventura
                    </h2>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        Cada jogo representa uma abordagem única da inteligência artificial aplicada ao entretenimento
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {games.map((game) => (
                        <Link
                            key={game.id}
                            to={game.route}
                            className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 
                                     hover:bg-white/20 hover:border-white/30 transition-all duration-300 
                                     transform hover:-translate-y-2 hover:shadow-2xl"
                        >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 
                                           group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                            
                            {/* Content */}
                            <div className="relative z-10">
                                {/* Icon or Image */}
                                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                    {game.image ? (
                                        <img 
                                            src={game.image} 
                                            alt={game.title}
                                            className="w-20 h-20 object-contain"
                                        />
                                    ) : (
                                        <div className="text-5xl">{game.icon}</div>
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                                    {game.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-300 text-sm leading-relaxed mb-4 group-hover:text-gray-200 transition-colors">
                                    {game.description}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {game.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="text-xs bg-white/20 text-gray-300 px-2 py-1 rounded-full 
                                                     group-hover:bg-white/30 group-hover:text-white transition-colors"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Play Button */}
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                                        Jogar Agora
                                    </span>
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center 
                                                  group-hover:bg-blue-400 group-hover:scale-110 transition-all duration-300">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Hover Effect Border */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 
                                          group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 
                                          transition-all duration-300 pointer-events-none"></div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm">
                            PlayAI © 2025 - Explorando as possibilidades da Inteligência Artificial através de jogos interativos
                        </p>
                        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
                            <span>Desenvolvido com React Router v7</span>
                            <span>•</span>
                            <span>Alimentado por PokeAPI</span>
                            <span>•</span>
                            <span>Física por Matter.js</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
