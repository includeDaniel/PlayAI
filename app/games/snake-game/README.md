#  Snake Game com IA

Este projeto é uma implementação avançada do clássico jogo Snake, utilizando Inteligência Artificial para controle autônomo da cobra. O diferencial está no uso do algoritmo de pathfinding A* (A-Star), que permite que a cobra encontre sempre o caminho mais eficiente até seu objetivo, evitando colisões.

##  Demonstração

O jogo roda em um tabuleiro de 40x20 células, onde a cobra navega autonomamente utilizando IA para:
- Encontrar o caminho mais curto até a maçã
- Evitar colisões com as paredes
- Evitar colisões com seu próprio corpo
- Calcular rotas de fuga após pegar cada maçã

##  Implementação Detalhada

### 1. Movimento da Cobra

A cobra é implementada como uma lista de posições no tabuleiro, onde cada posição é representada por um vetor com coordenadas x e y.

```javascript
class Snake {
    constructor() {
        this.body = [];
        // A cobra começa com comprimento 3 no canto superior esquerdo
        for (let i = 0; i < 3; i++) {
            this.body[i] = createVector(i, 0);
        }
        this.x_dir = 1;
        this.y_dir = 0;
    }
}
```

### 2. Sistema de Colisões

O jogo implementa três tipos sofisticados de verificações de colisão:

1. **Colisão com Paredes:**
```javascript
if (this.getHeadPosition().x == 39 && this.x_dir == 1) {
    noLoop();
    console.log("Colisão com a parede");
}
```

2. **Colisão com o Corpo:** Verifica se a cabeça da cobra colide com qualquer parte do seu corpo
3. **Coleta da Maçã:** Detecta quando a cobra alcança a posição da maçã

### 3. Algoritmo A* (A-Star)

O coração do sistema de IA é o algoritmo A*, que utiliza três componentes principais:

- **g-score:** Custo do caminho do início até o nó atual
- **h-score:** Estimativa heurística do custo até o objetivo (distância Manhattan)
- **f-score:** Soma de g-score e h-score

```javascript
// Cálculo dos scores no algoritmo A*
filho.g = no_atual.g + 1;
filho.h = Math.abs(filho.x - no_fim.x) + Math.abs(filho.y - no_fim.y);
filho.f = filho.g + filho.h;
```

### 4. Sistema de Geração da Maçã

A maçã é posicionada estrategicamente em espaços vazios do tabuleiro:

```javascript
generate(snake_body) {
    const empty_boxes = this.boxes.filter(function (value) {
        for (let i = 0; i < snake_body.length; i++) {
            if (value.x == snake_body[i].x && value.y == snake_body[i].y) {
                return false;
            }
        }
        return true;
    });
    // Escolhe uma posição aleatória dentre as disponíveis
    const random_position = empty_boxes[int(random(0, empty_boxes.length))];
}
```

### 5. Sistema Inteligente de Planejamento de Rotas

O sistema de planejamento de rotas é o que torna este projeto único:

- Recalcula o caminho dinamicamente
- Verifica rotas de fuga
- Mantém um caminho hamiltoniano virtual
- Adapta-se a mudanças no ambiente

```javascript
// Recálculo do caminho
if ((this.getHeadPosition().x == this.tail_position.x && 
     this.getHeadPosition().y == this.tail_position.y) || 
     this.body.length > 600) {
    this.tail_position = this.getTailPosition();
    search.getPath();
}
```


##  Características Especiais

1. **Infalibilidade:** A cobra nunca comete erros de navegação
2. **Adaptabilidade:** Recálculo constante de rotas
3. **Previsão:** Capacidade de evitar situações de aprisionamento
4. **Eficiência:** Sempre encontra o caminho mais curto possível

##  Ciclo de Jogo

1. A cobra inicia com tamanho 3
2. O algoritmo A* calcula o melhor caminho até a maçã
3. A cobra segue o caminho calculado
4. Ao comer a maçã, o processo se repete
5. O jogo continua até não haver mais espaços disponíveis



##  Estrutura do Projeto

```
snake/
├── index.html          # Página principal do jogo
├── styles.css         # Estilos da interface
├── snake.js          # Lógica da cobra
├── apple.js         # Lógica da maçã
├── search.js       # Implementação do A*
└── sketch.js      # Setup e loop principal
```


##  Funcionamento da IA

A IA utiliza uma combinação sofisticada de:
- Algoritmo A* para pathfinding
- Heurística de distância Manhattan
- Sistema de prevenção de deadlocks
- Planejamento dinâmico de rotas


---

Desenvolvido com 💚 e IA

I have run the AI ten times and it has worked perfectly but I can't be too sure if it is absolutely perfect. Feel free to use my code!

## References
- https://en.wikipedia.org/wiki/A*_search_algorithm
- https://medium.com/@nicholas.w.swift/easy-a-star-pathfinding-7e6689c7f7b2