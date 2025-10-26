# Visão geral

Esta página descreve um agente treinado para jogar Flappy Bird utilizando um perceptron de uma camada e um algoritmo genético. O agente é representado por indivíduos em uma população; cada indivíduo possui um conjunto de genes que define seu comportamento. A cada ciclo, os indivíduos tomam decisões baseadas em entradas do ambiente e são avaliados com base no tempo de sobrevivência.

## Estrutura do Código

O código utiliza a biblioteca `matter-js` para simular a física do jogo. Por exemplo, os canos e os pássaros são representados como corpos físicos:

```js
const canoInferior = Bodies.rectangle(50, 50, 50, 400, { /* ... */ });
const canoSuperior = Bodies.rectangle(50, 50, 50, 400, { /* ... */ });
```

Esses corpos são adicionados ao mundo da simulação:

```js
Composite.add(motor.world, [canoInferior, canoSuperior]);
```

---

## Decisão do Agente

Cada indivíduo decide se deve "pular" com base em um perceptron de uma camada. As entradas para o perceptron incluem a distância do cano, a posição do cano, a velocidade do pássaro e a posição do pássaro.

Exemplo (pseudocódigo):

```js
const entradas = [distanciaCano, canoY, velocidadePassaro, passaroY];
const soma = entradas.reduce((acc, entrada, index) => acc + entrada * pesos[index], 0);
return soma >= 0; // decide pular
```

Se a soma ponderada das entradas for maior ou igual a zero, o agente decide pular.

---

## Algoritmo Genético

Após cada ciclo, os indivíduos são avaliados com base em seu tempo de sobrevivência:

```js
function obterFitness(individuo) { return individuo.tempo - TEMPO_TREINAMENTO; }
```

Os indivíduos mais aptos são selecionados para reprodução, e novos indivíduos são criados por cruzamento e mutação:

```js
const novosGenes = cruzar(ind1, ind2);
novaPopulacao.push(criarIndividuo(novosGenes));
```

---

## Treinamento e Evolução

O treinamento ocorre ao longo de múltiplos ciclos. Quando todos os indivíduos morrem, uma nova população é gerada:

```js
if (todosMortos) { populacao = novaPopulacao(); }
```

Isso permite que o algoritmo genético refine os genes dos indivíduos ao longo do tempo.

---

## Interatividade (controle de tempo)

O código permite ajustar a escala de tempo da simulação (input range):

```js
motor.timing.timeScale = 10 * parseInt(entrada.value) / 100;
```

---

## Notas

- A versão Markdown serve para documentação/README; para execução interativa utilize `Page.tsx` que importa o componente `Game`.
- Se você quiser que esta versão `Page.md` seja usada como página no projeto (em vez de `Page.tsx`), é necessário atualizar rotas ou conversão para MDX e configurar o build para processar arquivos Markdown/MDX.
