📚 Gerador Inteligente de Planos de Aula
Desafio Técnico 02 - Vitor Eduardo
Este projeto é uma aplicação web completa para gerar, visualizar e salvar planos de aula usando a Inteligência Artificial Gemini integrada ao Supabase.
Status da Entrega: O fluxo de ponta a ponta (Frontend → Edge Function → Persistência no DB → Exibição) está totalmente funcional.
🚀 Links de Entrega e Acessos
Item	Link/Comando	Notas
URL da Aplicação (Frontend)	[INSIRA AQUI A URL DO SEU DEPLOY NO NETLIFY/VERCEL]	Acesso à interface para testes.
Projeto Supabase	https://app.supabase.com/project/yxzpzfvcyiymhknwpqko	Acesso ao console para logs, secrets e banco de dados.
Chave Anon/URL	Inseridas diretamente no script.js	Não são necessárias credenciais adicionais para testes.
⚙️ Arquitetura e Decisões Técnicas
Camada	Tecnologia	Motivação
Frontend	HTML, CSS, JavaScript Puro	Demonstra clareza lógica, leveza e total controle sobre a comunicação.
Backend (BaaS)	Supabase (Edge Functions, DB)	Isolamento da chave da IA (segurança) e escalabilidade nativa.
IA	Gemini (Google AI)	Modelo de alto desempenho para seguir prompts estruturados em JSON.
1. Fluxo de Dados
1.	O Frontend captura os inputs e envia uma requisição fetch (sem headers de autenticação) para a Edge Function gerar-plano.
2.	A Edge Function acessa a GEMINI_API_KEY (via Secrets), chama a API do Gemini, recebe o JSON do plano e insere os dados formatados na tabela planos_aula.
3.	A Edge Function retorna o plano gerado para o Frontend, que exibe o resultado formatado.
2. Scripts SQL
O arquivo supabase_schema.sql (anteriormente supabase.sql) contém a definição da tabela planos_aula e as políticas de segurança.
•	Ação: Este arquivo foi criado manualmente no repositório, pois o comando supabase db dump (exportação) falhou devido a problemas de ambiente local (CLI/Docker). Isso garante a comprovação da modelagem de dados.
🔧 Instruções de Execução e Configuração
1. Configuração de Secrets
A chave do Gemini deve ser configurada como Secret no seu projeto Supabase:
supabase secrets set GEMINI_API_KEY=SUA_CHAVE_COMPLETA_DO_GEMINI_AQUI
2. Deploy da Edge Function
A função deve ser implantada com a flag que desabilita a verificação de JWT, crucial para o sucesso da comunicação do seu frontend:
supabase functions deploy gerar-plano --no-verify-jwt
3. Execução do Frontend
Abra o index.html usando um servidor local (ex: Live Server do VS Code) ou acesse a URL do deploy (Vercel/Netlify).
🔬 Desafios Superados (Prova de Habilidade)
Os problemas de infraestrutura foram os maiores obstáculos. O sucesso da aplicação depende de contorná-los:
Desafio	Causa / Contexto	Solução Implementada
Problemas de CORS	Falha persistente na requisição de preflight (OPTIONS) do Supabase, bloqueando a comunicação do Frontend com a Edge Function.	O frontend foi reescrito para usar fetch direto (sem o SDK) e sem headers de autenticação. A Edge Function foi implantada com a flag --no-verify-jwt.
Estrutura de IA Complexa	O Gemini retorna o passo-a-passo e a rubrica em formato JSON dentro do JSON principal, causando erro de exibição [object Object].	Implementei as funções formatarPassos e formatarRubrica em script.js para fazer o JSON.parse e formatar o conteúdo em texto legível, garantindo a usabilidade.
Problemas de CLI/Docker	Falhas na inicialização do Docker e comandos supabase link/dump no ambiente Windows.	Optei por usar apenas o Supabase hospedado na nuvem e gerei o supabase_schema.sql manualmente, focando na entrega do resultado final.

