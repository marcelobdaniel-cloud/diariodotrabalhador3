# Diário do Trabalhador — Guia de instalação no SEU Supabase

Este pacote contém o app completo (Fase 1). Você só precisa criar o seu banco
no Supabase, colar 2 valores no código e publicar. Uns 20 minutos no total.

## Passo 1 — Criar o projeto no Supabase (grátis)

1. Acesse https://supabase.com e crie uma conta (pode entrar com GitHub ou e-mail).
2. Clique em **New project**:
   - Name: `diario-do-trabalhador`
   - Database password: crie uma senha forte e **guarde** (não vai precisar dela no dia a dia)
   - Region: **South America (São Paulo)**
3. Aguarde ~2 minutos até o projeto ficar verde (ACTIVE).

## Passo 2 — Criar as tabelas (colar o SQL)

1. No menu lateral do Supabase, abra **SQL Editor**.
2. Abra o arquivo `supabase/migrations/0001_diario_core.sql` deste pacote,
   copie TODO o conteúdo, cole no editor e clique em **Run**
   ("Success. No rows returned").
3. Repita com `supabase/migrations/0002_diario_perfis.sql` e depois
   `supabase/migrations/0003_diario_hardening.sql`
   (sempre na ordem: 0001 → 0002 → 0003).

A 0001 cria a tabela de registros com a trava de imutabilidade (ninguém consegue
alterar ou apagar um registro — nem você) e a cadeia de hash do servidor.
A 0002 cria o cadastro progressivo (níveis Bronze/Prata/Ouro com consentimento
LGPD; o nível é calculado pelo servidor).

## Passo 3 — Pegar as suas 2 chaves

1. No Supabase: **Project Settings** (engrenagem) → **API Keys**.
2. Copie:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - **Publishable key** (começa com `sb_publishable_...`) — é a chave pública,
     pode ficar no código do site sem problema.

## Passo 4 — Colar as chaves no app

Abra o arquivo `src/lib/supabase.js` e substitua os dois textos
`COLE_AQUI_...` pelos valores do Passo 3. Exemplo final:

```js
const url = import.meta.env.VITE_SUPABASE_URL || 'https://abcdefgh.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_xxxxxxxxxxxx'
```

## Passo 5 — Rodar no seu computador (opcional, para testar)

Precisa do Node.js instalado (https://nodejs.org, versão LTS).

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (http://localhost:5173). 

## Passo 6 — Cadastro de usuários

Projetos novos do Supabase já vêm com cadastro por e-mail ligado, exigindo
confirmação por e-mail. Você tem 2 opções:

- **Deixar como está**: quem criar conta no app recebe um e-mail de confirmação.
- **Para testar mais rápido**: no Supabase, **Authentication → Sign In / Providers
  → Email** e desligue "Confirm email" (dá para religar depois). Ou crie usuários
  manualmente em **Authentication → Users → Add user** (marque "Auto confirm").

## Passo 7 — Publicar na internet (Vercel, grátis)

1. Acesse https://vercel.com e crie uma conta.
2. Jeito mais simples: instale o Vercel CLI e publique direto da pasta:
   ```bash
   npm i -g vercel
   vercel --prod
   ```
   (responda as perguntas com Enter; framework Vite é detectado sozinho)
3. Alternativa: suba a pasta para um repositório no GitHub e em vercel.com
   clique **Add New → Project → Import** do repositório.

Pronto: a Vercel te dá um endereço `https://seu-projeto.vercel.app`.
O app é um PWA — no celular, o navegador oferece "Adicionar à tela inicial".

## O que este app garante (resumo)

- Funciona **sem internet**: o registro é salvo no aparelho na hora, com hash.
- Quando a conexão volta, o **servidor carimba** a data e fecha a cadeia de hash.
- Registros são **imutáveis** (correção só por novo registro/errata).
- Cada usuário só enxerga os próprios registros (RLS do Supabase).
- O app **informa e organiza** — não dá conselho jurídico nem calcula valores.

Roadmap completo das próximas fases: `FASES.md`.
