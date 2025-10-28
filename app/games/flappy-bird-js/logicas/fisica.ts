import Matter from "matter-js";

// Módulo de física traduzido: cria engine, render e runner do Matter.js
// Exporta função que inicia o render/runner e retorna os objetos criados

const { Engine, Render, Runner } = Matter;

export function criarMotorERender(element: HTMLElement | null, largura: number, altura: number) {
  if (!element) throw new Error("criarMotorERender: element é nulo");
  const engine = Engine.create();
  const render = Render.create({
    element,
    engine,
    options: {
      width: largura,
      height: altura,
      wireframes: false,
    },
  });
  const runner = Runner.create();
  // inicia render e runner
  Render.run(render);
  Runner.run(runner, engine);
  return { engine, render, runner };
}
