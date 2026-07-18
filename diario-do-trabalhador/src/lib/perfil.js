// Cadastro Inteligente Progressivo 2.0 (Pilar 6): dado em troca de benefício,
// com consentimento LGPD. Nível e completude vêm do servidor.
import { supabase } from './supabase'

export const TERMO_VERSAO = '2026-07-18'

export const NIVEIS = {
  bronze: { selo: '🥉', nome: 'Inicial', beneficio: 'Diário completo e protegido' },
  prata: { selo: '🥈', nome: 'Prata', beneficio: 'Funcionalidades extras liberadas' },
  ouro: { selo: '🥇', nome: 'Ouro', beneficio: 'Benefícios exclusivos e recomendações personalizadas' },
  diamante: { selo: '💎', nome: 'Diamante', beneficio: 'Vantagens premium e diagnósticos avançados' }
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
  delete linha.completude
  delete linha.consentido_em
  delete linha.criado_em
  delete linha.atualizado_em
  // datas vazias viram null (o Postgres rejeita '' em colunas date)
  if (linha.data_nascimento === '') linha.data_nascimento = null
  if (linha.data_admissao === '') linha.data_admissao = null
  const { data: salvo, error } = await supabase
    .from('dt_perfis')
    .upsert(linha, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) throw error
  localStorage.setItem('dt_perfil', JSON.stringify(salvo))
  return salvo
}

// Busca automática de cidade/UF pelo CEP (ViaCEP — serviço público e gratuito).
export async function buscarCEP(cep) {
  const limpo = String(cep || '').replace(/\D/g, '')
  if (limpo.length !== 8) return null
  try {
    const r = await fetch('https://viacep.com.br/ws/' + limpo + '/json/')
    const d = await r.json()
    if (d && !d.erro) return { cidade: d.localidade || '', uf: d.uf || '' }
  } catch { /* sem internet: preencher manualmente */ }
  return null
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
