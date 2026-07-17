import React, { useRef, useState } from 'react'
import { TIPOS, alertaJornada } from '../lib/tipos'
import { hashLocal } from '../lib/hash'
import { salvarLocal } from '../lib/idb'
import { sincronizar } from '../lib/sync'
import { supabase } from '../lib/supabase'

function agoraLocalISO() {
  const d = new Date()
  d.setSeconds(0, 0)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

// Entrada por voz (§7.6): falar em vez de digitar no teclado pequeno.
function useVoz(aoTexto) {
  const recRef = useRef(null)
  const [gravando, setGravando] = useState(false)
  const suportado = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  function alternar() {
    if (gravando) {
      recRef.current && recRef.current.stop()
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      let texto = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) texto += e.results[i][0].transcript + ' '
      }
      if (texto) aoTexto(texto)
    }
    rec.onend = () => setGravando(false)
    rec.onerror = () => setGravando(false)
    recRef.current = rec
    rec.start()
    setGravando(true)
  }

  return { suportado, gravando, alternar }
}

export default function Formulario({ tipo, aoSalvar, aoVoltar }) {
  const def = TIPOS[tipo]
  const [dados, setDados] = useState({})
  const [relato, setRelato] = useState('')
  const [fatoEm, setFatoEm] = useState(agoraLocalISO())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const voz = useVoz((t) => setRelato((r) => (r ? r + ' ' : '') + t.trim()))

  const alerta = tipo === 'jornada' ? alertaJornada(dados) : null

  function setCampo(chave, valor) {
    setDados((d) => ({ ...d, [chave]: valor }))
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (new Date(fatoEm) > new Date()) {
      setErro('A data do fato não pode estar no futuro. Registre o que já aconteceu.')
      return
    }
    setSalvando(true)
    try {
      // Sessão persiste offline: o dono do registro fica carimbado localmente.
      const { data: sess } = await supabase.auth.getSession()
      const registro = {
        id: crypto.randomUUID(),
        user_id: sess && sess.session ? sess.session.user.id : null,
        tipo,
        relato: relato.trim(),
        dados,
        fato_em: new Date(fatoEm).toISOString(),
        registrado_em_dispositivo: new Date().toISOString()
      }
      registro.hash_local = await hashLocal(registro)
      registro.status = 'pendente'
      await salvarLocal(registro)
      sincronizar()
      aoSalvar()
    } catch (err) {
      setErro('Não foi possível guardar. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <div className="conteudo">
      <button className="voltar" onClick={aoVoltar}>← Voltar</button>
      <h2>{def.icone} {def.nome}</h2>

      {def.acolhimento && <div className="acolhimento">{def.acolhimento}</div>}

      <form onSubmit={salvar}>
        <label htmlFor="fato_em">Quando isso aconteceu?</label>
        <input id="fato_em" type="datetime-local" required value={fatoEm}
          max={agoraLocalISO()} onChange={(e) => setFatoEm(e.target.value)} />

        {def.campos.map((c) => (
          <div key={c.chave}>
            <label htmlFor={c.chave}>{c.rotulo}</label>
            {c.tipo === 'select' ? (
              <select id={c.chave} value={dados[c.chave] || ''}
                onChange={(e) => setCampo(c.chave, e.target.value)}>
                <option value="">Escolha…</option>
                {c.opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input id={c.chave} type={c.tipo} value={dados[c.chave] || ''}
                onChange={(e) => setCampo(c.chave, e.target.value)} />
            )}
          </div>
        ))}

        {alerta && <div className="alerta">{alerta}</div>}

        <label htmlFor="relato">{def.pergunta}</label>
        <textarea id="relato" value={relato} placeholder={def.dicaRelato}
          onChange={(e) => setRelato(e.target.value)} />

        {voz.suportado && (
          <button type="button" onClick={voz.alternar}
            className={'botao-voz' + (voz.gravando ? ' gravando' : '')}>
            {voz.gravando ? '■ Parar de falar' : '🎤 Falar em vez de digitar'}
          </button>
        )}

        {def.apoio && (
          <div className="aviso-limite">
            Se estiver difícil, você não está só: procure seu sindicato ou ligue 188
            (CVV, apoio emocional gratuito, 24 horas).
          </div>
        )}

        {erro && <p className="msg-erro">{erro}</p>}

        <button className="botao" disabled={salvando}>Guardar registro</button>
        <div className="aviso-limite">
          O registro fica guardado no seu aparelho na hora, mesmo sem internet.
          Quando houver conexão, ele recebe o carimbo de data do servidor.
        </div>
      </form>
    </div>
  )
}
