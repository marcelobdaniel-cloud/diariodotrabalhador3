import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { listarLocal } from './lib/idb'
import { iniciarSyncAutomatico, sincronizar } from './lib/sync'
import { TIPOS } from './lib/tipos'
import { selo, dataBR } from './lib/selo'
import { carregarPerfil, perfilEmCache, NIVEIS } from './lib/perfil'
import Auth from './screens/Auth'
import Formulario from './screens/Formulario'
import Detalhe from './screens/Detalhe'
import Cadastro from './screens/Cadastro'
import Admin from './screens/Admin'

export default function App() {
  const [sessao, setSessao] = useState(undefined) // undefined = carregando
  const [tela, setTela] = useState({ nome: 'inicio' })
  const [registros, setRegistros] = useState([])
  const [online, setOnline] = useState(navigator.onLine)
  const [perfil, setPerfil] = useState(() => perfilEmCache())
  // 'carregando' | 'ok' | 'sem' (confirmado que não existe) | 'offline' (sem rede e sem cache)
  const [perfilStatus, setPerfilStatus] = useState('carregando')
  const [souAdmin, setSouAdmin] = useState(false)
  const [redefinindo, setRedefinindo] = useState(false)
  const [novaSenha1, setNovaSenha1] = useState('')
  const [novaSenha2, setNovaSenha2] = useState('')
  const [verNova, setVerNova] = useState(false)
  const [msgSenha, setMsgSenha] = useState('')

  const recarregar = useCallback(async () => {
    if (!sessao) { setRegistros([]); return }
    const todos = await listarLocal(sessao.user.id)
    todos.sort((a, b) => new Date(b.registrado_em_dispositivo) - new Date(a.registrado_em_dispositivo))
    setRegistros(todos)
  }, [sessao])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session || null))
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSessao(s || null)
      if (evento === 'PASSWORD_RECOVERY') setRedefinindo(true)
      if (!s) { localStorage.removeItem('dt_perfil'); setPerfil(null); setPerfilStatus('carregando') }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Cadastro progressivo: carrega o perfil (cache primeiro, nuvem depois).
  useEffect(() => {
    if (!sessao) return
    let vivo = true
    carregarPerfil().then((row) => {
      if (!vivo) return
      if (row === undefined) setPerfilStatus(perfilEmCache() ? 'ok' : 'offline')
      else if (row === null) { setPerfil(null); setPerfilStatus('sem') }
      else { setPerfil(row); setPerfilStatus('ok') }
    })
    return () => { vivo = false }
  }, [sessao])

  // O botão Administrador só existe para contas presentes em dt_admins.
  useEffect(() => {
    if (!sessao) { setSouAdmin(false); return }
    supabase.from('dt_admins').select('user_id').eq('user_id', sessao.user.id).maybeSingle()
      .then(({ data }) => setSouAdmin(!!data))
      .catch(() => setSouAdmin(false))
  }, [sessao])

  useEffect(() => {
    recarregar()
    if (!sessao) return
    const parar = iniciarSyncAutomatico(recarregar)
    const on = () => { setOnline(true); sincronizar(recarregar) }
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    window.addEventListener('dt-sync', recarregar)
    return () => { parar(); window.removeEventListener('online', on); window.removeEventListener('offline', off); window.removeEventListener('dt-sync', recarregar) }
  }, [recarregar, sessao])

  if (sessao === undefined) return null
  if (!sessao) return <Auth />

  // Tela de redefinição: chegou pelo link "Esqueci minha senha" do e-mail.
  if (redefinindo) {
    const salvarNovaSenha = async (e) => {
      e.preventDefault()
      setMsgSenha('')
      if (novaSenha1.length < 6) { setMsgSenha('erro:A senha precisa de pelo menos 6 caracteres.'); return }
      if (novaSenha1 !== novaSenha2) { setMsgSenha('erro:As duas senhas não são iguais. Digite a mesma senha nos dois campos.'); return }
      const { error } = await supabase.auth.updateUser({ password: novaSenha1 })
      if (error) setMsgSenha('erro:Não foi possível salvar. ' + (error.message.includes('different') ? 'A senha nova precisa ser diferente da antiga.' : 'Tente novamente.'))
      else { setMsgSenha('ok:Senha alterada com sucesso!'); setTimeout(() => { setRedefinindo(false); setNovaSenha1(''); setNovaSenha2('') }, 1500) }
    }
    return (
      <div className="centro-login">
        <div className="logo">🔑</div>
        <h1>Criar nova senha</h1>
        <p className="sub">Digite a senha nova duas vezes para confirmar.</p>
        <form onSubmit={salvarNovaSenha}>
          <label htmlFor="ns1">Nova senha</label>
          <div style={{ position: 'relative' }}>
            <input id="ns1" type={verNova ? 'text' : 'password'} required minLength={6}
              autoComplete="new-password" value={novaSenha1}
              onChange={(e) => setNovaSenha1(e.target.value)}
              style={{ paddingRight: 44, width: '100%', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setVerNova(!verNova)}
              aria-label={verNova ? 'Ocultar senha' : 'Mostrar senha'}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4 }}>
              {verNova ? '🙈' : '👁️'}
            </button>
          </div>
          <label htmlFor="ns2">Repita a nova senha</label>
          <input id="ns2" type={verNova ? 'text' : 'password'} required minLength={6}
            autoComplete="new-password" value={novaSenha2}
            onChange={(e) => setNovaSenha2(e.target.value)} />
          <button className="botao">Salvar nova senha</button>
        </form>
        {msgSenha.startsWith('erro:') && <p className="msg-erro">{msgSenha.slice(5)}</p>}
        {msgSenha.startsWith('ok:') && <p className="msg-ok">{msgSenha.slice(3)}</p>}
      </div>
    )
  }

  // Primeiro acesso confirmado sem cadastro: o wizard é a porta de entrada.
  // (Sem rede não bloqueia: registrar fatos vem primeiro — Celular-Piso.)
  if (perfilStatus === 'sem') {
    return (
      <>
        <header className="topo">
          <h1>📗 Diário do Trabalhador</h1>
          <button onClick={() => supabase.auth.signOut()}>Sair</button>
        </header>
        <Cadastro
          emailConta={sessao.user.email}
          aoConcluir={(p) => { setPerfil(p); setPerfilStatus('ok') }}
        />
      </>
    )
  }

  const pendentesN = registros.filter((r) => r.status === 'pendente').length

  return (
    <>
      <header className="topo">
        <h1>📗 Diário do Trabalhador</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {perfil && (
            <button className="nivel-chip" onClick={() => setTela({ nome: 'perfil' })}
              aria-label={'Seu nível de cadastro: ' + NIVEIS[perfil.nivel].nome}>
              {NIVEIS[perfil.nivel].selo} {NIVEIS[perfil.nivel].nome}
            </button>
          )}
          {souAdmin && (
            <button onClick={() => setTela({ nome: 'admin' })}>🛡️ Administrador</button>
          )}
          <button onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </header>

      {tela.nome === 'inicio' && (
        <div className="conteudo">
          {registros.length === 0 ? (
            <>
              <h2>Bem-vindo ao seu Diário</h2>
              <p>
                Aqui você registra o que acontece na sua vida profissional,
                no dia em que acontece. Cada registro recebe data, hora e um
                código de verificação que não pode ser alterado.
              </p>
              <p>Toque no botão verde abaixo para começar.</p>
              <div className="aviso-limite">
                O Diário informa e organiza. Ele não substitui a orientação de
                um advogado ou do seu sindicato.
              </div>
            </>
          ) : (
            <>
              <h2>Seus registros</h2>
              {registros.map((r) => {
                const def = TIPOS[r.tipo]
                const s = selo(r.fato_em, r.registrado_em_dispositivo)
                return (
                  <div key={r.id} className="cartao" role="button" tabIndex={0}
                    onClick={() => setTela({ nome: 'detalhe', registro: r })}
                    onKeyDown={(e) => e.key === 'Enter' && setTela({ nome: 'detalhe', registro: r })}>
                    <div className="linha1">
                      <span>{def.icone}</span>
                      <span className="nome-tipo">{def.nome}</span>
                      <span className={'selo ' + s.cor}>{s.cor === 'verde' ? '≤48h' : s.cor === 'amarelo' ? '2–30d' : '>30d'}</span>
                    </div>
                    {r.relato && <div className="relato">{r.relato}</div>}
                    <div className="datas">
                      Fato: {dataBR(r.fato_em)} ·{' '}
                      {r.status === 'sincronizado'
                        ? <span className="sync ok">✓ selado pelo servidor</span>
                        : <span className="sync pendente">⏳ aguardando conexão</span>}
                    </div>
                  </div>
                )
              })}
            </>
          )}
          <button className="botao-central" onClick={() => setTela({ nome: 'tipos' })}>
            + O que aconteceu?
          </button>
          {!online && (
            <div className="rodape-offline">
              Sem internet — tudo continua funcionando. Seus registros serão
              confirmados quando a conexão voltar.
            </div>
          )}
          {online && pendentesN > 0 && (
            <div className="rodape-offline">Enviando {pendentesN} registro(s) para confirmação…</div>
          )}
        </div>
      )}

      {tela.nome === 'tipos' && (
        <div className="conteudo">
          <button className="voltar" onClick={() => setTela({ nome: 'inicio' })}>← Voltar</button>
          <h2>O que aconteceu?</h2>
          <div className="grade-tipos">
            {Object.entries(TIPOS).map(([chave, def]) => (
              <button key={chave} className="tipo-btn" onClick={() => setTela({ nome: 'form', tipo: chave })}>
                <span className="icone">{def.icone}</span>
                <span>{def.nome}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tela.nome === 'form' && (
        <Formulario
          tipo={tela.tipo}
          aoVoltar={() => setTela({ nome: 'tipos' })}
          aoSalvar={() => { recarregar(); setTela({ nome: 'inicio' }) }}
        />
      )}

      {tela.nome === 'detalhe' && (
        <Detalhe registro={tela.registro} aoVoltar={() => setTela({ nome: 'inicio' })} />
      )}

      {tela.nome === 'admin' && souAdmin && (
        <Admin aoVoltar={() => setTela({ nome: 'inicio' })} />
      )}

      {tela.nome === 'perfil' && (
        <Cadastro
          perfil={perfil}
          emailConta={sessao.user.email}
          passoInicial={1}
          aoVoltar={() => setTela({ nome: 'inicio' })}
          aoConcluir={(p) => { setPerfil(p); setTela({ nome: 'inicio' }) }}
        />
      )}
    </>
  )
}
