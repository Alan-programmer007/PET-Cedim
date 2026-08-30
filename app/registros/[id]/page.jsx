"use client"
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { useEffect, useState } from "react";

export default function RegistroCompletoPage() {
  const { id } = useParams();
  const [registro, setRegistro] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("registros");
      if (saved) {
        const registros = JSON.parse(saved);
        const found = registros.find(r => r.id === id);
        setRegistro(found);
      }
    }
  }, [id]);

  return (
    <div className="w-full bg-primary-foreground min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-10 flex flex-col items-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-10 text-center">Anamnese Completa</h1>
        {registro ? (
          <div className="bg-white p-8 rounded shadow-lg max-w-xl w-full flex flex-col items-center">
            <div className="mb-4 w-full">
              <div><b>Nome:</b> {registro.nome}</div>
              <div><b>Data de Emissão:</b> {registro.dataEmissao}</div>
              <div><b>ID:</b> {registro.id}</div>
              <div><b>Resumo:</b> {registro.resumo}</div>
            </div>
            {registro.fotoUrl ? (
              <img src={registro.fotoUrl} alt="Foto da Anamnese" className="max-w-full max-h-96 rounded border mb-4" />
            ) : (
              <div className="text-gray-500">Nenhuma foto disponível.</div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">Registro não encontrado.</div>
        )}
      </main>
    </div>
  );
}
