// SnakeGame.tsx
import React, { useEffect, useRef, useState } from 'react';
import './styles.css';

// Interfaces e tipos
interface Position {
  x: number;
  y: number;
}

interface Node extends Position {
  parent: Node | null;
  f: number;
  g: number;
  h: number;
}

// Componente principal
const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Classes do jogo convertidas para TypeScript
  class Snake {
    body: Position[];
    x_dir: number;
    y_dir: number;
    path: Position[];
    tail_position: Position;
    last_path_update: number;

    constructor() {
      this.body = [];
      for (let i = 0; i < 3; i++) {
        this.body[i] = { x: i, y: 0 };
      }
      this.x_dir = 1;
      this.y_dir = 0;
      this.path = [];
      this.tail_position = this.getTailPosition();
      this.last_path_update = 0;
    }

    update(apple: Apple): boolean {
      const head = this.getHeadPosition();
      if ((head.x === this.tail_position.x && head.y === this.tail_position.y) || 
          this.body.length > 600) {
        this.tail_position = {...this.getTailPosition()};
        this.last_path_update = 0;
        search.getPath();
      }
      this.last_path_update++;

      let directionSet = false;
      for (let i = 0; i < this.path.length && !directionSet; i++) {
        if (head.x === this.path[i].x && head.y === this.path[i].y) {
          const next_head = this.path[i + 1];
          if (!next_head) continue;
          
          if (next_head.x - head.x === 1) {
            this.right();
            directionSet = true;
          } else if (next_head.x - head.x === -1) {
            this.left();
            directionSet = true;
          } else if (next_head.y - head.y === 1) {
            this.down();
            directionSet = true;
          } else if (next_head.y - head.y === -1) {
            this.up();
            directionSet = true;
          }
        }
      }

      const newHead = this.getHeadPosition();
      if (newHead.x < 0 || newHead.x >= 40 || newHead.y < 0 || newHead.y >= 20) {
        console.log("Collision with wall");
        return false;
      }

      for (let i = 0; i < this.body.length - 1; i++) {
        if (newHead.x === this.body[i].x && newHead.y === this.body[i].y) {
          console.log("Collision with body");
          return false;
        }
      }

      this.body.push({
        x: head.x + this.x_dir,
        y: head.y + this.y_dir
      });

      const nextHead = this.getHeadPosition();
      if (nextHead.x === apple.x && nextHead.y === apple.y) {
        if (!apple.generate(this.body)) {
          console.log("Game won!");
          return false;
        }
        this.tail_position = {...this.getTailPosition()};
        search.getPath();
      } else {
        this.body.shift();
      }
      
      return true;
    }

    getHeadPosition(): Position {
      return this.body[this.body.length - 1];
    }

    getTailPosition(): Position {
      return this.body[0];
    }

    changeDirection(x_dir: number, y_dir: number): void {
      if (!(Math.abs(this.x_dir - x_dir) === 2 || Math.abs(this.y_dir - y_dir) === 2)) {
        this.x_dir = x_dir;
        this.y_dir = y_dir;
      }
    }

    up() { this.changeDirection(0, -1); }
    down() { this.changeDirection(0, 1); }
    left() { this.changeDirection(-1, 0); }
    right() { this.changeDirection(1, 0); }

    show(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#00cc00';
      for (const segment of this.body) {
        ctx.fillRect(segment.x * 30, segment.y * 30, 30, 30);
      }

      ctx.strokeStyle = '#008800';
      ctx.lineWidth = 2;
      for (const segment of this.body) {
        ctx.strokeRect(segment.x * 30, segment.y * 30, 30, 30);
      }

      const head = this.getHeadPosition();
      ctx.fillStyle = '#006600';
      ctx.fillRect(head.x * 30, head.y * 30, 30, 30);
      ctx.strokeStyle = '#004400';
      ctx.lineWidth = 2;
      ctx.strokeRect(head.x * 30, head.y * 30, 30, 30);
      
      ctx.fillStyle = '#ff69b4';
      if (this.x_dir === 1) {
        ctx.fillRect(head.x * 30 + 30, head.y * 30 + 13, 10, 4);
      } else if (this.x_dir === -1) {
        ctx.fillRect(head.x * 30 - 10, head.y * 30 + 13, 10, 4);
      } else if (this.y_dir === 1) {
        ctx.fillRect(head.x * 30 + 13, head.y * 30 + 30, 4, 10);
      } else if (this.y_dir === -1) {
        ctx.fillRect(head.x * 30 + 13, head.y * 30 - 10, 4, 10);
      }
      
      ctx.fillStyle = '#000000';
      if (this.x_dir === 1) {
        ctx.fillRect(head.x * 30 + 20, head.y * 30 + 7, 6, 6);
        ctx.fillRect(head.x * 30 + 20, head.y * 30 + 20, 6, 6);
      } else if (this.x_dir === -1) {
        ctx.fillRect(head.x * 30 + 4, head.y * 30 + 7, 6, 6);
        ctx.fillRect(head.x * 30 + 4, head.y * 30 + 20, 6, 6);
      } else if (this.y_dir === 1) {
        ctx.fillRect(head.x * 30 + 7, head.y * 30 + 20, 6, 6);
        ctx.fillRect(head.x * 30 + 20, head.y * 30 + 20, 6, 6);
      } else if (this.y_dir === -1) {
        ctx.fillRect(head.x * 30 + 7, head.y * 30 + 4, 6, 6);
        ctx.fillRect(head.x * 30 + 20, head.y * 30 + 4, 6, 6);
      }
      
      ctx.fillStyle = '#ffffff';
      if (this.x_dir === 1) {
        ctx.fillRect(head.x * 30 + 21, head.y * 30 + 8, 2, 2);
        ctx.fillRect(head.x * 30 + 21, head.y * 30 + 21, 2, 2);
      } else if (this.x_dir === -1) {
        ctx.fillRect(head.x * 30 + 5, head.y * 30 + 8, 2, 2);
        ctx.fillRect(head.x * 30 + 5, head.y * 30 + 21, 2, 2);
      } else if (this.y_dir === 1) {
        ctx.fillRect(head.x * 30 + 8, head.y * 30 + 21, 2, 2);
        ctx.fillRect(head.x * 30 + 21, head.y * 30 + 21, 2, 2);
      } else if (this.y_dir === -1) {
        ctx.fillRect(head.x * 30 + 8, head.y * 30 + 5, 2, 2);
        ctx.fillRect(head.x * 30 + 21, head.y * 30 + 5, 2, 2);
      }
    }
  }

  class Apple {
    boxes: Position[];
    x: number;
    y: number;

    constructor() {
      this.boxes = [];
      for (let i = 0; i < 40; i++) {
        for (let j = 0; j < 20; j++) {
          this.boxes.push({ x: i, y: j });
        }
      }
      this.x = 0;
      this.y = 0;
      this.generate([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
    }

    generate(snake_body: Position[]): boolean {
      const empty_boxes = this.boxes.filter(value => {
        return !snake_body.some(segment => 
          value.x === segment.x && value.y === segment.y
        );
      });

      if (empty_boxes.length === 0) return false;

      const random_position = empty_boxes[Math.floor(Math.random() * empty_boxes.length)];
      this.x = random_position.x;
      this.y = random_position.y;
      return true;
    }

    show(ctx: CanvasRenderingContext2D): void {
      // Fallback visual caso a imagem não esteja disponível
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(this.x * 30, this.y * 30, 30, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('R', this.x * 30 + 15, this.y * 30 + 20);
    }
  }

  class Search {
    snake: Snake;
    apple: Apple;
    consecutiveFailures: number;

    constructor(snake: Snake, apple: Apple) {
      this.snake = snake;
      this.apple = apple;
      this.consecutiveFailures = 0;
    }

    refreshMaze(): number[][] {
      const maze = Array(20).fill(0).map(() => Array(40).fill(0));
      
      for (const segment of this.snake.body) {
        maze[segment.y][segment.x] = -1;
      }
      
      const head = this.snake.getHeadPosition();
      const tail = this.snake.getTailPosition();
      maze[head.y][head.x] = 1;
      maze[tail.y][tail.x] = 2;
      
      return maze;
    }

    getPath(): void {
      const maze = this.refreshMaze();
      let start: Position = { x: 0, y: 0 };
      let end: Position = this.apple;
      
      // Encontra o início (cabeça da cobra)
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 40; x++) {
          if (maze[y][x] === 1) start = { x, y };
        }
      }
      
      let node_path = this.astar(maze, start, end, 'apple');
      
      // Verifica se o caminho para a maçã é perigoso
      if (node_path.length === 0 || this.isPathDangerous(node_path, maze)) {
        this.consecutiveFailures++;
        
        // Se teve várias falhas seguidas, busca a cauda para se reorganizar
        if (this.consecutiveFailures >= 2) {
          for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 40; x++) {
              if (maze[y][x] === 2) {
                end = { x, y };
                break;
              }
            }
          }
          node_path = this.astar(maze, start, end, 'tail');
          this.consecutiveFailures = 0;
        }
      } else {
        this.consecutiveFailures = 0;
      }
      
      this.snake.path = node_path.map(node => ({ x: node.x, y: node.y }));
    }

    astar(maze: number[][], start: Position, end: Position, targetType: 'apple' | 'tail'): Node[] {
      const start_node: Node = { ...start, parent: null, f: 0, g: 0, h: 0 };
      const end_node: Node = { ...end, parent: null, f: 0, g: 0, h: 0 };
      let open_list: Node[] = [start_node];
      const closed_list: Node[] = [];
      const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      const possible_paths: Node[][] = [];

      while (open_list.length > 0) {
        let current_node = open_list[0];
        let current_index = 0;
        
        for (let i = 0; i < open_list.length; i++) {
          if (targetType === 'apple') {
            if (open_list[i].f < current_node.f) {
              current_node = open_list[i];
              current_index = i;
            }
          } else {
            if (open_list[i].f > current_node.f) {
              current_node = open_list[i];
              current_index = i;
            }
          }
        }

        open_list.splice(current_index, 1);
        closed_list.push(current_node);

        if (current_node.x === end_node.x && current_node.y === end_node.y) {
          const path: Node[] = [];
          let current: Node | null = current_node;
          while (current !== null) {
            path.push(current);
            current = current.parent;
          }
          
          if (targetType === 'apple') {
            return path.reverse();
          }
          
          possible_paths.push(path.reverse());
        }

        const children: Node[] = [];
        for (const [dx, dy] of directions) {
          const nx = current_node.x + dx;
          const ny = current_node.y + dy;
          
          if (nx >= 0 && nx < 40 && ny >= 0 && ny < 20 && 
              maze[ny][nx] !== -1) {
            children.push({ x: nx, y: ny, parent: null, f: 0, g: 0, h: 0 });
          }
        }

        for (const child of children) {
          if (closed_list.some(closed => closed.x === child.x && closed.y === child.y)) continue;

          child.g = current_node.g + 1;
          child.h = Math.abs(child.x - end_node.x) + Math.abs(child.y - end_node.y);
          child.f = child.g + child.h;

          const existing = open_list.find(node => node.x === child.x && node.y === child.y);
          if (!existing) {
            child.parent = current_node;
            open_list.push(child);
          } else {
            if (targetType === 'apple') {
              if (child.g < existing.g) {
                existing.g = child.g;
                existing.f = existing.g + existing.h;
                existing.parent = current_node;
              }
            } else {
              if (child.g > existing.g) {
                existing.g = child.g;
                existing.f = existing.g + existing.h;
                existing.parent = current_node;
              }
            }
          }
        }
      }

      if (targetType === 'tail' && possible_paths.length > 0) {
        let longest_path = possible_paths[0];
        for (const path of possible_paths) {
          if (path.length > longest_path.length) {
            longest_path = path;
          }
        }
        return longest_path;
      }
      
      return [];
    }

    isPathDangerous(path: Node[], maze: number[][]): boolean {
      if (path.length === 0) return true;
      
      const head = this.snake.getHeadPosition();
      const snakeLength = this.snake.body.length;
      
      if (snakeLength > 50 && path.length < 5) {
        return true;
      }
      
      for (let i = 0; i < Math.min(path.length, 5); i++) {
        const step = path[i];
        if (this.isNearWall(step.x, step.y)) {
          return true;
        }
      }
      
      return false;
    }

    isNearWall(x: number, y: number): boolean {
      return x <= 1 || x >= 38 || y <= 1 || y >= 18;
    }
  }

  // Variáveis do jogo
  let snake: Snake;
  let apple: Apple;
  let search: Search;
  let lastTime = 0;
  const frameRate = 20;

  // Inicialização do jogo
  const init = () => {
    snake = new Snake();
    apple = new Apple();
    search = new Search(snake, apple);
    search.getPath();
    setGameStarted(true);
    setGameOver(false);
  };

  // Loop do jogo
  const gameLoop = (timestamp: number) => {
    if (!gameStarted || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (timestamp - lastTime > 1000 / frameRate) {
      ctx.clearRect(0, 0, 1200, 600);
      
      if (snake.update(apple)) {
        snake.show(ctx);
        apple.show(ctx);
      } else {
        setGameOver(true);
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', 600, 300);
        return;
      }
      
      lastTime = timestamp;
    }
    requestAnimationFrame(gameLoop);
  };

  // Efeito para inicializar o jogo
  useEffect(() => {
    init();
  }, []);

  // Efeito para iniciar o loop do jogo
  useEffect(() => {
    if (gameStarted && !gameOver) {
      requestAnimationFrame(gameLoop);
    }
  }, [gameStarted, gameOver]);

  // Função para reiniciar o jogo
  const restartGame = () => {
    init();
  };

  return (
    <div className="cyber-container">
      {/* Header cyber */}
      <header className="cyber-header">
        <div className="glow-effect"></div>
        <h1 className="cyber-title">
          <span className="title-main">SNAKE AI</span>
          <span className="title-sub">Algoritmo A* para Pathfinding Inteligente</span>
        </h1>
        <div className="cyber-line"></div>
      </header>

      {/* Container do jogo */}
      <section className="game-section">
        <div className="cyber-frame">
          <div className="frame-glow"></div>
          <canvas 
            ref={canvasRef} 
            id="gameCanvas" 
            width="1200" 
            height="600"
          />
          <div className="frame-border top"></div>
          <div className="frame-border right"></div>
          <div className="frame-border bottom"></div>
          <div className="frame-border left"></div>
        </div>
      </section>

      {/* Conteúdo principal */}
      <main className="cyber-content">
        {/* Introdução */}
        <section className="content-section">
          <div className="cyber-card">
            <h2 className="section-title">Sistema de Inteligência Artificial</h2>
            <p className="cyber-text">
              Esta implementação utiliza o algoritmo A* (A-Star) para controle autônomo 
              da cobra no jogo clássico Snake. O sistema demonstra pathfinding em tempo real 
              com tomada de decisão inteligente entre objetivos conflitantes.
            </p>
          </div>
        </section>

        {/* Algoritmo A* Detalhado */}
        <section className="content-section">
          <div className="cyber-card">
            <h2 className="section-title">Algoritmo A* - Implementação Detalhada</h2>
            
            <div className="algorithm-explanation">
              <h3>Fundamentação Teórica</h3>
              <p className="cyber-text">
                O A* é um algoritmo de busca em grafo que combina as vantagens da busca uniforme 
                (Dijkstra) e da busca gulosa, utilizando uma função heurística para orientar 
                a exploração do espaço de estados.
              </p>

              <div className="algorithm-step">
                <h4>1. Função de Avaliação f(n) = g(n) + h(n)</h4>
                <div className="component-grid">
                  <div className="component-item">
                    <div className="component-icon">f(n)</div>
                    <h5>Função Total</h5>
                    <p>Custo estimado do caminho através do nó n</p>
                  </div>
                  <div className="component-item">
                    <div className="component-icon">g(n)</div>
                    <h5>Custo Real</h5>
                    <p>Custo do caminho do início até o nó n</p>
                  </div>
                  <div className="component-item">
                    <div className="component-icon">h(n)</div>
                    <h5>Heurística</h5>
                    <p>Estimativa do custo de n até o objetivo</p>
                  </div>
                </div>
              </div>

              <div className="algorithm-step">
                <h4>2. Implementação do Algoritmo</h4>
                <div className="code-block large">
                  <pre><code>{`class Search {
  astar(maze, start, end) {
    let start_node = new Node(start.x, start.y);
    let end_node = new Node(end.x, end.y);
    let open_list = [start_node];      // Nós para explorar
    let closed_list = [];              // Nós explorados
    
    while (open_list.length > 0) {
      // Seleciona nó com menor f(n)
      let current_node = this.findLowestF(open_list);
      
      // Move nó da lista aberta para fechada
      open_list = open_list.filter(n => n !== current_node);
      closed_list.push(current_node);
      
      // Verifica se alcançou o objetivo
      if (current_node.equals(end_node)) {
        return this.reconstructPath(current_node);
      }
      
      // Expande vizinhos
      let neighbors = this.getNeighbors(current_node, maze);
      
      for (let neighbor of neighbors) {
        // Ignora se já foi explorado
        if (closed_list.some(n => n.equals(neighbor))) continue;
        
        // Calcula novo custo g(n)
        let tentative_g = current_node.g + 1;
        
        // Verifica se encontrou caminho melhor
        let existing = open_list.find(n => n.equals(neighbor));
        if (!existing || tentative_g < existing.g) {
          neighbor.g = tentative_g;
          neighbor.h = this.heuristic(neighbor, end_node);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current_node;
          
          if (!existing) {
            open_list.push(neighbor);
          }
        }
      }
    }
    return []; // Caminho não encontrado
  }
}`}</code></pre>
                </div>
              </div>

              <div className="algorithm-step">
                <h4>3. Função Heurística - Distância Manhattan</h4>
                <p className="cyber-text">
                  Utilizamos a distância Manhattan como heurística, ideal para grids com 
                  movimentação restrita às quatro direções cardeais.
                </p>
                <div className="code-block">
                  <pre><code>{`heuristic(node, end_node) {
  return Math.abs(node.x - end_node.x) + Math.abs(node.y - end_node.y);
}`}</code></pre>
                </div>
                <div className="heuristic-explanation">
                  <p><strong>Propriedades da heurística:</strong></p>
                  <ul>
                    <li><strong>Admissível:</strong> Nunca superestima o custo real</li>
                    <li><strong>Consistente:</strong> Satisfaz a desigualdade triangular</li>
                    <li><strong>Ótima:</strong> Garante solução de menor custo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Botão de reinício */}
        {gameOver && (
          <section className="content-section">
            <div className="cyber-card" style={{ textAlign: 'center' }}>
              <h2 className="section-title">Game Over</h2>
              <p className="cyber-text" style={{ marginBottom: '20px' }}>
                A cobra não conseguiu encontrar um caminho seguro!
              </p>
              <button 
                className="tech-tag" 
                onClick={restartGame}
                style={{ 
                  cursor: 'pointer', 
                  fontSize: '1.2rem',
                  padding: '15px 30px'
                }}
              >
                Reiniciar Jogo
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="cyber-footer">
        <div className="footer-content">
          <p>Sistema de Inteligência Artificial - Algoritmo A* para Pathfinding</p>
          <div className="footer-glow"></div>
        </div>
      </footer>
    </div>
  );
};

export default SnakeGame;