# PlayAI Pac‑Man (React + TypeScript)

This project started from the React Router full‑stack template and evolved into an experimental Pac‑Man clone featuring:

- Authentic ghost behaviors (scatter, chase, frightened, eyes) with personalities (Blinky, Pinky, Inky, Clyde)
- Internal adaptive ghost difficulty that subtly adjusts prediction and randomness as you advance
- Deterministic pellet generation with automatic removal of unreachable pellets
- Multi‑map level rotation
- Optional Pac‑Man AI Mode ("IA") where an adaptive algorithm takes control and learns over lives and levels
- Canvas rendering loop with smooth movement & mouth animation
- Fully in TypeScript with modular architecture (ghostAI, pacAI, learning, types, map, logic, render)

> The original template documentation is kept below for deployment & tooling reference.

## Gameplay & Controls

- Arrow keys: Manual Pac‑Man movement.
- R: Restart after game over (resets lives & level; keeps learned AI parameters unless you clear storage).
- IA Mode Button (🤖): Toggles autonomous Pac‑Man. When enabled, keyboard direction inputs are ignored except restart.

## Pac‑Man AI Mode (IA)

When you toggle IA mode:

1. Each life starts with a fresh life metrics record (pellets, power pellets, time, deaths).
2. At intersections near the center of a cell, the AI scores possible directions using factors:
    - Pellet density and power pellet proximity (pelletFocus + aggression)
    - Ghost avoidance radius (avoidance)
    - Exploration/randomness (exploration)
3. On death or level completion the life performance score adjusts four parameters: `aggression`, `exploration`, `pelletFocus`, `avoidance` (clamped 0–1). These persist across sessions.

Persistence key in `localStorage`:

```
pacman_ai_params_v1
```

Delete that key (or use DevTools > Application > Local Storage) to reset learned Pac‑Man AI back to defaults.

## Ghost Adaptive Difficulty

Ghost parameters (prediction horizon, chase weight, scatter factor, randomness) are internally adjusted after levels based on player performance. No UI panel is shown—adaptation is silent to keep the interface clean.

## Project Scripts

Standard Vite + React Router setup still applies:

- � Server-side rendering
- ⚡️ HMR during development
- 📦 Optimized production build
- 🔒 TypeScript by default
- 🎉 TailwindCSS (baseline; you can layer custom CSS)
- 📖 React Router for routing & data loading

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router + a dash of retro arcade AI.

## Troubleshooting

| Issue                               | What to Try                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| Pac‑Man AI seems too strong or weak | Clear `pacman_ai_params_v1` in localStorage to reset learning.                                  |
| IA button not visible               | Ensure you're on the main game screen (`Game.tsx` rendered) and build assets updated.           |
| Pellets appear unreachable          | BFS sanitation should remove them; press R to rebuild level. If persists, clear cache & reload. |
| Ghosts feel static                  | Progress a few levels; adaptation increments after each completion.                             |

## Next Ideas (Not Implemented Yet)

- Parameter sliders to manually tune Pac‑Man AI
- Replay or visualization of AI decisions
- Difficulty presets (Casual / Classic / Hardcore)
- Analytics export for longer training sessions

Feel free to fork and experiment!
