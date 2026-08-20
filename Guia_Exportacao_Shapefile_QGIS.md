# Guia de Exportacao de Pontos para Shapefile e QGIS
**Projeto UNESCO UNES 2369/2025 • Itaipu Parquetec**  
*Selecao dos Pontos de Afericao das Cidades Turisticas e de Fronteira*

---

## 1. Visao Geral

Este documento descreve os procedimentos de exportacao dos pontos de afericao para formatos compativeis com o software QGIS: ESRI Shapefile (.shp com arquivos associados), GeoPackage (.gpkg) e GeoJSON (.geojson).

---

## 2. Metodos de Exportacao

### Metodo A: Exportacao pelo Painel Web (`painel_decisao_qualitativa.html`)
1. Abra o arquivo `painel_decisao_qualitativa.html` em um navegador web.
2. Selecione o municipio e utilize as camadas para analise espacial.
3. Registre os pontos de afericao no formulario.
4. No cabecalho superior, selecione a opcao de exportacao:
   - **Exportar Shapefile (QGIS)**: Realiza o download de um arquivo `.zip` contendo os arquivos `.shp`, `.shx`, `.dbf`, `.prj`, `.cpg` e instrucoes de uso.
   - **GeoJSON**: Exporta o arquivo vetorial `.geojson`.
   - **CSV**: Exporta a planilha em formato tabular delimitada por ponto e virgula.

O gerador de Shapefile do painel web executa localmente no navegador, sem requisicoes a servidores externos.

---

### Metodo B: Conversao via Script Python (`gerar_shapefile_qgis.py`)
Para processar arquivos CSV existentes:

```bash
# Executa a busca automatica do CSV mais recente e gera as camadas
python gerar_shapefile_qgis.py

# Especificar um arquivo CSV:
python gerar_shapefile_qgis.py --csv "pontos_afericao_selecionados.csv"

# Definir o Sistema de Coordenadas como SIRGAS 2000 (EPSG:4674):
python gerar_shapefile_qgis.py --crs 4674
```

Arquivos gerados no diretorio `camadas_qgis/`:
1. `pontos_afericao_unesco_shapefile.zip` (pacote Shapefile)
2. `pontos_afericao_unesco.gpkg` (GeoPackage)
3. `pontos_afericao_unesco.geojson` (GeoJSON)

---

## 3. Estrutura do Pacote Shapefile

| Arquivo | Funcao | Descricao |
| :--- | :--- | :--- |
| `pontos_afericao.shp` | Geometria | Armazena as coordenadas pontuais (Longitude, Latitude) |
| `pontos_afericao.shx` | Indice | Indice espacial das geometrias |
| `pontos_afericao.dbf` | Atributos | Tabela em formato dBase III com os campos alfanumericos |
| `pontos_afericao.prj` | Projecao | Definicao do CRS (WGS 84 / EPSG:4326 ou SIRGAS 2000 / EPSG:4674) |
| `pontos_afericao.cpg` | Codificacao | Especificacao de encoding UTF-8 |
| `LEIAME_QGIS.txt` | Documentacao | Instrucoes e descricao das colunas |

---

## 4. Dicionario de Dados (Atributos)

| Coluna DBF | Tipo | Tamanho | Descricao | Exemplo |
| :--- | :--- | :---: | :--- | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF | `PR - Foz do Iguacu` |
| `ORDEM` | Inteiro | 4 | Sequencia do ponto no municipio | `1`, `2`, `3` |
| `NOME` | Texto | 100 | Nome/identificacao do ponto | `Marco das Tres Fronteiras` |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais | `-25.589123` |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais | `-54.582456` |
| `JUSTIFIC` | Texto | 254 | Justificativa tecnica e fatores observados | `Trecho de sobreposicao viaria` |
| `DATA_HORA` | Texto | 30 | Data e hora do registro da decisao | `20/08/2026 09:30:00` |

---

## 5. Procedimento de Abertura no QGIS

1. Abra o QGIS (versao 3.0 ou superior).
2. Arraste o arquivo `.zip` ou extraia e arraste `pontos_afericao.shp` para o painel de camadas ou tela principal do QGIS.
3. Para definir a simbologia por municipio:
   - Clique com o botao direito na camada > **Propriedades** > **Simbologia**.
   - Altere o tipo para **Categorizado** e selecione a coluna `MUNICIPIO`.
   - Clique em **Classificar**.
4. Para exibir rotulos:
   - Em **Propriedades** > **Rotulos**, habilite rotulos simples baseados na coluna `NOME` ou `ORDEM`.
