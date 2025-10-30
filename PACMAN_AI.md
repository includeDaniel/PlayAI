# Documentação Detalhada da IA – Pac-Man e Fantasmas

> Trabalho acadêmico: este documento explica minuciosamente o funcionamento das Inteligências Artificiais (IA) implementadas no jogo Pac-Man desta aplicação. Foca em: Aprendizado por Reforço (Q-Learning) do Pac-Man, heurísticas adicionais e a lógica baseada em estados dos fantasmas.

---

## 1. Visão Geral

A arquitetura combina duas abordagens distintas:

- **Pac-Man:** Aprendizado por Reforço (Q-Learning) + camadas de heurísticas (exploração direcionada, anti-stuck, planejamento BFS local, shaping de recompensas).
- **Fantasmas:** IA clássico baseada em _modos temporais_ (scatter / chase / frightened / eyes) e personalidades distintas, com pequeno ajuste adaptativo.

Essa combinação ilustra o contraste entre um agente que aprende (Pac-Man) e agentes com comportamento determinístico parametrizado (fantasmas).

---

## 2. Pac-Man – Arquitetura de Q-Learning

### 2.1. Objetivo do Q-Learning

Aprender uma política \(\pi(a|s)\) que maximize o retorno cumulativo (soma de recompensas), evitando morte e explorando o labirinto eficientemente.

### 2.2. Estrutura do Estado (Encoding)

O estado é codificado em uma string compacta `r,c|d1,d2|pp|mask` onde:

- `r,c`: posição atual da célula do Pac-Man.
- `d1,d2`: distâncias Manhattan aos dois fantasmas mais próximos (limitadas a 12 para reduzir dimensionalidade).
- `pp`: par de bits indicando pellet normal presente (1/0) e power pellet presente (1/0) na célula atual.
- `mask`: bitmask das direções livres (ordem: left,right,up,down) – ex.: `1011`.

Redução de dimensionalidade = menor tabela Q e converge mais rápido.

### 2.3. Ações

Conjunto discreto: `left`, `right`, `up`, `down` (4 ações). Antes de escolher ação, o agente filtra apenas direções que não levam a parede.

### 2.4. Atualização Q

Regra de Bellman:
\[
Q(s*t,a_t) \leftarrow Q(s_t,a_t) + \alpha\big[r*{t+1} + \gamma \max*a Q(s*{t+1}, a) - Q(s_t,a_t)\big]
\]
Parâmetros atuais: `alpha≈0.18`, `gamma≈0.92`.

### 2.5. Política de Exploração (ε-greedy Adaptativa)

- Escolhe ação aleatória com probabilidade ε.
- Após cada episódio (vitória, morte, timeout) ajusta ε dinamicamente:
    - Vitória: decaimento forte (acelera convergência – `effectiveDecay≈0.9`).
    - Morte precoce com desempenho ruim: pode aumentar ligeiramente ε para explorar mais.
    - Timeout longo sem vitória: leve incremento para diversificar.
    - Episódio ruim (reward médio muito negativo): segura exploração (reduz ritmo do decaimento).
- Limites: `ε_min ≈ 0.02`, garantindo exploração residual.

### 2.6. Métricas Monitoradas

- `episode`, `steps`, `totalReward`, `lastReward`, `avgRewardWindow` (média exponencial), distâncias a pellet e fantasmas.
- Logs e painel visual facilitam tuning e depuração.

---

## 3. Recompensas (Reward Shaping)

### 3.1. Recompensas Principais

| Evento          | Valor                       |
| --------------- | --------------------------- |
| Passo neutro    | −0.02                       |
| Pellet normal   | +1.2                        |
| Power pellet    | +10                         |
| Fantasma comido | +8                          |
| Vitória         | +50 (aplicada externamente) |
| Morte           | −30                         |
| Timeout         | −5 adicional no final       |

### 3.2. Penalidades Dinâmicas

- **Starvation:** sequência de passos sem coletar algo; cresce quase quadrático após 5 passos (+ choque adicional após 20).
- **Looping / Ping-Pong:** detectar padrões ABAB ou baixa diversidade -> penalizações incrementais (`−0.05`, `−0.10`, ...).
- **Revisita Exagerada:** após >8 visitas à mesma célula sem colher nada: penalidade progressiva até cerca de −0.168 acumulado.

### 3.3. Bônus Positivos

- **Primeira Coleta de Pellet/Power na Célula:** +0.5 (novidade de coleta).
- **Primeira Visita à Célula (sem coletar):** +0.2 (incentivo a exploração espacial).
- **Aproximação de Pellet (shaping de distância):** delta de distância convertido em reward proporcional (`≈0.06 * Δ`).
- **Aumento da Distância Mínima a Fantasmas:** leve incentivo (`≈0.015 * Δ`).

### 3.4. Decaimento de Visitas

A cada ~120 passos as contagens de visita são multiplicadas por 0.85 e valores muito baixos são descartados. Isso reabre incentivo a regiões antigas depois de longo tempo.

---

## 4. Exploração Direcionada & Heurísticas

### 4.1. Estruturas Internas

- `_visitCounts`: número de visitas por célula.
- `_visitHist`: sequência recente para detectar repetição / ping-pong.
- `_collectedCells`: células das quais já se removeu pellet/power.
- `_cellSequence`: rastro curto de posições para análises anti-stuck.
- `_recentPositions`: janela usada para detectar confinamento (corner trap).

### 4.2. Viés Local de Direção

Quando ε < 0.25 o agente reclassifica direções disponíveis com o escore:

```
score = (visits==0 ? grande bônus : inverso de visitas)
      + bônus extra por pellet/power
      + bônus por adjacentes frescas
      + pequena aleatoriedade
```

Prioriza agressivamente células inéditas, sobretudo contendo recursos.

### 4.3. Planejamento BFS (Micro-Pathfinding)

- Acionado se todas direções imediatas forem "gastas" (visitadas e sem pellet/power).
- BFS limitada (profundidade ≤ ~40) procura o primeiro pellet/power não visitado.
- Retorna apenas **o primeiro passo** do caminho encontrado para manter interação com o Q-Learning (não substitui aprendizado, complementa).

### 4.4. Escape de Confinamento (Corner Trap)

- Calcula bounding box das últimas ~30 posições; se (largura + altura) ≤ 6 e diversidade de células baixa -> considera aprisionado.
- Força direção planejada (via BFS aumentada) para sair do cluster.

### 4.5. Timeout de Episódio

- Após 1000 passos sem vitória: episódio termina com penalidade; limpa estruturas para restaurar novidade.

---

## 5. Anti-Stuck Camadas (Resumo)

| Camada            | Objetivo                          | Técnica                                                                |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Ping-Pong         | Evitar ABAB                       | Detecta padrão nos últimos 4 passos e força alternativa                |
| Baixa Diversidade | Romper microloops                 | Monitoriza set de últimas células; se poucas distintas, altera direção |
| Starvation        | Punir estagnação sem coleta       | Penalidade crescente quadrática                                        |
| Revisita          | Reduz atrito em regiões esgotadas | Penalidade escalonada após limiar                                      |
| Corner Trap       | Sair de bolsões fechados          | Bounding box + BFS saída                                               |
| Timeout           | Episódio sem progresso            | Finaliza e reseta heurísticas                                          |

---

## 6. Fantasmas – IA Baseada em Modos

### 6.1. Modos

1. **Scatter:** cada fantasma visa seu canto fixo do mapa.
2. **Chase:** comportamento de perseguição personalizado por personalidade.
3. **Frightened:** movimento aleatório lento; ativado após power pellet (até expirar). Se comido retorna como _eyes_.
4. **Eyes:** estado de retorno rápido à casa central (após ser comido no frightened).

### 6.2. Ciclo Scatter ↔ Chase

Tabela simplificada de duração (ms) para primeiras alternâncias:

```
[ {scatter:7000, chase:20000},
  {scatter:7000, chase:20000},
  {scatter:5000, chase:20000},
  {scatter:5000, chase:20000} ] -> Chase contínuo
```

Quando frightened ocorre, pausa-se a atualização normal do ciclo.

### 6.3. Personalidades e Alvos

| Fantasma | Cor                | Scatter Target | Chase Target (Resumo)                                             |
| -------- | ------------------ | -------------- | ----------------------------------------------------------------- |
| Blinky   | vermelho (#ff0000) | topo-direito   | Posição atual do Pac-Man (pressiona direto)                       |
| Pinky    | rosa (#ffb8ff)     | topo-esquerdo  | 4+ células à frente da direção atual do Pac-Man (antecipação)     |
| Inky     | ciano (#00ffff)    | baixo-direito  | Vetor usando posição projetada do Pac-Man + Blinky (efeito cerco) |
| Clyde    | laranja (#ffb852)  | baixo-esquerdo | Persegue se distante (>8); caso contrário volta ao canto          |

### 6.4. Decisão de Direção

- Executada quando fantasma está centralizado na célula (progress ≈ 0).
- Remove direção reversa (evita oscilações imediatas).
- Avalia opções conforme distância Manhattan ao `target` do modo atual.
- Em frightened (aleatório) e eyes (target casa central fixo).

### 6.5. Modo Frightened

- Trigger: Pac-Man coleta power pellet.
- Fantasmas (não olhos) invertem direção inicial e entram em modo frightened com velocidade reduzida.
- Se comidos: flag `eaten` -> entra `eyes` e navega de volta à casa; ao chegar retoma ciclo normal em scatter.

### 6.6. Parâmetros Adaptativos (Opcional)

Estrutura `adaptive` (ex.: `scatterFactor`, `predictionAhead`, `randomness`, `chaseWeight`) pode ajustar:

- Duração efetiva de scatter.
- Quantidade de células projetadas à frente (Pinky / Inky).
- Grau de aleatoriedade extra.
- Peso ao calcular proximidade ao alvo.

### 6.7. Separação de Responsabilidades

- `Game.tsx` controla transições de frightened, eyes e resets.
- `ghostAI.ts` calcula alvo (scatter/chase) e decide direção.

---

## 7. Interação Pac-Man ↔ Fantasmas

| Aspecto                                   | Efeito                                                                |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Distâncias nos estados do RL              | Pac-Man aprende implicitamente evitar proximidade extrema             |
| Recompensa de comer fantasma (frightened) | Incentiva aproveitar janela de vulnerabilidade                        |
| Shaping de distância                      | Reforça afastamento suave fora frightened para reduzir risco de morte |

---

## 8. Fluxo de Dados (ASCII)

### 8.1. Pac-Man RL Loop

```
[Estado Atual] -> encodeState -> Q-Table lookup
    |                     |
    |<-- recompensa anterior -- updateQLearning
    v
ε-greedy ação -> heurísticas anti-stuck / viés / BFS -> direção final
    v
Move / Consome -> computa eventos -> computeReward -> updateQLearning
    v
Checa episódio (win/death/timeout) -> endEpisode (ajusta ε) -> reset estruturas
```

### 8.2. Fantasma Loop

```
Cada frame:
  se frightened/eyes -> manter modo especial
  senão -> updateGhostBrain (alternância tempo)
  quando progress≈0:
      determinar target (scatter/chase/personality)
      filtrar reverso
      escolher direção que minimiza distância (ou aleatória se frightened)
  mover fantasma
  colisão com Pac-Man -> morte Pac-Man ou fantasma comido
```

---

## 9. Estratégias de Tuning Futuras

- Ajustar pesos de exploração (ex.: reduzir peso de freshAdj se exagero).
- Introduzir penalidade adicional por aproximação perigosa simultânea de múltiplos fantasmas (>1 muito perto).
- Salvar snapshots de Q-table para comparar evolução ao longo dos episódios.
- Parametrizar BFS `maxDepth` conforme fase / densidade de pellets remanescente.

---

## 10. Boas Práticas Aplicadas

| Prática                                  | Benefício                                               |
| ---------------------------------------- | ------------------------------------------------------- |
| Estado reduzido                          | Evita explosão combinatória na Q-table                  |
| Reward shaping gradual                   | Direciona aprendizado sem destruir sinal principal      |
| Heurísticas locais + BFS                 | Combinação de reatividade imediata e planejamento curto |
| Anti-stuck multicamadas                  | Robustez contra loops patológicos                       |
| Logging / métricas visuais               | Facilita debugging e apresentação acadêmica             |
| Separação de arquivos (rl/ghostAI/logic) | Manutenibilidade e clareza                              |

---

## 11. Resumo Final

O Pac-Man aprende a navegar utilizando Q-Learning enriquecido com sinais de progresso (coleta, aproximação, distância de risco) e diversos mecanismos de exploração inteligente. Os fantasmas utilizam uma abordagem clássica de estados temporais com alvos dinâmicos por personalidade. O resultado é um ecossistema onde o agente principal evolui ao longo dos episódios, enquanto adversários mantêm comportamento previsível porém estratégico – ideal para estudo comparativo entre IA de aprendizado e IA baseada em regras.

---

## 12. Glossário Rápido

- **Q-Table:** Estrutura de dados que armazena valores de utilidade para pares (estado, ação).
- **ε-greedy:** Estratégia que escolhe ação aleatória com probabilidade ε e a melhor ação conhecida caso contrário.
- **Reward Shaping:** Ajuste de recompensas para acelerar aprendizagem sem alterar objetivo final.
- **Starvation:** Situação de muitos passos sem progresso (coleta), usada para penalizar estagnação.
- **Scatter / Chase / Frightened / Eyes:** Modos clássicos de comportamento dos fantasmas em Pac-Man.
- **Bounding Box Confinement:** Técnica de detectar se o agente está preso em pequena região.
- **BFS (Breadth-First Search):** Busca em largura para planejar caminho curto até objetivo.

---

## 13. Referências (Sugestões)

- Sutton & Barto – _Reinforcement Learning: An Introduction_.
- Análises clássicas de IA do Pac-Man (papers e artigos sobre personalities & pathfinding).
- Recursos sobre reward shaping e exploração adaptativa.

---

_Documento gerado para apoio em apresentação acadêmica e revisão conceitual._
