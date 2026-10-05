# JR Construções — App de gestão

> Sua obra em boas mãos

App web (funciona no celular e no computador, inclusive offline) para a gestão da construtora. Os dados ficam no banco (Supabase) e o acesso é por e-mail e senha, com dois níveis: **administrador** (lança e altera) e **leitor** (só consulta). Veja `supabase/banco.sql` para montar o banco.

## Abas

| Aba | O que faz |
|---|---|
| 🌎 **Todas as cidades** | Soma todas as cidades: faturamento, gastos, saldo, a receber, obras e funcionários, com um card por cidade, gráfico comparativo, tabela e PDF (semana, quinzena, mês ou ano) |
| 🏗️ **Obras** | Lista de obras com busca e filtros por status, andamento pelo prazo (dias que faltam ou de atraso), troca rápida de status e ficha da obra com contrato, recebimentos, gastos e orçamentos. Também tem o cadastro de clientes |
| 💰 **Faturamento** | Recebimentos com totais da semana, do mês e do ano e gráficos por semana, mês (com os gastos ao lado) e ano |
| ⛽ **Combustível** | Vales para os colaboradores (colaborador, posto e valor). O vale é **adiantamento de salário** e é descontado automaticamente no pagamento. Gera o vale em PDF para assinar e o relatório do período |
| 🧾 **Orçamentos** | Itens pré-cadastrados (tijolo, cimento, areia…), em que você só preenche a quantidade. Valor por item, itens/serviços avulsos, desconto, PDF para enviar ao cliente pelo WhatsApp |
| 👷 **Funcionários** | Cadastro completo (função, diária, telefone, CPF, PIX, admissão, endereço), ficha de cada funcionário, busca, ativos e inativos, faltas de um ou vários dias, com motivo (atestado e folga podem não descontar) |
| 💵 **Pagamentos** | Relatório **quinzenal (1ª/2ª)** ou **mensal**: dias trabalhados, faltas, valor bruto, vales descontados e valor a pagar, em PDF |
| 📉 **Gastos** | Gastos da semana, quinzena e mês: mão de obra (diárias − faltas, com os vales já incluídos) + despesas lançadas, comparados com o faturamento |
| 🔨 **Empreitada** | Obras pequenas: serviço, cliente, valor combinado, prazo, responsável e recebimentos, que entram no faturamento |

## Cidades

No topo do app fica o **📍 seletor de cidade** (ex.: *Lavras da Mangabeira*). Escolhida uma cidade, **todas as abas** mostram só o que é dela: obras, clientes, faturamento, vales, orçamentos, funcionários, pagamentos, gastos e empreitadas. A opção **🌎 Todas as cidades** soma tudo.

- Para cadastrar, renomear ou excluir cidades, use **➕ Adicionar / editar cidades…** no seletor, ou ⚙️ → *Cidades*.
- Um registro novo entra na cidade escolhida. Com *Todas as cidades*, o formulário pergunta a cidade.
- Recebimentos e despesas de uma obra ficam na cidade da obra. Vales e faltas ficam na cidade do funcionário, e o orçamento na cidade do cliente.
- Os dados antigos, de antes das cidades, foram colocados na primeira cidade (Lavras da Mangabeira). Dá para renomeá-la.

## Como usar

Link: **https://teccelia2001-ux.github.io/construcao-jr/**

O app se adapta a qualquer tela: celular pequeno ou grande, em pé ou deitado, tablet, notebook e monitor grande.

**Instalar como aplicativo (tela cheia, sem a barra do navegador):** ao abrir o link no celular, aparece a faixa **"Use como aplicativo"** com o botão **Instalar**. Ele também fica em ⚙️ → *Instalar como aplicativo*.
- **Android (Chrome):** o botão instala direto ou mostra o caminho ⋮ → *Instalar app*.
- **iPhone (Safari):** Compartilhar ⬆️ → *Adicionar à Tela de Início*.
- **Computador (Chrome/Edge):** ícone de instalar na barra de endereço.

Depois de instalado, abra sempre pelo ícone da tela inicial.

**PDFs:** no celular, o botão de PDF abre o compartilhamento do sistema para enviar pelo WhatsApp. No computador, o PDF é baixado direto na pasta Downloads.

## Visual

Identidade da JR Construções: azul-marinho com detalhes em azul e prata, nas cores da logo.

- A logo e os ícones ficam em `img/`: `icon-192/512.png` é o ícone da tela inicial, `logo.jpg` é a tela de abertura e o fundo, `logo-pdf.jpg` vai no cabeçalho dos PDFs.
- As cores ficam nas variáveis no topo do `styles.css`.

## Link para o celular (GitHub Pages)

Endereço: **https://teccelia2001-ux.github.io/construcao-jr/**

Para ativar (uma vez só):
1. No GitHub, abra **Settings → General** e, em *Danger Zone*, use **Change visibility → Public**. Repositório privado só tem Pages no plano pago.
2. Em **Settings → Pages**, escolha *Source: Deploy from a branch*, o branch `claude/happy-gauss-jjrtqt` e a pasta `/ (root)`, e clique em **Save**.
3. Em 1 ou 2 minutos o link começa a funcionar.

## Versão e atualização

- A versão aparece no topo do app (ex.: `v1.1.0`) e em ⚙️ → *Versão do app*.
- O app verifica sozinho, ao abrir e a cada 30 minutos, se há versão nova no site. Quando há, aparece uma faixa verde com o botão **Atualizar agora**.
- Atualizar **não apaga os dados**: eles ficam no aparelho.
- **Para publicar uma versão nova:** aumente o número, sempre igual, em três lugares: `APP_VERSION` (início do `app.js`), `version.json` e os `?v=` do `index.html`. Depois envie para o GitHub.
- O botão **Atualizar** limpa a cópia offline, baixa os arquivos novos e confere se a versão mudou. Se não mudou, tenta mais uma vez sozinho.
- O app funciona offline com a última versão baixada.
