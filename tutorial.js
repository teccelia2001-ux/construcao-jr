// Tutorial passo a passo de cada aba (mesmo modelo do sistema de programação):
// ilumina um ponto da tela, explica a lógica e, nos passos com ação, espera a pessoa fazer de verdade.
//
// Cada passo: `alvo` (seletor CSS, ou "@Texto" para achar botão/título pelo rótulo), `titulo`, `corpo` (HTML)
// e, se precisar: `espera` ({ seletor } = avança sozinho quando a pessoa tocar ali), `posicao: 'centro'`,
// `soAdmin` (só aparece para o administrador), `abrir` (toca nesse botão para abrir o painel, se a pessoa pulou) e `fechar` (fecha o painel aberto antes).
(() => {
  const MARGEM = 12;
  const dica = t => `<p class="tut-dica">${t}</p>`;
  const abertura = (titulo, texto, extra) => ({ titulo, corpo: `<p>${texto}</p>${dica(extra || 'Use os botões <b>Voltar</b> e <b>Próximo</b> (no computador, as setas ← → ou <b>Esc</b> para sair).')}` });
  const fim = texto => ({ titulo: 'Pronto! 🎉', corpo: `<p>${texto}</p>${dica('Quando quiser rever, toque em <b>❓ Tutorial</b> no canto da tela. Cada aba tem o seu.')}`, fechar: true });
  const lista = itens => `<ul class="tut-lista">${itens.map(i => `<li>${i}</li>`).join('')}</ul>`;
  const conta = linhas => `<div class="tut-conta">${linhas.map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('')}</div>`;
  const fluxo = passos => `<div class="tut-fluxo">${passos.map(p => `<span>${p}</span>`).join('<i>→</i>')}</div>`;

  // ---------------------------------------------------------------- Obras
  const OBRAS = [
    abertura('Aba Obras', 'Aqui ficam as <b>obras</b> (os contratos maiores) e os <b>clientes</b>. Este passo a passo mostra o que cada número quer dizer e de onde ele vem.'),
    {
      alvo: '.cidade-sel',
      titulo: 'A cidade escolhida',
      corpo: `<p>Todo registro do app (obra, cliente, funcionário, vale, gasto…) pertence a <b>uma cidade</b>. O 📍 do topo escolhe qual cidade você está vendo.</p>
        ${lista(['Com uma cidade escolhida, <b>todas as abas</b> mostram só os dados dela.', 'O que você cadastrar entra nessa cidade.', '<b>🌎 Todas as cidades</b> soma tudo junto.'])}`,
    },
    {
      alvo: '#view .grid-3',
      titulo: 'Os números do topo',
      corpo: conta([
        ['Obras em andamento', 'quantas estão com status “Em andamento” (e quantas agendadas).'],
        ['Contratos ativos', 'soma do valor do contrato de todas as obras que <b>não</b> estão concluídas.'],
        ['A receber das obras', 'para cada obra ativa: valor do contrato − recebimentos já lançados nela.'],
      ]) + dica('Por isso é importante ligar cada recebimento à sua obra: é assim que o “a receber” baixa sozinho.'),
    },
    {
      alvo: '@+ Nova obra',
      titulo: 'Cadastrar uma obra',
      corpo: `<p>Informe nome, <b>cliente</b>, endereço, cidade, <b>início</b>, <b>término previsto</b>, status e <b>valor do contrato</b>.</p>
        ${dica('A obra precisa de um cliente: cadastre o cliente antes (mais abaixo, em “+ Cliente”).')}`,
    },
    {
      alvo: '#buscaObra',
      titulo: 'Buscar',
      corpo: '<p>Digite parte do nome da obra, do cliente, do endereço ou da cidade e a lista filtra na hora.</p>',
    },
    {
      alvo: '#view .chips',
      titulo: 'Filtre pelo status',
      corpo: `<p><b>Toque em um dos filtros</b> agora. O número ao lado é quantas obras há em cada status.</p>
        ${lista(['<b>Agendada</b> — ainda não começou', '<b>Em andamento</b> — equipe trabalhando', '<b>Pausada</b> — parada por algum motivo', '<b>Concluída</b> — terminada (sai de “Ativas” e do “a receber”)'])}`,
      espera: { seletor: '.chip' },
    },
    {
      alvo: '.obra-item .progress',
      titulo: 'A barra é do prazo',
      corpo: `<p>A barra azul mostra quanto <b>do tempo</b> previsto já passou: dias desde o início ÷ dias entre início e término.</p>
        ${dica('Não é quanto da obra está pronta. Obra concluída fica sempre em 100%.')}`,
    },
    {
      alvo: '.obra-item .mini-select',
      titulo: 'Mude o status sem abrir a obra',
      corpo: '<p>Esta caixa troca o status direto da lista (ex.: de Agendada para Em andamento no dia em que a equipe começar).</p>',
    },
    {
      alvo: '.obra-item .btn[data-act="verObra"]',
      titulo: 'Abra a ficha da obra',
      corpo: '<p><b>Toque em “Detalhes”</b> para ver tudo o que foi lançado nesta obra.</p>',
      espera: { seletor: '.obra-item [data-act="verObra"]' },
    },
    {
      alvo: '#modalBg .modal',
      abrir: '.obra-item .btn[data-act="verObra"]',
      titulo: 'A ficha da obra',
      corpo: conta([
        ['Contrato', 'valor combinado · recebido · quanto <b>falta</b> receber.'],
        ['Gastos lançados na obra', 'despesas ligadas a esta obra.'],
        ['Resultado', 'recebido − gastos da obra.'],
      ]) + `<p><b>+ Recebimento</b> lança direto no Faturamento e <b>+ Gasto</b> direto em Gastos, já ligados à obra.</p>`,
      posicao: 'canto',
    },
    {
      alvo: '@Clientes',
      titulo: 'Clientes',
      corpo: `<p>Cadastro com telefone, endereço e cidade. O botão <b>WhatsApp</b> abre a conversa com o cliente.</p>
        ${dica('Um cliente que tem obras não pode ser excluído: exclua as obras primeiro.')}`,
      fechar: true,
    },
    fim('Agora você sabe de onde vêm os números das obras.'),
  ];

  // ---------------------------------------------------------------- Faturamento
  const FATURAMENTO = [
    abertura('Aba Faturamento', 'Aqui está <b>todo o dinheiro que entrou</b>. Cada entrada é um <b>recebimento</b>.'),
    {
      titulo: 'De onde vem cada recebimento',
      corpo: `<p>Um recebimento pode ser lançado em três lugares, e todos caem aqui:</p>
        ${lista(['<b>+ Lançar recebimento</b>, nesta aba;', '<b>+ Recebimento</b>, na ficha de uma obra;', '<b>Receber</b>, na aba Empreitada.'])}`,
      posicao: 'centro',
    },
    {
      alvo: '#view .grid-3',
      titulo: 'Semana, mês e ano',
      corpo: `<p>Soma dos recebimentos com data <b>nesta semana</b> (segunda a domingo), <b>neste mês</b> e <b>neste ano</b>.</p>`,
    },
    {
      alvo: '#chSemana',
      titulo: 'As últimas 12 semanas',
      corpo: '<p>Cada barra é o total recebido em uma semana. Bom para ver se a entrada de dinheiro está subindo ou caindo.</p>',
    },
    {
      alvo: '#view [data-act="fatAno"][data-d="-1"]',
      titulo: 'Mês a mês, com os gastos',
      corpo: `<p>O gráfico “Por mês” compara o <b>faturamento</b> (azul) com os <b>gastos</b> (cinza) de cada mês.</p>
        <p><b>Toque em ‹</b> para ver o ano anterior.</p>`,
      espera: { seletor: '[data-act="fatAno"]' },
    },
    {
      alvo: '#chAno',
      titulo: 'Por ano',
      corpo: '<p>Total recebido em cada ano que tem lançamentos.</p>',
    },
    {
      alvo: '@+ Lançar recebimento',
      titulo: 'Lançar um recebimento',
      corpo: `<p>Descrição, data, valor, forma de pagamento, cidade e, se for de uma obra, <b>a obra</b>.</p>
        ${dica('Ligado à obra, o valor baixa o “A receber” dela na aba Obras.')}`,
    },
    {
      alvo: '@Recebimentos de',
      titulo: 'A lista do ano',
      corpo: '<p>Todos os recebimentos do ano escolhido nas setas ‹ ›, do mais novo para o mais antigo. Toque em <b>Editar</b> para corrigir ou excluir.</p>',
    },
    fim('O faturamento é a primeira metade da conta. A outra metade fica na aba Gastos.'),
  ];

  // ---------------------------------------------------------------- Vale
  const VALE = [
    abertura('Aba Vale', 'Vale é <b>adiantamento de salário</b>: dinheiro que o funcionário recebe antes do dia do pagamento.'),
    {
      titulo: 'Dois tipos de vale',
      corpo: lista(['⛽ <b>Vale combustível</b>: o funcionário abastece em um posto conveniado e a construtora paga o posto.', '💵 <b>Vale comum</b>: empréstimo em dinheiro.']) +
        dica('Os dois são tratados igual na conta: saem do pagamento do funcionário.'),
      posicao: 'centro',
    },
    {
      alvo: '#view .card .seg',
      titulo: 'Escolha o período',
      corpo: '<p><b>Toque em Semana, Quinzena ou Mês.</b> A data de referência ao lado diz qual semana, quinzena ou mês mostrar.</p>',
      espera: { seletor: '#view .card .seg button' },
    },
    {
      alvo: '#view .grid-2',
      titulo: 'Total do período',
      corpo: '<p>Soma de todos os vales com data dentro do período e quantos foram emitidos.</p>',
    },
    {
      alvo: '@+ Novo vale',
      titulo: 'Emitir um vale',
      corpo: `<p>Escolha o tipo, o <b>colaborador</b>, o posto (só no de combustível), a data e o valor.</p>
        ${dica('O vale fica sempre na cidade do funcionário, porque é descontado no pagamento dele.')}`,
    },
    {
      alvo: '@Vales',
      titulo: 'A lista de vales',
      corpo: '<p>O botão <b>🧾</b> gera o vale em PDF para entregar no posto. O <b>📄 PDF</b> do título gera a lista do período.</p>',
    },
    {
      alvo: '@Postos de combustível',
      titulo: 'Postos conveniados',
      corpo: `<p>Cadastre os postos onde a equipe abastece.</p>${dica('Um posto com vales lançados não pode ser excluído.')}`,
    },
    {
      titulo: '🔗 Como o vale entra na conta',
      corpo: conta([
        ['Em Pagamentos', 'A pagar = salário do período − vales do período.'],
        ['Em Gastos', 'o vale já é parte da mão de obra, por isso <b>não é somado duas vezes</b>.'],
      ]),
      posicao: 'centro',
    },
    fim('Vale lançado aqui já sai descontado no pagamento, sem precisar fazer conta.'),
  ];

  // ---------------------------------------------------------------- Orçamentos (lista)
  const ORCAMENTOS = [
    abertura('Aba Orçamentos', 'Aqui você monta orçamentos com materiais e serviços, gera o PDF para o cliente e, quando aprovado, <b>valida</b> quem vai pagar.'),
    {
      alvo: '@📦 Itens cadastrados',
      titulo: 'O catálogo de itens',
      corpo: '<p>Todo orçamento parte de uma lista de materiais e serviços com <b>preço já cadastrado</b>. <b>Toque em “Itens cadastrados”</b> para ver.</p>',
      espera: { seletor: '[data-act="verCatalogo"]' },
    },
    {
      alvo: '#modalBg .modal',
      abrir: '[data-act="verCatalogo"]',
      titulo: 'Materiais e serviços',
      corpo: `<p>Cada item tem tipo (material ou serviço), unidade (saco, m², diária…) e preço.</p>
        ${dica('Mudar o preço aqui vale para os próximos orçamentos. Os que já foram salvos continuam com o preço da época.')}`,
      posicao: 'canto',
    },
    {
      alvo: '@+ Novo orçamento',
      titulo: 'Criar um orçamento',
      corpo: '<p>Abre o editor: é só preencher as quantidades. Lá dentro também tem um <b>❓ Tutorial</b> próprio.</p>',
      fechar: true,
    },
    {
      alvo: '#view .card .list-item',
      titulo: 'Cada orçamento',
      corpo: conta([
        ['Status', '<b>Pendente</b>, <b>Aprovado</b> ou <b>Recusado</b>.'],
        ['Total', 'soma de (quantidade × valor) de cada item − desconto.'],
      ]),
    },
    {
      alvo: '#view [data-act="validarOrc"]',
      titulo: 'Validar: quem paga?',
      corpo: `<p>Quando o cliente fechar, toque em <b>✔ Validar</b> e escolha:</p>
        ${lista(['🏗️ <b>Própria</b> — a construtora paga. O total vira uma <b>despesa em Gastos</b>, ligada à obra e com a categoria e a data escolhidas.', '👤 <b>Cliente</b> — o cliente paga. O orçamento fica só como aprovado.'])}
        ${dica('Se editar um orçamento “Própria” depois, o gasto acompanha o novo valor. “Desfazer validação” tira o gasto.')}`,
    },
    {
      alvo: '#view [data-act="enviarOrc"]',
      titulo: 'PDF para o cliente',
      corpo: '<p>Gera o orçamento em PDF. No celular, já abre para enviar pelo WhatsApp.</p>',
    },
    fim('Orçamento validado como “Própria” já aparece em Gastos sozinho.'),
  ];

  // ---------------------------------------------------------------- Orçamentos (editor)
  const EDITOR = [
    abertura('Montando o orçamento', 'Preencha o cabeçalho, coloque as quantidades e salve.'),
    {
      alvo: '#view .card',
      titulo: 'Cabeçalho',
      corpo: lista(['<b>Cliente</b> (o “+” cadastra um novo sem sair daqui);', '<b>Obra</b> — opcional, mostra só as obras desse cliente;', '<b>Validade</b> — começa em 15 dias;', '<b>Status</b> e <b>desconto</b> em reais.']),
    },
    {
      alvo: '#orcBusca',
      titulo: 'Ache o item',
      corpo: '<p>Digite parte do nome para filtrar a lista. Itens que já têm quantidade continuam aparecendo.</p>',
    },
    {
      alvo: '.orc-item[data-linha]',
      titulo: 'Só a quantidade',
      corpo: `<p>Digite a <b>quantidade</b>. O valor unitário vem do catálogo e pode ser mudado <b>só neste orçamento</b>.</p>
        ${conta([['Total da linha', 'quantidade × valor unitário']])}`,
    },
    {
      alvo: '[data-act="addAvulso"]',
      titulo: 'Item fora do catálogo',
      corpo: '<p>Para algo que não está cadastrado: escreva a descrição, a unidade, a quantidade e o valor.</p>',
    },
    {
      alvo: '.total-bar',
      titulo: 'Total e salvar',
      corpo: `<p>O total se atualiza enquanto você digita: soma das linhas − desconto.</p>
        ${lista(['<b>💾 Salvar</b> guarda e volta para a lista;', '<b>Salvar e enviar PDF</b> guarda e já gera o PDF.'])}
        ${dica('“‹ Voltar” sai sem salvar (o app pergunta antes).')}`,
    },
    fim('Depois de salvo, valide o orçamento na lista para dizer quem paga.'),
  ];

  // ---------------------------------------------------------------- Funcionários
  const EQUIPE = [
    abertura('Aba Funcionários', 'Cadastro da equipe e das faltas. A <b>diária</b>, a <b>data de admissão</b> e as <b>faltas</b> lançadas aqui são a base do pagamento e da mão de obra.'),
    {
      alvo: '#view .grid-3',
      titulo: 'Os números do topo',
      corpo: conta([
        ['Funcionários ativos', 'quantos estão trabalhando (inativos não contam).'],
        ['Custo por dia', 'soma das diárias de todos os ativos.'],
        ['Faltas no mês', 'total de faltas do mês escolhido (meio dia = 0,5).'],
      ]),
    },
    {
      alvo: '@+ Novo funcionário',
      titulo: 'Cadastrar',
      corpo: `<p>Nome, função, <b>valor da diária</b>, telefone, CPF, <b>data de admissão</b>, chave PIX e cidade.</p>
        ${dica('O salário só conta a partir da data de admissão. Quem sai da equipe vira <b>inativo</b> e deixa de entrar nas contas, sem perder o histórico.')}`,
    },
    {
      alvo: '#view .card .seg',
      titulo: 'Ativos e inativos',
      corpo: '<p><b>Toque em Ativos, Inativos ou Todos</b> para filtrar a lista.</p>',
      espera: { seletor: '[data-act="equipeStatus"]' },
    },
    {
      alvo: '@+ Lançar falta',
      titulo: 'Lançar uma falta',
      corpo: lista(['<b>Dia inteiro</b> desconta 1 diária; <b>meio dia</b>, meia diária.', 'Escolha o motivo (falta, atestado, folga, chuva…).', 'Desmarque <b>“Descontar do pagamento”</b> quando a falta não deve descontar (ex.: atestado).']),
    },
    {
      alvo: '.func-item .btn[data-act="verFunc"]',
      titulo: 'A ficha do funcionário',
      corpo: '<p><b>Toque em “Ficha”</b> para ver o resumo do mês dele.</p>',
      espera: { seletor: '[data-act="verFunc"]' },
    },
    {
      alvo: '#modalBg .modal',
      abrir: '.func-item .btn[data-act="verFunc"]',
      titulo: 'Resumo do mês',
      corpo: '<p>Dias trabalhados desde a admissão, faltas, vales e quanto tem a receber, além dos pagamentos já marcados.</p>',
      posicao: 'canto',
    },
    {
      alvo: '@Faltas de',
      titulo: 'Faltas do mês',
      corpo: '<p>Todas as faltas lançadas no mês. Mude o mês ou escolha um funcionário para filtrar.</p>',
      fechar: true,
    },
    fim('Com diária, admissão e faltas certas, o pagamento sai calculado sozinho na aba Pagamentos.'),
  ];

  // ---------------------------------------------------------------- Pagamentos
  const PAGAMENTOS = [
    abertura('Aba Pagamentos', 'Aqui o app <b>calcula quanto pagar</b> a cada funcionário, com base na diária, nas faltas e nos vales.'),
    {
      alvo: '#view .card .seg',
      titulo: 'Qual pagamento?',
      corpo: `${lista(['<b>1ª quinzena</b>: do dia 1 ao 15;', '<b>2ª quinzena</b>: do dia 16 ao fim do mês;', '<b>Mensal</b>: o mês inteiro.'])}<p><b>Toque em uma opção</b> e escolha o mês ao lado.</p>`,
      espera: { seletor: '[data-act="pagTipo"]' },
    },
    {
      alvo: '#view .check',
      titulo: 'Sábado',
      corpo: '<p>Marcado, o sábado conta como dia de trabalho. Domingo nunca conta.</p>',
    },
    {
      titulo: 'A conta, passo a passo',
      corpo: conta([
        ['Dias', 'dias úteis desde o início do período (ou da admissão) <b>até hoje</b>.'],
        ['Faltas', 'dia inteiro = 1, meio dia = 0,5; as que não descontam = 0.'],
        ['Trab.', 'Dias − Faltas.'],
        ['Bruto', 'Trab. × Diária.'],
        ['Vales', 'vales do funcionário dentro do período.'],
        ['A pagar', 'Bruto − Vales.'],
      ]) + dica('A pagar em vermelho = o funcionário já recebeu em vales mais do que trabalhou.'),
      posicao: 'centro',
    },
    {
      alvo: '#view .stat.hl',
      titulo: 'Total a pagar e previsto',
      corpo: `<p><b>Total a pagar</b> soma o “A pagar” de todos, contando só até hoje.</p>
        <p><b>Previsto</b> é quanto vai dar no fim do período, se todos trabalharem os dias que faltam.</p>`,
    },
    {
      alvo: '#view .pago-card',
      titulo: 'Marcar como paga',
      corpo: `<p>Depois de pagar, toque em <b>Marcar como paga</b>: fica registrado a data, a forma e quanto cada um recebeu (o período inteiro ou só até hoje).</p>
        ${dica('Depois disso, o “Total a pagar” passa a contar só os dias depois do pagamento. “Desfazer” apaga o registro.')}`,
    },
    {
      alvo: '#view table',
      titulo: 'Relatório de pagamento',
      corpo: '<p>Uma linha por funcionário com todas as colunas da conta. A coluna <b>Pago</b> aparece quando o período foi marcado como pago.</p>',
    },
    {
      alvo: '@📄 Relatório PDF',
      titulo: 'PDF',
      corpo: '<p>Gera o relatório para conferir ou guardar.</p>',
    },
    fim('O pagamento sai certo quando faltas e vales estão lançados.'),
  ];

  // ---------------------------------------------------------------- Gastos
  const GASTOS = [
    abertura('Aba Gastos', 'Aqui está <b>todo o dinheiro que saiu</b>: as despesas lançadas e a mão de obra, que o app calcula sozinho.'),
    {
      alvo: '#view .grid-3',
      titulo: 'Resumo rápido',
      corpo: '<p>Total gasto nesta semana, nesta quinzena e neste mês.</p>',
    },
    {
      alvo: '#view .card .seg',
      titulo: 'Escolha o período',
      corpo: '<p><b>Toque em Semana, Quinzena ou Mês.</b> Tudo abaixo passa a mostrar esse período.</p>',
      espera: { seletor: '#view .card .seg button' },
    },
    {
      alvo: '#view .section-head + .grid-3',
      titulo: 'Faturamento − Gastos = Saldo',
      corpo: conta([
        ['Faturamento', 'recebimentos do período.'],
        ['Gastos totais', 'mão de obra + despesas do período.'],
        ['Saldo', 'Faturamento − Gastos.'],
      ]),
    },
    {
      alvo: '@Composição dos gastos',
      titulo: 'Como o gasto é formado',
      corpo: `${conta([
        ['👷 Mão de obra', 'para cada funcionário ativo: dias trabalhados (da admissão até hoje, menos faltas) × diária.'],
        ['🧾 Categorias', 'despesas lançadas, somadas por categoria.'],
      ])}${dica('Vale é adiantamento: para cada funcionário, entra o <b>maior</b> valor entre o que ele ganhou e o que já pegou em vales. Assim nada é contado duas vezes.')}`,
    },
    {
      alvo: '#chGastos',
      titulo: 'Gráfico',
      corpo: '<p>Mostra quanto cada parte pesa no total.</p>',
    },
    {
      alvo: '@+ Lançar despesa',
      titulo: 'Lançar uma despesa',
      corpo: `<p>Descrição, data, valor, categoria, cidade e, se quiser, a obra (aparece na ficha dela).</p>
        ${dica('Orçamento validado como “Própria” entra aqui sozinho, com o nome “Orçamento Nº … · cliente (própria)”.')}`,
    },
    {
      alvo: '@Despesas lançadas',
      titulo: 'A lista e o PDF',
      corpo: '<p>Todas as despesas do período. <b>📄 PDF</b> gera o relatório de gastos.</p>',
    },
    fim('Saldo positivo: entrou mais do que saiu no período.'),
  ];

  // ---------------------------------------------------------------- Empreitada
  const EMPREITADA = [
    abertura('Aba Empreitada', 'Para <b>serviços pequenos e rápidos</b> (muro, reparo, calçada, pintura), sem precisar cadastrar uma obra completa.'),
    {
      alvo: '#view .grid-3',
      titulo: 'Os números do topo',
      corpo: conta([
        ['Em aberto', 'empreitadas que ainda não foram concluídas.'],
        ['Valor total contratado', 'soma do valor combinado de todas.'],
        ['A receber', 'para cada uma: combinado − recebido.'],
      ]),
    },
    {
      alvo: '@+ Nova empreitada',
      titulo: 'Cadastrar',
      corpo: '<p>Serviço, cliente (só o nome, não precisa de cadastro), endereço, valor combinado, início, prazo em dias e responsável.</p>',
    },
    {
      alvo: '#view [data-act="receberEmp"]',
      titulo: 'Receber',
      corpo: `<p>Ao receber, toque em <b>Receber</b>: o valor entra <b>no Faturamento</b> como “Empreitada: serviço (cliente)”.</p>
        ${dica('Quando o recebido chega ao valor combinado, a empreitada passa para <b>Concluída</b> sozinha.')}`,
    },
    fim('Empreitada recebida já conta no faturamento e no saldo.'),
  ];

  // ---------------------------------------------------------------- Todas as cidades
  const CIDADES = [
    abertura('Todas as cidades', 'A visão do dono: os números de <b>todas as cidades somados</b> e lado a lado.'),
    {
      alvo: '#view .card .seg',
      titulo: 'Período',
      corpo: '<p><b>Toque em Semana, Quinzena, Mês ou Ano</b> e escolha a data de referência.</p>',
      espera: { seletor: '#view .card .seg button' },
    },
    {
      alvo: '@Total geral',
      titulo: 'Total geral',
      corpo: conta([
        ['Faturamento', 'recebimentos de todas as cidades no período.'],
        ['Gastos', 'mão de obra + despesas de todas as cidades.'],
        ['Saldo', 'Faturamento − Gastos.'],
        ['A receber', 'o que falta receber de obras e empreitadas.'],
      ]) + dica('O botão <b>PDF</b> gera esse resumo.'),
    },
    {
      alvo: '.cid-card',
      titulo: 'Uma cidade',
      corpo: `<p>Os mesmos números, só daquela cidade, e quanto ela representa do faturamento total.</p>
        ${dica('<b>Abrir</b> escolhe a cidade no 📍 e leva você para as Obras dela.')}`,
    },
    {
      alvo: '#chCidades',
      titulo: 'Comparativo',
      corpo: '<p>Faturamento, gastos e saldo de cada cidade no mesmo gráfico. A tabela logo abaixo traz os valores.</p>',
    },
    {
      alvo: '[data-act="gerenciarCidades"]',
      titulo: 'Cadastrar cidades',
      corpo: '<p>Adicione, renomeie ou exclua cidades. Renomear muda o nome em todos os registros daquela cidade.</p>',
    },
    fim('Use esta aba para comparar as cidades e ver o resultado da empresa toda.'),
  ];

  // ---------------------------------------------------------------- Configurações: lógica geral do app
  const CONFIG = [
    abertura('Como o app funciona', 'Este tutorial mostra a <b>lógica do app inteiro</b>: de onde vem cada número e como as abas se ligam. Depois, as opções desta tela.'),
    {
      titulo: 'A pergunta principal',
      corpo: `<p>O app responde: <b>quanto entrou, quanto saiu e quanto sobrou</b>, por cidade e por período.</p>
        ${fluxo(['💰 Faturamento', '− 📉 Gastos', '= Saldo'])}`,
      posicao: 'centro',
    },
    {
      titulo: 'O que entra (faturamento)',
      corpo: fluxo(['Recebimento da obra', 'Faturamento']) + fluxo(['Recebimento da empreitada', 'Faturamento']) +
        '<p>Todo dinheiro recebido vira um <b>recebimento</b>. Ligado a uma obra ou empreitada, ele também baixa o “a receber” dela.</p>',
      posicao: 'centro',
    },
    {
      titulo: 'O que sai (gastos)',
      corpo: lista(['🧾 <b>Despesas</b> lançadas em Gastos ou na ficha da obra;', '🧾 <b>Orçamentos validados como “Própria”</b>: viram despesa sozinhos;', '👷 <b>Mão de obra</b>: calculada sozinha pelas diárias.']),
      posicao: 'centro',
    },
    {
      titulo: 'Mão de obra, faltas e vales',
      corpo: fluxo(['Diária × dias trabalhados', '− faltas', '= Bruto']) + fluxo(['Bruto', '− vales', '= A pagar']) +
        dica('Os dias contam da <b>admissão</b> até <b>hoje</b>. O vale é adiantamento: já está dentro da mão de obra, não é gasto a mais.'),
      posicao: 'centro',
    },
    {
      titulo: 'Cidades',
      corpo: '<p>Cada registro tem uma cidade. O 📍 do topo filtra <b>todas as abas</b> por ela, e a aba <b>🌎 Todas as cidades</b> soma tudo e compara as cidades.</p>',
      posicao: 'centro',
    },
    {
      titulo: 'Quem pode o quê',
      corpo: lista(['🛠️ <b>Administrador</b>: lança, altera e exclui.', '👁️ <b>Visualizador</b>: só consulta, filtra e gera PDF.']) +
        dica('Os dados ficam guardados na internet e salvam sozinhos a cada alteração. Aparecem iguais em qualquer aparelho em que você entrar.'),
      posicao: 'centro',
    },
    {
      alvo: '@Dados da empresa',
      titulo: 'Dados da empresa',
      corpo: '<p>Nome, CNPJ, telefone e endereço aparecem no cabeçalho de todos os PDFs.</p>',
    },
    {
      alvo: '@Cidades (',
      titulo: 'Cidades',
      corpo: '<p>As cidades onde a empresa trabalha. <b>Abrir</b> escolhe a cidade e vai para as obras dela.</p>',
    },
    {
      alvo: '@Acessos',
      soAdmin: true,
      titulo: 'Acessos',
      corpo: '<p>O administrador cria, edita e exclui os acessos (e-mail e senha) de administradores e visualizadores.</p>',
    },
    {
      alvo: '@Acesso pelo celular',
      titulo: 'Link e instalação',
      corpo: '<p>Copie o link para mandar a alguém e instale o app na tela inicial do celular.</p>',
    },
    {
      alvo: '@Versão do app',
      titulo: 'Versão',
      corpo: '<p>Quando sai uma versão nova, aparece uma faixa verde no topo. Aqui você também pode verificar e atualizar.</p>',
    },
    fim('Esta é a lógica do app. Em cada aba, o <b>❓ Tutorial</b> explica os detalhes dela.'),
  ];

  const POR_ABA = {
    agenda: OBRAS, faturamento: FATURAMENTO, combustivel: VALE, orcamentos: ORCAMENTOS, orcEditor: EDITOR,
    equipe: EQUIPE, funcionarios: PAGAMENTOS, gastos: GASTOS, empreitadas: EMPREITADA, cidades: CIDADES, config: CONFIG,
  };
  const chaveAtual = () => (aba === 'orcamentos' && orcEdit ? 'orcEditor' : aba);

  // ================================================================ FERRAMENTAS: aprender a usar
  // Cada ferramenta abre o painel de verdade e mostra campo por campo o que preencher.
  // ferramenta({ nome, icone, soAdmin, botao, intro, passos, salvar, salvou, depois, aberto, abrir })
  //  - botao: o que tocar para começar (o passo espera a pessoa tocar; em "Pular", o tutorial toca sozinho);
  //  - passos: campos e explicações (alvos dentro do painel ganham `abrir`/`aberto` da ferramenta);
  //  - salvar: botão final (só avança quando `salvou()` confirma); depois: mensagem final.
  const painelAberto = () => !document.getElementById('modalBg').hidden;
  const F = n => `#modalForm [name="${n}"]`;
  const caixa = (t, extra) => `<p>${t}</p>${extra ? dica(extra) : ''}`;
  const campo = (nome, titulo, texto, extra) => ({ alvo: F(nome), titulo, corpo: caixa(texto, extra), opcional: true });
  const ponto = (alvo, titulo, texto, extra) => ({ alvo, titulo, corpo: caixa(texto, extra), opcional: true });
  const toque = (alvo, titulo, texto, extra) => ({ alvo, titulo, corpo: caixa(texto, extra), espera: { seletor: alvo } });
  const cidadeCampo = campo('cidade', 'Cidade', 'A cidade deste registro. Já vem a cidade escolhida no 📍 do topo.');
  const SALVAR = '#modalForm .form-actions button[type="submit"]';

  function ferramenta(t) {
    const aberto = t.aberto || painelAberto;
    const abrir = t.abrir || t.botao;
    const doPainel = p => p.alvo && /#modalForm|#modalBg|\[data-o=|\.orc-item|#orcBusca|addAvulso|\.total-bar/.test(p.alvo);
    const campos = (t.passos || []).map(p => (doPainel(p) && !p.abrir && abrir ? { ...p, abrir, aberto } : p));
    const primeiro = campos.find(p => p.alvo && p.alvo.startsWith('#modalForm [name='))?.alvo;
    const passos = [
      { titulo: `${t.icone} ${t.nome}`, corpo: caixa(t.intro, 'Você vai fazer de verdade, com o tutorial do lado. Pode tocar em <b>Próximo</b> ou <b>Pular</b> a qualquer momento.'), posicao: 'centro' },
      ...(t.botao ? [toque(t.botao, t.tituloBotao || 'Comece por aqui', t.textoBotao || 'Toque no botão iluminado.')] : []),
      ...campos,
    ];
    if (t.salvar !== false) {
      const sel = t.salvar || SALVAR;
      passos.push({
        alvo: sel, titulo: t.tituloSalvar || 'Salvar',
        corpo: caixa(t.textoSalvar || 'Confira os dados e toque em <b>Salvar</b>.', 'Campos com * são obrigatórios. Se faltar algum, o app avisa e não salva.'),
        espera: { seletor: sel, quando: t.salvou || (primeiro ? () => !acharAlvo(primeiro) : () => !painelAberto()) },
        ...(abrir ? { abrir, aberto } : {}),
      });
    }
    passos.push({ titulo: 'Pronto! 🎉', corpo: `<p>${t.depois}</p>`, ferramentaFim: true });
    return { nome: t.nome, icone: t.icone, soAdmin: t.soAdmin, passos };
  }

  const FERRAMENTAS = {
    agenda: [
      ferramenta({ nome: 'Cadastrar um cliente', icone: '👤', soAdmin: true, botao: '[data-act="novoCliente"]',
        intro: 'O cliente vem antes da obra: toda obra é de um cliente.',
        passos: [
          campo('nome', 'Nome', 'Nome completo do cliente.', 'Ex.: Maria José da Silva.'),
          campo('telefone', 'Telefone / WhatsApp', 'Com DDD. É ele que o botão <b>WhatsApp</b> usa para abrir a conversa.'),
          campo('endereco', 'Endereço', 'Onde o cliente mora (opcional).'),
          cidadeCampo,
          campo('obs', 'Observações', 'Qualquer anotação: indicação, preferência de contato…'),
        ],
        depois: 'O cliente aparece na lista <b>Clientes</b>, no fim desta aba, e já pode ser escolhido numa obra ou orçamento.' }),
      ferramenta({ nome: 'Cadastrar uma obra', icone: '🏗️', soAdmin: true, botao: '[data-act="novaObra"]',
        intro: 'Cadastre a obra assim que fechar o contrato. O valor do contrato é o que vira o “a receber”.',
        passos: [
          campo('nome', 'Nome da obra', 'Um nome fácil de reconhecer.', 'Ex.: Casa da Maria — ampliação.'),
          campo('clienteId', 'Cliente', 'Escolha o cliente. Se ele não aparece, cadastre-o antes em “+ Cliente”.'),
          campo('endereco', 'Endereço da obra', 'Onde a obra vai ser feita.'),
          cidadeCampo,
          campo('inicio', 'Início', 'O dia em que a equipe começa.'),
          campo('fim', 'Término previsto', 'O dia combinado para entregar. A barra de prazo usa essas duas datas.'),
          campo('status', 'Status', '<b>Agendada</b> se ainda não começou, <b>Em andamento</b> se já começou.'),
          campo('valor', 'Valor do contrato', 'O total combinado com o cliente.', 'Ex.: 25000 ou 25.000,50.'),
          campo('obs', 'Observações', 'Combinados, materiais por conta do cliente, etc.'),
        ],
        depois: 'A obra entra na lista e o valor já soma em <b>Contratos ativos</b> e <b>A receber</b>.' }),
      ferramenta({ nome: 'Mudar o status de uma obra', icone: '🔄', soAdmin: true, salvar: false,
        intro: 'Quando a equipe começa, pausa ou termina a obra, troque o status direto na lista.',
        passos: [
          toque('.obra-item .mini-select', 'A caixa de status', 'Toque na caixa da obra e escolha o novo status.'),
          ponto('.obra-item .mini-select', 'Salva sozinho', 'Não precisa de botão Salvar: o novo status já fica gravado.', 'Obra <b>Concluída</b> sai do filtro “Ativas” e do “A receber”.'),
        ],
        depois: 'Para ver todas as obras, inclusive as concluídas, use o filtro <b>Todas</b>.' }),
      ferramenta({ nome: 'Lançar recebimento pela obra', icone: '💵', soAdmin: true,
        intro: 'O jeito mais rápido de lançar um pagamento do cliente: pela ficha da obra, já fica ligado a ela.',
        botao: '.obra-item .btn[data-act="verObra"]', tituloBotao: 'Abra a ficha', textoBotao: 'Toque em <b>Detalhes</b> na obra.',
        aberto: () => !!document.querySelector(F('forma')),
        abrir: () => { if (!painelAberto()) acharAlvo('.obra-item .btn[data-act="verObra"]')?.click(); acharAlvo('#modalBg [data-act="novaReceita"]')?.click(); },
        passos: [
          { ...toque('#modalBg [data-act="novaReceita"]', '+ Recebimento', 'Na ficha, toque em <b>+ Recebimento</b>.'), abrir: '.obra-item .btn[data-act="verObra"]', aberto: painelAberto },
          campo('descricao', 'Descrição', 'O que é esse pagamento.', 'Ex.: 2ª parcela.'),
          campo('data', 'Data', 'O dia em que o dinheiro entrou.'),
          campo('valor', 'Valor', 'Quanto o cliente pagou.'),
          campo('obraId', 'Obra', 'Já vem a obra da ficha. É isso que baixa o “a receber” dela.'),
          campo('forma', 'Forma de pagamento', 'PIX, dinheiro, transferência…'),
        ],
        depois: 'O valor entrou no <b>Faturamento</b> e baixou o “a receber” da obra. Pela ficha também dá para lançar um <b>+ Gasto</b> do mesmo jeito.' }),
      ferramenta({ nome: 'Editar ou excluir uma obra', icone: '✏️', soAdmin: true, botao: '.obra-item .btn[data-act="editObra"]',
        intro: 'Para corrigir datas, valor ou qualquer dado da obra.', textoBotao: 'Toque em <b>Editar</b> na obra.',
        passos: [
          ponto('#modalForm', 'Mude o que precisar', 'Os campos são os mesmos do cadastro. Altere só o que estiver errado.'),
          ponto('#modalForm [data-act="delObra"]', 'Excluir', 'Este botão apaga a obra. O app pergunta antes de apagar.', 'Use só para obra lançada por engano. Obra terminada fica como <b>Concluída</b>.'),
        ],
        depois: 'As mudanças já aparecem na lista e nos números do topo.' }),
      ferramenta({ nome: 'Buscar e filtrar obras', icone: '🔎', salvar: false,
        intro: 'Ache uma obra rápido, mesmo com muitas cadastradas.',
        passos: [
          ponto('#buscaObra', 'Buscar', 'Digite parte do nome da obra, do cliente ou do endereço. A lista filtra enquanto você digita.'),
          toque('#view .chip', 'Filtros de status', 'Toque em um filtro. <b>Ativas</b> mostra tudo que não está concluído.'),
        ],
        depois: 'Para voltar a ver tudo, apague a busca e toque em <b>Todas</b>.' }),
    ],

    faturamento: [
      ferramenta({ nome: 'Lançar um recebimento', icone: '💰', soAdmin: true, botao: '#view [data-act="novaReceita"]',
        intro: 'Todo dinheiro que entra (de obra ou não) é lançado como recebimento.',
        passos: [
          campo('descricao', 'Descrição', 'O que é esse dinheiro.', 'Ex.: Entrada da obra da garagem.'),
          campo('data', 'Data', 'O dia em que o dinheiro entrou. Ela decide em qual semana, mês e ano o valor conta.'),
          campo('valor', 'Valor', 'Quanto entrou.'),
          campo('obraId', 'Obra (opcional)', 'Se for pagamento de uma obra, escolha a obra: assim o “a receber” dela baixa.'),
          cidadeCampo,
          campo('forma', 'Forma de pagamento', 'PIX, dinheiro, transferência ou cartão.'),
        ],
        depois: 'O valor já soma nos totais da semana, do mês e do ano e nos gráficos.' }),
      ferramenta({ nome: 'Corrigir ou excluir um recebimento', icone: '✏️', soAdmin: true, botao: '#view [data-act="editReceita"]',
        intro: 'Lançou valor ou data errada? Corrija pelo Editar.', textoBotao: 'Toque em <b>Editar</b> no recebimento.',
        passos: [
          ponto('#modalForm', 'Corrija', 'Altere o que estiver errado.'),
          ponto('#modalForm .btn.danger', 'Excluir', 'Apaga o recebimento. O app pergunta antes.'),
        ],
        depois: 'Os totais e gráficos já foram recalculados.' }),
      ferramenta({ nome: 'Ver outro ano', icone: '📅', salvar: false,
        intro: 'O gráfico “Por mês” e a lista de recebimentos mostram um ano de cada vez.',
        passos: [toque('#view [data-act="fatAno"]', 'Setas do ano', 'Toque em <b>‹</b> para o ano anterior ou <b>›</b> para o seguinte.')],
        depois: 'A lista de recebimentos no fim da aba também mudou para o ano escolhido.' }),
    ],

    combustivel: [
      ferramenta({ nome: 'Cadastrar um posto', icone: '⛽', soAdmin: true, botao: '[data-act="novoPosto"]',
        intro: 'Cadastre os postos conveniados antes de emitir vale de combustível.',
        passos: [
          campo('nome', 'Nome do posto', 'Como o posto é conhecido.'),
          campo('endereco', 'Endereço', 'Opcional. Sai no vale em PDF.'),
          campo('telefone', 'Telefone', 'Opcional.'),
          cidadeCampo,
        ],
        depois: 'O posto aparece em <b>Postos de combustível</b> e já pode ser escolhido no vale.' }),
      ferramenta({ nome: 'Emitir um vale', icone: '🧾', soAdmin: true, botao: '[data-act="novoVale"]',
        intro: 'Use para combustível (em um posto) ou para dinheiro emprestado ao funcionário.',
        passos: [
          campo('tipo', 'Tipo de vale', '<b>⛽ Combustível</b>: abastece num posto. <b>💵 Comum</b>: empréstimo em dinheiro.'),
          campo('funcionarioId', 'Colaborador', 'Quem recebe o vale. Só aparecem os funcionários ativos da cidade.'),
          campo('postoId', 'Posto', 'Só no vale de combustível: onde vai abastecer.'),
          campo('data', 'Data', 'O dia do vale. Decide em qual quinzena ele é descontado.'),
          campo('valor', 'Valor', 'Quanto foi liberado.'),
          campo('obs', 'Observação', 'Ex.: ida à obra do Centro.'),
        ],
        depois: 'O vale está na lista. Toque no <b>🧾</b> dele para gerar o vale em PDF. Ele já sai descontado em <b>Pagamentos</b>.' }),
      ferramenta({ nome: 'Gerar vale e lista em PDF', icone: '📄', salvar: false,
        intro: 'Imprima o vale para entregar no posto ou a lista do período para conferir.',
        passos: [
          ponto('#view [data-act="pdfVale"]', 'Um vale', 'O <b>🧾</b> de cada vale gera o PDF daquele vale.'),
          toque('#view [data-act="pdfVales"]', 'A lista', 'Toque em <b>📄 PDF</b> para gerar a lista de todos os vales do período.'),
        ],
        depois: 'Para outro período, troque Semana / Quinzena / Mês no topo da aba.' }),
    ],

    orcamentos: [
      ferramenta({ nome: 'Cadastrar itens do catálogo', icone: '📦', soAdmin: true,
        intro: 'Cadastre uma vez os materiais e serviços com preço. Depois, todo orçamento já vem com eles.',
        botao: '[data-act="verCatalogo"]', tituloBotao: 'Abra o catálogo', textoBotao: 'Toque em <b>📦 Itens cadastrados</b>.',
        aberto: () => !!document.querySelector(F('preco')),
        abrir: () => { if (!painelAberto()) acharAlvo('[data-act="verCatalogo"]')?.click(); acharAlvo('#modalForm [data-act="novoItemCat"]')?.click(); },
        passos: [
          { ...toque('#modalForm [data-act="novoItemCat"]', 'Novo item', 'Toque em <b>+ Cadastrar item</b>.'), abrir: '[data-act="verCatalogo"]', aberto: painelAberto },
          campo('nome', 'Nome', 'Ex.: Cimento CP-II 50 kg, Reboco interno.'),
          campo('tipo', 'Tipo', '<b>Material</b> ou <b>Serviço</b>. Eles aparecem separados no orçamento.'),
          campo('unidade', 'Unidade', 'Como é medido: saco, m², m³, diária, unidade…'),
          campo('preco', 'Valor unitário', 'Preço de uma unidade. Pode ser ajustado em cada orçamento.'),
        ],
        depois: 'O item já aparece em todos os orçamentos novos, é só colocar a quantidade.' }),
      ferramenta({ nome: 'Criar um orçamento', icone: '🧾', soAdmin: true, botao: '[data-act="novoOrc"]',
        intro: 'Monte o orçamento colocando só as quantidades. O app faz as contas.',
        aberto: () => !!orcEdit,
        passos: [
          ponto('[data-o="clienteId"]', 'Cliente', 'Escolha o cliente. O <b>+</b> ao lado cadastra um novo sem sair daqui.'),
          ponto('[data-o="obraId"]', 'Obra (opcional)', 'Se o orçamento é de uma obra, escolha. Aparecem só as obras do cliente.'),
          ponto('[data-o="validade"]', 'Validade', 'Até quando o preço vale. Começa com 15 dias.'),
          ponto('.orc-item[data-linha] [data-f="qtd"]', 'Quantidade', 'Em cada item que vai usar, digite a quantidade. O total da linha aparece na hora.', 'Deixe vazio o que não vai usar.'),
          ponto('.orc-item[data-linha] [data-f="preco"]', 'Valor unitário', 'Já vem do catálogo. Pode mudar só para este orçamento.'),
          ponto('#orcBusca', 'Buscar item', 'Com muitos itens, digite o nome para achar mais rápido.'),
          ponto('[data-act="addAvulso"]', 'Item avulso', 'Para algo que não está no catálogo: descrição, unidade, quantidade e valor.'),
          ponto('[data-o="desconto"]', 'Desconto', 'Valor em reais tirado do total.'),
          ponto('[data-o="obs"]', 'Observações', 'Condições de pagamento e prazos. Saem no PDF.', 'Ex.: 50% na entrada e 50% na entrega.'),
        ],
        salvar: '[data-act="salvarOrc"]', textoSalvar: 'Toque em <b>💾 Salvar</b>. Ou em <b>Salvar e enviar PDF</b> para já mandar ao cliente.',
        salvou: () => !orcEdit,
        depois: 'O orçamento está na lista como <b>Pendente</b>. Quando o cliente aprovar, use <b>✔ Validar</b>.' }),
      ferramenta({ nome: 'Validar um orçamento', icone: '✔', soAdmin: true, botao: '#view [data-act="validarOrc"]',
        intro: 'Quando o cliente aprovar, diga quem paga o orçamento.', textoBotao: 'Toque em <b>✔ Validar</b> no orçamento.',
        passos: [
          ponto('#modalForm .val-opcoes', 'Quem paga?', '<b>🏗️ Própria</b>: a construtora paga e o valor entra em Gastos. <b>👤 Cliente</b>: o cliente paga, fica só aprovado.'),
          campo('data', 'Data do gasto', 'Só na Própria: o dia em que o gasto conta.'),
          campo('categoria', 'Categoria do gasto', 'Só na Própria: Material, Ferramentas…'),
        ],
        tituloSalvar: 'Validar', textoSalvar: 'Toque em <b>Validar</b>.', salvou: () => !painelAberto(),
        depois: 'O orçamento ficou <b>Aprovado</b>. Se foi Própria, o valor já está em <b>Gastos</b>. Para desfazer, toque em <b>Validado</b> e em “Desfazer validação”.' }),
      ferramenta({ nome: 'Enviar o PDF ao cliente', icone: '📄', salvar: false,
        intro: 'Gere o orçamento em PDF para mandar ao cliente.',
        passos: [toque('#view [data-act="enviarOrc"]', 'PDF', 'Toque em <b>📄 PDF</b> no orçamento. No celular, abre para enviar pelo WhatsApp.')],
        depois: 'O PDF sai com os dados da empresa, os itens, o total e as observações.' }),
    ],

    orcEditor: [
      ferramenta({ nome: 'Preencher este orçamento', icone: '🧾', soAdmin: true,
        intro: 'Vamos preencher o orçamento aberto, campo por campo.',
        passos: [
          ponto('[data-o="clienteId"]', 'Cliente', 'Escolha o cliente. O <b>+</b> cadastra um novo.'),
          ponto('[data-o="obraId"]', 'Obra (opcional)', 'Aparecem só as obras do cliente escolhido.'),
          ponto('.orc-item[data-linha] [data-f="qtd"]', 'Quantidade', 'Digite a quantidade nos itens que vai usar.'),
          ponto('[data-act="addAvulso"]', 'Item avulso', 'Para algo fora do catálogo.'),
          ponto('[data-o="desconto"]', 'Desconto', 'Em reais, tirado do total.'),
          ponto('.total-bar', 'Total', 'O total atualiza enquanto você digita.'),
        ],
        salvar: '[data-act="salvarOrc"]', textoSalvar: 'Toque em <b>💾 Salvar</b>.', salvou: () => !orcEdit,
        depois: 'Salvo! Ele aparece na lista de orçamentos.' }),
    ],

    equipe: [
      ferramenta({ nome: 'Cadastrar um funcionário', icone: '👷', soAdmin: true, botao: '[data-act="novoFunc"]',
        intro: 'A diária e a data de admissão são o que o app usa para calcular o pagamento.',
        passos: [
          campo('nome', 'Nome completo', 'Como vai aparecer no relatório de pagamento.'),
          campo('funcao', 'Função', 'Pedreiro, servente, eletricista…'),
          campo('diaria', 'Valor da diária', 'Quanto ganha por dia trabalhado.', 'Ex.: 150.'),
          campo('telefone', 'Telefone / WhatsApp', 'Opcional.'),
          campo('cpf', 'CPF', 'Opcional.'),
          campo('admissao', 'Data de admissão', 'O primeiro dia de trabalho. O salário só conta a partir dela.'),
          campo('pix', 'Chave PIX', 'Para pagar.'),
          cidadeCampo,
        ],
        depois: 'O funcionário aparece na lista e já entra no cálculo de <b>Pagamentos</b> e da mão de obra em <b>Gastos</b>.' }),
      ferramenta({ nome: 'Lançar uma falta', icone: '📅', soAdmin: true, botao: '#view [data-act="lancarFalta"]',
        intro: 'Lance as faltas para descontar do pagamento.',
        passos: [
          campo('funcionarioId', 'Funcionário', 'Quem faltou.'),
          campo('data', 'Data', 'O dia da falta.'),
          campo('ate', 'Até (vários dias)', 'Faltou mais de um dia seguido? Coloque o último dia aqui e o app lança todos.'),
          campo('tipo', 'Tipo', '<b>Dia inteiro</b> desconta 1 diária. <b>Meio dia</b>, meia.'),
          campo('motivo', 'Motivo', 'Falta, atestado, folga, chuva…'),
          ponto('#modalForm label:has([name="desconta"])', 'Descontar do pagamento', 'Desmarque quando a falta não deve descontar (ex.: atestado, chuva).'),
          campo('obs', 'Observação', 'Opcional.'),
        ],
        depois: 'A falta aparece em <b>Faltas do mês</b> e já desconta em <b>Pagamentos</b>.' }),
      ferramenta({ nome: 'Desligar um funcionário', icone: '🚪', soAdmin: true, botao: '.func-item .btn[data-act="editFunc"]',
        intro: 'Quem sai da empresa vira <b>inativo</b>: sai das contas, mas o histórico fica.', textoBotao: 'Toque em <b>Editar</b> no funcionário.',
        passos: [ponto('#modalForm label:has([name="ativo"])', 'Funcionário ativo', 'Desmarque esta opção.', 'Para trazer de volta, é só marcar de novo.')],
        salvou: () => !painelAberto(),
        depois: 'Ele aparece no filtro <b>Inativos</b> e não entra mais no pagamento.' }),
      ferramenta({ nome: 'Ver a ficha do funcionário', icone: '📋', salvar: false,
        intro: 'Resumo do mês de cada funcionário.',
        passos: [
          toque('.func-item .btn[data-act="verFunc"]', 'Ficha', 'Toque em <b>Ficha</b>.'),
          { ...ponto('#modalBg .modal', 'O resumo', 'Dias trabalhados, faltas, vales, quanto tem a receber e os pagamentos já marcados.'), abrir: '.func-item .btn[data-act="verFunc"]', posicao: 'canto' },
        ],
        depois: 'Feche a ficha no ✕.' }),
    ],

    funcionarios: [
      ferramenta({ nome: 'Calcular um pagamento', icone: '🧮', salvar: false,
        intro: 'Escolha o período e o app mostra quanto pagar a cada um.',
        passos: [
          toque('#view [data-act="pagTipo"]', 'Período', 'Toque em <b>1ª quinzena</b>, <b>2ª quinzena</b> ou <b>Mensal</b>.'),
          ponto('#view [data-change="pagMes"]', 'Mês', 'Escolha o mês.'),
          ponto('#view .check', 'Sábado', 'Marque se a equipe trabalha no sábado.'),
          ponto('#view table', 'Resultado', 'Uma linha por funcionário. A coluna <b>A pagar</b> é o que cada um recebe.'),
        ],
        depois: 'O total fica no destaque azul do topo.' }),
      ferramenta({ nome: 'Marcar como paga', icone: '✅', soAdmin: true, botao: '#view [data-act="marcarPago"]',
        intro: 'Depois de pagar a equipe, registre no app.', textoBotao: 'Toque em <b>✔ Marcar como paga</b>.',
        passos: [
          ponto('#modalForm .val-opcoes', 'Quanto foi pago', 'Com o período ainda aberto: <b>Período inteiro</b> ou só <b>Até hoje</b>.'),
          campo('data', 'Data do pagamento', 'O dia em que pagou.'),
          campo('forma', 'Forma', 'PIX, dinheiro, transferência ou cheque.'),
          campo('obs', 'Observação', 'Opcional.'),
        ],
        tituloSalvar: 'Marcar como paga', textoSalvar: 'Toque em <b>Marcar como paga</b>.', salvou: () => !painelAberto(),
        depois: 'O cartão ficou verde com a data. Na tabela aparece a coluna <b>Pago</b>. Errou? Use <b>Desfazer</b>.' }),
      ferramenta({ nome: 'Gerar o relatório em PDF', icone: '📄', salvar: false,
        intro: 'Relatório com todos os funcionários do período.',
        passos: [toque('#view [data-act="pdfFolha"]', 'Relatório PDF', 'Toque em <b>📄 Relatório PDF</b>.')],
        depois: 'Sai com dias, faltas, bruto, vales e o valor a pagar de cada um.' }),
    ],

    gastos: [
      ferramenta({ nome: 'Lançar uma despesa', icone: '🧾', soAdmin: true, botao: '#view [data-act="novaDespesa"]',
        intro: 'Material, ferramenta, combustível da empresa, aluguel… Tudo que a empresa paga (menos salários, que o app calcula sozinho).',
        passos: [
          campo('descricao', 'Descrição', 'O que foi comprado ou pago.', 'Ex.: 20 sacos de cimento.'),
          campo('data', 'Data', 'O dia do gasto.'),
          campo('valor', 'Valor', 'Quanto custou.'),
          campo('categoria', 'Categoria', 'Agrupa os gastos na composição e no gráfico.'),
          campo('obraId', 'Obra (opcional)', 'Se foi para uma obra, escolha: o gasto aparece na ficha dela.'),
          cidadeCampo,
        ],
        depois: 'A despesa entrou no total de gastos e no saldo do período.' }),
      ferramenta({ nome: 'Corrigir ou excluir uma despesa', icone: '✏️', soAdmin: true, botao: '#view [data-act="editDespesa"]',
        intro: 'Para corrigir valor, data ou categoria.', textoBotao: 'Toque em <b>Editar</b> na despesa.',
        passos: [ponto('#modalForm', 'Corrija', 'Altere o que estiver errado.'), ponto('#modalForm .btn.danger', 'Excluir', 'Apaga a despesa. O app pergunta antes.')],
        depois: 'Os totais já foram recalculados.' }),
      ferramenta({ nome: 'Ver outro período e gerar PDF', icone: '📄', salvar: false,
        intro: 'Veja os gastos de qualquer semana, quinzena ou mês.',
        passos: [
          toque('#view .card .seg button', 'Período', 'Toque em <b>Semana</b>, <b>Quinzena</b> ou <b>Mês</b>.'),
          ponto('#view [data-change="setPeriodoData"]', 'Data de referência', 'Escolha uma data do período que quer ver.'),
          ponto('#view [data-act="pdfGastos"]', 'PDF', 'Gera o relatório de gastos do período.'),
        ],
        depois: 'Tudo na aba mostra o período escolhido.' }),
    ],

    empreitadas: [
      ferramenta({ nome: 'Cadastrar uma empreitada', icone: '🔨', soAdmin: true, botao: '[data-act="novaEmp"]',
        intro: 'Para serviço pequeno, com valor fechado.',
        passos: [
          campo('servico', 'Serviço', 'O que vai ser feito.', 'Ex.: Construção de muro 10 m.'),
          campo('cliente', 'Cliente', 'Só o nome. Não precisa de cadastro.'),
          campo('telefone', 'Telefone', 'Opcional.'),
          campo('endereco', 'Endereço', 'Onde é o serviço.'),
          campo('valor', 'Valor combinado', 'O preço fechado.'),
          campo('status', 'Status', 'Aberta, em andamento ou concluída.'),
          campo('inicio', 'Início', 'Quando começa.'),
          campo('prazo', 'Prazo (dias)', 'Em quantos dias termina.'),
          campo('responsavelId', 'Responsável', 'O funcionário que vai fazer.'),
        ],
        depois: 'A empreitada aparece na lista com o valor em <b>A receber</b>.' }),
      ferramenta({ nome: 'Receber uma empreitada', icone: '💵', soAdmin: true, botao: '#view [data-act="receberEmp"]',
        intro: 'Quando o cliente pagar (tudo ou uma parte).', textoBotao: 'Toque em <b>Receber</b> na empreitada.',
        passos: [
          campo('data', 'Data', 'O dia em que recebeu.'),
          campo('valor', 'Valor', 'Já vem o que falta. Mude se recebeu só uma parte.'),
          campo('forma', 'Forma de pagamento', 'PIX, dinheiro…'),
        ],
        tituloSalvar: 'Registrar', textoSalvar: 'Toque em <b>Registrar</b>.', salvou: () => !painelAberto(),
        depois: 'O valor entrou no <b>Faturamento</b>. Se completou o combinado, a empreitada ficou <b>Concluída</b>.' }),
    ],

    cidades: [
      ferramenta({ nome: 'Trocar a cidade', icone: '📍', salvar: false,
        intro: 'Escolha qual cidade ver em todas as abas.',
        passos: [
          ponto('.cidade-sel', 'O 📍 do topo', 'Toque e escolha a cidade. <b>🌎 Todas as cidades</b> soma tudo.'),
          ponto('#view [data-act="abrirCidade"]', 'Ou pelo Abrir', 'O <b>Abrir</b> de cada cidade escolhe a cidade e vai para as obras dela.'),
        ],
        depois: 'A cidade escolhida fica guardada neste aparelho.' }),
      ferramenta({ nome: 'Adicionar ou renomear cidade', icone: '➕', soAdmin: true, botao: '#view [data-act="gerenciarCidades"]',
        intro: 'Cadastre uma cidade nova quando a empresa começar a trabalhar lá.',
        passos: [
          campo('nova', 'Nova cidade', 'Digite o nome da cidade.', 'Ex.: Iguatu.'),
          ponto('#modalForm [data-act="renomearCidade"]', 'Renomear', 'Corrige o nome em todos os registros daquela cidade.', 'Excluir só funciona em cidade sem nenhum registro.'),
        ],
        salvar: '#modalForm button[type="submit"]', tituloSalvar: 'Adicionar', textoSalvar: 'Digite o nome e toque em <b>Adicionar</b>.',
        salvou: () => !acharAlvo(F('nova'))?.value,
        depois: 'A cidade nova já aparece no 📍 do topo e nos cadastros.' }),
      ferramenta({ nome: 'Gerar o resumo em PDF', icone: '📄', salvar: false,
        intro: 'Resumo de todas as cidades no período escolhido.',
        passos: [toque('#view [data-act="pdfCidades"]', 'PDF', 'Toque em <b>PDF</b>.')],
        depois: 'Sai com o total geral e os números de cada cidade.' }),
    ],

    config: [
      ferramenta({ nome: 'Criar um acesso', icone: '🔑', soAdmin: true, botao: '[data-act="novoAcesso"]',
        intro: 'Dê acesso ao app para outra pessoa, com e-mail e senha.',
        passos: [
          campo('email', 'E-mail', 'O e-mail que a pessoa vai usar para entrar.'),
          campo('nome', 'Nome', 'Para você saber de quem é o acesso.'),
          ponto('#modalForm .val-opcoes', 'Tipo de acesso', '<b>Administrador</b> lança e altera. <b>Visualizador</b> só consulta.'),
          campo('senha', 'Senha', 'Mínimo 6 caracteres. Passe para a pessoa junto com o e-mail.'),
        ],
        depois: 'O acesso aparece na lista. Mande para a pessoa o link do app, o e-mail e a senha.' }),
      ferramenta({ nome: 'Editar ou excluir um acesso', icone: '✏️', soAdmin: true, botao: '#acessosBox [data-act="editAcesso"]',
        intro: 'Mude o tipo de acesso, o nome ou a senha de alguém.', textoBotao: 'Toque em <b>Editar</b> no acesso.',
        passos: [
          ponto('#modalForm .val-opcoes', 'Tipo de acesso', 'Troque entre Administrador e Visualizador.'),
          campo('senha', 'Nova senha', 'Deixe em branco para manter a senha atual.'),
        ],
        salvou: () => !painelAberto(),
        depois: 'Para tirar o acesso de alguém, use o <b>Excluir</b> ao lado do Editar.' }),
      ferramenta({ nome: 'Dados da empresa', icone: '🏢', soAdmin: true, salvar: '#cfgForm button[type="submit"]', salvou: () => true,
        intro: 'Esses dados saem no cabeçalho dos PDFs.',
        passos: [
          ponto('#cfgForm [name="empresa"]', 'Nome da empresa', 'Como aparece no PDF.'),
          ponto('#cfgForm [name="cnpj"]', 'CNPJ / CPF', 'Opcional.'),
          ponto('#cfgForm [name="telefone"]', 'Telefone', 'Para o cliente falar com a empresa.'),
          ponto('#cfgForm [name="endereco"]', 'Endereço', 'Opcional.'),
        ],
        textoSalvar: 'Toque em <b>Salvar</b>.',
        depois: 'Os próximos PDFs já saem com os dados novos.' }),
      ferramenta({ nome: 'Compartilhar e instalar', icone: '📲', salvar: false,
        intro: 'Mande o link do app para alguém e deixe o app na tela inicial do celular.',
        passos: [
          ponto('#view .card-link', 'O card do app', 'Este card com a logo abre o app. É ele que aparece quando o link é enviado pelo WhatsApp.'),
          ponto('#view [data-act="compartilharLink"]', 'Compartilhar', 'Abre o WhatsApp (ou outro app) com o link pronto para mandar.'),
          ponto('#view [data-act="copiarLink"]', 'Copiar o link', 'Copia o endereço do app para colar onde quiser.'),
          ponto('#view [data-act="instalarApp"]', 'Instalar', 'Coloca o app na tela inicial. No iPhone, o app mostra o passo a passo.'),
        ],
        depois: 'Depois de instalado, o app abre em tela cheia, sem a barra do navegador.' }),
    ],
  };


  // ---------------------------------------------------------------- Motor do passo a passo
  const visivel = e => e && (e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
  function acharAlvo(alvo) {
    if (!alvo) return null;
    if (!alvo.startsWith('@')) return [...document.querySelectorAll(alvo)].find(e => visivel(e) && !e.closest('.tut-raiz')) || null;
    const texto = alvo.slice(1).trim().toLowerCase();
    const cand = [...document.querySelectorAll('button, a, label, h2, h3, h4, b')]
      .filter(e => !e.closest('.tut-raiz') && visivel(e) && e.textContent.trim().toLowerCase().startsWith(texto));
    cand.sort((x, y) => x.textContent.length - y.textContent.length);
    return cand[0] || null;
  }

  let tut = null; // { chave, passos, i, feito, timer, medidor }
  const raiz = document.createElement('div');
  raiz.className = 'tut-raiz'; raiz.hidden = true;
  raiz.setAttribute('role', 'dialog'); raiz.setAttribute('aria-label', 'Tutorial');
  raiz.innerHTML = '<div class="tut-foco"></div><div class="tut-escuro"></div><div class="tut-cartao"></div>';
  const botao = document.createElement('button');
  botao.type = 'button'; botao.className = 'tut-botao'; botao.textContent = '❓ Tutorial'; botao.title = 'Passo a passo desta aba';
  document.body.append(raiz, botao);
  const foco = raiz.querySelector('.tut-foco'), escuro = raiz.querySelector('.tut-escuro'), cartao = raiz.querySelector('.tut-cartao');

  const lerVisto = c => { try { return !!localStorage.getItem(KEY + ':tutorial:' + c); } catch (e) { return true; } };
  const gravarVisto = c => { try { localStorage.setItem(KEY + ':tutorial:' + c, '1'); } catch (e) { /* ignora */ } };

  const ferramentasDaAba = () => (FERRAMENTAS[chaveAtual()] || []).filter(f => !f.soAdmin || ehAdmin());

  // Menu do botão ❓ Tutorial: a lógica da aba + as ferramentas que a pessoa pode usar.
  function abrirMenu() {
    const chave = chaveAtual();
    if (!POR_ABA[chave]) return;
    if (tut) parar();
    tut = { menu: true, chave, aba, passos: [] };
    raiz.hidden = false; botao.hidden = true;
    foco.hidden = true; escuro.hidden = false;
    const fs = ferramentasDaAba();
    cartao.innerHTML = `
      <div class="tut-topo"><span class="tut-passo">Tutorial</span><button type="button" class="tut-x" data-tut="sair" aria-label="Fechar tutorial">×</button></div>
      <h3>O que você quer aprender?</h3>
      <button type="button" class="tut-op tut-op-logica" data-tut="logica"><span>📘</span><span><b>Como esta aba funciona</b><small>A lógica: de onde vem cada número</small></span></button>
      ${fs.length ? `<div class="tut-menu-tit">🛠️ Aprender a usar</div>
      ${fs.map((f, i) => `<button type="button" class="tut-op" data-tut="ferr" data-i="${i}"><span>${f.icone}</span><span><b>${f.nome}</b></span></button>`).join('')}` : ''}
      ${!ehAdmin() ? dica('Seu acesso é de <b>visualizador</b>: aparecem só as ferramentas de consulta.') : ''}`;
    const cel = innerWidth <= 640;
    Object.assign(cartao.style, cel
      ? { width: innerWidth - 2 * MARGEM + 'px', left: MARGEM + 'px', top: '', bottom: MARGEM + 'px', transform: '' }
      : { width: '400px', left: '', top: '', bottom: '', transform: '' });
    cartao.classList.toggle('centro', !cel); cartao.classList.add('tut-menu');
    cartao.scrollTop = 0;
  }
  function iniciar(passos, extra) {
    if (tut) parar();
    tut = { chave: chaveAtual(), aba, passos: passos.filter(p => !p.soAdmin || ehAdmin()), i: 0, ...extra };
    cartao.classList.remove('tut-menu');
    raiz.hidden = false; botao.hidden = true;
    ir(0);
  }
  function parar() { clearTimeout(tut.timer); clearInterval(tut.medidor); }
  function sair() {
    if (!tut) return;
    if (!tut.menu && !tut.ferramenta) gravarVisto(tut.chave);
    parar();
    // a ficha aberta pela lógica fecha junto; nas ferramentas o painel fica (pode ter dados digitados)
    if (!tut.ferramenta && tut.passos.some(p => p.alvo === '#modalBg .modal')) fecharModal();
    tut = null; raiz.hidden = true; cartao.classList.remove('tut-menu'); atualizarBotao();
  }
  const estaAberto = p => (p.aberto ? p.aberto() : painelAberto());
  function ir(n, dir = n >= (tut.i || 0) ? 1 : -1) {
    parar();
    tut.i = Math.max(0, Math.min(tut.passos.length - 1, n));
    tut.feito = false; tut.rolou = false; tut.conferindo = false;
    const p = tut.passos[tut.i];
    if (p.fechar && painelAberto()) fecharModal();
    if (p.abrir && !estaAberto(p)) (typeof p.abrir === 'function' ? p.abrir() : acharAlvo(p.abrir)?.click());
    // campo que não existe agora (ex.: cidade quando só há uma): passa direto
    if (p.opcional && !acharAlvo(p.alvo)) {
      const prox = tut.i + dir;
      if (prox >= 0 && prox < tut.passos.length) return ir(prox, dir);
    }
    desenhar();
    medir();
    tut.medidor = setInterval(medir, 250);
  }

  function desenhar() {
    const p = tut.passos[tut.i], n = tut.passos.length, ultimo = tut.i === n - 1;
    cartao.innerHTML = `
      <div class="tut-topo"><span class="tut-passo">Passo ${tut.i + 1} de ${n}</span><button type="button" class="tut-x" data-tut="sair" aria-label="Fechar tutorial">×</button></div>
      <div class="tut-barra"><i style="width:${((tut.i + 1) / n) * 100}%"></i></div>
      <h3>${p.titulo}</h3>
      <div class="tut-corpo">${p.corpo}</div>
      <p class="tut-aviso" hidden>Este ponto não está na tela agora (talvez ainda não haja registros aqui). Toque em <b>Pular</b>.</p>
      ${p.espera ? `<p class="tut-acao${tut.feito ? ' ok' : ''}">${tut.feito ? '✓ Muito bem!' : '👆 Faça a ação na tela para continuar'}</p>` : ''}
      <div class="tut-botoes">
        <button type="button" class="tut-sec" data-tut="voltar" ${tut.i === 0 ? 'disabled' : ''}>Voltar</button>
        <button type="button" class="tut-prim" data-tut="${ultimo ? 'sair' : 'proximo'}">${ultimo ? 'Concluir' : p.espera && !tut.feito ? 'Pular' : 'Próximo'}</button>
      </div>
      ${ultimo ? `<button type="button" class="tut-mais" data-tut="menu">📋 ${tut.ferramenta ? 'Aprender outra ferramenta' : 'Aprender a usar as ferramentas desta aba'}</button>` : ''}`;
    cartao.scrollTop = 0;
  }

  // Ilumina o alvo e posiciona o cartão: abaixo/acima do alvo no computador; no celular, embaixo
  // (ou em cima, quando o alvo está na metade de baixo da tela).
  function medir() {
    if (!tut || tut.menu) return;
    const p = tut.passos[tut.i];
    const el = acharAlvo(p.alvo);
    cartao.querySelector('.tut-aviso').hidden = !p.alvo || !!el;
    let r = null;
    if (el) {
      if (!tut.rolou) { tut.rolou = true; rolarAte(el); }
      const b = el.getBoundingClientRect();
      const topo = Math.max(b.top, 0), base = Math.min(b.bottom, innerHeight);
      r = { top: topo, left: Math.max(b.left, 0), width: Math.min(b.right, innerWidth) - Math.max(b.left, 0), height: Math.max(base - topo, 0) };
    }
    foco.hidden = !r; escuro.hidden = !!r;
    foco.classList.toggle('pulsa', !!p.espera && !tut.feito);
    if (r) Object.assign(foco.style, { top: r.top - 4 + 'px', left: r.left - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });

    const larg = Math.min(380, innerWidth - 2 * MARGEM);
    const s = { width: larg + 'px', left: '', top: '', bottom: '', transform: '' };
    const celular = innerWidth <= 640;
    cartao.classList.remove('centro');
    if (celular) {
      s.left = MARGEM + 'px'; s.width = innerWidth - 2 * MARGEM + 'px';
      // embaixo da tela, a não ser que o alvo esteja lá e caiba melhor em cima
      const h = cartao.offsetHeight || 300;
      const cobre = r && r.top + r.height > innerHeight - MARGEM - h - 8;
      if (cobre && r.top - topoLivre() > h + 2 * MARGEM) s.top = MARGEM + 'px'; else s.bottom = MARGEM + 'px';
    } else if (p.posicao === 'canto') {
      s.left = innerWidth - larg - MARGEM + 'px'; s.bottom = MARGEM + 'px';
    } else if (r && p.posicao !== 'centro') {
      const h = cartao.offsetHeight || 260;
      const meio = Math.min(Math.max(r.left + r.width / 2 - larg / 2, MARGEM), innerWidth - larg - MARGEM);
      if (innerHeight - (r.top + r.height) > h + 24) { s.left = meio + 'px'; s.top = r.top + r.height + 14 + 'px'; }
      else if (r.top > h + 24) { s.left = meio + 'px'; s.bottom = innerHeight - r.top + 14 + 'px'; }
      else if (innerWidth - (r.left + r.width) > larg + 24) { s.left = r.left + r.width + 14 + 'px'; s.top = Math.max(MARGEM, r.top) + 'px'; }
      else if (r.left > larg + 24) { s.left = r.left - larg - 14 + 'px'; s.top = Math.max(MARGEM, r.top) + 'px'; }
      else { s.left = innerWidth - larg - MARGEM + 'px'; s.bottom = MARGEM + 'px'; }
    } else {
      cartao.classList.add('centro');
    }
    Object.assign(cartao.style, s);
  }

  // fim das abas presas no topo (o que fica atrás delas não aparece)
  const topoLivre = () => document.getElementById('tabs')?.getBoundingClientRect().bottom || 0;
  // Leva o alvo para logo abaixo das abas, deixando o resto da tela para o cartão.
  function rolarAte(el) {
    if (el.closest('#modalBg')) { el.scrollIntoView({ block: 'nearest' }); return; }
    const b = el.getBoundingClientRect();
    if (innerWidth > 640 && b.height < innerHeight * 0.5) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    scrollBy({ top: b.top - topoLivre() - 12, behavior: 'smooth' });
  }

  cartao.addEventListener('click', e => {
    const b = e.target.closest('[data-tut]');
    if (!b || !tut) return;
    const acao = b.dataset.tut;
    if (acao === 'sair') sair();
    else if (acao === 'menu') abrirMenu();
    else if (acao === 'logica') iniciar(POR_ABA[chaveAtual()]);
    else if (acao === 'ferr') { const f = ferramentasDaAba()[+b.dataset.i]; iniciar(f.passos, { ferramenta: f.nome }); }
    else if (acao === 'voltar') ir(tut.i - 1);
    else ir(tut.i + 1);
  });
  botao.addEventListener('click', abrirMenu);

  // Passo com ação: quando a pessoa toca no ponto pedido, comemora e avança sozinho.
  document.addEventListener('click', e => {
    if (!tut || tut.menu || e.target.closest('.tut-raiz')) return;
    const p = tut.passos[tut.i];
    if (!p.espera || tut.feito || tut.conferindo || !e.target.closest(p.espera.seletor)) return;
    const i = tut.i;
    const ok = () => { if (!tut || tut.i !== i) return; tut.feito = true; desenhar(); tut.timer = setTimeout(() => tut && tut.i === i && ir(i + 1), 900); };
    if (!p.espera.quando) return ok();
    // botão Salvar: só comemora se salvou mesmo (painel fechou); se faltou campo, espera a pessoa corrigir
    tut.conferindo = true;
    setTimeout(() => { if (!tut || tut.i !== i) return; tut.conferindo = false; if (p.espera.quando()) ok(); }, 450);
  }, true);

  document.addEventListener('keydown', e => {
    if (!tut) return;
    if (e.key === 'Escape') sair();
    else if (tut.menu) return;
    else if (e.key === 'ArrowRight') ir(tut.i + 1);
    else if (e.key === 'ArrowLeft') ir(tut.i - 1);
  });
  addEventListener('resize', () => tut && !tut.menu && medir());
  addEventListener('scroll', () => tut && !tut.menu && medir(), true);

  // Chamado pelo app a cada tela desenhada: trocou de aba → fecha o tutorial antigo; para o
  // visualizador, o tutorial de cada aba abre sozinho na primeira visita.
  let ultimaChave = null, abrirAuto = null;
  function atualizarBotao() {
    botao.hidden = !!tut || !POR_ABA[chaveAtual()] || document.body.classList.contains('sem-login');
  }
  window.tutAoDesenhar = () => {
    const chave = chaveAtual();
    // trocou de aba: fecha (a ferramenta de orçamento continua ao abrir o editor)
    if (tut && (tut.ferramenta ? tut.aba !== aba : tut.chave !== chave)) sair();
    atualizarBotao();
    if (chave === ultimaChave) return;
    ultimaChave = chave;
    clearTimeout(abrirAuto);
    if (usuario && !ehAdmin() && POR_ABA[chave] && !lerVisto(chave)) abrirAuto = setTimeout(() => { if (!tut && chaveAtual() === chave) iniciar(POR_ABA[chave]); }, 700);
  };
  window.tutAoDesenhar();
})();
