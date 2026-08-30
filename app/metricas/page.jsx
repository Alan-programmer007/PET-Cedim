"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Download } from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function MetricasPage() {
  const [registros, setRegistros] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const response = await fetch('/api/anamneses');
        if (response.ok) {
          const data = await response.json();
          setRegistros(data);
        }
      } catch (error) {
        console.error("Erro ao buscar registros:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistros();
  }, []);

  const exportToExcel = () => {
    if (registros.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    
    // Create CSV headers for metrics data
    const headers = [
      "ID do Sistema", "Nome", "Data de Emissão", "Idade", "Cidade", "Motivo", "Sexo"
    ].join(";");
    
    // Create CSV rows
    const rows = registros.map(r => {
      let idadeCalculada = "";
      if (r.dataNascimento) {
        const nasc = new Date(r.dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
          idade--;
        }
        idadeCalculada = idade;
      }

      return [
        r.id || "",
        r.nome || "",
        r.dataEmissao || "",
        idadeCalculada,
        r.cidade || "",
        r.motivo || "",
        r.sexo || ""
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";");
    });
    
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `metricas_cedim_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cidades = {};
  const casos = {};
  const idades = {};
  const sexos = { Masculino: 0, Feminino: 0, Outro: 0 };

  registros.forEach((r) => {
    if (r.cidade) cidades[r.cidade] = (cidades[r.cidade] || 0) + 1;
    if (r.motivo) casos[r.motivo] = (casos[r.motivo] || 0) + 1;
    
    if (r.dataNascimento) {
      const nasc = new Date(r.dataNascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
      }
      idades[idade] = (idades[idade] || 0) + 1;
    }
    
    if (r.sexo) {
      if (sexos[r.sexo]) sexos[r.sexo]++;
      else sexos.Outro++;
    }
  });

  const cidadeData = {
    labels: Object.keys(cidades),
    datasets: [{
      label: "Registros por Cidade",
      data: Object.values(cidades),
      backgroundColor: "rgba(34, 197, 94, 0.8)",
      borderRadius: 6,
    }]
  };

  const casoData = {
    labels: Object.keys(casos),
    datasets: [{
      label: "Casos Clínicos",
      data: Object.values(casos),
      backgroundColor: ["#2563eb", "#f59e42", "#f472b6", "#60a5fa", "#a3e635", "#22c55e", "#f43f5e"],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const idadeData = {
    labels: Object.keys(idades),
    datasets: [{
      label: "Idades",
      data: Object.values(idades),
      backgroundColor: "rgba(245, 158, 66, 0.8)",
      borderRadius: 6,
    }]
  };

  const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const visitasPorMes = Array(12).fill(0);
  const anosDisponiveis = new Set();
  
  registros.forEach((r) => {
    if (r.dataEmissao) {
      const parts = r.dataEmissao.split("/");
      if (parts.length === 3) {
        const [dia, mes, ano] = parts;
        anosDisponiveis.add(ano);
        if (ano === anoSelecionado) {
          const idx = parseInt(mes, 10) - 1;
          if (idx >= 0 && idx < 12) visitasPorMes[idx]++;
        }
      }
    }
  });

  const visitasData = {
    labels: mesesNomes,
    datasets: [{
      label: `Visitas em ${anoSelecionado}`,
      data: visitasPorMes,
      borderColor: "#2563eb",
      backgroundColor: "rgba(37,99,235,0.1)",
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: "#2563eb"
    }]
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full bg-slate-50 min-h-screen font-sans">
        <Header />
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 w-full">
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 md:mb-0">
              Métricas do Sistema
            </h1>
            <button 
              onClick={exportToExcel}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-5 h-5" /> Download
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-96">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Registros por Cidade
                  </h2>
                  <div className="flex-1 w-full relative">
                    <Bar data={cidadeData} options={{maintainAspectRatio: false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, grid:{color:'rgba(0,0,0,0.05)'}}, x:{grid:{display:false}}}}} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-96">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Casos Clínicos
                  </h2>
                  <div className="flex-1 w-full relative flex justify-center pb-4">
                    <Doughnut data={casoData} options={{maintainAspectRatio: false, plugins:{legend:{position:'bottom', labels:{padding:20, usePointStyle:true}}}}} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-96">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-orange-400 mr-2"></span> Distribuição de Idades
                  </h2>
                  <div className="flex-1 w-full relative">
                    <Bar data={idadeData} options={{maintainAspectRatio: false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, grid:{color:'rgba(0,0,0,0.05)'}}, x:{grid:{display:false}}}}} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span> Evolução de Visitas
                  </h2>
                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <label htmlFor="ano-select" className="text-sm font-medium text-slate-600">Ano:</label>
                    <select id="ano-select" value={anoSelecionado} onChange={e => setAnoSelecionado(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                      {[...anosDisponiveis].sort().map(ano => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                      {anosDisponiveis.size === 0 && <option value={anoSelecionado}>{anoSelecionado}</option>}
                    </select>
                  </div>
                </div>
                <div className="w-full h-80 relative">
                  <Line data={visitasData} options={{maintainAspectRatio: false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, grid:{color:'rgba(0,0,0,0.05)'}}, x:{grid:{display:false}}}}} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </main>
  );
}
