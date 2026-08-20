# 📍 Pontos Nodais de Aferição Qualitativa
### Projeto UNESCO UNES 2369/2025 • Itaipu Parquetec
*Seleção e Validação Espacial de Pontos Nodais para Aferição em Cidades Turísticas e de Fronteira*

---

## 🎯 Sobre o Projeto

Este repositório contém a metodologia, o pipeline de dados geoespaciais, os mapas interativos e a ferramenta de apoio à decisão qualitativa desenvolvida no âmbito do **Projeto UNESCO (UNES 2369/2025)** em parceria com o **Itaipu Parquetec**.

O objetivo principal é a identificação, classificação e seleção precisa dos **pontos nodais e de aferição** em 12 municípios estratégicos nos estados do Paraná (PR), Mato Grosso do Sul (MS) e Santa Catarina (SC):

- **MS**: Bonito, Campo Grande, Corumbá, Mundo Novo, Ponta Porã, Porto Murtinho.
- **PR**: Barracão, Capanema, Foz do Iguaçu, Guaíra, Medianeira.
- **SC**: Dionísio Cerqueira.

---

## 🗺️ Ferramentas Principais

### 1. Painel de Decisão Qualitativa (`painel_decisao_qualitativa.html`)
Interface interativa em HTML/JS com mapa Leaflet para visualização integrada de:
- 🔥 **Manchas de Calor / Fluxo (TomTom)**: Densidade de viagens e rotas turísticas.
- 🔴 **Trechos de Sobreposição (Escala Logarítmica)**: Segmentos viários com maior sobreposição de rotas.
- ⭐ **Atrativos Classificados (Produto 4)**: Ranks e localizações de atrativos turísticos.
- 🎯 **Centroides Geométricos**: Concentração de CNPJs turísticos geocodificados.
- 💾 **Exportação Multiformato para QGIS**: Botões com download em 1 clique de **Shapefile (.zip)**, **GeoJSON** e **CSV**.

### 2. Gerador de Camadas QGIS (`gerar_shapefile_qgis.py`)
Script em Python para converter automaticamente qualquer planilha de pontos selecionados em:
- **ESRI Shapefile** (`.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`) empacotado em `.zip`.
- **GeoPackage** (`.gpkg`) - Formato nativo e recomendado para o QGIS.
- **GeoJSON** (`.geojson`).
- Suporte a sistemas de referência **WGS 84 (EPSG:4326)** e **SIRGAS 2000 (EPSG:4674)**.

---

## 🚀 Como Executar

### Abrir o Painel de Decisão
Basta abrir o arquivo [`painel_decisao_qualitativa.html`](painel_decisao_qualitativa.html) em qualquer navegador web moderno. Não requer servidor backend (funciona 100% offline).

### Gerar Camadas Shapefile/QGIS via Terminal
```bash
# Instalar dependências necessárias
pip install pandas geopandas shapely pyogrio

# Executar a conversão automática
python gerar_shapefile_qgis.py

# Ou converter um arquivo CSV específico:
python gerar_shapefile_qgis.py --csv "caminho/para/pontos_afericao_selecionados.csv"

# Para usar SIRGAS 2000 (EPSG:4674):
python gerar_shapefile_qgis.py --crs 4674
```

Os arquivos gerados serão salvos na pasta `camadas_qgis/`.

---

## 📂 Estrutura do Repositório

```
nodais/
├── painel_decisao_qualitativa.html       # Painel interativo de decisão e exportação
├── gerar_shapefile_qgis.py              # Script de conversão para Shapefile/GeoPackage
├── Guia_Exportacao_Shapefile_QGIS.md    # Manual técnico de importação no QGIS
├── Relatorio_Qualitativo_Mapas_Afericao.md # Relatório técnico de critérios espaciais
├── Atrativos_Relevantes_Por_Cidade.md   # Síntese dos atrativos e rankings por município
├── Atividades Produto 4_Projeto Unesco.xlsx # Matriz de dados e rankings do estudo
├── camadas_qgis/                        # Camadas vetoriais geradas (.zip, .gpkg, .geojson)
├── mapas_afericao/                      # Mapas individuais por município (HTML)
├── final/                               # Pipeline de ETL, geocodificação e rotas TomTom
└── Materiais de referência/             # Matrizes de tempo/distância e insumos
```

---

## 📄 Licença e Créditos

Desenvolvido para o **Projeto UNESCO UNES 2369/2025** em parceria com o **Itaipu Parquetec**.
