# Flappy Bird — algoritmo genético + perceptron

Este documento descreve, de forma didática, a parte central do agente que joga Flappy Bird neste repositório: o perceptron de uma camada (que decide quando pular) e o algoritmo genético (que evolui os pesos representados por genes). A implementação está em TypeScript e usa Matter.js para a física.

Repositório: [includeDaniel/PlayAI](https://github.com/includedaniel/PlayAI)

Arquivos principais (caminhos no repositório):

- [Lógica do perceptron / genes](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logics/ia.ts)
- [Lógica do jogo (orquestração, população)](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logics/jogo.ts)
- [Física (Matter.js helper)](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logics/fisica.ts)
- [Componente React que monta o canvas e labels](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/components/Flappy.tsx)
- [Página que integra o jogo](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/components/Page.tsx)

---

## Resumo abstrato do fluxo

1. O mundo é simulado pelo Matter.js (canos e pássaros são corpos físicos).
2. Cada agente (indivíduo) possui um vetor de genes (bits). Esses bits são convertidos em 4 pesos numéricos.
3. Em cada tick, para cada indivíduo, o perceptron calcula a soma ponderada das entradas ambientais e decide se o pássaro deve pular.
4. Indivíduos ganham tempo de sobrevivência enquanto vivem; quando todos morrem, o algoritmo genético cria a próxima geração por seleção e cruzamento.

---

## Detalhes: representação de genes e pesos

Cada indivíduo tem um vetor de bits chamado `Genes` (no código `Genes = boolean[]`).

- São 4 grupos de 22 bits cada (total = 88 bits). Cada grupo representa um peso do perceptron.
- A conversão bits → número é feita por uma função que interpreta os 22 bits como um inteiro não assinado, normaliza para [0,1] e mapeia para [-1,1].

Trecho (implementação principal, veja o arquivo [logicas/ia.ts](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logicas/ia.ts)):

```ts
// converte 22 bits para número no intervalo [-1, 1]
function bitsParaNumero(bits: boolean[]): number {
	// (implementação: soma de bit shifts, normalização e map para [-1,1])
}

// extrai os 4 pesos a partir dos 88 bits
function extrairPesos(genes: boolean[]): number[] {
	const pesos = [];
	for (let i = 0; i < 4; i++) {
		const slice = genes.slice(i * 22, (i + 1) * 22);
		pesos.push(bitsParaNumero(slice));
	}
	return pesos;
}
```

Observação: usar bits permite representar com granularidade controle direto da codificação genética e realizar cruzamentos bit-a-bit facilmente.

---

## Perceptron (decisão de pulo)

O perceptron é uma única camada linear sem função de ativação complexa — a saída é apenas a soma ponderada das entradas comparada a zero.

Entradas usadas no perceptron (ordem usada no código):

1. Distância horizontal até o cano (x)
2. Y da abertura entre os canos (y)
3. Velocidade vertical do pássaro (vy)
4. Y do pássaro (y)

Decisão (pseudocódigo):

```ts
const pesos = extrairPesos(genes); // [w0, w1, w2, w3]
const entradas = [distancia, canoY, velocidade, passaroY];
const soma = entradas.reduce((acc, v, i) => acc + v * pesos[i], 0);
const devePular = soma >= 0; // true => aplica impulso de pulo
```

Veja a função real: [logicas/ia.ts](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logicas/ia.ts)

Dica prática: a normalização das entradas (escala e offset) afeta muito o comportamento do perceptron — verifique como as entradas são calculadas em [logicas/jogo.ts](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logicas/jogo.ts) para entender a escala usada no experimento.

---

## Algoritmo Genético (fluxo e implementação)

Visão geral do ciclo de vida genético:

1. Inicializa uma população de N indivíduos com genes aleatórios (`criarGenesAleatorios`).
2. Executa a simulação por um tempo (indivíduos acumulam `tempo` de sobrevivência).
3. Quando todos morrem (ou chega o fim do ciclo), calcula-se fitness (aqui usado o tempo de sobrevivência como critério).
4. Gera nova população mantendo os mais aptos (elitismo) e preenchendo o restante com filhos gerados por cruzamento bit-a-bit.

Pontos-chave do código:

- Função que cria população aleatória: `criarGenesAleatorios()` — gera 88 bits aleatórios.
- Cruzamento: `cruzarGenes(g1, g2)` — para cada bit há probabilidade de herdar de pai A, pai B ou sofrer mutação.
- Seleção: os indivíduos são ordenados por fitness; os top K são mantidos (elitismo) e os demais são gerados por cruzamento entre os melhores.

Trecho ilustrativo de cruzamento (pseudocódigo):

```ts
function cruzarGenes(g1: Genes, g2: Genes): Genes {
	const filho = [];
	for (let i = 0; i < 88; i++) {
		const p = Math.random();
		if (p < 0.45) filho.push(g1[i]);
		else if (p < 0.9) filho.push(g2[i]);
		else filho.push(Math.random() < 0.5); // mutação
	}
	return filho;
}
```

Implementação completa e parâmetros: [logicas/ia.ts](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logicas/ia.ts)

Como a aptidão é medida (fitness):

```ts
function obterFitness(individuo) {
	// Exemplo do projeto — usa tempo de sobrevivência
	return individuo.tempo - TEMPO_TREINAMENTO;
}
```

O `TEMPO_TREINAMENTO` aparece no código de orquestração (`jogo.ts`) e é usado para calibrar a função de fitness.

---

## Dicas para experimentação e tuning

- Tamanho da população (`TAMANHO_POPULACAO`): maior população explora mais, mas custa performance.
- Taxa de mutação: aumente se a população estagnar, diminua se houver muita aleatoriedade.
- Normalização das entradas: centralizar e normalizar entradas (por exemplo, dividir distância por largura do canvas) melhora estabilidade do perceptron.
- Elitismo: manter uma pequena porcentagem dos melhores preserva soluções já boas.

Parâmetros estão em: [logicas/jogo.ts](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logicas/jogo.ts)

---

## Onde olhar no código (rápido mapa)

- [logicas/ia.ts](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logicas/ia.ts) — conversão bits↔número, criar genes, cruzamento, extrair pesos e decisão do perceptron.
- [logicas/jogo.ts](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logicas/jogo.ts) — mecânica do jogo (criação de corpos, loop, reinício de canos, população, seleção, fitness).
- [logicas/fisica.ts](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/logicas/fisica.ts) — helper que inicializa Matter.js (engine, render, runner).
- [componentes/Flappy.tsx](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/components/Flappy.tsx) e [componentes/Page.tsx](https://github.com/includedaniel/PlayAI/tree/main/app/games/flappy-bird-js/components/Page.tsx) — integração React/DOM, labels e botão de reiniciar.
