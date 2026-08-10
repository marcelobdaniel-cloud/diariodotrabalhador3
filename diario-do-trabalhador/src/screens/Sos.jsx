import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { salvarLocal } from '../lib/idb'
import { sincronizar } from '../lib/sync'
import { hashLocal } from '../lib/hash'

// ——— SOS TRABALHADOR ———
// Um toque registra o momento: data/hora do aparelho + localização (se
// autorizada) + descrição opcional. Vira um registro blindado do Diário
// (categoria Segurança), com hash e selo do servidor ao sincronizar.

function pegarLocalizacao() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
        precisao_m: Math.round(pos.coords.accuracy || 0)
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  })
}

export default function Sos({ aoVoltar, aoSalvar }) {
  const [descricao, setDescricao] = useState('')
  const [fase, setFase] = useState('pronto') // pronto | gravando | feito
  const [resumo, setResumo] = useState(null)
  const [erro, setErro] = useState('')

  async function disparar() {
    setFase('gravando'); setErro('')
    try {
      const agora = new Date()
      const local = await pegarLocalizacao()
      const { data: sess } = await supabase.auth.getSession()
      const registro = {
        id: crypto.randomUUID(),
        user_id: sess && sess.session ? sess.session.user.id : null,
        tipo: 'seguranca',
        relato: '🆘 SOS — registro de emergência.' + (descricao.trim() ? ' ' + descricao.trim() : ''),
        dados: {
          sos: true,
          localizacao: local || 'não autorizada/indisponível'
        },
        fato_em: agora.toISOString(),
        registrado_em_dispositivo: agora.toISOString()
      }
      registro.hash_local = await hashLocal(registro)
      registro.status = 'pendente'
      await salvarLocal(registro)
      sincronizar()
      setResumo({
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        data: agora.toLocaleDateString('pt-BR'),
        local
      })
      setFase('feito')
      if (aoSalvar) aoSalvar()
    } catch {
      setErro('Não foi possível registrar. Tente de novo.')
      setFase('pronto')
    }
  }

  return (
    <div className="conteudo">
      <button className="voltar" onClick={aoVoltar}>← Voltar</button>
      <h2>🆘 SOS Trabalhador</h2>

      {fase !== 'feito' && (
        <>
          <p>
            Está acontecendo algo grave agora — acidente, ameaça, assédio, risco?
            Toque no botão vermelho. O momento fica registrado <strong>na hora</strong>,
            com data, horário e localização (se você autorizar), mesmo sem internet.
          </p>
          <div>
            <label htmlFor="sos_desc">O que está acontecendo? (opcional — pode tocar direto no botão)</label>
            <textarea id="sos_desc" rows={3} value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="ex.: empilhadeira quebrada quase atingiu a equipe" />
          </div>
          <button className="botao-central" style={{ background: '#b91c1c', fontSize: 20 }}
            disabled={fase === 'gravando'} onClick={disparar}>
            {fase === 'gravando' ? 'Registrando…' : '🆘 REGISTRAR EMERGÊNCIA AGORA'}
          </button>
          <p className="datas" style={{ textAlign: 'center' }}>
            O navegador vai pedir permissão de localização — autorizar fortalece o registro.
          </p>
          <div className="aviso-limite">
            ⚠️ Em perigo imediato à vida, ligue antes: <strong>190</strong> (Polícia),
            <strong> 192</strong> (SAMU) ou <strong>193</strong> (Bombeiros). O SOS
            registra o fato — ele não chama socorro.
          </div>
        </>
      )}

      {fase === 'feito' && resumo && (
        <>
          <div className="cartao" style={{ background: '#f0fdf4' }}>
            <h3>✅ Emergência registrada!</h3>
            <div className="datas" style={{ lineHeight: 1.9 }}>
              <div>📅 {resumo.data} às <strong>{resumo.hora}</strong></div>
              <div>📍 {resumo.local
                ? 'Localização gravada (' + resumo.local.lat + ', ' + resumo.local.lng + ')'
                : 'Sem localização (não autorizada)'}</div>
              <div>🔒 Selado no aparelho; será confirmado pelo servidor ao conectar.</div>
            </div>
          </div>
          <p>
            Quando estiver em segurança, complete os detalhes: abra o registro no
            Diário e crie uma errata ou um novo registro com o relato completo,
            testemunhas e fotos do que aconteceu.
          </p>
          <button className="botao" onClick={aoVoltar}>Voltar ao Diário</button>
        </>
      )}

      {erro && <p className="msg-erro" role="alert">{erro}</p>}
    </div>
  )
}
