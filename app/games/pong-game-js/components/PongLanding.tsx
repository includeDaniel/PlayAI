'use client';

import { useState, useEffect } from 'react';
import '../styles/PongLanding.css';

interface PongLandingProps {
  onStartGame: () => void;
}

export default function PongLanding({ onStartGame }: PongLandingProps) {
  const [visibleElements, setVisibleElements] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Animação de entrada dos elementos
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.fade-in');
      elements.forEach((_, index) => {
        setTimeout(() => {
          setVisibleElements(prev => new Set(prev).add(index));
        }, index * 200);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="pong-landing">
      {/* Header */}
      <header className="header">
        <h1 className="title neon-text">PONG COM IA</h1>
        <p className="subtitle neon-text">Sistema de Aprendizado Inteligente Baseado em Fitness</p>
        <button onClick={onStartGame} className="cta-button neon-border">
          🎮 JOGAR AGORA
        </button>
      </header>

      {/* Introdução */}
      <section className="section">
        <h2 className="section-title">🤖 O QUE TORNA ESTA IA ESPECIAL?</h2>
        <div className="cards-grid">
          <div className={`card fade-in ${visibleElements.has(0) ? 'visible' : ''}`}>
            <div className="card-icon">🧠</div>
            <h3 className="card-title">Aprendizado Gradual</h3>
            <p className="card-content">
              Nossa IA não nasce expert - ela evolui através de um sistema de fases baseado em tentativas reais. 
              Começa como iniciante e vai se tornando mais inteligente conforme joga.
            </p>
          </div>
          
          <div className={`card fade-in ${visibleElements.has(1) ? 'visible' : ''}`}>
            <div className="card-icon">📊</div>
            <h3 className="card-title">Sistema de Fitness</h3>
            <p className="card-content">
              O "fitness score" mede o desempenho da IA considerando múltiplas métricas: taxa de acerto, 
              defesas difíceis, eficiência de movimento e posicionamento estratégico.
            </p>
          </div>
          
          <div className={`card fade-in ${visibleElements.has(2) ? 'visible' : ''}`}>
            <div className="card-icon">⚡</div>
            <h3 className="card-title">Adaptação em Tempo Real</h3>
            <p className="card-content">
              A IA ajusta sua velocidade, precisão e estratégia dinamicamente baseado no seu desempenho atual. 
              Se está indo mal, fica mais conservadora; se está indo bem, fica mais agressiva.
            </p>
          </div>
        </div>
      </section>

      {/* Sistema de Fitness */}
      <section className="section section-dark">
        <h2 className="section-title">📈 SISTEMA DE FITNESS AVANÇADO</h2>
        
        <div className="metrics-grid">
          {[40, 30, 15, 10, 5].map((value, index) => (
            <div key={index} className={`metric fade-in ${visibleElements.has(3 + index) ? 'visible' : ''}`}>
              <MetricCounter value={value} />
              <div className="metric-label">
                {[
                  'Taxa de Acerto',
                  'Defesas Difíceis', 
                  'Eficiência de Movimento',
                  'Posicionamento',
                  'Tempo de Reação'
                ][index]}
              </div>
            </div>
          ))}
        </div>
        
        <div className={`code-block fade-in ${visibleElements.has(8) ? 'visible' : ''}`}>
          <span className="code-keyword">function</span> <span className="code-function">calculateFitness</span>() {'{'}
          <br />
          &nbsp;&nbsp;<span className="code-keyword">const</span> baseSuccess = <span className="code-keyword">this</span>.successes / <span className="code-keyword">this</span>.attempts;
          <br />
          &nbsp;&nbsp;<span className="code-keyword">const</span> difficultyBonus = <span className="code-keyword">this</span>.difficultSaves / <span className="code-keyword">this</span>.attempts;
          <br />
          &nbsp;&nbsp;<span className="code-keyword">const</span> efficiencyScore = <span className="code-keyword">this</span>.efficientMoves / (<span className="code-keyword">this</span>.efficientMoves + <span className="code-keyword">this</span>.wastedMoves);
          <br />
          &nbsp;&nbsp;<span className="code-keyword">const</span> positioningScore = <span className="code-number">1</span> - (<span className="code-keyword">this</span>.positioningErrors / <span className="code-keyword">this</span>.attempts);
          <br />
          <br />
          &nbsp;&nbsp;<span className="code-keyword">return</span> (
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;baseSuccess * <span className="code-number">0.4</span> + <span className="code-comment">// 40% taxa de acerto</span>
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;difficultyBonus * <span className="code-number">0.3</span> + <span className="code-comment">// 30% defesas difíceis</span>
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;efficiencyScore * <span className="code-number">0.15</span> + <span className="code-comment">// 15% eficiência</span>
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;positioningScore * <span className="code-number">0.1</span> <span className="code-comment">// 10% posicionamento</span>
          <br />
          &nbsp;&nbsp;) * <span className="code-number">100</span>;
          <br />
          {'}'}
        </div>
      </section>

      {/* Fases de Aprendizado */}
      <section className="section">
        <h2 className="section-title">🎯 FASES DE APRENDIZADO</h2>
        
        <div className="phases-container">
          <div className={`phase phase-beginner fade-in ${visibleElements.has(9) ? 'visible' : ''}`}>
            <h3 className="phase-title">🎯 INICIANTE</h3>
            <div className="phase-range">0-20 Tentativas</div>
            <p className="phase-description">
              IA lenta e imprecisa, aprendendo movimentos básicos. Fitness máximo: 30%
            </p>
          </div>
          
          <div className={`phase phase-basic fade-in ${visibleElements.has(10) ? 'visible' : ''}`}>
            <h3 className="phase-title">🚀 BÁSICO</h3>
            <div className="phase-range">20-40 Tentativas</div>
            <p className="phase-description">
              Melhora previsão de trajetória e velocidade. Fitness máximo: 70%
            </p>
          </div>
          
          <div className={`phase phase-advanced fade-in ${visibleElements.has(11) ? 'visible' : ''}`}>
            <h3 className="phase-title">🏆 AVANÇADO</h3>
            <div className="phase-range">40+ Tentativas</div>
            <p className="phase-description">
              Joga em nível competitivo com alta precisão. Fitness máximo: 100%
            </p>
          </div>
        </div>
      </section>

      {/* Algoritmo de IA */}
      <section className="section section-dark">
        <h2 className="section-title">⚙️ ALGORITMO INTELIGENTE</h2>
        
        <div className="cards-grid">
          <div className={`card fade-in ${visibleElements.has(12) ? 'visible' : ''}`}>
            <div className="card-icon">🎯</div>
            <h3 className="card-title">Predição de Trajetória</h3>
            <p className="card-content">
              A IA calcula onde a bola estará baseado na velocidade atual e ângulo, 
              aplicando imprecisão controlada baseada no seu nível de aprendizado.
            </p>
          </div>
          
          <div className={`card fade-in ${visibleElements.has(13) ? 'visible' : ''}`}>
            <div className="card-icon">🔄</div>
            <h3 className="card-title">Ajuste Dinâmico</h3>
            <p className="card-content">
              A cada 20 iterações, a IA analisa seu fitness score e ajusta velocidade, 
              precisão e estratégia para melhor desempenho.
            </p>
          </div>
          
          <div className={`card fade-in ${visibleElements.has(14) ? 'visible' : ''}`}>
            <div className="card-icon">📐</div>
            <h3 className="card-title">Movimento Eficiente</h3>
            <p className="card-content">
              A IA evita movimentos desnecessários e busca o posicionamento ideal, 
              sendo recompensada por movimentos curtos e precisos.
            </p>
          </div>
        </div>
        
        <div className={`code-block fade-in ${visibleElements.has(15) ? 'visible' : ''}`}>
          <span className="code-keyword">function</span> <span className="code-function">intelligentAIWithRealLearning</span>() {'{'}
          <br />
          &nbsp;&nbsp;<span className="code-comment">// Obter capacidades baseadas no aprendizado atual</span>
          <br />
          &nbsp;&nbsp;<span className="code-keyword">const</span> capabilities = learningSystem.getAICapabilities();
          <br />
          <br />
          &nbsp;&nbsp;<span className="code-comment">// Prever posição da bola com imprecisão controlada</span>
          <br />
          &nbsp;&nbsp;<span className="code-keyword">const</span> timeToReach = (paddle.x - ball.x) / ball.vx;
          <br />
          &nbsp;&nbsp;<span className="code-keyword">let</span> predictedY = ball.y + (ball.vy * timeToReach);
          <br />
          &nbsp;&nbsp;predictedY += (Math.random() - <span className="code-number">0.5</span>) * errorRange;
          <br />
          <br />
          &nbsp;&nbsp;<span className="code-comment">// Mover para posição predita com velocidade adaptativa</span>
          <br />
          &nbsp;&nbsp;paddle.y -= paddle.speed * capabilities.speed;
          <br />
          {'}'}
        </div>
      </section>

      {/* Game Section */}
      <section id="game" className="section">
        <h2 className="section-title">🎮 EXPERIMENTE O JOGO</h2>
        <div className={`card fade-in ${visibleElements.has(16) ? 'visible' : ''}`} style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-icon">🚀</div>
          <h3 className="card-title">Pronto para o Desafio?</h3>
          <p className="card-content" style={{ marginBottom: '30px' }}>
            Teste suas habilidades contra nossa IA inteligente. Observe como ela aprende e se adapta 
            ao seu estilo de jogo em tempo real. Quanto mais você joga, mais desafiadora ela fica!
          </p>
          <button onClick={onStartGame} className="cta-button neon-border" style={{ fontSize: '1.1rem' }}>
            🎯 JOGAR PONG COM IA
          </button>
          <div style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong>Controles:</strong> W/S para mover a raquete esquerda | Ative a IA para desafio máximo
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">
            Desenvolvido com ❤️ por <strong>Giovanna Penido</strong>
          </p>
          <p className="footer-text">
            Sistema de aprendizado gradual baseado em fitness score e métricas múltiplas
          </p>
        </div>
      </footer>
    </div>
  );
}

// Componente auxiliar para animação dos números
function MetricCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const incrementTime = 30;
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      }
    }, duration / end);

    return () => clearInterval(timer);
  }, [value]);

  return <div className="metric-value">{count}%</div>;
}