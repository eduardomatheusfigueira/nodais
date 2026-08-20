# Guia de Exportacao de Camadas para QGIS
**Projeto UNESCO UNES 2369/2025 • Itaipu Parquetec**  
*Selecao dos Pontos de Afericao das Cidades Turisticas e de Fronteira*

---

## 1. Visao Geral

Este documento descreve os procedimentos de exportacao das camadas geoespaciais do estudo para formatos compativeis com o software QGIS: ESRI Shapefile (.shp com arquivos associados), GeoPackage (.gpkg) e GeoJSON (.geojson).

As camadas geradas compreendem:
1. **`1_pontos_afericao_selecionados`**: Pontos de decisao registrados pelo usuario com justificativas.
2. **`2_pontos_sobreposicao_fluxos`**: Pontos de sobreposicao de rotas classificados por ranking e frequencia.
3. **`3_manchas_fluxo_rotas`**: Pontos e trajetorias das rotas TomTom que compoem as manchas de fluxo.
4. **`4_atrativos_turisticos`**: Atrativos turisticos mapeados com classificacao do Produto 4.

---

## 2. Metodos de Exportacao

### Metodo A: Exportacao pelo Painel Web (`painel_decisao_qualitativa.html`)
1. Abra o arquivo `painel_decisao_qualitativa.html` em um navegador web.
2. Selecione o municipio e utilize as camadas para analise espacial.
3. Registre os pontos de afericao no formulario.
4. No cabecalho superior, selecione a opcao de exportacao:
   - **Exportar Shapefile (QGIS)**: Realiza o download de um arquivo `.zip` contendo os 4 conjuntos de Shapefiles (`.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`) e instrucoes de uso.
   - **GeoJSON**: Exporta o arquivo vetorial `.geojson` com todas as camadas integradas.
   - **CSV**: Exporta a planilha tabular dos pontos selecionados delimitada por ponto e virgula.

O gerador de Shapefile do painel web executa localmente no navegador, sem requisicoes a servidores externos.

---

### Metodo B: Conversao via Script Python (`gerar_shapefile_qgis.py`)
Para processar e exportar todas as camadas a partir do terminal:

```bash
# Executa a busca automatica do CSV mais recente e gera todas as 4 camadas
python gerar_shapefile_qgis.py

# Especificar um arquivo CSV de pontos selecionados:
python gerar_shapefile_qgis.py --csv "pontos_afericao_selecionados.csv"

# Definir o Sistema de Coordenadas como SIRGAS 2000 (EPSG:4674):
python gerar_shapefile_qgis.py --crs 4674
```

Arquivos gerados no diretorio `camadas_qgis/`:
1. `pontos_afericao_unesco_shapefile.zip` (pacote Shapefile contendo as 4 camadas)
2. `pontos_afericao_unesco.gpkg` (GeoPackage multi-camadas)
3. Arquivos `.geojson` individuais por camada

---

## 3. Estrutura dos Arquivos Shapefile no Pacote ZIP

Para cada uma das 4 camadas, estao presentes os seguintes arquivos:

| Extensao | Funcao | Descricao |
| :--- | :--- | :--- |
| `.shp` | Geometria | Armazena as coordenadas pontuais (Longitude, Latitude) |
| `.shx` | Indice | Indice espacial das geometrias para acesso rapido |
| `.dbf` | Atributos | Tabela em formato dBase III com os campos alfanumericos |
| `.prj` | Projecao | Definicao do CRS (WGS 84 / EPSG:4326 ou SIRGAS 2000 / EPSG:4674) |
| `.cpg` | Codificacao | Especificacao de encoding UTF-8 |

---

## 4. Dicionario de Dados por Camada

### 1. `1_pontos_afericao_selecionados`
| Coluna DBF | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF |
| `ORDEM` | Inteiro | 4 | Sequencia do ponto no municipio |
| `NOME` | Texto | 100 | Identificacao do ponto de afericao |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |
| `JUSTIFIC` | Texto | 254 | Justificativa tecnica registrada |
| `DATA_HORA` | Texto | 30 | Registro de data e hora |

### 2. `2_pontos_sobreposicao_fluxos`
| Coluna DBF | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF |
| `RANK` | Inteiro | 5 | Posicao no ranking de frequencia de rotas |
| `FREQ` | Decimal | 10, 2 | Frequencia ponderada calculada |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |

### 3. `3_manchas_fluxo_rotas`
| Coluna DBF | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF |
| `ID_ROTA` | Inteiro | 6 | Identificador da rota TomTom |
| `NOME_ROTA` | Texto | 100 | Nome/descricao da rota |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |

### 4. `4_atrativos_turisticos`
| Coluna DBF | Tipo | Tamanho | Descricao |
| :--- | :--- | :---: | :--- |
| `MUNICIPIO` | Texto | 50 | Nome do municipio com UF |
| `ID_ATRATIV` | Inteiro | 5 | Numero identificador do atrativo |
| `NOME` | Texto | 100 | Nome do atrativo |
| `RANK_PROD4` | Texto | 50 | Classificacao no Produto 4 |
| `LATITUDE` | Decimal | 12, 6 | Latitude em graus decimais |
| `LONGITUDE` | Decimal | 12, 6 | Longitude em graus decimais |

---

## 5. Procedimento de Abertura no QGIS

1. Abra o QGIS (versao 3.0 ou superior).
2. Arraste o arquivo `pontos_afericao_unesco_shapefile.zip` ou o arquivo `pontos_afericao_unesco.gpkg` para o painel de camadas ou tela principal do QGIS.
3. Na janela de selecao de camadas, selecione as camadas desejadas:
   - `1_pontos_afericao_selecionados`
   - `2_pontos_sobreposicao_fluxos`
   - `3_manchas_fluxo_rotas`
   - `4_atrativos_turisticos`
4. As camadas serao carregadas com a tabela de atributos completa e o sistema de coordenadas configurado.
