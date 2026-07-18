import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { NIVEIS } from '../lib/perfil'
import { dataBR } from '../lib/selo'

// Painel do Administrador — visível e funcional apenas para contas presentes
// em dt_admins. Ações sensíveis (listar todos, excluir, convidar) passam pela
// Edge Function "admin-acoes", que confere a permissão no servidor.
async function chamarAdmin(corpo) {
  const { data: s } = await supabase.auth.getSession()
  const token = s?.session?.access_token
  const base = supabase.supabaseUrl || import.meta.env.VITE_SUPABASE_URL
  const resp = await fetch(base + '/functions/v1/admin-acoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(corpo)
  })
  const json = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(json.erro || 'Falha na operação (' + resp.status + ')')
  return json
}

export default function Admin({ aoVoltar }) {
  const [usuarios, setUsuarios] = useState(null)
  const [perfis, setPerfis] = useState({})
  const [contagens, setContagens] = useState({})
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [aberto, setAberto] = useState(null)
  const [emailConvite, setEmailConvite] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function carregar() {
    setErro('')
    try {
      const { usuarios: lista } = await chamarAdmin({ acao: 'listar' })
      setUsuarios(lista)
      const { data: ps } = await supabase.from('dt_perfis').select('*')
      const mapa = {}
      for (const p of ps || []) mapa[p.user_id] = p
      setPerfis(mapa)
      const { data: regs } = await supabase.from('dt_registros').select('user_id')
      const c = {}
      for (const r of regs || []) c[r.user_id] = (c[r.user_id] || 0) + 1
      setContagens(c)
    } catch (e) {
      setErro(e.message)
      setUsuarios([])
    }
  }

  useEffect(() => { carregar() }, [])

  async function excluir(u) {
    const nome = perfis[u.id]?.nome_completo || u.email
    if (!window.confirm('Excluir "' + nome + '"?\n\nIsso apaga a conta, o perfil e TODOS os registros dessa pessoa. Não tem volta.')) return
    setOcupado(true); setErro(''); setOk('')
    try {
      await chamarAdmin({ acao: 'excluir', alvo_id: u.id })
      setOk('Usuário excluído.')
      await carregar()
    } catch (e) { setErro(e.message) } finally { setOcupado(false) }
  }

  async function convidar(e) {
    e.preventDefault()
    if (!emailConvite) return
    setOcupado(true); setErro(''); setOk('')
    try {
      await chamarAdmin({ acao: 'convidar', email: emailConvite })
      setOk('Convite enviado para ' + emailConvite + '.')
      setEmailConvite('')
      await carregar()
    } catch (e2) { setErro(e2.message) } finally { setOcupado(false) }
  }

  return (
    <div className="conteudo">
      <button className="voltar" onClick={aoVoltar}>← Voltar</button>
      <h2>🛡️ Painel do Administrador</h2>

      <form onSubmit={convidar} className="cartao" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="convite" style={{ fontWeight: 600 }}>Convidar por e-mail:</label>
        <input id="convite" type="email" placeholder="pessoa@exemplo.com"
          value={emailConvite} onChange={(ev) => setEmailConvite(ev.target.value)}
          style={{ flex: 1, minWidth: 180 }} />
        <button className="botao" disabled={ocupado} style={{ width: 'auto', padding: '8px 16px' }}>Enviar convite</button>
      </form>

      {erro && <div className="aviso-limite" style={{ borderColor: '#b91c1c', color: '#b91c1c' }}>{erro}</div>}
      {ok && <div className="aviso-limite" style={{ borderColor: '#166534', color: '#166534' }}>{ok}</div>}

      {usuarios === null && <p>Carregando cadastrados…</p>}
      {usuarios && usuarios.length === 0 && !erro && <p>Nenhum usuário cadastrado ainda.</p>}

      {usuarios && usuarios.map((u) => {
        const p = perfis[u.id]
        const estaAberto = aberto === u.id
        return (
          <div key={u.id} className="cartao">
            <div className="linha1" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{p?.nome_completo || '(sem cadastro completo)'}</strong>
                <div className="datas">{u.email}</div>
              </div>
              {p && <span>{NIVEIS[p.nivel]?.selo} {NIVEIS[p.nivel]?.nome}</span>}
            </div>
            <div className="datas">
              Criado em {dataBR(u.created_at)}
              {' · '}{u.email_confirmed_at ? '✓ e-mail confirmado' : '⏳ aguardando confirmação'}
              {' · '}{contagens[u.id] || 0} registro(s) no Diário
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="voltar" style={{ margin: 0 }} onClick={() => setAberto(estaAberto ? null : u.id)}>
                {estaAberto ? 'Fechar detalhes' : 'Ver detalhes'}
              </button>
              <button className="voltar" style={{ margin: 0, color: '#b91c1c', borderColor: '#b91c1c' }}
                disabled={ocupado} onClick={() => excluir(u)}>
                Excluir
              </button>
            </div>
            {estaAberto && (
              <div className="datas" style={{ marginTop: 8, lineHeight: 1.7 }}>
                {p ? (
                  <>
                    <div><strong>Telefone:</strong> {p.telefone || '—'}</div>
                    <div><strong>E-mail de contato:</strong> {p.email_contato || '—'}</div>
                    <div><strong>CPF:</strong> {p.cpf || '—'}</div>
                    <div><strong>Cidade/UF:</strong> {(p.cidade || '—') + ' / ' + (p.uf || '—')}</div>
                    <div><strong>Profissão:</strong> {p.profissao || '—'}</div>
                    <div><strong>Empresa atual:</strong> {p.empresa_atual || '—'}</div>
                    <div><strong>Situação:</strong> {p.situacao_trabalho || '—'}</div>
                    <div><strong>Sindicalizado:</strong> {p.sindicato_filiado || '—'}{p.sindicato_nome ? ' (' + p.sindicato_nome + ')' : ''}</div>
                    <div><strong>Consentimento LGPD:</strong> {p.consent_tratamento ? '✓ em ' + dataBR(p.consentido_em) : '—'}</div>
                  </>
                ) : (
                  <div>Esta pessoa criou a conta, mas ainda não completou o cadastro no app.</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
