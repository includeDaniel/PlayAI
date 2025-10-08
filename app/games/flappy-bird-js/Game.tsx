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

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const f = game();

    return () => {
      f();
    };
  }, []);

  return <>
    <p>pipeDistance: <label id="pipeDistance"></label></p>
    <p>pipeY: <label id="pipeY"></label></p>
    <p>birdVelocity: <label id="birdVelocity"></label></p>
    <p>birdY: <label id="birdY"></label></p>
    <p>time: <label id="time"></label></p>
    <p>POINTS: <label id="points"></label></p>
    <p>timeScale: <input type="range" id="timeScale"></input></p>
    <div ref={containerRef} />
  </>;
}


function game() {
  interface NetInput {
    pipeDistance: number;
    pipeY: number;
    birdVelocity: number;
    birdY: number;
    weights: number[];
  }

  interface Individual {
    body: Matter.Body;
    genes: number[];
    time: number;
    isAlive: boolean;
  }

  const TRAINNING_TIME = 30 * 1000;
  const POPULATION_SIZE = 1000;
  const SCALE = 1;

  const engine = Engine.create();
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: 500,
      height: 500,
    },
  });

  const playerCategory = 0x0001;
  const obsCategory = 0x0002;

  const bot = Bodies.rectangle(50, 50, 50, 400, {
    inertia: Infinity,
    friction: 0,
    collisionFilter: { category: obsCategory },
    label: "obstacle",
  });

  const top = Bodies.rectangle(50, 50, 50, 400, {
    inertia: Infinity,
    friction: 0,
    label: "obstacle",
    collisionFilter: { category: obsCategory },
  });

  engine.gravity.scale = 0;

  Composite.add(engine.world, [bot, top]);

  Render.run(render);

  const runner = Runner.create();
  Runner.run(runner, engine);

  reset();

  let population: Individual[] = [];

  Array.from({ length: POPULATION_SIZE }).forEach((_) => createIndividual());

  let cycles = 1;
  let points = 0;
  let randomHeight = 0;

  Events.on(engine, "beforeUpdate", loop);
  Events.on(engine, "collisionStart", collisionHandler);

  document.getElementById("timeScale")!.onchange = (event) => {
    event.preventDefault();
    const input: HTMLInputElement = document.getElementById("timeScale")! as HTMLInputElement;

    engine.timing.timeScale = 10 * parseInt(input.value) / 100;
  }


  function collisionHandler(event: Matter.IEventCollision<Matter.Engine>) {
    event.pairs.forEach((pair) => {
      const body = pair.bodyB;
      const individual = population.find(
        (individual) => individual.body === body
      );

      if (individual) removeIndividual(individual);
    });
  }

  function loop(event: Matter.IEventTimestamped<Matter.Engine>) {
    population.forEach((individual) => {
      Body.applyForce(individual.body, individual.body.position, {
        x: 0,
        y: individual.body.mass * 0.001 * SCALE,
      });
    });

    Body.setVelocity(top, { x: -2 * SCALE, y: 0 });
    Body.setVelocity(bot, { x: -2 * SCALE, y: 0 });

    //Body.setPosition(top, { ...top.position, y:  })

    if (top.position.x < 50) {
      reset();

      document.getElementById("points")!.innerText = (++points).toString();
    }

    population.filter(individual => individual.isAlive).forEach(individual => {
      if (individual.body.position.y > 500 || individual.body.position.y < 0) {
        removeIndividual(individual)
      }
    })

    population
      .filter(individual => individual.isAlive)
      .forEach(individual => individual.time = event.timestamp)

    population.forEach((individual) => {
      const shouldJump = individualShouldJump(individual);

      if (shouldJump) jump(individual.body);
    });

    const isAllDead = population.every(individual => !individual.isAlive);

    if (isAllDead) {
      //ciclamos
      console.log("ciclo")
      points = 0;
      document.getElementById("points")!.innerText = (points).toString();
      cycles++;
      reset();

      // limpar: todo: tem jeito melhor
      population
        .filter((individual) => individual.isAlive)
        .forEach((individual) => removeIndividual(individual));

      population = getNewPopulation();
    }
  }

  function getRandomInt(min: number, max: number) {
    min = Math.ceil(min); // Ensure min is an integer
    max = Math.floor(max); // Ensure max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getNewPopulation() {
    const sorted = population.toSorted((a, b) => getFitness(b) - getFitness(a));

    const fittests = Math.floor(POPULATION_SIZE * 0.1);

    const newPopulation = [];

    Array.from({ length: fittests }).forEach((_, index) => newPopulation.push(createIndividual(sorted[index].genes)));

    for (let i = 0; i < POPULATION_SIZE - fittests; i++) {
      const r1 = getRandomInt(0, Math.floor(POPULATION_SIZE * 0.5));
      const ind1 = sorted[r1];

      const r2 = getRandomInt(0, Math.floor(POPULATION_SIZE * 0.5));
      const ind2 = sorted[r2];

      //mate
      const newGenes = mate(ind1, ind2);

      newPopulation.push(createIndividual(newGenes));
    }

    return newPopulation;
  }

  function mate(individual1: Individual, individual2: Individual): number[] {
    const newGenes = [];

    for (let i = 0; i < 4; i++) {
      let p = Math.random();
      if (p < 0.45) newGenes.push(individual1.genes[i]);
      else if (p < 0.9) newGenes.push(individual2.genes[i]);
      else newGenes.push(getRandomArbitrary(-1, 1));
    }

    return newGenes;
  }

  function reset() {
    const rh = getRandomInt(125, 375);

    Body.setPosition(top, { y: rh + 300, x: 525 });
    Body.setPosition(bot, { y: rh - 300, x: 525 });

    Body.setVelocity(top, { x: 0, y: 0 });
    Body.setVelocity(bot, { x: 0, y: 0 });
  }

  function jump(body: Matter.Body) {
    Body.setVelocity(body, { x: body.velocity.x, y: -4 * SCALE });
  }

  function getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  function individualShouldJump(individual: Individual) {
    const pipeDistance = top.position.x;
    const pipeY = top.position.y + 300;
    const birdVelocity = individual.body.velocity.y;
    const birdY = individual.body.position.y;

    if (population.findIndex(indi => indi === individual) === 0) {
      document.getElementById("pipeDistance")!.innerText = pipeDistance.toString();
      document.getElementById("pipeY")!.innerText = pipeY.toString();
      document.getElementById("birdVelocity")!.innerText = birdVelocity.toString();
      document.getElementById("birdY")!.innerText = birdY.toString();
      document.getElementById("time")!.innerText = individual.time.toString();
    }

    const shouldJump = calculateJump({
      pipeDistance,
      pipeY,
      birdVelocity,
      birdY,
      weights: individual.genes,
    });

    return shouldJump;
  }

  function calculateJump({
    pipeDistance,
    pipeY,
    birdVelocity,
    birdY,
    weights,
  }: NetInput) {
    const inputs = [pipeDistance, pipeY, birdVelocity, birdY];

    const sum = inputs.reduce(
      (acc, input, index) => acc + input * weights[index],
      0
    );

    return sum >= 0;
  }

  function createIndividual(genes1?: number[]): Individual {
    const body = Bodies.rectangle(50, 50, 50, 50, {
      inertia: Infinity,
      collisionFilter: { category: playerCategory, group: -1 },
      label: "individual",
    });

    Composite.add(engine.world, [body]);

    const genes = [];

    genes.push(getRandomArbitrary(-1, 1));
    genes.push(getRandomArbitrary(-1, 1));
    genes.push(getRandomArbitrary(-1, 1));
    genes.push(getRandomArbitrary(-1, 1));

    const individual = { body, genes: genes1 || genes, time: 0, isAlive: true };

    population.push(individual);

    return individual;
  }

  function getFitness(individual: Individual) {
    return individual.time - TRAINNING_TIME;
  }

  function removeIndividual(individual: Individual) {
    individual.isAlive = false;

    Composite.remove(engine.world, [individual.body]);
  }

  return () => {
    Engine.clear(engine);
    Render.stop(render);
    Runner.stop(runner);
    render.canvas.remove();
    render.textures = {};
  }
}