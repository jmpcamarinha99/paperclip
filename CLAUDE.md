# Paperclip — Agente de Projeto

Este é o agente do projeto **Paperclip** dentro da infraestrutura **JC World**, gerida pelo **Oscar**.

Este CLAUDE.md é subordinado ao CLAUDE.md principal em `/srv/CLAUDE.md`. Todas as regras do Oscar aplicam-se aqui. Em caso de conflito, o Oscar prevalece.

---

## Identidade do Projeto

- **Nome:** Paperclip
- **Área:** AI
- **Diretório no servidor:** `/srv/projects/ai/paperclip/`
- **Repo GitHub:** github.com/jmpcamarinha99/paperclip (público)
- **Subdomínio:** `paperclip.jc-world.com`
- **Porta:** 5005
- **Branch principal:** master
- **Tipo:** Node.js monorepo (pnpm) — servidor + UI React

---

## O que é

Plataforma open-source de orquestração para empresas autónomas com agentes AI. Servidor Node.js + dashboard React que coordena equipas de agentes AI para gerir negócios — org charts, budgets, governance, goal alignment e agent coordination.

---

## Stack do Projeto

| Componente | Tecnologia | Notas |
|---|---|---|
| Frontend | React + TypeScript | Dashboard UI |
| Backend | Node.js + TypeScript | Servidor com API |
| Base de dados | PostgreSQL (embedded) | Via Drizzle ORM |
| Package Manager | pnpm | Monorepo workspaces |
| Build | esbuild + Vite | CLI + UI |
| Testes | Vitest + Playwright | Unit + E2E |
| Deploy | Docker → Coolify | Auto-deploy via GitHub |

---

## Estrutura do Monorepo

```
paperclip/
├── cli/              ← CLI tool (@paperclipai/cli)
├── server/           ← Servidor principal (@paperclipai/server)
├── ui/               ← Dashboard React (@paperclipai/ui)
├── packages/
│   ├── shared/       ← Tipos e utils partilhados
│   ├── db/           ← Schema e migrações (Drizzle)
│   ├── adapter-utils/← Utils para adapters
│   ├── adapters/     ← Adapters para agentes (Claude, Codex, Cursor, etc.)
│   └── plugins/      ← Plugin SDK
├── docs/             ← Documentação (Mintlify)
├── tests/            ← E2E tests
├── scripts/          ← Scripts de dev/release
└── docker-compose.yml
```

---

## Deploy

### Docker (porta 5005)
- Container gerido pelo Coolify
- Auto-deploy no git push (GitHub App)
- Porta interna do Paperclip: 3100, mapeada para 5005

### Coolify
- Projeto: Paperclip
- Repo: paperclip
- Branch: master
- Build: Dockerfile
- Port Mapping: 5005:3100
- Env vars: definidas no Coolify

### Cloudflare Tunnel
- paperclip.jc-world.com → HTTP → 127.0.0.1:5005

---

## Variáveis de Ambiente

```
DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
PORT=3100
SERVE_UI=true
```

Nota: O Dockerfile usa PostgreSQL embedded, mas variáveis adicionais podem ser necessárias conforme configuração.

---

## Regras do Agente

### O que PODES fazer
- Editar ficheiros APENAS dentro de `/srv/projects/ai/paperclip/`
- Adicionar funcionalidades, adapters, plugins
- Melhorar UI/UX do dashboard
- Corrigir bugs
- Atualizar esta documentação
- Fazer git commit e push para o repo paperclip

### O que NÃO podes fazer
- Tocar em ficheiros fora deste diretório
- Instalar pacotes globais (npm -g, pip global, apt install)
- Criar containers Docker manualmente (deploy é via Coolify)
- Commitar .env ou credenciais
- Aceder a ficheiros de outros projetos

### Convenções de código
- Idioma do código: Inglês
- Idioma da UI: Inglês (projeto open-source)
- TypeScript strict
- pnpm como package manager
- Testes com Vitest

---

## Ferramentas Partilhadas

Este projeto tem acesso a ferramentas centralizadas do JC World:

### MCPs Globais (disponíveis automaticamente)
- **Supabase MCP** — acesso direto à BD, auth, storage
- **GitHub MCP** — repos, issues, PRs
- **Context7 MCP** — documentação atualizada de libs

### Slash Commands (disponíveis em qualquer sessão)
- `/status` — estado do servidor (Docker, PM2, portas, disco)
- `/deploy` — trigger deploy via Coolify
- `/auth-status` — estado da autenticação Claude
- `/tunnel-check` — verificar Cloudflare Tunnel
- `/supabase-status` — estado do Supabase

Documentação completa: `/srv/shared/docs/08-catalogo-ferramentas.md`

---

*Última atualização: 26 de Março de 2026*
*Projeto JC World — Agente subordinado ao Oscar*


---

## Telegram — Comunicacao com o Joao

Este agente pode enviar notificacoes ao Joao via Telegram:
```bash
/srv/shared/libs/telegram-notify.sh "mensagem"
```

Usar para: deploys, erros criticos, tarefas concluidas, alertas de seguranca.
