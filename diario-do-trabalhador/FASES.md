# DIÁRIO DO TRABALHADOR — Plano de Fases por Módulo

Revisado em 17/07/2026 conforme o **novo Prompt Mestre** (missão: proteger,
orientar, informar e fortalecer o trabalhador brasileiro; o trabalhador é o
centro absoluto). Os princípios do Volume VII ("Celular-Piso", verdade,
integridade, limite não-advocacia) continuam valendo como base de engenharia.

Toda funcionalidade responde: **"Como isso protege, orienta ou fortalece o
trabalhador?"**

---

## Estado atual (Fase 1 revisada — no ar)

| Pilar do Prompt Mestre | Estado | O que existe hoje |
|---|---|---|
| 1. Blindagem de Direitos | 🟢 Núcleo pronto | Registro cronológico imutável (6 teses), selo de contemporaneidade, cadeia de hash + carimbo do servidor, offline-first, linha do tempo |
| 2. Central de Inteligência | ⚪ Fase 3 | — |
| 3. IA Especializada | ⚪ Fase 3 | — |
| 4. Alertas Inteligentes | ⚪ Fase 4 | Perfil (UF, profissão, sindicato) já capta os dados que alimentarão os alertas |
| 5. Consultoria Jurídica | ⚪ Fase 5 | Perfil já pergunta se tem advogado; consentimento de divulgação a parceiros já colhido |
| 6. Cadastro Inteligente Progressivo | 🟢 Pronto | Bronze → Prata → Ouro com consentimento LGPD granular (ver abaixo) |
| 7. Ecossistema | ⚪ Fase 6 | Base de dados já isolada por RLS, pronta para módulos de terceiros |
| Tecnologia Inclusiva | 🟡 Parcial | PWA leve (111 KB gzip), voz para ditado, labels de acessibilidade; navegação por voz completa e leitor de tela auditado ficam na Fase 2 |

### Cadastro Inteligente Progressivo (Pilar 6) — como ficou

- **🥉 Bronze** (mínimo): nome completo, telefone/WhatsApp, e-mail de contato.
  Benefício: Diário completo e protegido.
- **🥈 Prata** (raio-x estilo Gov.BR + vida profissional): CPF, nascimento, nome
  da mãe, CEP/cidade/UF, escolaridade, situação de trabalho, profissão, empresa,
  CTPS (número/série), PIS, filiação a sindicato (qual), advogado trabalhista
  (sim/não). Benefício: alertas e informações do perfil.
- **🥇 Ouro**: Prata + foto (comprimida no aparelho). Benefício: prioridade nos
  serviços e parceiros do ecossistema.
- **LGPD**: aceite obrigatório de tratamento + aceite **opcional e separado** de
  divulgação a parceiros (sindicatos/advogados), ambos com carimbo de data e
  versão do termo. O nível é calculado por trigger no servidor (não manipulável).
  Perfil é editável e excluível (direito de exclusão); os registros do Diário
  são imutáveis à parte.

---

## Fase 1.5 — Projeto Supabase dedicado (pré-requisito para abrir ao público)

Hoje o app divide o projeto Supabase do Cockpit (limite de 2 projetos do plano
gratuito) e por isso o cadastro de contas é por convite. Para abrir ao público:

1. **Pausar/excluir `nutriwords`** (se não estiver em uso) → projeto gratuito
   dedicado em `sa-east-1`; ou **upgrade Supabase Pro** (~US$ 25/mês).
2. Rodar `supabase/migrations/0001` e `0002` no projeto novo, habilitar signup
   por e-mail, trocar `VITE_SUPABASE_URL`/`VITE_SUPABASE_KEY`, redeployar.

## Fase 2 — Blindagem completa (Pilar 1) + Inclusão (requisito transversal)

- Anexos nos registros: fotos/vídeos/áudios comprimidos no aparelho, hash do
  arquivo dentro do registro, original na nuvem e miniatura local.
- Minha Pasta Profissional (documentos organizados e pesquisáveis) + busca.
- **Relatório exportável**: PDF com registros, as duas datas e a cadeia de hash
  verificável (para advogado/sindicato).
- Errata na interface (`errata_de` já existe no banco).
- Acessibilidade plena: auditoria com leitor de tela (TalkBack), navegação por
  voz, contraste AAA, modo texto grande.
- Aviso legal sobre gravação de áudio (lícita só com o usuário participando).

## Fase 3 — Central de Inteligência + IA Especializada (Pilares 2 e 3)

- Ingestão curada de fontes oficiais (MTE, INSS, Caixa, eSocial, TST, STF, STJ,
  TRTs, convenções) com resumo em linguagem simples, revisado por advogado do
  projeto antes de publicar.
- IA própria (Edge Function + API Anthropic + RAG sobre banco vetorial pgvector
  no Supabase): responde com referência à fonte oficial, linguagem simples,
  respostas curtas (pouca banda) e **sempre** sinaliza quando o caso exige um
  profissional habilitado. Nunca estima valores nem induz litígio.

## Fase 4 — Alertas Inteligentes (Pilar 4)

- Notificações personalizadas pelo perfil (UF, profissão, sindicato, situação):
  mudanças de lei, pisos salariais, convenções, decisões relevantes.
- Canais: push do PWA + WhatsApp (infra do ecossistema já planejada no Cockpit).
- Opt-in/opt-out granular por tipo de alerta (LGPD).

## Fase 5 — Consultoria Jurídica (Pilar 5)

- Triagem por IA → encaminhamento; atendimento via WhatsApp; agenda de consulta
  com advogado parceiro; pagamento e avaliação; cadastro transparente de
  honorários.
- Usa o consentimento de divulgação já colhido no cadastro (quem não autorizou
  não é ofertado a parceiros).
- Revisão OAB: o app conecta e organiza; quem advoga é o advogado.

## Fase 6 — Ecossistema (Pilar 7)

- Módulos para RH, DP, Contabilidade, Advogados, Empresas e Sindicatos sobre a
  mesma base de conhecimento — o trabalhador continua o centro e dono dos
  próprios dados (compartilhamento só com consentimento).

## Fase 7 — Android nativo (Kotlin)

- App nativo validado no dispositivo-piso (Android 8, 2 GB RAM, 3G instável),
  orçamentos de desempenho por build; mesma API Supabase.

---

## Critério de "pronto" (mantido do Volume VII)

1. Funciona offline por completo. 2. Fluido no dispositivo-piso (~375px).
3. Integridade preservada (carimbo + hash). 4. Verdade e não-advocacia.
5. Utilizável por baixa alfabetização digital. 6. Mínimo de dados/armazenamento.
7. LGPD ok. **Falhou em um → não está pronto.**
