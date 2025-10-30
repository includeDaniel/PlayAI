import React, { useEffect, useState } from 'react';
import './styles.css';

// We import p5 from the npm package and expose it to window so existing script files
// that expect a global `p5` will work without refactoring.
import p5 from 'p5';

const SnakeGame: React.FC = () => {
  const [running, setRunning] = useState(true);
  useEffect(() => {
    // expose p5 globally for the legacy scripts
    (window as any).p5 = p5;

    const scripts = [
      new URL('./snake.js', import.meta.url).href,
      new URL('./apple.js', import.meta.url).href,
      new URL('./search.js', import.meta.url).href,
      new URL('./sketch.js', import.meta.url).href,
    ];

    const appended: HTMLScriptElement[] = [];

    const loadSequential = async () => {
      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          // Use classic script so the loaded files execute in global scope and can
          // access `window.p5` and other globals.
          s.type = 'text/javascript';
          s.src = src;
          s.async = false;
          s.onload = () => resolve();
          s.onerror = (e) => reject(e);
          document.body.appendChild(s);
          appended.push(s);
        });
      }
    };

    loadSequential().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Erro ao carregar scripts do SnakeGame:', err);
    });

    return () => {
      // Remove appended scripts on unmount to avoid duplicate registrations if component is remounted
      appended.forEach((s) => s.parentNode?.removeChild(s));
      // Optionally cleanup global p5 if you want
      try {
        delete (window as any).p5;
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const toggleRunning = () => {
    const w = window as any;
    try {
      if (running) {
        // Try global noLoop first (p5 global mode)
        if (typeof w.noLoop === 'function') w.noLoop();
        // Fallback to instance if available
        else if (w.p5 && w.p5.instance && typeof w.p5.instance.noLoop === 'function') w.p5.instance.noLoop();
      } else {
        if (typeof w.loop === 'function') w.loop();
        else if (w.p5 && w.p5.instance && typeof w.p5.instance.loop === 'function') w.p5.instance.loop();
      }
      setRunning(!running);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Erro ao alternar execução do p5:', e);
    }
  };

  const resetGame = () => {
    // Simple reset: reload the page to re-run the legacy scripts and reset state
    window.location.reload();
  };
  return (
    <div className="container snake-game-root">
      <div className="snake-controls" style={{ marginBottom: 12 }}>
        <button onClick={toggleRunning} style={{ marginRight: 8 }}>
          {running ? 'Pausar' : 'Continuar'}
        </button>
        <button onClick={resetGame}>Reiniciar</button>
      </div>
      <h1> Snake Game IA </h1>

      <div id="gameContainer"></div>

      <div className="explanation">
        <h2>Como Funciona o Jogo</h2>
        <p>
          Este não é um jogo comum de Snake - é uma demonstração de Inteligência Artificial em ação!
          A cobra utiliza um algoritmo de pathfinding chamado A* (A-Star) para encontrar sempre o caminho
          mais eficiente até a maçã, evitando colisões com seu próprio corpo.
        </p>

        <h2>Implementação Detalhada</h2>

        <h3>1. Movimento da Cobra</h3>
        <p>
          A cobra é implementada como uma lista de posições no tabuleiro, onde cada posição é um vetor com
          coordenadas x e y. O movimento é controlado através da atualização dessas posições:
        </p>
        <div className="code-block">
          <pre>
            <code>{`class Snake {
    constructor() {
        this.body = [];
        // A cobra começa com comprimento 3 no canto superior esquerdo
        for (let i = 0; i < 3; i++) {
            this.body[i] = createVector(i, 0);
        }
        this.x_dir = 1;
        this.y_dir = 0;
    }`}</code>
          </pre>
        </div>

        <h3>2. Sistema de Colisões</h3>
        <p>O jogo implementa três tipos de verificações de colisão:</p>
        <ul>
          <li>Colisão com as paredes do tabuleiro</li>
          <li>Colisão com o próprio corpo da cobra</li>
          <li>Colisão (coleta) com a maçã</li>
        </ul>
        <div className="code-block">
          <pre>
            <code>{`// Exemplo de verificação de colisão com parede
if (this.getHeadPosition().x == 39 && this.x_dir == 1) {
    noLoop();
    console.log("Colisão com a parede");
}`}</code>
          </pre>
        </div>

        <h3>3. O Algoritmo A* (A-Star)</h3>
        <p>O algoritmo A* é implementado usando três componentes principais:</p>
        <ul>
          <li><strong>g-score:</strong> Custo do caminho do início até o nó atual</li>
          <li>
            <strong>h-score (heurística):</strong> Estimativa do custo do nó atual até o objetivo usando distância
            Manhattan
          </li>
          <li><strong>f-score:</strong> Soma de g-score e h-score, usado para decidir qual nó explorar</li>
        </ul>
        <div className="code-block">
          <pre>
            <code>{`// Cálculo dos scores no algoritmo A*
filho.g = no_atual.g + 1;
filho.h = Math.abs(filho.x - no_fim.x) + Math.abs(filho.y - no_fim.y);
filho.f = filho.g + filho.h;`}</code>
          </pre>
        </div>

        <h3>4. Geração da Maçã</h3>
        <p>
          A maçã é posicionada aleatoriamente em espaços vazios do tabuleiro. O sistema mantém uma lista de todas as
          posições possíveis e remove aquelas ocupadas pela cobra:
        </p>
        <div className="code-block">
          <pre>
            <code>{`generate(snake_body) {
    const empty_boxes = this.boxes.filter(function (value) {
        for (let i = 0; i < snake_body.length; i++) {
            if (value.x == snake_body[i].x && value.y == snake_body[i].y) {
                return false;
            }
        }
        return true;
    });
    // Escolhe uma posição aleatória dentre as disponíveis
    const random_position = empty_boxes[int(random(0, empty_boxes.length))];`}</code>
          </pre>
        </div>

        <h3>5. Sistema de Planejamento de Rotas</h3>
        <p>O diferencial deste jogo está no seu sistema inteligente de planejamento de rotas, que:</p>
        <ul>
          <li>Recalcula o caminho sempre que a cobra atinge a posição anterior da cauda</li>
          <li>Verifica se existe uma rota de fuga após pegar a maçã</li>
          <li>Mantém um caminho hamiltoniano virtual para evitar becos sem saída</li>
        </ul>
        <div className="code-block">
          <pre>
            <code>{`// Recálculo do caminho
if ((this.getHeadPosition().x == this.tail_position.x && 
     this.getHeadPosition().y == this.tail_position.y) || 
     this.body.length > 600) {
    this.tail_position = this.getTailPosition();
    search.getPath();
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
