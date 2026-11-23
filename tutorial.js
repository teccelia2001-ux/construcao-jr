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

  function abrir() {
    const chave = chaveAtual();
    if (!POR_ABA[chave]) return;
    tut = { chave, passos: POR_ABA[chave].filter(p => !p.soAdmin || ehAdmin()), i: 0 };
    raiz.hidden = false; botao.hidden = true;
    ir(0);
  }
  function sair() {
    if (!tut) return;
    gravarVisto(tut.chave);
    clearTimeout(tut.timer); clearInterval(tut.medidor);
    if (tut.passos.some(p => p.alvo === '#modalBg .modal')) fecharModal();
    tut = null; raiz.hidden = true; atualizarBotao();
  }
  function ir(n) {
    clearTimeout(tut.timer); clearInterval(tut.medidor);
    tut.i = Math.max(0, Math.min(tut.passos.length - 1, n));
    tut.feito = false; tut.rolou = false;
    const p = tut.passos[tut.i];
    if (p.fechar && !document.getElementById('modalBg').hidden) fecharModal();
    if (p.abrir && document.getElementById('modalBg').hidden) acharAlvo(p.abrir)?.click();
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
      </div>`;
    cartao.scrollTop = 0;
  }

  // Ilumina o alvo e posiciona o cartão: abaixo/acima do alvo no computador; no celular, embaixo
  // (ou em cima, quando o alvo está na metade de baixo da tela).
  function medir() {
    if (!tut) return;
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
    if (b.dataset.tut === 'sair') sair();
    else if (b.dataset.tut === 'voltar') ir(tut.i - 1);
    else ir(tut.i + 1);
  });
  botao.addEventListener('click', abrir);

  // Passo com ação: quando a pessoa toca no ponto pedido, comemora e avança sozinho.
  document.addEventListener('click', e => {
    if (!tut || e.target.closest('.tut-raiz')) return;
    const p = tut.passos[tut.i];
    if (!p.espera || tut.feito || !e.target.closest(p.espera.seletor)) return;
    tut.feito = true; desenhar();
    tut.timer = setTimeout(() => tut && ir(tut.i + 1), 900);
  }, true);

  document.addEventListener('keydown', e => {
    if (!tut) return;
    if (e.key === 'Escape') sair();
    else if (e.key === 'ArrowRight') ir(tut.i + 1);
    else if (e.key === 'ArrowLeft') ir(tut.i - 1);
  });
  addEventListener('resize', medir);
  addEventListener('scroll', medir, true);

  // Chamado pelo app a cada tela desenhada: trocou de aba → fecha o tutorial antigo; para o
  // visualizador, o tutorial de cada aba abre sozinho na primeira visita.
  let ultimaChave = null, abrirAuto = null;
  function atualizarBotao() {
    botao.hidden = !!tut || !POR_ABA[chaveAtual()] || document.body.classList.contains('sem-login');
  }
  window.tutAoDesenhar = () => {
    const chave = chaveAtual();
    if (tut && tut.chave !== chave) sair();
    atualizarBotao();
    if (chave === ultimaChave) return;
    ultimaChave = chave;
    clearTimeout(abrirAuto);
    if (usuario && !ehAdmin() && POR_ABA[chave] && !lerVisto(chave)) abrirAuto = setTimeout(() => { if (!tut && chaveAtual() === chave) abrir(); }, 700);
  };
  window.tutAoDesenhar();
})();
