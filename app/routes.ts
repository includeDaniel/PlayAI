import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/Home.tsx"),
    route("pythonFlappyBird", "games/PythonFlappyBird.tsx"),
    route("/games/pokemon", "games/pokemon/PokemonBattleAI.tsx"),
    route("/games/physics", "games/Game.tsx"),
    route("/games/pong-game-js", "games/pong-game-js/page.tsx"),
    route("/games/flappy-bird-js", "games/flappy-bird-js/componentes/Page.tsx")
] satisfies RouteConfig;
