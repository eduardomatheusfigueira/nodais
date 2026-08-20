/* =========================================================================
   ESTUDIO DE MAPAS E PONTOS NODAIS
   -------------------------------------------------------------------------
   Modulo de composicao cartografica e exportacao de imagens em alta
   resolucao para o Painel de Decisao Qualitativa (UNESCO UNES 2369/2025).

   Consolida em um unico ambiente as ferramentas de geracao de mapas:
     - renderizacao propria do mapa base (mosaico de tiles em canvas), das
       manchas de fluxo, dos trechos de sobreposicao, dos atrativos, do
       centroide de CNPJs e dos pontos nodais de afericao;
     - elementos cartograficos posicionaveis (titulo, rosa dos ventos,
       escala grafica, legenda de simbologia, legenda de pontos nodais,
       grade de coordenadas, textos e formas livres);
     - exportacao em PNG/JPEG na resolucao escolhida, individual ou em lote
       (um mapa por municipio, compactado em .zip).

   O modulo nao depende de framework: expoe o objeto global EstudioMapas e
   funciona ao abrir o arquivo HTML diretamente no navegador.
   ========================================================================= */

(function (global) {
    'use strict';

    // =====================================================================
    // 1. PROJECAO WEB MERCATOR (EPSG:3857)
    // =====================================================================

    var TAM_TILE = 256;
    var ZOOM_MAXIMO_TILE = 19;

    function projetar(lat, lon, zoom) {
        var escala = TAM_TILE * Math.pow(2, zoom);
        var latLimitada = Math.max(-85.05112878, Math.min(85.05112878, lat));
        var seno = Math.sin(latLimitada * Math.PI / 180);
        return {
            x: (lon + 180) / 360 * escala,
            y: (0.5 - Math.log((1 + seno) / (1 - seno)) / (4 * Math.PI)) * escala
        };
    }

    function desprojetar(x, y, zoom) {
        var escala = TAM_TILE * Math.pow(2, zoom);
        var n = Math.PI - 2 * Math.PI * y / escala;
        return {
            lat: 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
            lon: x / escala * 360 - 180
        };
    }

    /**
     * Cria a "visao" que amarra um enquadramento geografico a um canvas de
     * largura x altura pixels. Todas as camadas usam esta visao para
     * converter coordenadas geograficas em coordenadas de tela.
     */
    function criarVisao(centro, zoom, largura, altura) {
        var c = projetar(centro.lat, centro.lon, zoom);
        var x0 = c.x - largura / 2;
        var y0 = c.y - altura / 2;
        return {
            centro: { lat: centro.lat, lon: centro.lon },
            zoom: zoom,
            largura: largura,
            altura: altura,
            x0: x0,
            y0: y0,
            paraTela: function (lat, lon) {
                var p = projetar(lat, lon, zoom);
                return { x: p.x - x0, y: p.y - y0 };
            },
            paraGeo: function (px, py) {
                return desprojetar(x0 + px, y0 + py, zoom);
            },
            limites: function () {
                var no = desprojetar(x0, y0, zoom);
                var se = desprojetar(x0 + largura, y0 + altura, zoom);
                return { norte: no.lat, oeste: no.lon, sul: se.lat, leste: se.lon };
            }
        };
    }

    /** Zoom que enquadra um retangulo geografico num canvas largura x altura. */
    function zoomParaLimites(limites, largura, altura, margem) {
        var m = margem == null ? 0.12 : margem;
        var melhor = 3;
        for (var z = ZOOM_MAXIMO_TILE; z >= 2; z -= 0.25) {
            var a = projetar(limites.norte, limites.oeste, z);
            var b = projetar(limites.sul, limites.leste, z);
            if (Math.abs(b.x - a.x) <= largura * (1 - m) && Math.abs(b.y - a.y) <= altura * (1 - m)) {
                melhor = z;
                break;
            }
        }
        return melhor;
    }

    /** Retangulo envolvente de uma lista de {lat, lon}. */
    function limitesDePontos(pontos) {
        if (!pontos || !pontos.length) return null;
        var norte = -90, sul = 90, leste = -180, oeste = 180;
        for (var i = 0; i < pontos.length; i++) {
            var p = pontos[i];
            if (p.lat == null || p.lon == null || isNaN(p.lat) || isNaN(p.lon)) continue;
            if (p.lat > norte) norte = p.lat;
            if (p.lat < sul) sul = p.lat;
            if (p.lon > leste) leste = p.lon;
            if (p.lon < oeste) oeste = p.lon;
        }
        if (norte < sul) return null;
        if (norte === sul) { norte += 0.01; sul -= 0.01; }
        if (leste === oeste) { leste += 0.01; oeste -= 0.01; }
        return { norte: norte, sul: sul, leste: leste, oeste: oeste };
    }

    // =====================================================================
    // 2. MOSAICO DO MAPA BASE
    // =====================================================================

    var SUBDOMINIOS = ['a', 'b', 'c'];

    function montarUrlTile(modelo, x, y, z, indice) {
        return modelo
            .replace('{s}', SUBDOMINIOS[indice % SUBDOMINIOS.length])
            .replace('{z}', z)
            .replace('{x}', x)
            .replace('{y}', y)
            .replace('{r}', '@2x');
    }

    function carregarImagem(url) {
        return new Promise(function (resolve) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            var encerrado = false;
            var tempo = setTimeout(function () {
                if (!encerrado) { encerrado = true; resolve(null); }
            }, 20000);
            img.onload = function () {
                if (encerrado) return;
                encerrado = true; clearTimeout(tempo); resolve(img);
            };
            img.onerror = function () {
                if (encerrado) return;
                encerrado = true; clearTimeout(tempo); resolve(null);
            };
            img.src = url;
        });
    }

    /**
     * Desenha o mosaico do mapa base no contexto informado.
     * Retorna a quantidade de tiles que falharam (util para avisar o usuario
     * quando o provedor esta indisponivel ou bloqueia requisicoes).
     */
    function desenharMapaBase(ctx, visao, modeloUrl, aoProgredir) {
        var zoomTile = Math.max(0, Math.min(ZOOM_MAXIMO_TILE, Math.round(visao.zoom)));
        var k = Math.pow(2, visao.zoom - zoomTile);       // px de canvas por px de tile
        var tamanhoNaTela = TAM_TILE * k;
        var totalTiles = Math.pow(2, zoomTile);

        var x0t = visao.x0 / k;                            // origem em px do zoom do tile
        var y0t = visao.y0 / k;
        var i0 = Math.floor(x0t / TAM_TILE);
        var i1 = Math.floor((x0t + visao.largura / k) / TAM_TILE);
        var j0 = Math.floor(y0t / TAM_TILE);
        var j1 = Math.floor((y0t + visao.altura / k) / TAM_TILE);

        var tarefas = [];
        for (var j = j0; j <= j1; j++) {
            if (j < 0 || j >= totalTiles) continue;
            for (var i = i0; i <= i1; i++) {
                var iEnvolvido = ((i % totalTiles) + totalTiles) % totalTiles;
                tarefas.push({
                    x: iEnvolvido,
                    y: j,
                    telaX: i * tamanhoNaTela - visao.x0,
                    telaY: j * tamanhoNaTela - visao.y0
                });
            }
        }

        ctx.fillStyle = '#e8eaed';
        ctx.fillRect(0, 0, visao.largura, visao.altura);

        var falhas = 0;
        var concluidas = 0;
        var proxima = 0;
        var CONCORRENCIA = 6;

        function executarUma() {
            if (proxima >= tarefas.length) return Promise.resolve();
            var t = tarefas[proxima];
            var indice = proxima;
            proxima++;
            return carregarImagem(montarUrlTile(modeloUrl, t.x, t.y, zoomTile, indice))
                .then(function (img) {
                    if (img) {
                        ctx.drawImage(
                            img,
                            Math.floor(t.telaX), Math.floor(t.telaY),
                            Math.ceil(tamanhoNaTela) + 1, Math.ceil(tamanhoNaTela) + 1
                        );
                    } else {
                        falhas++;
                    }
                    concluidas++;
                    if (aoProgredir) aoProgredir(concluidas, tarefas.length);
                    return executarUma();
                });
        }

        var trilhas = [];
        for (var n = 0; n < Math.min(CONCORRENCIA, tarefas.length); n++) trilhas.push(executarUma());
        return Promise.all(trilhas).then(function () { return falhas; });
    }

    // =====================================================================
    // 3. SIMBOLOGIA DAS CAMADAS DO ESTUDO
    // =====================================================================

    /**
     * Rampa logaritmica de relevancia das rotas. Usa a funcao do painel
     * quando disponivel para garantir que a imagem exportada tenha
     * exatamente as mesmas cores exibidas na tela; a copia local mantem o
     * modulo utilizavel de forma isolada.
     */
    function corEscalaLog(valor, minimo, maximo) {
        if (typeof global.getLogColor === 'function') {
            return global.getLogColor(valor, minimo, maximo);
        }
        var logVal = Math.log1p(Math.max(0, valor));
        var logMin = Math.log1p(Math.max(0, minimo));
        var logMax = Math.log1p(Math.max(0, maximo));
        var norma = (logMax === logMin) ? 1 : (logVal - logMin) / (logMax - logMin);
        norma = Math.max(0, Math.min(1, norma));
        var r, g, b, t;
        if (norma < 0.25) { t = norma / 0.25; r = 255; g = 255; b = Math.round(255 - 60 * t); }
        else if (norma < 0.55) { t = (norma - 0.25) / 0.30; r = 255; g = Math.round(255 - 100 * t); b = Math.round(195 - 100 * t); }
        else if (norma < 0.85) { t = (norma - 0.55) / 0.30; r = 255; g = Math.round(155 - 100 * t); b = Math.round(95 - 60 * t); }
        else { t = (norma - 0.85) / 0.15; r = Math.round(255 - 90 * t); g = Math.round(55 - 40 * t); b = Math.round(35 - 5 * t); }
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function normaLog(valor, minimo, maximo) {
        var logMin = Math.log1p(Math.max(0, minimo));
        var logMax = Math.log1p(Math.max(0, maximo));
        if (logMax === logMin) return 1;
        return (Math.log1p(Math.max(0, valor)) - logMin) / (logMax - logMin);
    }

    // Gradiente das manchas de fluxo, identico ao do painel (leaflet.heat).
    var GRADIENTE_CALOR = [
        [0.2, [0, 0, 255]],
        [0.4, [0, 255, 255]],
        [0.6, [0, 255, 0]],
        [0.8, [255, 255, 0]],
        [1.0, [255, 0, 0]]
    ];

    function construirTabelaCalor() {
        var tabela = new Uint8ClampedArray(256 * 3);
        for (var i = 0; i < 256; i++) {
            var t = i / 255;
            var anterior = GRADIENTE_CALOR[0];
            var proximo = GRADIENTE_CALOR[GRADIENTE_CALOR.length - 1];
            for (var g = 0; g < GRADIENTE_CALOR.length; g++) {
                if (GRADIENTE_CALOR[g][0] >= t) { proximo = GRADIENTE_CALOR[g]; break; }
                anterior = GRADIENTE_CALOR[g];
            }
            var intervalo = proximo[0] - anterior[0];
            var f = intervalo <= 0 ? 0 : (t - anterior[0]) / intervalo;
            f = Math.max(0, Math.min(1, f));
            tabela[i * 3] = anterior[1][0] + (proximo[1][0] - anterior[1][0]) * f;
            tabela[i * 3 + 1] = anterior[1][1] + (proximo[1][1] - anterior[1][1]) * f;
            tabela[i * 3 + 2] = anterior[1][2] + (proximo[1][2] - anterior[1][2]) * f;
        }
        return tabela;
    }

    var TABELA_CALOR = null;

    /**
     * Manchas de fluxo TomTom (equivalente em canvas da camada leaflet.heat).
     * A intensidade regula a opacidade de cada ponto: valores baixos deixam a
     * rampa de densidade visivel, valores altos saturam o nucleo das manchas.
     */
    function desenharManchasFluxo(ctx, visao, pontos, escala, intensidade) {
        if (!pontos || !pontos.length) return;
        var raio = 10 * escala;
        var desfoque = 12 * escala;
        var total = raio + desfoque;
        var forca = intensidade == null ? 0.25 : Math.max(0.02, Math.min(1, intensidade));

        var buffer = document.createElement('canvas');
        buffer.width = Math.max(1, Math.round(visao.largura));
        buffer.height = Math.max(1, Math.round(visao.altura));
        var bctx = buffer.getContext('2d');

        // Pincel circular em tons de cinza (mesma tecnica do leaflet.heat).
        var pincel = document.createElement('canvas');
        var tamPincel = Math.ceil(total * 2);
        pincel.width = pincel.height = tamPincel;
        var pctx = pincel.getContext('2d');
        var grad = pctx.createRadialGradient(total, total, raio * 0.35, total, total, total);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.55)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        pctx.fillStyle = grad;
        pctx.fillRect(0, 0, tamPincel, tamPincel);

        var pesoMaximo = 1;
        for (var m = 0; m < pontos.length; m++) {
            var w = pontos[m].length > 2 ? pontos[m][2] : 1;
            if (w > pesoMaximo) pesoMaximo = w;
        }

        for (var i = 0; i < pontos.length; i++) {
            var lat = pontos[i][0], lon = pontos[i][1];
            if (lat == null || lon == null) continue;
            var p = visao.paraTela(lat, lon);
            if (p.x < -total || p.y < -total || p.x > visao.largura + total || p.y > visao.altura + total) continue;
            var peso = pontos[i].length > 2 ? pontos[i][2] : 1;
            bctx.globalAlpha = Math.min(1, Math.max(peso / pesoMaximo, 0.15)) * forca;
            bctx.drawImage(pincel, p.x - total, p.y - total);
        }
        bctx.globalAlpha = 1;

        // Colore o acumulado cinza usando a tabela do gradiente.
        if (!TABELA_CALOR) TABELA_CALOR = construirTabelaCalor();
        var dados = bctx.getImageData(0, 0, buffer.width, buffer.height);
        var px = dados.data;
        for (var j = 0; j < px.length; j += 4) {
            var alfa = px[j + 3];
            if (alfa === 0) continue;
            px[j] = TABELA_CALOR[alfa * 3];
            px[j + 1] = TABELA_CALOR[alfa * 3 + 1];
            px[j + 2] = TABELA_CALOR[alfa * 3 + 2];
        }
        bctx.putImageData(dados, 0, 0);
        ctx.drawImage(buffer, 0, 0);
    }

    /** Trechos de sobreposicao de rotas (escala logaritmica). */
    function desenharSobreposicao(ctx, visao, clusters, escala, filtros) {
        if (!clusters || !clusters.length) return 0;
        var freqs = clusters.map(function (c) { return c.freq; });
        var minF = Math.min.apply(null, freqs);
        var maxF = Math.max.apply(null, freqs);
        var raio = 7 * escala;
        var exibidos = 0;

        for (var i = 0; i < clusters.length; i++) {
            var cl = clusters[i];
            if (filtros && cl.freq < filtros.freqMinima) continue;
            var norma = normaLog(cl.freq, minF, maxF);
            if (filtros && filtros.categoria === 'high' && norma < 0.55) continue;
            if (filtros && filtros.categoria === 'midhigh' && norma < 0.25) continue;

            var p = visao.paraTela(cl.lat, cl.lon);
            if (p.x < -raio || p.y < -raio || p.x > visao.largura + raio || p.y > visao.altura + raio) continue;

            ctx.beginPath();
            ctx.arc(p.x, p.y, raio, 0, Math.PI * 2);
            ctx.fillStyle = corEscalaLog(cl.freq, minF, maxF);
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.lineWidth = Math.max(0.6, 1.2 * escala);
            ctx.strokeStyle = '#1e293b';
            ctx.stroke();
            exibidos++;
        }
        return exibidos;
    }

    /** Texto com halo branco, legivel sobre qualquer mapa base. */
    function textoComHalo(ctx, texto, x, y, fonte, cor, larguraHalo) {
        ctx.font = fonte;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = larguraHalo;
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.strokeText(texto, x, y);
        ctx.fillStyle = cor;
        ctx.fillText(texto, x, y);
    }

    /** Atrativos turisticos com o distintivo numerico do Produto 4. */
    function desenharAtrativos(ctx, visao, atrativos, escala, opcoes) {
        if (!atrativos || !atrativos.length) return 0;
        var raio = 14 * escala;
        var exibidos = 0;
        var comRotulo = opcoes && opcoes.rotulos;

        for (var i = 0; i < atrativos.length; i++) {
            var att = atrativos[i];
            if (att.visible === false) continue;
            if (opcoes && opcoes.limiteRank && (att.rank_num || 999) > opcoes.limiteRank) continue;
            var p = visao.paraTela(att.lat, att.lon);
            if (p.x < -raio * 4 || p.y < -raio * 4 || p.x > visao.largura + raio * 4 || p.y > visao.altura + raio * 4) continue;

            ctx.beginPath();
            ctx.arc(p.x, p.y, raio, 0, Math.PI * 2);
            ctx.fillStyle = '#0072CE';
            ctx.fill();
            ctx.lineWidth = Math.max(1, 2 * escala);
            ctx.strokeStyle = '#00873E';
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '700 ' + Math.round(13 * escala) + 'px Inter, Ubuntu, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(att.badge), p.x, p.y + 0.5 * escala);

            if (comRotulo) {
                ctx.textAlign = 'left';
                textoComHalo(
                    ctx, att.name, p.x + raio + 4 * escala, p.y,
                    '600 ' + Math.round(12 * escala) + 'px Inter, Ubuntu, sans-serif',
                    '#0f172a', Math.max(2, 3 * escala)
                );
            }
            exibidos++;
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        return exibidos;
    }

    /** Centroide geometrico dos CNPJs turisticos. */
    function desenharCentroide(ctx, visao, centroide, escala) {
        if (!centroide) return;
        var p = visao.paraTela(centroide.lat, centroide.lon);
        var raio = 13 * escala;
        ctx.beginPath();
        ctx.arc(p.x, p.y, raio, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.lineWidth = Math.max(1, 2.5 * escala);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        // Alvo interno
        ctx.beginPath();
        ctx.arc(p.x, p.y, raio * 0.45, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, 2 * escala);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x - raio * 1.35, p.y); ctx.lineTo(p.x - raio * 0.75, p.y);
        ctx.moveTo(p.x + raio * 0.75, p.y); ctx.lineTo(p.x + raio * 1.35, p.y);
        ctx.moveTo(p.x, p.y - raio * 1.35); ctx.lineTo(p.x, p.y - raio * 0.75);
        ctx.moveTo(p.x, p.y + raio * 0.75); ctx.lineTo(p.x, p.y + raio * 1.35);
        ctx.strokeStyle = '#b45309';
        ctx.stroke();
    }

    /** Pontos nodais de afericao registrados pelo usuario. */
    function desenharPontosNodais(ctx, visao, pontos, escala, opcoes) {
        if (!pontos || !pontos.length) return 0;
        var altura = 34 * escala;
        var largura = 24 * escala;
        var comRotulo = opcoes && opcoes.rotulos;

        for (var i = 0; i < pontos.length; i++) {
            var pt = pontos[i];
            var lat = parseFloat(pt.lat), lon = parseFloat(pt.lon);
            if (isNaN(lat) || isNaN(lon)) continue;
            var p = visao.paraTela(lat, lon);
            if (p.x < -largura * 3 || p.y < -altura * 3 || p.x > visao.largura + largura * 3 || p.y > visao.altura + altura * 3) continue;

            // Marcador em forma de gota, com a ponta sobre a coordenada.
            var cx = p.x, base = p.y, r = largura / 2, cy = base - altura + r;
            ctx.beginPath();
            ctx.arc(cx, cy, r, Math.PI * 0.85, Math.PI * 0.15);
            ctx.lineTo(cx, base);
            ctx.closePath();
            ctx.fillStyle = '#16a34a';
            ctx.fill();
            ctx.lineWidth = Math.max(1, 2 * escala);
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '700 ' + Math.round(13 * escala) + 'px Inter, Ubuntu, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), cx, cy);

            if (comRotulo) {
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                textoComHalo(
                    ctx, pt.name || ('Ponto ' + (i + 1)), cx + r + 4 * escala, cy,
                    '600 ' + Math.round(12 * escala) + 'px Inter, Ubuntu, sans-serif',
                    '#14532d', Math.max(2, 3 * escala)
                );
            }
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        return pontos.length;
    }

    /** Grade de paralelos e meridianos com rotulos em graus decimais. */
    function desenharGrade(ctx, visao, escala, cfg) {
        var lim = visao.limites();
        var amplitude = Math.max(Math.abs(lim.leste - lim.oeste), Math.abs(lim.norte - lim.sul));
        var passos = [10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05, 0.025, 0.01, 0.005, 0.002, 0.001];
        var passo = passos[passos.length - 1];
        for (var i = 0; i < passos.length; i++) {
            if (amplitude / passos[i] >= 3) { passo = passos[i]; break; }
        }
        var cor = (cfg && cfg.cor) || 'rgba(71,85,105,0.55)';
        var fonte = '600 ' + Math.round(11 * escala) + 'px Inter, Ubuntu, sans-serif';

        ctx.save();
        ctx.setLineDash([6 * escala, 5 * escala]);
        ctx.lineWidth = Math.max(0.6, 1 * escala);
        ctx.strokeStyle = cor;

        var casas = passo < 0.01 ? 3 : (passo < 0.1 ? 2 : (passo < 1 ? 2 : 1));

        for (var lat = Math.ceil(lim.sul / passo) * passo; lat <= lim.norte; lat += passo) {
            var y = visao.paraTela(lat, lim.oeste).y;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(visao.largura, y); ctx.stroke();
            ctx.setLineDash([]);
            ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            textoComHalo(ctx, lat.toFixed(casas) + '°', 6 * escala, y - 3 * escala, fonte, '#334155', Math.max(2, 3 * escala));
            ctx.setLineDash([6 * escala, 5 * escala]);
        }
        for (var lon = Math.ceil(lim.oeste / passo) * passo; lon <= lim.leste; lon += passo) {
            var x = visao.paraTela(lim.norte, lon).x;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, visao.altura); ctx.stroke();
            ctx.setLineDash([]);
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            textoComHalo(ctx, lon.toFixed(casas) + '°', x + 4 * escala, 6 * escala, fonte, '#334155', Math.max(2, 3 * escala));
            ctx.setLineDash([6 * escala, 5 * escala]);
        }
        ctx.restore();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    /** Credito do provedor de tiles e do projeto, no rodape da imagem. */
    function desenharCreditos(ctx, visao, escala, texto) {
        var fs = Math.max(8, Math.round(11 * escala));
        ctx.font = fs + 'px Inter, Ubuntu, sans-serif';
        var largura = ctx.measureText(texto).width + 12 * escala;
        var altura = fs + 8 * escala;
        var x = visao.largura - largura - 4 * escala;
        var y = visao.altura - altura - 4 * escala;
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.fillRect(x, y, largura, altura);
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(texto, x + 6 * escala, y + altura / 2);
        ctx.textBaseline = 'alphabetic';
    }

    // =====================================================================
    // 4. ELEMENTOS CARTOGRAFICOS
    //    Rotinas de desenho adaptadas do estudio de imagens do sistema
    //    "Adm de Cidades", ajustadas para a simbologia deste painel e para
    //    dimensionamento proporcional a resolucao de saida.
    // =====================================================================

    /** Compatibilidade com navegadores sem CanvasRenderingContext2D.roundRect. */
    function retanguloArredondado(ctx, x, y, w, h, r) {
        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
            return;
        }
        var raio = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + raio, y);
        ctx.lineTo(x + w - raio, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + raio);
        ctx.lineTo(x + w, y + h - raio);
        ctx.quadraticCurveTo(x + w, y + h, x + w - raio, y + h);
        ctx.lineTo(x + raio, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - raio);
        ctx.lineTo(x, y + raio);
        ctx.quadraticCurveTo(x, y, x + raio, y);
        ctx.closePath();
    }

    function quebrarTexto(ctx, texto, larguraMaxima) {
        var palavras = String(texto == null ? '' : texto).split(' ');
        var linhas = [];
        var atual = '';
        for (var i = 0; i < palavras.length; i++) {
            var teste = atual ? (atual + ' ' + palavras[i]) : palavras[i];
            if (ctx.measureText(teste).width <= larguraMaxima) {
                atual = teste;
            } else {
                if (atual) linhas.push(atual);
                atual = palavras[i];
            }
        }
        if (atual) linhas.push(atual);
        return linhas.length ? linhas : [''];
    }

    /** Rosa dos ventos. Estilos: 'noun', 'classic', 'minimal', 'compass'. */
    function desenharNorte(ctx, x, y, tamanho, cfg) {
        cfg = cfg || {};
        var estilo = cfg.tipo || 'noun';
        var comFundo = cfg.fundo !== false;
        var cor = cfg.cor || '#1e293b';
        var cx = x + tamanho / 2;
        var cy = y + tamanho / 2;
        var r = tamanho * 0.45;

        ctx.save();
        ctx.translate(cx, cy);

        if (comFundo) {
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = Math.max(1, tamanho * 0.015);
            ctx.stroke();
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = Math.max(2, tamanho * 0.04);
            ctx.shadowOffsetY = Math.max(1, tamanho * 0.02);
        }

        var e = tamanho / 200;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (estilo === 'noun') {
            ctx.fillStyle = cor; ctx.strokeStyle = cor;
            ctx.font = '800 ' + Math.round(tamanho * 0.22) + 'px Inter, Ubuntu, sans-serif';
            ctx.fillText('N', 0, -74 * e);

            ctx.lineWidth = Math.max(1.2, 2.2 * e);
            ctx.beginPath(); ctx.arc(0, 15 * e, 38 * e, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = Math.max(1, 1.4 * e);
            ctx.beginPath(); ctx.arc(0, 15 * e, 30 * e, 0, Math.PI * 2); ctx.stroke();

            ctx.lineWidth = Math.max(1, 2 * e);
            ctx.beginPath();
            ctx.moveTo(-55 * e, 15 * e); ctx.lineTo(55 * e, 15 * e);
            ctx.moveTo(0, 2 * e); ctx.lineTo(0, 75 * e);
            ctx.stroke();

            ctx.lineWidth = Math.max(1, 1.6 * e);
            ctx.beginPath();
            ctx.moveTo(-23 * e, -8 * e); ctx.lineTo(-38 * e, -23 * e);
            ctx.moveTo(23 * e, -8 * e); ctx.lineTo(38 * e, -23 * e);
            ctx.moveTo(-23 * e, 38 * e); ctx.lineTo(-38 * e, 53 * e);
            ctx.moveTo(23 * e, 38 * e); ctx.lineTo(38 * e, 53 * e);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -54 * e); ctx.lineTo(-24 * e, 15 * e); ctx.lineTo(0, 2 * e);
            ctx.closePath(); ctx.fillStyle = cor; ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, -54 * e); ctx.lineTo(24 * e, 15 * e); ctx.lineTo(0, 2 * e);
            ctx.closePath();
            ctx.fillStyle = comFundo ? '#ffffff' : 'rgba(255,255,255,0.75)';
            ctx.fill(); ctx.stroke();

        } else if (estilo === 'classic') {
            ctx.fillStyle = cor; ctx.strokeStyle = cor;
            ctx.lineWidth = Math.max(1.2, 2.2 * e);
            ctx.beginPath(); ctx.arc(0, 14 * e, 70 * e, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = Math.max(1, 1.2 * e);
            ctx.beginPath(); ctx.arc(0, 14 * e, 63 * e, 0, Math.PI * 2); ctx.stroke();

            [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].forEach(function (angulo) {
                var rad = angulo * Math.PI / 180;
                var principal = angulo % 90 === 0;
                var r1 = (principal ? 58 : 63) * e;
                var r2 = 70 * e;
                ctx.lineWidth = principal ? Math.max(1.5, 2.2 * e) : Math.max(1, 1 * e);
                ctx.beginPath();
                ctx.moveTo(Math.sin(rad) * r1, 14 * e - Math.cos(rad) * r1);
                ctx.lineTo(Math.sin(rad) * r2, 14 * e - Math.cos(rad) * r2);
                ctx.stroke();
            });

            ctx.beginPath(); ctx.moveTo(0, -54 * e); ctx.lineTo(-9 * e, 14 * e); ctx.lineTo(0, 6 * e); ctx.closePath();
            ctx.fillStyle = cor; ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, -54 * e); ctx.lineTo(9 * e, 14 * e); ctx.lineTo(0, 6 * e); ctx.closePath();
            ctx.fillStyle = comFundo ? '#cbd5e1' : 'rgba(255,255,255,0.75)'; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 82 * e); ctx.lineTo(-9 * e, 14 * e); ctx.lineTo(0, 22 * e); ctx.closePath();
            ctx.fillStyle = comFundo ? '#94a3b8' : 'rgba(255,255,255,0.4)'; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 82 * e); ctx.lineTo(9 * e, 14 * e); ctx.lineTo(0, 22 * e); ctx.closePath();
            ctx.fillStyle = cor; ctx.globalAlpha = 0.4; ctx.fill(); ctx.globalAlpha = 1;

            ctx.beginPath(); ctx.arc(0, 14 * e, 4.5 * e, 0, Math.PI * 2);
            ctx.fillStyle = cor; ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2 * e; ctx.stroke();

            ctx.beginPath(); ctx.arc(0, -84 * e, 13 * e, 0, Math.PI * 2);
            ctx.fillStyle = cor; ctx.fill();
            ctx.font = '900 ' + Math.round(18 * e) + 'px Inter, Ubuntu, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('N', 0, -83 * e);

        } else if (estilo === 'minimal') {
            ctx.fillStyle = cor; ctx.strokeStyle = cor;
            ctx.font = '800 ' + Math.round(tamanho * 0.18) + 'px Inter, Ubuntu, sans-serif';
            ctx.fillText('N', 0, -74 * e);
            ctx.lineWidth = Math.max(1.5, 2.2 * e);
            ctx.beginPath(); ctx.moveTo(0, -54 * e); ctx.lineTo(0, 75 * e); ctx.stroke();
            ctx.lineWidth = Math.max(1, 1.6 * e);
            ctx.beginPath(); ctx.moveTo(-24 * e, 10 * e); ctx.lineTo(24 * e, 10 * e); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -54 * e); ctx.lineTo(-26 * e, 15 * e); ctx.lineTo(0, 0); ctx.closePath();
            ctx.fillStyle = cor; ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, -54 * e); ctx.lineTo(26 * e, 15 * e); ctx.lineTo(0, 0); ctx.closePath();
            ctx.fillStyle = comFundo ? '#ffffff' : 'rgba(255,255,255,0.85)'; ctx.fill(); ctx.stroke();

        } else if (estilo === 'compass') {
            ctx.fillStyle = cor; ctx.strokeStyle = cor;
            ctx.font = '900 ' + Math.round(tamanho * 0.18) + 'px Inter, Ubuntu, sans-serif';
            ctx.fillText('N', 0, -76 * e);
            ctx.beginPath(); ctx.moveTo(0, -58 * e); ctx.lineTo(0, 12 * e); ctx.lineTo(-16 * e, 12 * e); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, -58 * e); ctx.lineTo(0, 12 * e); ctx.lineTo(16 * e, 12 * e); ctx.closePath();
            ctx.fillStyle = comFundo ? '#ffffff' : 'rgba(255,255,255,0.85)'; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 82 * e); ctx.lineTo(0, 12 * e); ctx.lineTo(-16 * e, 12 * e); ctx.closePath();
            ctx.fillStyle = comFundo ? '#94a3b8' : 'rgba(255,255,255,0.5)'; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 82 * e); ctx.lineTo(0, 12 * e); ctx.lineTo(16 * e, 12 * e); ctx.closePath();
            ctx.fillStyle = cor; ctx.fill();
            ctx.beginPath(); ctx.moveTo(70 * e, 12 * e); ctx.lineTo(0, 12 * e); ctx.lineTo(0, -4 * e); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(70 * e, 12 * e); ctx.lineTo(0, 12 * e); ctx.lineTo(0, 28 * e); ctx.closePath();
            ctx.fillStyle = comFundo ? '#ffffff' : 'rgba(255,255,255,0.85)'; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-70 * e, 12 * e); ctx.lineTo(0, 12 * e); ctx.lineTo(0, -4 * e); ctx.closePath();
            ctx.fillStyle = comFundo ? '#ffffff' : 'rgba(255,255,255,0.85)'; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-70 * e, 12 * e); ctx.lineTo(0, 12 * e); ctx.lineTo(0, 28 * e); ctx.closePath();
            ctx.fillStyle = cor; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 12 * e, 7 * e, 0, Math.PI * 2);
            ctx.fillStyle = cor; ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8 * e; ctx.stroke();
        }

        ctx.restore();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    /** Escala grafica em barra alternada, calculada para a latitude do centro. */
    function desenharEscalaGrafica(ctx, x, y, w, h, zoom, lat) {
        var DEGRAUS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000,
                       10000, 20000, 50000, 100000, 200000, 500000, 1000000];
        var SEGMENTOS = 5;
        var metrosPorPixel = 78271.5168 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
        var alvo = w * 0.85;
        var melhor = DEGRAUS[0];
        for (var i = 0; i < DEGRAUS.length; i++) {
            melhor = DEGRAUS[i];
            if (DEGRAUS[i] / metrosPorPixel >= alvo * 0.75) break;
        }

        var barraW = w * 0.85;
        var segW = barraW / SEGMENTOS;
        var barraH = h * 0.2;
        var unidade = melhor >= 1000 ? 'km' : 'm';
        var pad = w * 0.075;

        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1;
        retanguloArredondado(ctx, x, y, w, h, h * 0.09);
        ctx.fill();
        ctx.stroke();

        var bX = x + pad, bY = y + h * 0.5;
        ctx.font = Math.max(8, Math.round(h * 0.16)) + 'px Inter, Ubuntu, sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (var s = 0; s <= SEGMENTOS; s++) {
            var distancia = (melhor / SEGMENTOS) * s;
            var valor = unidade === 'km' ? distancia / 1000 : distancia;
            var rotulo = Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
            ctx.fillText(s === SEGMENTOS ? (rotulo + ' ' + unidade) : rotulo, bX + segW * s, bY - 3);
        }
        for (var b = 0; b < SEGMENTOS; b++) {
            ctx.fillStyle = b % 2 === 0 ? '#1e293b' : '#ffffff';
            ctx.fillRect(bX + segW * b, bY, segW, barraH);
        }
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(bX, bY, barraW, barraH);
        ctx.font = 'italic ' + Math.max(7, Math.round(h * 0.13)) + 'px Inter, Ubuntu, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('Projeção: Web Mercator (EPSG:3857) • WGS 84', x + w / 2, bY + barraH + h * 0.2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    /**
     * Legenda de simbologia. Aceita itens com forma 'quadrado', 'circulo',
     * 'distintivo', 'pino' ou 'rampa' (faixa continua de cores).
     */
    function desenharLegenda(ctx, x, y, w, titulo, itens) {
        var p = w * 0.06;
        var amostra = w * 0.075;
        var fsTitulo = Math.max(8, Math.round(w * 0.07));
        var fsItem = Math.max(7, Math.round(w * 0.06));
        var alturaLinha = fsTitulo * 1.25;
        var larguraTexto = w - p * 2;

        ctx.font = 'bold ' + fsTitulo + 'px Inter, Ubuntu, sans-serif';
        var linhasTitulo = quebrarTexto(ctx, titulo, larguraTexto);
        var blocoTitulo = linhasTitulo.length * alturaLinha + p * 0.5;

        var alturaItemLinha = fsItem * 1.25;
        var textoX = p + amostra + p * 0.5;
        var textoMaxW = larguraTexto - amostra - p * 0.5;
        ctx.font = fsItem + 'px Inter, Ubuntu, sans-serif';

        var quebras = itens.map(function (it) {
            if (it.forma === 'rampa') return it.rotulo ? quebrarTexto(ctx, it.rotulo, larguraTexto) : [];
            return quebrarTexto(ctx, it.rotulo || '', textoMaxW);
        });
        var alturas = itens.map(function (it, i) {
            if (it.forma === 'rampa') {
                return quebras[i].length * alturaItemLinha + amostra * 1.75 + p * 0.6;
            }
            return Math.max(amostra, quebras[i].length * alturaItemLinha) + p * 0.35;
        });

        var divisoriaY = blocoTitulo + p;
        var total = divisoriaY + p * 0.5 + alturas.reduce(function (a, b) { return a + b; }, 0) + p;

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 1;
        retanguloArredondado(ctx, x, y, w, total, w * 0.02);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold ' + fsTitulo + 'px Inter, Ubuntu, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        linhasTitulo.forEach(function (linha, i) {
            ctx.fillText(linha, x + p, y + p + i * alturaLinha);
        });

        ctx.strokeStyle = '#0072CE';
        ctx.lineWidth = Math.max(1, w * 0.006);
        ctx.beginPath();
        ctx.moveTo(x + p, y + divisoriaY);
        ctx.lineTo(x + w - p, y + divisoriaY);
        ctx.stroke();

        var cursorY = y + divisoriaY + p * 0.5;
        itens.forEach(function (it, i) {
            var topoItem = cursorY;
            if (it.forma === 'rampa') {
                var faixaH = amostra * 0.85;
                var faixaW = w - p * 2;
                if (quebras[i].length) {
                    ctx.font = fsItem + 'px Inter, Ubuntu, sans-serif';
                    ctx.fillStyle = '#1e293b';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    quebras[i].forEach(function (linha, li) {
                        ctx.fillText(linha, x + p, cursorY + li * alturaItemLinha);
                    });
                    cursorY += quebras[i].length * alturaItemLinha + p * 0.25;
                }
                var grad = ctx.createLinearGradient(x + p, 0, x + p + faixaW, 0);
                (it.cores || []).forEach(function (c, idx, arr) {
                    grad.addColorStop(arr.length === 1 ? 0 : idx / (arr.length - 1), c);
                });
                ctx.fillStyle = grad;
                ctx.fillRect(x + p, cursorY, faixaW, faixaH);
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + p, cursorY, faixaW, faixaH);
                ctx.font = Math.max(6, fsItem * 0.85) + 'px Inter, Ubuntu, sans-serif';
                ctx.fillStyle = '#475569';
                ctx.textBaseline = 'top';
                var marcas = it.marcas || [];
                marcas.forEach(function (m, mi) {
                    ctx.textAlign = mi === 0 ? 'left' : (mi === marcas.length - 1 ? 'right' : 'center');
                    var mx = x + p + (faixaW * (marcas.length === 1 ? 0 : mi / (marcas.length - 1)));
                    ctx.fillText(m, mx, cursorY + faixaH + p * 0.2);
                });
                ctx.textAlign = 'left';
                cursorY = topoItem + alturas[i];
                return;
            }

            var topo = cursorY;
            var cx = x + p + amostra / 2;
            var cy = topo + amostra / 2;
            ctx.lineWidth = Math.max(1, w * 0.005);

            if (it.forma === 'circulo' || it.forma === 'distintivo') {
                ctx.beginPath();
                ctx.arc(cx, cy, amostra / 2, 0, Math.PI * 2);
                ctx.fillStyle = it.cor || '#ccc';
                ctx.fill();
                ctx.strokeStyle = it.borda || 'rgba(0,0,0,0.15)';
                ctx.stroke();
                if (it.forma === 'distintivo') {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '700 ' + Math.round(amostra * 0.6) + 'px Inter, Ubuntu, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(it.simbolo || '#', cx, cy + amostra * 0.03);
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                }
            } else if (it.forma === 'pino') {
                var r = amostra * 0.38;
                var base = topo + amostra;
                var pcy = base - amostra + r * 1.1;
                ctx.beginPath();
                ctx.arc(cx, pcy, r, Math.PI * 0.85, Math.PI * 0.15);
                ctx.lineTo(cx, base);
                ctx.closePath();
                ctx.fillStyle = it.cor || '#16a34a';
                ctx.fill();
                ctx.strokeStyle = it.borda || '#ffffff';
                ctx.stroke();
            } else {
                ctx.fillStyle = it.cor || '#ccc';
                ctx.fillRect(x + p, topo, amostra, amostra);
                ctx.strokeStyle = it.borda || 'rgba(0,0,0,0.15)';
                ctx.strokeRect(x + p, topo, amostra, amostra);
            }

            ctx.fillStyle = '#1e293b';
            ctx.font = fsItem + 'px Inter, Ubuntu, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            quebras[i].forEach(function (linha, li) {
                ctx.fillText(linha, x + textoX, topo + li * alturaItemLinha);
            });
            cursorY += alturas[i];
        });

        ctx.textBaseline = 'alphabetic';
        return total;
    }

    /**
     * Legenda dos pontos nodais de afericao: numero, nome, coordenadas e
     * justificativa tecnica registrada no painel.
     */
    function desenharLegendaPontos(ctx, x, y, w, pontos, titulo, opcoes) {
        opcoes = opcoes || {};
        var p = w * 0.05;
        var fsTitulo = Math.max(8, Math.round(w * 0.062));
        var fsItem = Math.max(7, Math.round(w * 0.05));
        var fsNota = Math.max(6, Math.round(w * 0.044));
        var alturaLinha = fsTitulo * 1.25;
        var larguraTexto = w - p * 2;
        var distintivo = w * 0.055;
        var textoX = p + distintivo + p * 0.6;
        var textoMaxW = larguraTexto - distintivo - p * 0.6;

        ctx.font = 'bold ' + fsTitulo + 'px Inter, Ubuntu, sans-serif';
        var linhasTitulo = quebrarTexto(ctx, titulo || 'Pontos Nodais de Aferição', larguraTexto);
        var divisoriaY = linhasTitulo.length * alturaLinha + p * 1.5;

        var blocos = pontos.map(function (pt, i) {
            var linhas = [];
            ctx.font = '600 ' + fsItem + 'px Inter, Ubuntu, sans-serif';
            quebrarTexto(ctx, pt.name || ('Ponto ' + (i + 1)), textoMaxW).forEach(function (l) {
                linhas.push({ texto: l, fonte: '600 ' + fsItem + 'px Inter, Ubuntu, sans-serif', cor: '#0f172a', altura: fsItem * 1.28 });
            });
            if (opcoes.coordenadas !== false) {
                var coord = Number(pt.lat).toFixed(5) + ', ' + Number(pt.lon).toFixed(5);
                ctx.font = fsNota + 'px Inter, Ubuntu, sans-serif';
                linhas.push({ texto: coord, fonte: fsNota + 'px Inter, Ubuntu, sans-serif', cor: '#64748b', altura: fsNota * 1.3 });
            }
            if (opcoes.justificativas !== false && pt.notes) {
                ctx.font = fsNota + 'px Inter, Ubuntu, sans-serif';
                quebrarTexto(ctx, pt.notes, textoMaxW).forEach(function (l) {
                    linhas.push({ texto: l, fonte: fsNota + 'px Inter, Ubuntu, sans-serif', cor: '#475569', altura: fsNota * 1.3 });
                });
            }
            var altura = linhas.reduce(function (a, l) { return a + l.altura; }, 0);
            return { linhas: linhas, altura: Math.max(distintivo, altura) + p * 0.7 };
        });

        var total = divisoriaY + blocos.reduce(function (a, b) { return a + b.altura; }, 0) + p * 0.6;

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 1;
        retanguloArredondado(ctx, x, y, w, total, w * 0.02);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold ' + fsTitulo + 'px Inter, Ubuntu, sans-serif';
        ctx.fillStyle = '#14532d';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        linhasTitulo.forEach(function (linha, i) {
            ctx.fillText(linha, x + p, y + p + i * alturaLinha);
        });

        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = Math.max(1, w * 0.005);
        ctx.beginPath();
        ctx.moveTo(x + p, y + divisoriaY - p * 0.5);
        ctx.lineTo(x + w - p, y + divisoriaY - p * 0.5);
        ctx.stroke();

        var cursorY = y + divisoriaY;
        blocos.forEach(function (bloco, i) {
            ctx.beginPath();
            ctx.arc(x + p + distintivo / 2, cursorY + distintivo / 2, distintivo / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#16a34a';
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 ' + Math.round(distintivo * 0.62) + 'px Inter, Ubuntu, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), x + p + distintivo / 2, cursorY + distintivo / 2 + distintivo * 0.03);

            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            var ly = cursorY;
            bloco.linhas.forEach(function (linha) {
                ctx.font = linha.fonte;
                ctx.fillStyle = linha.cor;
                ctx.fillText(linha.texto, x + textoX, ly);
                ly += linha.altura;
            });
            cursorY += bloco.altura;
        });

        ctx.textBaseline = 'alphabetic';
        return total;
    }

    /** Bloco de titulo e subtitulo da prancha. */
    function desenharTitulo(ctx, x, y, cfg) {
        var fonte = cfg.fonte || 'Ubuntu, Inter, sans-serif';
        var ts = cfg.tamanhoTitulo || 32;
        var ss = cfg.tamanhoSubtitulo || 18;
        var pad = ts * 0.5;
        var espaco = ts * 0.2;

        ctx.font = ((cfg.estiloTitulo || '') + ' ' + (cfg.pesoTitulo || 'bold') + ' ' + ts + 'px ' + fonte).trim();
        var larguraTitulo = ctx.measureText(cfg.titulo || '').width;
        ctx.font = ((cfg.estiloSubtitulo || '') + ' ' + (cfg.pesoSubtitulo || 'normal') + ' ' + ss + 'px ' + fonte).trim();
        var larguraSubtitulo = cfg.subtitulo ? ctx.measureText(cfg.subtitulo).width : 0;

        var caixaW = Math.max(larguraTitulo, larguraSubtitulo) + pad * 2;
        var caixaH = pad + ts + (cfg.subtitulo ? espaco + ss : 0) + pad;

        if (cfg.fundo) {
            var hex = cfg.corFundo || '#0f172a';
            var r = parseInt(hex.slice(1, 3), 16);
            var g = parseInt(hex.slice(3, 5), 16);
            var b = parseInt(hex.slice(5, 7), 16);
            ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (cfg.opacidadeFundo == null ? 0.72 : cfg.opacidadeFundo) + ')';
            retanguloArredondado(ctx, x, y, caixaW, caixaH, ts * 0.2);
            ctx.fill();
        }

        var alinhamento = cfg.alinhamento || 'left';
        ctx.textAlign = alinhamento;
        var tx = alinhamento === 'center' ? x + caixaW / 2 : (alinhamento === 'right' ? x + caixaW - pad : x + pad);
        ctx.textBaseline = 'top';
        ctx.font = ((cfg.estiloTitulo || '') + ' ' + (cfg.pesoTitulo || 'bold') + ' ' + ts + 'px ' + fonte).trim();
        ctx.fillStyle = cfg.corTitulo || '#ffffff';
        ctx.fillText(cfg.titulo || '', tx, y + pad);
        if (cfg.subtitulo) {
            ctx.font = ((cfg.estiloSubtitulo || '') + ' ' + (cfg.pesoSubtitulo || 'normal') + ' ' + ss + 'px ' + fonte).trim();
            ctx.fillStyle = cfg.corSubtitulo || '#cbd5e1';
            ctx.fillText(cfg.subtitulo, tx, y + pad + ts + espaco);
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        return { largura: caixaW, altura: caixaH };
    }

    function temPreenchimento(el) {
        return el.comFundo !== false && !!el.corFundo && el.corFundo !== 'transparent';
    }

    /** Elementos livres da composicao: texto, retangulo, elipse e seta. */
    function desenharElementoLivre(ctx, W, H, el, escala) {
        if (!el || el.visivel === false) return;
        var x = el.x * W;
        var y = el.y * H;
        ctx.save();
        ctx.globalAlpha = el.opacidade == null ? 1 : el.opacidade;

        if (el.tipo === 'texto') {
            var tamanho = (el.tamanhoFonte || 16) * escala;
            ctx.font = ((el.estilo || '') + ' ' + (el.peso || 'normal') + ' ' + tamanho + 'px Inter, Ubuntu, sans-serif').trim();
            var pad = Math.round(tamanho * 0.5);
            var caixaW = (el.largura || 220) * escala;
            var maxTexto = Math.max(20, caixaW - pad * 2);
            var linhas = [];
            String(el.texto || 'Texto').split('\n').forEach(function (paragrafo) {
                if (!paragrafo) { linhas.push(''); return; }
                quebrarTexto(ctx, paragrafo, maxTexto).forEach(function (l) { linhas.push(l); });
            });
            var alturaLinha = Math.round(tamanho * 1.3);
            var caixaH = Math.max(Math.round(tamanho * 1.5 + pad * 2), linhas.length * alturaLinha + pad * 2);
            var raio = (el.raioBorda == null ? Math.round(tamanho * 0.25) : el.raioBorda * escala);

            if (temPreenchimento(el)) {
                ctx.fillStyle = el.corFundo;
                retanguloArredondado(ctx, x, y, caixaW, caixaH, raio);
                ctx.fill();
            }
            if (el.corBorda && el.corBorda !== 'transparent' && (el.espessura || 0) > 0) {
                ctx.strokeStyle = el.corBorda;
                ctx.lineWidth = el.espessura * escala;
                retanguloArredondado(ctx, x, y, caixaW, caixaH, raio);
                ctx.stroke();
            }
            ctx.fillStyle = el.cor || '#0f172a';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            linhas.forEach(function (linha, i) {
                ctx.fillText(linha, x + pad, y + pad + i * alturaLinha);
            });

        } else if (el.tipo === 'retangulo') {
            var rw = (el.largura || 180) * escala;
            var rh = (el.altura || 110) * escala;
            var rr = (el.raioBorda == null ? 6 : el.raioBorda) * escala;
            if (temPreenchimento(el)) {
                ctx.fillStyle = el.corFundo;
                retanguloArredondado(ctx, x, y, rw, rh, rr);
                ctx.fill();
            }
            if (el.corBorda && el.corBorda !== 'transparent' && (el.espessura || 0) > 0) {
                ctx.strokeStyle = el.corBorda;
                ctx.lineWidth = el.espessura * escala;
                retanguloArredondado(ctx, x, y, rw, rh, rr);
                ctx.stroke();
            }

        } else if (el.tipo === 'elipse') {
            var ew = (el.largura || 120) * escala / 2;
            var eh = (el.altura || 120) * escala / 2;
            ctx.beginPath();
            ctx.ellipse(x + ew, y + eh, Math.max(1, ew), Math.max(1, eh), 0, 0, Math.PI * 2);
            if (temPreenchimento(el)) { ctx.fillStyle = el.corFundo; ctx.fill(); }
            if (el.corBorda && el.corBorda !== 'transparent' && (el.espessura || 0) > 0) {
                ctx.strokeStyle = el.corBorda;
                ctx.lineWidth = el.espessura * escala;
                ctx.stroke();
            }

        } else if (el.tipo === 'seta') {
            var x2 = (el.x2 == null ? el.x + 0.12 : el.x2) * W;
            var y2 = (el.y2 == null ? el.y : el.y2) * H;
            var esp = (el.espessura || 3) * escala;
            ctx.strokeStyle = el.corBorda || '#dc2626';
            ctx.fillStyle = el.corBorda || '#dc2626';
            ctx.lineWidth = esp;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            var angulo = Math.atan2(y2 - y, x2 - x);
            var ponta = Math.max(12 * escala, esp * 4);
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - ponta * Math.cos(angulo - Math.PI / 6), y2 - ponta * Math.sin(angulo - Math.PI / 6));
            ctx.lineTo(x2 - ponta * Math.cos(angulo + Math.PI / 6), y2 - ponta * Math.sin(angulo + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
    }

    // =====================================================================
    // 5. ESTADO DA COMPOSICAO
    // =====================================================================

    var CHAVE_ARMAZENAMENTO = 'estudio_mapas_composicao';

    var PRESETS_RESOLUCAO = [
        { rotulo: 'HD', largura: 1920, altura: 1080 },
        { rotulo: '2K', largura: 2560, altura: 1440 },
        { rotulo: '4K', largura: 3840, altura: 2160 },
        { rotulo: 'A4 300dpi', largura: 3508, altura: 2480 },
        { rotulo: 'Quadrado', largura: 2048, altura: 2048 }
    ];

    function estadoPadrao() {
        return {
            cidade: '',
            largura: 2560,
            altura: 1440,
            formato: 'png',
            qualidade: 0.92,
            mapaBase: 'esri_streets',
            escalaElementos: 1,
            visao: null,
            camadas: {
                fluxo: true,
                sobreposicao: true,
                atrativos: true,
                centroide: true,
                pontos: true,
                rotulosAtrativos: false,
                rotulosPontos: true,
                grade: false,
                creditos: true,
                intensidadeFluxo: 0.25
            },
            filtros: { freqMinima: 0, categoria: 'all', limiteRank: 0 },
            elementos: { titulo: true, norte: true, escala: true, legenda: true, legendaPontos: true },
            posicoes: {
                titulo: { x: 0.025, y: 0.028 },
                norte: { x: 0.905, y: 0.035 },
                escala: { x: 0.025, y: 0.885 },
                legenda: { x: 0.795, y: 0.32 },
                legendaPontos: { x: 0.025, y: 0.32 }
            },
            titulo: {
                titulo: 'Pontos Nodais de Aferição',
                subtitulo: 'Projeto UNESCO UNES 2369/2025 • Itaipu Parquetec',
                tamanhoTitulo: 34,
                tamanhoSubtitulo: 17,
                corTitulo: '#ffffff',
                corSubtitulo: '#cbd5e1',
                fundo: true,
                corFundo: '#0f172a',
                opacidadeFundo: 0.72,
                alinhamento: 'left'
            },
            norte: { tipo: 'noun', cor: '#1e293b', fundo: true },
            legendaTitulo: 'Legenda do Mapa',
            legendaPontosTitulo: 'Pontos Nodais de Aferição',
            legendaPontosOpcoes: { coordenadas: true, justificativas: true },
            livres: [],
            ordem: ['titulo', 'norte', 'escala', 'legenda', 'legendaPontos']
        };
    }

    function clonar(obj) { return JSON.parse(JSON.stringify(obj)); }

    function mesclar(destino, origem) {
        if (!origem) return destino;
        Object.keys(origem).forEach(function (chave) {
            var valor = origem[chave];
            if (valor && typeof valor === 'object' && !Array.isArray(valor) &&
                destino[chave] && typeof destino[chave] === 'object' && !Array.isArray(destino[chave])) {
                mesclar(destino[chave], valor);
            } else {
                destino[chave] = valor;
            }
        });
        return destino;
    }

    // =====================================================================
    // 6. MONTAGEM DA LEGENDA A PARTIR DAS CAMADAS ATIVAS
    // =====================================================================

    function montarItensLegenda(cfg, dados) {
        var itens = [];
        if (cfg.camadas.pontos && dados.pontos.length) {
            itens.push({ forma: 'pino', cor: '#16a34a', borda: '#ffffff', rotulo: 'Ponto nodal de aferição selecionado' });
        }
        if (cfg.camadas.atrativos && dados.atrativos.length) {
            itens.push({ forma: 'distintivo', cor: '#0072CE', borda: '#00873E', simbolo: '#', rotulo: 'Atrativo turístico (numeração do Produto 4)' });
        }
        if (cfg.camadas.centroide && dados.centroide) {
            itens.push({ forma: 'circulo', cor: '#f59e0b', borda: '#b45309', rotulo: 'Centro geométrico dos CNPJs turísticos' });
        }
        if (cfg.camadas.sobreposicao && dados.clusters.length) {
            itens.push({ forma: 'circulo', cor: '#ef4444', borda: '#1e293b', rotulo: 'Trecho de sobreposição de rotas' });
            itens.push({
                forma: 'rampa',
                rotulo: 'Frequência de viagens (escala log1p)',
                cores: ['rgb(255,255,255)', 'rgb(255,215,175)', 'rgb(255,155,95)', 'rgb(255,55,35)', 'rgb(165,15,30)'],
                marcas: ['Baixa', 'Média', 'Alta', 'Máxima']
            });
        }
        if (cfg.camadas.fluxo && dados.rotas.length) {
            itens.push({
                forma: 'rampa',
                rotulo: 'Mancha de fluxo TomTom (densidade de rotas)',
                cores: ['rgb(0,0,255)', 'rgb(0,255,255)', 'rgb(0,255,0)', 'rgb(255,255,0)', 'rgb(255,0,0)'],
                marcas: ['Baixa', 'Média', 'Alta']
            });
        }
        return itens;
    }

    // =====================================================================
    // 7. RENDERIZACAO DA COMPOSICAO COMPLETA
    // =====================================================================

    /**
     * Desenha a composicao inteira (mapa base, camadas do estudo e
     * elementos cartograficos) no contexto informado. A mesma funcao gera a
     * previa e a imagem exportada, de modo que o que se ve e o que sai.
     */
    function renderizarComposicao(ctx, largura, altura, cfg, dados, opcoes) {
        opcoes = opcoes || {};
        // O zoom guardado no estado corresponde a resolucao de saida. Quando a
        // composicao e desenhada menor (previa), o zoom e reduzido na mesma
        // proporcao, de modo que a previa e a imagem exportada enquadrem
        // exatamente a mesma area e mantenham as mesmas proporcoes.
        var zoomEfetivo = cfg.visao.zoom + Math.log(largura / cfg.largura) / Math.LN2;
        var visao = criarVisao(cfg.visao, zoomEfetivo, largura, altura);
        var escala = (largura / 1600) * (cfg.escalaElementos || 1);
        var caixas = {};

        var modelo = opcoes.modeloTiles;
        var etapaBase = modelo
            ? desenharMapaBase(ctx, visao, modelo, opcoes.aoProgredir)
            : Promise.resolve(0);

        return etapaBase.then(function (falhas) {
            // --- Camadas tematicas do estudo ---
            if (cfg.camadas.fluxo) {
                desenharManchasFluxo(ctx, visao, dados.rotas, escala, cfg.camadas.intensidadeFluxo);
            }
            if (cfg.camadas.sobreposicao) {
                desenharSobreposicao(ctx, visao, dados.clusters, escala, cfg.filtros);
            }
            if (cfg.camadas.centroide) {
                desenharCentroide(ctx, visao, dados.centroide, escala);
            }
            if (cfg.camadas.atrativos) {
                desenharAtrativos(ctx, visao, dados.atrativos, escala, {
                    rotulos: cfg.camadas.rotulosAtrativos,
                    limiteRank: cfg.filtros.limiteRank
                });
            }
            if (cfg.camadas.pontos) {
                desenharPontosNodais(ctx, visao, dados.pontos, escala, { rotulos: cfg.camadas.rotulosPontos });
            }
            if (cfg.camadas.grade) {
                desenharGrade(ctx, visao, escala);
            }

            // --- Elementos cartograficos, na ordem da pilha ---
            var itensLegenda = montarItensLegenda(cfg, dados);
            var LARG_LEGENDA = 320 * escala;
            var LARG_PONTOS = 360 * escala;
            var TAM_NORTE = 130 * escala;
            var ESCALA_W = 420 * escala;
            var ESCALA_H = 84 * escala;

            (cfg.ordem || []).forEach(function (id) {
                if (id === 'titulo' && cfg.elementos.titulo) {
                    var t = clonar(cfg.titulo);
                    t.tamanhoTitulo = (cfg.titulo.tamanhoTitulo || 32) * escala;
                    t.tamanhoSubtitulo = (cfg.titulo.tamanhoSubtitulo || 18) * escala;
                    var dim = desenharTitulo(ctx, cfg.posicoes.titulo.x * largura, cfg.posicoes.titulo.y * altura, t);
                    caixas.titulo = { largura: dim.largura, altura: dim.altura };

                } else if (id === 'norte' && cfg.elementos.norte) {
                    desenharNorte(ctx, cfg.posicoes.norte.x * largura, cfg.posicoes.norte.y * altura, TAM_NORTE, cfg.norte);
                    caixas.norte = { largura: TAM_NORTE, altura: TAM_NORTE };

                } else if (id === 'escala' && cfg.elementos.escala) {
                    desenharEscalaGrafica(
                        ctx, cfg.posicoes.escala.x * largura, cfg.posicoes.escala.y * altura,
                        ESCALA_W, ESCALA_H, visao.zoom, cfg.visao.lat
                    );
                    caixas.escala = { largura: ESCALA_W, altura: ESCALA_H };

                } else if (id === 'legenda' && cfg.elementos.legenda && itensLegenda.length) {
                    var alturaLeg = desenharLegenda(
                        ctx, cfg.posicoes.legenda.x * largura, cfg.posicoes.legenda.y * altura,
                        LARG_LEGENDA, cfg.legendaTitulo, itensLegenda
                    );
                    caixas.legenda = { largura: LARG_LEGENDA, altura: alturaLeg };

                } else if (id === 'legendaPontos' && cfg.elementos.legendaPontos && dados.pontos.length) {
                    var alturaPts = desenharLegendaPontos(
                        ctx, cfg.posicoes.legendaPontos.x * largura, cfg.posicoes.legendaPontos.y * altura,
                        LARG_PONTOS, dados.pontos, cfg.legendaPontosTitulo, cfg.legendaPontosOpcoes
                    );
                    caixas.legendaPontos = { largura: LARG_PONTOS, altura: alturaPts };

                } else if (id.indexOf('livre-') === 0) {
                    var el = (cfg.livres || []).find(function (e) { return e.id === id; });
                    if (el) {
                        desenharElementoLivre(ctx, largura, altura, el, escala);
                        if (el.tipo === 'seta') {
                            caixas[id] = {
                                largura: Math.max(24, Math.abs((el.x2 == null ? el.x + 0.12 : el.x2) - el.x) * largura),
                                altura: Math.max(24, Math.abs((el.y2 == null ? el.y : el.y2) - el.y) * altura)
                            };
                        } else {
                            caixas[id] = {
                                largura: (el.largura || 180) * escala,
                                altura: (el.altura || (el.tipo === 'texto' ? 60 : 110)) * escala
                            };
                        }
                    }
                }
            });

            if (cfg.camadas.creditos) {
                desenharCreditos(ctx, visao, escala, opcoes.credito || 'Itaipu Parquetec • UNESCO UNES 2369/2025');
            }

            return { falhasTiles: falhas, caixas: caixas };
        });
    }

    // =====================================================================
    // 8. UTILITARIOS DE INTERFACE
    // =====================================================================

    function elemento(tag, classe, html) {
        var el = document.createElement(tag);
        if (classe) el.className = classe;
        if (html != null) el.innerHTML = html;
        return el;
    }

    function lerCaminho(obj, caminho) {
        var partes = caminho.split('.');
        var atual = obj;
        for (var i = 0; i < partes.length; i++) {
            if (atual == null) return undefined;
            atual = atual[partes[i]];
        }
        return atual;
    }

    function escreverCaminho(obj, caminho, valor) {
        var partes = caminho.split('.');
        var atual = obj;
        for (var i = 0; i < partes.length - 1; i++) {
            if (atual[partes[i]] == null) atual[partes[i]] = {};
            atual = atual[partes[i]];
        }
        atual[partes[partes.length - 1]] = valor;
    }

    function normalizarNome(texto) {
        return String(texto)
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function baixarBlob(blob, nome) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = nome;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }

    // =====================================================================
    // 9. ESTUDIO
    // =====================================================================

    var adaptador = null;
    var cfg = estadoPadrao();
    var raiz = null;
    var refs = {};
    var caixasAtuais = {};
    var elementoSelecionado = null;
    var arrastandoAlca = false;
    var tokenPrevia = 0;
    var temporizadorPrevia = null;

    var ROTULOS_ELEMENTOS = {
        titulo: 'Título',
        norte: 'Rosa dos ventos',
        escala: 'Escala gráfica',
        legenda: 'Legenda',
        legendaPontos: 'Legenda de pontos nodais'
    };

    /** Reune os dados do municipio selecionado, ja filtrados. */
    function coletarDados(chaveCidade) {
        var cidades = adaptador.getCidades() || {};
        var d = cidades[chaveCidade] || { atrativos: [], clusters: [], routes: [], centroid: null };
        var atrativos = (d.atrativos || []).filter(function (a) { return a.visible !== false; });
        if (cfg.filtros.limiteRank) {
            atrativos = atrativos.filter(function (a) { return (a.rank_num || 999) <= cfg.filtros.limiteRank; });
        }
        var pontos = (adaptador.getPontosSalvos(chaveCidade) || []).map(function (p) {
            return {
                name: p.name,
                notes: p.notes,
                lat: parseFloat(p.lat),
                lon: parseFloat(p.lon),
                timestamp: p.timestamp
            };
        }).filter(function (p) { return !isNaN(p.lat) && !isNaN(p.lon); });

        return {
            cidade: chaveCidade,
            atrativos: atrativos,
            clusters: d.clusters || [],
            rotas: d.routes || [],
            centroide: d.centroid || null,
            pontos: pontos
        };
    }

    /** Enquadramento automatico sobre todo o conteudo do municipio. */
    function enquadrarCidade(dados, largura, altura, apenasPontos) {
        var lista = [];
        if (apenasPontos) {
            lista = dados.pontos.map(function (p) { return { lat: p.lat, lon: p.lon }; });
        } else {
            dados.atrativos.forEach(function (a) { lista.push({ lat: a.lat, lon: a.lon }); });
            dados.clusters.forEach(function (c) { lista.push({ lat: c.lat, lon: c.lon }); });
            dados.pontos.forEach(function (p) { lista.push({ lat: p.lat, lon: p.lon }); });
            if (dados.centroide) lista.push({ lat: dados.centroide.lat, lon: dados.centroide.lon });
        }
        var lim = limitesDePontos(lista);
        if (!lim) return null;
        return {
            lat: (lim.norte + lim.sul) / 2,
            lon: (lim.leste + lim.oeste) / 2,
            zoom: zoomParaLimites(lim, largura, altura, 0.18)
        };
    }

    function definirStatus(texto, tipo) {
        if (!refs.status) return;
        refs.status.textContent = texto || '';
        refs.status.className = 'estudio-status' + (tipo ? ' ' + tipo : '');
    }

    function mostrarProgresso(ativo, texto, percentual) {
        if (!refs.progresso) return;
        refs.progresso.classList.toggle('ativo', !!ativo);
        if (texto != null) refs.progressoTexto.textContent = texto;
        if (percentual != null) refs.progressoBarra.style.width = Math.round(percentual) + '%';
    }

    // ---------------------------------------------------------------------
    // 9.1 Previa
    // ---------------------------------------------------------------------

    function dimensoesPrevia() {
        var area = refs.area;
        var disponivelL = Math.max(200, area.clientWidth - 36);
        var disponivelA = Math.max(150, area.clientHeight - 36);
        var proporcao = cfg.largura / cfg.altura;
        var l = disponivelL;
        var a = l / proporcao;
        if (a > disponivelA) { a = disponivelA; l = a * proporcao; }
        return { largura: Math.round(l), altura: Math.round(a) };
    }

    function agendarPrevia(atraso) {
        clearTimeout(temporizadorPrevia);
        temporizadorPrevia = setTimeout(atualizarPrevia, atraso == null ? 140 : atraso);
    }

    function atualizarPrevia() {
        if (!raiz || !raiz.classList.contains('aberto')) return;
        var dim = dimensoesPrevia();
        var canvas = refs.canvas;
        canvas.width = dim.largura;
        canvas.height = dim.altura;
        refs.quadro.style.width = dim.largura + 'px';
        refs.quadro.style.height = dim.altura + 'px';

        var ctx = canvas.getContext('2d');
        var dados = coletarDados(cfg.cidade);
        var meu = ++tokenPrevia;
        if (refs.zoomInfo) refs.zoomInfo.textContent = 'z ' + cfg.visao.zoom.toFixed(2);
        definirStatus('Carregando mosaico do mapa base...');

        renderizarComposicao(ctx, dim.largura, dim.altura, cfg, dados, {
            modeloTiles: adaptador.getProvedores()[cfg.mapaBase],
            credito: creditoAtual()
        }).then(function (resultado) {
            if (meu !== tokenPrevia) return;
            caixasAtuais = resultado.caixas;
            desenharAlcas();
            atualizarIndicadores(dados);
            if (resultado.falhasTiles > 0) {
                definirStatus(resultado.falhasTiles + ' tile(s) do mapa base não carregaram — verifique a conexão ou troque o provedor.', 'erro');
            } else {
                definirStatus('Prévia atualizada • ' + cfg.largura + ' × ' + cfg.altura + ' px', 'ok');
            }
        }).catch(function (erro) {
            if (meu !== tokenPrevia) return;
            definirStatus('Erro ao gerar a prévia: ' + erro.message, 'erro');
        });
    }

    function creditoAtual() {
        var atrib = adaptador.getAtribuicoes()[cfg.mapaBase] || '';
        var limpo = atrib.replace(/<[^>]*>/g, '').replace(/&copy;/g, '©').replace(/&mdash;/g, '—').trim();
        return (limpo ? limpo + ' • ' : '') + 'Itaipu Parquetec • UNESCO UNES 2369/2025';
    }

    function atualizarIndicadores(dados) {
        if (!refs.indicadores) return;
        refs.indicadores.innerHTML =
            '<span class="estudio-badge-info">' + dados.atrativos.length + ' atrativos</span> ' +
            '<span class="estudio-badge-info">' + dados.clusters.length + ' sobreposições</span> ' +
            '<span class="estudio-badge-info">' + dados.rotas.length + ' pontos de rota</span> ' +
            '<span class="estudio-badge-info">' + dados.pontos.length + ' pontos nodais</span>';
    }

    // ---------------------------------------------------------------------
    // 9.2 Alcas de posicionamento dos elementos
    // ---------------------------------------------------------------------

    function idsElementosVisiveis() {
        var ids = [];
        (cfg.ordem || []).forEach(function (id) {
            if (caixasAtuais[id]) ids.push(id);
        });
        return ids;
    }

    function atualizarSelecaoVisual() {
        refs.alcas.querySelectorAll('.estudio-alca').forEach(function (el) {
            el.classList.toggle('selecionada', el.getAttribute('data-alca') === elementoSelecionado);
        });
    }

    function desenharAlcas() {
        // Durante o arraste as alcas nao sao reconstruidas: a alca em uso e
        // reposicionada diretamente, evitando que o no seja descartado no meio
        // da interacao.
        if (arrastandoAlca) return;
        var camada = refs.alcas;
        camada.innerHTML = '';
        var dim = { largura: refs.canvas.width, altura: refs.canvas.height };

        idsElementosVisiveis().forEach(function (id) {
            var caixa = caixasAtuais[id];
            var pos = posicaoDe(id);
            if (!pos) return;
            var alca = elemento('div', 'estudio-alca');
            alca.setAttribute('data-alca', id);
            if (elementoSelecionado === id) alca.classList.add('selecionada');
            alca.style.left = (pos.x * dim.largura) + 'px';
            alca.style.top = (pos.y * dim.altura) + 'px';
            alca.style.width = caixa.largura + 'px';
            alca.style.height = caixa.altura + 'px';
            alca.appendChild(elemento('span', 'etiqueta', rotuloElemento(id)));
            ligarArrasteAlca(alca, id, dim);
            camada.appendChild(alca);
        });
    }

    function rotuloElemento(id) {
        if (ROTULOS_ELEMENTOS[id]) return ROTULOS_ELEMENTOS[id];
        var el = (cfg.livres || []).find(function (e) { return e.id === id; });
        if (!el) return id;
        return el.tipo === 'texto' ? ('Texto: ' + String(el.texto || '').slice(0, 18)) : ('Forma: ' + el.tipo);
    }

    function posicaoDe(id) {
        if (cfg.posicoes[id]) return cfg.posicoes[id];
        var el = (cfg.livres || []).find(function (e) { return e.id === id; });
        return el ? { x: el.x, y: el.y } : null;
    }

    function definirPosicao(id, x, y) {
        if (cfg.posicoes[id]) {
            cfg.posicoes[id].x = x;
            cfg.posicoes[id].y = y;
            return;
        }
        var el = (cfg.livres || []).find(function (e) { return e.id === id; });
        if (el) {
            if (el.tipo === 'seta' && el.x2 != null) {
                el.x2 += x - el.x;
                el.y2 += y - el.y;
            }
            el.x = x;
            el.y = y;
        }
    }

    function ligarArrasteAlca(alca, id, dim) {
        alca.addEventListener('pointerdown', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            elementoSelecionado = id;
            atualizarSelecaoVisual();
            renderizarListaLivres();

            var pos = posicaoDe(id);
            if (!pos) return;
            var inicioX = ev.clientX, inicioY = ev.clientY;
            var baseX = pos.x, baseY = pos.y;
            arrastandoAlca = true;

            function mover(e) {
                var dx = (e.clientX - inicioX) / dim.largura;
                var dy = (e.clientY - inicioY) / dim.altura;
                var novoX = Math.max(-0.05, Math.min(1.02, baseX + dx));
                var novoY = Math.max(-0.05, Math.min(1.02, baseY + dy));
                definirPosicao(id, novoX, novoY);
                alca.style.left = (novoX * dim.largura) + 'px';
                alca.style.top = (novoY * dim.altura) + 'px';
                agendarPrevia(40);
            }
            function soltar() {
                window.removeEventListener('pointermove', mover);
                window.removeEventListener('pointerup', soltar);
                arrastandoAlca = false;
                agendarPrevia(10);
            }
            window.addEventListener('pointermove', mover);
            window.addEventListener('pointerup', soltar);
        });
    }

    function selecionarElemento(id) {
        elementoSelecionado = id;
        desenharAlcas();
        renderizarListaLivres();
    }

    // ---------------------------------------------------------------------
    // 9.3 Navegacao do mapa na previa
    // ---------------------------------------------------------------------

    function ligarNavegacaoMapa() {
        var quadro = refs.quadro;

        quadro.addEventListener('pointerdown', function (ev) {
            if (ev.target !== refs.canvas) return;
            ev.preventDefault();
            quadro.classList.add('arrastando');
            var dim = { largura: refs.canvas.width, altura: refs.canvas.height };
            var zoomPrevia = cfg.visao.zoom + Math.log(dim.largura / cfg.largura) / Math.LN2;
            var centroPx = projetar(cfg.visao.lat, cfg.visao.lon, zoomPrevia);
            var inicioX = ev.clientX, inicioY = ev.clientY;

            function mover(e) {
                var novo = desprojetar(
                    centroPx.x - (e.clientX - inicioX),
                    centroPx.y - (e.clientY - inicioY),
                    zoomPrevia
                );
                cfg.visao.lat = novo.lat;
                cfg.visao.lon = novo.lon;
                agendarPrevia(60);
            }
            function soltar() {
                quadro.classList.remove('arrastando');
                window.removeEventListener('pointermove', mover);
                window.removeEventListener('pointerup', soltar);
                agendarPrevia(10);
            }
            window.addEventListener('pointermove', mover);
            window.addEventListener('pointerup', soltar);
        });

        quadro.addEventListener('wheel', function (ev) {
            ev.preventDefault();
            var dim = { largura: refs.canvas.width, altura: refs.canvas.height };
            var retangulo = refs.canvas.getBoundingClientRect();
            var px = ev.clientX - retangulo.left;
            var py = ev.clientY - retangulo.top;
            var passo = ev.deltaY < 0 ? 0.35 : -0.35;
            aplicarZoom(passo, px, py, dim);
        }, { passive: false });
    }

    /** Zoom mantendo fixo o ponto geografico sob o cursor. */
    function aplicarZoom(delta, px, py, dim) {
        dim = dim || { largura: refs.canvas.width, altura: refs.canvas.height };
        if (px == null) { px = dim.largura / 2; py = dim.altura / 2; }
        var zoomPrevia = cfg.visao.zoom + Math.log(dim.largura / cfg.largura) / Math.LN2;
        var visaoAtual = criarVisao(cfg.visao, zoomPrevia, dim.largura, dim.altura);
        var alvo = visaoAtual.paraGeo(px, py);

        var novoZoom = Math.max(2, Math.min(ZOOM_MAXIMO_TILE + 2, cfg.visao.zoom + delta));
        cfg.visao.zoom = novoZoom;
        var novoZoomPrevia = novoZoom + Math.log(dim.largura / cfg.largura) / Math.LN2;

        // Recoloca o ponto alvo sob o cursor ajustando o centro.
        var pAlvo = projetar(alvo.lat, alvo.lon, novoZoomPrevia);
        var centroPx = { x: pAlvo.x + (dim.largura / 2 - px), y: pAlvo.y + (dim.altura / 2 - py) };
        var novoCentro = desprojetar(centroPx.x, centroPx.y, novoZoomPrevia);
        cfg.visao.lat = novoCentro.lat;
        cfg.visao.lon = novoCentro.lon;
        agendarPrevia(60);
    }

    // ---------------------------------------------------------------------
    // 9.4 Construcao da interface
    // ---------------------------------------------------------------------

    function secao(id, titulo, conteudoHtml, aberta) {
        return '' +
            '<div class="estudio-secao' + (aberta ? ' aberta' : '') + '" data-secao="' + id + '">' +
                '<div class="estudio-secao-cabecalho">' +
                    '<span>' + titulo + '</span>' +
                    '<i class="fa-solid fa-chevron-right chevron"></i>' +
                '</div>' +
                '<div class="estudio-secao-conteudo">' + conteudoHtml + '</div>' +
            '</div>';
    }

    function check(caminho, rotulo) {
        return '<label class="estudio-check"><input type="checkbox" data-estado="' + caminho + '"> ' + rotulo + '</label>';
    }

    function campoTexto(caminho, rotulo, placeholder) {
        return '<div class="estudio-campo"><label class="estudio-rotulo">' + rotulo + '</label>' +
            '<input type="text" class="estudio-input" data-estado="' + caminho + '" placeholder="' + (placeholder || '') + '"></div>';
    }

    function campoNumero(caminho, rotulo, min, max, passo) {
        return '<div class="estudio-campo"><label class="estudio-rotulo">' + rotulo + '</label>' +
            '<input type="number" class="estudio-input" data-estado="' + caminho + '" data-tipo="numero" min="' + min + '" max="' + max + '" step="' + (passo || 1) + '"></div>';
    }

    function campoCor(caminho, rotulo) {
        return '<div class="estudio-campo" style="flex:1"><label class="estudio-rotulo">' + rotulo + '</label>' +
            '<input type="color" class="estudio-input" data-estado="' + caminho + '"></div>';
    }

    function campoSelect(caminho, rotulo, opcoes, tipo) {
        var html = '<div class="estudio-campo"><label class="estudio-rotulo">' + rotulo + '</label>' +
            '<select class="estudio-select" data-estado="' + caminho + '"' + (tipo ? ' data-tipo="' + tipo + '"' : '') + '>';
        opcoes.forEach(function (o) {
            html += '<option value="' + o.valor + '">' + o.rotulo + '</option>';
        });
        return html + '</select></div>';
    }

    function campoFaixa(caminho, rotulo, min, max, passo) {
        return '<div class="estudio-campo"><label class="estudio-rotulo">' + rotulo +
            ' <span class="estudio-badge-info" data-eco="' + caminho + '"></span></label>' +
            '<input type="range" class="estudio-input" data-estado="' + caminho + '" data-tipo="numero" min="' + min + '" max="' + max + '" step="' + passo + '"></div>';
    }

    function montarLateralEsquerda() {
        var presets = '<div class="estudio-presets">';
        PRESETS_RESOLUCAO.forEach(function (p, i) {
            presets += '<button class="estudio-preset" data-preset="' + i + '">' + p.rotulo + '</button>';
        });
        presets += '</div>';

        var saida = presets +
            '<div class="estudio-linha" style="margin-top:8px;">' +
                '<div style="flex:1">' + campoNumero('largura', 'Largura (px)', 400, 8000, 10) + '</div>' +
                '<div style="flex:1">' + campoNumero('altura', 'Altura (px)', 300, 8000, 10) + '</div>' +
            '</div>' +
            '<button class="estudio-btn mini" id="estudioInverter" style="width:100%"><i class="fa-solid fa-rotate"></i> Inverter orientação</button>' +
            campoFaixa('escalaElementos', 'Escala dos elementos', 0.5, 2.5, 0.05) +
            '<div class="estudio-dica">Os elementos cartográficos são dimensionados em proporção à resolução escolhida: a prévia mostra exatamente o que será exportado.</div>';

        var formato =
            campoSelect('formato', 'Formato do arquivo', [
                { valor: 'png', rotulo: 'PNG (sem perdas, recomendado)' },
                { valor: 'jpeg', rotulo: 'JPEG (arquivo menor)' }
            ]) +
            campoFaixa('qualidade', 'Qualidade JPEG', 0.5, 1, 0.01);

        var opcoesBase = Object.keys(adaptador.getProvedores()).map(function (chave) {
            return { valor: chave, rotulo: adaptador.getRotulosProvedores ? (adaptador.getRotulosProvedores()[chave] || chave) : chave };
        });

        var base = campoSelect('mapaBase', 'Provedor do mapa base', opcoesBase) +
            check('camadas.grade', 'Grade de paralelos e meridianos') +
            check('camadas.creditos', 'Créditos do provedor e do projeto') +
            '<div class="estudio-dica">O mosaico é montado diretamente em canvas, o que permite exportar o mapa base na resolução completa.</div>';

        var camadas =
            check('camadas.fluxo', 'Manchas de fluxo (TomTom)') +
            check('camadas.sobreposicao', 'Trechos de sobreposição de rotas') +
            check('camadas.atrativos', 'Atrativos turísticos') +
            check('camadas.centroide', 'Centro geométrico dos CNPJs') +
            check('camadas.pontos', 'Pontos nodais de aferição') +
            '<hr style="border-color:#334155; margin:8px 0;">' +
            check('camadas.rotulosAtrativos', 'Rótulos com o nome dos atrativos') +
            check('camadas.rotulosPontos', 'Rótulos com o nome dos pontos nodais') +
            campoFaixa('camadas.intensidadeFluxo', 'Intensidade das manchas de fluxo', 0.05, 1, 0.05);

        var filtros =
            campoSelect('filtros.limiteRank', 'Ranking Produto 4', [
                { valor: '0', rotulo: 'Todos os atrativos' },
                { valor: '1', rotulo: 'Apenas rank #1' },
                { valor: '3', rotulo: 'Top 3 ranks' },
                { valor: '5', rotulo: 'Top 5 ranks' }
            ], 'numero') +
            campoSelect('filtros.categoria', 'Relevância das rotas', [
                { valor: 'all', rotulo: 'Todos os níveis' },
                { valor: 'midhigh', rotulo: 'Média e alta relevância' },
                { valor: 'high', rotulo: 'Alta e máxima relevância' }
            ]) +
            campoNumero('filtros.freqMinima', 'Frequência mínima de rotas', 0, 100000, 1) +
            '<button class="estudio-btn mini" id="estudioImportarFiltros" style="width:100%; margin-top:4px;">' +
                '<i class="fa-solid fa-filter"></i> Copiar filtros do painel</button>';

        return secao('saida', '1. Resolução de saída', saida, true) +
               secao('formato', '2. Formato', formato, false) +
               secao('base', '3. Mapa base', base, true) +
               secao('camadas', '4. Camadas do estudo', camadas, true) +
               secao('filtros', '5. Filtros temáticos', filtros, false);
    }

    function montarLateralDireita() {
        var elementos =
            check('elementos.titulo', 'Título e subtítulo') +
            check('elementos.norte', 'Rosa dos ventos') +
            check('elementos.escala', 'Escala gráfica') +
            check('elementos.legenda', 'Legenda de simbologia') +
            check('elementos.legendaPontos', 'Legenda de pontos nodais') +
            '<div class="estudio-dica">Arraste os elementos diretamente sobre a prévia para posicioná-los.</div>' +
            '<button class="estudio-btn mini" id="estudioReposicionar" style="width:100%; margin-top:6px;">' +
                '<i class="fa-solid fa-table-cells"></i> Restaurar posições padrão</button>';

        var titulo =
            campoTexto('titulo.titulo', 'Título', 'Título do mapa') +
            campoTexto('titulo.subtitulo', 'Subtítulo', 'Subtítulo') +
            '<div class="estudio-linha">' +
                '<div style="flex:1">' + campoNumero('titulo.tamanhoTitulo', 'Corpo do título', 10, 120, 1) + '</div>' +
                '<div style="flex:1">' + campoNumero('titulo.tamanhoSubtitulo', 'Corpo do subtítulo', 8, 90, 1) + '</div>' +
            '</div>' +
            '<div class="estudio-linha">' + campoCor('titulo.corTitulo', 'Cor do título') + campoCor('titulo.corSubtitulo', 'Cor do subtítulo') + '</div>' +
            check('titulo.fundo', 'Caixa de fundo') +
            '<div class="estudio-linha">' + campoCor('titulo.corFundo', 'Cor do fundo') + '</div>' +
            campoFaixa('titulo.opacidadeFundo', 'Opacidade do fundo', 0, 1, 0.05) +
            campoSelect('titulo.alinhamento', 'Alinhamento', [
                { valor: 'left', rotulo: 'À esquerda' },
                { valor: 'center', rotulo: 'Centralizado' },
                { valor: 'right', rotulo: 'À direita' }
            ]);

        var norte =
            campoSelect('norte.tipo', 'Estilo', [
                { valor: 'noun', rotulo: 'Técnica (padrão)' },
                { valor: 'classic', rotulo: 'Clássica (rosa completa)' },
                { valor: 'minimal', rotulo: 'Minimalista' },
                { valor: 'compass', rotulo: 'Bússola (4 pontas)' }
            ]) +
            '<div class="estudio-linha">' + campoCor('norte.cor', 'Cor') + '</div>' +
            check('norte.fundo', 'Disco de fundo branco');

        var legendas =
            campoTexto('legendaTitulo', 'Título da legenda de simbologia', 'Legenda do Mapa') +
            campoTexto('legendaPontosTitulo', 'Título da legenda de pontos', 'Pontos Nodais de Aferição') +
            check('legendaPontosOpcoes.coordenadas', 'Exibir coordenadas dos pontos') +
            check('legendaPontosOpcoes.justificativas', 'Exibir justificativas técnicas');

        var livres =
            '<div class="estudio-presets" style="margin-bottom:8px;">' +
                '<button class="estudio-preset" data-novo="texto"><i class="fa-solid fa-font"></i> Texto</button>' +
                '<button class="estudio-preset" data-novo="retangulo"><i class="fa-regular fa-square"></i> Retângulo</button>' +
                '<button class="estudio-preset" data-novo="elipse"><i class="fa-regular fa-circle"></i> Elipse</button>' +
                '<button class="estudio-preset" data-novo="seta"><i class="fa-solid fa-arrow-right-long"></i> Seta</button>' +
            '</div>' +
            '<div class="estudio-lista-elementos" id="estudioListaLivres"></div>' +
            '<div id="estudioPropsLivre" style="margin-top:8px;"></div>';

        var composicao =
            '<button class="estudio-btn mini" id="estudioSalvarLayout" style="width:100%; margin-bottom:5px;">' +
                '<i class="fa-solid fa-floppy-disk"></i> Salvar composição no navegador</button>' +
            '<button class="estudio-btn mini" id="estudioCarregarLayout" style="width:100%; margin-bottom:5px;">' +
                '<i class="fa-solid fa-folder-open"></i> Carregar composição salva</button>' +
            '<button class="estudio-btn mini" id="estudioExportarLayout" style="width:100%; margin-bottom:5px;">' +
                '<i class="fa-solid fa-file-arrow-down"></i> Exportar composição (.json)</button>' +
            '<button class="estudio-btn mini" id="estudioImportarLayout" style="width:100%; margin-bottom:5px;">' +
                '<i class="fa-solid fa-file-arrow-up"></i> Importar composição (.json)</button>' +
            '<button class="estudio-btn mini" id="estudioRestaurar" style="width:100%;">' +
                '<i class="fa-solid fa-rotate-left"></i> Restaurar padrões</button>' +
            '<input type="file" id="estudioArquivoLayout" accept="application/json,.json" style="display:none;">';

        return secao('elementos', '6. Elementos da prancha', elementos, true) +
               secao('titulo', '7. Título', titulo, false) +
               secao('norte', '8. Rosa dos ventos', norte, false) +
               secao('legendas', '9. Legendas', legendas, false) +
               secao('livres', '10. Textos e formas', livres, false) +
               secao('composicao', '11. Composição', composicao, false);
    }

    function montarInterface() {
        raiz = elemento('div', 'estudio-overlay');
        raiz.id = 'estudioMapasOverlay';
        raiz.innerHTML =
            '<div class="estudio-topbar">' +
                '<div class="estudio-titulo">' +
                    '<i class="fa-solid fa-images" style="color:#a78bfa;"></i>' +
                    '<div>Estúdio de Mapas e Pontos Nodais' +
                        '<small>Composição cartográfica e exportação de imagens em alta resolução</small>' +
                    '</div>' +
                '</div>' +
                '<div class="estudio-topbar-acoes">' +
                    '<span class="estudio-status" id="estudioStatus"></span>' +
                    '<button class="estudio-btn verde" id="estudioExportarLote">' +
                        '<i class="fa-solid fa-layer-group"></i> Exportar todos os municípios (.zip)</button>' +
                    '<button class="estudio-btn primario" id="estudioExportar">' +
                        '<i class="fa-solid fa-download"></i> Exportar imagem</button>' +
                    '<button class="estudio-btn fechar" id="estudioFechar">' +
                        '<i class="fa-solid fa-xmark"></i> Fechar</button>' +
                '</div>' +
            '</div>' +
            '<div class="estudio-corpo">' +
                '<div class="estudio-lateral" id="estudioLateralEsq"></div>' +
                '<div class="estudio-palco">' +
                    '<div class="estudio-palco-barra">' +
                        '<div class="grupo">' +
                            '<label class="estudio-rotulo" style="margin:0;">Município</label>' +
                            '<select class="estudio-select" id="estudioCidade" style="width:220px;"></select>' +
                            '<span id="estudioIndicadores"></span>' +
                        '</div>' +
                        '<div class="grupo">' +
                            '<button class="estudio-btn mini" id="estudioZoomMenos" title="Reduzir"><i class="fa-solid fa-minus"></i></button>' +
                            '<span class="estudio-badge-info" id="estudioZoomInfo">z</span>' +
                            '<button class="estudio-btn mini" id="estudioZoomMais" title="Ampliar"><i class="fa-solid fa-plus"></i></button>' +
                            '<button class="estudio-btn mini" id="estudioEnquadrar"><i class="fa-solid fa-expand"></i> Enquadrar município</button>' +
                            '<button class="estudio-btn mini" id="estudioEnquadrarPontos"><i class="fa-solid fa-map-pin"></i> Enquadrar pontos nodais</button>' +
                            '<button class="estudio-btn mini" id="estudioSincronizar"><i class="fa-solid fa-crosshairs"></i> Usar visão do painel</button>' +
                            '<button class="estudio-btn mini" id="estudioAlternarAlcas"><i class="fa-solid fa-up-down-left-right"></i> Alças</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="estudio-palco-area" id="estudioArea">' +
                        '<div class="estudio-quadro" id="estudioQuadro">' +
                            '<canvas id="estudioCanvas"></canvas>' +
                            '<div id="estudioAlcas"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="estudio-lateral direita" id="estudioLateralDir"></div>' +
            '</div>' +
            '<div class="estudio-progresso" id="estudioProgresso">' +
                '<div id="estudioProgressoTexto">Processando...</div>' +
                '<div class="barra"><span id="estudioProgressoBarra"></span></div>' +
            '</div>';

        document.body.appendChild(raiz);

        refs.lateralEsq = raiz.querySelector('#estudioLateralEsq');
        refs.lateralDir = raiz.querySelector('#estudioLateralDir');
        refs.lateralEsq.innerHTML = montarLateralEsquerda();
        refs.lateralDir.innerHTML = montarLateralDireita();

        refs.status = raiz.querySelector('#estudioStatus');
        refs.canvas = raiz.querySelector('#estudioCanvas');
        refs.quadro = raiz.querySelector('#estudioQuadro');
        refs.alcas = raiz.querySelector('#estudioAlcas');
        refs.area = raiz.querySelector('#estudioArea');
        refs.cidade = raiz.querySelector('#estudioCidade');
        refs.indicadores = raiz.querySelector('#estudioIndicadores');
        refs.zoomInfo = raiz.querySelector('#estudioZoomInfo');
        refs.progresso = raiz.querySelector('#estudioProgresso');
        refs.progressoTexto = raiz.querySelector('#estudioProgressoTexto');
        refs.progressoBarra = raiz.querySelector('#estudioProgressoBarra');
        refs.listaLivres = raiz.querySelector('#estudioListaLivres');
        refs.propsLivre = raiz.querySelector('#estudioPropsLivre');

        ligarEventos();
        ligarNavegacaoMapa();
    }

    // ---------------------------------------------------------------------
    // 9.5 Ligacao entre controles e estado
    // ---------------------------------------------------------------------

    function sincronizarControles() {
        raiz.querySelectorAll('[data-estado]').forEach(function (el) {
            var valor = lerCaminho(cfg, el.getAttribute('data-estado'));
            if (el.type === 'checkbox') {
                el.checked = !!valor;
            } else if (valor != null) {
                el.value = valor;
            }
        });
        raiz.querySelectorAll('[data-eco]').forEach(function (el) {
            var valor = lerCaminho(cfg, el.getAttribute('data-eco'));
            el.textContent = typeof valor === 'number' ? valor.toFixed(2) : String(valor == null ? '' : valor);
        });
        raiz.querySelectorAll('[data-preset]').forEach(function (btn) {
            var p = PRESETS_RESOLUCAO[parseInt(btn.getAttribute('data-preset'), 10)];
            var ativo = (p.largura === cfg.largura && p.altura === cfg.altura) ||
                        (p.largura === cfg.altura && p.altura === cfg.largura);
            btn.classList.toggle('ativo', ativo);
        });
        if (refs.zoomInfo) refs.zoomInfo.textContent = 'z ' + cfg.visao.zoom.toFixed(2);
    }

    function aoAlterarControle(el) {
        var caminho = el.getAttribute('data-estado');
        var tipo = el.getAttribute('data-tipo');
        var valor;
        if (el.type === 'checkbox') valor = el.checked;
        else if (tipo === 'numero' || el.type === 'number' || el.type === 'range') valor = parseFloat(el.value) || 0;
        else valor = el.value;
        escreverCaminho(cfg, caminho, valor);
        if (caminho === 'titulo.titulo') cfg.titulo.tituloManual = true;

        var eco = raiz.querySelector('[data-eco="' + caminho + '"]');
        if (eco) eco.textContent = typeof valor === 'number' ? valor.toFixed(2) : valor;

        if (caminho === 'largura' || caminho === 'altura') sincronizarControles();
        agendarPrevia(el.type === 'range' || el.type === 'text' ? 220 : 90);
    }

    function ligarEventos() {
        raiz.addEventListener('change', function (ev) {
            if (ev.target.hasAttribute && ev.target.hasAttribute('data-estado')) aoAlterarControle(ev.target);
        });
        raiz.addEventListener('input', function (ev) {
            if (ev.target.hasAttribute && ev.target.hasAttribute('data-estado')) aoAlterarControle(ev.target);
        });

        raiz.querySelectorAll('.estudio-secao-cabecalho').forEach(function (cab) {
            cab.addEventListener('click', function () {
                cab.parentElement.classList.toggle('aberta');
            });
        });

        raiz.querySelectorAll('[data-preset]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var p = PRESETS_RESOLUCAO[parseInt(btn.getAttribute('data-preset'), 10)];
                var retrato = cfg.altura > cfg.largura;
                cfg.largura = retrato ? Math.min(p.largura, p.altura) : Math.max(p.largura, p.altura);
                cfg.altura = retrato ? Math.max(p.largura, p.altura) : Math.min(p.largura, p.altura);
                if (p.largura === p.altura) { cfg.largura = p.largura; cfg.altura = p.altura; }
                sincronizarControles();
                agendarPrevia(20);
            });
        });

        raiz.querySelectorAll('[data-novo]').forEach(function (btn) {
            btn.addEventListener('click', function () { adicionarElementoLivre(btn.getAttribute('data-novo')); });
        });

        raiz.querySelector('#estudioFechar').addEventListener('click', fechar);
        raiz.querySelector('#estudioExportar').addEventListener('click', exportarImagem);
        raiz.querySelector('#estudioExportarLote').addEventListener('click', exportarLote);

        raiz.querySelector('#estudioInverter').addEventListener('click', function () {
            var l = cfg.largura; cfg.largura = cfg.altura; cfg.altura = l;
            sincronizarControles();
            agendarPrevia(20);
        });

        raiz.querySelector('#estudioZoomMais').addEventListener('click', function () { aplicarZoom(0.5); });
        raiz.querySelector('#estudioZoomMenos').addEventListener('click', function () { aplicarZoom(-0.5); });

        raiz.querySelector('#estudioEnquadrar').addEventListener('click', function () {
            var visao = enquadrarCidade(coletarDados(cfg.cidade), cfg.largura, cfg.altura, false);
            if (visao) { cfg.visao = visao; sincronizarControles(); agendarPrevia(20); }
            else definirStatus('Não há feições para enquadrar neste município.', 'erro');
        });

        raiz.querySelector('#estudioEnquadrarPontos').addEventListener('click', function () {
            var visao = enquadrarCidade(coletarDados(cfg.cidade), cfg.largura, cfg.altura, true);
            if (visao) { cfg.visao = visao; sincronizarControles(); agendarPrevia(20); }
            else definirStatus('Nenhum ponto nodal registrado neste município.', 'erro');
        });

        raiz.querySelector('#estudioSincronizar').addEventListener('click', function () {
            var visaoPainel = adaptador.getVisaoMapa && adaptador.getVisaoMapa();
            if (!visaoPainel) return;
            // O zoom do painel refere-se a largura do mapa na tela; converte-o
            // para a resolucao de saida do estudio.
            var fator = Math.log(cfg.largura / Math.max(1, visaoPainel.largura || 1000)) / Math.LN2;
            cfg.visao = { lat: visaoPainel.lat, lon: visaoPainel.lon, zoom: visaoPainel.zoom + fator };
            sincronizarControles();
            agendarPrevia(20);
        });

        raiz.querySelector('#estudioAlternarAlcas').addEventListener('click', function () {
            refs.quadro.classList.toggle('sem-alcas');
        });

        raiz.querySelector('#estudioReposicionar').addEventListener('click', function () {
            cfg.posicoes = estadoPadrao().posicoes;
            agendarPrevia(20);
        });

        raiz.querySelector('#estudioImportarFiltros').addEventListener('click', function () {
            var filtros = adaptador.getFiltros && adaptador.getFiltros();
            if (!filtros) return;
            cfg.filtros.freqMinima = filtros.freqMinima || 0;
            cfg.filtros.categoria = filtros.categoria || 'all';
            cfg.filtros.limiteRank = filtros.limiteRank || 0;
            cfg.camadas.fluxo = filtros.fluxo !== false;
            cfg.camadas.sobreposicao = filtros.sobreposicao !== false;
            cfg.camadas.atrativos = filtros.atrativos !== false;
            cfg.camadas.centroide = filtros.centroide !== false;
            cfg.camadas.pontos = filtros.pontos !== false;
            if (filtros.mapaBase) cfg.mapaBase = filtros.mapaBase;
            sincronizarControles();
            definirStatus('Filtros e camadas copiados do painel.', 'ok');
            agendarPrevia(20);
        });

        refs.cidade.addEventListener('change', function () {
            definirCidade(refs.cidade.value, true);
        });

        raiz.querySelector('#estudioSalvarLayout').addEventListener('click', function () {
            try {
                localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(cfg));
                definirStatus('Composição salva neste navegador.', 'ok');
            } catch (e) {
                definirStatus('Não foi possível salvar: ' + e.message, 'erro');
            }
        });

        raiz.querySelector('#estudioCarregarLayout').addEventListener('click', function () {
            var bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
            if (!bruto) { definirStatus('Nenhuma composição salva neste navegador.', 'erro'); return; }
            try {
                aplicarComposicao(JSON.parse(bruto));
                definirStatus('Composição carregada.', 'ok');
            } catch (e) {
                definirStatus('Arquivo de composição inválido.', 'erro');
            }
        });

        raiz.querySelector('#estudioExportarLayout').addEventListener('click', function () {
            var blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
            baixarBlob(blob, 'composicao_estudio_mapas.json');
        });

        var campoArquivo = raiz.querySelector('#estudioArquivoLayout');
        raiz.querySelector('#estudioImportarLayout').addEventListener('click', function () { campoArquivo.click(); });
        campoArquivo.addEventListener('change', function () {
            var arquivo = campoArquivo.files && campoArquivo.files[0];
            if (!arquivo) return;
            var leitor = new FileReader();
            leitor.onload = function () {
                try {
                    aplicarComposicao(JSON.parse(leitor.result));
                    definirStatus('Composição importada.', 'ok');
                } catch (e) {
                    definirStatus('Arquivo de composição inválido.', 'erro');
                }
            };
            leitor.readAsText(arquivo);
            campoArquivo.value = '';
        });

        raiz.querySelector('#estudioRestaurar').addEventListener('click', function () {
            var cidade = cfg.cidade;
            var visao = cfg.visao;
            cfg = estadoPadrao();
            cfg.cidade = cidade;
            cfg.visao = visao;
            sincronizarControles();
            renderizarListaLivres();
            agendarPrevia(20);
        });

        window.addEventListener('resize', function () {
            if (raiz.classList.contains('aberto')) agendarPrevia(220);
        });

        document.addEventListener('keydown', function (ev) {
            if (!raiz.classList.contains('aberto')) return;
            if (ev.key === 'Escape') fechar();
            if (ev.key === 'Delete' && elementoSelecionado && elementoSelecionado.indexOf('livre-') === 0) {
                removerElementoLivre(elementoSelecionado);
            }
        });
    }

    function aplicarComposicao(novo) {
        var cidade = cfg.cidade;
        var base = estadoPadrao();
        mesclar(base, novo);
        base.cidade = cidade;
        if (!base.visao) base.visao = cfg.visao;
        cfg = base;
        sincronizarControles();
        renderizarListaLivres();
        agendarPrevia(20);
    }

    // ---------------------------------------------------------------------
    // 9.6 Textos e formas livres
    // ---------------------------------------------------------------------

    var contadorLivres = 0;

    function adicionarElementoLivre(tipo) {
        contadorLivres++;
        var id = 'livre-' + Date.now() + '-' + contadorLivres;
        var novo = {
            id: id,
            tipo: tipo,
            x: 0.4,
            y: 0.45,
            visivel: true,
            opacidade: 1,
            largura: tipo === 'texto' ? 260 : 180,
            altura: tipo === 'texto' ? 60 : 120,
            comFundo: tipo === 'texto',
            corFundo: '#ffffff',
            corBorda: '#dc2626',
            espessura: tipo === 'texto' ? 0 : 3,
            raioBorda: 6,
            cor: '#0f172a',
            tamanhoFonte: 18,
            peso: '600',
            texto: 'Novo texto'
        };
        if (tipo === 'seta') { novo.x2 = 0.52; novo.y2 = 0.5; }
        cfg.livres.push(novo);
        cfg.ordem.push(id);
        elementoSelecionado = id;
        renderizarListaLivres();
        agendarPrevia(20);
    }

    function removerElementoLivre(id) {
        cfg.livres = cfg.livres.filter(function (e) { return e.id !== id; });
        cfg.ordem = cfg.ordem.filter(function (o) { return o !== id; });
        if (elementoSelecionado === id) elementoSelecionado = null;
        renderizarListaLivres();
        agendarPrevia(20);
    }

    function renderizarListaLivres() {
        if (!refs.listaLivres) return;
        refs.listaLivres.innerHTML = '';
        cfg.livres.forEach(function (el) {
            var item = elemento('div', 'estudio-item-elemento' + (elementoSelecionado === el.id ? ' selecionado' : ''));
            item.innerHTML =
                '<button class="visibilidade" title="Exibir/ocultar"><i class="fa-solid ' +
                    (el.visivel === false ? 'fa-eye-slash' : 'fa-eye') + '"></i></button>' +
                '<span class="nome">' + rotuloElemento(el.id) + '</span>' +
                '<button class="subir" title="Trazer para frente"><i class="fa-solid fa-arrow-up"></i></button>' +
                '<button class="remover" title="Remover"><i class="fa-solid fa-trash"></i></button>';
            item.querySelector('.nome').addEventListener('click', function () { selecionarElemento(el.id); });
            item.querySelector('.visibilidade').addEventListener('click', function () {
                el.visivel = el.visivel === false;
                renderizarListaLivres();
                agendarPrevia(20);
            });
            item.querySelector('.subir').addEventListener('click', function () {
                cfg.ordem = cfg.ordem.filter(function (o) { return o !== el.id; });
                cfg.ordem.push(el.id);
                agendarPrevia(20);
            });
            item.querySelector('.remover').addEventListener('click', function () { removerElementoLivre(el.id); });
            refs.listaLivres.appendChild(item);
        });
        renderizarPropriedadesLivre();
    }

    function renderizarPropriedadesLivre() {
        if (!refs.propsLivre) return;
        var indice = cfg.livres.findIndex(function (e) { return e.id === elementoSelecionado; });
        if (indice < 0) {
            refs.propsLivre.innerHTML = '<div class="estudio-dica">Selecione um texto ou forma da lista para editar suas propriedades.</div>';
            return;
        }
        var el = cfg.livres[indice];
        var base = 'livres.' + indice + '.';
        var html = '<div class="estudio-dica" style="margin-bottom:6px;">Editando: <b>' + rotuloElemento(el.id) + '</b></div>';

        if (el.tipo === 'texto') {
            html += '<div class="estudio-campo"><label class="estudio-rotulo">Texto</label>' +
                    '<textarea class="estudio-textarea" data-estado="' + base + 'texto"></textarea></div>' +
                    campoNumero(base + 'tamanhoFonte', 'Corpo da fonte', 6, 120, 1) +
                    campoNumero(base + 'largura', 'Largura da caixa', 40, 1200, 10) +
                    '<div class="estudio-linha">' + campoCor(base + 'cor', 'Cor do texto') + campoCor(base + 'corFundo', 'Fundo') + '</div>' +
                    check(base + 'comFundo', 'Aplicar fundo');
        } else if (el.tipo === 'seta') {
            html += campoNumero(base + 'espessura', 'Espessura', 1, 30, 1) +
                    '<div class="estudio-linha">' + campoCor(base + 'corBorda', 'Cor') + '</div>' +
                    '<div class="estudio-dica">Arraste a alça na prévia para mover a seta inteira.</div>';
        } else {
            html += '<div class="estudio-linha">' +
                        '<div style="flex:1">' + campoNumero(base + 'largura', 'Largura', 10, 2000, 5) + '</div>' +
                        '<div style="flex:1">' + campoNumero(base + 'altura', 'Altura', 10, 2000, 5) + '</div>' +
                    '</div>' +
                    campoNumero(base + 'espessura', 'Espessura da borda', 0, 30, 1) +
                    '<div class="estudio-linha">' + campoCor(base + 'corBorda', 'Cor da borda') + campoCor(base + 'corFundo', 'Preenchimento') + '</div>' +
                    check(base + 'comFundo', 'Aplicar preenchimento');
        }
        html += campoFaixa(base + 'opacidade', 'Opacidade', 0.05, 1, 0.05);
        refs.propsLivre.innerHTML = html;

        refs.propsLivre.querySelectorAll('[data-estado]').forEach(function (campo) {
            var valor = lerCaminho(cfg, campo.getAttribute('data-estado'));
            if (campo.type === 'checkbox') campo.checked = !!valor;
            else if (valor != null) campo.value = valor;
        });
        refs.propsLivre.querySelectorAll('[data-eco]').forEach(function (eco) {
            var valor = lerCaminho(cfg, eco.getAttribute('data-eco'));
            eco.textContent = typeof valor === 'number' ? valor.toFixed(2) : valor;
        });
    }

    // ---------------------------------------------------------------------
    // 9.7 Exportacao
    // ---------------------------------------------------------------------

    function tipoMime() { return cfg.formato === 'jpeg' ? 'image/jpeg' : 'image/png'; }
    function extensao() { return cfg.formato === 'jpeg' ? 'jpg' : 'png'; }

    function nomeArquivo(cidade) {
        return 'mapa_pontos_nodais_' + normalizarNome(cidade || 'mapa') + '_' +
               cfg.largura + 'x' + cfg.altura + '.' + extensao();
    }

    function gerarBlob(canvas) {
        return new Promise(function (resolve, reject) {
            try {
                canvas.toBlob(function (blob) {
                    if (blob) resolve(blob);
                    else reject(new Error('O navegador não conseguiu gerar o arquivo de imagem.'));
                }, tipoMime(), cfg.formato === 'jpeg' ? cfg.qualidade : undefined);
            } catch (erro) {
                reject(erro);
            }
        });
    }

    /** Renderiza a composicao na resolucao de saida e devolve o canvas. */
    function renderizarSaida(cidade, aoProgredir) {
        var canvas = document.createElement('canvas');
        canvas.width = cfg.largura;
        canvas.height = cfg.altura;
        var ctx = canvas.getContext('2d');
        if (cfg.formato === 'jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        var dados = coletarDados(cidade);
        return renderizarComposicao(ctx, cfg.largura, cfg.altura, cfg, dados, {
            modeloTiles: adaptador.getProvedores()[cfg.mapaBase],
            credito: creditoAtual(),
            aoProgredir: aoProgredir
        }).then(function (resultado) {
            return { canvas: canvas, resultado: resultado };
        });
    }

    function prepararFontes() {
        if (document.fonts && document.fonts.ready) return document.fonts.ready.catch(function () { return null; });
        return Promise.resolve(null);
    }

    function exportarImagem() {
        mostrarProgresso(true, 'Preparando composição...', 5);
        prepararFontes()
            .then(function () {
                return renderizarSaida(cfg.cidade, function (feitos, total) {
                    mostrarProgresso(true, 'Renderizando mapa base (' + feitos + '/' + total + ' tiles)...',
                        10 + (feitos / Math.max(1, total)) * 70);
                });
            })
            .then(function (saida) {
                mostrarProgresso(true, 'Gerando arquivo...', 90);
                if (saida.resultado.falhasTiles > 0) {
                    definirStatus(saida.resultado.falhasTiles + ' tile(s) não carregaram nesta exportação.', 'erro');
                }
                return gerarBlob(saida.canvas);
            })
            .then(function (blob) {
                baixarBlob(blob, nomeArquivo(cfg.cidade));
                mostrarProgresso(false);
                definirStatus('Imagem exportada: ' + nomeArquivo(cfg.cidade), 'ok');
            })
            .catch(function (erro) {
                mostrarProgresso(false);
                definirStatus(mensagemErroExportacao(erro), 'erro');
            });
    }

    function mensagemErroExportacao(erro) {
        var texto = erro && erro.message ? erro.message : String(erro);
        if (/tainted|SecurityError|insecure/i.test(texto)) {
            return 'O provedor de mapa base não autorizou a leitura das imagens (CORS). ' +
                   'Selecione outro provedor ou publique o painel em um servidor local.';
        }
        return 'Falha ao exportar: ' + texto;
    }

    function exportarLote() {
        var cidades = Object.keys(adaptador.getCidades() || {});
        if (!cidades.length) { definirStatus('Nenhum município disponível.', 'erro'); return; }

        var enquadrarCada = window.confirm(
            'Exportar ' + cidades.length + ' mapas com a composição atual.\n\n' +
            'OK: enquadrar automaticamente cada município.\n' +
            'Cancelar: manter o enquadramento atual em todos os mapas.'
        );

        var visaoOriginal = clonar(cfg.visao);
        var cidadeOriginal = cfg.cidade;
        var arquivos = [];

        mostrarProgresso(true, 'Iniciando exportação em lote...', 2);

        var cadeia = prepararFontes();
        cidades.forEach(function (cidade, indice) {
            cadeia = cadeia.then(function () {
                mostrarProgresso(true, 'Gerando ' + cidade + ' (' + (indice + 1) + '/' + cidades.length + ')...',
                    5 + (indice / cidades.length) * 85);
                if (enquadrarCada) {
                    var visao = enquadrarCidade(coletarDados(cidade), cfg.largura, cfg.altura, false);
                    if (visao) cfg.visao = visao;
                }
                return renderizarSaida(cidade)
                    .then(function (saida) { return gerarBlob(saida.canvas); })
                    .then(function (blob) {
                        arquivos.push({ nome: nomeArquivo(cidade), blob: blob });
                    });
            });
        });

        cadeia
            .then(function () {
                cfg.visao = visaoOriginal;
                cfg.cidade = cidadeOriginal;
                mostrarProgresso(true, 'Compactando arquivos...', 94);

                if (typeof global.JSZip === 'undefined') {
                    arquivos.forEach(function (a, i) {
                        setTimeout(function () { baixarBlob(a.blob, a.nome); }, i * 400);
                    });
                    mostrarProgresso(false);
                    definirStatus('JSZip indisponível: os ' + arquivos.length + ' arquivos foram baixados separadamente.', 'ok');
                    return null;
                }

                var zip = new global.JSZip();
                arquivos.forEach(function (a) { zip.file(a.nome, a.blob); });
                zip.file('composicao_estudio_mapas.json', JSON.stringify(cfg, null, 2));
                return zip.generateAsync({ type: 'blob' }).then(function (blob) {
                    baixarBlob(blob, 'mapas_pontos_nodais_' + cfg.largura + 'x' + cfg.altura + '.zip');
                    mostrarProgresso(false);
                    definirStatus(arquivos.length + ' mapas exportados em .zip.', 'ok');
                });
            })
            .catch(function (erro) {
                cfg.visao = visaoOriginal;
                cfg.cidade = cidadeOriginal;
                mostrarProgresso(false);
                definirStatus(mensagemErroExportacao(erro), 'erro');
            })
            .then(function () { agendarPrevia(20); });
    }

    // ---------------------------------------------------------------------
    // 9.8 Ciclo de vida
    // ---------------------------------------------------------------------

    function preencherCidades() {
        var cidades = Object.keys(adaptador.getCidades() || {});
        refs.cidade.innerHTML = '';
        cidades.forEach(function (chave) {
            var opcao = document.createElement('option');
            opcao.value = chave;
            opcao.textContent = chave;
            refs.cidade.appendChild(opcao);
        });
    }

    function definirCidade(chave, reenquadrar) {
        cfg.cidade = chave;
        refs.cidade.value = chave;
        if (reenquadrar || !cfg.visao) {
            var visao = enquadrarCidade(coletarDados(chave), cfg.largura, cfg.altura, false);
            if (visao) cfg.visao = visao;
        }
        // Enquadramento de seguranca quando o municipio nao tem feicoes.
        if (!cfg.visao) cfg.visao = { lat: -25.5, lon: -54.5, zoom: 11 };
        atualizarTituloAutomatico(chave);
        sincronizarControles();
        agendarPrevia(20);
    }

    /** Mantem o titulo sincronizado com o municipio ate o usuario edita-lo. */
    function atualizarTituloAutomatico(chave) {
        if (cfg.titulo.tituloManual) return;
        cfg.titulo.titulo = 'Pontos Nodais de Aferição — ' + chave;
        var campo = raiz.querySelector('[data-estado="titulo.titulo"]');
        if (campo) campo.value = cfg.titulo.titulo;
    }

    function abrir() {
        if (!adaptador) {
            console.warn('EstudioMapas: chame EstudioMapas.init() antes de abrir o estúdio.');
            return;
        }
        if (!raiz) montarInterface();
        preencherCidades();

        var cidade = adaptador.getCidadeAtual && adaptador.getCidadeAtual();
        var disponiveis = Object.keys(adaptador.getCidades() || {});
        if (!cidade || disponiveis.indexOf(cidade) < 0) {
            cidade = disponiveis.length ? disponiveis[0] : '';
        }

        raiz.classList.add('aberto');
        document.body.style.overflow = 'hidden';

        var primeiraAbertura = !cfg.visao;
        definirCidade(cidade, primeiraAbertura);
        sincronizarControles();
        renderizarListaLivres();
        agendarPrevia(30);
    }

    function fechar() {
        if (!raiz) return;
        raiz.classList.remove('aberto');
        document.body.style.overflow = '';
    }

    function init(config) {
        adaptador = config || {};
        if (typeof adaptador.getCidades !== 'function') {
            throw new Error('EstudioMapas.init: informe getCidades().');
        }
        if (typeof adaptador.getPontosSalvos !== 'function') {
            adaptador.getPontosSalvos = function () { return []; };
        }
        if (typeof adaptador.getProvedores !== 'function') {
            adaptador.getProvedores = function () {
                return { osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' };
            };
        }
        if (typeof adaptador.getAtribuicoes !== 'function') {
            adaptador.getAtribuicoes = function () { return {}; };
        }
        if (adaptador.mapaBasePadrao) cfg.mapaBase = adaptador.mapaBasePadrao;
        return API;
    }

    var API = {
        init: init,
        abrir: abrir,
        fechar: fechar,
        // Rotinas de desenho expostas para reuso em outros mapas do projeto.
        desenho: {
            projetar: projetar,
            desprojetar: desprojetar,
            criarVisao: criarVisao,
            zoomParaLimites: zoomParaLimites,
            limitesDePontos: limitesDePontos,
            desenharMapaBase: desenharMapaBase,
            desenharManchasFluxo: desenharManchasFluxo,
            desenharSobreposicao: desenharSobreposicao,
            desenharAtrativos: desenharAtrativos,
            desenharCentroide: desenharCentroide,
            desenharPontosNodais: desenharPontosNodais,
            desenharGrade: desenharGrade,
            desenharNorte: desenharNorte,
            desenharEscalaGrafica: desenharEscalaGrafica,
            desenharLegenda: desenharLegenda,
            desenharLegendaPontos: desenharLegendaPontos,
            desenharTitulo: desenharTitulo,
            desenharElementoLivre: desenharElementoLivre,
            renderizarComposicao: renderizarComposicao
        },
        estadoPadrao: estadoPadrao,
        get estado() { return cfg; }
    };

    global.EstudioMapas = API;

})(window);
