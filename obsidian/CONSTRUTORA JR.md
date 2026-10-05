---
projeto: CONSTRUTORA JR
empresa: JR Construções
slogan: Sua obra em boas mãos
status: em uso
versao: 1.7.0
atualizado: 2026-10-05
link: https://teccelia2001-ux.github.io/construcao-jr/
repositorio: https://github.com/teccelia2001-ux/construcao-jr
branch: claude/happy-gauss-jjrtqt
tags:
  - projeto
  - app
  - construtora
---

# 🏗️ CONSTRUTORA JR — App de gestão

> [!info] Acesso
> - **Link do app:** https://teccelia2001-ux.github.io/construcao-jr/
> - **Código (GitHub):** https://github.com/teccelia2001-ux/construcao-jr
> - **Versão atual:** `v1.7.0` (2026-10-05)
> - Funciona no **celular, tablet e computador**, e também **offline**.

## 📋 Solicitação original

Criar um app para a construtora com **uma aba para cada item**:

- [x] **Agenda de obras:** cadastrar clientes e a duração da obra. O calendário foi depois **removido** e a aba virou **Obras**.
- [x] **Faturamento** da construtora por **semana, mês e ano**, com **gráficos**.
- [x] **Vale combustível** para os funcionários: colaborador, posto e valor liberado.
- [x] **Orçamento de cada obra:**
  - [x] Itens pré-definidos (tijolo, cimento, areia…), em que só se preenche a quantidade.
  - [x] Serviço ou item avulso não cadastrado.
  - [x] Valor de cada item.
  - [x] **PDF** para enviar ao cliente pelo **WhatsApp**.
- [x] **Pagamento de funcionários:** cadastro, diárias e faltas, com relatório **quinzenal e mensal** (as duas opções).
- [x] **Gastos** do mês, da semana e da quinzena.
- [x] **Empreitada:** obras pequenas.
- [x] Mesmo visual ("skin") do app Agenda do Salão. Depois foi trocado pela **identidade azul da JR Construções**.
- [x] **Informações por cidade** (ex.: Lavras da Mangabeira) e uma aba que **soma todas as cidades**.

## 🗂️ Abas do app

| Aba | O que faz |
|---|---|
| 🌎 **Todas as cidades** | Soma todas as cidades: faturamento, gastos, saldo, a receber, comparativo e PDF |
| 🏗️ **Obras** | Lista de obras com busca, filtro por status e andamento pelo prazo. Ficha da obra com recebimentos, gastos e orçamentos, mais o cadastro de clientes |
| 💰 **Faturamento** | Recebimentos com totais da semana, do mês e do ano, e gráficos |
| ⛽ **Combustível** | Vale (colaborador, posto, valor) **sem placa**, com PDF do vale e relatório |
| 🧾 **Orçamentos** | Catálogo pré-cadastrado, itens avulsos, desconto e PDF para o WhatsApp |
| 👷 **Funcionários** | Adicionar, editar, ficha completa, ativo ou inativo e faltas (com motivo e se desconta) |
| 💵 **Pagamentos** | Relatório da 1ª quinzena, 2ª quinzena ou do mês, com bruto, vales, valor a pagar e PDF |
| 📉 **Gastos** | Semana, quinzena e mês: mão de obra mais despesas, comparados com o faturamento |
| 🔨 **Empreitada** | Serviços pequenos: valor, prazo, responsável e recebimentos |
| ⚙️ **Configurações** | Dados da empresa, cidades, backup e restauração, link, instalar app e versão |

## 📍 Cidades

- No topo há o seletor **📍 Cidade** (ex.: Lavras da Mangabeira). A cidade escolhida filtra **todas as abas**.
- A opção **🌎 Todas as cidades** soma tudo. A aba **Todas as cidades** mostra o resumo e a comparação de cada cidade.
- Para cadastrar, renomear ou excluir cidades: **➕ Adicionar / editar cidades…** no seletor, ou ⚙️ → Cidades.
- Recebimentos e gastos de uma obra seguem a cidade da obra. Vales e faltas seguem a cidade do funcionário, e o orçamento a cidade do cliente.
- Os dados de antes das cidades foram para **Lavras da Mangabeira**. Para mudar um registro de cidade, use o **Editar** dele.

## 📏 Regras de negócio

> [!important] Vale combustível = adiantamento de salário
> O vale é **descontado automaticamente** no pagamento do funcionário.
> Em **Gastos** ele **não soma de novo**, porque já está dentro da mão de obra. Ali aparece só como "já adiantado".

- **Dias trabalhados:** domingos nunca contam. O sábado conta ou não conforme ⚙️ → *Trabalha sábado*.
- **Faltas:**
  - Podem ser de um dia ou de um período, inteiras ou meia (meia falta = 0,5 dia).
  - **Atestado e folga** podem ser marcados para **não descontar**.
- **Funcionário novo:** o pagamento conta a partir da **data de admissão**.
- **PDFs:**
  - **No celular:** abre o compartilhamento do sistema para mandar pelo WhatsApp.
  - **No computador:** o arquivo é baixado direto na pasta Downloads.
- **Dados:**
  - Ficam salvos **no próprio aparelho**.
  - Para passar os dados para outro aparelho, use ⚙️ → **Exportar backup** e depois **Importar**.

## 📲 Instalar como aplicativo (sem a barra do navegador)

- **Android (Chrome):** use o botão **Instalar** do app, ou ⋮ → *Instalar app*.
- **iPhone (Safari):** Compartilhar ⬆️ → *Adicionar à Tela de Início*.
- **Computador (Chrome ou Edge):** clique no ícone de instalar na barra de endereço.
- Depois de instalado, abra sempre **pelo ícone** da tela inicial.

## 🔄 Versão e atualização

- A versão aparece no topo do app e em ⚙️.
- Quando sai uma versão nova, aparece a faixa **"Nova versão disponível"** com o botão **Atualizar agora**. Atualizar **não apaga os dados**.
- **Para publicar uma versão nova:** mude o número, sempre igual, em três lugares e envie para o GitHub:
  - `APP_VERSION` no `app.js`;
  - `version.json`;
  - os `?v=` do `index.html`.

## 🎨 Identidade visual

- Azul-marinho com detalhes em azul e prata, nas cores da logo.
- A logo aparece no topo, na tela de abertura, como marca-d'água no fundo, no ícone do celular e no cabeçalho dos PDFs.

## 🕓 Histórico de versões

| Versão | O que mudou |
|---|---|
| 1.0.0 | Primeira versão: agenda, faturamento, vale combustível, orçamentos, pagamentos, gastos e empreitada |
| 1.1.0 | Versão na tela, botão Atualizar, modo offline e link de acesso |
| 1.1.1 | Vale combustível sem o campo de placa |
| 1.1.2 | PDFs baixados direto no computador |
| 1.3.0 | Aba Funcionários exclusiva; vale tratado como adiantamento de salário |
| 1.3.1 | Correção do botão Atualizar |
| 1.4.0 | Logo da JR Construções, tema azul, ícone e tela de abertura |
| 1.5.0 | Aba **Obras** no lugar do calendário |
| 1.5.1 | Logo completa no topo |
| 1.6.0 | Responsivo para qualquer tela e instalação como aplicativo |
| 1.7.0 | Informações por cidade (seletor 📍 no topo) e aba **Todas as cidades** |

## 📌 Pendências e ideias

- [ ] **Link mais curto:** mostrar só "CONSTRUTORA JR" em vez de `teccelia2001-ux.github.io/construcao-jr`. Há três caminhos:
  - [ ] **Domínio próprio**, por exemplo `construtorajr.com.br`. Custa cerca de R$ 40 por ano no registro.br. Exige configurar o DNS e o GitHub Pages.
  - [ ] **Link curto grátis**, por exemplo `tinyurl.com/construtorajr`. Ele só redireciona para o link longo.
  - [ ] **Usar só o app instalado.** Assim não aparece endereço nenhum. Dá para mudar o nome do ícone para "CONSTRUTORA JR".
  - ⚠️ Se mudar de endereço, faça antes **Exportar backup** e depois **Importar** no novo endereço, porque os dados ficam presos ao endereço antigo.

## 🤖 Claude (quem programa o app)

> [!tip] Como pedir uma mudança
> Abra o **Claude Code** (claude.ai/code) no repositório `construcao-jr` e escreva o pedido em português, do jeito que falaria com uma pessoa. Ex.: *"Na aba Gastos, mostrar também o total do ano"*.

- **Branch publicado (o link do app):** `claude/happy-gauss-jjrtqt`. Só o que está nele aparece no celular.
- Cada sessão nova do Claude pode trabalhar em **outro branch** (ex.: `claude/nice-dirac-z3bx1f`). Para a mudança chegar ao app, peça: *"Juntar no branch claude/happy-gauss-jjrtqt"*.
- **O que o Claude deve fazer a cada versão nova:**
  - [ ] Aumentar a versão nos três lugares: `APP_VERSION` no `app.js`, `version.json` e os `?v=` do `index.html`.
  - [ ] Atualizar o `README.md`.
  - [ ] Atualizar esta nota: versão, abas, regras e o **Histórico de versões**.
  - [ ] Enviar para o GitHub.
- **Sessões do Claude no projeto:**
  - [Sessão 1: app, cidades e nota do Obsidian](https://claude.ai/code/session_01QEUz4CRegPQeh3E37n9JDN)
  - [Sessão 2: seção do Claude nesta nota](https://claude.ai/code/session_01HB5g8hTCCjQNWwWXcTXjLj)

## 🧩 Estrutura técnica

- App web estático (HTML, CSS e JavaScript), publicado no **GitHub Pages**.
- Arquivos principais:
  - `index.html`: a página do app.
  - `app.js`: toda a lógica.
  - `styles.css`: o visual.
  - `manifest.json`: configuração do app instalado.
  - `sw.js`: modo offline.
  - `version.json`: número da versão publicada.
  - `img/`: logo e ícones.
  - `vendor/`: bibliotecas de gráficos e PDF.
- Os dados ficam no navegador (`localStorage`), na chave `construtora-jr-v1`.
