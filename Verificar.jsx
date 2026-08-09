import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

// ——— VERIFICADOR PÚBLICO DE INTEGRIDADE ———
// Qualquer pessoa (juiz, advogado, RH) cola o código de verificação impresso
// no dossiê e confirma: existe, foi selado em tal data/hora e não foi alterado.
// Privacidade: NÃO revela conteúdo nem titular — apenas o selo.

export default function Verificar({ aoVoltar }) {
  const [hash, setHash] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function verificar(e) {
    e.preventDefault()
    setErro(''); setResultado(null)
    const codigo = hash.trim().toLowerCase()
    if (codigo.length < 20) { setErro('Cole o código completo de verificação (64 caracteres).'); return }
    setOcupado(true)
    try {
      const base = supabase.supabaseUrl
      const chave = supabase.supabaseKey
      const r = await fetch(base + '/functions/v1/verificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: chave,
          Authorization: 'Bearer ' + chave
        },
        body: JSON.stringify({ hash: codigo })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.erro || 'Falha na consulta')
      setResultado(j)
    } catch {
      setErro('Não foi possível consultar agora. Confira a internet e tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="conteudo" style={{ maxWidth: 480, margin: '0 auto' }}>
      {aoVoltar && <button className="voltar" onClick={aoVoltar}>← Voltar</button>}
      <div style={{ textAlign: 'center', margin: '10px 0 16px' }}>
        <div style={{ fontSize: 40 }}>🔐</div>
        <h2>Verificador de Integridade</h2>
        <p className="sub" style={{ color: 'var(--cinza-600)' }}>
          Diário do Trabalhador — conferência pública de registros
        </p>
      </div>

      <p>
        Recebeu um dossiê ou relatório do Diário do Trabalhador? Cole abaixo o
        <strong> código de verificação do servidor</strong> (hash) impresso no
        documento e confirme sua autenticidade.
      </p>

      <form onSubmit={verificar}>
        <label htmlFor="hash">Código de verificação (hash do servidor)</label>
        <textarea id="hash" rows={3} value={hash} onChange={(e) => setHash(e.target.value)}
          placeholder="ex.: 9f3ab2c4d5e6..." style={{ fontFamily: 'monospace', fontSize: 13 }} />
        <button className="botao" disabled={ocupado}>
          {ocupado ? 'Verificando…' : 'Verificar autenticidade'}
        </button>
      </form>

      {erro && <p className="msg-erro" role="alert">{erro}</p>}

      {resultado && resultado.encontrado && (
        <div className="cartao" style={{ background: '#f0fdf4', borderLeft: '4px solid var(--verde)' }}>
          <h3>✅ Registro AUTÊNTICO</h3>
          <div className="datas" style={{ lineHeight: 1.9 }}>
            <div>🕐 Selado pelo servidor em:{' '}
              <strong>{new Date(resultado.selado_em).toLocaleString('pt-BR')}</strong> (horário oficial do banco de dados)</div>
            <div>🔗 Posição na cadeia:{' '}
              {resultado.tem_anterior
                ? 'encadeado ao registro anterior do titular (cadeia íntegra)'
                : 'primeiro registro da cadeia do titular (gênese)'}</div>
            <div>🛡️ Este código só existe se o registro foi recebido pelo servidor
              naquele exato momento e nunca foi alterado — o sistema não permite
              edição nem exclusão.</div>
          </div>
        </div>
      )}

      {resultado && !resultado.encontrado && (
        <div className="cartao" style={{ background: '#fef2f2', borderLeft: '4px solid var(--vermelho)' }}>
          <h3>❌ Código NÃO encontrado</h3>
          <div className="datas" style={{ lineHeight: 1.8 }}>
            Este código não corresponde a nenhum registro selado. Possíveis motivos:
            código digitado incompleto/errado, documento adulterado, ou registro
            ainda não sincronizado com o servidor. Confira o código e tente novamente.
          </div>
        </div>
      )}

      <div className="aviso-limite">
        Privacidade: esta consulta confirma apenas a existência e a data do selo.
        O conteúdo do registro e a identidade do titular permanecem protegidos
        (LGPD) — somente o titular decide com quem compartilhar o documento.
      </div>
    </div>
  )
}
