# Construtora JR — App de gestão

App web (funciona no celular e no computador, inclusive offline) para a gestão da construtora. Os dados ficam salvos no próprio aparelho, com backup e restauração em arquivo na tela ⚙️.

## Abas

| Aba | O que faz |
|---|---|
| 📅 **Agenda** | Cadastro de clientes e obras (início, término, duração, status, valor) em um calendário mensal |
| 💰 **Faturamento** | Recebimentos com totais da semana, do mês e do ano e gráficos por semana, mês (com os gastos ao lado) e ano |
| ⛽ **Combustível** | Vales para os colaboradores: colaborador, posto e valor liberado. Gera o vale em PDF para assinar e o relatório do período |
| 🧾 **Orçamentos** | Itens pré-cadastrados (tijolo, cimento, areia…), em que você só preenche a quantidade. Valor por item, itens/serviços avulsos, desconto, PDF para enviar ao cliente pelo WhatsApp |
| 👷 **Pagamentos** | Funcionários com valor da diária, lançamento de faltas (dia inteiro ou meio dia) e relatório de pagamento **quinzenal (1ª/2ª)** ou **mensal** em PDF |
| 📉 **Gastos** | Gastos da semana, quinzena e mês: mão de obra (diárias − faltas) + vales combustível + despesas lançadas, comparados com o faturamento |
| 🔨 **Empreitada** | Obras pequenas: serviço, cliente, valor combinado, prazo, responsável e recebimentos, que entram no faturamento |

## Como usar

Abra o `index.html` no navegador ou publique pelo GitHub Pages. No celular, use **"Adicionar à tela inicial"** para ele virar um app.

**Envio por WhatsApp:** no celular, o botão de PDF abre o compartilhamento do sistema e você escolhe o WhatsApp. No computador, o PDF é baixado e a conversa do cliente abre no WhatsApp Web para você anexar o arquivo.

## Visual

As cores ficam em variáveis no topo do `styles.css` (`--primary`, `--accent`…). Para deixar igual a outro app, troque só esses valores.
