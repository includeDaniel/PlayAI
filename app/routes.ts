import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/Home.tsx"), route("/games/flappy-bird-js", "games/flappy-bird-js/componentes/Page.tsx")] satisfies RouteConfig;
