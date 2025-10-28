import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/Home.tsx"),
    route("pythonFlappyBird", "games/PythonFlappyBird.tsx"),
    route("game", "games/Game.tsx"),
    route("/games/pong-game-js", "games/pong-game-js/page.tsx")
] satisfies RouteConfig;
