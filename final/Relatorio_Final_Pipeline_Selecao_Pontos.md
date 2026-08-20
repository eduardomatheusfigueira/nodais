# Relatório Técnico Final: Esteira de Processamento e Seleção de Pontos para Aferição

**Projeto UNESCO – Edital UNES 2369/2025**  
*Elaboração de Diagnóstico e Planos de Ação sobre o Turismo Fronteiriço (Paraná, Santa Catarina e Mato Grosso do Sul)*  
*Análise do Script `edu.py` e da Estrutura do Diretório `final/`*

---

## 1. Visão Geral da Pasta `final/`

A pasta `final/` representa um **pipeline integrado de Engenharia e Ciência de Dados Espaciais (ETL, Geocodificação, Roteamento Dinâmico e Clustering de Densidade)** concebido para selecionar cientificamente os pontos mais estratégicos para aferição de tráfego e presença turística em campo nos municípios da faixa de fronteira do Brasil (Paraná, Santa Catarina e Mato Grosso do Sul).

Todo o fluxo de processamento de dados é automatizado pelo script Python `edu.py`, que transforma dados brutos heterogêneos (registros comerciais de CNPJ e cadastros de atrativos/acessos) em **clusters espaciais ranqueados por densidade de tráfego e infraestrutura viária**.

---

## 2. Arquitetura da Esteira de Processamento (`edu.py`)

A esteira de processamento estruturada no script `edu.py` é dividida em **6 etapas encadeadas**, organizadas em subdiretórios específicos:

```
  ┌──────────────┐      ┌─────────────────┐      ┌────────────────────────┐
  │  1. RAW      │ ──►  │  2. Z_CLEANED   │ ──►  │  3. Z_CLEANED_MERGED   │
  │ Dados Brutos │      │ Dados Limpos    │      │ Bases Unificadas       │
  └──────────────┘      └─────────────────┘      └────────────────────────┘
                                                              │
  ┌──────────────┐      ┌─────────────────┐      ┌────────────▼───────────┐
  │ 6. TOP_RANKED│ ◄──  │ 5. ROTAS_TOMTOM │ ◄──  │ 4. FINAL_ADDRESSED &   │
  │ Clusters DBSCAN     │ Waypoints TomTom│      │    FINAL_GEOCODED      │
  └──────────────┘      └─────────────────┘      └────────────────────────┘
```

---

### 2.1. Etapa 1: Ingestão e Sanitização Inicial (`raw/` ──► `z_cleaned/`)
- **Entrada (`raw/`)**: Recebe arquivos brutos em formatos inconsistentes (`acessos.csv`, `atrativos.csv`, `cnjps_dionisio.csv`, `cnpjs_municipios.csv` e a planilha Excel `Acesso cidades.xlsx`).
- **Tratamento**:
  - Limpeza e padronização de caracteres e separadores decimais nas coordenadas geográficas (`latitude`, `longitude`).
  - Remoção de espaços em branco, caracteres nulos e tratamento de *encodings* heterogêneos (`utf-8` e `latin1`).
- **Saída (`z_cleaned/`)**: Arquivos sanitizados com delimitadores padronizados (ponto e vírgula `;`).

---

### 2.2. Etapa 2: Fusão e Normalização (`z_cleaned/` ──► `z_cleaned_merged/`)
- **Fusão de Atrativos e Acessos**: Combina os dados de pontos turísticos e equipamentos de acesso na base `atrativos_acessos.csv` (totalizando **271 registros** unificados com coordenadas ajustadas).
- **Consolidação Empresarial**: Unifica os cadastros de estabelecimentos comerciais de todos os municípios da área de estudo na base `cnpjs.csv` (totalizando **16.605 empresas** cadastradas).

---

### 2.3. Etapa 3: Padronização de Endereçamento Comercial (`z_cleaned_merged/` ──► `z_final_addressed/`)
- **Formatação de Endereço Completo**: Concatena os campos estruturados (`tipo_logradouro`, `logradouro`, `numero`, `bairro`, `cep`, `uf`, `nome_municipio`) criando a coluna `endereco` pronta para geocodificação em `cnpjs_enderecos.csv` (16.605 registros).
- **Downsampling Estratégico (Amostragem Otimizada)**: Para otimizar custos de consumo de APIs externas e manter representatividade estatística, o script seleciona **50% dos registros** (seleção de IDs pares), gerando `cnpjs_enderecos_compressed.csv` com **8.302 estabelecimentos comerciais**.

---

### 2.4. Etapa 4: Geocodificação de Precisão e Pares de Origem-Destino (`z_final_addressed/` ──► `z_final_geocoded/`)
- **Geocodificação via API REST**: Consumo de serviço de geocodificação (Google Maps API / Nominatim) para converter a string de endereço comercial de cada estabelecimento em coordenadas GPS de alta precisão (`latitude`, `longitude`), gerando `cnpjs_georreferenciados.csv` (8.302 estabelecimentos geocodificados).
- **Matriz de Origem e Destino**: Criação do arquivo `partida_chegada.csv` com **271 pares geográficos**, associando a localização geográfica de cada ponto de interesse ao ponto de origem/entrada correspondente para simulação de deslocamentos viários.

---

### 2.5. Etapa 5: Roteamento Dinâmico de Tráfego via TomTom (`z_final_geocoded/` ──► `z_rotas_tomtom/`)
- **Simulação de Trajetos Reais**: O script consome a **TomTom Routing API** enviando os 271 pares de Origem-Destino.
- **Extração de Waypoints de Tráfego**: A API calcula as rotas viárias reais de menor tempo/distância por malha viária e extrai os vértices (*waypoints*) ao longo das estradas e avenidas.
- **Resultado (`tomtom_routes.csv`)**: Uma base densa contendo **68.794 waypoints georreferenciados**, mapeando os corredores viários de maior circulação de veículos e visitantes na região.

---

### 2.6. Etapa 6: Clustering Espacial (DBSCAN + BallTree) e Ranqueamento (`z_rotas_tomtom/` ──► `z_top_ranked/`)
- **Algoritmo DBSCAN (Density-Based Spatial Clustering of Applications with Noise)**:
  - Utiliza a métrica de **distância Haversine** em radianos para agrupar waypoints e pontos de tráfego em clusters de densidade espacial contínua.
- **Estruturação por Árvore Espacial (BallTree + KNN)**:
  - O algoritmo `BallTree` cruza os pontos de interesse cadastrados com os waypoints de tráfego das rotas no entorno.
  - Calcula o **Traffic Score** (frequência ponderada de veículos/deslocamentos em cada nó viário).
- **Resultados Ranqueados (`z_top_ranked/`)**:
  - `top20_clusters_per_city_r50.csv`: Seleção dos **Top 20 clusters espaciais por município** utilizando um raio de busca de **50 metros** (340 clusters focados em alta precisão no nível da rua/esquina).
  - `top100_clusters_per_city_r100.csv`: Seleção dos **Top 100 clusters espaciais por município** utilizando um raio de busca de **100 metros** (1.025 clusters cobrindo microrregiões de atratividade).

---

## 3. Inventário dos Arquivos da Pasta `final/`

| Subdiretório | Nome do Arquivo | Tamanho (Bytes) | N.º de Registros | Descrição e Função no Pipeline |
| :--- | :--- | :-: | :-: | :--- |
| **`final/`** | `edu.py` | 28.251 B | 1.439 linhas | Script mestre Python com a implementação de todo o pipeline ETL, consumo de APIs e algoritmos espaciais. |
| **`raw/`** | `Acesso cidades.xlsx` | 17.444 B | - | Planilha Excel original de entrada com dados brutas de vias de acesso. |
| **`raw/`** | `acessos.csv` | 2.520 B | - | Cadastro bruto de vias e pontos de acesso municipais. |
| **`raw/`** | `atrativos.csv` | 17.013 B | - | Cadastro bruto de atrativos turísticos por município. |
| **`raw/`** | `cnjps_dionisio.csv` | 36.633 B | - | Cadastro bruto de empresas (CNPJ) de Dionísio Cerqueira. |
| **`raw/`** | `cnpjs_municipios.csv` | 3.755.846 B | 16.454 | Cadastro bruto de empresas comerciais da região de estudo. |
| **`z_cleaned/`** | `acessos.csv` | 2.480 B | 271 | Pontos de acesso sanitizados com latitude/longitude. |
| **`z_cleaned/`** | `atrativos.csv` | 17.852 B | 271 | Pontos atrativos sanitizados. |
| **`z_cleaned/`** | `cnjps_dionisio.csv` | 12.730 B | - | CNPJs de Dionísio Cerqueira estruturados. |
| **`z_cleaned/`** | `cnpjs_municipios.csv` | 1.359.798 B | 16.454 | CNPJs municipais sanitizados. |
| **`z_cleaned_merged/`** | `atrativos_acessos.csv` | 20.247 B | 271 | Base unificada de atrativos e acessos turísticos. |
| **`z_cleaned_merged/`** | `cnpjs.csv` | 1.351.053 B | 16.605 | Base unificada de empresas de todos os municípios. |
| **`z_final_addressed/`** | `atrativos_acessos.csv` | 20.247 B | 271 | Cópias validadas com identificadores espaciais. |
| **`z_final_addressed/`** | `cnpjs_enderecos.csv` | 2.359.808 B | 16.605 | Cadastro empresarial com campo `endereco` formatado. |
| **`z_final_addressed/`** | `cnpjs_enderecos_compressed.csv` | 1.180.491 B | 8.302 | Amostragem de 50% dos CNPJs para otimização de API. |
| **`z_final_geocoded/`** | `acessos_atrativos.csv` | 20.247 B | 271 | Base georreferenciada de atrativos e acessos. |
| **`z_final_geocoded/`** | `cnpjs_georreferenciados.csv` | 1.371.061 B | 8.302 | Empresas geocodificadas com coordenadas GPS via API. |
| **`z_final_geocoded/`** | `partida_chegada.csv` | 30.217 B | 271 | Pares de Origem-Destino para cálculo de rotas. |
| **`z_rotas_tomtom/`** | `tomtom_routes.csv` | 3.953.272 B | **68.794** | Waypoints de rotas viárias reais extraídos via API TomTom. |
| **`z_top_ranked/`** | `top20_clusters_per_city_r50.csv` | 17.776 B | **340** | Top 20 clusters espaciais por município (Raio = 50m). |
| **`z_top_ranked/`** | `top100_clusters_per_city_r100.csv` | 49.965 B | **1.025** | Top 100 clusters espaciais por município (Raio = 100m). |

---

## 4. Distribuição das Informações Processadas por Município

### 4.1. Densidade de Waypoints TomTom (Fluxo de Tráfego Viário Mapeado)
- **Campo Grande (MS)**: 20.908 waypoints (Maior volume de tráfego urbano)
- **Foz do Iguaçu (PR)**: 17.641 waypoints (Corredores viários de acesso às Cataratas e Itaipu)
- **Bonito (MS)**: 11.650 waypoints (Rotas ecoturísticas para balneários e grutas)
- **Guaíra (PR)**: 4.927 waypoints (Acesso à Ponte Ayrton Senna e Parque Nacional da Ilha Grande)
- **Corumbá (MS)**: 2.760 waypoints
- **Medianeira (PR)**: 2.515 waypoints (Corredor BR-277 e circuito rural)
- **Capanema (PR)**: 2.192 waypoints (Acesso ao Rio Iguaçu e Parque Nacional do Iguaçu)
- **Barracão (PR)**: 1.434 waypoints (Trevo da Tríplice Fronteira e BR-163)
- **Dionísio Cerqueira (SC)**: 1.390 waypoints (Corredores da Fronteira Seca com Argentina)
- **Ponta Porã (MS)**: 1.994 waypoints
- **Mundo Novo (MS)**: 1.039 waypoints (Acesso à Prainha do Cascalho e Porto Isabel)
- **Porto Murtinho (MS)**: 344 waypoints

---

## 5. Conclusões e Aplicação Prática para Aferição em Campo

1. **Rigor Científico na Seleção dos Pontos**: A metodologia adotada no script `edu.py` elimina escolhas arbitrárias para a colocação de equipes ou sensores de aferição. A seleção fundamenta-se na **intersecção entre densidade comercial e fluxo viário real**.
2. **Produtos Prontos para Uso**:
   - Para aferição em nível de **rua/esquina de alta resolução**, recomenda-se utilizar o arquivo `top20_clusters_per_city_r50.csv`.
   - Para análise de **manchas urbanas e microrregiões**, recomenda-se utilizar o arquivo `top100_clusters_per_city_r100.csv`.
3. **Integração com a Análise Qualitativa**: O cruzamento desse ranqueamento geoespacial com o estudo netnográfico de relevância turística (Produto 4 UNESCO) garante que os pontos aferidos cubram com alta precisão tanto os atrativos de apelo internacional (Foz do Iguaçu) quanto os corredores de fronteira seca e polos de ecoturismo regional (Capanema, Guaíra, Barracão, Dionísio Cerqueira, Medianeira e Mundo Novo).
