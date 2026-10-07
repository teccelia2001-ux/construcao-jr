---
projeto: CONSTRUTORA JR
empresa: JR Construções
slogan: Sua obra em boas mãos
status: em uso
versao: 1.10.0
atualizado: 2026-10-07
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
> - **Versão atual:** `v1.10.0` (2026-10-07)
> - **Banco de dados:** Supabase. Entrada com **e-mail e senha**.
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
- [x] **Dados na nuvem (Supabase)** com login por e-mail e senha, nos níveis **administrador** e **leitor**.
- [x] **Validar orçamento** como **Própria** (entra nos gastos) ou **Cliente**.
- [x] Painéis de cadastro **não fecham ao clicar fora**.
- [x] **Marcar quinzena ou mês como pago**.

## 🗂️ Abas do app

| Aba | O que faz |
|---|---|
| 🌎 **Todas as cidades** | Soma todas as cidades: faturamento, gastos, saldo, a receber, comparativo e PDF |
| 🏗️ **Obras** | Lista de obras com busca, filtro por status e andamento pelo prazo. Ficha da obra com recebimentos, gastos e orçamentos, mais o cadastro de clientes |
| 💰 **Faturamento** | Recebimentos com totais da semana, do mês e do ano, e gráficos |
| ⛽ **Combustível** | Vale (colaborador, posto, valor) **sem placa**, com PDF do vale e relatório |
| 🧾 **Orçamentos** | Catálogo pré-cadastrado, itens avulsos, desconto, PDF para o WhatsApp e botão **Validar** (Própria ou Cliente) |
| 👷 **Funcionários** | Adicionar, editar, ficha completa, ativo ou inativo e faltas (com motivo e se desconta) |
| 💵 **Pagamentos** | Relatório da 1ª quinzena, 2ª quinzena ou do mês, com bruto, vales, valor a pagar e PDF. Botão **✔ Marcar como paga** |
| 📉 **Gastos** | Semana, quinzena e mês: mão de obra mais despesas, comparados com o faturamento |
| 🔨 **Empreitada** | Serviços pequenos: valor, prazo, responsável e recebimentos |
| ⚙️ **Configurações** | Dados da empresa, cidades, link, instalar app e versão |

## 📍 Cidades

- No topo há o seletor **📍 Cidade** (ex.: Lavras da Mangabeira). A cidade escolhida filtra **todas as abas**.
- A opção **🌎 Todas as cidades** soma tudo. A aba **Todas as cidades** mostra o resumo e a comparação de cada cidade.
- Para cadastrar, renomear ou excluir cidades: **➕ Adicionar / editar cidades…** no seletor, ou ⚙️ → Cidades.
- Recebimentos e gastos de uma obra seguem a cidade da obra. Vales e faltas seguem a cidade do funcionário, e o orçamento a cidade do cliente.
- Os dados de antes das cidades foram para **Lavras da Mangabeira**. Para mudar um registro de cidade, use o **Editar** dele.

## 🔐 Login e banco de dados (Supabase)

- Os dados ficam no **Supabase**, num banco na nuvem. Assim celular e computador mostram as mesmas informações.
- Para entrar, use o **e-mail e a senha** cadastrados no Supabase. O acesso é criado pelo administrador.
- Há dois níveis de acesso:
  - **Administrador:** lança, altera e exclui.
  - **Leitor:** só consulta.
- O **primeiro usuário cadastrado vira administrador**. Os seguintes entram como leitor.
- Para trocar o nível de alguém, rode isto no SQL Editor do Supabase:
  `update public.jr_perfis set papel = 'admin' where email = 'fulano@exemplo.com';`
- A estrutura do banco está no arquivo `supabase/banco.sql`. O endereço do projeto e a chave pública estão em `supabase-config.js`.
- O **backup em arquivo foi retirado**, porque os dados já ficam guardados no banco.

## 💵 Marcar quinzena ou mês como pago

- Na aba **Pagamentos**, escolha o período (1ª quinzena, 2ª quinzena ou mês) e toque em **✔ Marcar como paga**.
- Informe a **data do pagamento**, a **forma** (PIX, dinheiro…) e, se quiser, uma observação.
- Se a quinzena ainda não acabou, dá para escolher entre pagar o **período inteiro** ou só **até hoje**.
- Depois de marcado:
  - aparece o quadro verde **✅ paga em dd/mm**, com o total;
  - a tabela ganha a coluna **Pago**, com o valor de cada funcionário;
  - a ficha do funcionário mostra **✅ Paga em dd/mm**;
  - o PDF sai com **PAGO em dd/mm**.
- Cada cidade fica registrada separadamente. Em **Todas as cidades** dá para ver o que falta pagar em cada uma.
- Se o mês estiver aberto e uma quinzena dele já foi paga, aparece um aviso.
- O botão **Desfazer** desmarca o pagamento.

## ✔ Validar orçamento

- Cada orçamento tem o botão **✔ Validar**. Ao validar, escolha quem paga:
  - **🏗️ Própria:** a construtora paga. O valor do orçamento **entra em Gastos** como despesa, na data e categoria escolhidas (padrão: Material), ligada à obra e à cidade do orçamento.
  - **👤 Cliente:** o cliente paga. O orçamento fica **Aprovado** e não entra nos gastos.
- Se um orçamento validado como própria for editado, o gasto acompanha o novo valor.
- **Desfazer validação** (no mesmo botão) ou excluir o orçamento tira o gasto de Gastos.

## 📏 Regras de negócio

> [!important] Vale combustível = adiantamento de salário
> O vale é **descontado automaticamente** no pagamento do funcionário.
> Em **Gastos** ele **não soma de novo**, porque já está dentro da mão de obra. Ali aparece só como "já adiantado".

- **Dias trabalhados:** domingos nunca contam. O sábado conta ou não conforme ⚙️ → *Trabalha sábado*.
- **Faltas:**
  - Podem ser de um dia ou de um período, inteiras ou meia (meia falta = 0,5 dia).
  - **Atestado e folga** podem ser marcados para **não descontar**.
- **Salário:** conta a partir da **data de admissão** e só **até hoje**. Dias que ainda não chegaram não entram.
  - Na ficha do funcionário e em Pagamentos aparece também o valor **previsto até o fim** da quinzena ou do mês.
  - Exemplo: admitido em 06/10, com diária de R$ 120. Em 07/10, a quinzena mostra **R$ 240,00** (2 dias), com previsto até 15/10 de R$ 1.080,00.
- **PDFs:**
  - **No celular:** abre o compartilhamento do sistema para mandar pelo WhatsApp.
  - **No computador:** o arquivo é baixado direto na pasta Downloads.
- **Painéis de cadastro:** só fecham no **✕** ou em **Cancelar**. Clicar fora não fecha, para não perder o que foi digitado.
- **Dados:** ficam no **Supabase**. Qualquer aparelho com login vê as mesmas informações.

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
| 1.8.0 | Dados no **Supabase**, login por e-mail e senha (administrador e leitor), sem backup em arquivo |
| 1.9.0 | Botão **Validar orçamento** (Própria entra nos gastos, ou Cliente) e painéis que não fecham ao clicar fora |
| 1.9.1 | Salário contado **da admissão até hoje**, com a previsão até o fim do período à parte |
| 1.10.0 | **Marcar quinzena ou mês como pago**, com data, forma e valor de cada funcionário |

## 📌 Pendências e ideias

- [ ] **Link mais curto:** mostrar só "CONSTRUTORA JR" em vez de `teccelia2001-ux.github.io/construcao-jr`. Há três caminhos:
  - [ ] **Domínio próprio**, por exemplo `construtorajr.com.br`. Custa cerca de R$ 40 por ano no registro.br. Exige configurar o DNS e o GitHub Pages.
  - [ ] **Link curto grátis**, por exemplo `tinyurl.com/construtorajr`. Ele só redireciona para o link longo.
  - [ ] **Usar só o app instalado.** Assim não aparece endereço nenhum. Dá para mudar o nome do ícone para "CONSTRUTORA JR".
  - Agora que os dados estão no Supabase, mudar de endereço **não perde dados**. Basta entrar de novo com o login.

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
  - `vendor/`: bibliotecas de gráficos, PDF e Supabase.
  - `supabase-config.js`: endereço do projeto e chave pública do Supabase.
  - `supabase/banco.sql`: estrutura do banco e regras de acesso.
- Os dados ficam no **Supabase**.
