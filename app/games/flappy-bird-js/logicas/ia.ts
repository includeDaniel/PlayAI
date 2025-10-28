// Lógica da IA: genes como bits e perceptron
// Arquivo traduzido para PT-BR com comentários explicativos

export type Genes = boolean[];

export interface EntradaRede {
  distanciaCano: number;
  canoY: number;
  velocidadePassaro: number;
  passaroY: number;
  pesos: number[];
}

export const GENE_BITS = 22;
export const NUM_GENES = 4;
export const TOTAL_BITS = GENE_BITS * NUM_GENES;

// Converte 22 bits (boolean[]) para número no intervalo [-1, 1]
export function bitsParaNumero(bits: boolean[]): number {
  if (bits.length !== GENE_BITS) throw new Error("bitsParaNumero: tamanho incorreto");
  let val = 0;
  for (let i = 0; i < GENE_BITS; i++) {
    if (bits[i]) val |= (1 << (GENE_BITS - 1 - i));
  }
  const norm = val / ((1 << GENE_BITS) - 1);
  return norm * 2 - 1;
}

// Converte número no intervalo [-1, 1] para 22 bits (boolean[])
export function numeroParaBits(num: number): boolean[] {
  const clamped = Math.max(-1, Math.min(1, num));
  const norm = (clamped + 1) / 2;
  const val = Math.round(norm * ((1 << GENE_BITS) - 1));
  const bits: boolean[] = [];
  for (let i = GENE_BITS - 1; i >= 0; i--) {
    bits.push(Boolean((val >> i) & 1));
  }
  return bits;
}

// Gera genes aleatórios (TOTAL_BITS bits)
export function criarGenesAleatorios(): Genes {
  return Array.from({ length: TOTAL_BITS }, () => Math.random() < 0.5);
}

// Cruzamento/mutação bit a bit entre dois genes
export function cruzarGenes(g1: Genes, g2: Genes): Genes {
  const out: Genes = [];
  for (let i = 0; i < TOTAL_BITS; i++) {
    const p = Math.random();
    if (p < 0.45) out.push(g1[i]);
    else if (p < 0.9) out.push(g2[i]);
    else out.push(Math.random() < 0.5); // mutação
  }
  return out;
}

// Extrai os 4 pesos (números) a partir dos 88 bits
export function extrairPesos(genes: Genes): number[] {
  const pesos: number[] = [];
  for (let i = 0; i < NUM_GENES; i++) {
    const bits = genes.slice(i * GENE_BITS, (i + 1) * GENE_BITS);
    pesos.push(bitsParaNumero(bits));
  }
  return pesos;
}

// Calcula a decisão do perceptron a partir das entradas e dos genes
// Retorna true para pular, false caso contrário
export function calcularPuloPorGenes(distanciaCano: number, canoY: number, velocidadePassaro: number, passaroY: number, genes: Genes) {
  const pesos = extrairPesos(genes);
  const entradas = [distanciaCano, canoY, velocidadePassaro, passaroY];
  const soma = entradas.reduce((acc, entrada, idx) => acc + entrada * pesos[idx], 0);
  return soma >= 0;
}

// Cria uma população de genes (array de Genes)
export function criarPopulacaoGenes(tamanho: number): Genes[] {
  return Array.from({ length: tamanho }, () => criarGenesAleatorios());
}
