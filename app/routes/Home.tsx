import type { Route } from "./+types/Home";
import { Link } from "react-router";
import "./Home.css";

import flappyBird from "../games/flappy-bird-js/assets/blue-bird.png";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "GameHub - Jogos com Inteligência Artificial" },
        { name: "description", content: "Combinando Jogos com Inteligência Artificial" },
    ];
}

type GameLink = {
    name: string;
    description: string;
    image: string;
    icon?: string;  // Emoji fallback quando não houver imagem
    url: string;
};

// Cards para links dos jogos
const games: GameLink[] = [
    {
        name: "Flappy Bird AI",
        description: "Uma IA em Python que aprende a jogar Flappy Bird sozinha!",
        image: "/PythonFlappyBird/FlappyBirdIcon.png",
        url: "/pythonFlappyBird",
    },
    {
        name: "Pokemon Battle AI",
        description: "Monte seu time e enfrente uma IA que evolui suas estratégias!",
        image: "/Pokemon/PokemonIcon.svg",
        url: "/games/pokemon",
    },
    {
        name: "Physics Sandbox",
        description: "Experimente a física com bolas e colisões!",
        image: "",
        icon: "🌟",
        url: "/games/physics",
    },
    {
        name: "Pong AI",
        description: "Jogue Pong contra uma IA desafiadora!",
        image: "app/games/pong-game-js/pong-icon.png",
        url: "/games/pong-game-js",
    },
        {
        name: "Flappy Bird",
        description: "Um agente de Flappy Bird usando Perceptron e Algoritmo Genético",
        image: flappyBird,
        url: "/games/flappy-bird-js",
    },
];

export default function Home() {
    return (
        <div className="landing-container">
            <header className="hero">
                <h1 className="title">🎮 GameHub</h1>
                <p className="subtitle">Combinando Jogos com Inteligência Artificial</p>
                <p className="subtitle">Escolha um jogo e divirta-se!</p>
            </header>

            <main className="games-grid">
                {games.map((game) => (
                    <Link key={game.name} to={game.url} className="game-card">
                        <div className="image-container">
                            {game.image ? (
                                <img src={game.image} alt={game.name} className="game-image" />
                            ) : (
                                <div className="placeholder-icon">{game.icon || "🎮"}</div>
                            )}
                        </div>
                        <h2>{game.name}</h2>
                        <p>{game.description}</p>
                    </Link>
                ))}
            </main>

            <footer className="footer">
                <p>
                    © {new Date().getFullYear()} GameHub — Trabalho prático de Inteligência Artificial
                </p>
            </footer>
        </div>
    );
}
