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

> **Contexto JC World (Abr 2026):** O ecossistema JC World opera com **24 agentes** (N1→N4) coordenados via mesh v2 (inbox, memória persistente, dispatcher autónomo, auto-callback). A arquitectura do Paperclip é complementar a este sistema — enquanto o mesh JC World é baseado em ficheiros, o Paperclip oferece uma camada visual de orquestração e governance para empresas externas.

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

### Deploy — Processo Completo

Tu **NÃO fazes deploy directamente**. O deploy é centralizado no DevOps. Quando precisares de deploy, segue estes passos na ordem:

**Passo 1 — Código pronto**
- Verifica que o código compila/funciona localmente
- Corre `npm run build` ou equivalente para confirmar que não há erros

**Passo 2 — Commit e push**
```bash
git add <ficheiros alterados>
git commit -m "descrição clara da alteração"
git push origin main
```

**Passo 3 — Pedir deploy ao DevOps**
```bash
bash /srv/shared/libs/mesh.sh send paperclip devops "deploy paperclip" "Alterações: <resumo do que mudou>. Código pushed para main, build testado."
```

**Passo 4 — Aguardar confirmação**
- O DevOps executa o deploy via Coolify API
- Verifica o resultado na sala mesh ou na tua inbox

**PROIBIDO:**
- Correr `docker build`, `docker run`, `docker stop` ou qualquer comando Docker
- Executar scripts de deploy manualmente
- Alterar configurações do Coolify
- Criar ou expor portas

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

*Última atualização: 12 de Abril de 2026 (alinhamento infra — ecossistema 24 agentes, auth centralizada)*
*Projeto JC World — Agente subordinado ao Oscar*


---

## Telegram — Comunicacao com o Joao

Este agente pode enviar notificacoes ao Joao via Telegram:
```bash
/srv/shared/libs/telegram-notify.sh "mensagem"
```

Usar para: deploys, erros criticos, tarefas concluidas, alertas de seguranca.


## Team Directory — Equipa JC World

Todos os agentes devem conhecer a equipa completa e saber delegar tarefas.
Directorio completo: `/srv/shared/team-directory.md`
Para delegar: usar `/delegate` ou escrever em `/srv/shared/mesh/inbox/{agent-id}/`


---

## MCPs — Ecossistema

### Os teus MCPs (carregados na sessão):
- **context7** (stdio, ~60 MB) — Docs actualizadas de libs
- **supabase** (stdio, ~60 MB) — Base de dados, auth, storage
- **brave-search** (stdio, ~60 MB) — Pesquisa web
- **github** (http, 0 MB) — Repos, issues, PRs
- **sentry** (http, 0 MB) — Error tracking
- **stripe** (http, 0 MB) — Pagamentos

### MCPs do ecossistema
Tabela completa de distribuição: ver `/srv/CLAUDE.md` secção "MCPs — Distribuição Cirúrgica por Agente"

### Como pedir um MCP que não tens:
```
bash /srv/shared/libs/mesh.sh send paperclip <agente-que-tem> "Preciso de [MCP]" "Detalhe do que preciso..."
```
O dispatcher executa automaticamente o agente destino.

---

## Hierarquia e Colaboração

Documentação completa: `/srv/shared/mesh/hierarchy.md`

### Tua posição:
- **Nível:** 4 — Projecto
- **Reportas a:** Oscar
- **Podes pedir ajuda a:** Designer (UI), QA (testes), DevOps (deploy), Sentinel (security), DocWriter (docs), PluginManager (tools)

### ANTES de agir, consulta:
- Designer — antes de alterar UI significativamente
- QA — antes de fazer deploy
- Sentinel — antes de alterar auth ou segurança
- DevOps — para questões de infra/deploy
- DocWriter — após mudanças grandes (notificar)
- Oscar — para qualquer coisa cross-project

### Quando receberes uma tarefa complexa (multi-projecto ou estratégica):
1. Posta na sala mesh relevante: `bash /srv/shared/libs/mesh.sh room-post general paperclip "Recebi tarefa X, plano é Y, concordam?"`
2. Espera por feedback dos agentes envolvidos (verifica sala após postar)
3. Se há objecção, ajusta. Se concordam, avança.
4. Quando terminas, posta resultado na sala: `bash /srv/shared/libs/mesh.sh room-post general paperclip "Concluído: resultado Z"`

### Salas onde participas:
- `general`

---

## Mesh — Colaboração

O JC World usa um sistema de mesh baseado em ficheiros para colaboração entre agentes.

### Ao iniciar sessão:
1. **Verifica inbox:** Corre `bash /srv/shared/libs/mesh.sh check-inbox paperclip` — se houver pedidos pendentes, processa-os antes de qualquer outra tarefa
2. **Lê actividade recente:** Corre `bash /srv/shared/libs/mesh.sh history 10` — contexto do que aconteceu no servidor
3. **Actualiza presença:** Corre `bash /srv/shared/libs/mesh.sh update-presence paperclip` (ou com descrição do que vais fazer)

### Ao completar trabalho significativo:
1. **Guarda lição:** `bash /srv/shared/libs/mesh.sh memory-save paperclip "lição aprendida" --tags "tag1,tag2" --status done|failed` — OBRIGATÓRIO: guardar o que aprendeste
2. **Regista actividade:** `bash /srv/shared/libs/mesh.sh log paperclip <type> "descrição"` — tipos: deploy, fix, feature, alert, system
3. **Se foi delegação:** `bash /srv/shared/libs/mesh.sh reply <ficheiro-tarefa> done "resultado"` — move para done/ automaticamente
4. **Se afecta outro agente:** `bash /srv/shared/libs/mesh.sh send paperclip <destino> "assunto" "mensagem"` — notifica via inbox

### Quando precisas de ajuda:
1. **Procura quem sabe:** `bash /srv/shared/libs/mesh.sh find-skill "keyword"` — ex: "react", "security", "deploy"
2. **Delega:** `bash /srv/shared/libs/mesh.sh send paperclip <destino> "assunto" "detalhes"` — ou usa `/delegate`
3. **Se urgente:** adiciona prioridade `urgent` e será notificado via Telegram

### Comandos mesh disponíveis
Referência completa: `bash /srv/shared/libs/mesh.sh help`

Comandos de memória:
```bash
mesh.sh memory-save <agent-id> "<lição>" --tags "t1,t2" --status done|failed  # Guardar lição
mesh.sh memory-read <agent-id> [n]                   # Ler memória do agente
```
