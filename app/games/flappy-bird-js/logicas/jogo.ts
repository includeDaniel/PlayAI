import Matter from "matter-js";
import type { RefObject } from "react";

import birdTexture from "../assets/bird.png"
import blueBirdTexture from "../assets/blue-bird.png"
import backgroundTexture from "../assets/background-day.png"
import pipeTextureTop from "../assets/pipe-green-top.png"
import pipeTextureBottom from "../assets/pipe-green-bottom.png"
import { criarMotorERender } from "./fisica";
import type { Genes } from "./ia";
import { cruzarGenes, calcularPuloPorGenes, extrairPesos, TOTAL_BITS } from "./ia";

const {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Render,
  Runner,
} = Matter;

// --- Tipos ---
interface Individuo {
  corpo: Matter.Body;
  genes: Genes; // 88 bits
  tempo: number;
  estaVivo: boolean;
}

// --- Constantes de configuração ---
const TEMPO_TREINAMENTO = 30 * 1000;
const TAMANHO_POPULACAO = 100;
const ESCALA = 1;
const LARGURA_CANVAS = 500;
const ALTURA_CANVAS = 320 + 125;

// Dimensões dos sprites/corpos
const PIPE_WIDTH = 50;
const PIPE_HEIGHT = 320;
const BIRD_WIDTH = 52;
const BIRD_HEIGHT = 24;
const INTERVALO_CANO = 100;

/**
 * Classe que encapsula toda a lógica do jogo Flappy Bird.
 * Traduzida para PT-BR com comentários e nomes em português.
 */
class JogoFlappy {
  private containerRef: RefObject<HTMLDivElement | null>;
  private engine: Matter.Engine;
  private render: Matter.Render;
  private runner: Matter.Runner;
  private categoriaJogador = 0x0001;
  private categoriaObstaculo = 0x0002;
  private canoSuperior!: Matter.Body;
  private canoInferior!: Matter.Body;
  private canoAlturaCentro: number = 0;
  private populacao: Individuo[] = [];
  private ciclos = 0;
  private pontos = 0;
  // Indivíduo observado pela UI (mostrado com textura diferente)
  private observadoIndividuo: Individuo | null = null;
  // listeners para notificações de pesos do indivíduo observado
  private observedPesosListeners: Set<(pesos: number[] | null) => void> = new Set();
  // Timestamp de início da geração (usado para calcular tempo de vida relativo)
  private geracaoInicioTimestamp = 0;

  constructor(containerRef: RefObject<HTMLDivElement | null>) {
    this.containerRef = containerRef;

    if (!containerRef?.current) {
      throw new Error("containerRef é nulo. Forneça uma div montada.");
    }

    // Cria motor, render e runner via módulo de física (inicia render/runner)
    const ctx = criarMotorERender(containerRef.current, LARGURA_CANVAS, ALTURA_CANVAS);
    this.engine = ctx.engine;
    this.render = ctx.render;
    this.runner = ctx.runner;
    // aplica fundo (createEngineAndRender setou wireframes:false mas não background)
    if (this.render && (this.render.options as any)) (this.render.options as any).background = backgroundTexture;

    // Inicializa o mundo e os objetos
    this.initWorld();
    this.start();

    console.log("JogoFlappy: iniciado");
  }

  // Inicializa canos, gravidade e adiciona ao mundo
  private initWorld() {
    // Cano superior (pipe)
    this.canoSuperior = Bodies.rectangle(50, 50, PIPE_WIDTH, PIPE_HEIGHT, {
      inertia: Infinity,
      friction: 0,
      collisionFilter: { category: this.categoriaObstaculo },
      label: "obstaculo",
      render: {
        sprite: {
          texture: pipeTextureTop,
          xScale: 1,
          yScale: 1,
        },
      },
    });

    // Cano inferior (pipe, invertido)
    this.canoInferior = Bodies.rectangle(50, 50, PIPE_WIDTH, PIPE_HEIGHT, {
      inertia: Infinity,
      friction: 0,
      label: "obstaculo",
      collisionFilter: { category: this.categoriaObstaculo },
      render: {
        sprite: {
          texture: pipeTextureBottom,
          xScale: 1,
          yScale: 1,
        },
      },
    });

    this.engine.gravity.scale = 0;

    Composite.add(this.engine.world, [this.canoSuperior, this.canoInferior]);

    // cria população inicial
    for (let i = 0; i < TAMANHO_POPULACAO; i++) {
      this.criarIndividuo();
    }

    // seleciona um indivíduo observado para a UI
    this.selecionarProximoObservado();

    // Eventos do motor
    Events.on(this.engine, "beforeUpdate", (evt) => this.loop(evt));
    Events.on(this.engine, "collisionStart", (evt) => this.tratarColisao(evt));

    // Controle de teclado para ajuste de timeScale (não exposto na UI)
    window.addEventListener("keydown", this.handleTimeScaleKey);

    // posiciona os canos inicialmente
    this.reiniciarCano();

    // inicializa UI com pontos 0
    this.setTextById("pontos", "0");
    // inicializa UI com geração atual
    this.setTextById("geracao", String(this.ciclos));
  }

  // Inicia o loop (já ligado nos eventos do engine)
  private start() {
    console.log("JogoFlappy: start runner e render");
  }

  // Para e limpa o jogo
  public stop() {
    console.log("JogoFlappy: parando jogo e limpando recursos");
    Events.off(this.engine, "beforeUpdate");
    Events.off(this.engine, "collisionStart");
    window.removeEventListener("keydown", this.handleTimeScaleKey);
    Engine.clear(this.engine);
    Render.stop(this.render);
    Runner.stop(this.runner);
    try { this.render.canvas.remove(); } catch { /* canvas pode já ter sido removido */ }
    // limpa texturas caso existam
    // @ts-ignore - matter-js internal
    this.render.textures = {};
  }

  // Key handler para ajuste de timeScale
  private handleTimeScaleKey = (e: KeyboardEvent) => {
    if (!e) return;
    const key = e.key;
    if (key === "+" || key === "=") {
      this.adjustTimeScale(0.25);
    } else if (key === "-") {
      this.adjustTimeScale(-0.25);
    } else if (key === "0") {
      this.setTimeScale(1);
    }
  };

  // API programática para set/get/adjust timeScale
  public setTimeScale(value: number) {
    const clamped = Number(value) || 1;
    this.engine.timing.timeScale = clamped;
    console.log("JogoFlappy: timeScale set ->", this.engine.timing.timeScale);
  }

  public getTimeScale() {
    return this.engine.timing.timeScale;
  }

  // Reseta o contador de gerações para 1 e atualiza a UI
  public resetGeracao() {
    this.ciclos = 1;
    this.setTextById("geracao", String(this.ciclos));
  }

  public adjustTimeScale(delta: number) {
    const next = Math.max(0.01, (this.engine.timing.timeScale || 1) + delta);
    this.setTimeScale(Number(next.toFixed(2)));
  }

  // --- Loop principal do jogo chamado antes de cada atualização ---
  private loop(evento: Matter.IEventTimestamped<Matter.Engine>) {
    // Aplica força gravitacional simples a cada indivíduo
    this.populacao.forEach((individuo) => {
      Body.applyForce(individuo.corpo, individuo.corpo.position, {
        x: 0,
        y: individuo.corpo.mass * 0.001 * ESCALA,
      });
    });

    // Move canos (apenas velocidade X)
    Body.setVelocity(this.canoInferior, { x: -2 * ESCALA, y: 0 });
    Body.setVelocity(this.canoSuperior, { x: -2 * ESCALA, y: 0 });

    // Força os canos a manterem sua posição vertical (lock Y) enquanto permitem X
    try {
      const targetSuperiorY = this.canoAlturaCentro - PIPE_HEIGHT / 2 - INTERVALO_CANO / 2;
      const targetInferiorY = this.canoAlturaCentro + PIPE_HEIGHT / 2 + INTERVALO_CANO / 2;
      Body.setPosition(this.canoSuperior, { x: this.canoSuperior.position.x, y: targetSuperiorY });
      Body.setPosition(this.canoInferior, { x: this.canoInferior.position.x, y: targetInferiorY });
      // Garante velocidade Y zero para evitar jitter
      Body.setVelocity(this.canoSuperior, { x: this.canoSuperior.velocity.x, y: 0 });
      Body.setVelocity(this.canoInferior, { x: this.canoInferior.velocity.x, y: 0 });
    } catch { }

    // Quando passar do limite, reposiciona e conta ponto
    if (this.canoInferior.position.x < PIPE_WIDTH) {
      this.reiniciarCano();
      this.pontos++;
      this.setTextById("pontos", String(this.pontos));
      console.log("JogoFlappy: cano passou -> pontos", this.pontos);
    }

    // Remove indivíduos fora do Y visível
    this.populacao.filter(i => i.estaVivo).forEach(i => {
      if (i.corpo.position.y > ALTURA_CANVAS || i.corpo.position.y < 0) {
        this.removerIndividuo(i);
      }
    });

    // Inicializa o timestamp de início da geração na primeira atualização
    if (this.geracaoInicioTimestamp === 0) this.geracaoInicioTimestamp = evento.timestamp;

    // Atualiza tempo de sobrevivência (relativo ao início da geração)
    this.populacao
      .filter(i => i.estaVivo)
      .forEach(i => i.tempo = evento.timestamp - this.geracaoInicioTimestamp);

    // Decisão de pulo para cada indivíduo
    let observedInputs: number[] | null = null;
    this.populacao.forEach((individuo) => {
      // Entradas para o perceptron
      const distanciaCano = this.canoInferior.position.x;
      const canoY = this.canoInferior.position.y - (PIPE_HEIGHT / 2 + INTERVALO_CANO / 2);
      const velocidadePassaro = individuo.corpo.velocity.y;
      const passaroY = individuo.corpo.position.y;
      const devePular = calcularPuloPorGenes(distanciaCano, canoY, velocidadePassaro, passaroY, individuo.genes);
      if (devePular) this.pular(individuo.corpo);
      // Se é o observado, armazena para UI
      if (this.observadoIndividuo && individuo === this.observadoIndividuo) {
        observedInputs = [distanciaCano, canoY, velocidadePassaro, passaroY];
      }
    });

    // Atualiza labels da UI para o indivíduo observado a cada tick
    if (this.observadoIndividuo && observedInputs) {
      this.setTextById("distanciaCano", this.formatNumber(observedInputs[0]));
      this.setTextById("canoY", this.formatNumber(observedInputs[1]));
      this.setTextById("velocidadePassaro", this.formatNumber(observedInputs[2]));
      this.setTextById("passaroY", this.formatNumber(observedInputs[3]));
      this.setTextById("tempo", this.formatTime(this.observadoIndividuo.tempo));
    }

    // Garante que o indivíduo observado esteja sempre desenhado por último (na frente)
    this.trazerObservadoFrente();

    // Se todos morreram, evolui população
    const todosMortos = this.populacao.every(i => !i.estaVivo);
    if (todosMortos) {
      console.log("JogoFlappy: todos mortos - gerando nova população (ciclo)");
      this.pontos = 0;
      this.setTextById("pontos", String(this.pontos));
      this.setTextById("geracao", String(this.ciclos))
      this.ciclos++;
      this.reiniciarCano();

      // Remove qualquer corpo remanescente dos vivos
      this.populacao.filter(i => i.estaVivo).forEach(i => this.removerIndividuo(i));

      this.populacao = this.novaPopulacao();
      // seleciona novo observado quando nova população é gerada
      this.selecionarProximoObservado();
      // reseta o tempo de vida relativo para a nova geração
      this.geracaoInicioTimestamp = evento.timestamp;
    }
  }

  // --- Colisão: marca indivíduo como morto ---
  private tratarColisao(evento: Matter.IEventCollision<Matter.Engine>) {
    evento.pairs.forEach((par) => {
      const corpo = par.bodyB;
      const individuo = this.populacao.find((ind) => ind.corpo === corpo);
      if (individuo) {
        console.log("JogoFlappy: colisão detectada - removendo individuo");
        this.removerIndividuo(individuo);
      }
    });
  }

  // --- Geração de nova população por seleção/crossover ---
  private novaPopulacao(): Individuo[] {
    const ordenados = this.populacao.toSorted((a, b) => this.obterFitness(b) - this.obterFitness(a));
    const maisAptos = Math.floor(TAMANHO_POPULACAO * 0.1);
    const nova: Individuo[] = [];

    // Mantém os melhores (copia os bits)
    for (let i = 0; i < maisAptos; i++) {
      nova.push(this.criarIndividuo([...ordenados[i].genes]));
    }

    // Preenche o resto com cruzamentos
    for (let i = 0; i < TAMANHO_POPULACAO - maisAptos; i++) {
      const r1 = Math.floor(this.obterAleatorio(0, Math.floor(TAMANHO_POPULACAO * 0.5)));
      const r2 = Math.floor(this.obterAleatorio(0, Math.floor(TAMANHO_POPULACAO * 0.5)));
      const ind1 = ordenados[r1];
      const ind2 = ordenados[r2];
      const genes = cruzarGenes(ind1.genes, ind2.genes);
      nova.push(this.criarIndividuo(genes));
    }

    console.log("JogoFlappy: nova população gerada");
    return nova;
  }

  // Reposiciona os canos com altura aleatória
  private reiniciarCano() {
    const alturaAleatoria = this.obterAleatorio(25 + INTERVALO_CANO / 2, ALTURA_CANVAS - (25 + INTERVALO_CANO / 2));
    this.canoAlturaCentro = alturaAleatoria;
    Body.setPosition(this.canoSuperior, { y: alturaAleatoria - PIPE_HEIGHT / 2 - INTERVALO_CANO / 2, x: LARGURA_CANVAS + (PIPE_WIDTH / 2) });
    Body.setPosition(this.canoInferior, { y: alturaAleatoria + PIPE_HEIGHT / 2 + INTERVALO_CANO / 2, x: LARGURA_CANVAS + (PIPE_WIDTH / 2) });
    Body.setVelocity(this.canoSuperior, { x: 0, y: 0 });
    Body.setVelocity(this.canoInferior, { x: 0, y: 0 });
    console.log("JogoFlappy: canos reiniciados, altura", alturaAleatoria);
  }

  private pular(corpo: Matter.Body) {
    Body.setVelocity(corpo, { x: corpo.velocity.x, y: -4 * ESCALA });
  }

  private obterAleatorio(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  private criarIndividuo(genes1?: boolean[]): Individuo {
    // Usa sprite do pássaro
    const corpo = Bodies.rectangle(50, 50, BIRD_WIDTH, BIRD_HEIGHT, {
      inertia: Infinity,
      collisionFilter: { category: this.categoriaJogador, group: -1 },
      label: "individuo",
      render: {
        sprite: {
          texture: birdTexture,
          xScale: 1,
          yScale: 1,
        },
      },
    });

    Composite.add(this.engine.world, [corpo]);

    let genes: boolean[];
    if (genes1) {
      genes = [...genes1];
    } else {
      // Gera 88 bits aleatórios
      genes = Array.from({ length: TOTAL_BITS }, () => Math.random() < 0.5);
    }

    const individuo: Individuo = { corpo, genes, tempo: 0, estaVivo: true };
    this.populacao.push(individuo);
    return individuo;
  }

  private obterFitness(individuo: Individuo) {
    return individuo.tempo - TEMPO_TREINAMENTO;
  }

  private removerIndividuo(individuo: Individuo) {
    individuo.estaVivo = false;
    Composite.remove(this.engine.world, [individuo.corpo]);
    // Se o indivíduo removido era o observado, seleciona outro vivo
    if (this.observadoIndividuo === individuo) {
      console.log("JogoFlappy: indivíduo observado morreu, selecionando próximo");
      this.selecionarProximoObservado();
    }
  }

  // Seleciona um indivíduo vivo para ser observado pela UI.
  // Atualiza a textura do antigo observado (volta à textura normal) e
  // aplica a textura `blueBirdTexture` ao novo observado.
  private selecionarProximoObservado() {
    // limpa textura do observado anterior, se existir
    if (this.observadoIndividuo) {
      try {
        (this.observadoIndividuo.corpo.render as any).sprite.texture = birdTexture;
      } catch { /* ignore */ }
    }

    const proximo = this.populacao.find(i => i.estaVivo) || null;
    this.observadoIndividuo = proximo;
    if (this.observadoIndividuo) {
      try {
        (this.observadoIndividuo.corpo.render as any).sprite.texture = blueBirdTexture;
      } catch { /* ignore */ }
      console.log("JogoFlappy: agora observando indivíduo", this.populacao.indexOf(this.observadoIndividuo));
    } else {
      console.log("JogoFlappy: nenhum indivíduo vivo para observar");
    }
    // notifica listeners sobre os pesos atuais do observado
    this.notifyObservedPesos();
  }

  // Notifica todos os listeners registrados com os pesos atuais (ou null)
  private notifyObservedPesos() {
    const pesos = this.getObservedPesos();
    this.observedPesosListeners.forEach(cb => {
      try { cb(pesos); } catch { /* ignore listener errors */ }
    });
  }

  // Permite que UI se inscreva para receber atualizações de pesos do observado
  public addObservedPesosListener(cb: (pesos: number[] | null) => void) {
    this.observedPesosListeners.add(cb);
    // envia o estado inicial imediatamente
    try { cb(this.getObservedPesos()); } catch { }
    return () => { this.observedPesosListeners.delete(cb); };
  }

  // Remove e readiciona o corpo do observado para que ele seja desenhado por último
  // (desenhado acima dos demais) no canvas do Matter.Render.
  private trazerObservadoFrente() {
    if (!this.observadoIndividuo) return;
    if (!this.observadoIndividuo.estaVivo) return;
    try {
      const world: any = this.engine.world;
      const bodies: Matter.Body[] = world.bodies as Matter.Body[] || [];
      if (bodies.length === 0) return;
      const ultimo = bodies[bodies.length - 1];
      if (ultimo === this.observadoIndividuo.corpo) return; // já está na frente
      // remover e readicionar move o corpo para o final do array de bodies
      Composite.remove(this.engine.world, this.observadoIndividuo.corpo);
      Composite.add(this.engine.world, this.observadoIndividuo.corpo);
    } catch (err) {
      console.log("JogoFlappy: erro ao trazer observado para frente", err);
    }
  }

  // Retorna os pesos (4 numbers) do indivíduo observado, ou null se não houver
  public getObservedPesos(): number[] | null {
    if (!this.observadoIndividuo) return null;
    try {
      return extrairPesos(this.observadoIndividuo.genes);
    } catch {
      return null;
    }
  }

  // Helper para atualizar texto em labels se existirem
  private setTextById(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }

  // Formata número com 2 casas decimais
  private formatNumber(n: number) {
    if (!isFinite(n)) return "0.00";
    return Number(n).toFixed(2);
  }

  // Formata tempo em milissegundos para mm:ss
  private formatTime(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${mm}:${ss}`;
  }
}

/**
 * Função de conveniência usada pelo componente React: cria JogoFlappy e retorna
 * uma função de limpeza para parar/limpar quando o componente desmonta.
 */
export function iniciar(containerRef: RefObject<HTMLDivElement | null>) {
  const jogo = new JogoFlappy(containerRef);
  return {
    stop: () => jogo.stop(),
    resetGeracao: () => jogo.resetGeracao(),
  };
}

// exporta tipo do controlador para consumidores
export type ControladorFlappy = ReturnType<typeof iniciar>;
