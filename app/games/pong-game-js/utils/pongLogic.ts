'use client';

// ========== TIPOS ==========
export interface GameState {
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  };
  leftPaddle: {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
  };
  rightPaddle: {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
  };
  score: {
    left: number;
    right: number;
  };
}

export interface LearningPhase {
  name: string;
  attemptsRange: [number, number];
  maxFitness: number;
  speedMultiplier: number;
  accuracyMultiplier: number;
  errorMultiplier: number;
  description: string;
}

export interface AICapabilities {
  speed: number;
  accuracy: number;
  errorRange: number;
  strategy: string;
}

export interface LearningSystem {
  successes: number;
  attempts: number;
  difficultSaves: number;
  positioningErrors: number;
  efficientMoves: number;
  wastedMoves: number;
  totalReactionTime: number;
  reactionCount: number;
}

// ========== CLASSE PRINCIPAL ==========
export class PongEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private learningSystem: LearningSystem;
  private trainingStats = { iterations: 0, startTime: 0 };
  private gameRunning = false;
  private trainingActive = false;
  private lastTime = 0;
  private gameTime = 0;
  private animationId: number | null = null;

  // Callbacks para atualizar a UI
  public onScoreUpdate?: (score: { left: number; right: number }) => void;
  public onFitnessUpdate?: (fitness: number) => void;
  public onPhaseUpdate?: (phase: string, progress: number) => void;
  public onStatsUpdate?: (stats: any) => void;

  private phases: LearningPhase[] = [
    { 
      name: "INICIANTE", 
      attemptsRange: [0, 20],
      maxFitness: 30,
      speedMultiplier: 0.4,
      accuracyMultiplier: 0.3,
      errorMultiplier: 3.0,
      description: "Aprendendo movimentos básicos"
    },
    { 
      name: "BÁSICO", 
      attemptsRange: [20, 40],
      maxFitness: 70,
      speedMultiplier: 0.8,
      accuracyMultiplier: 0.6,
      errorMultiplier: 1.5,
      description: "Melhorando previsão de trajetória"
    },
    { 
      name: "AVANÇADO", 
      attemptsRange: [40, Infinity],
      maxFitness: 100,
      speedMultiplier: 1.2,
      accuracyMultiplier: 0.9,
      errorMultiplier: 0.8,
      description: "Jogando em nível competitivo"
    }
  ];

  private aiConfig = {
    speed: 0.3,
    accuracy: 0.2,
    color: '#0af',
    strategy: 'Iniciante'
  };

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.learningSystem = this.initializeLearningSystem();
    this.gameState = this.initializeGameState();
    
    // ⭐ DESENHA O ESTADO INICIAL IMEDIATAMENTE ⭐
    this.draw();
  }

  private initializeLearningSystem(): LearningSystem {
    return {
      successes: 0,
      attempts: 0,
      difficultSaves: 0,
      positioningErrors: 0,
      efficientMoves: 0,
      wastedMoves: 0,
      totalReactionTime: 0,
      reactionCount: 0
    };
  }

  private initializeGameState(): GameState {
    return {
      ball: { x: 400, y: 200, vx: 4, vy: 2, radius: 8 },
      leftPaddle: { x: 30, y: 160, width: 15, height: 80, speed: 6 },
      rightPaddle: { x: 755, y: 160, width: 15, height: 80, speed: 5 },
      score: { left: 0, right: 0 }
    };
  }

  // ========== SISTEMA DE APRENDIZADO ==========
  private getCurrentPhase() {
    for (let i = 0; i < this.phases.length; i++) {
      const phase = this.phases[i];
      if (this.learningSystem.attempts >= phase.attemptsRange[0] && 
          this.learningSystem.attempts < phase.attemptsRange[1]) {
        const progressInPhase = this.getProgressInPhase(i);
        return { phase, phaseIndex: i, progressInPhase };
      }
    }
    const lastPhase = this.phases[this.phases.length - 1];
    return { 
      phase: lastPhase, 
      phaseIndex: this.phases.length - 1, 
      progressInPhase: 1 
    };
  }

  private getProgressInPhase(phaseIndex: number): number {
    const phase = this.phases[phaseIndex];
    const phaseSize = phase.attemptsRange[1] - phase.attemptsRange[0];
    const progressInPhase = (this.learningSystem.attempts - phase.attemptsRange[0]) / phaseSize;
    return Math.min(1, Math.max(0, progressInPhase));
  }

  public calculateFitness(): number {
    if (this.learningSystem.attempts === 0) return 0;
    
    const { phase } = this.getCurrentPhase();
    
    // Métricas base
    const baseSuccess = this.learningSystem.successes / this.learningSystem.attempts;
    const difficultyBonus = this.learningSystem.difficultSaves / this.learningSystem.attempts;
    const efficiencyScore = (this.learningSystem.efficientMoves + this.learningSystem.wastedMoves) > 0 ? 
      this.learningSystem.efficientMoves / (this.learningSystem.efficientMoves + this.learningSystem.wastedMoves) : 0.5;
    const positioningScore = 1 - (this.learningSystem.positioningErrors / this.learningSystem.attempts);
    
    // Fitness base (0-100)
    const rawFitness = (
      baseSuccess * 0.5 +
      difficultyBonus * 0.3 +
      efficiencyScore * 0.1 +
      positioningScore * 0.1
    ) * 100;
    
    // Aplicar limite da fase atual
    const fitnessInPhase = Math.min(rawFitness, phase.maxFitness);
    
    return Math.min(100, fitnessInPhase);
  }

  private getAICapabilities(): AICapabilities {
    const { phase, progressInPhase } = this.getCurrentPhase();
    const fitness = this.calculateFitness();
    const fitnessRatio = fitness / 100; // Usar fitness real, não limitado pela fase
    
    // Calcular capacidades baseadas na fase e progresso
    const speed = 0.3 + (phase.speedMultiplier * fitnessRatio);
    const accuracy = 0.2 + (phase.accuracyMultiplier * fitnessRatio);
    const errorRange = phase.errorMultiplier * (1 - fitnessRatio);
    
    return {
      speed: Math.min(1.5, Math.max(0.3, speed)),
      accuracy: Math.min(0.95, Math.max(0.2, accuracy)),
      errorRange: Math.max(0.5, Math.min(3.0, errorRange)),
      strategy: phase.name
    };
  }

  // ========== IA INTELIGENTE ==========
  private intelligentAIWithRealLearning() {
    const paddle = this.gameState.rightPaddle;
    const ball = this.gameState.ball;
    
    // Obter capacidades atuais baseadas no aprendizado
    const capabilities = this.getAICapabilities();
    
    // Atualizar configurações da IA
    this.aiConfig.speed = capabilities.speed;
    this.aiConfig.accuracy = capabilities.accuracy;
    this.aiConfig.strategy = capabilities.strategy;
    
    // Verificar se a bola está se aproximando
    const ballApproaching = ball.vx > 0 && ball.x > this.canvas.width / 3;
    
    if (ballApproaching) {
      // Prever posição futura da bola
      const timeToReach = (paddle.x - ball.x) / ball.vx;
      let predictedY = ball.y + (ball.vy * timeToReach);
      
      // Classificar dificuldade
      const paddleCenter = paddle.y + paddle.height / 2;
      const distanceFromCenter = Math.abs(predictedY - paddleCenter);
      
      if (distanceFromCenter > paddle.height * 0.3) {
        this.learningSystem.difficultSaves++;
      }
      
      // Verificar erro de posicionamento
      if (distanceFromCenter > paddle.height * 0.5) {
        this.learningSystem.positioningErrors++;
      }
      
      // Aplicar imprecisão baseada no aprendizado atual
      const errorRange = (1 - this.aiConfig.accuracy) * 150 * capabilities.errorRange;
      predictedY += (Math.random() - 0.5) * errorRange;
      
      // Calcular movimento necessário
      const targetY = predictedY - paddle.height / 2;
      const moveDistance = Math.abs(targetY - paddleCenter);
      
      // Classificar eficiência do movimento
      if (moveDistance < 30) {
        this.learningSystem.efficientMoves++;
      } else if (moveDistance > 100) {
        this.learningSystem.wastedMoves++;
      }
      
      // Executar movimento
      if (targetY < paddleCenter - 5) {
        paddle.y -= paddle.speed * this.aiConfig.speed;
      } else if (targetY > paddleCenter + 5) {
        paddle.y += paddle.speed * this.aiConfig.speed;
      }
    } else {
      // Posicionamento defensivo básico
      const defensivePosition = this.canvas.height / 2 - paddle.height / 2;
      const currentPosition = paddle.y;
      
      if (Math.abs(defensivePosition - currentPosition) > 20) {
        if (defensivePosition < currentPosition) {
          paddle.y -= paddle.speed * this.aiConfig.speed * 0.3;
        } else {
          paddle.y += paddle.speed * this.aiConfig.speed * 0.3;
        }
      }
    }
  }

  // ========== CONTROLES DO JOGO ==========
  public start() {
    this.gameRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public stop() {
    this.gameRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public togglePause() {
    this.gameRunning = !this.gameRunning;
    if (this.gameRunning) {
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    }
  }

  public toggleTraining() {
    this.trainingActive = !this.trainingActive;
    if (this.trainingActive) {
      this.trainingStats.startTime = this.gameTime;
    }
    return this.trainingActive;
  }

  public restart() {
    this.gameState = this.initializeGameState();
    this.learningSystem = this.initializeLearningSystem();
    this.trainingStats = { iterations: 0, startTime: 0 };
    this.gameTime = 0;
    this.trainingActive = false;
    this.gameRunning = false;
    this.draw(); // Redesenhar o estado inicial
  }

  // ========== LÓGICA DO JOGO ==========
  private update(deltaTime: number) {
    if (!this.gameRunning) return;

    // Movimentar bola
    this.gameState.ball.x += this.gameState.ball.vx;
    this.gameState.ball.y += this.gameState.ball.vy;
    
    // Colisão com paredes
    if (this.gameState.ball.y - this.gameState.ball.radius <= 0) {
      this.gameState.ball.y = this.gameState.ball.radius;
      this.gameState.ball.vy = Math.abs(this.gameState.ball.vy);
    } else if (this.gameState.ball.y + this.gameState.ball.radius >= this.canvas.height) {
      this.gameState.ball.y = this.canvas.height - this.gameState.ball.radius;
      this.gameState.ball.vy = -Math.abs(this.gameState.ball.vy);
    }
    
    // IA - Comportamento inteligente com aprendizado real
    if (this.trainingActive) {
      this.trainingStats.iterations++;
      this.intelligentAIWithRealLearning();
    } else {
      // Comportamento básico sem IA
      const paddleCenter = this.gameState.rightPaddle.y + this.gameState.rightPaddle.height / 2;
      if (this.gameState.ball.y < paddleCenter - 15) {
        this.gameState.rightPaddle.y -= this.gameState.rightPaddle.speed * 0.5;
      } else if (this.gameState.ball.y > paddleCenter + 15) {
        this.gameState.rightPaddle.y += this.gameState.rightPaddle.speed * 0.5;
      }
    }
    
    // Manter raquetes dentro dos limites
    this.gameState.rightPaddle.y = Math.max(0, Math.min(this.canvas.height - this.gameState.rightPaddle.height, this.gameState.rightPaddle.y));
    this.gameState.leftPaddle.y = Math.max(0, Math.min(this.canvas.height - this.gameState.leftPaddle.height, this.gameState.leftPaddle.y));
    
    // Detectar colisões
    this.checkPaddleCollision(this.gameState.leftPaddle, true);
    this.checkPaddleCollision(this.gameState.rightPaddle, false);
    
    // Verificar se a bola saiu
    if (this.gameState.ball.x - this.gameState.ball.radius <= 0) {
      this.gameState.score.right++;
      if (this.trainingActive) this.learningSystem.attempts++;
      this.resetBall();
    } else if (this.gameState.ball.x + this.gameState.ball.radius >= this.canvas.width) {
      this.gameState.score.left++;
      this.resetBall();
    }

    // Atualizar callbacks
    this.updateCallbacks();
  }

  private checkPaddleCollision(paddle: any, isLeft: boolean) {
    const ball = this.gameState.ball;
    
    // Calcular os limites
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;
    
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;
    
    // Verificar colisão
    const collisionX = ballRight > paddleLeft && ballLeft < paddleRight;
    const collisionY = ballBottom > paddleTop && ballTop < paddleBottom;
    
    if (collisionX && collisionY) {
      const movingTowardPaddle = (isLeft && ball.vx < 0) || (!isLeft && ball.vx > 0);
      
      if (movingTowardPaddle) {
        // Rebater a bola
        ball.vx = -ball.vx * 1.05;
        
        // Ajustar ângulo
        const hitPos = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        ball.vy = hitPos * 6;
        
        // Corrigir posição
        if (isLeft) {
          ball.x = paddleRight + ball.radius;
        } else {
          ball.x = paddleLeft - ball.radius;
        }
        
        // Registrar sucesso se foi a IA
        if (!isLeft && this.trainingActive) {
          this.learningSystem.successes++;
        }
      }
    }
  }

  private resetBall() {
    this.gameState.ball.x = this.canvas.width / 2;
    this.gameState.ball.y = this.canvas.height / 2;
    this.gameState.ball.vx = (Math.random() > 0.5 ? 4 : -4);
    this.gameState.ball.vy = (Math.random() - 0.5) * 4;
  }

  // ========== RENDERIZAÇÃO ==========
  private draw() {
    // Limpar canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Desenhar linha central
    this.ctx.strokeStyle = '#0a0';
    this.ctx.setLineDash([5, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Desenhar raquetes
    this.ctx.fillStyle = '#0f0';
    this.ctx.fillRect(
      this.gameState.leftPaddle.x, 
      this.gameState.leftPaddle.y, 
      this.gameState.leftPaddle.width, 
      this.gameState.leftPaddle.height
    );
    
    // Cor diferente para IA
    this.ctx.fillStyle = this.trainingActive ? this.aiConfig.color : '#0f0';
    this.ctx.fillRect(
      this.gameState.rightPaddle.x, 
      this.gameState.rightPaddle.y, 
      this.gameState.rightPaddle.width, 
      this.gameState.rightPaddle.height
    );
    
    // Desenhar bola
    this.ctx.fillStyle = '#0f0';
    this.ctx.beginPath();
    this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.gameState.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Desenhar placar
    this.ctx.fillStyle = '#0f0';
    this.ctx.font = '24px Courier New';
    this.ctx.fillText(this.gameState.score.left.toString(), this.canvas.width / 4, 30);
    this.ctx.fillText(this.gameState.score.right.toString(), 3 * this.canvas.width / 4, 30);
  }

  private gameLoop = (timestamp: number) => {
    if (!this.lastTime) this.lastTime = timestamp;
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    if (this.gameRunning) {
      this.gameTime += deltaTime / 1000;
      this.update(deltaTime / 16);
      this.draw();
    }
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  // ========== ATUALIZAÇÃO DA UI ==========
  private updateCallbacks() {
    const fitness = this.calculateFitness();
    const { phase, progressInPhase } = this.getCurrentPhase();

    // Atualizar callbacks
    this.onScoreUpdate?.(this.gameState.score);
    this.onFitnessUpdate?.(fitness);
    this.onPhaseUpdate?.(phase.name, progressInPhase);
    this.onStatsUpdate?.({
      fitness,
      iterations: this.trainingStats.iterations,
      gameTime: Math.round(this.gameTime),
      phase: phase.name,
      speed: Math.round(this.aiConfig.speed * 100),
      accuracy: Math.round(this.aiConfig.accuracy * 100),
      strategy: this.aiConfig.strategy,
      difficultSaves: this.learningSystem.difficultSaves,
      positioningErrors: this.learningSystem.positioningErrors,
      efficientMoves: this.learningSystem.efficientMoves,
      wastedMoves: this.learningSystem.wastedMoves,
      attempts: this.learningSystem.attempts,
      successRate: this.learningSystem.attempts > 0 ? 
        Math.round((this.learningSystem.successes / this.learningSystem.attempts) * 100) : 0
    });
  }

  // ========== CONTROLES DO JOGADOR ==========
  public movePaddleUp() {
    if (this.gameState.leftPaddle.y > 0) {
      this.gameState.leftPaddle.y -= this.gameState.leftPaddle.speed;
    }
  }

  public movePaddleDown() {
    if (this.gameState.leftPaddle.y < this.canvas.height - this.gameState.leftPaddle.height) {
      this.gameState.leftPaddle.y += this.gameState.leftPaddle.speed;
    }
  }

  // Getters para estado
  public getGameState() {
    return this.gameState;
  }

  public getTrainingActive() {
    return this.trainingActive;
  }

  public getGameRunning() {
    return this.gameRunning;
  }
}