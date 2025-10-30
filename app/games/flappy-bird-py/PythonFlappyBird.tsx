import type { JSX } from "react";
import { Link } from "react-router-dom";
import "./PythonFlappyBird.css";

export default function PythonFlappyBird(): JSX.Element {
    return (
        <div className="page-container">
            <main className="main-content">
                {/* Cabeçalho */}
                <header className="header">
                    <div className="header-top">
                        <Link to="/" className="back-button" aria-label="Voltar para a página inicial">← Voltar</Link>
                        <h1>Como funciona a IA que aprende a jogar Flappy Bird</h1>
                    </div>
                    <div className="header-content">
                        <div className="text-content">
                            <div>
                                <p>
                                    Neste projeto, demonstramos como uma inteligência artificial aprende a jogar Flappy Bird utilizando
                                    <strong> redes neurais </strong> combinadas com
                                    <strong> algoritmos evolutivos (NEAT)</strong>.
                                </p>
                                <p>
                                    Durante várias gerações, os pássaros virtuais aprendem a saltar na hora certa, evitando obstáculos,
                                    até que se tornem capazes de voar por longos períodos sem colidir.
                                    Todo o processo envolve evolução progressiva, seleção natural simulada e adaptação baseada em desempenho.
                                </p>
                            </div>

                        </div>

                        <div className="media-box small-video">
                            <video src="/PythonFlappyBird/flappy-bird-py-gif.mp4" autoPlay muted loop></video>
                            <p className="caption">Vídeo — Comunicação entre o jogo e o algoritmo NEAT.</p>
                        </div>
                    </div>
                </header>

                {/* 1. Estrutura geral do sistema */}
                <section className="section">
                    <h2>Estrutura geral do sistema</h2>
                    <p>O sistema é composto por duas partes principais que trabalham em conjunto:</p>
                    <ul>
                        <li>
                            <strong>O jogo Flappy Bird:</strong> Implementado em Python com a biblioteca <code>pygame</code>. Ele gerencia toda a mecânica do jogo, incluindo movimentação do pássaro, geração de canos, colisões e pontuação.
                            <ul>
                                <li>O <em>pássaro</em> segue regras de física simplificadas: gravidade constante, impulso ao pular e rotação da imagem baseada no movimento vertical.</li>
                                <li>O <em>chão</em> e o <em>plano de fundo</em> são renderizados continuamente, criando a sensação de movimento infinito.</li>
                                <li>Os <em>canos</em> são gerados com alturas aleatórias e espaçamento progressivo, aumentando a dificuldade conforme a pontuação cresce.</li>
                                <li>Colisões são detectadas com precisão usando máscaras de pixel (<code>pygame.mask</code>), garantindo que o pássaro só “morre” quando realmente toca os obstáculos.</li>
                                <li>Sons de <em>pulo</em> e <em>pontuação</em> proporcionam feedback auditivo, tornando a experiência mais imersiva.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>A IA que joga automaticamente:</strong> Cada pássaro é controlado por uma rede neural criada e treinada pelo algoritmo NEAT. A IA decide quando pular com base em entradas do ambiente.
                            <ul>
                                <li>Cada geração possui dezenas ou centenas de pássaros, representando indivíduos distintos na população do NEAT.</li>
                                <li>Os inputs da rede neural incluem: posição vertical do pássaro e distância até a parte superior e inferior do próximo cano.</li>
                                <li>A saída da rede neural indica se o pássaro deve saltar ou permanecer no curso atual.</li>
                                <li>O NEAT ajusta tanto os pesos quanto a topologia da rede ao longo de várias gerações, maximizando a aptidão (<em>fitness</em>), baseada em distância percorrida e pontuação acumulada.</li>
                                <li>Indivíduos com melhor desempenho sobrevivem e se reproduzem, permitindo evolução progressiva e adaptação ao ambiente.</li>
                            </ul>
                        </li>
                    </ul>
                    <p>
                        O objetivo final é que a IA aprenda a voar o mais longe possível sem colidir, enquanto o jogo simula física realista e aumenta a dificuldade gradualmente.
                    </p>
                    <p>O código define parâmetros dinâmicos para controlar dificuldade e evolução, como:</p>
                    <ul>
                        <li>Velocidade dos canos que aumenta conforme a pontuação (<code>Pipe.SPEED</code>).</li>
                        <li>Espaçamento entre os canos ajustado dinamicamente para desafios mais difíceis à medida que o jogo avança.</li>
                        <li>Sistema de pontuação e fitness que influencia diretamente a evolução da rede neural.</li>
                    </ul>
                </section>

                {/* 2. Inputs da Rede Neural */}
                <section className="section">
                    <h2>Inputs da Rede Neural</h2>
                    <p>
                        Para tomar decisões, cada rede neural precisa “enxergar” o ambiente ao redor.
                        Os inputs funcionam como sensores do pássaro, fornecendo informações essenciais para que a IA escolha a ação adequada a cada instante.
                    </p>
                    <ul>
                        <li>
                            <strong>Altura do pássaro (bird.y)</strong> — posição vertical atual do pássaro na tela. Permite avaliar se ele está alto ou baixo em relação ao próximo obstáculo.
                        </li>
                        <li>
                            <strong>Distância até o topo do próximo cano (abs(bird.y - pipe.height))</strong> — mede o espaço vertical entre o pássaro e a parte superior do cano. Indica se precisa subir para evitar colisão.
                        </li>
                        <li>
                            <strong>Distância até a base do próximo cano (abs(bird.y - pipe.bottom_pos))</strong> — mede a distância até a extremidade inferior do cano, ajudando a prevenir quedas ou saltos desnecessários.
                        </li>
                    </ul>
                    <p>
                        Esses três inputs fornecem informações detalhadas sobre:
                        <ul>
                            <li>Posição relativa do pássaro em relação ao obstáculo seguinte.</li>
                            <li>Necessidade de saltar ou manter a trajetória atual.</li>
                            <li>Como ajustar o movimento vertical para percorrer a maior distância possível.</li>
                        </ul>
                    </p>
                    <div className="media-box flex-image-right">
                        <div className="media-text">
                            <p>
                                A rede neural processa esses valores e gera uma saída, que determina se o pássaro deve pular. Com a evolução, a IA aprende padrões complexos, antecipando obstáculos e reagindo rapidamente a mudanças de altura.
                            </p>
                        </div>
                        <div className="media-img">
                            <img src="/PythonFlappyBird/input.png" alt="Diagrama ilustrando os três inputs usados pela rede (altura do pássaro e distâncias superior e inferior do cano)." />
                            <p className="caption">Figura 2 — Diagrama dos três inputs usados pela rede neural (altura do pássaro e distâncias ao cano).</p>
                        </div>
                    </div>
                </section>

                {/* 3. Estrutura da Rede Neural */}
                <section className="section">
                    <h2>Estrutura da Rede Neural</h2>
                    <p>A rede neural é organizada em camadas que processam os inputs e decidem a ação do pássaro:</p>
                    <ul>
                        <li>
                            <strong>Camada de entrada:</strong> recebe os 3 inputs do jogo, que funcionam como sensores do ambiente.
                        </li>
                        <li>
                            <strong>Camadas ocultas:</strong> presentes ou não dependendo da configuração do NEAT. Permitem à rede aprender padrões complexos, como prever movimentos futuros ou calcular trajetórias seguras.
                        </li>
                        <li>
                            <strong>Camada de saída:</strong> possui um único neurônio que gera um valor contínuo, interpretado como:
                            <ul>
                                <li>Output maior que 0.5 → Pular</li>
                                <li>Output ≤ 0.5 → Não pular</li>
                            </ul>
                        </li>
                    </ul>

                    <h3>Como a decisão é calculada:</h3>
                    <p>
                        Cada input é multiplicado por seu peso correspondente, somado a um bias e processado por uma função de ativação (<code>tanh</code>). Sem o bias, a saída seria sempre zero se todas as entradas forem zero (dependendo da função de ativação). O bias desloca a função para cima ou para baixo, dando mais flexibilidade à rede para aprender padrões. O resultado contínuo é convertido em ação:
                    </p>
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
                    <p>
                        O NEAT permite que a topologia da rede evolua: adicionar ou remover nós e conexões, ajustando pesos e biases para aumentar a eficiência e maximizar a pontuação.
                    </p>
                    <p>
                        Resumindo, a rede neural transforma informações do ambiente em decisões concretas (pular ou não) e sua estrutura evolui automaticamente para melhorar a performance da IA ao longo do tempo.
                    </p>
                    <div className="media-box flex-image-right">
                        <div className="media-text">
                            <p>
                                Exemplo visual do algoritmo NEAT em ação, mostrando a evolução das conexões e nós ao longo das gerações.
                            </p>
                        </div>
                        <div className="media-img figure-3">
                            <img src="/PythonFlappyBird/neat.jpg" alt="Exemplo de evolução de topologia de rede pelo NEAT, mostrando nós e conexões sendo alterados ao longo das gerações." style={{ width: "280px" }} />
                            <p className="caption">Figura 3 — Exemplo da evolução da topologia de redes com NEAT (nós e conexões).</p>
                        </div>
                    </div>
                </section>

                {/* 4. Algoritmo Evolutivo (NEAT) */}
                <section className="section">
                    <h2>Algoritmo Evolutivo (NEAT)</h2>
                    <p>
                        A IA aprende usando o <strong>NEAT</strong> (NeuroEvolution of Augmenting Topologies), um algoritmo genético especializado em redes neurais, que simula evolução biológica para melhorar o desempenho ao longo das gerações.
                    </p>
                    <ul>
                        <li>
                            <strong>População:</strong> dezenas ou centenas de pássaros são criados, cada um com uma rede neural única. Pesos e biases iniciais são aleatórios.
                        </li>
                        <li>
                            <strong>Fitness:</strong> pontuação baseada no desempenho (distância percorrida, canos ultrapassados, tempo de sobrevivência), indicando aptidão para reprodução.
                        </li>
                        <li>
                            <strong>Seleção:</strong> apenas os pássaros com maior fitness têm maior chance de transmitir genes à próxima geração.
                        </li>
                        <li>
                            <strong>Crossover:</strong> mistura de genes de dois indivíduos selecionados, combinando características de ambos.
                        </li>
                        <li>
                            <strong>Mutação:</strong> pequenas alterações aleatórias nos pesos, biases ou na estrutura da rede, explorando novas estratégias e evitando estagnação.
                        </li>
                    </ul>

                    <p>
                        Diferente de algoritmos genéticos tradicionais, o NEAT também evolui a <strong>topologia</strong> da rede:
                    </p>
                    <ul>
                        <li>Adiciona novos neurônios ou conexões entre eles.</li>
                        <li>Mantém histórico de inovações para preservar estruturas vantajosas durante crossover.</li>
                        <li>Permite aumentar a complexidade gradualmente, aprendendo estratégias mais sofisticadas.</li>
                    </ul>

                    <p><strong>Analogia:</strong> Algoritmo Genético clássico altera apenas atributos; NEAT altera atributos e estrutura interna, como adicionar asas ou mudar conexões internas do organismo.</p>

                    <h3>Fluxo do NEAT no jogo:</h3>
                    <ol>
                        <li>Criar população inicial de redes neurais aleatórias.</li>
                        <li>Cada pássaro joga, calculando fitness em tempo real.</li>
                        <li>Selecionar indivíduos de maior performance para reprodução.</li>
                        <li>Aplicar crossover e mutação, incluindo novos nós ou conexões.</li>
                        <li>Repetir por várias gerações até obter redes eficientes.</li>
                    </ol>

                    <p>
                        No código, classes como <code>Population</code>, <code>Genome</code> e o método <code>pop.run(main, 100)</code> controlam o processo, executando o jogo por 100 gerações ou até atingir fitness máximo.
                    </p>
                    <div className="media-box flex-image-right">
                        <div className="media-text">
                            <p>
                                Ilustração do processo de seleção natural no NEAT, onde apenas os melhores indivíduos passam seus genes para a próxima geração.
                            </p>
                        </div>
                        <div className="media-img">
                            <img src="/PythonFlappyBird/selection.png" alt="Ilustração do processo de seleção no NEAT mostrando indivíduos escolhidos para reprodução com base no fitness." />
                            <p className="caption">Figura 4 — Processo de seleção no NEAT (indivíduos selecionados para reprodução).</p>
                        </div>
                    </div>
                </section>

                {/* 5. Comparação entre RNA e Algoritmo Genético */}
                <section className="section">
                    <h2>Paralelo entre Rede Neural e Algoritmo Genético</h2>
                    <p>
                        A rede neural é o "organismo" que reage ao ambiente, enquanto o NEAT é a "evolução" que seleciona e aprimora esses organismos ao longo das gerações.
                    </p>
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
                                <td style={{ padding: "0.5rem" }}>Conjunto completo de pesos e biases da rede neural, representando a “configuração genética” do pássaro.</td>
                                <td style={{ padding: "0.5rem" }}>Representação do indivíduo na população, definindo comportamento inicial.</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.5rem" }}>Gene</td>
                                <td style={{ padding: "0.5rem" }}>Peso ou bias individual dentro da rede, influenciando diretamente a decisão (pular ou não).</td>
                                <td style={{ padding: "0.5rem" }}>Peso ou bias específico do indivíduo, cuja alteração pode modificar comportamento.</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.5rem" }}>Mutação</td>
                                <td style={{ padding: "0.5rem" }}>Ajuste leve em pesos e biases, explorando novas estratégias sem destruir aprendizado.</td>
                                <td style={{ padding: "0.5rem" }}>Alteração aleatória de genes, introduzindo diversidade genética.</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.5rem" }}>Fitness</td>
                                <td style={{ padding: "0.5rem" }}>Pontuação no jogo (distância, canos ultrapassados), indicando performance da rede.</td>
                                <td style={{ padding: "0.5rem" }}>Avaliação do desempenho do indivíduo; maior fitness aumenta chance de reprodução.</td>
                            </tr>
                        </tbody>
                    </table>
                    <p>
                        Em resumo, a rede neural determina o comportamento do pássaro, enquanto o NEAT seleciona, mistura e evolui essas redes, permitindo aprendizado contínuo e estratégias cada vez mais eficientes.
                    </p>

                    <div className="media-box flex-image-right">
                        <div className="media-text">
                            <p>
                                Resultado final: IA dominando o jogo após várias gerações, atingindo alta pontuação e desempenho consistente.
                            </p>
                        </div>
                        <div className="media-img">
                            <img src="/PythonFlappyBird/highScore.png" alt="Gráfico mostrando a IA alcançando alta pontuação após várias gerações de treinamento." />
                            <p className="caption">Figura 5 — Resultado final: IA dominando o jogo após várias gerações.</p>
                        </div>
                    </div>
                </section>

                {/* 6. Download e execução */}
                <section className="section download-section">
                    <h2>Baixar o projeto</h2>
                    <p>
                        Você pode baixar o projeto completo com todos os arquivos necessários para executar o Flappy Bird AI:
                    </p>
                    <a href="/PythonFlappyBird/FlappyBirdAI.zip" className="download-button" download>
                        Baixar projeto (Flappy-Bird-AI.zip)
                    </a>
                </section>

                <section className="section">
                    <h2>Como executar localmente</h2>
                    <ol>
                        <li>
                            <strong>Pré-requisitos:</strong> Python 3.8 ou superior.
                            <pre>
                                {`python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\\Scripts\\activate   # Windows`}
                            </pre>
                            <p>Cria e ativa um ambiente virtual, isolando as dependências do sistema.</p>
                        </li>

                        <li>
                            <strong>Instalar dependências:</strong>
                            <pre>pip install -r requirements.txt</pre>
                            <p>
                                O arquivo <code>requirements.txt</code> contém todas as bibliotecas necessárias, incluindo
                                <code>pygame</code> (motor gráfico) e <code>neat-python</code> (algoritmo evolutivo).
                            </p>
                        </li>

                        <li>
                            <strong>Estrutura mínima do projeto:</strong>
                            <pre>
                                {`/assets
/src
  └── /game
       └── FlappyBird.py
       └── configs.txt
requirements.txt`}
                            </pre>
                            <p>
                                A pasta <code>/assets</code> contém as imagens e sons do jogo,
                                enquanto <code>/config</code> define os parâmetros de evolução usados pelo NEAT.
                            </p>
                        </li>

                        <li>
                            <strong>Executar o jogo:</strong>
                            <pre>python src/game/FlappyBird.py</pre>
                            <p>Durante a execução, o terminal exibirá informações como:</p>
                            <ul>
                                <li>Média de fitness da população</li>
                                <li>Melhor fitness da geração</li>
                                <li>Quantidade de espécies e progresso evolutivo</li>
                            </ul>
                            <p>Esses dados permitem acompanhar a evolução da IA em tempo real.</p>
                        </li>
                    </ol>
                    <div className="media-box flex-image-right">
                        <div className="media-text" style={{ marginRight: "80px" }}>
                            <p>
                                Exemplo de logs e métricas exibidas durante a execução do treinamento, permitindo acompanhar a evolução da IA em tempo real.
                            </p>
                        </div>
                        <div className="media-img figure-6">
                            <img src="/PythonFlappyBird/logs.png" alt="Captura de tela de logs e métricas exibidas durante o treinamento (média de fitness, melhor da geração)." style={{ width: "350px" }} />
                            <p className="caption">Figura 6 — Logs e métricas exibidas durante o treinamento (fitness, melhor da geração).</p>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <h2>Dicas e experimentos</h2>
                    <ul>
                        <li>
                            Aumente <code>pop_size</code> no arquivo de configuração para ampliar a diversidade genética e acelerar o aprendizado.
                        </li>
                        <li>
                            Teste funções de ativação diferentes (<code>sigmoid</code>, <code>relu</code>, etc.) para observar mudanças no comportamento da IA.
                        </li>
                        <li>
                            Ajuste a função de fitness para enfatizar critérios específicos, como distância percorrida ou estabilidade de voo.
                        </li>
                        <li>
                            Salve o melhor genoma usando <code>pickle</code> para reutilização posterior sem reiniciar a evolução.
                        </li>
                        <li>
                            Observe o terminal para métricas avançadas como tempo por geração e divergência genética
                            (<em>mean genetic distance</em>), úteis na análise de performance.
                        </li>
                    </ul>
                    <p>
                        Seguindo essas etapas, você poderá executar o Flappy Bird AI localmente, testar modificações e
                        explorar a evolução do aprendizado em tempo real.
                    </p>
                </section>


                <footer className="footer">
                    <p>Documentação voltada para aprendizado e experimentação — adapte parâmetros conforme necessidade.</p>
                </footer>
            </main>
        </div>
    );
}
