import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0?target=deno";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const GL_BASE = 'https://generativelanguage.googleapis.com/v1';
const LIST_MODELS_URL = `${GL_BASE}/models`;

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
}

function safeJsonParse<T = any>(text: string | null | undefined): T | null {
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

async function listModelsWithFallback() {
  let res = await fetch(LIST_MODELS_URL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${GEMINI_API_KEY}` },
  });
  let text = await res.text();
  
  if (res.status === 401 || res.status === 403) {
    res = await fetch(`${LIST_MODELS_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, { method: 'GET' });
    text = await res.text();
  }
  return { res, text };
}

async function callGenerateWithFallback(url: string, bodyPayload: any) {
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GEMINI_API_KEY}` },
    body: JSON.stringify(bodyPayload),
  });
  let text = await res.text();

  if (res.status === 401 || res.status === 403) {
    const urlWithKey = url.includes('?') ? `${url}&key=${encodeURIComponent(GEMINI_API_KEY)}` : `${url}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    res = await fetch(urlWithKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });
    text = await res.text();
  }
  return { res, text };
}


async function handleMock(req: Request, serie: string, materia: string, tema: string) {
    const mockPlano = {
        introducao_ludica: "Mock: Atividade inicial de prova de conceito.",
        objetivo_bncc: "Mock: Objetivo BNCC para comprovar persistência.",
        passo_a_passo: "Mock: Passos simples da atividade.",
        rubrica_avaliacao: "Mock: Rubrica de avaliação simples."
    };

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Variáveis Supabase para MOCK não configuradas.' }), { status: 500, headers: getCorsHeaders(req) });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error: dbError } = await supabase.from('planos_aula').insert({
        serie_input: serie,
        materia_input: materia,
        tema_input: tema,
        ...mockPlano
    }).select();

    if (dbError) {
        console.error('Erro no insert supabase (MOCK):', dbError);
        return new Response(JSON.stringify({ error: `Mock falhou ao salvar no DB: ${dbError.message}` }), { status: 500, headers: getCorsHeaders(req) });
    }

    return new Response(JSON.stringify({ plano: data?.[0] ?? mockPlano }), { status: 200, headers: getCorsHeaders(req) });
}
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY não configurada.' }), { status: 401, headers: getCorsHeaders(req) });
    }

    const payloadText = await req.text();
    const body = safeJsonParse<any>(payloadText);

    if (!body || !payloadText || payloadText.trim() === '') {
      return new Response(JSON.stringify({ error: 'JSON inválido ou corpo vazio.' }), { status: 400, headers: getCorsHeaders(req) });
    }
    const { serie, materia, tema } = body;
    if (!serie || !materia || !tema) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios ausentes: serie, materia, tema.' }), { status: 400, headers: getCorsHeaders(req) });
    }

    if (serie.toUpperCase().trim() === 'MOCK_TESTE') {
        return await handleMock(req, serie, materia, tema);
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Variáveis do Supabase (URL/KEY) não configuradas.' }), { status: 500, headers: getCorsHeaders(req) });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { res: listResp, text: listText } = await listModelsWithFallback();
    console.log('ListModels status:', listResp.status);

    if (!listResp.ok) {
      return new Response(JSON.stringify({ error: `Falha em ListModels (${listResp.status})`, details: listText }), { status: 502, headers: getCorsHeaders(req) });
    }

    const listJson = safeJsonParse<any>(listText);
    const models = Array.isArray(listJson?.models) ? listJson.models : [];

    const chosen = models.find((m: any) => {
      const methods = m?.supportedGenerationMethods ?? m?.supportedMethods ?? [];
      return Array.isArray(methods) && methods.includes('generateContent'); 
    });

    if (!chosen) {
      return new Response(JSON.stringify({ error: 'Nenhum modelo compatível encontrado para generateContent.' }), { status: 502, headers: getCorsHeaders(req) });
    }

    const modelName = chosen.name;
    const generateUrl = `${GL_BASE}/${modelName}:generateContent`;

    const prompt = `Gere um plano de aula completo. A saída deve ser **APENAS** o objeto JSON, sem nenhum texto introdutório ou final. Use o formato JSON exato com as seguintes chaves:
    { "introducao_ludica": "...", "objetivo_bncc": "...", "passo_a_passo": "...", "rubrica_avaliacao": "..." }
    Forneça conteúdo adequado para: Tema: ${tema}, Matéria: ${materia}, Série: ${serie}.`;

      const bodyPayload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

    const { res: geminiResp, text: geminiText } = await callGenerateWithFallback(generateUrl, bodyPayload);
    console.log('Resposta Gemini status:', geminiResp.status);

    if (!geminiResp.ok) {
      return new Response(JSON.stringify({ error: `Gemini error: ${geminiResp.status}`, details: geminiText }), { status: 502, headers: getCorsHeaders(req) });
    }

    const geminiJson = safeJsonParse<any>(geminiText);
    let candidateText: string | null = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!candidateText) {
      return new Response(JSON.stringify({ error: 'Não foi possível extrair texto gerado pelo modelo.', modelResponse: geminiJson }), { status: 502, headers: getCorsHeaders(req) });
    }

    const fenceMatch = candidateText.match(/```(?:json)?\n?([\s\S]*?)\n?```$/i);
    let rawText = fenceMatch ? fenceMatch[1].trim() : candidateText.trim();

    let planoGerado: any = safeJsonParse<any>(rawText);
    if (!planoGerado) {
      return new Response(JSON.stringify({ error: 'Texto do modelo não é JSON válido.', raw: candidateText }), { status: 502, headers: getCorsHeaders(req) });
    }

    const { data, error } = await supabase.from('planos_aula').insert({
      serie_input: serie,
      materia_input: materia,
      tema_input: tema,
      introducao_ludica: planoGerado.introducao_ludica ?? null,
      objetivo_bncc: planoGerado.objetivo_bncc ?? null,
      passo_a_passo: planoGerado.passo_a_passo ?? null,
      rubrica_avaliacao: planoGerado.rubrica_avaliacao ?? null,
    }).select();

    if (error) {
      console.error('Erro no insert Supabase:', error);
      return new Response(JSON.stringify({ error: String(error.message || error) }), { status: 500, headers: getCorsHeaders(req) });
    }

    return new Response(JSON.stringify({ plano: data?.[0] ?? planoGerado }), { status: 200, headers: getCorsHeaders(req) });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: String(error?.message || error) }), { status: 500, headers: getCorsHeaders(req) });
  }
});