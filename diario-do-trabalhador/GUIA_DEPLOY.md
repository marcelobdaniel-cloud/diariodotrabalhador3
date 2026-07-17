# Guia de Deploy — Diário do Trabalhador

Este guia coloca o app no ar em três blocos: **Supabase** (banco e login),
**Vercel** (hospedagem) e, quando você quiser, **domínio .com.br**.
Tempo estimado: 30–40 minutos na primeira vez.

---

## Parte 1 — Supabase (banco de dados e autenticação)

1. Acesse https://supabase.com e entre (ou crie sua conta).
2. Clique em **New project**:
   - **Name**: `diario-do-trabalhador`
   - **Database Password**: crie uma senha forte e **guarde** (você raramente
     vai usá-la, mas ela é a chave-mestra do banco).
   - **Region**: `South America (São Paulo)` — menor latência para usuários no Brasil.
3. Aguarde o projeto ficar pronto (1–2 minutos).

### 1.1 Criar as tabelas

1. No menu lateral, abra **SQL Editor** → **New query**.
2. Abra o arquivo **`supabase/SETUP_COMPLETO.sql`** deste projeto, copie TODO o
   conteúdo, cole no editor e clique em **Run**.
   - Ele aplica as três migrations na ordem certa (núcleo de registros com
     cadeia de hash, perfis com LGPD, e o hardening de segurança).
   - Deve terminar com "Success. No rows returned".

### 1.2 Configurar a autenticação

1. Menu **Authentication** → **Sign In / Up** (ou "Providers"):
   - Confirme que **Email** está habilitado.
   - **Confirm email**: recomendo deixar **ligado** (o usuário confirma o
     e-mail antes de entrar). Se quiser testar mais rápido no início, pode
     desligar e religar depois.
2. Menu **Authentication** → **Passwords**:
   - Ative **Leaked password protection** (recomendação da migration 0003).
3. Menu **Authentication** → **URL Configuration**:
   - **Site URL**: por enquanto deixe o padrão; depois do deploy na Vercel,
     volte aqui e coloque a URL do app (ex.: `https://seu-app.vercel.app`).
     Quando tiver o domínio .com.br, atualize de novo.

### 1.3 Copiar as chaves

1. Menu **Project Settings** → **API Keys** (ou "Data API"):
   - Copie a **Project URL** (algo como `https://abcdefgh.supabase.co`).
   - Copie a chave **publishable** (em projetos mais antigos aparece como
     `anon public`). **Nunca** use a `secret`/`service_role` no app.
2. Guarde as duas — você vai colar na Vercel na Parte 2.

> Segurança: a chave publishable pode ficar no front-end sem problema. Quem
> protege os dados são as políticas RLS criadas pelo SQL (cada usuário só
> enxerga os próprios registros) e os triggers de imutabilidade.

---

## Parte 2 — Vercel (colocar o app no ar)

O caminho recomendado é via **GitHub**, porque cada atualização futura vira
deploy automático.

### 2.1 Subir o código para o GitHub

1. Crie um repositório em https://github.com/new (pode ser **privado**),
   ex.: `diario-do-trabalhador`.
2. No seu computador, dentro da pasta do projeto:

   ```bash
   git init
   git add .
   git commit -m "Diário do Trabalhador — MVP Fase 1"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/diario-do-trabalhador.git
   git push -u origin main
   ```

   (O `.gitignore` já está pronto: `node_modules`, `dist` e `.env` ficam de fora.)

### 2.2 Importar na Vercel

1. Acesse https://vercel.com e entre com o GitHub.
2. **Add New…** → **Project** → importe o repositório `diario-do-trabalhador`.
3. A Vercel detecta **Vite** sozinha (Build: `vite build`, Output: `dist`).
   Não precisa mudar nada — o `vercel.json` do projeto já cuida das rotas do
   PWA e do cache.
4. **Antes de clicar em Deploy**, abra **Environment Variables** e adicione:

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | a Project URL copiada na Parte 1.3 |
   | `VITE_SUPABASE_KEY` | a chave publishable copiada na Parte 1.3 |

5. Clique em **Deploy**. Em ~1 minuto o app estará em
   `https://seu-projeto.vercel.app`.

### 2.3 Fechar o circuito

1. Volte ao Supabase → **Authentication → URL Configuration** e coloque a URL
   da Vercel como **Site URL** (e em **Redirect URLs**, se pedir).
2. Abra o app, crie uma conta com seu e-mail, confirme pelo link recebido e
   faça o primeiro registro de teste.
3. Teste o offline: com o app aberto no celular, ative o modo avião, crie um
   registro, volte a ficar online e confira se ele sincroniza (fila do
   IndexedDB → Supabase).

> Alternativa sem GitHub: instale a CLI (`npm i -g vercel`) e rode `vercel`
> dentro da pasta do projeto. Funciona, mas você perde o deploy automático a
> cada atualização.

---

## Parte 3 — Domínio .com.br (quando você quiser)

Nada no projeto precisa mudar para isso — é só configuração. Quando chegar a hora:

1. **Registre o domínio** em https://registro.br (órgão oficial do .br).
   Custa em torno de R$ 40/ano e exige CPF ou CNPJ.
2. Na **Vercel**: abra o projeto → **Settings → Domains** → **Add** e digite o
   domínio (ex.: `diariodotrabalhador.com.br`). A Vercel vai mostrar os
   registros DNS necessários.
3. No **registro.br**, painel do domínio, você tem duas opções:
   - **Mais simples**: em "DNS", use o modo avançado e crie os registros que a
     Vercel indicou — normalmente um **A** apontando para o IP da Vercel no
     domínio raiz e um **CNAME** `www` → `cname.vercel-dns.com` (confirme os
     valores exatos na tela da Vercel, eles podem mudar).
   - **Alternativa**: delegar os nameservers para os da Vercel
     (`ns1.vercel-dns.com` e `ns2.vercel-dns.com`) e gerenciar o DNS todo
     pela Vercel.
4. Aguarde a propagação (minutos a algumas horas). A Vercel emite o
   **certificado HTTPS automaticamente** — não precisa contratar SSL.
5. **Último passo obrigatório**: volte ao Supabase → **Authentication → URL
   Configuration** e troque a Site URL para `https://seudominio.com.br`
   (mantenha a URL da Vercel nas Redirect URLs, se quiser continuar usando as
   duas).

---

## Resumo dos arquivos preparados

| Arquivo | Para quê |
|---|---|
| `supabase/SETUP_COMPLETO.sql` | Colar uma única vez no SQL Editor do Supabase |
| `.env.example` | Modelo das variáveis (para rodar local: copie para `.env`) |
| `.gitignore` | Evita subir `node_modules`, `dist` e segredos para o GitHub |
| `vercel.json` | Rotas do PWA e cache — já configurado, não mexer |

## Rodar no seu computador (opcional)

```bash
npm install
cp .env.example .env   # e preencha com as suas chaves
npm run dev            # abre em http://localhost:5173
```
