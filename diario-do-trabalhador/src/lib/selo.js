// Selo de contemporaneidade (§6): calculado de forma honesta,
// da data do FATO até a data do REGISTRO no aparelho. Não manipulável.
const H48 = 48 * 60 * 60 * 1000
const D30 = 30 * 24 * 60 * 60 * 1000

export function selo(fatoEm, registradoEm) {
  const diff = new Date(registradoEm) - new Date(fatoEm)
  if (diff <= H48) return { cor: 'verde', rotulo: 'Registrado em até 48h do fato' }
  if (diff <= D30) return { cor: 'amarelo', rotulo: 'Registrado entre 2 e 30 dias após o fato' }
  return { cor: 'branco', rotulo: 'Registrado mais de 30 dias após o fato' }
}

export function dataBR(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
