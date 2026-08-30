"use client"
import { useEffect, useState, useRef } from "react";
import { Download, FileText, X, Trash2 } from "lucide-react";
import domtoimage from 'dom-to-image';
import { Header } from "@/components/header";

export default function RegistrosPage() {
  const [registros, setRegistros] = useState([]);
  const [popup, setPopup] = useState(null);
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
      }
    };
    fetchRegistros();
  }, []);

  const handleDeleteRegistro = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        const response = await fetch(`/api/anamneses?id=${id}`, { method: 'DELETE' });
        if (response.ok) {
          setRegistros(registros.filter(r => r.id !== id));
        } else {
          alert('Erro ao excluir o registro.');
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  const handleOpenPopup = (registro) => {
    setPopup(registro);
  };
  const handleClosePopup = () => {
    setPopup(null);
  };

  const formatFormDataAsHtml = (data) => {
    const formatValue = (value) => {
      if (value === 'sim') return 'Sim';
      if (value === 'nao' || value === 'não') return 'Não';
      if (value === 'mamaDireita') return 'Mama Direita';
      if (value === 'mamaEsquerda') return 'Mama Esquerda';
      if (value === 'ambas') return 'Ambas';
      if (value === 'historico') return 'Histórico Familiar';
      if (value === 'mamoplastia') return 'Mamoplastia';
      if (value === 'protese') return 'Prótese Mamária';
      if (value === 'nodulos') return 'Nódulos';
      if (value === 'cancer') return 'Câncer';
      return value || 'Não Informado';
    };
    const formatField = (label, value) => {
      let formattedValue = formatValue(value);
      if (label.includes('Data de Nascimento') || label.includes('Data do Exame') || label.includes('DUM')) {
        if (value) {
          const [year, month, day] = value.split('-');
          formattedValue = `${day}/${month}/${year}`;
        } else {
          formattedValue = 'Não Informado';
        }
      }
      return `<p style='margin-left: 20px; margin-bottom: 2px;'>• <strong>${label}:</strong> ${formattedValue}</p>`;
    };
    const formatCheckboxes = (label, obj) => {
      const checkedItems = Object.entries(obj || {})
        .filter(([, isChecked]) => isChecked)
        .map(([key]) => formatValue(key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')));
      return `<p style='margin-left: 20px; margin-bottom: 2px;'>• <strong>${label}:</strong> ${checkedItems.length > 0 ? checkedItems.join(', ') : 'Nenhum'}</p>`;
    };
    let html = `<div style='padding: 20px; background: white; color: black; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;'>`;
    html += `<h2 style='text-align: center; font-size: 18px; margin-bottom: 5px;'>RELATÓRIO DE ANAMNESE - CEDIM</h2>`;
    html += `<p style='text-align: center; font-size: 12px; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;'>Data de Geração: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>`;
    html += `<h3 style='font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;'>[1. DADOS DE IDENTIFICAÇÃO]</h3>`;
    html += formatField("Nome", data.nome);
    html += formatField("Telefone", data.telefone);
    html += formatField("Cidade", data.cidade);
    html += formatField("Data de Nascimento", data.dataNascimento);
    html += formatField("Motivo do Exame", data.motivo);
    html += formatField("Data do Exame", data.exame);
    html += formatField("ID do Paciente", data.idExamesAnteriores);
    html += `<h3 style='font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;'>[2. HISTÓRICO MAMÁRIO]</h3>`;
    html += formatField("Realizou Exames anteriores", data.aproveitarExames);
    html += formatField("Já fez Mamografia ou US antes", data.jaFezMamo);
    html += `<h4 style='font-size: 13px; margin-top: 10px; margin-bottom: 5px; margin-left: 10px;'>SINTOMAS</h4>`;
    html += formatCheckboxes("Sintomas Apresentados", data.sintomas);
    html += formatField("Cor da Secreção", data.corSecrecao);
    html += formatField("Secreção Sai Espontânea?", data.especifiqueSintomas);
    html += formatCheckboxes("Já fez Cirurgia das Mamas", data.jaFezCirurgia);
    html += `<h4 style='font-size: 13px; margin-top: 10px; margin-bottom: 5px; margin-left: 10px;'>HISTÓRICO DE CÂNCER</h4>`;
    html += formatField("Diagnóstico de Câncer Pessoal", data.cancer);
    html += formatField("Localização do Câncer", data.especificarCancer);
    html += formatField("História da Doença Mamária (Descrição)", data.historiaDoenca);
    html += `<h3 style='font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;'>[3. HISTÓRIA REPRODUTIVA]</h3>`;
    html += formatField("Número de Gestações", data.numeroGestacoes);
    html += formatField("Número de Partos", data.numeroPartos);
    html += formatField("Número de Abortos", data.numeroAbortos);
    html += formatCheckboxes("Amamentou", { amamentou: data.historiaReprodutiva?.aumento });
    html += formatCheckboxes("Menopausa", { menopausa: data.historiaReprodutiva?.menopausa });
    html += formatCheckboxes("Hormônio", { hormonio: data.historiaReprodutiva?.hormonio });
    html += formatField("DUM", data.dum);
    html += formatField("Tempo de Menopausa", data.tempoMenopausa);
    html += formatField("Tempo com Hormônio", data.tempoHormonio);
    html += `<h3 style='font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;'>[4. HISTÓRICO FAMILIAR E HÁBITOS]</h3>`;
    html += formatField("Alguém com câncer de mama na família", data.alguemComCancer);
    html += formatField("Especificar Parentesco (Câncer)", data.parentescoCancer);
    html += formatCheckboxes("Hábitos", data.habitos);
    html += `</div>`;
    return html;
  };

  const handleDownload = (registro) => {
    if (registro.imagem) {
      const a = document.createElement('a');
      a.href = registro.imagem;
      a.download = `anamnese-${registro.nome || "paciente"}-${new Date().toISOString().split("T")[0]}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Nenhuma imagem disponível para este registro.");
    }
  };

  const exportToExcel = () => {
    if (registros.length === 0) {
      alert("Não há registros para exportar.");
      return;
    }
    
    // Create CSV headers
    const headers = [
      "ID do Sistema", "Nome", "Data de Emissão", "Cidade", "Motivo", "Telefone", "ID Paciente"
    ].join(";");
    
    // Create CSV rows
    const rows = registros.map(r => {
      return [
        r.id || "",
        r.nome || "",
        r.dataEmissao || "",
        r.cidade || "",
        r.motivo || "",
        r.telefone || "",
        r.idExamesAnteriores || ""
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";");
    });
    
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `registros_anamneses_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full bg-primary-foreground min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 w-full">
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 md:mb-0">
              Registros de Anamneses
            </h1>
            <button 
              onClick={exportToExcel}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-5 h-5" /> Download
            </button>
          </div>
            <div className="w-full flex flex-col gap-8 items-center">
              {registros.length === 0 && <p className="text-gray-500">Nenhum registro encontrado.</p>}
              {registros.map((registro, idx) => (
                <div key={idx} className="border-2 p-6 flex justify-between items-center bg-white w-full max-w-3xl rounded-xl shadow-sm">
                  <div>
                    <div className="font-bold text-lg">NOME: {registro.nome}</div>
                    {registro.dataEmissao && <div>DATA DE EMISSÃO: {registro.dataEmissao}</div>}
                    {registro.cidade && <div>CIDADE: {registro.cidade}</div>}
                    {registro.idExamesAnteriores ? <div>ID: {registro.idExamesAnteriores}</div> : <div>ID: Não informado</div>}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => handleDeleteRegistro(registro.id)} title="Excluir" className="transition-colors hover:bg-gray-100 rounded p-1">
                      <Trash2 className="h-6 w-6 transition-colors hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {popup && (
              <div className="fixed inset-0 bg-[rgba(0,0,0,0.08)] flex items-center justify-center z-50 animate-fadeIn">
                <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full relative animate-popup">
                  <button onClick={handleClosePopup} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors" title="Fechar">
                    <X className="h-6 w-6" />
                  </button>
                  <h2 className="text-xl font-bold mb-4">Resumo da Anamnese</h2>
                  <div className="mb-4">
                    {popup.nome && <div><b>Nome:</b> {popup.nome}</div>}
                    {popup.dataEmissao && <div><b>Data de Emissão:</b> {popup.dataEmissao}</div>}
                    {popup.idExamesAnteriores ? <div><b>ID:</b> {popup.idExamesAnteriores}</div> : <div><b>ID:</b> Não informado</div>}
                    <div><b>Resumo:</b> {gerarResumoDetalhado(popup)}</div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button disabled className="bg-blue-200 text-white px-4 py-2 cursor-not-allowed" style={{borderRadius:0}}>Visualizar Completa</button>
                    <button disabled className="bg-green-200 text-white px-4 py-2 cursor-not-allowed" style={{borderRadius:0}}>Baixar Formulário</button>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>
    </main>
  );

  function gerarResumoDetalhado(registro) {
    if (!registro) return "Não informado";
    const motivo = registro.motivo ? registro.motivo : "Não informado";
    const cidade = registro.cidade ? registro.cidade : "Não informado";
    const sintomas = registro.sintomas ? Object.entries(registro.sintomas).filter(([,v])=>v).map(([k])=>k).join(', ') : "";
    const sintomasTxt = sintomas ? sintomas : "Não";
    const cirurgias = registro.jaFezCirurgia ? Object.entries(registro.jaFezCirurgia).filter(([,v])=>v).map(([k])=>k).join(', ') : "";
    const cirurgiasTxt = cirurgias ? cirurgias : "Não";
    const cancer = registro.especificarCancer ? registro.especificarCancer : "Não";
    return `Cidade: ${cidade} | Motivo: ${motivo} | Sintomas: ${sintomasTxt} | Cirurgias: ${cirurgiasTxt} | Câncer: ${cancer}`;
  }
}
