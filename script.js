const SUPABASE_URL = "https://yxzpzfvcyiymhknwpqko.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4enB6ZnZjeWl5bWhrbndwcWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODg0ODMsImV4cCI6MjA3NjI2NDQ4M30.02Fde_rGkZh2GuADPsfVq9YI4OpJt2IbsrzlAvzlvQg"; 
const FUNCTION_URL = "https://yxzpzfvcyiymhknwpqko.supabase.co/functions/v1/gerar-plano";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById("plan-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const serie = document.getElementById("serie").value.trim();
  const materia = document.getElementById("materia").value.trim();
  const tema = document.getElementById("tema").value.trim();

  const loading = document.getElementById("loading");
  const errorMessage = document.getElementById("error-message");
  const resultadoDiv = document.getElementById("plano-resultado");

  loading.style.display = "block";
  errorMessage.textContent = "";
  resultadoDiv.style.display = "none";

  try {
    console.log("Enviando dados para Supabase Function:", { serie, materia, tema });

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
       },
      body: JSON.stringify({
      serie: serie,
      materia: materia,
      tema: tema,
    }),

    });

    if (!response.ok) {
      throw new Error(`Erro na requisição (${response.status})`);
    }

    const data = await response.json();
    console.log("Resposta da função:", data);

    if (data && data.plano) {
      document.getElementById("introducao").textContent = data.plano.introducao_ludica || "—";
      document.getElementById("objetivo").textContent = data.plano.objetivo_bncc || "—";
      document.getElementById("passo").textContent = formatarPassos(data.plano.passo_a_passo);
      document.getElementById("rubrica").textContent = formatarRubrica(data.plano.rubrica_avaliacao);

      resultadoDiv.style.display = "block";
    } else {
      errorMessage.textContent = "Erro: resposta inesperada da API.";
    }
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    errorMessage.textContent = `Erro ao gerar plano: ${error.message}`;
  } finally {
    loading.style.display = "none";
  }
});

function formatarPassos(passoJSON) {
  try {
    const passos = JSON.parse(passoJSON);
    return passos
      .map((p) => `${p.etapa}\n${p.descricao}\n`)
      .join("\n-----------------------------\n");
  } catch (e) {
    return passoJSON; 
  }
}
function formatarRubrica(rubricaJSON) {
  try {
    const rubrica = JSON.parse(rubricaJSON);
    return Object.entries(rubrica)
      .map(([criterio, niveis]) => {
        return `📘 ${criterio}\n${Object.entries(niveis)
          .map(([nivel, descricao]) => `  - ${nivel}: ${descricao}`)
          .join("\n")}`;
      })
      .join("\n\n");
  } catch (e) {
    return rubricaJSON;
  }
}
