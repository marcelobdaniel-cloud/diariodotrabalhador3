import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ——— PONTO ELETRÔNICO INFORMAL ———
// Registro pessoal de entrada, pausa, retorno e saída. Cada marcação é
// imutável no servidor (sem editar, sem apagar) — correções viram anotação
// no Diário. Funciona offline: a marcação fica na fila do aparelho e sobe
// quando a internet volta.

const MARCOS = [
  { m: 'entrada', rotulo: 'Entrada', icone: '🟢' },
  { m: 'pausa', rotulo: 'Pausa', icone: '🍽️' },
  { m: 'retorno', rotulo: 'Retorno', icone: '🔵' },
  { m: 'saida', rotulo: 'Saída', icone: '🔴' }
]
const LIMITE_DIA_MIN = 10 * 60 // 8h + 2h extras (CLT art. 59)

const FILA = 'dt_ponto_fila'
function filaLer() { try { return JSON.parse(localStorage.getItem(FILA)) || [] } catch { return [] } }
function filaGravar(f) { localStorage.setItem(FILA, JSON.stringify(f)) }

async function enviarFila(userId) {
  const fila = filaLer()
  if (!fila.length) return
  const resto = []
  for (const item of fila) {
    const { error } = await supabase.from('dt_pontos').insert({ ...item, user_id: userId })
    if (error && !String(error.message || '').includes('duplicate')) resto.push(item)
  }
  filaGravar(resto)
}

function hhmm(d) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function minutosParaTexto(min) {
  const neg = min < 0
  const m = Math.abs(Math.round(min))
  return (neg ? '-' : '') + Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0')
}

// Soma os minutos trabalhados de uma lista de marcações de UM dia.
function minutosDoDia(marcas, agora) {
  const seq = [...marcas].sort((a, b) => new Date(a.em) - new Date(b.em))
  let total = 0
  let aberto = null
  for (const p of seq) {
    if (p.marco === 'entrada' || p.marco === 'retorno') {
      if (!aberto) aberto = new Date(p.em)
    } else if (p.marco === 'pausa' || p.marco === 'saida') {
      if (aberto) { total += (new Date(p.em) - aberto) / 60000; aberto = null }
    }
  }
  if (aberto && agora) total += (agora - aberto) / 60000 // dia ainda em andamento
  return { total, emAndamento: !!aberto }
}

function chaveDia(d) {
  const x = new Date(d)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}

export default function Ponto({ aoVoltar }) {
  const [marcasMes, setMarcasMes] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [tique, setTique] = useState(Date.now())

  const carregar = useCallback(async () => {
    setErro('')
    const { data: s } = await supabase.auth.getSession()
    if (!s || !s.session) return
    await enviarFila(s.session.user.id).catch(() => {})
    const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from('dt_pontos').select('*')
      .gte('em', inicioMes.toISOString())
      .order('em', { ascending: true })
    if (error) {
      // Sem internet: mostra o que está na fila local do dia
      setMarcasMes(filaLer())
      setAviso('Sem conexão agora — mostrando as marcações do aparelho. Tudo será enviado quando a internet voltar.')
      return
    }
    const fila = filaLer()
    setMarcasMes([...(data || []), ...fila])
    setAviso(fila.length ? fila.length + ' marcação(ões) aguardando internet para envio.' : '')
  }, [])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    const t = setInterval(() => setTique(Date.now()), 30000)
    const on = () => carregar()
    window.addEventListener('online', on)
    return () => { clearInterval(t); window.removeEventListener('online', on) }
  }, [carregar])

  const hoje = chaveDia(new Date())
  const marcasHoje = (marcasMes || []).filter((p) => chaveDia(p.em) === hoje)
  const feitos = marcasHoje.map((p) => p.marco)
  const proximo = MARCOS.find((x) => !feitos.includes(x.m))
  const { total: minHoje, emAndamento } = minutosDoDia(marcasHoje, new Date(tique))

  // Resumo do mês (dias fechados + hoje)
  const porDia = {}
  for (const p of marcasMes || []) {
    const k = chaveDia(p.em)
    ;(porDia[k] = porDia[k] || []).push(p)
  }
  let minMes = 0
  let diasComPonto = 0
  for (const k of Object.keys(porDia)) {
    diasComPonto += 1
    minMes += minutosDoDia(porDia[k], k === hoje ? new Date(tique) : null).total
  }
  const extrasMes = Object.keys(porDia).reduce((acc, k) => {
    const t = minutosDoDia(porDia[k], k === hoje ? new Date(tique) : null).total
    return acc + Math.max(0, t - 8 * 60)
  }, 0)

  async function marcar(marco) {
    setOcupado(true); setErro('')
    try {
      const item = { marco, em: new Date().toISOString() }
      const { data: s } = await supabase.auth.getSession()
      if (!s || !s.session) throw new Error('sem-sessao')
      const { error } = await supabase.from('dt_pontos').insert({ ...item, user_id: s.session.user.id })
      if (error) {
        filaGravar([...filaLer(), item]) // offline: guarda no aparelho
      }
      await carregar()
    } catch {
      setErro('Não foi possível registrar. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  const status = feitos.includes('saida')
    ? '✅ Expediente encerrado'
    : feitos.includes('retorno')
      ? '💼 Em expediente (após a pausa)'
      : feitos.includes('pausa')
        ? '🍽️ Em pausa'
        : feitos.includes('entrada')
          ? '💼 Em expediente'
          : '🌙 Fora de turno'

  return (
    <div className="conteudo">
      <button className="voltar" onClick={aoVoltar}>← Voltar</button>
      <h2>🕐 Ponto do dia</h2>

      <div className="cartao">
        <div className="linha1" style={{ justifyContent: 'space-between' }}>
          <strong>{status}</strong>
          <span>{minutosParaTexto(minHoje)}{emAndamento ? ' ⏳' : ''} hoje</span>
        </div>
        <div className="datas" style={{ marginTop: 6 }}>
          {MARCOS.map((x) => {
            const p = marcasHoje.find((q) => q.marco === x.m)
            return (
              <div key={x.m}>
                {x.icone} {x.rotulo}: {p ? <strong>{hhmm(p.em)}</strong> : '—'}
              </div>
            )
          })}
        </div>
      </div>

      {proximo ? (
        <button className="botao-central" disabled={ocupado} onClick={() => marcar(proximo.m)}>
          {proximo.icone} Registrar {proximo.rotulo} agora
        </button>
      ) : (
        <p style={{ textAlign: 'center' }}>Todas as marcações de hoje foram feitas. Bom descanso! 👏</p>
      )}
      {proximo && proximo.m !== 'entrada' && (
        <p className="datas" style={{ textAlign: 'center' }}>
          A hora registrada é a do momento do toque e não pode ser alterada — é isso que dá força ao seu registro.
        </p>
      )}

      {minHoje > LIMITE_DIA_MIN && (
        <div className="aviso-limite">
          ⚠️ Você já passou de {minutosParaTexto(LIMITE_DIA_MIN)} hoje — acima do limite
          legal de 2 horas extras por dia (CLT, art. 59). Vale registrar o motivo no
          Diário e guardar comprovantes.
        </div>
      )}

      <h2 style={{ marginTop: 16 }}>📅 Seu mês</h2>
      <div className="cartao">
        <div className="datas" style={{ lineHeight: 1.9 }}>
          <div>Dias com ponto: <strong>{diasComPonto}</strong></div>
          <div>Horas trabalhadas: <strong>{minutosParaTexto(minMes)}</strong></div>
          <div>Além de 8h/dia (possíveis extras): <strong>{minutosParaTexto(extrasMes)}</strong></div>
        </div>
        <div className="datas" style={{ marginTop: 6, fontSize: 12 }}>
          Referência simples de 8h/dia (CLT). Sua jornada de contrato pode ser
          diferente — este é um controle pessoal, não substitui o ponto oficial da empresa.
        </div>
      </div>

      {aviso && <div className="rodape-offline">{aviso}</div>}
      {erro && <p className="msg-erro" role="alert">{erro}</p>}
    </div>
  )
}
