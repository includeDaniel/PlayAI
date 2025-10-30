// Criando a cobra, maçã e algoritmo de busca A*
let snake;
let apple;
let search;

// Pré-carrega os recursos
function preload() {
    mouseImg = loadImage('rato.png');
}

// Configurando tudo
function setup() {
    let canvas = createCanvas(1200, 600);
    canvas.parent('gameContainer');
    snake = new Snake();
    apple = new Apple();
    search = new Search(snake, apple);
    search.getPath();
    frameRate(200);
}

function draw() {
    background(51);
    snake.show();
    apple.show();
    snake.update(apple);
}