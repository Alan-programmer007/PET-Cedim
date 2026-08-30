import { useState } from "react";
import { Download } from "lucide-react";

export default function Registros() {
  const [registros, setRegistros] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("registros");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [popup, setPopup] = useState(null);

  const handleOpenPopup = (registro) => {
    setPopup(registro);
  };

  const handleClosePopup = () => {
    setPopup(null);
  };

  const handleDownload = (registro) => {
    const blob = new Blob([
      `Nome: ${registro.nome}\nData de Emissão: ${registro.dataEmissao}\nID: ${registro.id}\nResumo: ${registro.resumo}`
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anamnese-${registro.nome}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Registros de Anamneses</h1>
      <div className="flex flex-col gap-8">
        {registros.map((registro, idx) => (
          <div key={idx} className="border-2 p-6 flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">NOME: {registro.nome}</div>
              <div>DATA DE EMISSÃO: {registro.dataEmissao}</div>
              <div>ID: {registro.id}</div>
            </div>
            <button onClick={() => handleOpenPopup(registro)}>
              <Download className="h-6 w-6" />
            </button>
          </div>
        ))}
      </div>
      {popup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Resumo da Anamnese</h2>
            <div className="mb-4">
              <div><b>Nome:</b> {popup.nome}</div>
              <div><b>Data de Emissão:</b> {popup.dataEmissao}</div>
              <div><b>ID:</b> {popup.id}</div>
              <div><b>Resumo:</b> {popup.resumo}</div>
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded mr-2" onClick={() => handleDownload(popup)}>
              Baixar Formulário
            </button>
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={handleClosePopup}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
