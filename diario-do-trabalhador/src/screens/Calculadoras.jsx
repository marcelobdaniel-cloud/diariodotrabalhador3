import React, { useState } from 'react'

// ——— CALCULADORAS TRABALHISTAS ———
// Estimativas educativas em valores BRUTOS, para orientação pessoal.
// Não substituem o cálculo oficial de um contador, advogado ou sindicato.

const BRL = (v) => (isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0 }

function Campo({ rotulo, valor, mudar, tipo = 'number', ph }) {
  return (
    <div>
      <label>{rotulo}</label>
      <input type={tipo} inputMode="decimal" placeholder={ph} value={valor}
        onChange={(e) => mudar(e.target.value)} />
    </div>
  )
}

function Escolha({ rotulo, valor, mudar, opcoes }) {
  return (
    <div>
      <label>{rotulo}</label>
      <select value={valor} onChange={(e) => mudar(e.target.value)}>
        {opcoes.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
      </select>
    </div>
  )
}

function Resultado({ linhas, total, totalRotulo = 'Total estimado (bruto)' }) {
  return (
    <div className="cartao" style={{ background: '#f0fdf4' }}>
      {linhas.filter(Boolean).map(([r, v], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>{r}</span><strong>{BRL(v)}</strong>
        </div>
      ))}
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
        <span>{totalRotulo}</span><strong>{BRL(total)}</strong>
      </div>
    </div>
  )
}

function HorasExtras() {
  const [salario, setSalario] = useState('')
  const [carga, setCarga] = useState('220')
  const [horas, setHoras] = useState('')
  const [adic, setAdic] = useState('50')
  const [diasUteis, setDiasUteis] = useState('25')
  const [descansos, setDescansos] = useState('5')
  const horaNormal = num(salario) / (num(carga) || 220)
  const horaExtra = horaNormal * (1 + num(adic) / 100)
  const totalHE = num(horas) * horaExtra
  const dsr = num(diasUteis) > 0 ? (totalHE / num(diasUteis)) * num(descansos) : 0
  return (
    <>
      <Campo rotulo="Salário base (R$)" valor={salario} mudar={setSalario} />
      <Escolha rotulo="Carga mensal" valor={carga} mudar={setCarga}
        opcoes={[['220', '220h (44h semanais)'], ['200', '200h (40h semanais)'], ['180', '180h (36h semanais)']]} />
      <Campo rotulo="Horas extras no mês" valor={horas} mudar={setHoras} />
      <Escolha rotulo="Adicional" valor={adic} mudar={setAdic}
        opcoes={[['50', '50% (dias úteis)'], ['100', '100% (domingos/feriados)'], ['60', '60% (algumas CCTs)'], ['70', '70% (algumas CCTs)']]} />
      <Campo rotulo="Dias úteis no mês" valor={diasUteis} mudar={setDiasUteis} />
      <Campo rotulo="Domingos e feriados no mês" valor={descansos} mudar={setDescansos} />
      {num(salario) > 0 && num(horas) > 0 && (
        <Resultado linhas={[
          ['Valor da hora normal', horaNormal],
          ['Valor da hora extra (+' + adic + '%)', horaExtra],
          ['Total das horas extras', totalHE],
          ['Reflexo no DSR (descanso remunerado)', dsr]
        ]} total={totalHE + dsr} />
      )}
    </>
  )
}

function Noturno() {
  const [salario, setSalario] = useState('')
  const [carga, setCarga] = useState('220')
  const [horas, setHoras] = useState('')
  const horaNormal = num(salario) / (num(carga) || 220)
  const adicional = num(horas) * horaNormal * 0.2
  return (
    <>
      <Campo rotulo="Salário base (R$)" valor={salario} mudar={setSalario} />
      <Escolha rotulo="Carga mensal" valor={carga} mudar={setCarga}
        opcoes={[['220', '220h'], ['200', '200h'], ['180', '180h']]} />
      <Campo rotulo="Horas noturnas no mês (22h às 5h)" valor={horas} mudar={setHoras} />
      {num(salario) > 0 && num(horas) > 0 && (
        <Resultado linhas={[['Adicional noturno (20%)', adicional]]} total={adicional} />
      )}
      <p className="datas">Obs.: à noite, cada 52min30s conta como 1 hora (hora noturna reduzida) — na prática o valor tende a ser um pouco maior. Percentual de 20% é o mínimo da CLT (urbano); sua CCT pode prever mais.</p>
    </>
  )
}

function Ferias() {
  const [salario, setSalario] = useState('')
  const [meses, setMeses] = useState('12')
  const [mediaHE, setMediaHE] = useState('0')
  const [vender, setVender] = useState('nao')
  const base = (num(salario) + num(mediaHE)) * (Math.min(12, num(meses)) / 12)
  const terco = base / 3
  const abono = vender === 'sim' ? (num(salario) + num(mediaHE)) / 3 * (1 + 1 / 3) : 0
  return (
    <>
      <Campo rotulo="Salário base (R$)" valor={salario} mudar={setSalario} />
      <Campo rotulo="Meses do período (1 a 12)" valor={meses} mudar={setMeses} />
      <Campo rotulo="Média mensal de horas extras (R$, se houver)" valor={mediaHE} mudar={setMediaHE} />
      <Escolha rotulo="Vender 10 dias (abono)?" valor={vender} mudar={setVender}
        opcoes={[['nao', 'Não'], ['sim', 'Sim']]} />
      {num(salario) > 0 && (
        <Resultado linhas={[
          ['Férias proporcionais', base],
          ['1/3 constitucional', terco],
          vender === 'sim' ? ['Abono (venda de 10 dias) + 1/3', abono] : null
        ]} total={base + terco + abono} />
      )}
    </>
  )
}

function Decimo() {
  const [salario, setSalario] = useState('')
  const [meses, setMeses] = useState('12')
  const [mediaHE, setMediaHE] = useState('0')
  const total = (num(salario) + num(mediaHE)) * (Math.min(12, num(meses)) / 12)
  return (
    <>
      <Campo rotulo="Salário base (R$)" valor={salario} mudar={setSalario} />
      <Campo rotulo="Meses trabalhados no ano (fração ≥15 dias conta como mês)" valor={meses} mudar={setMeses} />
      <Campo rotulo="Média mensal de horas extras (R$, se houver)" valor={mediaHE} mudar={setMediaHE} />
      {num(salario) > 0 && <Resultado linhas={[['13º proporcional', total]]} total={total} />}
    </>
  )
}

function Rescisao() {
  const [salario, setSalario] = useState('')
  const [tipoDem, setTipoDem] = useState('sem_justa')
  const [anos, setAnos] = useState('1')
  const [diasTrab, setDiasTrab] = useState('0')
  const [mesesAno, setMesesAno] = useState('6')
  const [feriasVencidas, setFeriasVencidas] = useState('nao')
  const [fgts, setFgts] = useState('')
  const s = num(salario)
  const saldoSalario = s / 30 * num(diasTrab)
  const avisoDias = Math.min(90, 30 + 3 * Math.floor(num(anos)))
  const avisoIndenizado = s / 30 * avisoDias
  const decimoProp = s * (Math.min(12, num(mesesAno)) / 12)
  const feriasProp = s * (Math.min(12, num(mesesAno)) / 12) * (1 + 1 / 3)
  const vencidas = feriasVencidas === 'sim' ? s * (1 + 1 / 3) : 0
  const multa = num(fgts) * (tipoDem === 'sem_justa' ? 0.4 : tipoDem === 'acordo' ? 0.2 : 0)
  let linhas = []
  let total = 0
  if (tipoDem === 'sem_justa') {
    linhas = [['Saldo de salário (' + diasTrab + ' dias)', saldoSalario], ['Aviso prévio indenizado (' + avisoDias + ' dias)', avisoIndenizado], ['13º proporcional', decimoProp], ['Férias proporcionais + 1/3', feriasProp], feriasVencidas === 'sim' ? ['Férias vencidas + 1/3', vencidas] : null, ['Multa de 40% do FGTS', multa]]
    total = saldoSalario + avisoIndenizado + decimoProp + feriasProp + vencidas + multa
  } else if (tipoDem === 'acordo') {
    linhas = [['Saldo de salário', saldoSalario], ['Metade do aviso prévio', avisoIndenizado / 2], ['13º proporcional', decimoProp], ['Férias proporcionais + 1/3', feriasProp], feriasVencidas === 'sim' ? ['Férias vencidas + 1/3', vencidas] : null, ['Multa de 20% do FGTS', multa]]
    total = saldoSalario + avisoIndenizado / 2 + decimoProp + feriasProp + vencidas + multa
  } else if (tipoDem === 'pedido') {
    linhas = [['Saldo de salário', saldoSalario], ['13º proporcional', decimoProp], ['Férias proporcionais + 1/3', feriasProp], feriasVencidas === 'sim' ? ['Férias vencidas + 1/3', vencidas] : null]
    total = saldoSalario + decimoProp + feriasProp + vencidas
  } else {
    linhas = [['Saldo de salário', saldoSalario], feriasVencidas === 'sim' ? ['Férias vencidas + 1/3', vencidas] : null]
    total = saldoSalario + vencidas
  }
  return (
    <>
      <Campo rotulo="Salário base (R$)" valor={salario} mudar={setSalario} />
      <Escolha rotulo="Tipo de saída" valor={tipoDem} mudar={setTipoDem}
        opcoes={[['sem_justa', 'Demitido sem justa causa'], ['acordo', 'Acordo (art. 484-A)'], ['pedido', 'Pedido de demissão'], ['justa', 'Demitido por justa causa']]} />
      <Campo rotulo="Anos completos de empresa" valor={anos} mudar={setAnos} />
      <Campo rotulo="Dias trabalhados no mês da saída" valor={diasTrab} mudar={setDiasTrab} />
      <Campo rotulo="Meses trabalhados no ano da saída" valor={mesesAno} mudar={setMesesAno} />
      <Escolha rotulo="Tem férias vencidas (período fechado sem tirar)?" valor={feriasVencidas} mudar={setFeriasVencidas}
        opcoes={[['nao', 'Não'], ['sim', 'Sim']]} />
      {(tipoDem === 'sem_justa' || tipoDem === 'acordo') && (
        <Campo rotulo="Saldo do FGTS (R$, veja no app do FGTS)" valor={fgts} mudar={setFgts} />
      )}
      {s > 0 && <Resultado linhas={linhas} total={total} />}
      {tipoDem === 'sem_justa' && <p className="datas">Além disso: saque do FGTS e seguro-desemprego (se cumprir os requisitos).</p>}
      {tipoDem === 'pedido' && <p className="datas">No pedido de demissão não há multa do FGTS nem seguro-desemprego; se não cumprir o aviso, a empresa pode descontar até 1 salário.</p>}
    </>
  )
}


function Fgts() {
  const [salario, setSalario] = useState('')
  const [qtd, setQtd] = useState('6')
  const [depositos, setDepositos] = useState({})
  const esperado = num(salario) * 0.08
  const n = Math.max(1, Math.min(12, parseInt(qtd) || 6))
  const agora = new Date()
  const meses = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    meses.push({
      chave: d.getFullYear() + '-' + (d.getMonth() + 1),
      rotulo: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    })
  }
  let totalDep = 0
  let faltando = 0
  const linhas = meses.map((m) => {
    const v = num(depositos[m.chave])
    totalDep += v
    const ok = esperado > 0 && v >= esperado * 0.99
    if (esperado > 0 && !ok) faltando += 1
    return { ...m, v, ok }
  })
  const totalEsperado = esperado * n
  return (
    <>
      <p>
        Abra o <strong>app FGTS</strong> (da Caixa, entrando com sua conta gov.br),
        veja o extrato e copie aqui o valor depositado em cada mês. A empresa deve
        depositar <strong>8% do seu salário bruto</strong> todo mês, até o dia 20 do mês seguinte.
      </p>
      <Campo rotulo="Seu salário bruto mensal (R$)" valor={salario} mudar={setSalario} />
      <Escolha rotulo="Quantos meses conferir?" valor={qtd} mudar={setQtd}
        opcoes={[['3', 'Últimos 3 meses'], ['6', 'Últimos 6 meses'], ['12', 'Últimos 12 meses']]} />
      {esperado > 0 && (
        <div className="cartao">
          <div style={{ marginBottom: 8 }}>Depósito esperado por mês: <strong>{BRL(esperado)}</strong></div>
          {linhas.map((m) => (
            <div key={m.chave} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ flex: 1, textTransform: 'capitalize' }}>{m.rotulo}</span>
              <input type="number" inputMode="decimal" placeholder="0,00"
                style={{ width: 110, marginBottom: 0 }}
                value={depositos[m.chave] ?? ''}
                onChange={(e) => setDepositos((x) => ({ ...x, [m.chave]: e.target.value }))} />
              <span style={{ width: 26, textAlign: 'center' }}>
                {num(depositos[m.chave]) === 0 ? '⬜' : m.ok ? '✅' : '⚠️'}
              </span>
            </div>
          ))}
        </div>
      )}
      {esperado > 0 && (
        <Resultado totalRotulo={faltando === 0 && totalDep > 0 ? 'Situação: em dia ✅' : 'Diferença a apurar'}
          linhas={[
            ['Esperado no período (' + n + ' meses)', totalEsperado],
            ['Encontrado no seu extrato', totalDep]
          ]}
          total={Math.max(0, totalEsperado - totalDep)} />
      )}
      {esperado > 0 && faltando > 0 && totalDep > 0 && (
        <div className="aviso-limite" style={{ borderColor: '#ca8a04' }}>
          ⚠️ {faltando} mês(es) abaixo do esperado. O que fazer: 1) confira se o
          salário informado é o bruto daquele mês (aumentos, extras e 13º mudam o
          valor); 2) registre a inconsistência aqui no Diário (categoria Verbas)
          com a foto do extrato; 3) procure o RH por escrito e, se não resolver,
          seu sindicato. O FGTS não depositado não prescreve enquanto durar o
          contrato + 5 anos após a saída.
        </div>
      )}
      <p className="datas">Também geram FGTS: 13º salário, horas extras e adicionais (8% sobre eles). Este conferidor usa o salário fixo — meses com variação podem exigir ajuste manual.</p>
    </>
  )
}

const FERRAMENTAS = [
  { id: 'he', icone: '⏰', nome: 'Horas extras + DSR', comp: HorasExtras },
  { id: 'not', icone: '🌙', nome: 'Adicional noturno', comp: Noturno },
  { id: 'fer', icone: '🏖️', nome: 'Férias', comp: Ferias },
  { id: 'dec', icone: '🎁', nome: '13º salário', comp: Decimo },
  { id: 'res', icone: '📋', nome: 'Rescisão', comp: Rescisao },
  { id: 'fgts', icone: '💰', nome: 'Conferência de FGTS', comp: Fgts }
]

export default function Calculadoras({ aoVoltar }) {
  const [aberta, setAberta] = useState(null)
  const F = FERRAMENTAS.find((f) => f.id === aberta)
  return (
    <div className="conteudo">
      <button className="voltar" onClick={() => (aberta ? setAberta(null) : aoVoltar())}>← Voltar</button>
      {!aberta && (
        <>
          <h2>🧮 Calculadoras</h2>
          <p>Simule seus valores em segundos. Estimativas em valores brutos, para seu controle pessoal.</p>
          <div className="grade-tipos">
            {FERRAMENTAS.map((f) => (
              <button key={f.id} className="tipo-btn" onClick={() => setAberta(f.id)}>
                <span className="icone">{f.icone}</span>
                <span>{f.nome}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {F && (
        <>
          <h2>{F.icone} {F.nome}</h2>
          <F.comp />
          <div className="aviso-limite">
            Estimativa educativa em valores brutos (sem INSS/IRRF) com base na CLT.
            Convenções coletivas podem prever valores maiores. Para conferência
            oficial, procure seu sindicato, um contador ou advogado.
          </div>
        </>
      )}
    </div>
  )
}
