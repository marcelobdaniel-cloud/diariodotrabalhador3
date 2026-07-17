import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro(''); setOk(''); setCarregando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) setErro('Não foi possível entrar. Confira e-mail e senha.')
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

        <label htmlFor="senha">Sua senha</label>
        <input id="senha" type="password" required autoComplete="current-password"
          minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} />

        <button className="botao" disabled={carregando}>
          {modo === 'entrar' ? 'Entrar' : 'Criar minha conta'}
        </button>
      </form>

      <button className="botao secundario"
        onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setErro(''); setOk('') }}>
        {modo === 'entrar' ? 'Ainda não tenho conta' : 'Já tenho conta'}
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
