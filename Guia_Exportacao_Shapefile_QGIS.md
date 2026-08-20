# 🗺️ Guia de Exportação de Pontos para Shapefile e QGIS
**Projeto UNESCO UNES 2369/2025 • Itaipu Parquetec**  
*Seleção dos Pontos de Aferição das Cidades Turísticas e de Fronteira*

---

## 📌 1. Visão Geral

Para atender aos fluxos de trabalho geoespaciais e relatórios cartográficos no **QGIS**, o ecossistema agora oferece suporte nativo à exportação de todos os pontos de aferição em **Shapefile ESRI (.shp)** com todos os arquivos companheiros obrigatórios, além de **GeoPackage (.gpkg)** e **GeoJSON (.geojson)**.

---

## 🚀 2. Métodos de Exportação

### Método A: Exportação Direta pelo Painel Web (`painel_decisao_qualitativa.html`)
1. Abra o arquivo [`painel_decisao_qualitativa.html`](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/painel_decisao_qualitativa.html) em qualquer navegador moderno.
2. Navegue pelos municípios, visualize as manchas de calor (TomTom), trechos de sobreposição e atrativos classificados.
3. Adicione os pontos de aferição desejados com suas justificativas técnicas.
4. No cabeçalho superior direito, clique em:
   - **`Exportar Shapefile (QGIS)`**: Faz o download instantâneo de um arquivo compactado `.zip` contendo todos os 5 arquivos do Shapefile + instruções.
   - **`GeoJSON`**: Gera o arquivo vetorial `.geojson` com geometrias e propriedades completas.
   - **`CSV`**: Exporta a planilha tabular das decisões para conferência em Excel/Calc.

> [!TIP]
> O gerador de Shapefile do painel web funciona **100% offline**, sem necessidade de servidores externos ou conexão com a internet.

---

### Método B: Conversão Automática via Python (`gerar_shapefile_qgis.py`)
Se você já possui arquivos CSV salvos na pasta Downloads (ou no diretório do projeto):

```bash
# Executa a busca automática do CSV mais recente e gera as camadas
python gerar_shapefile_qgis.py

# Ou especifique um CSV específico:
python gerar_shapefile_qgis.py --csv "pontos_afericao_selecionados.csv"

# Para definir o Sistema de Coordenadas SIRGAS 2000 (EPSG:4674):
python gerar_shapefile_qgis.py --crs 4674
```

Arquivos gerados na pasta [`camadas_qgis/`](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/camadas_qgis):
1. `pontos_afericao_unesco_shapefile.zip` *(Pacote Shapefile completo)*
2. `pontos_afericao_unesco.gpkg` *(GeoPackage recomendado para o QGIS)*
3. `pontos_afericao_unesco.geojson` *(GeoJSON)*

---

## 📂 3. Anatomia do Shapefile Gerado

Para que um Shapefile abra perfeitamente no QGIS sem erros de projeção ou caracteres corrompidos, os seguintes arquivos estão presentes:

| Arquivo | Função | Descrição Técnica |
| :--- | :--- | :--- |
| **`pontos_afericao.shp`** | Geometria Vetorial | Armazena as coordenadas pontuais `(X = Longitude, Y = Latitude)` |
| **`pontos_afericao.shx`** | Índice Espacial | Permite acesso rápido e indexação espacial das feições no QGIS |
| **`pontos_afericao.dbf`** | Tabela de Atributos | Formato dBase III contendo os dados alfanuméricos |
| **`pontos_afericao.prj`** | Projeção Cartográfica | Define o CRS: **WGS 84 (EPSG:4326)** ou **SIRGAS 2000 (EPSG:4674)** |
| **`pontos_afericao.cpg`** | Codificação | Define `UTF-8`, garantindo a correta exibição de acentos e cedilhas |
| **`LEIAME_QGIS.txt`** | Documentação | Instruções rápidas de importação e dicionário de dados |

---

## 📋 4. Dicionário de Dados (Atributos)

| Coluna DBF | Tipo | Tamanho | Descrição | Exemplo |
| :--- | :--- | :---: | :--- | :--- |
| **`MUNICIPIO`** | Texto | 50 | Nome do município e UF | `PR - Foz do Iguaçu` |
| **`ORDEM`** | Inteiro | 4 | Sequência do ponto no município | `1`, `2`, `3` |
| **`NOME`** | Texto | 100 | Nome/identificação do ponto | `Marco das Três Fronteiras` |
| **`LATITUDE`** | Decimal | 12, 6 | Latitude em graus decimais | `-25.589123` |
| **`LONGITUDE`** | Decimal | 12, 6 | Longitude em graus decimais | `-54.582456` |
| **`JUSTIFIC`** | Texto | 254 | Justificativa técnica e fatores | `Ponto de confluência turística` |
| **`DATA_HORA`** | Texto | 30 | Timestamp da decisão | `20/08/2026 09:30:00` |

---

## 🖥️ 5. Como Abrir e Configurar no QGIS

1. **Importação Rápida**:
   - Abra o QGIS (versão 3.x ou superior).
   - Arraste o arquivo `.zip` ou extraia e arraste `pontos_afericao.shp` diretamente para a área de trabalho do QGIS.
2. **Dica de Simbologia**:
   - Clique com o botão direito na camada `pontos_afericao` > **Propriedades** > **Simbologia**.
   - Escolha **Categorizado** por `MUNICIPIO` para colorir os pontos de cada cidade com uma cor distinta.
   - Adicione **Rótulos (Labels)** usando o campo `NOME` ou `ORDEM`.
3. **Exportação de Mapas**:
   - Utilize o *Compositor de Impressão (Print Layout)* do QGIS para gerar mapas temáticos para o relatório oficial do projeto.
