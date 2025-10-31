## Gerador de Planos de Aula com IA

- 100% Funcional | Stack: HTML/JS Puro, Supabase (Edge Functions + DB), Google Gemini API

Este projeto é uma aplicação web completa que demonstra proficiência em desenvolvimento Backend-as-a-Service (BaaS) e integração com Inteligência Artificial, utilizando o Supabase como espinha dorsal e o modelo Gemini para geração de conteúdo pedagógico estruturado.

O objetivo foi construir um sistema robusto, escalável e seguro que transforma inputs simples (Série, Matéria, Tema) em um Plano de Aula completo, alinhado aos padrões (Introdução Lúdica, Objetivo BNCC, Passo a Passo e Rubrica de Avaliação).

## Arquitetura e Fluxo de Dados

A solução adota uma arquitetura Serverless orientada a serviços para garantir segurança e performance na integração com a IA.

Frontend

HTML, CSS, JavaScript Puro

Escolha intencional para demonstrar controle total da comunicação, leveza do código e ausência de dependências de frameworks.

Backend

Supabase (PostgreSQL)

Utilizado para isolamento da chave de IA e persistência de dados. O Edge Function (Deno Runtime) minimiza a latência da chamada à API do Gemini e atua como uma camada de proxy segura.

Inteligência Artificial

Google Gemini API (gemini-2.5-flash-preview-09-2025)

Modelo de alta performance, ideal para tarefas de geração e extração de dados estruturados em JSON.

2. Fluxo da Requisição

Frontend (UI): Captura os inputs do usuário e envia uma requisição POST para a Edge Function gerar-plano.

Edge Function (Deno/Supabase):

Acessa a GEMINI_API_KEY com segurança (via Secrets do Supabase).

Constrói o prompt com instruções de Resposta Estruturada em JSON.

Chama a API do Gemini, recebendo o plano de aula em formato JSON.

Insere o plano de aula completo na tabela planos_aula no PostgreSQL.

Retorna o payload JSON do plano para o Frontend.

Frontend (UI): Recebe o JSON e exibe o resultado formatado em um componente de Acordeão (Accordion) para melhor usabilidade.

# Decisões Técnicas Chave

Esta seção destaca as decisões tomadas para atender aos requisitos do teste (segurança, modelagem e integração):

# Segurança e Edge Functions

Isolamento de Chave: A GEMINI_API_KEY é armazenada com segurança como um Secret no Supabase. O Frontend nunca tem acesso direto à chave, garantindo a segurança do endpoint.

Edge Function (--no-verify-jwt): O deploy foi realizado com a flag --no-verify-jwt para permitir que o Frontend (que não utiliza autenticação de usuário final) possa chamar a função publicamente, cumprindo o requisito de uma aplicação aberta.


 3Modelagem e Persistência de Dados

Tabela planos_aula: Criada para persistir os resultados, contendo os campos de input e os campos de saída da IA.

SQL Scripts: O arquivo supabase_schema.sql contém a definição da tabela e suas políticas de segurança.

Nota sobre Exportação: Devido a um problema de ambiente local (supabase db dump falhou por falta de link/referência do projeto), o schema foi criado manualmente no repositório para garantir a comprovação da modelagem de dados e das políticas de RLS.

# Escolha do Modelo de IA

Modelo: gemini-2.5-flash-preview-09-2025

Justificativa: É o modelo mais adequado para esta tarefa pois:

Velocidade (Flash): Essencial para uma aplicação web, pois a latência é baixa e a resposta é quase imediata.

JSON Schema: Possui excelente desempenho na aderência a schemas JSON definidos, garantindo que o plano de aula seja entregue em um formato previsível, facilitando o parsing e a exibição no Frontend.

# Configuração e Execução

Pré-requisitos

Node.js e Supabase CLI instalados.

1. Configuração de Secrets

A chave da API do Gemini deve ser configurada no projeto Supabase (Substitua SUA_CHAVE_COMPLETA_DO_GEMINI_AQUI):

supabase secrets set GEMINI_API_KEY=SUA_CHAVE_COMPLETA_DO_GEMINI_AQUI


2. Deploy da Edge Function

É crucial implantar a função sem a verificação padrão de JWT para permitir requisições anônimas do Frontend:

supabase functions deploy gerar-plano --no-verify-jwt


3. Execução do Frontend

Abra o arquivo index.html utilizando um servidor local (ex: Extensão Live Server do VS Code) para evitar problemas de CORS e teste a aplicação.

- Exemplo se estiver usando Live Server (o mais comum)
- Clique com o botão direito em index.html e selecione "Open with Live Server"
