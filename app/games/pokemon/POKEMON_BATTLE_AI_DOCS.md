# 🎮 Pokemon Battle AI - Documentação Completa

> Um jogo interativo de batalhas Pokemon com Inteligência Artificial evolutiva baseada em **Algoritmos Genéticos**. A IA aprende e evolui suas estratégias através de gerações, criando times cada vez mais competitivos.

[![React](https://img.shields.io/badge/React-19.1.0-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![React Router](https://img.shields.io/badge/React_Router-7.7.1-ca4245?logo=react-router)](https://reactrouter.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Conceitos de IA](#-conceitos-de-ia)
- [Algoritmo Genético](#-algoritmo-genético)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Sistema de Evolução](#-sistema-de-evolução)
- [Bateria de Testes](#-bateria-de-testes)
- [API de Dados](#-api-de-dados)
- [Contribuindo](#-contribuindo)

---

## 🎯 Sobre o Projeto

**Pokemon Battle AI** é uma aplicação web interativa onde jogadores montam times de Pokemon (Geração 1 - Kanto) e batalham contra uma **Inteligência Artificial evolutiva**. 

### Destaques:

🧬 **IA que Evolui**: Usa **Algoritmo Genético** para criar estratégias cada vez melhores  
🎮 **Interface Moderna**: Design responsivo com Tailwind CSS e tema dark mode  
⚡ **Performance**: Otimizado com cache de dados da PokeAPI  
📊 **Visualização**: Gráficos de evolução e estatísticas detalhadas  
🧪 **Modo de Teste**: Configurações experimentais com população de até 100 genomas  
💾 **Persistência**: Progresso salvo localmente no navegador  

### Como Funciona:

1. **Seleção de Time**: Escolha 6 Pokemon da primeira geração (Kanto)
2. **Análise**: Veja estatísticas, tipos e composição do seu time
3. **Batalha**: Enfrente a IA em 6 confrontos 1v1 baseados em tipos e stats
4. **Evolução**: A IA aprende com cada batalha e evolui suas estratégias
5. **Testes Automatizados**: Execute baterias de 100 batalhas para ver a IA evoluir rapidamente

---

## 🛠️ Tecnologias Utilizadas

### Frontend Framework
- **React 19.1.0** - Biblioteca JavaScript para interfaces de usuário
- **TypeScript 5.8.3** - Superset tipado de JavaScript
- **React Router 7.7.1** - Roteamento e navegação

### Estilização
- **Tailwind CSS 4.1.4** - Framework CSS utility-first
- **@tailwindcss/vite 4.1.4** - Plugin Vite para Tailwind

### Visualização
- **PixiJS 8.12.0** - Engine 2D para renderização de gráficos
- **@pixi/react 8.0.3** - Integração do PixiJS com React
- **Matter.js 0.20.0** - Engine de física 2D

### API e Dados
- **pokenode-ts 1.20.0** - Cliente TypeScript para PokeAPI
- **axios 1.12.2** - Cliente HTTP
- **axios-cache-interceptor 1.8.3** - Cache automático de requisições

### Build e Desenvolvimento
- **Vite 6.3.3** - Build tool e dev server ultrarrápido
- **vite-tsconfig-paths 5.1.4** - Suporte para paths do TypeScript

### Runtime
- **Node.js 20+** - Runtime JavaScript
- **isbot 5.1.27** - Detecção de bots

---

## 🧠 Conceitos de IA

### Paradigma: Computação Evolutiva

O projeto implementa **Evolutionary Computation**, uma subárea de Inteligência Artificial inspirada na **evolução biológica** de Darwin.

#### O que é o Agente de IA?

O **Agente** é um sistema evolutivo que aprende a construir times de Pokemon competitivos através de **gerações sucessivas**:

- **Tipo**: Agente Evolutivo Baseado em População
- **Objetivo**: Maximizar taxa de vitória contra o jogador
- **Método**: Seleção natural + Variação genética (crossover + mutação)
- **Memória**: População de 20-100 genomas com histórico completo
- **Adaptação**: Melhora incremental a cada geração (a cada 5 batalhas)

#### Elementos Fundamentais:

##### 🧬 **População**
Conjunto de **20 genomas** (ou 100 no modo de teste), onde cada genoma representa uma estratégia completa de montagem de time.

```typescript
População = [Genoma1, Genoma2, ..., Genoma20]
```

##### 🧬 **Genoma (Cromossomo)**
DNA digital que codifica uma estratégia completa:

```typescript
interface TeamGenome {
    id: string;                    // Identificador único
    genes: TeamGenes;              // Cromossomo (DNA)
    fitness: number;               // Qualidade (0-100)
    wins: number;                  // Histórico de vitórias
    losses: number;                // Histórico de derrotas
    draws: number;                 // Histórico de empates
    generation: number;            // Geração de origem
    parents?: [string, string];    // Linhagem genética
}
```

##### 🧬 **Genes**
Informação genética que define a estratégia:

```typescript
interface TeamGenes {
    pokemonIds: number[];          // [25, 6, 131, 94, 143, 248]
    preferredTypes: string[];      // ["electric", "fire", "water"]
    strategy: string;              // "balanced" | "aggressive" | "defensive"
    statPriority: string;          // "attack" | "defense" | "speed" | "hp"
}
```

##### 📊 **Fitness (Aptidão)**
Função que avalia a "qualidade de sobrevivência" de cada genoma:

```typescript
fitness = (winRate × 50) + (typeVariety × 25) + (experience × 15) + (counterBonus × 10)
```

**Critérios:**
1. **Win Rate (50 pts)**: Taxa de vitória (principal critério)
2. **Type Variety (25 pts)**: Diversidade de tipos no time
3. **Experience (15 pts)**: Número de batalhas (maturidade)
4. **Counter Bonus (10 pts)**: Vantagem de tipos contra o jogador

**Exemplo:**
```
Genoma com 60% vitórias, 10 tipos diferentes, 25 batalhas, contém counters:
= (0.60 × 50) + (10/18 × 25) + (25/50 × 15) + 10
= 30 + 13.9 + 7.5 + 10
= 61.4 fitness
```

##### 🎯 **Seleção**
Mecanismo que escolhe os melhores genomas para reprodução usando **Tournament Selection**:

1. Escolher 4 genomas aleatoriamente
2. Comparar fitness dos 4
3. Selecionar os 2 melhores como "pais"

##### 🔀 **Crossover (Recombinação)**
Combina genes de 2 pais para criar 1 filho:

```typescript
Parent1: [Poke1, Poke2, Poke3, Poke4, Poke5, Poke6]
Parent2: [PokeA, PokeB, PokeC, PokeD, PokeE, PokeF]
         ↓ (ponto de corte na posição 3)
Child:   [Poke1, Poke2, Poke3, PokeD, PokeE, PokeF]
```

Taxa: **80%** (4 em 5 reproduções usam crossover)

##### 🧬 **Mutação**
Variação aleatória dos genes para explorar novas estratégias:

Taxa: **15%** por genoma

**Tipos de mutação:**
- Trocar 1 Pokemon aleatório
- Adicionar/remover tipo preferido
- Mudar estratégia (balanced → aggressive)
- Mudar prioridade de stat (attack → speed)

##### 🏆 **Elitismo**
Preservação dos melhores genomas entre gerações:

- **Top 20%** (4 melhores) são copiados diretamente para a próxima geração
- Garante que as melhores soluções nunca sejam perdidas
- Assegura que o fitness não regrida

---

## 🧬 Algoritmo Genético

### Como Funciona

O algoritmo segue o ciclo evolutivo clássico:

```
┌─────────────────────────────────────────┐
│   GERAÇÃO N (20 genomas)                │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   1. AVALIAÇÃO (Fitness)                │
│   Calcular fitness de todos os genomas  │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   2. ELITISMO                           │
│   Copiar top 20% → próxima geração      │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   3. SELEÇÃO (Tournament)               │
│   Escolher pais para 16 filhos          │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   4. CROSSOVER (80%)                    │
│   Combinar genes dos pais               │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   5. MUTAÇÃO (15%)                      │
│   Variação aleatória dos genes          │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   GERAÇÃO N+1 (20 genomas)              │
│   4 elite + 16 filhos                   │
└─────────────────────────────────────────┘
```

### Parâmetros do Algoritmo

| Parâmetro | Valor (Normal) | Valor (Teste) | Justificativa |
|-----------|----------------|---------------|---------------|
| **População** | 20 | 100 | Balanço entre diversidade e performance |
| **Elitismo** | 20% (4) | 10% (10) | Preserva melhores sem travar evolução |
| **Crossover** | 80% | 85% | Alta exploração de combinações |
| **Mutação** | 15% | 20% | Evita convergência prematura |
| **Torneio** | 4 | 6 | Pressão seletiva moderada |
| **Evolução** | A cada 5 batalhas | A cada 5 batalhas | Dados suficientes para fitness confiável |

### Exemplo de Evolução

```
Gen 0:  Fitness Médio: 15  | Melhor: 32  | Diversidade: 78%
  ↓ (5 batalhas)
Gen 1:  Fitness Médio: 28  | Melhor: 48  | Diversidade: 52%
  ↓ (5 batalhas)
Gen 2:  Fitness Médio: 41  | Melhor: 62  | Diversidade: 38%
  ↓ (5 batalhas)
Gen 3:  Fitness Médio: 53  | Melhor: 74  | Diversidade: 29%
  ↓ (5 batalhas)
Gen 4:  Fitness Médio: 64  | Melhor: 83  | Diversidade: 24%
  ↓ (5 batalhas)
Gen 5:  Fitness Médio: 72  | Melhor: 89  | Diversidade: 21%
```

**A IA evolui continuamente! 🚀**

### Métricas de Qualidade

#### Convergência
Mede se a população está evoluindo:
- Fitness médio **aumentando** → Convergência saudável
- Fitness **estagnado** → Possível mínimo local

#### Diversidade
```typescript
diversity = (estratégias únicas / total genomas) × 100

Diversidade > 60% = População saudável
Diversidade < 30% = Convergência prematura (ajustar mutação)
```

#### Exploração vs Explotação
- **Exploração**: Mutação + Crossover (buscar novas soluções)
- **Explotação**: Elitismo + Seleção (refinar melhores soluções)
- **Balanço**: 15% mutação + 20% elitismo = equilíbrio ideal

---

## 📦 Instalação

### Pré-requisitos

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **npm** 10+ (vem com Node.js)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/includeDaniel/PlayAI.git
cd PlayAI
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

4. **Acesse no navegador**
```
http://localhost:5173
```

### Comandos Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento
npm run build      # Compila para produção
npm run start      # Inicia servidor de produção
npm run typecheck  # Verifica tipos TypeScript
```

---

## 🎮 Como Usar

### 1. Menu Principal

Ao abrir a aplicação, você verá:

- **Começar Aventura**: Inicia o modo de jogo normal
- **Bateria de Testes Automatizados**: Executa 100 batalhas automáticas
- **Estatísticas da IA**: Geração, batalhas, win rate, fitness, diversidade

### 2. Montagem do Time

1. **Filtrar por Geração**: Use os botões para navegar entre Pokemon (Gen 1: 1-151)
2. **Selecionar Pokemon**: Clique em até 6 Pokemon para formar seu time
3. **Ver Estatísticas**: Cada card mostra tipo, HP, ataque e defesa
4. **Time Aleatório**: Gera um time aleatório automaticamente
5. **Analisar Time**: Vê análise detalhada de força e fraquezas
6. **Iniciar Batalha**: Começa a batalha contra a IA

### 3. Análise do Time

Visualize:
- **Composição de Tipos**: Distribuição dos tipos no seu time
- **Forças**: Tipos que seu time é forte contra
- **Fraquezas**: Tipos que seu time é fraco contra
- **Estatísticas Médias**: HP, Ataque, Defesa médios do time
- **Força Total**: Soma de todas as stats

### 4. Batalha

A batalha acontece em **6 confrontos 1v1**:

1. Pokemon são emparelhados por posição (1º vs 1º, 2º vs 2º...)
2. Cada confronto calcula dano baseado em:
   - **Vantagem de tipo** (2x de dano)
   - **Ataque vs Defesa**
   - **Fator aleatório** (±10%)
3. Pokemon com maior dano **vence** o confronto
4. Time com mais vitórias **vence a batalha**

### 5. Resultados

Após a batalha, veja:
- **Resultado geral** (Vitória/Derrota/Empate)
- **Matchups individuais**: Cada confronto com análise detalhada
- **Times lado a lado**: Comparação visual dos times
- **Evolução da IA**: A IA registra o resultado e aprende

### 6. Modo de Teste Experimental

**Como ativar:**
1. No menu, procure "🧪 Modo de Teste Experimental"
2. Clique em "Ativar Modo de Teste"
3. População aumenta de 20 para **100 genomas**
4. Use "Bateria de Testes" para 100 batalhas automáticas
5. Exporte dados com "📥 Exportar Dados"

**Benefícios:**
- 5x mais exploração de estratégias
- Convergência 33% mais rápida
- Diversidade mantida por mais tempo
- Dados científicos exportáveis

---

## 📁 Estrutura do Projeto

```
PlayAI/
├── app/
│   ├── root.tsx                    # Componente raiz da aplicação
│   ├── routes.ts                   # Configuração de rotas
│   ├── app.css                     # Estilos globais
│   ├── games/
│   │   └── Game.tsx                # Página principal do jogo
│   │   └── pokemon/
│   │       ├── PokemonBattleAI.tsx # Componente principal (1318 linhas)
│   │       ├── POKEMON_BATTLE_AI_DOCS.md   # Esta documentação
│   │       ├── components/
│   │       │   ├── AutomatedTestBattery.tsx  # Bateria de testes automáticos
│   │       │   ├── BattleMatchup.tsx         # Visualização de confrontos 1v1
│   │       │   ├── PokemonGrid.tsx           # Grade de seleção de Pokemon
│   │       │   └── TeamDisplay.tsx           # Exibição e análise do time
│   │       ├── hooks/
│   │       │   ├── useGeneticAI.ts           # Algoritmo genético (398 linhas)
│   │       │   └── usePokemonData.ts         # Fetch e cache de dados PokeAPI
│   │       └── types/
│   │           ├── genetic.ts                # Tipos do algoritmo genético
│   │           └── pokemon.ts                # Tipos de Pokemon e batalhas
│   └── routes/
│       └── Home.tsx                # Página inicial
├── build/                          # Build de produção
│   ├── client/                     # Assets do cliente
│   └── server/                     # Servidor Node.js
├── public/                         # Assets estáticos
├── package.json                    # Dependências e scripts
├── tsconfig.json                   # Configuração TypeScript
├── vite.config.ts                  # Configuração Vite
├── react-router.config.ts          # Config do React Router
├── Dockerfile                      # Container Docker
├── README.md                       # Documentação do projeto
└── INTEGRACAO_COMPLETA.md         # Guia de integração
```

### Arquivos Principais

#### `PokemonBattleAI.tsx` (1318 linhas)
Componente principal que gerencia:
- **Estados do jogo**: menu, setup, análise, batalha, testes
- **Integração com hooks**: `useGeneticAI`, `usePokemonData`
- **Lógica de batalha**: Simulação 1v1 com cálculo de vantagens de tipo
- **Bateria de testes**: Execução de 10-500 batalhas automatizadas
- **UI responsiva**: Tailwind CSS com dark mode
- **Exportação de dados**: JSON com histórico completo da IA

**Funções principais:**
```typescript
// Linha ~241: Gera time da IA usando melhor genoma
generateCounterTeam(playerTeam): { team, genomeId }

// Linha ~301: Calcula vantagem de tipo (2x, 0.5x, 0x)
calculateTypeAdvantage(attacker, defender): number

// Linha ~343: Simula confronto individual 1v1
simulateIndividualBattle(playerPokemon, aiPokemon): IndividualBattle

// Linha ~397: Simula batalha completa (6 confrontos)
simulateBattle(playerTeam, aiTeam, genomeId): BattleResult

// Linha ~430: Executa bateria de testes automatizados
runAutomatedTests(numberOfBattles): Promise<TestResult[]>
```

#### `useGeneticAI.ts` (398 linhas)
Hook customizado que implementa o algoritmo genético completo:

**Configurações:**
```typescript
// Linha 12-16: Modo Normal
DEFAULT_CONFIG = {
    populationSize: 20,
    elitePercentage: 0.2,    // Top 20% preservado
    mutationRate: 0.15,      // 15% de mutação
    crossoverRate: 0.8,      // 80% crossover
    tournamentSize: 4        // Seleção por torneio
}

// Linha 19-25: Modo Teste Intensivo
TESTING_CONFIG = {
    populationSize: 100,     // 5x maior
    elitePercentage: 0.1,    // Top 10%
    mutationRate: 0.20,      // Mais exploração
    crossoverRate: 0.85,     // Mais recombinação
    tournamentSize: 6        // Mais competitivo
}
```

**Funções principais:**
```typescript
// Linha 50-60: Gera genes aleatórios para novo genoma
generateRandomGenes(): TeamGenes

// Linha 85-106: Calcula fitness (0-100 pontos)
calculateFitness(genome, playerTypes?): number
// - Win Rate: 0-50 pts
// - Type Variety: 0-25 pts  
// - Experience: 0-15 pts
// - Counter Bonus: 0-10 pts

// Linha 108-118: Seleção por torneio
tournamentSelection(population, tournamentSize): TeamGenome

// Linha 120-148: Crossover (recombinação)
crossover(parent1, parent2): TeamGenome

// Linha 150-188: Mutação genética
mutate(genome, mutationRate): TeamGenome

// Linha 260-310: Evolução de geração
evolveGeneration(playerTypes): void
// - Calcula fitness de todos
// - Elitismo (preserva melhores)
// - Crossover + Mutação
// - Registra histórico

// Linha 236-250: Persistência
// Salva/carrega população do localStorage
```

#### `genetic.ts`
Define tipos TypeScript para o sistema genético:

```typescript
// Tipos de estratégia
type StrategyType = 'counter' | 'balanced' | 'aggressive' | 'tank';
type StatsPriority = 'balanced' | 'offensive' | 'defensive' | 'speed';

// DNA do time
interface TeamGenes {
    pokemonIds: number[];          // IDs dos 6 Pokemon (1-151)
    typeDistribution: string[];    // Tipos priorizados
    statsPriority: StatsPriority;  // Foco de stats
    strategyType: StrategyType;    // Estratégia geral
}

// Genoma completo
interface TeamGenome {
    id: string;                    // ID único
    generation: number;            // Geração de origem
    genes: TeamGenes;              // DNA
    fitness: number;               // Aptidão (0-100)
    wins: number;                  // Vitórias
    losses: number;                // Derrotas
    draws: number;                 // Empates
    battlesPlayed: number;         // Total de batalhas
    parents: [string, string] | null;  // Linhagem
    createdAt: number;             // Timestamp
}

// População completa
interface GeneticPopulation {
    genomes: TeamGenome[];         // Array de genomas
    currentGeneration: number;     // Geração atual
    totalBattles: number;          // Batalhas totais
    bestFitness: number;           // Melhor fitness alcançado
    bestGenomeId: string | null;   // ID do melhor genoma
    generationHistory: GenerationHistory[];  // Evolução
}
```

#### `usePokemonData.ts`
Hook para fetch e cache de dados da PokeAPI:

**Funcionalidades:**
- Cache automático de requisições (24h)
- Paginação (20 Pokemon por página)
- Busca por nome
- Loading states
- Error handling
- Geração de times aleatórios

**Funções exportadas:**
```typescript
usePokemonData() {
    paginatedPokemon,    // Pokemon da página atual
    loading,             // Estado de carregamento
    error,               // Erro se houver
    searchTerm,          // Termo de busca
    currentPage,         // Página atual
    totalPages,          // Total de páginas
    searchPokemon,       // Função de busca
    generateRandomTeam,  // Gera time aleatório
    nextPage,            // Próxima página
    prevPage,            // Página anterior
    goToPage            // Ir para página específica
}
```

#### `AutomatedTestBattery.tsx`
Componente de interface para bateria de testes:

**Props:**
```typescript
interface AutomatedTestBatteryProps {
    onRunTests: (numberOfBattles: number) => Promise<TestResult[]>;
    isRunning: boolean;
    progress: { current: number; total: number };
}
```

**Features:**
- Input para número de batalhas (10-500)
- Barra de progresso em tempo real
- Estatísticas agregadas:
  - Total de batalhas
  - Vitórias jogador/IA
  - Win rate percentual
  - Vantagem atual
- Lista expandível de resultados
- Análise detalhada de cada confronto
- Código de cores (verde/vermelho/amarelo)

#### `PokemonGrid.tsx`
Grade de seleção de Pokemon:

**Features:**
- Grid responsivo (2-6 colunas)
- Sprites via CDN (Pokemon.com)
- Fallback para Serebii.net
- Fallback final: SVG pokeball
- Indicador visual de seleção
- Limite de 6 Pokemon
- Loading states
- Error handling

**CDN Strategy:**
```typescript
// Primary: Pokemon.com
https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${paddedId}.png

// Fallback: Serebii.net
https://www.serebii.net/pokemon/art/${paddedId}.png

// Final: Base64 SVG
data:image/svg+xml;base64,[pokeball]
```

#### `TeamDisplay.tsx`
Exibição e análise do time:

**Features:**
- Visualização dos 6 Pokemon selecionados
- Stats individuais (HP, ATK, DEF, SPD, SP.ATK, SP.DEF)
- Badges de tipo
- Botão de remoção
- Mesmo sistema de CDN do PokemonGrid
- Layout responsivo

#### `BattleMatchup.tsx`
Visualização de confronto individual:

**Features:**
- Sprites lado a lado (jogador vs IA)
- Indicadores de vantagem (→ ← ⚔)
- Badges de tipo
- Análise textual do confronto
- Highlight do vencedor
- Mesmo sistema de CDN

#### `pokemon.ts`
Tipos para Pokemon e batalhas:

```typescript
interface Pokemon {
    id: number;
    name: string;
    sprites: PokemonSprites;
    types: PokemonType[];
    stats: PokemonStat[];
    abilities: PokemonAbility[];
    height: number;
    weight: number;
}

interface IndividualBattle {
    playerPokemon: Pokemon;
    aiPokemon: Pokemon;
    winner: 'player' | 'ai';
    typeAdvantage: 'player' | 'ai' | 'neutral';
    reasoning: string;
}

interface BattleResult {
    playerTeam: Pokemon[];
    aiTeam: Pokemon[];
    winner: 'player' | 'ai' | 'draw';
    analysis: string;
    battles: IndividualBattle[];
    playerScore: number;
    aiScore: number;
}
```

---

## 🔬 Sistema de Evolução

### Ciclo de Vida Geracional

```typescript
// Inicialização (Geração 0)
População inicial: 20 genomas aleatórios

// A cada 5 batalhas
if (totalBattles % 5 === 0) {
    evolveGeneration();
}

// Processo de evolução
function evolveGeneration() {
    // 1. Calcular fitness de todos
    population.forEach(genome => {
        genome.fitness = calculateFitness(genome);
    });
    
    // 2. Ordenar por fitness
    population.sort((a, b) => b.fitness - a.fitness);
    
    // 3. Elitismo (top 20%)
    const elite = population.slice(0, 4);
    
    // 4. Gerar nova geração
    const newGeneration = [...elite];
    
    while (newGeneration.length < 20) {
        // Seleção
        const [parent1, parent2] = tournamentSelection(population);
        
        // Crossover (80% chance)
        let child = Math.random() < 0.8 
            ? crossover(parent1, parent2)
            : { ...parent1 };
        
        // Mutação (15% chance)
        if (Math.random() < 0.15) {
            child = mutate(child);
        }
        
        newGeneration.push(child);
    }
    
    population = newGeneration;
    generation++;
}
```

### Função de Fitness Detalhada

```typescript
function calculateFitness(genome: TeamGenome): number {
    // 1. Win Rate (0-50 pontos)
    const winRate = genome.wins / (genome.totalBattles || 1);
    const winRateScore = winRate * 50;
    
    // 2. Type Variety (0-25 pontos)
    const uniqueTypes = new Set(
        genome.genes.pokemonIds.flatMap(id => 
            getPokemon(id).types.map(t => t.type.name)
        )
    ).size;
    const varietyScore = (uniqueTypes / 18) * 25;
    
    // 3. Experience (0-15 pontos)
    const experienceScore = Math.min(15, (genome.totalBattles / 50) * 15);
    
    // 4. Counter Bonus (0-10 pontos)
    const hasCounterTypes = genome.genes.preferredTypes.some(type =>
        playerTypes.some(playerType => 
            isStrongAgainst(type, playerType)
        )
    );
    const counterScore = hasCounterTypes ? 10 : 0;
    
    // Fitness Total (0-100)
    return winRateScore + varietyScore + experienceScore + counterScore;
}
```

### Operadores Genéticos

#### Crossover (One-Point)
```typescript
function crossover(parent1: TeamGenome, parent2: TeamGenome): TeamGenome {
    const cutPoint = 3; // Meio do time (6 Pokemon)
    
    return {
        id: generateId(),
        generation: Math.max(parent1.generation, parent2.generation) + 1,
        genes: {
            pokemonIds: [
                ...parent1.genes.pokemonIds.slice(0, cutPoint),
                ...parent2.genes.pokemonIds.slice(cutPoint)
            ],
            preferredTypes: [
                ...parent1.genes.preferredTypes.slice(0, 2),
                ...parent2.genes.preferredTypes.slice(2)
            ],
            strategy: Math.random() > 0.5 ? parent1.genes.strategy : parent2.genes.strategy,
            statPriority: Math.random() > 0.5 ? parent1.genes.statPriority : parent2.genes.statPriority
        },
        fitness: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalBattles: 0,
        parents: [parent1.id, parent2.id]
    };
}
```

#### Mutação
```typescript
function mutate(genome: TeamGenome): TeamGenome {
    const mutated = { ...genome };
    
    // Mutar Pokemon (15% chance cada)
    mutated.genes.pokemonIds = genome.genes.pokemonIds.map(id =>
        Math.random() < 0.15 ? randomPokemonId() : id
    );
    
    // Mutar tipos preferidos
    if (Math.random() < 0.15) {
        const allTypes = ['fire', 'water', 'grass', /* ... */];
        if (Math.random() > 0.5) {
            // Adicionar tipo
            mutated.genes.preferredTypes.push(
                allTypes[Math.floor(Math.random() * allTypes.length)]
            );
        } else {
            // Remover tipo
            mutated.genes.preferredTypes = 
                mutated.genes.preferredTypes.slice(0, -1);
        }
    }
    
    // Mutar estratégia
    if (Math.random() < 0.15) {
        const strategies = ['balanced', 'aggressive', 'defensive', 'counter'];
        mutated.genes.strategy = 
            strategies[Math.floor(Math.random() * 4)];
    }
    
    // Mutar prioridade
    if (Math.random() < 0.15) {
        const priorities = ['attack', 'defense', 'speed', 'hp'];
        mutated.genes.statPriority = 
            priorities[Math.floor(Math.random() * 4)];
    }
    
    return mutated;
}
```

### Persistência de Dados

```typescript
// Salvar no localStorage após cada evolução
localStorage.setItem('pokemon-genetic-population', JSON.stringify({
    population: population.genomes,
    generations: population.generations,
    currentGeneration: population.currentGeneration,
    totalBattles: population.totalBattles,
    bestGenomeId: getBestGenome().id
}));

// Carregar na inicialização
const saved = localStorage.getItem('pokemon-genetic-population');
if (saved) {
    const data = JSON.parse(saved);
    // Restaurar população...
}
```

---

## 🧪 Bateria de Testes

### Modo de Teste Experimental

O projeto inclui um **modo de teste** com população de **100 genomas** para análise científica do algoritmo.

### Configurações

| Parâmetro | Normal | Teste | Impacto |
|-----------|--------|-------|---------|
| População | 20 | 100 | +400% exploração |
| Mutação | 15% | 20% | +33% variação |
| Torneio | 4 | 6 | +50% competição |
| Elite | 20% (4) | 10% (10) | Mais preservação |
| Memória | ~100KB | ~500KB | +400% uso |

### Protocolo de Testes

#### Teste 1: Convergência
**Objetivo**: Comparar velocidade de convergência

```
Executar 100 batalhas:
- População 20 (baseline)
- População 100 (teste)

Métricas:
- Gerações para atingir fitness 80
- Fitness final (geração 20)
```

**Resultados esperados:**
- Pop 20: ~18-22 gerações para F=80
- Pop 100: ~12-16 gerações para F=80 (**33% mais rápido**)

#### Teste 2: Diversidade
**Objetivo**: Manter variedade de estratégias

```
Executar 200 batalhas:
Registrar diversidade a cada geração

Diversidade = (estratégias únicas / total) × 100
```

**Resultados esperados:**
```
População 20:
Gen 0:  75%
Gen 10: 45%
Gen 20: 30% ← convergência prematura

População 100:
Gen 0:  80%
Gen 10: 65%
Gen 20: 50% ← diversidade mantida
```

#### Teste 3: Taxa de Mutação
**Objetivo**: Encontrar taxa ótima

Testar 3 configurações (100 batalhas cada):
- 10% mutação (baixa)
- 20% mutação (média)
- 30% mutação (alta)

**Análise:**
- 10%: Convergência rápida, pode travar em mínimo local
- 20%: **Balanço ideal** (configuração padrão)
- 30%: Alta diversidade, convergência lenta

### Exportação de Dados

```typescript
// Botão "📥 Exportar Dados" gera JSON:
{
    "metadata": {
        "exportDate": "2025-10-26T...",
        "testMode": "TESTING_100",
        "config": { /* parâmetros usados */ }
    },
    "currentStats": {
        "generation": 15,
        "totalBattles": 75,
        "winRate": 0.64,
        "bestFitness": 87.3,
        "averageFitness": 72.1,
        "diversity": 68.5
    },
    "population": {
        "genomes": [ /* 100 genomas completos */ ]
    },
    "generationHistory": [ /* evolução ao longo do tempo */ ]
}
```

**Use os dados para:**
- Gerar gráficos de evolução
- Análise estatística
- Comparar configurações
- Validar hipóteses
- Publicações científicas

### Executando Testes

1. **Executar Bateria**
```
Menu → "Bateria de Testes Automatizados" → Iniciar
```

2. **Acompanhar Progresso**
```
Barra de progresso: 0/100 batalhas
Estatísticas atualizadas em tempo real
```

Para mais detalhes, veja: **[docs/TESTING_BATTERY.md](docs/TESTING_BATTERY.md)**

---

## 🌐 API de Dados

### PokeAPI

O projeto usa a **PokeAPI v2** para dados de Pokemon:

```
https://pokeapi.co/api/v2/
```

**Endpoints utilizados:**
```
GET /pokemon/{id}           # Dados de um Pokemon específico
GET /pokemon?limit=151      # Lista dos 151 Pokemon (Gen 1)
GET /type/{type}            # Informações de tipo
```

### CDN de Sprites

**Problema resolvido**: GitHub raw.githubusercontent.com tem rate limiting (429 errors)

**Solução**: Sistema multi-CDN com fallback automático

```typescript
// 1. Primary: Pokemon.com CDN
const pokemonComCdn = `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${paddedId}.png`;

// 2. Fallback: Serebii.net
const serebiiCdn = `https://www.serebii.net/pokemon/art/${paddedId}.png`;

// 3. Final Fallback: Base64 SVG Pokeball
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,...';
```

**Implementação (PokemonGrid.tsx, TeamDisplay.tsx, BattleMatchup.tsx):**
```typescript
<img
    src={pokemon.sprites.other['official-artwork'].front_default}
    alt={pokemon.name}
    onError={(e) => {
        const target = e.target as HTMLImageElement;
        const paddedId = String(pokemon.id).padStart(3, '0');
        const serebiiUrl = `https://www.serebii.net/pokemon/art/${paddedId}.png`;
        
        if (!target.src.includes('serebii') && target.src !== FALLBACK_IMAGE) {
            target.src = serebiiUrl;
        } else if (target.src.includes('serebii')) {
            target.src = FALLBACK_IMAGE;
        }
    }}
/>
```

**Vantagens:**
- ✅ Sem dependência do GitHub
- ✅ Alta disponibilidade (3 fontes)
- ✅ Fallback visual sempre funciona
- ✅ Performance otimizada

### Estrutura de Dados

```typescript
interface Pokemon {
    id: number;
    name: string;
    sprites: {
        front_default: string;
        other: {
            'official-artwork': {
                front_default: string;  // URL alta resolução
            };
        };
    };
    types: Array<{
        slot: number;
        type: {
            name: string;
            url: string;
        };
    }>;
    stats: Array<{
        base_stat: number;
        stat: {
            name: string;
        };
    }>;
}
```

### Cache

Usa **pokenode-ts 1.20.0** com cache interno:

```typescript
const pokemonApi = new PokemonClient();
// Cache automático por requisição
```

**Benefícios:**
- ✅ Reduz chamadas à API
- ✅ Melhora performance
- ✅ Funciona offline (após primeiro carregamento)
- ✅ Respeita limites de rate da API

---

## 🎨 Interface do Usuário

### Design System

**Cores Principais:**
- Azul (`blue-500/600`): Jogador
- Vermelho (`red-500/600`): IA
- Roxo (`purple-500/600`): Ações principais
- Ciano (`cyan-500/600`): Análise
- Verde (`green-500/600`): Vitória
- Cinza (`gray-500/600`): Neutro

**Breakpoints Responsivos:**
```css
sm: 640px   /* Mobile pequeno */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop grande */
```

### Componentes

#### PokemonGrid
Grade responsiva de seleção:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {pokemon.map(p => <PokemonCard key={p.id} pokemon={p} />)}
</div>
```

#### TeamDisplay
Visualização do time com stats:
- Badges de tipo
- Barras de progresso (HP, ATK, DEF)
- Análise agregada
- Slots vazios

#### BattleMatchup
Confronto 1v1 detalhado:
- Sprites dos Pokemon
- Indicador de vantagem (→ ← ⚔)
- Dano calculado
- Análise textual

#### AutomatedTestBattery
Execução de testes:
- Barra de progresso
- Estatísticas em tempo real
- Gráfico de evolução
- Exportação de dados

---

## 🚀 Otimizações

### Performance

1. **Lazy Loading**: Componentes carregados sob demanda
2. **Memoização**: `useMemo` e `useCallback` para cálculos pesados
3. **Debounce**: Evita re-renders excessivos
4. **Cache de API**: pokenode-ts com cache interno
5. **CDN Multi-Fallback**: Sprites sempre disponíveis

### Código Limpo

**Limpeza recente (Outubro 2025):**
- ✅ Removidos todos console.logs de debug
- ✅ Mantidos logs informativos da evolução da IA
- ✅ Deletado arquivo de teste `check-pokemon-api.js`
- ✅ Removida pasta vazia `constants/`
- ✅ Código padronizado (sprites official-artwork)
- ✅ Sistema CDN unificado em todos os componentes

**Logs informativos preservados:**
```typescript
// runAutomatedTests() - Linha 482
console.log(`🧬 Evolução #${n} - Batalhas X-Y: Z/5 vitórias da IA (%)`)

// runAutomatedTests() - Linhas 501-507
console.log(`🎯 EVOLUÇÃO FINAL CONSOLIDADA`)
console.log(`📊 ${results.length} batalhas | ${totalAiWins} vitórias IA (%)`)
console.log(`🧬 ${uniquePlayerTypes.length} tipos únicos encontrados`)
console.log(`✅ População evoluída com base em todos os resultados!`)
```

### Bundle Size

```bash
npm run build

# Análise de tamanho
build/
├── client/
│   └── assets/
│       ├── entry.client-*.js       # ~150KB
│       ├── PokemonBattleAI-*.js    # ~180KB
│       ├── Game-*.js               # ~120KB
│       └── root-*.css              # ~50KB
└── server/
    └── index.js                    # ~200KB
```

**Otimizações aplicadas:**
- Tree-shaking automático (Vite)
- Code splitting por rota
- Minificação de CSS/JS
- Compressão gzip/brotli

### Acessibilidade

- ✅ Navegação por teclado
- ✅ ARIA labels
- ✅ Contraste adequado (WCAG AA)
- ✅ Textos alternativos em imagens
- ✅ Dark mode nativo

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. **Fork** o projeto
2. **Crie uma branch** para sua feature
   ```bash
   git checkout -b feature/MinhaNovaFeature
   ```
3. **Commit** suas mudanças
   ```bash
   git commit -m 'Adiciona MinhaNovaFeature'
   ```
4. **Push** para a branch
   ```bash
   git push origin feature/MinhaNovaFeature
   ```
5. **Abra um Pull Request**

### Diretrizes

- Use **TypeScript** para novas features
- Siga o estilo de código existente (Prettier)
- Adicione testes para novas funcionalidades
- Documente mudanças significativas
- Mantenha commits semânticos
- **NÃO** adicione console.logs de debug (apenas logs informativos da IA)
- Use sistema de CDN multi-fallback para imagens

### Branch Atual

```
Repository: PlayAI
Owner: includeDaniel
Current branch: feature/pokemon-integration
Default branch: main
```

### Roadmap

Funcionalidades planejadas:

- [ ] Suporte a Gerações 2-9
- [ ] Multiplayer online (batalhas PvP)
- [ ] Sistema de ranking
- [ ] Mais estratégias de IA (Minimax, MCTS)
- [ ] Ataques com tipos e efeitos
- [ ] Items e habilidades
- [ ] Animações de batalha com PixiJS
- [ ] PWA (Progressive Web App)
- [ ] Internacionalização (i18n)
- [ ] Gráficos de evolução da IA
- [ ] Replay de batalhas

### Issues e Bugs

Problemas conhecidos e resolvidos:

#### ✅ Resolvidos
- GitHub rate limiting (429 errors) → Sistema CDN multi-fallback
- Sprites não carregando → Pokemon.com + Serebii.net + SVG fallback
- Console.logs poluindo código → Limpeza completa mantendo logs informativos
- Arquivos não utilizados → Cleanup de `check-pokemon-api.js` e pasta `constants/`

#### 🔧 Em andamento
- Nenhum issue crítico no momento

---

## 📚 Referências

### Algoritmos Genéticos
- Goldberg, D. E. (1989). *Genetic Algorithms in Search, Optimization, and Machine Learning*
- Mitchell, M. (1998). *An Introduction to Genetic Algorithms*
- Eiben, A. E., & Smith, J. E. (2015). *Introduction to Evolutionary Computing*

### PokeAPI
- Documentação oficial: https://pokeapi.co/docs/v2
- GitHub: https://github.com/PokeAPI/pokeapi
- pokenode-ts: https://github.com/Gabb-c/pokenode-ts

### React & TypeScript
- React Docs: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- React Router: https://reactrouter.com/
- Vite: https://vite.dev/

### Sprites & Assets
- Pokemon.com CDN: https://assets.pokemon.com/
- Serebii.net: https://www.serebii.net/

---

## 📝 Changelog

### v1.1.0 (Outubro 2025)
- ✅ Sistema CDN multi-fallback para sprites
- ✅ Remoção de dependência do GitHub raw URLs
- ✅ Limpeza completa de console.logs de debug
- ✅ Preservação de logs informativos da evolução da IA
- ✅ Remoção de arquivos não utilizados
- ✅ Padronização de sprites (official-artwork)
- ✅ Documentação atualizada

### v1.0.0 (2025)
- 🎮 Lançamento inicial
- 🧬 Algoritmo genético funcional
- 🧪 Bateria de testes automatizados
- 📊 Sistema de estatísticas
- 💾 Persistência em localStorage
- 🎨 Interface responsiva com Tailwind CSS

---

[⬆ Voltar ao topo](#-pokemon-battle-ai---documentação-completa)

</div>
