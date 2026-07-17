# Diário do Trabalhador — MVP web (Fase 1)

PWA offline-first governado pelo Prompt Mestre (Volume VII, "Celular-Piso").
Roadmap completo em [FASES.md](FASES.md).

## Online

- **Produção (Vercel)**: https://diario-do-trabalhador-fmv-desenvolvimento-ltda.vercel.app
- **Supabase**: projeto `wqpqfyjxyndxtrfbwwie` (temporário, compartilhado com o
  Cockpit — tabelas `dt_*`; ver Fase 1.5 em FASES.md).
- Conta de teste: `diario.teste@exemplo.com` / `diario123` (signup público está
  desativado neste projeto Supabase; acesso por convite nesta fase).

## Rodar local

```bash
npm install
npm run dev      # http://localhost:5199 (via .claude/launch.json) ou porta padrão do Vite
npm run build    # produção em dist/
```

## Arquitetura (o que é inegociável)

- **Offline-first**: registro salvo em IndexedDB na hora, com hash SHA-256 local
  e hora do aparelho. Sincroniza quando houver rede (fila idempotente por UUID).
- **Integridade em dois tempos**: o servidor adiciona `recebido_em` (carimbo) e
  fecha a cadeia `hash_servidor = sha256(hash_anterior | hash_local | recebido_em)`
  via trigger — o cliente nunca controla esses campos.
- **Imutabilidade**: UPDATE/DELETE bloqueados por trigger; correção só por errata.
- **Selo de contemporaneidade**: calculado do fato → registro no aparelho
  (verde ≤48h, amarelo 2–30d, branco >30d), com as duas datas sempre visíveis.
- **Limites**: o app informa e organiza; não aconselha caso concreto, não calcula
  valores, não induz litígio.

## Variáveis (para o projeto dedicado da Fase 1.5)

`VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` (publishable). Sem elas, usa o projeto
temporário hardcoded em `src/lib/supabase.js`.
