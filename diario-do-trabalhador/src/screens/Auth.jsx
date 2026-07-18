import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [modo, setModo] = useState('entrar') // 'entrar' | 'criar' | 'esqueci'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro(''); setOk(''); setCarregando(true)
    try {
      if (modo === 'esqueci') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        })
        if (error) setErro('Não foi possível enviar. Confira o e-mail digitado.')
        else setOk('Pronto! Enviamos um link para ' + email + '. Abra seu e-mail (olhe também o spam), clique no link e você poderá criar uma senha nova.')
      } else if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) setErro('Não foi possível entrar. Confira e-mail e senha — ou use "Esqueci minha senha" abaixo.')
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: senha })
        if (error) {
          if (error.message.toLowerCase().includes('signup') && error.message.toLowerCase().includes('disabled')) {
            setErro('Nesta fase, o acesso é por convite. Fale com quem te indicou o Diário para receber a sua conta.')
          } else {
            setErro('Não foi possível criar a conta. ' + (error.message.includes('at least') ? 'A senha precisa de pelo menos 6 caracteres.' : 'Tente outro e-mail.'))
          }
        }
        else if (data && !data.session) setOk('Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre aqui.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="centro-login">
      <div className="logo">📗</div>
      <h1>Diário do Trabalhador</h1>
      <p className="sub">Seu registro profissional, organizado e protegido.</p>

      <form onSubmit={enviar}>
        <label htmlFor="email">Seu e-mail</label>
        <input id="email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        {modo !== 'esqueci' && (
          <>
            <label htmlFor="senha">Sua senha</label>
            <div style={{ position: 'relative' }}>
              <input id="senha" type={verSenha ? 'text' : 'password'} required
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)}
                style={{ paddingRight: 44, width: '100%', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setVerSenha(!verSenha)}
                aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                title={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4 }}>
                {verSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </>
        )}

        <button className="botao" disabled={carregando}>
          {modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar minha conta' : 'Enviar link de redefinição'}
        </button>
      </form>

      {modo === 'entrar' && (
        <button type="button" className="botao secundario"
          onClick={() => { setModo('esqueci'); setErro(''); setOk('') }}>
          Esqueci minha senha
        </button>
      )}

      <button type="button" className="botao secundario"
        onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setErro(''); setOk('') }}>
        {modo === 'entrar' ? 'Ainda não tenho conta' : 'Voltar para entrar'}
      </button>

      {erro && <p className="msg-erro">{erro}</p>}
      {ok && <p className="msg-ok">{ok}</p>}

      <div className="aviso-limite">
        O Diário informa e organiza. Ele não substitui a orientação de um advogado
        ou do seu sindicato.
      </div>
    </div>
  )
}
