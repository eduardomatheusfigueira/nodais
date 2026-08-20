#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
GERADOR DE SHAPEFILE E CAMADAS VETORIAIS PARA QGIS
Projeto UNESCO UNES 2369/2025 • Itaipu Parquetec
Seleção dos Pontos para Aferição
================================================================================

Este script converte as decisões e pontos de aferição selecionados em:
1. ESRI Shapefile completo (.shp, .shx, .dbf, .prj, .cpg) empacotado em .ZIP
2. GeoPackage (.gpkg) - Formato moderno e recomendado para o QGIS
3. GeoJSON (.geojson) - Formato padrão para WebGIS e QGIS

Uso:
    python gerar_shapefile_qgis.py
    python gerar_shapefile_qgis.py --csv "caminho/para/pontos_afericao_selecionados.csv"
    python gerar_shapefile_qgis.py --crs 4674  (para SIRGAS 2000)
"""

import os
import sys
import glob
import shutil
import zipfile
import argparse
from pathlib import Path

# Configura encoding do terminal para compatibilidade no Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import pandas as pd
import geopandas as gpd
from shapely.geometry import Point


def find_latest_csv():
    """Busca automaticamente o arquivo CSV de pontos mais recente."""
    candidates = []
    
    # 1. Diretório atual e subdiretórios
    candidates.extend(glob.glob("pontos_afericao_selecionados*.csv"))
    candidates.extend(glob.glob("*.csv"))
    
    # 2. Pasta Downloads do usuário
    downloads_dir = Path.home() / "Downloads"
    if downloads_dir.exists():
        candidates.extend(glob.glob(str(downloads_dir / "pontos_afericao_selecionados*.csv")))
    
    # Filtra arquivos válidos
    valid_csvs = []
    for c in set(candidates):
        try:
            p = Path(c)
            if p.is_file() and p.stat().st_size > 0:
                # Verifica se parece ser o arquivo de decisões
                with open(p, "r", encoding="utf-8-sig", errors="ignore") as f:
                    first_line = f.readline().lower()
                    if "municipio" in first_line or "latitude" in first_line or "ponto" in first_line:
                        valid_csvs.append((p.stat().st_mtime, p))
        except Exception:
            continue
            
    if not valid_csvs:
        return None
        
    valid_csvs.sort(key=lambda x: x[0], reverse=True)
    return valid_csvs[0][1]


def load_points_dataframe(csv_path):
    """Lê e padroniza o CSV de pontos de aferição."""
    print(f"📖 Lendo arquivo: {csv_path}")
    
    # Tenta ler com diferentes encodings e delimitadores
    df = None
    for enc in ["utf-8-sig", "utf-8", "latin1", "cp1252"]:
        for sep in [";", ",", "\t"]:
            try:
                temp_df = pd.read_csv(csv_path, sep=sep, encoding=enc, dtype=str)
                cols_lower = [c.lower().strip() for c in temp_df.columns]
                
                # Procura colunas de latitude e longitude
                has_lat = any("lat" in c for c in cols_lower)
                has_lon = any("lon" in c or "lng" in c for c in cols_lower)
                
                if has_lat and has_lon and len(temp_df) > 0:
                    df = temp_df
                    print(f"   ✓ Detectado formato: delimitador '{sep}', encoding '{enc}', {len(df)} registros.")
                    break
            except Exception:
                continue
        if df is not None:
            break
            
    if df is None or len(df) == 0:
        raise ValueError(f"Não foi possível ler dados válidos de coordenadas do arquivo: {csv_path}")
        
    # Mapear e renomear colunas
    col_map = {}
    for col in df.columns:
        cl = col.lower().strip()
        if "muni" in cl or "cidade" in cl:
            col_map[col] = "MUNICIPIO"
        elif "ordem" in cl or "seq" in cl:
            col_map[col] = "ORDEM"
        elif "nome" in cl or "atrativo" in cl or "ponto" in cl and "ordem" not in cl:
            col_map[col] = "NOME"
        elif "lat" in cl:
            col_map[col] = "LATITUDE"
        elif "lon" in cl or "lng" in cl:
            col_map[col] = "LONGITUDE"
        elif "justific" in cl or "obs" in cl or "nota" in cl:
            col_map[col] = "JUSTIFIC"
        elif "data" in cl or "hora" in cl or "time" in cl:
            col_map[col] = "DATA_HORA"
            
    df = df.rename(columns=col_map)
    
    # Garantir colunas essenciais
    if "MUNICIPIO" not in df.columns: df["MUNICIPIO"] = "Não informado"
    if "ORDEM" not in df.columns: df["ORDEM"] = [str(i + 1) for i in range(len(df))]
    if "NOME" not in df.columns: df["NOME"] = [f"Ponto #{i+1}" for i in range(len(df))]
    if "JUSTIFIC" not in df.columns: df["JUSTIFIC"] = ""
    if "DATA_HORA" not in df.columns: df["DATA_HORA"] = ""
    
    # Limpar coordenadas (trocar vírgula por ponto se necessário)
    df["LATITUDE"] = df["LATITUDE"].astype(str).str.replace(",", ".").str.strip()
    df["LONGITUDE"] = df["LONGITUDE"].astype(str).str.replace(",", ".").str.strip()
    
    df["LATITUDE"] = pd.to_numeric(df["LATITUDE"], errors="coerce")
    df["LONGITUDE"] = pd.to_numeric(df["LONGITUDE"], errors="coerce")
    
    # Filtrar coordenadas válidas
    df_valid = df.dropna(subset=["LATITUDE", "LONGITUDE"]).copy()
    
    # Tratar ORDEM como inteiro se possível
    df_valid["ORDEM_NUM"] = pd.to_numeric(df_valid["ORDEM"].astype(str).str.extract(r'(\d+)')[0], errors="coerce").fillna(1).astype(int)
    df_valid["ORDEM"] = df_valid["ORDEM_NUM"]
    df_valid = df_valid.drop(columns=["ORDEM_NUM"], errors="ignore")
    
    # Ajustar limites de caracteres para padrão DBF (máximo 254 bytes)
    df_valid["MUNICIPIO"] = df_valid["MUNICIPIO"].astype(str).str[:50]
    df_valid["NOME"] = df_valid["NOME"].astype(str).str[:100]
    df_valid["JUSTIFIC"] = df_valid["JUSTIFIC"].astype(str).str[:254]
    df_valid["DATA_HORA"] = df_valid["DATA_HORA"].astype(str).str[:30]
    
    cols_order = ["MUNICIPIO", "ORDEM", "NOME", "LATITUDE", "LONGITUDE", "JUSTIFIC", "DATA_HORA"]
    # Manter outras colunas que existiam
    other_cols = [c for c in df_valid.columns if c not in cols_order and c != "geometry"]
    df_valid = df_valid[cols_order + other_cols]
    
    return df_valid


def export_qgis_layers(df, output_dir="camadas_qgis", epsg_code=4326):
    """Gera arquivos Shapefile (.zip), GeoPackage (.gpkg) e GeoJSON."""
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    crs_str = f"EPSG:{epsg_code}"
    crs_name = "SIRGAS 2000 (Geográfico)" if epsg_code == 4674 else "WGS 84 (Geográfico Padrão GPS)"
    
    print(f"\n⚙️  Criando geometrias no sistema de referência: {crs_str} ({crs_name})...")
    
    # Criar GeoDataFrame
    geometry = [Point(xy) for xy in zip(df["LONGITUDE"], df["LATITUDE"])]
    gdf = gpd.GeoDataFrame(df, geometry=geometry, crs=crs_str)
    
    # 1. Exportar GeoPackage (.gpkg)
    gpkg_file = out_path / "pontos_afericao_unesco.gpkg"
    print(f"📦 Gerando GeoPackage: {gpkg_file.name}")
    gdf.to_file(gpkg_file, layer="pontos_afericao", driver="GPKG", encoding="utf-8")
    
    # 2. Exportar GeoJSON (.geojson)
    geojson_file = out_path / "pontos_afericao_unesco.geojson"
    print(f"🌐 Gerando GeoJSON: {geojson_file.name}")
    gdf.to_file(geojson_file, driver="GeoJSON", encoding="utf-8")
    
    # 3. Exportar Shapefile (.shp, .shx, .dbf, .prj, .cpg)
    shp_temp_dir = out_path / "shapefile_temp"
    shp_temp_dir.mkdir(parents=True, exist_ok=True)
    
    shp_base = shp_temp_dir / "pontos_afericao"
    shp_file = shp_temp_dir / "pontos_afericao.shp"
    
    print(f"🗺️  Gerando Shapefile: pontos_afericao.shp")
    gdf.to_file(shp_file, driver="ESRI Shapefile", encoding="utf-8")
    
    # Garantir arquivo .cpg com UTF-8
    cpg_file = shp_temp_dir / "pontos_afericao.cpg"
    with open(cpg_file, "w", encoding="utf-8") as f:
        f.write("UTF-8\n")
        
    # Adicionar Guia de Instruções LEIAME_QGIS.txt
    readme_file = shp_temp_dir / "LEIAME_QGIS.txt"
    with open(readme_file, "w", encoding="utf-8") as f:
        f.write(f"""================================================================================
PONTOS DE AFERIÇÃO SELECIONADOS - PROJETO UNESCO & ITAIPU PARQUETEC
UNES 2369/2025 • Seleção de Pontos para Aferição Qualitativa
================================================================================

COMO ABRIR NO QGIS:
1. Abra o QGIS (versão 3.x ou superior).
2. Opção A: Arraste o arquivo "pontos_afericao.shp" para dentro do QGIS.
   Opção B: Arraste diretamente o arquivo "pontos_afericao_unesco_shapefile.zip".
   Opção C: Utilize a camada GeoPackage "pontos_afericao_unesco.gpkg".
3. A camada será carregada instantaneamente com estilo e coordenadas exatas.

DETALHES DO SISTEMA DE COORDENADAS (CRS):
- Projeção: {crs_name}
- Código EPSG: {crs_str}
- Unidade: Graus Decimais

CAMPOS DA TABELA DE ATRIBUTOS:
- MUNICIPIO : Nome do município avaliado (ex: PR - Foz do Iguaçu)
- ORDEM     : Sequência numérica do ponto no município (1, 2, 3...)
- NOME      : Descrição ou nome do ponto de aferição
- LATITUDE  : Latitude em graus decimais
- LONGITUDE : Longitude em graus decimais
- JUSTIFIC  : Justificativa técnica e fatores observados
- DATA_HORA : Data e hora do registro da decisão

TOTAL DE PONTOS INCLUÍDOS: {len(df)}
MUNICÍPIOS COBERTOS: {', '.join(sorted(df['MUNICIPIO'].unique()))}
================================================================================
""")

    # Compactar todos os arquivos do Shapefile em um ZIP pronto para o QGIS
    zip_dest = out_path / "pontos_afericao_unesco_shapefile.zip"
    print(f"🗜️  Criando arquivo ZIP para QGIS: {zip_dest.name}")
    
    with zipfile.ZipFile(zip_dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in shp_temp_dir.iterdir():
            if f.is_file():
                zf.write(f, arcname=f.name)
                
    # Limpar diretório temporário
    shutil.rmtree(shp_temp_dir, ignore_errors=True)
    
    print("\n" + "="*70)
    print("✅ EXPORTAÇÃO CONCLUÍDA COM SUCESSO!")
    print("="*70)
    print(f"📁 Diretório de saída: {out_path.resolve()}")
    print(f"   1. [Shapefile ZIP] -> {zip_dest.name} (Contém .shp, .shx, .dbf, .prj, .cpg)")
    print(f"   2. [GeoPackage]    -> {gpkg_file.name} (Camada nativa QGIS)")
    print(f"   3. [GeoJSON]       -> {geojson_file.name}")
    print(f"\n📊 Resumo dos dados exportados:")
    print(f"   - Total de Pontos: {len(df)}")
    print(f"   - Municípios: {len(df['MUNICIPIO'].unique())} ({', '.join(sorted(df['MUNICIPIO'].unique()))})")
    print(f"   - Bounding Box (Extensão): Lat [{df['LATITUDE'].min():.4f}, {df['LATITUDE'].max():.4f}], Lon [{df['LONGITUDE'].min():.4f}, {df['LONGITUDE'].max():.4f}]")
    print("="*70)
    print("\n💡 Dica QGIS: Basta arrastar o arquivo .ZIP ou .GPKG diretamente para a tela do QGIS!")


def main():
    parser = argparse.ArgumentParser(description="Exportar pontos de aferição em Shapefile, GeoPackage e GeoJSON para QGIS.")
    parser.add_argument("--csv", "-c", type=str, default=None, help="Caminho para o arquivo CSV de pontos.")
    parser.add_argument("--out", "-o", type=str, default="camadas_qgis", help="Diretório de saída para os arquivos GIS.")
    parser.add_argument("--crs", type=int, default=4326, choices=[4326, 4674], help="Código EPSG (4326 = WGS84, 4674 = SIRGAS 2000).")
    
    args = parser.parse_args()
    
    csv_file = args.csv
    if not csv_file:
        csv_file = find_latest_csv()
        if not csv_file:
            print("❌ Erro: Nenhum arquivo CSV de pontos encontrado.")
            print("Por favor, especifique o caminho: python gerar_shapefile_qgis.py --csv 'meu_arquivo.csv'")
            sys.exit(1)
        print(f"🔍 Arquivo CSV detectado automaticamente: {csv_file}")
        
    try:
        df = load_points_dataframe(csv_file)
        if len(df) == 0:
            print("❌ Erro: Nenhum ponto válido com latitude e longitude encontrado no arquivo.")
            sys.exit(1)
            
        export_qgis_layers(df, output_dir=args.out, epsg_code=args.crs)
        
    except Exception as e:
        print(f"\n❌ Erro durante a geração dos arquivos: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
