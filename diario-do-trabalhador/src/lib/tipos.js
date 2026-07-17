// Registro guiado por tese (§6): cada tipo captura exatamente
// a prova que aquele direito exige. Copy sóbria (§2.5), sem juridiquês.
export const TIPOS = {
  jornada: {
    icone: '⏰',
    nome: 'Jornada / horas extras',
    pergunta: 'Como foi sua jornada?',
    campos: [
      { chave: 'entrada', rotulo: 'Que horas você começou?', tipo: 'time' },
      { chave: 'saida', rotulo: 'Que horas você terminou?', tipo: 'time' },
      { chave: 'intervalo', rotulo: 'Quanto tempo de intervalo você teve? (minutos)', tipo: 'number' },
      { chave: 'local', rotulo: 'Onde você trabalhou hoje?', tipo: 'text' }
    ],
    dicaRelato: 'Se quiser, conte algo a mais sobre o dia (o que estava fazendo, quem pediu, etc.).'
  },
  assedio: {
    icone: '🗣️',
    nome: 'Assédio / constrangimento',
    pergunta: 'Conte o que aconteceu, do seu jeito.',
    acolhimento: 'Sentimos muito que você esteja passando por isso. Registre com calma. Este espaço é seu e é protegido.',
    campos: [
      { chave: 'quem', rotulo: 'Quem fez ou disse isso?', tipo: 'text' },
      { chave: 'testemunhas', rotulo: 'Alguém viu ou ouviu? (nomes)', tipo: 'text' },
      { chave: 'onde', rotulo: 'Onde aconteceu?', tipo: 'text' }
    ],
    dicaRelato: 'Escreva as palavras como foram ditas, do jeito que você lembra. O relato feito perto do fato vale muito.',
    apoio: true
  },
  desvio_funcao: {
    icone: '🔀',
    nome: 'Desvio / acúmulo de função',
    pergunta: 'O que você fez que não é da sua função?',
    campos: [
      { chave: 'funcao_contratada', rotulo: 'Qual é a sua função na carteira?', tipo: 'text' },
      { chave: 'tarefa_real', rotulo: 'Que tarefa você fez de verdade?', tipo: 'text' },
      { chave: 'frequencia', rotulo: 'Isso acontece com que frequência?', tipo: 'text' }
    ],
    dicaRelato: 'Conte como foi hoje. Registrar cada vez que acontece mostra que é rotina, não exceção.'
  },
  verbas: {
    icone: '💰',
    nome: 'Verbas e benefícios',
    pergunta: 'O que está faltando ou veio errado?',
    campos: [
      { chave: 'verba', rotulo: 'Do que se trata? (ex.: vale-transporte, hora extra no holerite, FGTS)', tipo: 'text' },
      { chave: 'competencia', rotulo: 'De qual mês?', tipo: 'month' },
      { chave: 'documento', rotulo: 'Você tem o documento? Qual?', tipo: 'text' }
    ],
    dicaRelato: 'Descreva o que você percebeu. O Diário organiza a informação — quem calcula valores é um profissional habilitado.'
  },
  seguranca: {
    icone: '⚠️',
    nome: 'Segurança e saúde',
    pergunta: 'O que você viu ou viveu no ambiente de trabalho?',
    campos: [
      { chave: 'local', rotulo: 'Onde foi?', tipo: 'text' },
      { chave: 'risco', rotulo: 'Qual era o risco ou o que faltava? (ex.: EPI, proteção)', tipo: 'text' },
      { chave: 'acidente', rotulo: 'Houve acidente?', tipo: 'select', opcoes: ['Não', 'Sim, sem afastamento', 'Sim, com afastamento'] },
      { chave: 'cat', rotulo: 'A empresa emitiu a CAT?', tipo: 'select', opcoes: ['Não se aplica', 'Sim', 'Não', 'Não sei'] }
    ],
    dicaRelato: 'Descreva o ambiente como estava. Na Fase 2 você poderá anexar fotos datadas.'
  },
  livre: {
    icone: '📝',
    nome: 'Registro livre',
    pergunta: 'O que você quer registrar?',
    campos: [],
    dicaRelato: 'Anote o que for importante para a sua vida profissional.'
  }
}

// Alerta honesto de jornada inverossímil (§6): o mesmo defeito do
// "ponto britânico" que invalida o controle do empregador.
export function alertaJornada(dados) {
  if (!dados.entrada || !dados.saida) return null
  const [he, me] = dados.entrada.split(':').map(Number)
  const [hs, ms] = dados.saida.split(':').map(Number)
  let minutos = hs * 60 + ms - (he * 60 + me)
  if (minutos <= 0) minutos += 24 * 60
  const trabalhado = minutos - (Number(dados.intervalo) || 0)
  if (trabalhado > 16 * 60) {
    return 'Confira os horários: uma jornada acima de 16 horas é muito questionada. Registre exatamente o que aconteceu.'
  }
  return null
}
