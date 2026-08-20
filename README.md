# Selecao e Exportacao de Pontos Nodais de Afericao

Sistema para visualizacao espacial de rotas e atrativos, marcacao de pontos de afericao e exportacao de camadas vetoriais nos formatos ESRI Shapefile, GeoPackage, GeoJSON e CSV para uso no QGIS.

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

### 2. Conversor Python para Camadas QGIS (`gerar_shapefile_qgis.py`)
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
