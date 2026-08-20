# Selecao e Exportacao de Pontos Nodais de Afericao

Sistema para visualizacao espacial de rotas e atrativos, marcacao de pontos de afericao e exportacao de camadas vetoriais nos formatos ESRI Shapefile, GeoPackage, GeoJSON e CSV para uso no QGIS.

Desenvolvido no contexto do Projeto UNESCO UNES 2369/2025 em conjunto com o Itaipu Parquetec para os municipios do estudo nos estados de MS, PR e SC.

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
  - **Shapefile (.zip)**: Gera arquivo compactado contendo `.shp`, `.shx`, `.dbf`, `.prj` (WGS 84 / EPSG:4326), `.cpg` (UTF-8) e arquivo de texto explicativo.
  - **GeoJSON**: Gera arquivo `.geojson` com geometrias do tipo Point e tabela de atributos.
  - **CSV**: Gera planilha delimitada por ponto e virgula com codificacao UTF-8 com BOM.

### 2. Conversor Python para Camadas QGIS (`gerar_shapefile_qgis.py`)
Script em Python para processamento em linha de comando a partir de arquivos CSV de pontos.

Funcionalidades:
- Leitura automatica do arquivo CSV de pontos mais recente ou informado por parametro.
- Validacao e conversao de tipos de dados e coordenadas geograficas.
- Exportacao simultanea para:
  - ESRI Shapefile compactado em `.zip` (arquivos `.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`).
  - GeoPackage (`.gpkg`).
  - GeoJSON (`.geojson`).
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
6. Apos registrar os pontos necessarios, clique no botao de exportacao desejado no cabecalho:
   - "Exportar Shapefile (QGIS)"
   - "GeoJSON"
   - "CSV"

### Uso do Script Python

Execucao basica (busca automatica pelo CSV mais recente):
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
- `--csv`, `-c`: Caminho do arquivo CSV de entrada (opcional; se omitido, o script busca automaticamente).
- `--out`, `-o`: Diretorio de destino dos arquivos exportados (padrao: `camadas_qgis`).
- `--crs`: Codigo EPSG para a projecao cartografica (`4326` para WGS 84 ou `4674` para SIRGAS 2000; padrao: `4326`).

---

## Estrutura dos Atributos dos Dados Exportados

| Campo | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com sigla da UF (ex: PR - Foz do Iguacu) |
| `ORDEM` | Inteiro | 4 | Numero sequencial do ponto no municipio |
| `NOME` | Texto | 100 | Identificacao textual do ponto de afericao |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |
| `JUSTIFIC` | Texto | 254 | Justificativa tecnica ou observacao registrada |
| `DATA_HORA` | Texto | 30 | Registro de data e hora da decisao |

---

## Estrutura do Repositorio

```
nodais/
|-- painel_decisao_qualitativa.html          # Interface web de decisao e exportacao
|-- gerar_shapefile_qgis.py                 # Script Python de geracao de camadas GIS
|-- Guia_Exportacao_Shapefile_QGIS.md       # Documentacao de apoio para importacao no QGIS
|-- Relatorio_Qualitativo_Mapas_Afericao.md # Relatorio metodologico do estudo
|-- Atrativos_Relevantes_Por_Cidade.md      # Tabela de atrativos e classificacoes
|-- Atividades Produto 4_Projeto Unesco.xlsx# Planilha base do Produto 4
|-- camadas_qgis/                           # Diretorio com os arquivos GIS gerados
|-- mapas_afericao/                         # Mapas HTML individuais por municipio
|-- final/                                  # Scripts de processamento e dados brutos
`-- Materiais de referencia/                # Documentos de apoio e matrizes de deslocamento
```

---

## Uso dos Arquivos no QGIS

1. Abra o QGIS (versao 3.0 ou superior).
2. Arraste o arquivo `pontos_afericao_unesco_shapefile.zip` ou o arquivo `pontos_afericao.shp` (extraido) para a area de trabalho do QGIS.
3. Como alternativa, arraste o arquivo `pontos_afericao_unesco.gpkg` ou `pontos_afericao_unesco.geojson`.
4. A camada de pontos sera carregada com a tabela de atributos completa e o sistema de coordenadas configurado.
