import React, { useRef, useState } from 'react'
import { NIVEIS, salvarPerfil, comprimirFoto, buscarCEP } from '../lib/perfil'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const SIMNAO = ['sim', 'nao']

// ——— DEFINIÇÃO DOS CAMPOS (data-driven) ———
// tipo: text | numero | data | select | multi
const N1 = [
  { g: 'Identificação' },
  { c: 'nome_completo', r: 'Nome completo', t: 'text', req: true },
  { c: 'cpf', r: 'CPF (só números)', t: 'text', ph: '000.000.000-00' },
  { c: 'data_nascimento', r: 'Data de nascimento', t: 'data' },
  { c: 'sexo', r: 'Sexo (opcional)', t: 'select', o: ['Feminino','Masculino','Prefiro não informar'] },
  { c: 'estado_civil', r: 'Estado civil', t: 'select', o: ['Solteiro(a)','Casado(a)','União estável','Divorciado(a)','Viúvo(a)'] },
  { g: 'Contato' },
  { c: 'telefone', r: 'Celular / WhatsApp (com DDD)', t: 'text', ph: '(11) 99999-9999', req: true },
  { c: 'email_contato', r: 'E-mail de contato', t: 'text', req: true },
  { g: 'Endereço' },
  { c: 'cep', r: 'CEP (cidade e estado preenchem sozinhos)', t: 'cep', ph: '00000-000' },
  { c: 'cidade', r: 'Cidade', t: 'text' },
  { c: 'uf', r: 'Estado (UF)', t: 'select', o: UFS },
  { g: 'Trabalho' },
  { c: 'empresa_atual', r: 'Empresa', t: 'text' },
  { c: 'cargo', r: 'Cargo / função', t: 'text' },
  { c: 'data_admissao', r: 'Data de admissão', t: 'data' },
  { c: 'faixa_salarial', r: 'Faixa salarial', t: 'select', o: ['Até 1 salário mínimo','1 a 2 salários','2 a 3 salários','3 a 5 salários','5 a 10 salários','Acima de 10 salários'] },
  { c: 'tipo_contrato', r: 'Tipo de contrato', t: 'select', o: ['CLT','PJ','Autônomo','Temporário','Estágio','Servidor público','Informal / sem contrato'] }
]

const N2 = [
  { g: 'Família' },
  { c: 'conjuge', r: 'Tem cônjuge/companheiro(a)?', t: 'select', o: SIMNAO },
  { c: 'filhos', r: 'Quantos filhos?', t: 'numero' },
  { c: 'dependentes', r: 'Quantos dependentes?', t: 'numero' },
  { g: 'Educação' },
  { c: 'escolaridade', r: 'Escolaridade', t: 'select', col: true, o: ['Fundamental incompleto','Fundamental completo','Médio incompleto','Médio completo','Técnico','Superior incompleto','Superior completo','Pós-graduação'] },
  { c: 'cursos', r: 'Cursos que fez ou faz', t: 'text' },
  { c: 'idiomas', r: 'Idiomas', t: 'text', ph: 'ex.: espanhol básico' },
  { g: 'Finanças' },
  { c: 'faixa_renda_familiar', r: 'Renda familiar (todos da casa)', t: 'select', o: ['Até 2 salários','2 a 4 salários','4 a 6 salários','6 a 10 salários','Acima de 10 salários'] },
  { c: 'bancos', r: 'Bancos que usa', t: 'text', ph: 'ex.: Caixa, Nubank' },
  { c: 'cartoes', r: 'Tem cartão de crédito?', t: 'select', o: SIMNAO },
  { c: 'gasto_mensal', r: 'Gasto mensal aproximado (R$)', t: 'numero' },
  { c: 'possui_financiamento', r: 'Possui financiamento?', t: 'select', o: SIMNAO },
  { c: 'possui_dividas', r: 'Possui dívidas?', t: 'select', o: SIMNAO },
  { g: 'Trabalho' },
  { c: 'situacao_trabalho', r: 'Situação de trabalho', t: 'select', col: true, o: ['Empregado com carteira','Empregado sem carteira','Autônomo / conta própria','Desempregado','Aposentado','Outro'] },
  { c: 'beneficios', r: 'Benefícios que recebe', t: 'text', ph: 'ex.: VT, VR, plano de saúde' },
  { c: 'jornada', r: 'Jornada de trabalho', t: 'select', o: ['44h semanais','40h semanais','36h semanais','30h ou menos','12x36','Escala / turnos','Sem jornada fixa'] },
  { c: 'sindicato_filiado', r: 'É filiado a sindicato?', t: 'select', col: true, o: SIMNAO },
  { g: 'Moradia' },
  { c: 'moradia_tipo', r: 'Moradia', t: 'select', o: ['Casa própria','Alugada','Financiada','Cedida / de familiares'] },
  { c: 'pessoas_residencia', r: 'Quantas pessoas moram na casa?', t: 'numero' },
  { g: 'Transporte' },
  { c: 'transporte', r: 'Como se locomove?', t: 'multi', o: ['Carro','Moto','Bicicleta','Transporte público','A pé'] }
]

const SAUDE = ['doencas_cronicas','medicamentos','plano_saude','alergias','deficiencia','altura','peso']
const N3 = [
  { g: 'Saúde (só com seu consentimento específico)' },
  { c: 'doencas_cronicas', r: 'Doenças crônicas', t: 'text', ph: 'ex.: hipertensão' },
  { c: 'medicamentos', r: 'Medicamentos de uso contínuo', t: 'text' },
  { c: 'plano_saude', r: 'Tem plano de saúde?', t: 'select', o: SIMNAO },
  { c: 'alergias', r: 'Alergias', t: 'text' },
  { c: 'deficiencia', r: 'Possui alguma deficiência?', t: 'text', ph: 'se sim, qual' },
  { c: 'altura', r: 'Altura (cm)', t: 'numero' },
  { c: 'peso', r: 'Peso (kg)', t: 'numero' },
  { g: 'Academia' },
  { c: 'academia_frequencia', r: 'Frequenta academia?', t: 'select', o: ['Não','1-2x por semana','3-4x por semana','5x ou mais'] },
  { c: 'academia_modalidade', r: 'Modalidade', t: 'text', ph: 'ex.: musculação' },
  { c: 'academia_nome', r: 'Qual academia?', t: 'text' },
  { c: 'academia_objetivos', r: 'Objetivos', t: 'text', ph: 'ex.: saúde, emagrecer' },
  { g: 'Esportes' },
  { c: 'esportes_praticados', r: 'Esportes que pratica', t: 'text' },
  { c: 'esportes_favoritos', r: 'Esportes favoritos', t: 'text' },
  { c: 'time_coracao', r: 'Time do coração', t: 'text' },
  { c: 'segundo_time', r: 'Segundo time', t: 'text' },
  { c: 'atleta_favorito', r: 'Atleta favorito', t: 'text' },
  { g: 'Hobbies' },
  { c: 'hobbies', r: 'O que você curte?', t: 'multi', o: ['Livros','Música','Filmes','Séries','Games','Tecnologia','Gastronomia','Jardinagem','Fotografia','Pesca','Camping','Churrasco','Carros','Motociclismo'] },
  { g: 'Viagens' },
  { c: 'viagem_tipo', r: 'Costuma viajar…', t: 'select', o: ['Só nacional','Nacional e internacional','Quase não viajo'] },
  { c: 'viagem_preferencias', r: 'Prefere', t: 'multi', o: ['Praia','Serra','Campo','Cruzeiros','Ecoturismo'] },
  { c: 'destino_sonhos', r: 'Destino dos sonhos', t: 'text' },
  { c: 'viagem_frequencia', r: 'Viaja com que frequência?', t: 'select', o: ['Raramente','1x por ano','2-3x por ano','4x ou mais'] },
  { g: 'Consumo (gastos mensais aproximados, em R$)' },
  { c: 'gasto_supermercado', r: 'Supermercado', t: 'numero' },
  { c: 'gasto_farmacia', r: 'Farmácia', t: 'numero' },
  { c: 'gasto_combustivel', r: 'Combustível', t: 'numero' },
  { c: 'gasto_delivery', r: 'Delivery', t: 'numero' },
  { c: 'gasto_roupas', r: 'Roupas', t: 'numero' },
  { c: 'gasto_lazer', r: 'Lazer', t: 'numero' },
  { c: 'gasto_pets', r: 'Pets', t: 'numero' },
  { c: 'gasto_educacao', r: 'Educação', t: 'numero' },
  { c: 'streamings', r: 'Streamings que assina', t: 'text', ph: 'ex.: Netflix, Spotify' },
  { c: 'marcas_favoritas', r: 'Marcas favoritas', t: 'text' },
  { g: 'Tecnologia' },
  { c: 'celular_so', r: 'Celular', t: 'select', o: ['Android','iPhone'] },
  { c: 'tem_notebook', r: 'Tem notebook?', t: 'select', o: SIMNAO },
  { c: 'tem_smarttv', r: 'Tem Smart TV?', t: 'select', o: SIMNAO },
  { c: 'tem_smartwatch', r: 'Tem smartwatch?', t: 'select', o: SIMNAO },
  { c: 'assistente_virtual', r: 'Usa assistente virtual?', t: 'select', o: ['Não','Alexa','Google Assistente','Siri','Mais de um'] },
  { g: 'Perfil comportamental (se souber)' },
  { c: 'perfil_disc', r: 'Perfil DISC', t: 'text' },
  { c: 'perfil_bigfive', r: 'Big Five', t: 'text' },
  { c: 'perfil_mbti', r: 'MBTI (opcional)', t: 'text', ph: 'ex.: ENFP' },
  { c: 'perfil_financeiro', r: 'Perfil financeiro', t: 'select', o: ['Poupador','Equilibrado','Gastador','Investidor'] },
  { c: 'perfil_consumo', r: 'Perfil de consumo', t: 'select', o: ['Busca preço','Busca qualidade','Busca marca','Busca praticidade'] },
  { c: 'perfil_lideranca', r: 'Perfil de liderança', t: 'select', o: ['Lidero equipes','Já liderei','Quero liderar','Não me interessa'] },
  { g: 'Sonhos e objetivos' },
  { c: 'sonhos', r: 'Seus objetivos', t: 'multi', o: ['Comprar casa','Comprar carro','Casar','Ter filhos','Abrir empresa','Fazer faculdade','Viajar pelo mundo','Aposentadoria tranquila'] },
  { c: 'meta_renda', r: 'Meta de renda mensal (R$)', t: 'numero' },
  { c: 'meta_patrimonial', r: 'Meta de patrimônio (R$)', t: 'numero' },
  { g: 'Preferências de contato' },
  { c: 'horario_contato', r: 'Melhor horário para contato', t: 'select', o: ['Manhã','Tarde','Noite','Qualquer horário'] },
  { c: 'ofertas_whatsapp', r: 'Aceita ofertas por WhatsApp?', t: 'select', o: SIMNAO },
  { c: 'ofertas_email', r: 'Aceita ofertas por e-mail?', t: 'select', o: SIMNAO },
  { c: 'categorias_interesse', r: 'Assuntos de interesse', t: 'multi', o: ['Emprego','Educação','Crédito','Saúde','Seguros','Benefícios','Investimentos'] }
]

function rotuloOpcao(v) { return v === 'sim' ? 'Sim' : v === 'nao' ? 'Não' : v }

export default function Cadastro({ perfil, emailConta, aoConcluir, aoVoltar, passoInicial }) {
  const [passo, setPasso] = useState(passoInicial || 1)
  const [p, setP] = useState(() => ({
    nome_completo: '', telefone: '', email_contato: emailConta || '',
    cpf: '', data_nascimento: '', sexo: '', estado_civil: '', cep: '', cidade: '', uf: '',
    empresa_atual: '', cargo: '', data_admissao: '', faixa_salarial: '', tipo_contrato: '',
    escolaridade: '', situacao_trabalho: '', sindicato_filiado: '', sindicato_nome: '',
    ctps_numero: '', ctps_serie: '', pis: '', nome_mae: '', profissao: '', tem_advogado: '',
    foto_b64: '', consent_tratamento: false, consent_divulgacao: false,
    aceite_termos: false, consent_saude: false,
    ...(perfil || {}),
    extras: { ...((perfil && perfil.extras) || {}) },
    platinum: { ...((perfil && perfil.platinum) || {}) }
  }))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const fotoRef = useRef(null)

  function set(chave, valor) { setP((x) => ({ ...x, [chave]: valor })) }
  function setJ(grupo, chave, valor) {
    setP((x) => ({ ...x, [grupo]: { ...x[grupo], [chave]: valor } }))
  }

  async function aoDigitarCEP(v) {
    set('cep', v)
    const achado = await buscarCEP(v)
    if (achado) setP((x) => ({ ...x, cidade: achado.cidade, uf: achado.uf }))
  }

  async function salvar(proximoPasso) {
    setErro(''); setSalvando(true)
    try {
      const salvo = await salvarPerfil(p)
      setP((x) => ({ ...x, ...salvo, extras: salvo.extras || {}, platinum: salvo.platinum || {} }))
      if (proximoPasso) setPasso(proximoPasso)
      else aoConcluir(salvo)
    } catch (e) {
      setErro(
        e && e.message === 'sem-sessao'
          ? 'Sua sessão expirou. Entre de novo.'
          : 'Não foi possível salvar agora. Confira a internet e tente de novo.'
      )
    } finally {
      setSalvando(false)
    }
  }

  function enviarPasso1(e) {
    e.preventDefault()
    if (!p.aceite_termos) { setErro('Para continuar, aceite os Termos de Uso.'); return }
    if (!p.consent_tratamento) { setErro('Para criar o cadastro, é preciso aceitar a Política de Privacidade (LGPD).'); return }
    salvar(2)
  }

  function CampoAuto({ def, grupo }) {
    const valor = grupo ? (p[grupo][def.c] ?? '') : (p[def.c] ?? '')
    const mudar = (v) => (grupo ? setJ(grupo, def.c, v) : set(def.c, v))
    const id = (grupo || 'c') + '_' + def.c
    if (def.t === 'select') {
      return (
        <div>
          <label htmlFor={id}>{def.r}</label>
          <select id={id} value={valor} onChange={(e) => mudar(e.target.value)}>
            <option value="">— escolher —</option>
            {def.o.map((op) => <option key={op} value={op}>{rotuloOpcao(op)}</option>)}
          </select>
        </div>
      )
    }
    if (def.t === 'multi') {
      const marcados = String(valor).split(',').filter(Boolean)
      const alternar = (op) => {
        const novo = marcados.includes(op) ? marcados.filter((x) => x !== op) : [...marcados, op]
        mudar(novo.join(','))
      }
      return (
        <div>
