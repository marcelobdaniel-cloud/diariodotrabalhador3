import React, { useRef, useState } from 'react'
import { NIVEIS, CAMPOS_PRATA, faltamParaPrata, salvarPerfil, comprimirFoto } from '../lib/perfil'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const ESCOLARIDADES = ['Fundamental incompleto','Fundamental completo','Médio incompleto','Médio completo','Técnico','Superior incompleto','Superior completo','Pós-graduação']
const SITUACOES = ['Empregado com carteira','Empregado sem carteira','Autônomo / conta própria','Desempregado','Aposentado','Outro']

function Campo({ id, rotulo, children }) {
  return (
    <div>
      <label htmlFor={id}>{rotulo}</label>
      {children}
    </div>
  )
}

// Cadastro Inteligente Progressivo (Pilar 6):
// Passo 1 = Bronze (contato + LGPD) · Passo 2 = Prata (raio-x) · Passo 3 = Ouro (foto).
export default function Cadastro({ perfil, emailConta, aoConcluir, aoVoltar, passoInicial }) {
  const [passo, setPasso] = useState(passoInicial || 1)
  const [p, setP] = useState(() => ({
    nome_completo: '', telefone: '', email_contato: emailConta || '',
    cpf: '', data_nascimento: '', nome_mae: '', cep: '', cidade: '', uf: '',
    escolaridade: '', situacao_trabalho: '', profissao: '', empresa_atual: '',
    ctps_numero: '', ctps_serie: '', pis: '', sindicato_filiado: '', sindicato_nome: '',
    tem_advogado: '', foto_b64: '',
    consent_tratamento: false, consent_divulgacao: false,
    ...(perfil || {})
  }))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const fotoRef = useRef(null)

  function set(chave, valor) { setP((x) => ({ ...x, [chave]: valor })) }

  async function salvar(proximoPasso) {
    setErro(''); setSalvando(true)
    try {
      const salvo = await salvarPerfil(p)
      setP((x) => ({ ...x, ...salvo }))
      if (proximoPasso) setPasso(proximoPasso)
      else aoConcluir(salvo)
    } catch (e) {
      setErro(
        e && e.message === 'sem-sessao'
          ? 'Sua sessão expirou. Entre de novo.'
          : 'Não foi possível salvar agora. Confira a internet e tente de novo.'
      )
    } finally {
      setSalvando(false)
    }
  }

  function enviarPasso1(e) {
    e.preventDefault()
    if (!p.consent_tratamento) {
      setErro('Para criar o cadastro, é preciso aceitar a Política de Privacidade (LGPD).')
      return
    }
    salvar(2)
  }

  function enviarPasso2(e) {
    e.preventDefault()
    salvar(3)
  }

  async function escolherFoto(e) {
    const arq = e.target.files && e.target.files[0]
    if (!arq) return
    setErro('')
    try {
      const b64 = await comprimirFoto(arq)
      set('foto_b64', b64)
    } catch {
      setErro('Não foi possível ler a foto. Tente outra imagem.')
    }
  }

  const faltam = faltamParaPrata(p)

  return (
    <div className="conteudo">
      {aoVoltar && <button className="voltar" onClick={aoVoltar}>← Voltar</button>}

      <div className="passos" aria-label={'Passo ' + passo + ' de 3'}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={'passo-bola' + (n === passo ? ' ativo' : '') + (n < passo ? ' feito' : '')}>{n}</span>
        ))}
      </div>

      {passo === 1 && (
        <form onSubmit={enviarPasso1}>
          <h2>🥉 Seu cadastro básico</h2>
          <p>Com estes dados o seu Diário já funciona completo e protegido.</p>

          <Campo id="nome_completo" rotulo="Nome completo">
            <input id="nome_completo" type="text" required autoComplete="name"
              value={p.nome_completo} onChange={(e) => set('nome_completo', e.target.value)} />
          </Campo>
          <Campo id="telefone" rotulo="Telefone / WhatsApp (com DDD)">
            <input id="telefone" type="tel" required autoComplete="tel" inputMode="tel"
              placeholder="(11) 99999-9999"
              value={p.telefone} onChange={(e) => set('telefone', e.target.value)} />
          </Campo>
          <Campo id="email_contato" rotulo="E-mail de contato">
            <input id="email_contato" type="email" required autoComplete="email"
              value={p.email_contato} onChange={(e) => set('email_contato', e.target.value)} />
          </Campo>

          <div className="consent-box">
            <label className="consent-linha" htmlFor="consent_tratamento">
              <input id="consent_tratamento" type="checkbox" checked={p.consent_tratamento}
                onChange={(e) => set('consent_tratamento', e.target.checked)} />
              <span>
                <strong>Aceito a Política de Privacidade (LGPD).</strong> Autorizo o
                tratamento dos meus dados para o funcionamento do Diário. Posso pedir
                a exclusão do meu cadastro quando quiser.
              </span>
            </label>
            <label className="consent-linha" htmlFor="consent_divulgacao">
              <input id="consent_divulgacao" type="checkbox" checked={p.consent_divulgacao}
                onChange={(e) => set('consent_divulgacao', e.target.checked)} />
              <span>
                <strong>Opcional:</strong> autorizo a divulgação dos meus dados de contato
                a parceiros do ecossistema (sindicatos e advogados trabalhistas) para me
                oferecerem orientação e serviços.
              </span>
            </label>
          </div>

          {erro && <p className="msg-erro" role="alert">{erro}</p>}
          <button className="botao" disabled={salvando}>Criar meu cadastro</button>
        </form>
      )}

      {passo === 2 && (
        <form onSubmit={enviarPasso2}>
          <h2>🥈 Raio-X profissional</h2>
          <p>
            Preenchendo tudo você vira nível <strong>Prata</strong>: {NIVEIS.prata.beneficio.toLowerCase()}.
            Pode parar quando quiser e completar depois.
          </p>

          <h3 className="secao">Identidade</h3>
          <Campo id="cpf" rotulo="CPF (só números)">
            <input id="cpf" type="text" inputMode="numeric" maxLength={14} placeholder="000.000.000-00"
              value={p.cpf} onChange={(e) => set('cpf', e.target.value)} />
          </Campo>
          <Campo id="data_nascimento" rotulo="Data de nascimento">
            <input id="data_nascimento" type="date" value={p.data_nascimento || ''}
              onChange={(e) => set('data_nascimento', e.target.value)} />
          </Campo>
          <Campo id="nome_mae" rotulo="Nome completo da mãe">
            <input id="nome_mae" type="text" value={p.nome_mae}
              onChange={(e) => set('nome_mae', e.target.value)} />
          </Campo>
          <Campo id="cep" rotulo="CEP">
            <input id="cep" type="text" inputMode="numeric" maxLength={9} placeholder="00000-000"
              value={p.cep} onChange={(e) => set('cep', e.target.value)} />
          </Campo>
          <Campo id="cidade" rotulo="Cidade">
            <input id="cidade" type="text" value={p.cidade}
              onChange={(e) => set('cidade', e.target.value)} />
          </Campo>
          <Campo id="uf" rotulo="Estado (UF)">
            <select id="uf" value={p.uf} onChange={(e) => set('uf', e.target.value)}>
              <option value="">Escolha…</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Campo>
          <Campo id="escolaridade" rotulo="Escolaridade">
            <select id="escolaridade" value={p.escolaridade} onChange={(e) => set('escolaridade', e.target.value)}>
              <option value="">Escolha…</option>
              {ESCOLARIDADES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </Campo>

          <h3 className="secao">Vida profissional</h3>
          <Campo id="situacao_trabalho" rotulo="Situação de trabalho hoje">
            <select id="situacao_trabalho" value={p.situacao_trabalho} onChange={(e) => set('situacao_trabalho', e.target.value)}>
              <option value="">Escolha…</option>
              {SITUACOES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </Campo>
          <Campo id="profissao" rotulo="Profissão / função">
            <input id="profissao" type="text" value={p.profissao}
              onChange={(e) => set('profissao', e.target.value)} />
          </Campo>
          <Campo id="empresa_atual" rotulo="Empresa atual (se tiver)">
            <input id="empresa_atual" type="text" value={p.empresa_atual}
              onChange={(e) => set('empresa_atual', e.target.value)} />
          </Campo>

          <h3 className="secao">Carteira de Trabalho</h3>
          <Campo id="ctps_numero" rotulo="Número da CTPS (na digital, é o seu CPF)">
            <input id="ctps_numero" type="text" inputMode="numeric" value={p.ctps_numero}
              onChange={(e) => set('ctps_numero', e.target.value)} />
          </Campo>
          <Campo id="ctps_serie" rotulo="Série da CTPS (se a sua for de papel)">
            <input id="ctps_serie" type="text" value={p.ctps_serie}
              onChange={(e) => set('ctps_serie', e.target.value)} />
          </Campo>
          <Campo id="pis" rotulo="PIS / NIS (se souber)">
            <input id="pis" type="text" inputMode="numeric" value={p.pis}
              onChange={(e) => set('pis', e.target.value)} />
          </Campo>

          <h3 className="secao">Representação</h3>
          <Campo id="sindicato_filiado" rotulo="Você é filiado a algum sindicato?">
            <select id="sindicato_filiado" value={p.sindicato_filiado} onChange={(e) => set('sindicato_filiado', e.target.value)}>
              <option value="">Escolha…</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </Campo>
          {p.sindicato_filiado === 'sim' && (
            <Campo id="sindicato_nome" rotulo="Qual sindicato?">
              <input id="sindicato_nome" type="text" value={p.sindicato_nome}
                onChange={(e) => set('sindicato_nome', e.target.value)} />
            </Campo>
          )}
          <Campo id="tem_advogado" rotulo="Você já tem advogado trabalhista?">
            <select id="tem_advogado" value={p.tem_advogado} onChange={(e) => set('tem_advogado', e.target.value)}>
              <option value="">Escolha…</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </Campo>

          {faltam.length > 0 && (
            <div className="aviso-limite">
              Para o nível Prata ainda faltam: {faltam.join(', ')}.
            </div>
          )}

          {erro && <p className="msg-erro" role="alert">{erro}</p>}
          <button className="botao" disabled={salvando}>Salvar e continuar</button>
          <button type="button" className="botao secundario" disabled={salvando}
            onClick={() => salvar(3)}>Completar depois</button>
        </form>
      )}

      {passo === 3 && (
        <div>
          <h2>🥇 Sua foto = nível Ouro</h2>
          <p>
            Enviando uma foto sua, o cadastro fica completo e você vira nível
            <strong> Ouro</strong>: {NIVEIS.ouro.beneficio.toLowerCase()}.
          </p>

          {p.foto_b64
            ? <img className="foto-preview" src={p.foto_b64} alt="Sua foto de cadastro" />
            : <div className="foto-vazia" aria-hidden="true">🙂</div>}

          <input ref={fotoRef} type="file" accept="image/*" capture="user"
            style={{ display: 'none' }} onChange={escolherFoto}
            aria-label="Escolher foto de cadastro" />
          <button type="button" className="botao secundario"
            onClick={() => fotoRef.current && fotoRef.current.click()}>
            {p.foto_b64 ? 'Trocar a foto' : '📷 Tirar ou escolher foto'}
          </button>

          {erro && <p className="msg-erro" role="alert">{erro}</p>}
          <button className="botao" disabled={salvando || !p.foto_b64}
            onClick={() => salvar(null)}>Enviar foto e concluir</button>
          <button type="button" className="botao secundario" disabled={salvando}
            onClick={() => { set('foto_b64', ''); salvar(null) }}>Concluir sem foto</button>

          <div className="aviso-limite">
            A foto fica guardada de forma protegida no seu cadastro e você pode
            trocar ou remover quando quiser.
          </div>
        </div>
      )}
    </div>
  )
}
