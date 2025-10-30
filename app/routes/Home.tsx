import type { Route } from "./+types/Home";
import { Link } from "react-router";
import "./Home.css";

import flappyBird from "../games/flappy-bird-js/assets/blue-bird.png";
import snakeIcon from "../games/snake-game/rato.png";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "GameHub - Jogos com Inteligência Artificial" },
        {
            name: "description",
            content: "Combinando Jogos com Inteligência Artificial",
        },
    ];
}

type GameLink = {
    name: string;
    description: string;
    image: string;
    icon?: string; // Emoji fallback quando não houver imagem
    url: string;
};

// Cards para links dos jogos
const games: GameLink[] = [
    {
        name: "Flappy Bird AI",
        description:
            "Uma IA em Python que aprende a jogar Flappy Bird sozinha!",
        image: "/PythonFlappyBird/FlappyBirdIcon.png",
        url: "/games/pythonFlappyBird",
    },
    {
        name: "Pokemon Battle AI",
        description:
            "Monte seu time e enfrente uma IA que evolui suas estratégias!",
        image: "/Pokemon/PokemonIcon.svg",
        url: "/games/pokemon",
    },
    {
        name: "Pong AI",
        description: "Jogue Pong contra uma IA desafiadora!",
        image: "/PongGame/pong-icon.png",
        url: "/games/pong-game-js",
    },
    {
        name: "Flappy Bird",
        description:
            "Um agente de Flappy Bird usando Perceptron e Algoritmo Genético",
        image: flappyBird,
        url: "/games/flappy-bird-js",
    },
    {
        name: "Pac Man",
        description:
            "Jogue Pac Man com fantasmas controlados por IA ou veja um algoritmo de IA contra outros!",
        image: "/PacMan/Pacman.png",
        url: "/games/pacman",
    },
    {
        name: "Snake AI",
        description:
            "Demonstração de Snake com planejamento de rotas A* e IA que encontra a maçã.",
        image: snakeIcon,
        url: "/games/snake-game",
    },
];

export default function Home() {
    return (
        <div className="landing-container">
            <header className="hero">
                <h1 className="title">🎮 GameHub</h1>
                <p className="subtitle">
                    Combinando Jogos com Inteligência Artificial
                </p>
                <p className="subtitle">Escolha um jogo e divirta-se!</p>
            </header>

            <main className="games-grid">
                {games.map((game) => (
                    <Link key={game.name} to={game.url} className="game-card">
                        <div className="image-container">
                            {game.image ? (
                                <img
                                    src={game.image}
                                    alt={game.name}
                                    className="game-image"
                                />
                            ) : (
                                <div className="placeholder-icon">
                                    {game.icon || "🎮"}
                                </div>
                            )}
                        </div>
                        <h2>{game.name}</h2>
                        <p>{game.description}</p>
                    </Link>
                ))}
            </main>

            <footer className="footer">
                <p>
                    © {new Date().getFullYear()} GameHub — Trabalho prático de
                    Inteligência Artificial
                </p>
            </footer>
        </div>
    );
}
