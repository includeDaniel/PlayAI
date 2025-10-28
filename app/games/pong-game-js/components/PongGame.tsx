'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PongEngine } from '../utils/pongLogic';
import '../styles/PongGame.css';

interface PongGameProps {
  onBackToMenu: () => void;
}

interface GameStats {
  fitness: number;
  iterations: number;
  gameTime: number;
  phase: string;
  speed: number;
  accuracy: number;
  strategy: string;
  difficultSaves: number;
  positioningErrors: number;
  efficientMoves: number;
  wastedMoves: number;
  attempts: number;
  successRate: number;
}

export default function PongGame({ onBackToMenu }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PongEngine | null>(null);
  const keysRef = useRef<{ w: boolean; s: boolean }>({ w: false, s: false });
  
  const [gameRunning, setGameRunning] = useState(false);
  const [trainingActive, setTrainingActive] = useState(false);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [stats, setStats] = useState<GameStats>({
    fitness: 0,
    iterations: 0,
    gameTime: 0,
    phase: 'INICIANTE',
    speed: 0,
    accuracy: 0,
    strategy: 'Iniciante',
    difficultSaves: 0,
    positioningErrors: 0,
    efficientMoves: 0,
    wastedMoves: 0,
    attempts: 0,
    successRate: 0
  });

  // Loop para movimento contínuo das raquetes - FLUIDO
  useEffect(() => {
    if (!gameRunning) return;

    const moveLoop = setInterval(() => {
      if (!gameRef.current) return;

      if (keysRef.current.w) {
        gameRef.current.movePaddleUp();
      }
      if (keysRef.current.s) {
        gameRef.current.movePaddleDown();
      }
    }, 16); // ~60 FPS para movimento fluido

    return () => clearInterval(moveLoop);
  }, [gameRunning]);

  // Inicializar o jogo
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamanho do canvas
    canvas.width = 800;
    canvas.height = 400;

    // Inicializar o motor do jogo
    gameRef.current = new PongEngine(canvas, ctx);

    // Configurar callbacks
    gameRef.current.onScoreUpdate = setScore;
    gameRef.current.onFitnessUpdate = (fitness) => setStats(prev => ({ ...prev, fitness }));
    gameRef.current.onPhaseUpdate = (phase, progress) => setStats(prev => ({ 
      ...prev, 
      phase,
      // ⭐ ATUALIZA O PROGRESSO DA BARRA DE APRENDIZADO ⭐
      progressInPhase: progress 
    }));
    gameRef.current.onStatsUpdate = (newStats) => setStats(prev => ({ ...prev, ...newStats }));

    // Iniciar o jogo automaticamente
    gameRef.current.start();
    setGameRunning(true);

    // Event listeners para teclado - CORRIGIDO PARA MOVIMENTO CONTÍNUO
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') {
        keysRef.current.w = true;
      } else if (e.key.toLowerCase() === 's') {
        keysRef.current.s = true;
      } else if (e.key === 'Escape') {
        handlePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') {
        keysRef.current.w = false;
      } else if (e.key.toLowerCase() === 's') {
        keysRef.current.s = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      gameRef.current?.stop();
    };
  }, []);

  const handleStart = () => {
    if (!gameRef.current) return;

    if (!gameRunning) {
      gameRef.current.start();
      setGameRunning(true);
    } else {
      gameRef.current.togglePause();
      setGameRunning(!gameRunning);
    }
  };

  const handlePause = () => {
    if (!gameRef.current) return;
    gameRef.current.togglePause();
    setGameRunning(!gameRunning);
  };

  const handleTraining = () => {
    if (!gameRef.current) return;
    const newTrainingState = gameRef.current.toggleTraining();
    setTrainingActive(newTrainingState);
  };

  const handleRestart = () => {
    if (!gameRef.current) return;
    gameRef.current.restart();
    setScore({ left: 0, right: 0 });
    setStats({
      fitness: 0,
      iterations: 0,
      gameTime: 0,
      phase: 'INICIANTE',
      speed: 0,
      accuracy: 0,
      strategy: 'Iniciante',
      difficultSaves: 0,
      positioningErrors: 0,
      efficientMoves: 0,
      wastedMoves: 0,
      attempts: 0,
      successRate: 0
    });
    setGameRunning(false);
    setTrainingActive(false);
    
    // Recria o jogo para garantir que tudo seja redesenhado
    setTimeout(() => {
      if (gameRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          gameRef.current.start();
          setGameRunning(true);
        }
      }
    }, 100);
  };

  const getPhaseColor = useCallback((phase: string) => {
    switch (phase) {
      case 'INICIANTE': return '#f00';
      case 'BÁSICO': return '#ff0';
      case 'AVANÇADO': return '#0f0';
      default: return '#0af';
    }
  }, []);

  // ⭐ CALCULA PROGRESSO VISUAL CORRETO PARA A BARRA ⭐
  const getLearningProgress = useCallback((phase: string, attempts: number) => {
    switch (phase) {
      case 'INICIANTE':
        return Math.min(100, (attempts / 20) * 100);
      case 'BÁSICO':
        return Math.min(100, ((attempts - 20) / 20) * 100);
      case 'AVANÇADO':
        return 100;
      default:
        return 0;
    }
  }, []);

  return (
    <div className="pong-game-container">
      <div className="game-header">
        <button className="back-button" onClick={onBackToMenu}>
          ← Voltar ao Menu
        </button>
        <h1>🧠 PONG COM IA</h1>
        <div className="header-controls">
          <button onClick={handleStart} className="control-btn">
            {gameRunning ? '⏸️ PAUSAR' : '🎬 INICIAR JOGO'}
          </button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="game-stats">
        <div className="stat">
          <div>Fitness Score</div>
          <div className="stat-value">{Math.round(stats.fitness)}%</div>
        </div>
        <div className="stat">
          <div>Iterações</div>
          <div className="stat-value">{stats.iterations}</div>
        </div>
        <div className="stat">
          <div>Tempo</div>
          <div className="stat-value">{stats.gameTime}s</div>
        </div>
        <div className="stat">
          <div>Status</div>
          <div 
            className="stat-value training-status"
            style={{ color: getPhaseColor(stats.phase) }}
          >
            {trainingActive ? `IA - ${stats.phase}` : 'IA DESATIVADA'}
          </div>
        </div>
      </div>

      {/* Canvas do Jogo */}
      <div className="game-canvas-container">
        <canvas 
          ref={canvasRef} 
          className="pong-canvas"
        />
      </div>

      {/* Barra de Progresso do Fitness */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min(100, stats.fitness)}%` }}
        />
      </div>

      {/* Informações da Fase */}
      <div className="phase-info">
        <span>🎯 Iniciante (0-20)</span>
        <span>🚀 Básico (20-40)</span>
        <span>🏆 Avançado (40+)</span>
      </div>

      {/* Estágio de Aprendizado - CORRIGIDO */}
      <div className="learning-stage">
        <strong>Fase de Aprendizado:</strong> 
        <span style={{ color: getPhaseColor(stats.phase), marginLeft: '8px' }}>
          {stats.phase}
        </span>
        <div className="learning-progress">
          <div 
            className="learning-progress-fill" 
            style={{ 
              width: `${getLearningProgress(stats.phase, stats.attempts)}%`,
              background: getPhaseColor(stats.phase)
            }}
          />
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          Tentativas: {stats.attempts} | Progresso: {Math.round(getLearningProgress(stats.phase, stats.attempts))}%
        </div>
      </div>

      {/* Controles */}
      <div className="controls">
        <button onClick={handleTraining} className="control-btn">
          {trainingActive ? '⏹️ DESATIVAR IA' : '🚀 ATIVAR IA'}
        </button>
        <button onClick={handleRestart} className="control-btn">
          🔄 REINICIAR
        </button>
      </div>

      {/* Informações da IA */}
      <div className="training-info">
        <h3>📊 Informações da IA</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Modo:</strong> <span>IA Inteligente</span>
          </div>
          <div className="info-item">
            <strong>Velocidade:</strong> <span>{stats.speed}%</span>
          </div>
          <div className="info-item">
            <strong>Precisão:</strong> <span>{stats.accuracy}%</span>
          </div>
          <div className="info-item">
            <strong>Estratégia:</strong> <span>{stats.strategy}</span>
          </div>
        </div>
      </div>

      {/* Métricas Detalhadas */}
      <div className="fitness-details">
        <h3>📈 Métricas Detalhadas de Fitness</h3>
        <div className="fitness-grid">
          <div className="fitness-item">
            <div>Defesas Difíceis</div>
            <div className="fitness-value">{stats.difficultSaves}</div>
          </div>
          <div className="fitness-item">
            <div>Erros Posição</div>
            <div className="fitness-value">{stats.positioningErrors}</div>
          </div>
          <div className="fitness-item">
            <div>Mov. Eficientes</div>
            <div className="fitness-value">{stats.efficientMoves}</div>
          </div>
          <div className="fitness-item">
            <div>Mov. Desperdício</div>
            <div className="fitness-value">{stats.wastedMoves}</div>
          </div>
          <div className="fitness-item">
            <div>Tentativas</div>
            <div className="fitness-value">{stats.attempts}</div>
          </div>
          <div className="fitness-item">
            <div>Taxa Acerto</div>
            <div className="fitness-value">{stats.successRate}%</div>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="instructions">
        <strong>Controles:</strong> W/S para mover a raquete esquerda | ESC para pausar | Ative a IA para jogar contra o computador
      </div>
    </div>
  );
}