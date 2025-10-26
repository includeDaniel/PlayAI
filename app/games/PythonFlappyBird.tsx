import type { JSX } from "react";
import "./PythonFlappyBird.css";

export default function PythonFlappyBird(): JSX.Element {
    return (
        <div className="page-container">
            <main className="main-content">
                {/* Cabeçalho */}
                <header className="header">
                    <h1>Como funciona a IA que aprende a jogar Flappy Bird</h1>
                    <p>
                        Neste projeto, mostramos como uma inteligência artificial aprende a jogar Flappy Bird usando <strong>redes neurais</strong> e <strong>algoritmos evolutivos (NEAT)</strong>.
                        Ao longo de várias gerações, os pássaros virtuais aprendem a pular na hora certa e evitam obstáculos, evoluindo até se tornarem praticamente imortais.
                    </p>
                </header>

                {/* 1. Estrutura geral do sistema */}
                <section className="section">
                    <h2> Estrutura geral do sistema</h2>
                    <p>O sistema é composto por duas partes principais:</p>
                    <ul>
                        <li>
                            <strong>O jogo Flappy Bird: </strong>
                            reproduzido em Python usando a biblioteca <code>pygame</code>.
                            O jogo controla o movimento do pássaro, canos e pontuação.
                            <ul>
                                <li>O pássaro pode subir ou cair a cada frame.</li>
                                <li>O jogo registra pontuação, colisões e distância percorrida.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>A IA que joga automaticamente: </strong>
                            cada pássaro é uma rede neural que decide quando pular.
                            <ul>
                                <li>Cada geração possui dezenas ou centenas de pássaros.</li>
                                <li>Inicialmente, eles pulam de forma aleatória.</li>
                                <li>Ao longo do tempo, os melhores aprendem a jogar melhor.</li>
                            </ul>
                        </li>
                    </ul>
                    <p>O objetivo final da IA é aprender a voar o mais longe possível sem bater em nenhum obstáculo.</p>
                </section>

                {/* 2. Inputs da Rede Neural */}
                <section className="section">
                    <h2> Inputs da Rede Neural</h2>
                    <p>Para tomar decisões, a rede neural precisa "enxergar" o ambiente. Os inputs principais são:</p>
                    <ul>
                        <li><strong>Altura do pássaro</strong> — posição vertical na tela.</li>
                        <li><strong>Distância até o topo do próximo cano</strong> — para saber se precisa subir.</li>
                        <li><strong>Distância até a base do próximo cano</strong> — para saber se precisa descer ou não pular.</li>
                    </ul>
                    <p>
                        Pense nos inputs como sensores do pássaro: eles fornecem informações que permitem calcular a melhor ação a cada momento.
                    </p>
                </section>

                {/* 3. Estrutura da Rede Neural */}
                <section className="section">
                    <h2> Estrutura da Rede Neural</h2>
                    <p>A rede neural é organizada em camadas:</p>
                    <ul>
                        <li><strong>Camada de entrada:</strong> recebe os 3 inputs do jogo.</li>
                        <li><strong>Camada oculta:</strong> opcional, ajuda a rede a aprender padrões complexos (como calcular quando passar entre dois canos próximos).</li>
                        <li><strong>Camada de saída:</strong> retorna 1 (pular) ou 0 (não pular).</li>
                    </ul>

                    <h3>Como a decisão é tomada:</h3>
                    <p>Cada input é multiplicado por um peso, somado a um bias e passado por uma função de ativação. Exemplo simplificado:</p>
                    <pre>
                        {`input_y = 30
input_cano_sup = 4
input_cano_inf = -7
pesos = [0.5, 2, 1.3]
bias = -5

soma = 30*0.5 + 4*2 + (-7*1.3) + (-5) = 8.9
output = tanh(soma) ≈ 0.999

Se output > 0.5 → PULA
Se output ≤ 0.5 → NÃO PULA`}
                    </pre>
                    <p>Ou seja, a rede neural transforma informações do ambiente em uma decisão clara: pular ou não.</p>
                </section>

                {/* 4. Algoritmo Evolutivo (NEAT) */}
                <section className="section">
                    <h2> Algoritmo Evolutivo (NEAT)</h2>
                    <p>
                        Para que a IA aprenda a jogar, usamos o <strong>NEAT</strong> (NeuroEvolution of Augmenting Topologies),
                        que é uma forma de <strong>algoritmo genético especializado em redes neurais</strong>.
                        Ele segue os mesmos princípios de evolução biológica:
                    </p>

                    <ul>
                        <li><strong>População:</strong> dezenas ou centenas de redes neurais (pássaros) são criadas com pesos e bias aleatórios.</li>
                        <li><strong>Fitness:</strong> cada pássaro é avaliado pelo desempenho no jogo (distância percorrida, canos ultrapassados).</li>
                        <li><strong>Seleção:</strong> os melhores pássaros passam seus genes (pesos e bias) para a próxima geração.</li>
                        <li><strong>Crossover:</strong> mistura de genes de dois pássaros para gerar descendentes.</li>
                        <li><strong>Mutação:</strong> pequenas alterações aleatórias em pesos, bias ou estrutura da rede.</li>
                    </ul>

                    <p>
                        O diferencial do NEAT é que ele <strong>não apenas ajusta os pesos da rede</strong>, mas também evolui a <strong>topologia</strong> da rede:
                    </p>
                    <ul>
                        <li>Adiciona novos neurônios (nós) ou novas conexões entre neurônios.</li>
                        <li>Mantém um histórico de inovações para que boas estruturas não se percam durante o crossover.</li>
                        <li>Permite que a rede evolua em complexidade, aprendendo estratégias mais sofisticadas ao longo de várias gerações.</li>
                    </ul>

                    <p>
                        <strong>Analogia simples:</strong>
                        - Algoritmo Genético clássico: você muda apenas os atributos de um pássaro (cor, tamanho das asas).
                        - NEAT: você pode mudar atributos <em>e</em> adicionar novas asas ou alterar o corpo do pássaro. Ou seja, a estrutura também evolui.
                    </p>

                    <h3>Fluxo resumido do NEAT</h3>
                    <ol>
                        <li>Criar população inicial com redes neurais aleatórias.</li>
                        <li>Cada rede joga e calcula seu fitness.</li>
                        <li>Selecionar os melhores indivíduos.</li>
                        <li>Aplicar crossover e mutação, incluindo possibilidade de adicionar nós/conexões.</li>
                        <li>Repetir por várias gerações até surgir um pássaro muito eficiente.</li>
                    </ol>
                </section>

                {/* 5. Comparação entre RNA e Algoritmo Genético */}
                <section className="section">
                    <h2> Paralelo entre Rede Neural e Algoritmo Genético</h2>
                    <p>Podemos pensar na rede neural como um organismo, e no algoritmo genético como a evolução:</p>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: "1px solid #333", padding: "0.5rem" }}>Conceito</th>
                                <th style={{ borderBottom: "1px solid #333", padding: "0.5rem" }}>Rede Neural</th>
                                <th style={{ borderBottom: "1px solid #333", padding: "0.5rem" }}>Algoritmo Genético</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: "0.5rem" }}>Cromossomo</td>
                                <td style={{ padding: "0.5rem" }}>Conjunto de pesos e bias da rede</td>
                                <td style={{ padding: "0.5rem" }}>Pesos e bias de cada pássaro</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.5rem" }}>Gene</td>
                                <td style={{ padding: "0.5rem" }}>Peso ou bias individual</td>
                                <td style={{ padding: "0.5rem" }}>Peso ou bias individual</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.5rem" }}>Mutação</td>
                                <td style={{ padding: "0.5rem" }}>Alteração leve nos pesos/bias</td>
                                <td style={{ padding: "0.5rem" }}>Mudança aleatória em um gene</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.5rem" }}>Fitness</td>
                                <td style={{ padding: "0.5rem" }}>Pontuação no jogo</td>
                                <td style={{ padding: "0.5rem" }}>Pontuação no jogo</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* 6. Download e execução */}
                <section className="section download-section">
                    <h2> Baixar o projeto</h2>
                    <a href="/PythonFlappyBird/FlappyBirdAI.zip" className="download-button" download>
                        Baixar projeto (Flappy-Bird-AI.zip)
                    </a>
                </section>

                <section className="section">
                    <h2> Como executar localmente</h2>
                    <ol>
                        <li>
                            <strong>Pré-requisitos:</strong> Python 3.8+
                            <pre>
                                {`python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\\Scripts\\activate   # Windows`}
                            </pre>
                        </li>
                        <li>
                            <strong>Instalar dependências:</strong>
                            <pre>pip install pygame neat-python</pre>
                        </li>
                        <li>
                            <strong>Estrutura mínima do projeto:</strong>
                            <pre>
                                {`/assets
main.py
configs.txt`}
                            </pre>
                        </li>
                        <li><strong>Executar:</strong> <pre>python main.py</pre></li>
                    </ol>
                </section>

                <section className="section">
                    <h2> Dicas e experimentos</h2>
                    <ul>
                        <li>Aumente <code>pop_size</code> para maior diversidade e evolução mais rápida.</li>
                        <li>Experimente diferentes funções de ativação (<code>sigmoid</code>, <code>relu</code>).</li>
                        <li>Modifique recompensas da função fitness para alterar o comportamento dos pássaros.</li>
                        <li>Salve o melhor genoma com <code>pickle</code> e reutilize para testes futuros.</li>
                    </ul>
                </section>

                <footer className="footer">
                    <p>Documentação voltada para aprendizado e experimentação — adapte os parâmetros conforme suas necessidades.</p>
                </footer>
            </main>
        </div>
    );
}
