"use client";
import Matter from "matter-js";

const {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Render,
  Runner,
} = Matter;

import { useEffect, useRef } from "react";

export default function Jogo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finalizar = iniciar(containerRef!);

    return () => finalizar();
  }, [containerRef]);

  return (
    <div className="flex flex-col items-center p-4 space-y-4 bg-gray-100 min-h-screen text-black">
      <h1 className="text-xxl font-semibold ">Flappy Bird</h1>

      <div ref={containerRef} className="w-full bg-white shadow-md rounded-md flex justify-center items-center" />
      <div>
        <p className="text-lg font-semibold">Distância do Cano: <label id="distanciaCano" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Y do Cano: <label id="canoY" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Velocidade do Pássaro: <label id="velocidadePassaro" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Y do Pássaro: <label id="passaroY" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Tempo: <label id="tempo" className="font-normal"></label></p>
        <p className="text-lg font-semibold">PONTOS: <label id="pontos" className="font-bold text-green-600"></label></p>
        <div className="flex items-center space-x-2">
          <label htmlFor="escalaTempo" className="text-lg font-semibold">Escala de Tempo:</label>
          <input type="range" id="escalaTempo" className="w-64" />
        </div>
      </div>
      <div ref={containerRef} className="w-full bg-white shadow-md rounded-md flex justify-center items-center" />
      <div className="text-sm text-gray-700 leading-relaxed">
        Este código implementa um agente treinado para jogar Flappy Bird utilizando um perceptron de uma camada e um algoritmo genético. O agente é representado por indivíduos em uma população, onde cada indivíduo possui um conjunto de genes que define seu comportamento. A cada ciclo, os indivíduos tomam decisões baseadas em entradas do ambiente e são avaliados com base em seu desempenho.

        <br /><br />
        <strong>Estrutura do Código:</strong>
        <br />
        O código utiliza a biblioteca Matter.js para simular a física do jogo. Por exemplo, os canos e os pássaros são representados como corpos físicos:
        <textarea readOnly className="w-full bg-gray-200 p-2 rounded-md mt-2">
          {`const canoInferior = Bodies.rectangle(50, 50, 50, 400, { ... });
const canoSuperior = Bodies.rectangle(50, 50, 50, 400, { ... });`}
        </textarea>
        Esses corpos são adicionados ao mundo da simulação:
        <textarea readOnly className="w-full bg-gray-200 p-2 rounded-md mt-2">
          {`Composite.add(motor.world, [canoInferior, canoSuperior]);`}
        </textarea>

        <br /><br />
        <strong>Decisão do Agente:</strong>
        <br />
        Cada indivíduo decide se deve "pular" com base em um perceptron de uma camada. As entradas para o perceptron incluem a distância do cano, a posição do cano, a velocidade do pássaro e a posição do pássaro:
        <textarea readOnly className="w-full bg-gray-200 p-2 rounded-md mt-2">
          {`const entradas = [distanciaCano, canoY, velocidadePassaro, passaroY];
const soma = entradas.reduce((acc, entrada, index) => acc + entrada * pesos[index], 0);
return soma >= 0;`}
        </textarea>
        Se a soma ponderada das entradas for maior ou igual a zero, o agente decide pular.

        <br /><br />
        <strong>Algoritmo Genético:</strong>
        <br />
        Após cada ciclo, os indivíduos são avaliados com base em seu tempo de sobrevivência:
        <textarea readOnly className="w-full bg-gray-200 p-2 rounded-md mt-2">
          {`function obterFitness(individuo) { return individuo.tempo - TEMPO_TREINAMENTO; }`}
        </textarea>
        Os indivíduos mais aptos são selecionados para reprodução, e novos indivíduos são criados por cruzamento e mutação:
        <textarea readOnly className="w-full bg-gray-200 p-2 rounded-md mt-2">
          {`const novosGenes = cruzar(ind1, ind2);
novaPopulacao.push(criarIndividuo(novosGenes));`}
        </textarea>

        <br /><br />
        <strong>Treinamento e Evolução:</strong>
        <br />
        O treinamento ocorre ao longo de múltiplos ciclos. Quando todos os indivíduos morrem, uma nova população é gerada:
        <textarea readOnly className="w-full bg-gray-200 p-2 rounded-md mt-2">
          {`if (todosMortos) { populacao = novaPopulacao(); }`}
        </textarea>
        Isso permite que o algoritmo genético refine os genes dos indivíduos ao longo do tempo.

        <br /><br />
        <strong>Interatividade:</strong>
        <br />
        O código também permite ajustar a escala de tempo da simulação:
        <textarea readOnly className="w-full bg-gray-200 p-2 rounded-md mt-2">
          {`motor.timing.timeScale = 10 * parseInt(entrada.value) / 100;`}
        </textarea>
        Além disso, informações como a distância do cano e a posição do pássaro são exibidas na interface para facilitar a análise do comportamento do agente.
      </div>
    </div>
  );
}


function iniciar(containerRef: React.RefObject<HTMLDivElement | null>) {
  interface EntradaRede {
    distanciaCano: number;
    canoY: number;
    velocidadePassaro: number;
    passaroY: number;
    pesos: number[];
  }

  interface Individuo {
    corpo: Matter.Body;
    genes: number[];
    tempo: number;
    estaVivo: boolean;
  }

  const TEMPO_TREINAMENTO = 30 * 1000;
  const TAMANHO_POPULACAO = 1000;
  const ESCALA = 1;

  const motor = Engine.create();
  const renderizador = Render.create({
    element: containerRef.current!,
    engine: motor,
    options: {
      width: 500,
      height: 500,
    },
  });

  const categoriaJogador = 0x0001;
  const categoriaObstaculo = 0x0002;

  const canoInferior = Bodies.rectangle(50, 50, 50, 400, {
    inertia: Infinity,
    friction: 0,
    collisionFilter: { category: categoriaObstaculo },
    label: "obstaculo",
  });

  const canoSuperior = Bodies.rectangle(50, 50, 50, 400, {
    inertia: Infinity,
    friction: 0,
    label: "obstaculo",
    collisionFilter: { category: categoriaObstaculo },
  });

  motor.gravity.scale = 0;

  Composite.add(motor.world, [canoInferior, canoSuperior]);

  Render.run(renderizador);

  const executor = Runner.create();
  Runner.run(executor, motor);

  reiniciar();

  let populacao: Individuo[] = [];

  Array.from({ length: TAMANHO_POPULACAO }).forEach((_) => criarIndividuo());

  let ciclos = 1;
  let pontos = 0;

  Events.on(motor, "beforeUpdate", loop);
  Events.on(motor, "collisionStart", tratarColisao);

  document.getElementById("escalaTempo")!.onchange = (evento) => {
    evento.preventDefault();
    const entrada: HTMLInputElement = document.getElementById("escalaTempo")! as HTMLInputElement;

    motor.timing.timeScale = 10 * parseInt(entrada.value) / 100;
  }

  function tratarColisao(evento: Matter.IEventCollision<Matter.Engine>) {
    evento.pairs.forEach((par) => {
      const corpo = par.bodyB;
      const individuo = populacao.find(
        (individuo) => individuo.corpo === corpo
      );

      if (individuo) removerIndividuo(individuo);
    });
  }

  function loop(evento: Matter.IEventTimestamped<Matter.Engine>) {
    populacao.forEach((individuo) => {
      Body.applyForce(individuo.corpo, individuo.corpo.position, {
        x: 0,
        y: individuo.corpo.mass * 0.001 * ESCALA,
      });
    });

    Body.setVelocity(canoSuperior, { x: -2 * ESCALA, y: 0 });
    Body.setVelocity(canoInferior, { x: -2 * ESCALA, y: 0 });

    if (canoSuperior.position.x < 50) {
      reiniciar();

      document.getElementById("pontos")!.innerText = (++pontos).toString();
    }

    populacao.filter(individuo => individuo.estaVivo).forEach(individuo => {
      if (individuo.corpo.position.y > 500 || individuo.corpo.position.y < 0) {
        removerIndividuo(individuo)
      }
    })

    populacao
      .filter(individuo => individuo.estaVivo)
      .forEach(individuo => individuo.tempo = evento.timestamp)

    populacao.forEach((individuo) => {
      const devePular = individuoDevePular(individuo);

      if (devePular) pular(individuo.corpo);
    });

    const todosMortos = populacao.every(individuo => !individuo.estaVivo);

    if (todosMortos) {
      console.log("ciclo")
      pontos = 0;
      document.getElementById("pontos")!.innerText = (pontos).toString();
      ciclos++;
      reiniciar();

      populacao
        .filter((individuo) => individuo.estaVivo)
        .forEach((individuo) => removerIndividuo(individuo));

      populacao = novaPopulacao();
    }
  }

  function novaPopulacao() {
    const ordenados = populacao.toSorted((a, b) => obterFitness(b) - obterFitness(a));

    const maisAptos = Math.floor(TAMANHO_POPULACAO * 0.1);

    const novaPopulacao = [];

    Array.from({ length: maisAptos }).forEach((_, index) => novaPopulacao.push(criarIndividuo(ordenados[index].genes)));

    for (let i = 0; i < TAMANHO_POPULACAO - maisAptos; i++) {
      const r1 = obterAleatorio(0, Math.floor(TAMANHO_POPULACAO * 0.5));
      const ind1 = ordenados[r1];

      const r2 = obterAleatorio(0, Math.floor(TAMANHO_POPULACAO * 0.5));
      const ind2 = ordenados[r2];

      const novosGenes = cruzar(ind1, ind2);

      novaPopulacao.push(criarIndividuo(novosGenes));
    }

    return novaPopulacao;
  }

  function cruzar(individuo1: Individuo, individuo2: Individuo): number[] {
    const novosGenes = [];

    for (let i = 0; i < 4; i++) {
      let p = Math.random();
      if (p < 0.45) novosGenes.push(individuo1.genes[i]);
      else if (p < 0.9) novosGenes.push(individuo2.genes[i]);
      else novosGenes.push(obterAleatorio(-1, 1));
    }

    return novosGenes;
  }

  function reiniciar() {
    const alturaAleatoria = obterAleatorio(125, 375);

    Body.setPosition(canoSuperior, { y: alturaAleatoria + 300, x: 525 });
    Body.setPosition(canoInferior, { y: alturaAleatoria - 300, x: 525 });

    Body.setVelocity(canoSuperior, { x: 0, y: 0 });
    Body.setVelocity(canoInferior, { x: 0, y: 0 });
  }

  function pular(corpo: Matter.Body) {
    Body.setVelocity(corpo, { x: corpo.velocity.x, y: -4 * ESCALA });
  }

  function obterAleatorio(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  function individuoDevePular(individuo: Individuo) {
    const distanciaCano = canoSuperior.position.x;
    const canoY = canoSuperior.position.y + 300;
    const velocidadePassaro = individuo.corpo.velocity.y;
    const passaroY = individuo.corpo.position.y;

    if (populacao.findIndex(indi => indi === individuo) === 0) {
      document.getElementById("distanciaCano")!.innerText = distanciaCano.toString();
      document.getElementById("canoY")!.innerText = canoY.toString();
      document.getElementById("velocidadePassaro")!.innerText = velocidadePassaro.toString();
      document.getElementById("passaroY")!.innerText = passaroY.toString();
      document.getElementById("tempo")!.innerText = individuo.tempo.toString();
    }

    const devePular = calcularPulo({
      distanciaCano,
      canoY,
      velocidadePassaro,
      passaroY,
      pesos: individuo.genes,
    });

    return devePular;
  }

  function calcularPulo({
    distanciaCano,
    canoY,
    velocidadePassaro,
    passaroY,
    pesos,
  }: EntradaRede) {
    const entradas = [distanciaCano, canoY, velocidadePassaro, passaroY];

    const soma = entradas.reduce(
      (acc, entrada, index) => acc + entrada * pesos[index],
      0
    );

    return soma >= 0;
  }

  function criarIndividuo(genes1?: number[]): Individuo {
    const corpo = Bodies.rectangle(50, 50, 50, 50, {
      inertia: Infinity,
      collisionFilter: { category: categoriaJogador, group: -1 },
      label: "individuo",
      render: {
        sprite: {
          texture: './assets/passaro.png',
          xScale: 1,
          yScale: 1
        }
      }
    });

    Composite.add(motor.world, [corpo]);

    const genes = [];

    genes.push(obterAleatorio(-1, 1));
    genes.push(obterAleatorio(-1, 1));
    genes.push(obterAleatorio(-1, 1));
    genes.push(obterAleatorio(-1, 1));

    const individuo = { corpo, genes: genes1 || genes, tempo: 0, estaVivo: true };

    populacao.push(individuo);

    return individuo;
  }

  function obterFitness(individuo: Individuo) {
    return individuo.tempo - TEMPO_TREINAMENTO;
  }

  function removerIndividuo(individuo: Individuo) {
    individuo.estaVivo = false;

    Composite.remove(motor.world, [individuo.corpo]);
  }

  return () => {
    Engine.clear(motor);
    Render.stop(renderizador);
    Runner.stop(executor);
    renderizador.canvas.remove();
    renderizador.textures = {};
  }
}