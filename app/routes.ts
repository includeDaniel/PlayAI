import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/Home.tsx"),
    route("pythonFlappyBird", "games/PythonFlappyBird.tsx"),
    route("game", "games/Game.tsx"),
] satisfies RouteConfig;
