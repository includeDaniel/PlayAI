import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/Home.tsx"), route("/games/flappy-bird-js", "games/flappy-bird-js/Page.tsx"), route("/games/pong-game-js", "games/pong-game-js/Page.tsx") ] satisfies RouteConfig;
