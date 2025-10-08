import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/Home.tsx"), route("/games/flappy", "games/flappy-bird-js/Game.tsx")] satisfies RouteConfig;
