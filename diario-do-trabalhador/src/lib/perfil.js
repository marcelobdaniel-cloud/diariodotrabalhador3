// Cadastro Inteligente Progressivo (Pilar 6): pedir dado em troca de
// benefício claro, com consentimento LGPD. Nível oficial vem do servidor;
// aqui só espelhamos a regra para mostrar "o que falta" na interface.
import { supabase } from './supabase'

export const TERMO_VERSAO = '2026-07-17'

export const NIVEIS = {
  bronze: { selo: '🥉', nome: 'Bronze', beneficio: 'Diário completo e protegido' },
  prata: { selo: '🥈', nome: 'Prata', beneficio: 'Alertas e informações do seu perfil profissional' },
  ouro: { selo: '🥇', nome: 'Ouro', beneficio: 'Prioridade nos serviços e parceiros do ecossistema' }
}

// Campos exigidos para o nível Prata (raio-x estilo Gov.BR + vida profissional).
export const CAMPOS_PRATA = [
  ['cpf', 'CPF'],
  ['data_nascimento', 'Data de nascimento'],
  ['nome_mae', 'Nome da mãe'],
  ['cep', 'CEP'],
  ['cidade', 'Cidade'],
  ['uf', 'Estado (UF)'],
  ['escolaridade', 'Escolaridade'],
  ['situacao_trabalho', 'Situação de trabalho'],
  ['profissao', 'Profissão / função'],
  ['ctps_numero', 'Número da Carteira de Trabalho'],
  ['sindicato_filiado', 'Filiação a sindicato'],
  ['tem_advogado', 'Advogado trabalhista']
]

export function faltamParaPrata(p) {
  if (!p) return CAMPOS_PRATA.map(([, rotulo]) => rotulo)
  return CAMPOS_PRATA.filter(([chave]) => {
    const v = p[chave]
    return v === null || v === undefined || String(v).trim() === ''
  }).map(([, rotulo]) => rotulo)
}

export async function carregarPerfil() {
  const { data } = await supabase.auth.getSession()
  if (!data || !data.session) return null
  const { data: row, error } = await supabase
    .from('dt_perfis')
    .select('*')
    .eq('user_id', data.session.user.id)
    .maybeSingle()
  if (error) return undefined // erro de rede: não confundir com "sem perfil"
  if (row) localStorage.setItem('dt_perfil', JSON.stringify(row))
  return row
}

export function perfilEmCache() {
  try {
    const raw = localStorage.getItem('dt_perfil')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function salvarPerfil(campos) {
  const { data } = await supabase.auth.getSession()
  if (!data || !data.session) throw new Error('sem-sessao')
  const linha = { ...campos, user_id: data.session.user.id, termo_versao: TERMO_VERSAO }
  // Campos controlados pelo servidor: o cliente nunca os envia.
  delete linha.nivel
  delete linha.consentido_em
  delete linha.criado_em
  delete linha.atualizado_em
  // datas vazias viram null (o Postgres rejeita '' em colunas date)
  if (linha.data_nascimento === '') linha.data_nascimento = null
  const { data: salvo, error } = await supabase
    .from('dt_perfis')
    .upsert(linha, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) throw error
  localStorage.setItem('dt_perfil', JSON.stringify(salvo))
  return salvo
}

// Foto → miniatura comprimida (Celular-Piso: nada de upload pesado).
export function comprimirFoto(arquivo, ladoMax = 320, qualidade = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(arquivo)
    img.onload = () => {
      const escala = Math.min(1, ladoMax / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * escala)
      c.height = Math.round(img.height * escala)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', qualidade))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('foto-invalida')) }
    img.src = url
  })
}
