import React from 'react'
import { TIPOS } from '../lib/tipos'
import { selo, dataBR } from '../lib/selo'

export default function Detalhe({ registro, aoVoltar }) {
  const def = TIPOS[registro.tipo]
  const s = selo(registro.fato_em, registro.registrado_em_dispositivo)

  return (
    <div className="conteudo">
      <button className="voltar" onClick={aoVoltar}>← Voltar</button>
      <h2>{def.icone} {def.nome}</h2>

      <p><span className={'selo ' + s.cor}>{s.rotulo}</span></p>

      {Object.entries(registro.dados || {}).map(([k, v]) => {
        const campo = def.campos.find((c) => c.chave === k)
        if (!v) return null
        return (
          <p key={k}><strong>{campo ? campo.rotulo : k}</strong><br />{String(v)}</p>
        )
      })}

      {registro.relato && (
        <>
          <p><strong>Relato</strong></p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{registro.relato}</p>
        </>
      )}

      {/* Integridade em dois tempos (§7.3): as duas datas, sem esconder nada. */}
      <div className="cartao">
        <p><strong>Integridade do registro</strong></p>
        <p>Fato ocorrido em: <strong>{dataBR(registro.fato_em)}</strong></p>
        <p>Registrado no aparelho em: <strong>{dataBR(registro.registrado_em_dispositivo)}</strong></p>
        <p>
          Confirmado pelo servidor em:{' '}
          <strong>
            {registro.status === 'sincronizado'
              ? dataBR(registro.recebido_em)
              : 'aguardando conexão'}
          </strong>
        </p>
        <p style={{ marginTop: 8 }}><strong>Código de verificação (aparelho)</strong></p>
        <p className="hash">{registro.hash_local}</p>
        {registro.hash_servidor && (
          <>
            <p style={{ marginTop: 8 }}><strong>Código da cadeia (servidor)</strong></p>
            <p className="hash">{registro.hash_servidor}</p>
          </>
        )}
      </div>

      <div className="aviso-limite">
        Registros não podem ser apagados nem alterados — isso protege o valor
        deles como prova. Errou algo? Faça um novo registro contando a correção.
      </div>
    </div>
  )
}
