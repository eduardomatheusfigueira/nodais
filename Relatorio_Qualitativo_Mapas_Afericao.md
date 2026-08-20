# Guia de Avaliação Qualitativa e Mapas de Aferição de Campo
**Projeto UNESCO – Edital UNES 2369/2025**  
*Metodologia de Decisão Observacional e Análise Geoespacial Integrada*

---

## 1. Metodologia de Decisão Qualitativa e Observacional

Para efetuar a seleção final dos pontos de aferição em campo, o especialista deverá realizar uma **análise visual e qualitativa integrada**, observando simultaneamente a disposição espacial no mapa interativo e a tabela hierárquica de atrativos de cada município.

### Estrutura Visual dos Mapas Interativos
Cada mapa municipal contempla rigorosamente **4 elementos visuais de sobreposição**:

1. **Atrativos da Cidade em Ordem de Importância**: Identificados visualmente por **crachás numéricos destacados (#1, #2, #3...)** que correspondem diretamente às posições na tabela da legenda.
2. **Trechos de Maior Sobreposição de Trajetos**: Pontos de amostragem no corredor viário entre o centroide empresarial e os atrativos, representados por uma **escala de cor sólida contínua (do Branco ao Vermelho Escuro)**:
   - ⚪ **Branco / Rosa Claro**: Baixa sobreposição de tráfego;
   - 🔴 **Rosa Intenso / Vermelho**: Média sobreposição;
   - 🍷 **Vermelho Escuro / Vinho**: Alta relevância de sobreposição de rotas e convergência.
3. **Manchas de Fluxo de Trânsito (Heatmap Focado)**: Camada de densidade viária extraída dos *waypoints* da API TomTom, configurada com raio e foco estreitos (*non-overly-broad heatmaps*) para evidenciar os gargalos reais de circulação sem desfocar a visão da malha urbana.
4. **Centro Geométrico do Aglomerado de CNPJs**: Ponto indicador amarelo/dourado (`🎯 CENTRO GEOMÉTRICO CNPJ`) representando o centroide matemático de todas as empresas geocodificadas da cidade.

---

## 2. Ferramenta de Análise: Painel Mestre Interativo

Para facilitar a decisão rápida e alternância entre cidades, utilize o painel mestre web:
- [Painel Mestre de Decisão Qualitativa (painel_decisao_qualitativa.html)](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/painel_decisao_qualitativa.html)

*(O painel permite escolher qualquer município pelo menu suspenso, visualizar o mapa com todas as camadas ativas, consultar a tabela de atrativos e digitar as anotações qualitativas para salvar a escolha do profissional).*

---

## 3. Análise Detalhada e Tabelas por Município

### 3.1. MS - Bonito
- **Mapa Interativo Individual**: [mapa_MS_Bonito.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_MS_Bonito.html)
- **Centro Geométrico dos CNPJs**: Latitude `-21.115596`, Longitude `-56.422170` (*395 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `Fora do Estudo` | **MS - 382** | Atrativo Turístico | `-21.105469, -56.529965` |
| **#2** | `Fora do Estudo` | **MS - 178** | Atrativo Turístico | `-21.112275, -56.508164` |
| **#3** | `Fora do Estudo` | **MS - 345** | Atrativo Turístico | `-21.109232, -56.482415` |
| **#4** | `Fora do Estudo` | **Aeroporto Regional de Bonito (BYO)** | Atrativo Turístico | `-21.244117, -56.450187` |
| **#5** | `Fora do Estudo` | **Gruta do Mimoso** | Atrativo Turístico | `-20.902778, -56.557320` |
| **#6** | `Fora do Estudo` | **Abismo Anhumas** | Atrativo Turístico | `-21.144916, -56.600205` |
| **#7** | `Fora do Estudo` | **Aquário Natural** | Atrativo Turístico | `-21.163158, -56.438978` |
| **#8** | `Fora do Estudo` | **Nascente Azul** | Atrativo Turístico | `-20.893462, -56.532027` |
| **#9** | `Fora do Estudo` | **Rio Formoso** | Atrativo Turístico | `-21.205330, -56.493478` |
| **#10** | `Fora do Estudo` | **Praça da Liberdade** | Atrativo Turístico | `-21.128353, -56.483441` |
| **#11** | `Fora do Estudo` | **Aeroporto Regional de Bonito** | Atrativo Turístico | `-21.243927, -56.450219` |
| **#12** | `Fora do Estudo` | **Serra da Bodoquena** | Atrativo Turístico | `-20.998998, -56.833376` |
| **#13** | `Fora do Estudo` | **Passeios de bote** | Atrativo Turístico | `-21.143187, -56.401279` |
| **#14** | `Fora do Estudo` | **Boia cross** | Atrativo Turístico | `-21.171287, -56.446405` |
| **#15** | `Fora do Estudo` | **Boca da Onça Ecotur** | Atrativo Turístico | `-20.761238, -56.713010` |
| **#16** | `Fora do Estudo` | **Balneário do Sol** | Atrativo Turístico | `-21.142179, -56.405487` |
| **#17** | `Fora do Estudo` | **Balneário Ilha Bonita** | Atrativo Turístico | `-21.144831, -56.400551` |
| **#18** | `Fora do Estudo` | **Balneário Municipal** | Atrativo Turístico | `-21.173278, -56.445919` |
| **#19** | `Fora do Estudo` | **Barra do Sucuri** | Atrativo Turístico | `-21.256720, -56.549247` |
| **#20** | `Fora do Estudo` | **Cabanas Boia Cross** | Atrativo Turístico | `-21.171347, -56.446351` |
| **#21** | `Fora do Estudo` | **Caiman Scuba Dive** | Atrativo Turístico | `-21.129415, -56.483108` |
| **#22** | `Fora do Estudo` | **Cavalgada Recanto do Peão** | Atrativo Turístico | `-21.158566, -56.442513` |
| **#23** | `Fora do Estudo` | **Ceita Corê Ecoturismo** | Atrativo Turístico | `-20.841917, -56.590202` |
| **#24** | `Fora do Estudo` | **Discovery Bonito Scuba no Rio Formoso** | Atrativo Turístico | `-21.128776, -56.485907` |
| **#25** | `Fora do Estudo` | **Estância Mimosa Ecoturismo** | Atrativo Turístico | `-20.982497, -56.516074` |
| **#26** | `Fora do Estudo` | **Fabrica Taboa Encantos** | Atrativo Turístico | `-19.644941, -56.640017` |
| **#27** | `Fora do Estudo` | **Gruta de São Miguel** | Atrativo Turístico | `-20.891953, -56.581070` |
| **#28** | `Fora do Estudo` | **Gruta do Lago Azul** | Atrativo Turístico | `-21.144365, -56.591384` |
| **#29** | `Fora do Estudo` | **Gruta São Mateus e Museu** | Atrativo Turístico | `-21.134128, -56.454033` |
| **#30** | `Fora do Estudo` | **Lobo Guara Bike Adventure** | Atrativo Turístico | `-21.129369, -56.483088` |
| **#31** | `Fora do Estudo` | **Parque das Cachoeiras** | Atrativo Turístico | `-21.005853, -56.501577` |
| **#32** | `Fora do Estudo` | **Parque Ecológico Baia Bonita** | Atrativo Turístico | `-21.162423, -56.440263` |
| **#33** | `Fora do Estudo` | **Porto da Ilha** | Atrativo Turístico | `-21.118740, -56.386801` |
| **#34** | `Fora do Estudo` | **Praia da Figueira** | Atrativo Turístico | `-21.251795, -56.535326` |
| **#35** | `Fora do Estudo` | **Projeto Jibóia** | Atrativo Turístico | `-21.121558, -56.497319` |
| **#36** | `Fora do Estudo` | **Rio do Peixe** | Atrativo Turístico | `-20.862596, -56.530318` |
| **#37** | `Fora do Estudo` | **Rio Sucuri Ecoturismo** | Atrativo Turístico | `-21.254429, -56.570000` |

---

### 3.2. MS - Campo Grande
- **Mapa Interativo Individual**: [mapa_MS_Campo_Grande.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_MS_Campo_Grande.html)
- **Centro Geométrico dos CNPJs**: Latitude `-20.474576`, Longitude `-54.616173` (*4226 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `Fora do Estudo` | **Centro Cultural José Octavio Guizzo** | Atrativo Turístico | `-20.467298, -54.617741` |
| **#2** | `Fora do Estudo` | **Complexo Ferroviário** | Atrativo Turístico | `-20.449713, -54.620627` |
| **#3** | `Fora do Estudo` | **Museu de Medicina de Mato Grosso do Sul** | Atrativo Turístico | `-20.477184, -54.615350` |
| **#4** | `Fora do Estudo` | **Morada dos Baís** | Atrativo Turístico | `-20.464151, -54.620198` |
| **#5** | `Fora do Estudo` | **Museu de Arqueologia da UFMS** | Atrativo Turístico | `-20.468163, -54.617788` |
| **#6** | `Fora do Estudo` | **Correios e Telágrafos** | Atrativo Turístico | `-20.461116, -54.619730` |
| **#7** | `Fora do Estudo` | **Casa do Artesão** | Atrativo Turístico | `-20.463927, -54.618439` |
| **#8** | `Fora do Estudo` | **Memorial da Cultura Indígena (em reforma)** | Atrativo Turístico | `-20.469243, -54.570039` |
| **#9** | `Fora do Estudo` | **Museu de Arte Contemporânea – Marco** | Atrativo Turístico | `-20.451009, -54.575526` |
| **#10** | `Fora do Estudo` | **Museu José Antônio Pereira** | Atrativo Turístico | `-20.535017, -54.629227` |
| **#11** | `Fora do Estudo` | **Parque Florestal Antônio De Albuquerque – Horto Florestal** | Atrativo Turístico | `-20.469431, -54.622841` |
| **#12** | `Fora do Estudo` | **Parque Ecológico Do Anhanduí** | Atrativo Turístico | `-20.506580, -54.642967` |
| **#13** | `Fora do Estudo` | **Parque das Nações Indígenas** | Atrativo Turístico | `-20.456207, -54.581261` |
| **#14** | `Fora do Estudo` | **Parque do Sóter** | Atrativo Turístico | `-20.429205, -54.576637` |
| **#15** | `Fora do Estudo` | **Parque Estadual do Prosa** | Atrativo Turístico | `-20.450374, -54.560838` |
| **#16** | `Fora do Estudo` | **Parque Linear do Imbirussu** | Atrativo Turístico | `-20.445014, -54.697516` |
| **#17** | `Fora do Estudo` | **Parque Estadual Matas Do Segredo** | Atrativo Turístico | `-20.398372, -54.586197` |
| **#18** | `Fora do Estudo` | **Lago Do Amor** | Atrativo Turístico | `-20.502553, -54.618787` |
| **#19** | `Fora do Estudo` | **Parque Doutor Anísio De Barros – Lagoa Itatiaia** | Atrativo Turístico | `-20.478036, -54.582739` |
| **#20** | `Fora do Estudo` | **Estância Alegria** | Atrativo Turístico | `-20.643986, -54.532808` |
| **#21** | `Fora do Estudo` | **Estância Hanay** | Atrativo Turístico | `-20.470687, -54.454993` |
| **#22** | `Fora do Estudo` | **Estância Jóia** | Atrativo Turístico | `-20.325339, -54.560087` |
| **#23** | `Fora do Estudo` | **Estância Malhete** | Atrativo Turístico | `-20.375456, -54.610426` |
| **#24** | `Fora do Estudo` | **Estância Vovô Dedê** | Atrativo Turístico | `-20.285213, -54.779590` |
| **#25** | `Fora do Estudo` | **Fazenda Pontal das Águas** | Atrativo Turístico | `-20.466114, -54.436477` |
| **#26** | `Fora do Estudo` | **Pousada Rural Cabanas do Pontal** | Atrativo Turístico | `-20.222360, -54.917264` |
| **#27** | `Fora do Estudo` | **Recanto Nippon** | Atrativo Turístico | `-20.391899, -54.661747` |
| **#28** | `Fora do Estudo` | **Toca do Ouriço** | Atrativo Turístico | `-20.381071, -54.610536` |
| **#29** | `Fora do Estudo` | **Monumento Maria Fumaça** | Atrativo Turístico | `-20.456690, -54.620152` |
| **#30** | `Fora do Estudo` | **Chácara J&F** | Atrativo Turístico | `-20.292608, -54.547764` |
| **#31** | `Fora do Estudo` | **Igreja Universal do Reino de Deus** | Atrativo Turístico | `-20.451393, -54.688002` |
| **#32** | `Fora do Estudo` | **Monumento Estátua Manoel Barros** | Atrativo Turístico | `-20.463345, -54.613837` |
| **#33** | `Fora do Estudo` | **Bioparque Pantanal** | Atrativo Turístico | `-20.455837, -54.576047` |
| **#34** | `Fora do Estudo` | **Esplanada Ferroviária** | Atrativo Turístico | `-20.454045, -54.620299` |
| **#35** | `Fora do Estudo` | **Feira Central** | Atrativo Turístico | `-20.450975, -54.619948` |
| **#36** | `Fora do Estudo` | **Morro do Ernesto** | Atrativo Turístico | `-20.338923, -54.709311` |
| **#37** | `Fora do Estudo` | **Morada dos Baís** | Atrativo Turístico | `-20.464232, -54.619597` |
| **#38** | `Fora do Estudo` | **Hotel Gaspar** | Atrativo Turístico | `-20.456427, -54.620125` |
| **#39** | `Fora do Estudo` | **Memorial da Cidadania e da Cultura Popular Apolônio de Carvalho** | Atrativo Turístico | `-20.468144, -54.617626` |
| **#40** | `Fora do Estudo` | **Mercado Municipal Antônio Valente** | Atrativo Turístico | `-20.466441, -54.619909` |
| **#41** | `Fora do Estudo` | **Museu da Cultura Dom Bosco** | Atrativo Turístico | `-20.454643, -54.567533` |
| **#42** | `Fora do Estudo` | **Palácio das Comunicações** | Atrativo Turístico | `-20.440690, -54.555409` |
| **#43** | `Fora do Estudo` | **Paróquia Santo Antônio - Catedral Nossa Senhora da Abadia** | Atrativo Turístico | `-20.466010, -54.617984` |
| **#44** | `Fora do Estudo` | **Paróquia São Francisco de Assis** | Atrativo Turístico | `-20.442590, -54.619596` |
| **#45** | `Fora do Estudo` | **Pesqueiro Nippon** | Atrativo Turístico | `-20.391849, -54.661768` |
| **#46** | `Fora do Estudo` | **Praça Ary Coelho** | Atrativo Turístico | `-20.463684, -54.616304` |
| **#47** | `Fora do Estudo` | **Praça Esportiva Belmar Fidalgo** | Atrativo Turístico | `-20.459495, -54.606918` |
| **#48** | `Fora do Estudo` | **Praça Comendador Oshiro Takemori** | Atrativo Turístico | `-20.467215, -54.620102` |
| **#49** | `Fora do Estudo` | **Praça das Araras** | Atrativo Turístico | `-20.462943, -54.631539` |
| **#50** | `Fora do Estudo` | **Praça do Rádio** | Atrativo Turístico | `-20.463385, -54.631367` |
| **#51** | `Fora do Estudo` | **Praça dos Imigrantes** | Atrativo Turístico | `-20.466788, -54.613015` |
| **#52** | `Fora do Estudo` | **Praça Pantanal Sul** | Atrativo Turístico | `-20.459943, -54.604798` |
| **#53** | `Fora do Estudo` | **Relógio Central Renato Barbosa Rezende** | Atrativo Turístico | `-20.464081, -54.618889` |
| **#54** | `Fora do Estudo` | **Santuário Estadual Nossa Senhora do Perpétuo Socorro** | Atrativo Turístico | `-20.466733, -54.631635` |
| **#55** | `Fora do Estudo` | **Eco Park Clube Campo Grande** | Atrativo Turístico | `-20.472253, -54.476225` |
| **#56** | `Fora do Estudo` | **Carlos Iracy Tour da Experiência** | Atrativo Turístico | `-20.462115, -54.625502` |
| **#57** | `Fora do Estudo` | **Sitio Harmonia** | Atrativo Turístico | `-20.210631, -54.586109` |
| **#58** | `Fora do Estudo` | **BR - 262** | Atrativo Turístico | `-20.477740, -54.751838` |
| **#59** | `Fora do Estudo` | **BR - 163** | Atrativo Turístico | `-20.378126, -54.537708` |
| **#60** | `Fora do Estudo` | **BR - 060** | Atrativo Turístico | `-20.552352, -54.669089` |
| **#61** | `Fora do Estudo` | **BR - 010** | Atrativo Turístico | `-20.402909, -54.617801` |
| **#62** | `Fora do Estudo` | **MS - 080** | Atrativo Turístico | `-20.409481, -54.731232` |
| **#63** | `Fora do Estudo` | **Aeroporto Internacional de Campo Grande** | Atrativo Turístico | `-20.457281, -54.668733` |

---

### 3.3. MS - Corumbá
- **Mapa Interativo Individual**: [mapa_MS_Corumba.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_MS_Corumba.html)
- **Centro Geométrico dos CNPJs**: Latitude `-19.035296`, Longitude `-57.575329` (*405 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `Fora do Estudo` | **Pantanal** | Atrativo Turístico | `-19.030692, -57.650235` |
| **#2** | `Fora do Estudo` | **Rio Paraguai** | Atrativo Turístico | `-18.730558, -57.415873` |
| **#3** | `Fora do Estudo` | **Porto Geral** | Atrativo Turístico | `-18.996617, -57.653385` |
| **#4** | `Fora do Estudo` | **Barcos-hotéis** | Atrativo Turístico | `-18.998351, -57.614343` |
| **#5** | `Fora do Estudo` | **Mirante do Cristo Rei** | Atrativo Turístico | `-19.017132, -57.641208` |
| **#6** | `Fora do Estudo` | **Museu de História do Pantanal (Muhpan)** | Atrativo Turístico | `-18.997231, -57.654254` |
| **#7** | `Fora do Estudo` | **Memorial do Homem Pantaneiro** | Atrativo Turístico | `-18.997554, -57.655406` |
| **#8** | `Fora do Estudo` | **Carnaval de Corumbá** | Atrativo Turístico | `-18.994769, -57.656448` |
| **#9** | `Fora do Estudo` | **Casario do Porto Geral de Corumbá** | Atrativo Turístico | `-18.997408, -57.655425` |
| **#10** | `Fora do Estudo` | **Cristo Rei do Pantanal** | Atrativo Turístico | `-19.018283, -57.640383` |
| **#11** | `Fora do Estudo` | **Artizu - casa da artesã Izulina Xavier** | Atrativo Turístico | `-19.001557, -57.647890` |
| **#12** | `Fora do Estudo` | **Escadinha da Quinze** | Atrativo Turístico | `-18.997790, -57.655118` |
| **#13** | `Fora do Estudo` | **Forte Junqueira** | Atrativo Turístico | `-18.996636, -57.636255` |
| **#14** | `Fora do Estudo` | **Igreja Nossa Senhora da Candelária** | Atrativo Turístico | `-18.998660, -57.650849` |
| **#15** | `Fora do Estudo` | **ILA – Instituto Luiz de Albuquerque** | Atrativo Turístico | `-19.003131, -57.636760` |
| **#16** | `Fora do Estudo` | **Ladeira Cunha e Cruz** | Atrativo Turístico | `-18.996980, -57.651611` |
| **#17** | `Fora do Estudo` | **Praça da Independência** | Atrativo Turístico | `-19.000887, -57.653221` |
| **#18** | `Fora do Estudo` | **Santuário Nossa Senhora Auxiliadora** | Atrativo Turístico | `-19.001960, -57.653001` |
| **#19** | `Fora do Estudo` | **Casa do Artesão** | Atrativo Turístico | `-18.999973, -57.646833` |
| **#20** | `Fora do Estudo` | **Casa do Massa Barro** | Atrativo Turístico | `-18.998818, -57.663903` |
| **#21** | `Fora do Estudo` | **Forte Coimbra** | Atrativo Turístico | `-19.007844, -57.651647` |
| **#22** | `Fora do Estudo` | **Capela Nossa Senhora do Carmo** | Atrativo Turístico | `-19.017943, -57.667103` |
| **#23** | `Fora do Estudo` | **Instituto do Homem Pantaneiro – IHP** | Atrativo Turístico | `-18.997615, -57.655256` |
| **#24** | `Fora do Estudo` | **Estrada Parque Pantanal** | Atrativo Turístico | `-19.221716, -57.460867` |
| **#25** | `Fora do Estudo` | **BR-262** | Atrativo Turístico | `-19.030107, -57.618624` |
| **#26** | `Fora do Estudo` | **Aeroporto Internacional de Corumbá** | Atrativo Turístico | `-19.014210, -57.663810` |
| **#27** | `Fora do Estudo` | **Porto Geral de Corumbá** | Atrativo Turístico | `-19.013724, -57.663800` |

---

### 3.4. MS - Mundo Novo
- **Mapa Interativo Individual**: [mapa_MS_Mundo_Novo.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_MS_Mundo_Novo.html)
- **Centro Geométrico dos CNPJs**: Latitude `-23.602540`, Longitude `-54.191463` (*94 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `5º` | **Biblioterca Municipal** | Atrativo Turístico | `-23.937318, -54.289676` |
| **#2** | `5º` | **Museu Tapuy Porã** | Atrativo Turístico | `-23.939327, -54.294131` |
| **#3** | `3º` | **Ponte Ayrton Senna** | Turismo de fronteira e cartão-postal | `-23.939327, -54.293970` |
| **#4** | `2º` | **Porto Isabel** | Turismo fluvial e infraestrutura de lazer | `-23.941454, -54.215303` |
| **#5** | `1º` | **Prainha do Cascalho** | Turismo de natureza e lazer à beira do Lago/Rio | `-24.041285, -54.234689` |
| **#6** | `1º` | **Prainha do Sol** | Atrativo Turístico | `-24.001279, -54.181674` |
| **#7** | `Acesso / Infraestrutura` | **BR- 163** | Atrativo Turístico | `-23.934995, -54.281476` |
| **#8** | `2º` | **Porto Isabel** | Turismo fluvial e infraestrutura de lazer | `-23.998019, -54.200521` |

---

### 3.5. MS - Ponta Porã
- **Mapa Interativo Individual**: [mapa_MS_Ponta_Pora.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_MS_Ponta_Pora.html)
- **Centro Geométrico dos CNPJs**: Latitude `-22.521117`, Longitude `-55.717587` (*342 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `Fora do Estudo` | **Estação Ferroviária Noroeste Do Brasil - Ramal De Ponta Porã** | Atrativo Turístico | `-22.523762, -55.733694` |
| **#2** | `Fora do Estudo` | **MS - 164** | Atrativo Turístico | `-22.474003, -55.750199` |
| **#3** | `Fora do Estudo` | **BR - 463** | Atrativo Turístico | `-22.582896, -55.685407` |
| **#4** | `Fora do Estudo` | **Aeroporto Internacional de Ponta Porã - PMG** | Atrativo Turístico | `-22.551853, -55.706193` |
| **#5** | `Fora do Estudo` | **Museu da Erva Mate - Santo Antônio** | Atrativo Turístico | `-22.529803, -55.735048` |
| **#6** | `Fora do Estudo` | **11º Regimento de Cavalaria Mecanizada** | Atrativo Turístico | `-22.540501, -55.722619` |
| **#7** | `Fora do Estudo` | **Prefeitura Municipal de Ponta Porã** | Atrativo Turístico | `-22.538130, -55.724613` |
| **#8** | `Fora do Estudo` | **Parque dos Ervais** | Atrativo Turístico | `-22.551615, -55.716699` |
| **#9** | `Fora do Estudo` | **Monumento das Cuias** | Atrativo Turístico | `-22.562658, -55.698438` |
| **#10** | `Fora do Estudo` | **Majestic Hall Centro de Eventos** | Atrativo Turístico | `-22.590585, -55.674466` |
| **#11** | `Fora do Estudo` | **Castelinho Atividades cultural** | Atrativo Turístico | `-22.523197, -55.735168` |
| **#12** | `Fora do Estudo` | **Centro Internacional de Convenções “Miguel Gomez”** | Atrativo Turístico | `-22.524746, -55.721490` |
| **#13** | `Fora do Estudo` | **Horto Florestal de Ponta Porã** | Atrativo Turístico | `-22.526325, -55.725864` |
| **#14** | `Fora do Estudo` | **Assentamento Itamarati** | Atrativo Turístico | `-22.193234, -55.577961` |
| **#15** | `Fora do Estudo` | **Prédio Histórico da Estação Ferroviária Noroeste do Brasil** | Atrativo Turístico | `-22.523606, -55.733643` |

---

### 3.6. MS - Porto Murtinho
- **Mapa Interativo Individual**: [mapa_MS_Porto_Murtinho.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_MS_Porto_Murtinho.html)
- **Centro Geométrico dos CNPJs**: Latitude `-21.676136`, Longitude `-57.809737` (*48 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `Fora do Estudo` | **BR - 267** | Atrativo Turístico | `-21.698904, -57.875885` |
| **#2** | `Fora do Estudo` | **Porto Carandá** | Atrativo Turístico | `-21.705283, -57.895033` |
| **#3** | `Fora do Estudo` | **Fecho dos Morros** | Atrativo Turístico | `-21.477088, -57.927767` |
| **#4** | `Fora do Estudo` | **Morro Celina** | Atrativo Turístico | `-21.456429, -57.923122` |
| **#5** | `Fora do Estudo` | **Cachoeira do Apa** | Atrativo Turístico | `-21.992969, -57.435863` |
| **#6** | `Fora do Estudo` | **Fazenda Barranco Branco** | Atrativo Turístico | `-21.146338, -57.633827` |
| **#7** | `Fora do Estudo` | **Cachoeira da Fazenda Primavera** | Atrativo Turístico | `-22.165881, -57.523807` |
| **#8** | `Fora do Estudo` | **Cachoeira Facão** | Atrativo Turístico | `-22.165861, -57.523764` |
| **#9** | `Fora do Estudo` | **Paróquia Sagrado Coração de Jesus** | Atrativo Turístico | `-21.698360, -57.883438` |
| **#10** | `Fora do Estudo` | **Monumento "O Pantanal" - Praça dos Tuiuiús** | Atrativo Turístico | `-21.696947, -57.887997` |
| **#11** | `Fora do Estudo` | **Praça do Tererê** | Atrativo Turístico | `-21.698029, -57.888845` |
| **#12** | `Fora do Estudo` | **Monumento "O Pioneiro"** | Atrativo Turístico | `-21.696704, -57.883995` |
| **#13** | `Fora do Estudo` | **Monumento ao Lenhador** | Atrativo Turístico | `-21.700605, -57.886344` |
| **#14** | `Fora do Estudo` | **Monumento ao Chalaneiro** | Atrativo Turístico | `-21.699507, -57.888807` |
| **#15** | `Fora do Estudo` | **Monumento ao Aguatero** | Atrativo Turístico | `-21.700624, -57.886373` |
| **#16** | `Fora do Estudo` | **Cine Teatro Murtinhense Ney Machado Mesquita** | Atrativo Turístico | `-21.698846, -57.889623` |
| **#17** | `Fora do Estudo` | **Edificação Ismail Ali Alouie** | Atrativo Turístico | `-21.694141, -57.882718` |
| **#18** | `Fora do Estudo` | **Edificação Rafael Cortada Codorniz** | Atrativo Turístico | `-21.700588, -57.882710` |
| **#19** | `Fora do Estudo` | **Edificação Nelson Cintra Ribeiro** | Atrativo Turístico | `-21.700578, -57.882774` |
| **#20** | `Fora do Estudo` | **Rio Negro** | Atrativo Turístico | `-19.437949, -54.987846` |
| **#21** | `Fora do Estudo` | **Rio Perdido** | Atrativo Turístico | `-21.605945, -57.079989` |
| **#22** | `Fora do Estudo` | **Rio Abobral** | Atrativo Turístico | `-19.316611, -57.263629` |
| **#23** | `Fora do Estudo` | **Rio Vermelho** | Atrativo Turístico | `-19.645958, -56.761299` |
| **#24** | `Fora do Estudo` | **Monumento do Touro Candil** | Atrativo Turístico | `-21.694913, -57.886005` |
| **#25** | `Fora do Estudo` | **Praça do Tererê** | Atrativo Turístico | `-21.697960, -57.889242` |

---

### 3.7. PR - Barracão
- **Mapa Interativo Individual**: [mapa_PR_Barracao.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_PR_Barracao.html)
- **Centro Geométrico dos CNPJs**: Latitude `-26.239740`, Longitude `-53.635083` (*42 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `4º` | **Igreja Histórica de São José** | Atrativo Turístico | `-26.230417, -53.582244` |
| **#2** | `1º` | **Marco das Três Fronteiras** | Turismo de fronteira, histórico e contemplativo | `-26.252692, -53.635789` |
| **#3** | `Secundário / Complementar` | **Vale do Capanema** | Atrativo Turístico | `-26.230369, -53.582169` |
| **#4** | `2º` | **Gruta de Santa Emília de Rodat** | Atrativo Turístico | `-26.230267, -53.449677` |
| **#5** | `Acesso / Infraestrutura` | **BR - 163** | Atrativo Turístico | `-26.252505, -53.635048` |

---

### 3.8. PR - Capanema
- **Mapa Interativo Individual**: [mapa_PR_Capanema.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_PR_Capanema.html)
- **Centro Geométrico dos CNPJs**: Latitude `-25.646431`, Longitude `-53.771545` (*60 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `2º` | **Salto do Rio Silva Jardim** | Atrativo Turístico | `-25.659916, -53.789762` |
| **#2** | `Secundário / Complementar` | **Ilha do Cavalo** | Atrativo Turístico | `-25.558614, -53.753800` |
| **#3** | `Secundário / Complementar` | **Balneário Martini** | Atrativo Turístico | `-25.600977, -53.779376` |
| **#4** | `Secundário / Complementar` | **Balneário/Camping Kaú** | Atrativo Turístico | `-25.584888, -53.871538` |
| **#5** | `Secundário / Complementar` | **Camping Ecológico Wesling** | Atrativo Turístico | `-25.589796, -53.912423` |
| **#6** | `Secundário / Complementar` | **Camping Por do Sol** | Atrativo Turístico | `-25.600399, -53.775821` |
| **#7** | `Acesso / Infraestrutura` | **BR - 163** | Atrativo Turístico | `-25.669926, -53.808516` |

---

### 3.9. PR - Foz do Iguaçu
- **Mapa Interativo Individual**: [mapa_PR_Foz_do_Iguacu.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_PR_Foz_do_Iguacu.html)
- **Centro Geométrico dos CNPJs**: Latitude `-25.529355`, Longitude `-54.561802` (*2153 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `Secundário / Complementar` | **Adrena Kart Kartódromo** | Atrativo Turístico | `-25.556196, -54.567683` |
| **#2** | `Secundário / Complementar` | **Aguaray Eco** | Atrativo Turístico | `-25.597498, -54.528026` |
| **#3** | `Secundário / Complementar` | **AquaFoz** | Atrativo Turístico | `-25.614131, -54.480462` |
| **#4** | `Secundário / Complementar` | **Aquamania** | Atrativo Turístico | `-25.582401, -54.527748` |
| **#5** | `Secundário / Complementar` | **Bike Poço Preto** | Atrativo Turístico | `-25.613300, -54.481200` |
| **#6** | `Secundário / Complementar` | **Blue Park** | Atrativo Turístico | `-25.566221, -54.553788` |
| **#7** | `1º` | **Cataratas del Iguazú – Arg.** | Atrativo Turístico | `-25.665740, -54.450302` |
| **#8** | `1º` | **Cataratas do Iguaçu – Brasil** | Atrativo natural | `-25.680718, -54.437353` |
| **#9** | `Secundário / Complementar` | **Dreams Park Show** | Atrativo Turístico | `-25.589863, -54.517035` |
| **#10** | `Secundário / Complementar` | **Falls Bike Tour** | Atrativo Turístico | `-25.556527, -54.573061` |
| **#11** | `Secundário / Complementar` | **Fly Foz – Paraquedismo** | Atrativo Turístico | `-25.460489, -54.596772` |
| **#12** | `1º` | **Helisul Experience – Cataratas** | Atrativo Turístico | `-25.612698, -54.481561` |
| **#13** | `3º` | **Helisul Experience – Itaipu** | Atrativo Turístico | `-25.612620, -54.481164` |
| **#14** | `Secundário / Complementar` | **Iguassu by Bike** | Atrativo Turístico | `-25.613990, -54.481616` |
| **#15** | `3º` | **Itaipu Iluminada** | Atrativo Turístico | `-25.446784, -54.584005` |
| **#16** | `3º` | **Itaipu Panorâmica** | Atrativo Turístico | `-25.446755, -54.583919` |
| **#17** | `3º` | **Itaipu Refúgio Biológico** | Atrativo Turístico | `-25.446801, -54.583937` |
| **#18** | `Secundário / Complementar` | **Kattamaram** | Atrativo Turístico | `-25.433144, -54.558661` |
| **#19** | `5º` | **Macuco Safari** | Atrativo de aventura e natureza | `-25.651050, -54.438061` |
| **#20** | `4º` | **Marco das Três Fronteiras** | Atrativo cultural e paisagístico | `-25.589927, -54.590240` |
| **#21** | `Secundário / Complementar` | **Mesquita Omar Ibn Al-Khattab** | Atrativo Turístico | `-25.520306, -54.578583` |
| **#22** | `2º` | **Parque das Aves** | Atrativo natural | `-25.613720, -54.482555` |
| **#23** | `1º` | **Pôr do Sol nas Cataratas** | Atrativo Turístico | `-25.493235, -54.591989` |
| **#24** | `Secundário / Complementar` | **Templo Budista Chen Tien** | Atrativo Turístico | `-25.474384, -54.599012` |
| **#25** | `3º` | **Turismo Itaipu** | Atrativo Turístico | `-25.446728, -54.584163` |
| **#26** | `Secundário / Complementar` | **Wonder Park Foz** | Atrativo Turístico | `-25.608840, -54.488979` |
| **#27** | `Secundário / Complementar` | **Yup Star – Roda Gigante** | Atrativo Turístico | `-25.586507, -54.588183` |
| **#28** | `Secundário / Complementar` | **Catedral** | Atrativo Turístico | `-25.497350, -54.573406` |
| **#29** | `Secundário / Complementar` | **Centro Comercial - Paraguai** | Atrativo Turístico | `-25.509377, -54.607232` |
| **#30** | `Secundário / Complementar` | **Museu El Mensú - Paraguai** | Atrativo Turístico | `-25.513062, -54.614517` |
| **#31** | `Secundário / Complementar` | **Salto Monday - Paraguai** | Atrativo Turístico | `-25.559241, -54.631532` |
| **#32** | `Secundário / Complementar` | **Duty Free - Argentina** | Atrativo Turístico | `-25.599262, -54.563950` |
| **#33** | `4º` | **Marco das 3 fronteiras (Argentina)** | Atrativo Turístico | `-25.594706, -54.590752` |
| **#34** | `1º` | **Cataratas (Argentina)** | Atrativo Turístico | `-25.676833, -54.455519` |
| **#35** | `Secundário / Complementar` | **Feirinha da Argentina** | Atrativo Turístico | `-25.593900, -54.573899` |
| **#36** | `Secundário / Complementar` | **Feira do centro da cidade - Argentina** | Atrativo Turístico | `-25.596274, -54.574800` |
| **#37** | `Acesso / Infraestrutura` | **BR - 277** | Atrativo Turístico | `-25.492314, -54.514795` |
| **#38** | `1º` | **Aeroporto Internacional de Foz do Iguaçu/Cataratas** | Atrativo Turístico | `-25.597750, -54.488522` |

---

### 3.10. PR - Guaíra
- **Mapa Interativo Individual**: [mapa_PR_Guaira.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_PR_Guaira.html)
- **Centro Geométrico dos CNPJs**: Latitude `-24.078881`, Longitude `-54.052868` (*160 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `2º` | **Mirante com vista para o Rio Paraná** | Atrativo Turístico | `-25.293579, -54.586636` |
| **#2** | `1º` | **Parque Nacional de Ilha Grande** | Atrativo Turístico | `-23.709191, -54.024549` |
| **#3** | `Secundário / Complementar` | **Centro Náutico Recreativo (Marinas)** | Atrativo Turístico | `-24.079134, -54.261988` |
| **#4** | `Secundário / Complementar` | **Lagoa Saraiva** | Atrativo Turístico | `-24.017055, -54.175858` |
| **#5** | `3º` | **Igreja Nossa Senhora dos Navegantes** | Atrativo Turístico | `-23.951504, -54.246166` |
| **#6** | `5º` | **Kartódromo Ayrton Senna** | Atrativo Turístico | `-23.960256, -54.246202` |
| **#7** | `Secundário / Complementar` | **Trilha Marinas** | Atrativo Turístico | `-24.079091, -54.262147` |
| **#8** | `Secundário / Complementar` | **Estação Motorhome** | Atrativo Turístico | `-24.079261, -54.261151` |
| **#9** | `Secundário / Complementar` | **Praça do Japão Mitsuaki Shiomi** | Atrativo Turístico | `-24.090603, -54.255919` |
| **#10** | `4º` | **Cine Teatro  Sete Quedas** | Atrativo Turístico | `-24.077139, -54.257984` |
| **#11** | `Secundário / Complementar` | **Cruzeiro das Américas** | Atrativo Turístico | `-24.079144, -54.261923` |
| **#12** | `Secundário / Complementar` | **Praia do Sol** | Atrativo Turístico | `-24.078997, -54.262031` |
| **#13** | `4º` | **Museu Sete Quedas** | Turismo histórico, cultural e patrimonial | `-24.079200, -54.261200` |
| **#14** | `Secundário / Complementar` | **Vila Velha** | Atrativo Turístico | `-24.080884, -54.258943` |
| **#15** | `Secundário / Complementar` | **Locomotiva nº 04** | Atrativo Turístico | `-24.077401, -54.256760` |
| **#16** | `5º` | **Ponte Ayrton Senna** | Turismo de contemplação, engenharia e fronteira | `-24.056968, -54.259384` |
| **#17** | `Secundário / Complementar` | **Feira do Produtor** | Atrativo Turístico | `-24.085413, -54.249898` |
| **#18** | `2º` | **Rio Paraná** | Turismo náutico, contemplativo e de aventura | `-24.085638, -54.282631` |
| **#19** | `3º` | **Igreja Nuestro Señor Del Perdón** | Turismo histórico, religioso e cultural | `-24.079261, -54.258518` |
| **#20** | `Secundário / Complementar` | **Maracaju dos Gaúchos** | Atrativo Turístico | `-24.201812, -54.200308` |
| **#21** | `Secundário / Complementar` | **Feira do Artesão** | Atrativo Turístico | `-20.312836, -48.288040` |
| **#22** | `1º` | **Ilha São Francisco** | Atrativo Turístico | `-24.067262, -54.255173` |
| **#23** | `Acesso / Infraestrutura` | **Portal Turístico** | Atrativo Turístico | `-24.075133, -54.242175` |
| **#24** | `1º` | **Parque do Lago - Rogério Manuel Gonçalvez** | Atrativo Turístico | `-24.087626, -54.242591` |
| **#25** | `Secundário / Complementar` | **Atelíê do Frei Pacífico** | Atrativo Turístico | `-24.080311, -54.247936` |
| **#26** | `Acesso / Infraestrutura` | **BR - 163** | Atrativo Turístico | `-24.085011, -54.243613` |
| **#27** | `Acesso / Infraestrutura` | **BR - 272** | Atrativo Turístico | `-24.105555, -54.263160` |
| **#28** | `Acesso / Infraestrutura` | **Aeroporto Municipal Walter Martins de Oliveira** | Atrativo Turístico | `-24.080182, -54.187487` |
| **#29** | `Secundário / Complementar` | **Porto de Guaíra** | Atrativo Turístico | `-24.069839, -54.241336` |

---

### 3.11. PR - Medianeira
- **Mapa Interativo Individual**: [mapa_PR_Medianeira.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_PR_Medianeira.html)
- **Centro Geométrico dos CNPJs**: Latitude `-25.294498`, Longitude `-54.027084` (*219 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `5º` | **Sítio da Marlene** | Atrativo Turístico | `-25.317283, -54.021846` |
| **#2** | `5º` | **Sítio do Beto** | Turismo rural, gastronômico e de experiência | `-25.315209, -54.034660` |
| **#3** | `5º` | **Recanto Olivo** | Turismo rural, gastronômico e de experiência | `-25.235213, -54.066261` |
| **#4** | `5º` | **Recanto Ilha do Sol** | Atrativo Turístico | `-25.304880, -54.102692` |
| **#5** | `5º` | **Cachoeira da Maralúcia** | Atrativo Turístico | `-25.189855, -54.040232` |
| **#6** | `5º` | **Circuito Medianeira Rural** | Turismo rural, gastronômico e de experiência | `-25.295439, -54.088270` |
| **#7** | `Secundário / Complementar` | **Espigão do Norte** | Atrativo Turístico | `-25.199699, -54.068592` |
| **#8** | `1º` | **Morro da Salete** | Turismo religioso, natural e paisagístico | `-25.296718, -54.037362` |
| **#9** | `Acesso / Infraestrutura` | **Rota da fé** | Atrativo Turístico | `-25.229686, -54.073264` |
| **#10** | `Acesso / Infraestrutura` | **BR - 277** | Atrativo Turístico | `-25.286950, -54.095679` |
| **#11** | `Acesso / Infraestrutura` | **BR - 495** | Atrativo Turístico | `-25.287140, -54.095679` |
| **#12** | `4º` | **Aeroporto Municipal Medianeira (SSMD)** | Atrativo Turístico | `-25.308900, -54.075140` |

---

### 3.12. SC - Dionísio Cerqueira
- **Mapa Interativo Individual**: [mapa_SC_Dionisio_Cerqueira.html](file:///c:/Users/eduardo.figueira/Downloads/Sele%C3%A7%C3%A3o%20dos%20pontos%20para%20aferi%C3%A7%C3%A3o/mapas_afericao/mapa_SC_Dionisio_Cerqueira.html)
- **Centro Geométrico dos CNPJs**: Latitude `-26.272137`, Longitude `-53.616955` (*157 empresas geocodificadas*)

#### Tabela de Atrativos e Ordem de Importância
| N.º no Mapa | Ordem de Importância | Nome do Atrativo | Categoria | Coordenadas GPS |
| :-: | :-: | :--- | :--- | :--- |
| **#1** | `Acesso / Infraestrutura` | **BR - 163** | Atrativo Turístico | `-26.252458, -53.635154` |
| **#2** | `Secundário / Complementar` | **Cânion do Assentamento** | Atrativo Turístico | `-26.274703, -53.374764` |
| **#3** | `5º` | **Cachoeira do Toldo** | Atrativo Turístico | `-26.303524, -53.617435` |
| **#4** | `Secundário / Complementar` | **Praça Professor Dalilo Quintino Pereira** | Atrativo Turístico | `-26.253832, -53.640510` |
| **#5** | `Acesso / Infraestrutura` | **Aeroporto de Dionísio Cerqueira - SND6** | Atrativo Turístico | `-26.287447, -53.631927` |

---

## 4. Orientações para a Decisão Qualitativa Manual

Ao analisar o mapa de cada município, o profissional deverá priorizar:
1. **Pontos de Intersecção Máxima**: Locais onde os pontos vermelhos (alta sobreposição de rotas) se alinham diretamente no vetor entre o **Centroide de CNPJs** e os **Atrativos #1 e #2** (mais importantes).
2. **Corredores de Funil de Tráfego**: Cruzamentos indicados pelas manchas mais intensas do Heatmap TomTom situados antes da dispersão dos visitantes pelos atrativos secundários.
3. **Barreiras e Pontos de Controle Natural**: Pontes (ex: Ponte Ayrton Senna), trevos rodoviários (ex: BR-163 / BR-277) e avenidas de fluxo único de fronteira (ex: Fronteira Seca BR-AR).
