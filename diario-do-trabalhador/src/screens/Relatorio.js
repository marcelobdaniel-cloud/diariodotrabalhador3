import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listarLocal } from '../lib/idb'
import { TIPOS } from '../lib/tipos'
import { dataBR } from '../lib/selo'
import { perfilEmCache } from '../lib/perfil'

// ——— RELATÓRIO / DOSSIÊ ———
// Gera a Linha do Tempo Profissional em formato de documento, com os selos de
// integridade (hashes). "Gerar PDF" usa a impressão do navegador — na janela
// que abrir, escolha "Salvar como PDF".

function hhmm(d) { return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }

export default function Relatorio({ aoVoltar }) {
  const [registros, setRegistros] = useState([])
  const [pontos, setPontos] = useState([])
  const [periodo, setPeriodo] = useState('mes') // mes | tudo
  const [perfil] = useState(() => perfilEmCache())

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession()
      if (!s || !s.session) return
      const todos = await listarLocal(s.session.user.id)
      todos.sort((a, b) => new Date(a.fato_em) - new Date(b.fato_em))
      setRegistros(todos)
      const { data: ps } = await supabase.from('dt_pontos').select('*').order('em', { ascending: true })
      setPontos(ps || [])
    })()
  }, [])

  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
  const regs = registros.filter((r) => periodo === 'tudo' || new Date(r.fato_em) >= inicioMes)
  const pts = pontos.filter((p) => periodo === 'tudo' || new Date(p.em) >= inicioMes)
  const hoje = new Date()

  return (
    <div className="conteudo">
      <style>{`
        @media print {
          .topo, .voltar, .nao-imprimir, .rodape-offline { display: none !important; }
          body { background: #fff; }
          .conteudo { max-width: 100%; }
          .cartao { break-inside: avoid; border: 1px solid #ccc; }
        }
      `}</style>

      <button className="voltar" onClick={aoVoltar}>← Voltar</button>
      <h2>📄 Relatório — Linha do Tempo Profissional</h2>

      <div className="nao-imprimir" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="voltar" style={{ margin: 0, background: periodo === 'mes' ? '#14532d' : undefined, color: periodo === 'mes' ? '#fff' : undefined }}
          onClick={() => setPeriodo('mes')}>Este mês</button>
        <button className="voltar" style={{ margin: 0, background: periodo === 'tudo' ? '#14532d' : undefined, color: periodo === 'tudo' ? '#fff' : undefined }}
          onClick={() => setPeriodo('tudo')}>Tudo</button>
        <button className="voltar" style={{ margin: 0, marginLeft: 'auto', fontWeight: 700 }}
          onClick={() => window.print()}>🖨️ Gerar PDF</button>
      </div>

      <div className="cartao">
        <strong>DIÁRIO DO TRABALHADOR — DOSSIÊ PESSOAL</strong>
        <div className="datas" style={{ lineHeight: 1.8 }}>
          <div>Titular: <strong>{(perfil && perfil.nome_completo) || '—'}</strong></div>
          <div>Documento gerado em: {dataBR(hoje)} às {hhmm(hoje)}</div>
          <div>Período: {periodo === 'mes' ? 'mês atual' : 'todo o histórico'}</div>
          <div>Registros de ocorrências: <strong>{regs.length}</strong> · Marcações de ponto: <strong>{pts.length}</strong></div>
        </div>
      </div>

      <h3 className="secao">Ocorrências registradas</h3>
      {regs.length === 0 && <p>Nenhuma ocorrência no período.</p>}
      {regs.map((r) => {
        const def = TIPOS[r.tipo] || { icone: '📄', nome: r.tipo }
        return (
          <div key={r.id} className="cartao">
            <div className="linha1">
              <span>{def.icone}</span>
              <span className="nome-tipo">{def.nome}</span>
            </div>
            {r.relato && <div className="relato" style={{ whiteSpace: 'pre-wrap' }}>{r.relato}</div>}
            <div className="datas" style={{ lineHeight: 1.7 }}>
              <div>Fato em: {dataBR(r.fato_em)} · Registrado no aparelho: {dataBR(r.registrado_em_dispositivo)} às {hhmm(r.registrado_em_dispositivo)}</div>
              {r.status === 'sincronizado'
                ? <div>✔ Selado pelo servidor em {dataBR(r.recebido_em)} às {hhmm(r.recebido_em)}</div>
                : <div>⏳ Aguardando selo do servidor (sem internet no momento do registro)</div>}
              <div style={{ fontSize: 11, wordBreak: 'break-all' }}>
                Hash local: {r.hash_local}
                {r.hash_servidor ? <><br />Hash do servidor (cadeia): {r.hash_servidor}</> : null}
              </div>
            </div>
          </div>
        )
      })}

      <h3 className="secao">Marcações de ponto</h3>
      {pts.length === 0 && <p>Nenhuma marcação no período.</p>}
      {pts.length > 0 && (
        <div className="cartao">
          <div className="datas" style={{ lineHeight: 1.8 }}>
            {pts.map((p) => (
              <div key={p.id}>
                {dataBR(p.em)} — {p.marco === 'entrada' ? '🟢 Entrada' : p.marco === 'pausa' ? '🍽️ Pausa' : p.marco === 'retorno' ? '🔵 Retorno' : '🔴 Saída'} às <strong>{hhmm(p.em)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cartao" style={{ fontSize: 12, color: '#444' }}>
        <strong>Sobre a integridade destes registros:</strong> cada ocorrência recebe um
        código de verificação (hash SHA-256) calculado no aparelho no momento do
        registro e, ao chegar ao servidor, um segundo selo com data/hora oficial,
        encadeado ao registro anterior (blockchain simplificada). Registros e
        marcações de ponto não podem ser editados nem apagados — correções são
        feitas por errata, preservando o original. Este documento é um controle
        pessoal do titular e não substitui documentos oficiais do empregador.
        <br /><strong>Verifique a autenticidade:</strong> acesse{' '}
        <span style={{ textDecoration: 'underline' }}>{window.location.origin + '/verificar'}</span>{' '}
        e cole o "Hash do servidor" de qualquer registro acima.
      </div>

      <button className="botao nao-imprimir" onClick={() => window.print()}>🖨️ Gerar PDF deste relatório</button>
    </div>
  )
}
