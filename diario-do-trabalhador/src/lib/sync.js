// Integridade em dois tempos (§7.3):
// 1º tempo (offline): hora do aparelho + hash local — já feito ao salvar.
// 2º tempo (aqui): servidor confirma, adiciona carimbo e fecha a cadeia de hash.
import { supabase } from './supabase'
import { pendentes, salvarLocal, listarLocal } from './idb'

let sincronizando = false

function avisarMudanca(onChange) {
  if (onChange) onChange()
  window.dispatchEvent(new Event('dt-sync'))
}

export async function sincronizar(onChange) {
  if (sincronizando || !navigator.onLine) return
  const { data } = await supabase.auth.getSession()
  const sessao = data && data.session
  if (!sessao) return

  sincronizando = true
  try {
    // Só sincroniza registros do usuário logado (aparelho pode ser compartilhado).
    const fila = await pendentes(sessao.user.id)
    for (const r of fila) {
      const { data: inserido, error } = await supabase
        .from('dt_registros')
        .insert({
          id: r.id,
          user_id: sessao.user.id,
          tipo: r.tipo,
          relato: r.relato,
          dados: r.dados,
          fato_em: r.fato_em,
          registrado_em_dispositivo: r.registrado_em_dispositivo,
          hash_local: r.hash_local,
          errata_de: r.errata_de || null
        })
        .select('recebido_em, hash_servidor')
        .single()

      if (!error && inserido) {
        await salvarLocal({
          ...r,
          status: 'sincronizado',
          recebido_em: inserido.recebido_em,
          hash_servidor: inserido.hash_servidor
        })
        avisarMudanca(onChange)
      } else if (error && error.code === '23505') {
        // Já existe no servidor (tentativa repetida): recupera o selo.
        const { data: existente } = await supabase
          .from('dt_registros')
          .select('recebido_em, hash_servidor')
          .eq('id', r.id)
          .single()
        if (existente) {
          await salvarLocal({ ...r, status: 'sincronizado', ...existente })
          avisarMudanca(onChange)
        }
      }
      // Outros erros: mantém pendente e tenta na próxima janela de rede.
    }
  } finally {
    sincronizando = false
  }
}

// A prova vive no servidor (§7.4): ao abrir com internet, baixa os registros
// selados para o aparelho (troca de celular não perde a linha do tempo).
export async function baixarDoServidor(onChange) {
  if (!navigator.onLine) return
  const { data } = await supabase.auth.getSession()
  if (!data || !data.session) return
  const { data: rows, error } = await supabase
    .from('dt_registros')
    .select('id, user_id, tipo, relato, dados, fato_em, registrado_em_dispositivo, hash_local, recebido_em, hash_servidor, errata_de')
    .order('recebido_em', { ascending: true })
  if (error || !rows) return
  const locais = await listarLocal()
  const porId = new Map(locais.map((r) => [r.id, r]))
  let mudou = false
  for (const row of rows) {
    const local = porId.get(row.id)
    // Também "cura" registros locais antigos sem user_id.
    if (!local || local.status !== 'sincronizado' || !local.user_id) {
      await salvarLocal({ ...row, status: 'sincronizado' })
      mudou = true
    }
  }
  if (mudou) avisarMudanca(onChange)
}

export function iniciarSyncAutomatico(onChange) {
  window.addEventListener('online', () => sincronizar(onChange))
  const timer = setInterval(() => sincronizar(onChange), 60000)
  baixarDoServidor(onChange).then(() => sincronizar(onChange))
  return () => clearInterval(timer)
}
