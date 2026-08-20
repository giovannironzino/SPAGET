/**
 * Índice de Custo Regional da Alimentação por UF e Grandes Regiões Brasileiras.
 * 
 * Fontes Oficiais e Verificáveis:
 * 1. DIEESE - Pesquisa Nacional da Cesta Básica de Alimentos (2025/2026).
 * 2. IBGE - Sistema Nacional de Índices de Preços ao Consumidor (IPCA) - Grupo Alimentação e Bebidas / SIDRA.
 * 3. CONAB - Companhia Nacional de Abastecimento (Boletim Hortigranjeiro / Prohort).
 * 
 * Metodologia:
 * O índice toma o padrão médio nacional (1.00) como referência base.
 * As variações refletem o custo médio dos alimentos básicos em feiras e supermercados de cada região.
 */

export interface RegionalCostProfile {
  uf: string;
  name: string;
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  costMultiplier: number; // Ex: 1.05 = 5% acima da média nacional
  sourceCitation: string;
  seasonCharacteristics: string;
}

export const REGIONAL_PRICE_INDEX: Record<string, RegionalCostProfile> = {
  // SUDESTE
  SP: {
    uf: 'SP',
    name: 'São Paulo',
    region: 'Sudeste',
    costMultiplier: 1.05,
    sourceCitation: 'DIEESE Cesta Básica & IPCA-IBGE (Região Metropolitana de SP)',
    seasonCharacteristics: 'Abastecimento massivo Ceagesp; grande oferta de hortaliças do cinturão verde e frutas.',
  },
  RJ: {
    uf: 'RJ',
    name: 'Rio de Janeiro',
    region: 'Sudeste',
    costMultiplier: 1.08,
    sourceCitation: 'DIEESE Cesta Básica & IPCA-IBGE (Região Metropolitana do RJ)',
    seasonCharacteristics: 'Ceasa-RJ; forte consumo de pescados, tubérculos e hortaliças da serra fluminense.',
  },
  MG: {
    uf: 'MG',
    name: 'Minas Gerais',
    region: 'Sudeste',
    costMultiplier: 0.94,
    sourceCitation: 'DIEESE Cesta Básica (Belo Horizonte) & IPCA-IBGE',
    seasonCharacteristics: 'Polo agropecuário: alta oferta e menor custo de laticínios, feijões, tubérculos e carnes.',
  },
  ES: {
    uf: 'ES',
    name: 'Espírito Santo',
    region: 'Sudeste',
    costMultiplier: 0.96,
    sourceCitation: 'IPCA-IBGE Vitória & Ceasa-ES',
    seasonCharacteristics: 'Forte produção regional de café, frutas tropicais (mamão/banana) e pescados costeiros.',
  },

  // SUL
  RS: {
    uf: 'RS',
    name: 'Rio Grande do Sul',
    region: 'Sul',
    costMultiplier: 1.02,
    sourceCitation: 'DIEESE Cesta Básica (Porto Alegre) & IPCA-IBGE',
    seasonCharacteristics: 'Maior produtor nacional de arroz e maçã; forte cadeia de carnes bovinas e laticínios.',
  },
  PR: {
    uf: 'PR',
    name: 'Paraná',
    region: 'Sul',
    costMultiplier: 0.96,
    sourceCitation: 'DIEESE Cesta Básica (Curitiba) & Ceasa-PR',
    seasonCharacteristics: 'Grande polo de grãos (feijão, trigo, milho) e avicultura com preços competitivos.',
  },
  SC: {
    uf: 'SC',
    name: 'Santa Catarina',
    region: 'Sul',
    costMultiplier: 0.98,
    sourceCitation: 'DIEESE Cesta Básica (Florianópolis) & IPCA-IBGE',
    seasonCharacteristics: 'Liderança em suinocultura, avicultura, maçã e hortaliças de clima temperado.',
  },

  // NORDESTE
  BA: {
    uf: 'BA',
    name: 'Bahia',
    region: 'Nordeste',
    costMultiplier: 0.91,
    sourceCitation: 'DIEESE Cesta Básica (Salvador) & CONAB Bahia',
    seasonCharacteristics: 'Polo do Vale do São Francisco (frutas), feijão de corda/fradinho, mandioca e feiras livres dinâmicas.',
  },
  PE: {
    uf: 'PE',
    name: 'Pernambuco',
    region: 'Nordeste',
    costMultiplier: 0.92,
    sourceCitation: 'DIEESE Cesta Básica (Recife) & Ceasa-PE',
    seasonCharacteristics: 'Centro distribuidor regional (Ceasa Recife e Petrolina); cuscuz, raízes e feijão.',
  },
  CE: {
    uf: 'CE',
    name: 'Ceará',
    region: 'Nordeste',
    costMultiplier: 0.93,
    sourceCitation: 'DIEESE Cesta Básica (Fortaleza) & Ceasa-CE',
    seasonCharacteristics: 'Forte consumo de cuscuz de milho, pescados, queijo coalho e feijão de corda.',
  },
  RN: {
    uf: 'RN',
    name: 'Rio Grande do Norte',
    region: 'Nordeste',
    costMultiplier: 0.92,
    sourceCitation: 'IPCA-IBGE Natal & CONAB RN',
    seasonCharacteristics: 'Fruticultura irrigada (melão, melancia) e pescados costeiros com preços acessíveis.',
  },
  PB: {
    uf: 'PB',
    name: 'Paraíba',
    region: 'Nordeste',
    costMultiplier: 0.91,
    sourceCitation: 'DIEESE Cesta Básica (João Pessoa) & CONAB PB',
    seasonCharacteristics: 'Feiras tradicionais de raízes (macaxeira, inhame), milho e leguminosas.',
  },
  AL: {
    uf: 'AL',
    name: 'Alagoas',
    region: 'Nordeste',
    costMultiplier: 0.92,
    sourceCitation: 'IPCA-IBGE Maceió & CONAB AL',
    seasonCharacteristics: 'Macaxeira, milho, coco e pescados com excelente oferta em mercados municipais.',
  },
  SE: {
    uf: 'SE',
    name: 'Sergipe',
    region: 'Nordeste',
    costMultiplier: 0.90,
    sourceCitation: 'DIEESE Cesta Básica (Aracaju) & CONAB SE',
    seasonCharacteristics: 'Custo favorável para alimentos in natura da agricultura familiar e pescados.',
  },
  MA: {
    uf: 'MA',
    name: 'Maranhão',
    region: 'Nordeste',
    costMultiplier: 0.93,
    sourceCitation: 'IPCA-IBGE São Luís & Ceasa-MA',
    seasonCharacteristics: 'Forte presença de arroz da terra, peixes, farinhas artesanais e frutas regionais.',
  },
  PI: {
    uf: 'PI',
    name: 'Piauí',
    region: 'Nordeste',
    costMultiplier: 0.91,
    sourceCitation: 'IPCA-IBGE Teresina & Ceasa-PI',
    seasonCharacteristics: 'Grãos do cerrado piauiense, milho, feijão e carnes locais.',
  },

  // CENTRO-OESTE
  DF: {
    uf: 'DF',
    name: 'Distrito Federal',
    region: 'Centro-Oeste',
    costMultiplier: 1.06,
    sourceCitation: 'DIEESE Cesta Básica (Brasília) & Ceasa-DF',
    seasonCharacteristics: 'Centro de consumo com frete de hortifrúti de GO/MG e polo consumidor com tíquete médio superior.',
  },
  GO: {
    uf: 'GO',
    name: 'Goiás',
    region: 'Centro-Oeste',
    costMultiplier: 0.95,
    sourceCitation: 'DIEESE Cesta Básica (Goiânia) & Ceasa-GO',
    seasonCharacteristics: 'Maior polo produtor de grãos, milho, tomate de mesa e carne bovina.',
  },
  MT: {
    uf: 'MT',
    name: 'Mato Grosso',
    region: 'Centro-Oeste',
    costMultiplier: 0.97,
    sourceCitation: 'IPCA-IBGE Cuiabá & Ceasa-MT',
    seasonCharacteristics: 'Líder agropecuário em carne bovina e grãos; custo influenciado por frete de hortaliças finas.',
  },
  MS: {
    uf: 'MS',
    name: 'Mato Grosso do Sul',
    region: 'Centro-Oeste',
    costMultiplier: 0.98,
    sourceCitation: 'DIEESE Cesta Básica (Campo Grande) & IPCA-IBGE',
    seasonCharacteristics: 'Pecuária extensiva e grãos com mercados regionais de mandioca e carnes.',
  },

  // NORTE
  PA: {
    uf: 'PA',
    name: 'Pará',
    region: 'Norte',
    costMultiplier: 1.04,
    sourceCitation: 'DIEESE Cesta Básica (Belém) & IPCA-IBGE',
    seasonCharacteristics: 'Mercados Ver-o-Peso: fartura de peixes amazônicos, açaí, farinhas d\'água e frutas nativas.',
  },
  AM: {
    uf: 'AM',
    name: 'Amazonas',
    region: 'Norte',
    costMultiplier: 1.14,
    sourceCitation: 'IPCA-IBGE Manaus & CONAB AM',
    seasonCharacteristics: 'Logística fluvial: pescados abundantes; produtos de mercearia e hortaliças com custo de frete.',
  },
  RO: {
    uf: 'RO',
    name: 'Rondônia',
    region: 'Norte',
    costMultiplier: 1.02,
    sourceCitation: 'IPCA-IBGE Porto Velho & CONAB RO',
    seasonCharacteristics: 'Polo em expansão de pecuária, café, peixes de piscicultura e hortaliças locais.',
  },
  TO: {
    uf: 'TO',
    name: 'Tocantins',
    region: 'Norte',
    costMultiplier: 0.96,
    sourceCitation: 'IPCA-IBGE Palmas & CONAB TO',
    seasonCharacteristics: 'Transição cerrado/amazônia: arroz, feijão e carnes com preços competitivos.',
  },
  AC: {
    uf: 'AC',
    name: 'Acre',
    region: 'Norte',
    costMultiplier: 1.10,
    sourceCitation: 'IPCA-IBGE Rio Branco & CONAB AC',
    seasonCharacteristics: 'Produção de castanha, mandioca e peixes; produtos industrializados com frete rodoviário longo.',
  },
  AP: {
    uf: 'AP',
    name: 'Amapá',
    region: 'Norte',
    costMultiplier: 1.12,
    sourceCitation: 'IPCA-IBGE Macapá & CONAB AP',
    seasonCharacteristics: 'Cozinha rica em pescados e açaí; hortaliças e grãos dependentes de cabotagem/balsa.',
  },
  RR: {
    uf: 'RR',
    name: 'Roraima',
    region: 'Norte',
    costMultiplier: 1.13,
    sourceCitation: 'IPCA-IBGE Boa Vista & CONAB RR',
    seasonCharacteristics: 'Agricultura familiar local e importação de grãos e laticínios de outras regiões.',
  },
};

/**
 * Retorna o perfil e o multiplicador de custo alimentar para o Estado selecionado.
 */
export function getRegionalPriceProfile(stateUf?: string): RegionalCostProfile {
  const uf = (stateUf || 'SP').toUpperCase().trim();
  return REGIONAL_PRICE_INDEX[uf] || REGIONAL_PRICE_INDEX['SP'];
}

/**
 * Retorna apenas o multiplicador numérico.
 */
export function getRegionalPriceMultiplier(stateUf?: string): number {
  return getRegionalPriceProfile(stateUf).costMultiplier;
}
