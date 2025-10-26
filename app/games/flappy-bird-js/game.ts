import Matter from "matter-js";
import type { RefObject } from "react";

import birdTexture from "./assets/bird.png"
import backgroundTexture from "./assets/background-day.png"
import pipeTextureTop from "./assets/pipe-green-top.png"
import pipeTextureBottom from "./assets/pipe-green-bottom.png"

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
interface EntradaRede {
  distanciaCano: number;
  canoY: number;
  velocidadePassaro: number;
  passaroY: number;
  pesos: number[];
}

// Cada gene é um array de 88 bits (4x22 bits)
interface Individuo {
  corpo: Matter.Body;
  genes: boolean[]; // 88 bits
  tempo: number;
  estaVivo: boolean;
}

// --- Helpers para conversão bits <-> número ---
const GENE_BITS = 22;
const NUM_GENES = 4;
const TOTAL_BITS = GENE_BITS * NUM_GENES;

// Converte 22 bits (boolean[]) para número no range [-1, 1]
function bitsParaNumero(bits: boolean[]): number {
  if (bits.length !== GENE_BITS) throw new Error("bitsParaNumero: tamanho incorreto");
  // Interpreta como inteiro não-sinalizado
  let val = 0;
  for (let i = 0; i < GENE_BITS; i++) {
    if (bits[i]) val |= (1 << (GENE_BITS - 1 - i));
  }
  // Normaliza para [0, 1]
  const norm = val / ((1 << GENE_BITS) - 1);
  // Mapeia para [-1, 1]
  return norm * 2 - 1;
}

// Converte número no range [-1, 1] para 22 bits (boolean[])
function numeroParaBits(num: number): boolean[] {
  // Garante range
  const clamped = Math.max(-1, Math.min(1, num));
  // Normaliza para [0, 1]
  const norm = (clamped + 1) / 2;
  // Converte para inteiro
  const val = Math.round(norm * ((1 << GENE_BITS) - 1));
  // Para cada bit
  const bits: boolean[] = [];
  for (let i = GENE_BITS - 1; i >= 0; i--) {
    bits.push(Boolean((val >> i) & 1));
  }
  return bits;
}

// --- Constantes de configuração ---
const TEMPO_TREINAMENTO = 30 * 1000;
const TAMANHO_POPULACAO = 1000;
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
 * - Mantém o estado do motor Matter.js
 * - Cria e gerencia a população de indivíduos (agentes)
 * - Fornece um método de limpeza (stop) para desacoplar do componente React
 */
class FlappyGame {
  private containerRef: RefObject<HTMLDivElement | null>;
  private engine: Matter.Engine;
  private render: Matter.Render;
  private runner: Matter.Runner;
  private categoriaJogador = 0x0001;
  private categoriaObstaculo = 0x0002;
  private canoSuperior!: Matter.Body;
  private canoInferior!: Matter.Body;
  private populacao: Individuo[] = [];
  private ciclos = 1;
  private pontos = 0;

  constructor(containerRef: RefObject<HTMLDivElement | null>) {
    this.containerRef = containerRef;

    if (!containerRef?.current) {
      throw new Error("containerRef is null. Provide a mounted div reference.");
    }

    // Cria engine e render
    this.engine = Engine.create();
    this.render = Render.create({
      element: containerRef.current,
      engine: this.engine,
      options: {
        width: LARGURA_CANVAS,
        height: ALTURA_CANVAS,
        background: backgroundTexture, // background sprite
        wireframes: false
      },
    });

    this.runner = Runner.create();

    // Inicializa o mundo e os objetos
    this.initWorld();
    this.start();

    console.log("FlappyGame: iniciado");
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

    Render.run(this.render);
    Runner.run(this.runner, this.engine);

    // cria população inicial
    for (let i = 0; i < TAMANHO_POPULACAO; i++) {
      this.criarIndividuo();
    }

    // Eventos do motor
    Events.on(this.engine, "beforeUpdate", (evt) => this.loop(evt));
    Events.on(this.engine, "collisionStart", (evt) => this.tratarColisao(evt));

    // Conecta controle de escala de tempo (se existir no DOM)
    const escalaEl = document.getElementById("escalaTempo") as HTMLInputElement | null;
    if (escalaEl) {
      escalaEl.onchange = (e) => {
        e.preventDefault();
        const value = parseInt(escalaEl.value || "0");
        this.engine.timing.timeScale = 10 * value / 100;
        console.log("FlappyGame: timeScale alterado ->", this.engine.timing.timeScale);
      };
    }

    // posiciona os canos inicialmente
    this.reiniciarCano();
  }

  // Inicia o loop (já ligado nos eventos do engine)
  private start() {
    console.log("FlappyGame: start runner e render");
  }

  // Para e limpa o jogo
  public stop() {
    console.log("FlappyGame: parando jogo e limpando recursos");
    Events.off(this.engine, "beforeUpdate");
    Events.off(this.engine, "collisionStart");
    Engine.clear(this.engine);
    Render.stop(this.render);
    Runner.stop(this.runner);
    try { this.render.canvas.remove(); } catch { /* canvas pode já ter sido removido */ }
    // limpa texturas caso existam
    // @ts-ignore - matter-js internal
    this.render.textures = {};
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

    // Move canos
    Body.setVelocity(this.canoInferior, { x: -2 * ESCALA, y: 0 });
    Body.setVelocity(this.canoSuperior, { x: -2 * ESCALA, y: 0 });

    // Quando passar do limite, reposiciona e conta ponto
    if (this.canoInferior.position.x < PIPE_WIDTH) {
      this.reiniciarCano();
      this.pontos++;
      this.setTextById("pontos", String(this.pontos));
      console.log("FlappyGame: cano passou -> pontos", this.pontos);
    }

    // Remove indivíduos fora do Y visível
    this.populacao.filter(i => i.estaVivo).forEach(i => {
      if (i.corpo.position.y > ALTURA_CANVAS || i.corpo.position.y < 0) {
        this.removerIndividuo(i);
      }
    });

    // Atualiza tempo de sobrevivência para aptidão
    this.populacao
      .filter(i => i.estaVivo)
      .forEach(i => i.tempo = evento.timestamp);

    // Decisão de pulo para cada indivíduo
    this.populacao.forEach((individuo) => {
      const devePular = this.individuoDevePular(individuo);
      if (devePular) this.pular(individuo.corpo);
    });

    // Se todos morreram, evolui população
    const todosMortos = this.populacao.every(i => !i.estaVivo);
    if (todosMortos) {
      console.log("FlappyGame: todos mortos - gerando nova população (ciclo)");
      this.pontos = 0;
      this.setTextById("pontos", String(this.pontos));
      this.ciclos++;
      this.reiniciarCano();

      // Remove qualquer corpo remanescente dos vivos
      this.populacao.filter(i => i.estaVivo).forEach(i => this.removerIndividuo(i));

      this.populacao = this.novaPopulacao();
    }
  }

  // --- Colisão: marca indivíduo como morto ---
  private tratarColisao(evento: Matter.IEventCollision<Matter.Engine>) {
    evento.pairs.forEach((par) => {
      const corpo = par.bodyB;
      const individuo = this.populacao.find((ind) => ind.corpo === corpo);
      if (individuo) {
        console.log("FlappyGame: colisão detectada - removendo individuo");
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
      const genes = this.cruzar(ind1, ind2);
      nova.push(this.criarIndividuo(genes));
    }

    console.log("FlappyGame: nova população gerada");
    return nova;
  }

  private cruzar(ind1: Individuo, ind2: Individuo): boolean[] {
    const novosGenes: boolean[] = [];
    for (let i = 0; i < TOTAL_BITS; i++) {
      const p = Math.random();
      if (p < 0.45) novosGenes.push(ind1.genes[i]);
      else if (p < 0.9) novosGenes.push(ind2.genes[i]);
      else novosGenes.push(Math.random() < 0.5); // mutação aleatória
    }
      return novosGenes;
  }

  // Reposiciona os canos com altura aleatória
  private reiniciarCano() {
    const alturaAleatoria = this.obterAleatorio(25 + INTERVALO_CANO/2, ALTURA_CANVAS - (25 + INTERVALO_CANO/2));
    Body.setPosition(this.canoSuperior, { y: alturaAleatoria - PIPE_HEIGHT/2 - INTERVALO_CANO/2, x: LARGURA_CANVAS + (PIPE_WIDTH/2) });
    Body.setPosition(this.canoInferior, { y: alturaAleatoria + PIPE_HEIGHT/2 + INTERVALO_CANO/2, x: LARGURA_CANVAS + (PIPE_WIDTH/2) });
    Body.setVelocity(this.canoSuperior, { x: 0, y: 0 });
    Body.setVelocity(this.canoInferior, { x: 0, y: 0 });
    console.log("FlappyGame: canos reiniciados, altura", alturaAleatoria);
  }

  private pular(corpo: Matter.Body) {
    Body.setVelocity(corpo, { x: corpo.velocity.x, y: -4 * ESCALA });
  }

  private obterAleatorio(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Decisão do agente usando um perceptron simples
  private individuoDevePular(individuo: Individuo) {
    const distanciaCano = this.canoInferior.position.x;
    const canoY = this.canoInferior.position.y + 300;
    const velocidadePassaro = individuo.corpo.velocity.y;
    const passaroY = individuo.corpo.position.y;

    // escreve dados na UI apenas para o primeiro indivíduo (para inspeção)
    if (this.populacao.findIndex(indi => indi === individuo) === 0) {
      this.setTextById("distanciaCano", String(distanciaCano));
      this.setTextById("canoY", String(canoY));
      this.setTextById("velocidadePassaro", String(velocidadePassaro));
      this.setTextById("passaroY", String(passaroY));
      this.setTextById("tempo", String(individuo.tempo));
    }

    // Extrai 4 números dos 88 bits
    const pesos: number[] = [];
    for (let i = 0; i < NUM_GENES; i++) {
      const bits = individuo.genes.slice(i * GENE_BITS, (i + 1) * GENE_BITS);
      pesos.push(bitsParaNumero(bits));
    }
    return this.calcularPulo({ distanciaCano, canoY, velocidadePassaro, passaroY, pesos });
  }

  private calcularPulo({ distanciaCano, canoY, velocidadePassaro, passaroY, pesos }: EntradaRede) {
    const entradas = [distanciaCano, canoY, velocidadePassaro, passaroY];
    const soma = entradas.reduce((acc, entrada, index) => acc + entrada * pesos[index], 0);
    return soma >= 0;
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
  }

  // Helper para atualizar texto em labels se existirem
  private setTextById(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }
}

/**
 * Função de conveniência usada pelo componente React: cria FlappyGame e retorna
 * uma função de limpeza para parar/limpar quando o componente desmonta.
 */
export function iniciar(containerRef: RefObject<HTMLDivElement | null>) {
  const jogo = new FlappyGame(containerRef);
  return () => jogo.stop();
}

