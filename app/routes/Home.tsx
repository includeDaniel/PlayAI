import { Link } from "react-router-dom";
import "./Home.css";

type GameLink = {
    name: string;
    description: string;
    image: string;
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
        name: "Physics Sandbox",
        description: "Experimente a física com bolas e colisões!",
        image: "",
        url: "/game",
    },
    {
        name: "Pong AI",
        description: "Jogue Pong contra uma IA desafiadora!",
        image: "app/games/pong-game-js/pong-icon.png",
        url: "/games/pong-game-js",
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
                            <img src={game.image} alt={game.name} className="game-image" />
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