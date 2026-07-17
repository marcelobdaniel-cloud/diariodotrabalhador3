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

export default function App() {
  const [sessao, setSessao] = useState(undefined) // undefined = carregando
  const [tela, setTela] = useState({ nome: 'inicio' })
  const [registros, setRegistros] = useState([])
  const [online, setOnline] = useState(navigator.onLine)
  const [perfil, setPerfil] = useState(() => perfilEmCache())
  // 'carregando' | 'ok' | 'sem' (confirmado que não existe) | 'offline' (sem rede e sem cache)
  const [perfilStatus, setPerfilStatus] = useState('carregando')

  const recarregar = useCallback(async () => {
    if (!sessao) { setRegistros([]); return }
    const todos = await listarLocal(sessao.user.id)
    todos.sort((a, b) => new Date(b.registrado_em_dispositivo) - new Date(a.registrado_em_dispositivo))
    setRegistros(todos)
  }, [sessao])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSessao(s || null)
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
