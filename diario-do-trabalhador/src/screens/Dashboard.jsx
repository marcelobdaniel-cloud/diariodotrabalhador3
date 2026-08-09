import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TIPOS } from '../lib/tipos'
import { dataBR } from '../lib/selo'
import { NIVEIS } from '../lib/perfil'

// ——— DASHBOARD (INÍCIO) ———
// Um olhar e o trabalhador sabe: status do expediente, horas do mês,
// últimos registros e o quanto falta no cadastro.

function chaveDia(d) {
  const x = new Date(d)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}
function minutosDoDia(marcas, agora) {
  const seq = [...marcas].sort((a, b) => new Date(a.em) - new Date(b.em))
  let total = 0
  let aberto = null
  for (const p of seq) {
    if (p.marco === 'entrada' || p.marco === 'retorno') { if (!aberto) aberto = new Date(p.em) }
    else if (p.marco === 'pausa' || p.marco === 'saida') { if (aberto) { total += (new Date(p.em) - aberto) / 60000; aberto = null } }
  }
  if (aberto && agora) total += (agora - aberto) / 60000
  return { total, emAndamento: !!aberto }
}
function hMin(min) {
  const m = Math.max(0, Math.round(min))
  return Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0')
}

export default function Dashboard({ registros, perfil, navegar }) {
  const [pontos, setPontos] = useState([])

  useEffect(() => {
    (async () => {
      const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
      const { data } = await supabase.from('dt_pontos').select('*').gte('em', inicioMes.toISOString())
      setPontos(data || [])
    })()
  }, [])

  const hoje = chaveDia(new Date())
  const marcasHoje = pontos.filter((p) => chaveDia(p.em) === hoje)
  const feitos = marcasHoje.map((p) => p.marco)
  const { total: minHoje, emAndamento } = minutosDoDia(marcasHoje, new Date())
  const status = feitos.includes('saida') ? '✅ Expediente encerrado'
    : feitos.includes('retorno') ? '💼 Em expediente'
      : feitos.includes('pausa') ? '🍽️ Em pausa'
        : feitos.includes('entrada') ? '💼 Em expediente'
          : '🌙 Fora de turno'

  const porDia = {}
  for (const p of pontos) { const k = chaveDia(p.em); (porDia[k] = porDia[k] || []).push(p) }
  let minMes = 0
  let extrasMes = 0
  for (const k of Object.keys(porDia)) {
    const t = minutosDoDia(porDia[k], k === hoje ? new Date() : null).total
    minMes += t
    extrasMes += Math.max(0, t - 8 * 60)
  }

  const ultimos = registros.slice(0, 3)
  const niv = perfil ? NIVEIS[perfil.nivel] : null
  const pct = perfil && perfil.completude != null ? perfil.completude : null

  return (
    <div className="conteudo">
      {/* Status do dia */}
      <div className="cartao" style={{ background: 'var(--verde-claro)' }} role="button" tabIndex={0}
        onClick={() => navegar('ponto')} onKeyDown={(e) => e.key === 'Enter' && navegar('ponto')}>
        <div className="linha1" style={{ justifyContent: 'space-between' }}>
          <strong>{status}</strong>
          <span>{hMin(minHoje)}{emAndamento ? ' ⏳' : ''} hoje</span>
        </div>
        <div className="datas">Toque para registrar {feitos.length === 0 ? 'sua entrada' : 'o próximo ponto'} →</div>
      </div>

      {/* Ações rápidas */}
      <div className="grade-acoes">
        <button className="acao" style={{ background: '#0e7490' }} onClick={() => navegar('ponto')}>🕐<span>Ponto</span></button>
        <button className="acao" style={{ background: 'var(--verde-escuro)' }} onClick={() => navegar('tipos')}>➕<span>Ocorrência</span></button>
        <button className="acao" style={{ background: 'var(--vermelho)' }} onClick={() => navegar('sos')}>🆘<span>SOS</span></button>
      </div>

      {/* Painel do mês */}
      <div className="cartao">
        <div className="linha1"><span>📅</span><span className="nome-tipo">Seu mês até agora</span></div>
        <div className="painel-numeros">
          <div><strong>{hMin(minMes)}</strong><span>trabalhadas</span></div>
          <div><strong>{hMin(extrasMes)}</strong><span>além de 8h/dia</span></div>
          <div><strong>{registros.length}</strong><span>registros</span></div>
        </div>
        <div className="datas" style={{ marginTop: 6 }}>
          <span role="button" tabIndex={0} style={{ textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => navegar('relatorio')}>Gerar relatório do período →</span>
        </div>
      </div>

      {/* Cadastro / nível */}
      {niv && (
        <div className="cartao" role="button" tabIndex={0} onClick={() => navegar('perfil')}
          onKeyDown={(e) => e.key === 'Enter' && navegar('perfil')}>
          <div className="linha1" style={{ justifyContent: 'space-between' }}>
            <span className="nome-tipo">{niv.selo} Perfil {niv.nome}</span>
            {pct != null && <strong>{pct}%</strong>}
          </div>
          {pct != null && (
            <div style={{ background: 'var(--cinza-100)', borderRadius: 8, height: 8 }}>
              <div style={{ width: pct + '%', background: 'var(--verde)', height: 8, borderRadius: 8 }} />
            </div>
          )}
          <div className="datas">{pct != null && pct < 100 ? 'Complete o cadastro para subir de nível →' : niv.beneficio}</div>
        </div>
      )}

      {/* Últimos registros */}
      <h2 style={{ marginTop: 14 }}>Últimos registros</h2>
      {ultimos.length === 0 && (
        <p>Você ainda não registrou nada. Toque em <strong>➕ Ocorrência</strong> quando algo acontecer no trabalho.</p>
      )}
      {ultimos.map((r) => {
        const def = TIPOS[r.tipo] || { icone: '📄', nome: r.tipo }
        return (
          <div key={r.id} className="cartao" role="button" tabIndex={0}
            onClick={() => navegar('detalhe', r)} onKeyDown={(e) => e.key === 'Enter' && navegar('detalhe', r)}>
            <div className="linha1">
              <span>{def.icone}</span>
              <span className="nome-tipo">{def.nome}</span>
              <span className="datas">{dataBR(r.fato_em)}</span>
            </div>
            {r.relato && <div className="relato">{r.relato}</div>}
          </div>
        )
      })}
      {registros.length > 3 && (
        <button className="botao secundario" onClick={() => navegar('diario')}>Ver todos os registros</button>
      )}
    </div>
  )
}
