# Construtora JR — App de gestão

App web (funciona no celular e no computador, inclusive offline) para a gestão da construtora. Os dados ficam salvos no próprio aparelho, com backup e restauração em arquivo na tela ⚙️.

## Abas

| Aba | O que faz |
|---|---|
| 📅 **Agenda** | Cadastro de clientes e obras (início, término, duração, status, valor) em um calendário mensal |
| 💰 **Faturamento** | Recebimentos com totais da semana, do mês e do ano e gráficos por semana, mês (com os gastos ao lado) e ano |
| ⛽ **Combustível** | Vales para os colaboradores (colaborador, posto e valor). O vale é **adiantamento de salário** e é descontado automaticamente no pagamento. Gera o vale em PDF para assinar e o relatório do período |
| 🧾 **Orçamentos** | Itens pré-cadastrados (tijolo, cimento, areia…), em que você só preenche a quantidade. Valor por item, itens/serviços avulsos, desconto, PDF para enviar ao cliente pelo WhatsApp |
| 👷 **Funcionários** | Cadastro completo (função, diária, telefone, CPF, PIX, admissão, endereço), ficha de cada funcionário, busca, ativos e inativos, faltas de um ou vários dias, com motivo (atestado e folga podem não descontar) |
| 💵 **Pagamentos** | Relatório **quinzenal (1ª/2ª)** ou **mensal**: dias trabalhados, faltas, valor bruto, vales descontados e valor a pagar, em PDF |
| 📉 **Gastos** | Gastos da semana, quinzena e mês: mão de obra (diárias − faltas, com os vales já incluídos) + despesas lançadas, comparados com o faturamento |
| 🔨 **Empreitada** | Obras pequenas: serviço, cliente, valor combinado, prazo, responsável e recebimentos, que entram no faturamento |

## Como usar

Abra o `index.html` no navegador ou publique pelo GitHub Pages. No celular, use **"Adicionar à tela inicial"** para ele virar um app.

**PDFs:** no celular, o botão de PDF abre o compartilhamento do sistema para enviar pelo WhatsApp. No computador, o PDF é baixado direto na pasta Downloads.

## Visual

As cores ficam em variáveis no topo do `styles.css` (`--primary`, `--accent`…). Para deixar igual a outro app, troque só esses valores.

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
