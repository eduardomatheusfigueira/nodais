# Selecao e Exportacao de Pontos Nodais de Afericao

Sistema para visualizacao espacial de rotas e atrativos, marcacao de pontos nodais de afericao, geracao de mapas prontos para publicacao e exportacao de camadas vetoriais nos formatos ESRI Shapefile, GeoPackage, GeoJSON e CSV para uso no QGIS.

A geracao de figuras e feita no Estudio de Mapas e Pontos Nodais, integrado ao painel: a composicao cartografica (mapa base, camadas do estudo, titulo, rosa dos ventos, escala grafica, legendas, grade e anotacoes) e montada na tela e exportada em PNG ou JPEG na resolucao escolhida, individualmente ou em lote por municipio.

Desenvolvido no contexto do Projeto UNESCO UNES 2369/2025 em conjunto com o Itaipu Parquetec para os municipios do estudo nos estados de MS, PR e SC.

---

## Camadas Exportadas para o QGIS

A exportacao gera 4 camadas vetoriais estruturadas:

1. **Pontos de Afericao Selecionados (`1_pontos_afericao_selecionados`)**:
   - Pontos de decisao registrados pelo usuario com justificativas tecnicas.
2. **Pontos de Sobreposicao de Fluxos (`2_pontos_sobreposicao_fluxos`)**:
   - Pontos de intersecao e concentracao de rotas classificados por ranking e frequencia de viagens.
3. **Manchas de Fluxo / Rotas (`3_manchas_fluxo_rotas`)**:
   - Pontos e trajetorias das rotas TomTom que compoem as manchas de fluxo.
4. **Atrativos Turisticos (`4_atrativos_turisticos`)**:
   - Localizacao dos atrativos turisticos do estudo com identificadores e classificacao do Produto 4.

---

## Componentes do Sistema

### 1. Painel Web (`painel_decisao_qualitativa.html`)
Interface em HTML5 e JavaScript (utilizando Leaflet.js) que executa localmente no navegador sem necessidade de backend.

Funcionalidades:
- Exibicao de dados espaciais por municipio:
  - Densidade de rotas (mapa de calor TomTom).
  - Trechos de sobreposicao viaria classificados por frequencia.
  - Centroide geometrico dos CNPJs turisticos georreferenciados.
  - Localizacao dos atrativos turisticos mapeados com identificador e ranking do Produto 4.
- Ferramenta de marcacao de pontos de afericao:
  - Captura de coordenadas geograficas (latitude e longitude) por clique no mapa ou preenchimento manual.
  - Insercao de nome e campo de justificativa/observacao.
  - Armazenamento local no navegador (LocalStorage) por municipio.
- Exportacao direta:
  - **Shapefile (.zip)**: Gera arquivo compactado contendo as 4 camadas em Shapefile (`.shp`, `.shx`, `.dbf`, `.prj` em WGS 84 / EPSG:4326 e `.cpg` em UTF-8) e guia de instrucoes.
  - **GeoJSON**: Gera arquivo `.geojson` unificado contendo as feicoes e atributos de todas as camadas.
  - **CSV**: Gera planilha tabular das decisoes delimitada por ponto e virgula.
  - **Imagem (PNG/JPEG)**: Abre o Estudio de Mapas e Pontos Nodais para compor e exportar a figura do municipio na resolucao desejada.

### 2. Estudio de Mapas e Pontos Nodais (`estudio_mapas.js` / `estudio_mapas.css`)

Ambiente de composicao cartografica e geracao de imagens embutido no painel, acionado pelo botao **Estudio de Imagem** no cabecalho. Consolida em um unico lugar a geracao dos mapas do estudo e a exportacao das figuras finais, dispensando captura de tela e edicao externa.

O estudio nao usa o mapa da tela: monta a composicao em `canvas` proprio, mosaicando os tiles do provedor selecionado e desenhando as camadas do estudo na resolucao de saida. Com isso, a previa exibida e exatamente a imagem exportada, em qualquer resolucao.

Funcionalidades:

- **Resolucao de saida**: predefinicoes HD, 2K, 4K, A4 300 dpi e quadrado, dimensoes livres, inversao de orientacao e escala proporcional dos elementos cartograficos.
- **Formato**: PNG (sem perdas) ou JPEG com controle de qualidade.
- **Mapa base**: qualquer um dos cinco provedores do painel (Esri World Street Map, CartoDB Voyager, Esri World Topo Map, OpenStreetMap e CartoDB DarkMatter), com creditos automaticos do provedor e do projeto.
- **Camadas do estudo**: manchas de fluxo TomTom (com controle de intensidade), trechos de sobreposicao de rotas em escala logaritmica, atrativos turisticos com o distintivo numerico do Produto 4, centro geometrico dos CNPJs e pontos nodais de afericao, com rotulos opcionais.
- **Filtros tematicos**: ranking do Produto 4, categoria de relevancia das rotas e frequencia minima, com a opcao de copiar diretamente os filtros ativos no painel.
- **Elementos cartograficos posicionaveis** (arrastados sobre a previa): titulo e subtitulo configuraveis, rosa dos ventos em quatro estilos, escala grafica com a projecao declarada, legenda de simbologia montada a partir das camadas ativas e legenda dos pontos nodais com numeracao, coordenadas e justificativas tecnicas registradas.
- **Grade de coordenadas**: paralelos e meridianos com rotulos em graus decimais e intervalo escolhido automaticamente pela escala.
- **Textos e formas livres**: caixas de texto, retangulos, elipses e setas para destaques e anotacoes na prancha.
- **Enquadramento**: automatico sobre todas as feicoes do municipio, restrito aos pontos nodais, ou copiado da visao atual do painel; navegacao por arraste e roda do mouse.
- **Composicao**: salva no navegador, exportada e importada em `.json`, permitindo reproduzir a mesma prancha em outra sessao ou em outro municipio.
- **Exportacao em lote**: gera um mapa por municipio com a mesma composicao, enquadrando cada um automaticamente ou preservando o enquadramento atual, e entrega tudo em um `.zip` acompanhado do arquivo de composicao.

As rotinas de desenho ficam disponiveis em `EstudioMapas.desenho` (projecao, mosaico de tiles, camadas, rosa dos ventos, escala, legendas e composicao completa), podendo ser reaproveitadas por outros mapas do projeto.

### 3. Conversor Python para Camadas QGIS (`gerar_shapefile_qgis.py`)
Script em Python para processamento em linha de comando a partir das bases do projeto e arquivos CSV de pontos.

Funcionalidades:
- Leitura automatica do arquivo CSV de pontos mais recente e das bases de rotas, sobreposicoes e atrativos.
- Validacao e conversao de tipos de dados e coordenadas geograficas.
- Exportacao simultanea para:
  - ESRI Shapefile compactado em `.zip` contendo os 4 conjuntos de arquivos (`.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`).
  - GeoPackage (`.gpkg`) multi-camadas contendo as 4 camadas em arquivo unico.
  - GeoJSON (`.geojson`) individual por camada.
- Suporte aos sistemas de coordenadas EPSG:4326 (WGS 84) e EPSG:4674 (SIRGAS 2000).

---

## Requisitos e Instalacao

### Painel Web
Nao requer instalacao de dependencias. Basta abrir o arquivo `painel_decisao_qualitativa.html` em qualquer navegador web (Google Chrome, Mozilla Firefox, Microsoft Edge, etc.).

Os arquivos `estudio_mapas.js` e `estudio_mapas.css` devem permanecer na mesma pasta do painel: sao eles que fornecem o Estudio de Imagem. Sem eles o painel continua funcionando, apenas sem o estudio.

### Script Python
Requer Python 3.8 ou superior.

Para instalar as dependencias necessarias:

```bash
pip install pandas geopandas shapely pyogrio
```

---

## Instrucoes de Uso

### Uso do Painel Web
1. Abra o arquivo `painel_decisao_qualitativa.html` no navegador.
2. Selecione o municipio no menu suspenso superior.
3. Utilize os filtros laterais para ajustar a visualizacao das camadas (densidade de rotas, sobreposicao, centroides e atrativos).
4. Clique em "Marcar Novo Ponto Clicando no Mapa" ou preencha o formulario lateral com as coordenadas, nome e justificativa.
5. Clique em "Adicionar Ponto".
6. No cabecalho superior, clique na opcao de exportacao desejada:
   - "Exportar Shapefile (QGIS)"
   - "GeoJSON"
   - "CSV"

### Uso do Estudio de Imagem
1. Selecione o municipio e ajuste os filtros desejados no painel.
2. Clique em "Estudio de Imagem" no cabecalho.
3. Defina a resolucao de saida e o formato na coluna da esquerda; ajuste o mapa base, as camadas e os filtros tematicos.
4. Enquadre a area com "Enquadrar municipio", "Enquadrar pontos nodais" ou "Usar visao do painel"; refine arrastando o mapa e usando a roda do mouse.
5. Ative os elementos da prancha na coluna da direita e arraste-os sobre a previa ate a posicao desejada.
6. Clique em "Exportar imagem" para baixar o arquivo, ou em "Exportar todos os municipios (.zip)" para gerar a serie completa com a mesma composicao.

### Uso do Script Python

Execucao basica (busca automatica pelo CSV mais recente e integracao de todas as camadas):
```bash
python gerar_shapefile_qgis.py
```

Especificando arquivo de entrada e diretorio de saida:
```bash
python gerar_shapefile_qgis.py --csv "caminho/para/pontos_afericao_selecionados.csv" --out "camadas_qgis"
```

Definindo o sistema de coordenadas de saida como SIRGAS 2000 (EPSG:4674):
```bash
python gerar_shapefile_qgis.py --crs 4674
```

Parametros disponiveis:
- `--csv`, `-c`: Caminho do arquivo CSV de entrada de pontos selecionados (opcional).
- `--out`, `-o`: Diretorio de destino dos arquivos exportados (padrao: `camadas_qgis`).
- `--crs`: Codigo EPSG para a projecao cartografica (`4326` para WGS 84 ou `4674` para SIRGAS 2000; padrao: `4326`).

---

## Estrutura dos Atributos das Camadas

### 1. Pontos de Afericao Selecionados (`1_pontos_afericao_selecionados`)
| Campo | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF |
| `ORDEM` | Inteiro | 4 | Sequencia do ponto no municipio |
| `NOME` | Texto | 100 | Identificacao do ponto de afericao |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |
| `JUSTIFIC` | Texto | 254 | Justificativa tecnica registrada |
| `DATA_HORA` | Texto | 30 | Registro de data e hora |

### 2. Pontos de Sobreposicao de Fluxos (`2_pontos_sobreposicao_fluxos`)
| Campo | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF |
| `RANK` | Inteiro | 5 | Posicao no ranking de sobreposicao |
| `FREQ` | Decimal | 10, 2 | Frequencia de viagens calculada |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |

### 3. Manchas de Fluxo / Rotas (`3_manchas_fluxo_rotas`)
| Campo | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF |
| `ID_ROTA` | Inteiro | 6 | Identificador numerico da rota |
| `NOME_ROTA` | Texto | 100 | Nome ou descricao da rota |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |

### 4. Atrativos Turisticos (`4_atrativos_turisticos`)
| Campo | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF |
| `ID_ATRATIV` | Inteiro | 5 | Numero identificador do atrativo |
| `NOME` | Texto | 100 | Nome do atrativo turistico |
| `RANK_PROD4` | Texto | 50 | Classificacao no Produto 4 |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |

---

## Uso dos Arquivos no QGIS

1. Abra o QGIS (versao 3.0 ou superior).
2. Arraste o arquivo `pontos_afericao_unesco_shapefile.zip` ou o arquivo `pontos_afericao_unesco.gpkg` diretamente para a area de trabalho do QGIS.
3. O QGIS exibira uma janela permitindo selecionar as camadas desejadas (pontos selecionados, sobreposicao de fluxos, manchas de rotas e atrativos).
4. Todas as camadas serao carregadas com atributos completos e coordenadas georreferenciadas.
