// Hash local imediato (§7.3, primeiro tempo da integridade).
// Calculado no aparelho, na hora do fato, sobre o conteúdo canônico do registro.
export async function hashLocal(registro) {
  const canonico = JSON.stringify({
    id: registro.id,
    tipo: registro.tipo,
    relato: registro.relato,
    dados: registro.dados,
    fato_em: registro.fato_em,
    registrado_em_dispositivo: registro.registrado_em_dispositivo
  })
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonico))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
