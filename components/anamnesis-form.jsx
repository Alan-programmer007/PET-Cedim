"use client"

import { useState, useRef } from "react"
import domtoimage from 'dom-to-image';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Save, Download, SearchIcon } from "lucide-react"
import { Header } from "./header"
import BreastMarkingCanvas from "./breast-marking-canvas"

export function AnamnesisForm() {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cidade: "",
    dataNascimento: "",
    motivo: "",
    exame: "",
    jaFezMamo: "",
    aproveitarExames: "",
    idExamesAnteriores: "",
    sintomas: {
      dor: false,
      massa: false,
      secrecao: false,
    },
    corSecrecao: "",
    especifiqueSintomas: "",
    jaFezCirurgia: {
      mamoplastia: false,
      protese: false,
      nodulos: false,
      cancer: false,
    },
    tempoCirurgia: {
      mamoplastia: "",
      protese: "",
      nodulos: "",
      cancer: "",
    },
    cancer: "",
    especificarCancer: "",
    historiaDoenca: "",
    numeroGestacoes: "",
    numeroPartos: "",
    numeroAbortos: "",
    dum: "",
    historiaReprodutiva: {
      amamentou: false,
      menopausa: false,
      hormonio: false,
    },
    tempoMenopausa: "",
    tempoHormonio: "",
    alguemComCancer: "",
    parentescoCancer: "",
    habitos: {
      fuma: false,
      bebe: false,
      atividadeEsportiva: false,
      alimentacaoSaudavel: false,
      autoExame: false,
    },
    indicada: '',
    exameFisicoA: { massa: '', alteracaoPele: '', alteracaoMamilo: '', alteracaoMamiloDetalhe: '' },
    exameFisicoB: { massa: '', alteracaoPele: '', alteracaoMamilo: '', alteracaoMamiloDetalhe: '' },
  })

  const breastCanvasARef = useRef(null);
  const breastCanvasBRef = useRef(null);

  async function captureBreastCanvasImages(target) {
    try {
      if (breastCanvasARef.current && typeof breastCanvasARef.current.getDataUrl === 'function') {
        const aImg = breastCanvasARef.current.getDataUrl();
        if (aImg) target.imagemMamaA = aImg;
      }
      if (breastCanvasBRef.current && typeof breastCanvasBRef.current.getDataUrl === 'function') {
        const bImg = breastCanvasBRef.current.getDataUrl();
        if (bImg) target.imagemMamaB = bImg;
      }
    } catch (err) {
      console.warn('Erro ao capturar imagem dos canvases das mamas:', err);
    }
  }

  async function generateJpegDataUrlFromHtml(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    const node = wrapper.firstElementChild;
    if (!node) throw new Error('Relatório vazio.');

    const initialScrollY = window.scrollY;

    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '0';
    host.style.top = '0';
    host.style.width = '800px';
    host.style.background = 'white';
    host.style.zIndex = '9999';
    host.style.opacity = '1';
    host.style.pointerEvents = 'none';
    host.appendChild(node);
    document.body.appendChild(host);

    try {
      const imgs = host.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(async (img) => {
        try {
          if (typeof img.decode === 'function') {
            await img.decode();
          } else if (!img.complete) {
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }
        } catch {
        }
      }));

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const dataUrl = await domtoimage.toJpeg(host, {
        quality: 0.95,
        bgcolor: 'white',
        cacheBust: true,
      });
      return dataUrl;
    } finally {
      document.body.removeChild(host);
      window.scrollTo(0, initialScrollY);
    }
  }

  async function generateJpegFromHtml(html, filenameBase) {
    const dataUrl = await generateJpegDataUrlFromHtml(html);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filenameBase}-${new Date().toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const formatFormDataAsHtml = (data) => {
    const formatValue = (value) => {
        if (value === 'sim') return 'Sim';
        if (value === 'nao' || value === 'não') return 'Não';
        if (value === 'paciente') return 'Paciente';
        if (value === 'medico') return 'Médico';
        if (value === 'tecnico') return 'Técnico';
        if (value === 'mamaDireita') return 'Mama Direita';
        if (value === 'mamaEsquerda') return 'Mama Esquerda';
        if (value === 'ambas') return 'Ambas';
        if (value === 'historico') return 'Histórico Familiar';
        if (value === 'mamoplastia') return 'Mamoplastia';
        if (value === 'protese') return 'Prótese Mamária';
        if (value === 'nodulos') return 'Nódulos';
        if (value === 'cancer') return 'Câncer';
        if (value === 'coracao') return 'Coloração vermelha';
        if (value === 'verruga') return 'Verruga ou sinais';
        if (value === 'outros') return 'Outros';
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
      return `<p style="margin-left: 20px; margin-bottom: 2px;">• <strong>${label}:</strong> ${formattedValue}</p>`;
    };

    const formatCheckboxes = (label, obj) => {
        const checkedItems = Object.entries(obj)
            .filter(([, isChecked]) => isChecked)
            .map(([key]) => formatValue(key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')));
        return `<p style="margin-left: 20px; margin-bottom: 2px;">• <strong>${label}:</strong> ${checkedItems.length > 0 ? checkedItems.join(', ') : 'Nenhum'}</p>`;
    };


    let html = `<div style="padding: 20px; background: white; color: black; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">`;
    
    html += `<h2 style="text-align: center; font-size: 18px; margin-bottom: 5px;">RELATÓRIO DE ANAMNESE - CEDIM</h2>`;
    html += `<p style="text-align: center; font-size: 12px; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Data de Geração: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>`;
    
    html += `<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;">[1. DADOS DE IDENTIFICAÇÃO]</h3>`;
    html += formatField("Nome", data.nome);
    html += formatField("Telefone", data.telefone);
    html += formatField("Cidade", data.cidade);
    html += formatField("Data de Nascimento", data.dataNascimento);
    html += formatField("Motivo do Exame", data.motivo);
    html += formatField("Data do Exame", data.exame);
    html += formatField("ID do Paciente", data.idExamesAnteriores);

    html += `<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;">[2. HISTÓRICO MAMÁRIO]</h3>`;
    html += formatField("Realizou Exames anteriores", data.aproveitarExames);
    html += formatField("Já fez Mamografia ou US antes", data.jaFezMamo);

    html += `<h4 style="font-size: 13px; margin-top: 10px; margin-bottom: 5px; margin-left: 10px;">SINTOMAS</h4>`;
    html += formatCheckboxes("Sintomas Apresentados", data.sintomas);
    html += formatField("Cor da Secreção", data.corSecrecao);
    html += formatField("Secreção Sai Espontânea?", data.especifiqueSintomas);
    html += formatCheckboxes("Já fez Cirurgia das Mamas", data.jaFezCirurgia);

    html += `<h4 style="font-size: 13px; margin-top: 10px; margin-bottom: 5px; margin-left: 10px;">HISTÓRICO DE CÂNCER</h4>`;
    html += formatField("Diagnóstico de Câncer Pessoal", data.cancer);
    html += formatField("Localização do Câncer", data.especificarCancer);
    html += formatField("História da Doença Mamária (Descrição)", data.historiaDoenca);

    html += `<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;">[3. HISTÓRIA REPRODUTIVA]</h3>`;
    html += formatField("Número de Gestações", data.numeroGestacoes);
    html += formatField("Número de Partos", data.numeroPartos);
    html += formatField("Número de Abortos", data.numeroAbortos);
    html += formatField("Amamentou", data.historiaReprodutiva?.amamentou ? "Sim" : "Não");
    html += formatField("Menopausa", data.historiaReprodutiva?.menopausa ? "Sim" : "Não");
    html += formatField("Hormônio", data.historiaReprodutiva?.hormonio ? "Sim" : "Não");
    html += formatField("DUM", data.dum);
    html += formatField("Tempo de Menopausa", data.tempoMenopausa);
    html += formatField("Tempo com Hormônio", data.tempoHormonio);

    html += `<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;">[4. HISTÓRICO FAMILIAR E HÁBITOS]</h3>`;
    html += formatField("Alguém com câncer de mama na família", data.alguemComCancer);
    html += formatField("Especificar Parentesco (Câncer)", data.parentescoCancer);
    html += formatCheckboxes("Hábitos", data.habitos);

    html += `<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px; color: #333;">[5. EXAME FÍSICO]</h3>`;

    html += `<h4 style="font-size: 13px; margin-top: 10px; margin-bottom: 5px; margin-left: 10px;">Canvas A</h4>`;
    if (data.imagemMamaA) {
      html += `<div style="margin-left: 10px; margin-bottom: 8px;"><img src="${data.imagemMamaA}" style="width: 100%; max-width: 760px; border: 1px solid #ddd;" /></div>`;
    }
    html += formatField("Massa na mama?", data.exameFisicoA?.massa);
    html += formatField("Indicada", data.indicada);

    html += `<h4 style="font-size: 13px; margin-top: 10px; margin-bottom: 5px; margin-left: 10px;">Canvas B</h4>`;
    if (data.imagemMamaB) {
      html += `<div style="margin-left: 10px; margin-bottom: 8px;"><img src="${data.imagemMamaB}" style="width: 100%; max-width: 760px; border: 1px solid #ddd;" /></div>`;
    }

    const peleDetalhe = data.exameFisicoB?.alteracaoPele === 'outros'
      ? (data.exameFisicoB?.alteracaoPeleDetalhe ? ` (${data.exameFisicoB.alteracaoPeleDetalhe})` : ' (Não detalhado)')
      : '';
    const mamiloDetalhe = data.exameFisicoB?.alteracaoMamilo === 'outros'
      ? (data.exameFisicoB?.alteracaoMamiloDetalhe ? ` (${data.exameFisicoB.alteracaoMamiloDetalhe})` : ' (Não detalhado)')
      : '';

    html += formatField("Alteração na pele?", `${formatValue(data.exameFisicoB?.alteracaoPele)}${peleDetalhe}`);
    html += formatField("Alteração do mamilo", `${formatValue(data.exameFisicoB?.alteracaoMamilo)}${mamiloDetalhe}`);

    html += `<h4 style="font-size: 13px; margin-top: 10px; margin-bottom: 5px; margin-left: 10px;">Fatores de risco</h4>`;
    html += formatCheckboxes("Fatores de risco", data.habitos);
    
    html += `</div>`;

    return html;
  };

  const handleSave = async () => {
    const dataToSave = {
      ...formData,
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      id: Date.now().toString() + Math.floor(Math.random()*1000),
      resumo: `Motivo: ${formData.motivo}\nSintomas: ${Object.entries(formData.sintomas).filter(([,v])=>v).map(([k])=>k).join(', ') || 'Não'}\nCirurgias: ${Object.entries(formData.jaFezCirurgia).filter(([,v])=>v).map(([k])=>k).join(', ') || 'Não'}\nCâncer: ${formData.especificarCancer || 'Não'}`
    };
    
    try {
      await captureBreastCanvasImages(dataToSave);
      dataToSave.imagem = await generateJpegDataUrlFromHtml(formatFormDataAsHtml(dataToSave));
      
      const response = await fetch('/api/save-anamnese', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });
      
      if (response.ok) {
        alert("Dados salvos com sucesso! O registro e a imagem estão disponíveis na página de registros.");
      } else {
        const errorData = await response.json();
        alert(`Erro ao salvar os dados: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Ocorreu um erro ao salvar os dados.");
    }
  }

  const handleDownload = async () => {
    const dataToDownload = {
        ...formData,
        timestamp: new Date().toISOString(),
    };

    await captureBreastCanvasImages(dataToDownload);

    try {
      await generateJpegFromHtml(
      formatFormDataAsHtml(dataToDownload),
      `anamnese-${formData.nome || "paciente"}`
      );
    } catch (error) {
        console.error("Erro ao gerar a imagem:", error);
        alert("Erro ao gerar a imagem. Verifique o console para detalhes.");
    }
  }

  function scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div className="w-full">
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-10">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 md:mb-0">
            Sistema de Anamneses
          </h1>
          <div className="flex gap-4 w-full md:w-auto">
            <Button
              onClick={handleSave}
              variant="outline-primary-bold"
              className="text-base px-6 py-6 gap-2 w-1/2 md:w-auto justify-center"
            >
              <Save className="h-5 w-5" />
              SALVAR
            </Button>
            <Button
              onClick={handleDownload}
              variant="ghost"
              size="lg"
              className="border-2 border-transparent bg-secondary text-secondary-foreground text-base px-6 py-6 gap-2 hover:bg-primary hover:text-primary-foreground w-1/2 md:w-auto justify-center"
            >
              <Download className="h-5 w-5" />
              DOWNLOAD
            </Button>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <Label htmlFor="idExamesAnteriores" className="text-sm font-bold mb-2 block">
              ID
            </Label>
            <InputGroup className="border-2 border-border h-12 md:w-80">
              <InputGroupInput
                id="idExamesAnteriores"
                value={formData.idExamesAnteriores}
                onChange={(e) => setFormData({ ...formData, idExamesAnteriores: e.target.value })}
                className="text-base"
              />
              <InputGroupAddon align="inline-end">
                <SearchIcon className="h-5 w-5" />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div>
            <Label htmlFor="nome" className="text-sm font-bold mb-2 block">
              NOME
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="border-2 border-border text-base h-12"
            />
          </div>
          <div>
            <Label htmlFor="telefone" className="text-sm font-bold mb-2 block">
              TELEFONE
            </Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="border-2 border-border text-base h-12"
            />
          </div>
          <div>
            <Label htmlFor="cidade" className="text-sm font-bold mb-2 block">
              CIDADE
            </Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              className="border-2 border-border text-base h-12"
            />
          </div>
          <div>
            <Label htmlFor="dataNascimento" className="text-sm font-bold mb-2 block">
              DATA DE NASCIMENTO
            </Label>
            <Input
              id="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              className="border-2 border-border text-base h-12"
            />
          </div>
          <div>
            <Label htmlFor="motivo" className="text-sm font-bold mb-2 block">
              MOTIVO
            </Label>
            <Input
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="border-2 border-border text-base h-12"
            />
          </div>
          <div>
            <Label htmlFor="exame" className="text-sm font-bold mb-2 block">
              EXAME
            </Label>
            <Input
              id="exame"
              type="date"
              value={formData.exame}
              onChange={(e) => setFormData({ ...formData, exame: e.target.value })}
              className="border-2 border-border text-base h-12"
            />
          </div>
        </div>

        <div className="space-y-8 mb-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label htmlFor="aproveitarExames" className="text-sm font-bold mb-2 block">
                APROVEITAR EXAMES ANTERIORES
              </Label>
              <Select
                value={formData.aproveitarExames}
                onValueChange={(value) => setFormData({ ...formData, aproveitarExames: value })}
              >
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="jaFezMamo" className="text-sm font-bold mb-2 block">
                JÁ FEZ MAMO OU US ANTES
              </Label>
              <Select
                value={formData.jaFezMamo}
                onValueChange={(value) => setFormData({ ...formData, jaFezMamo: value })}
              >
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold mb-3 block">SINTOMAS:</Label>
            <div className="flex flex-wrap gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dor"
                  checked={formData.sintomas.dor}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sintomas: { ...formData.sintomas, dor: checked } })
                  }
                />
                <Label htmlFor="dor" className="text-base">
                  Dor
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="massa"
                  checked={formData.sintomas.massa}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sintomas: { ...formData.sintomas, massa: checked } })
                  }
                />
                <Label htmlFor="massa" className="text-base">
                  Massa
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="secrecao"
                  checked={formData.sintomas.secrecao}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sintomas: { ...formData.sintomas, secrecao: checked } })
                  }
                />
                <Label htmlFor="secrecao" className="text-base">
                  Secreção
                </Label>
              </div>
              
              {formData.sintomas.secrecao && (
                <div className="flex items-center">
                  <Select
                    value={formData.corSecrecao}
                    onValueChange={(value) => setFormData({ ...formData, corSecrecao: value })}
                  >
                    <SelectTrigger className="w-[150px] h-9 text-base">
                      <SelectValue placeholder="Selecionar cor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clara">Clara</SelectItem>
                      <SelectItem value="escura">Escura</SelectItem>
                      <SelectItem value="sangue">Sangue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {formData.sintomas.secrecao && (
              <Select
                value={formData.especifiqueSintomas}
                onValueChange={(value) => setFormData({ ...formData, especifiqueSintomas: value })}
              >
                <SelectTrigger className="w-full md:w-80 h-12 text-base">
                  <SelectValue placeholder="Sai esponânea?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">SIM</SelectItem>
                  <SelectItem value="não">NÃO</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label className="text-sm font-bold mb-2 block">
              JÁ FEZ CIRURGIA DAS MAMAS?
            </Label>
            <div className="flex flex-col gap-2">
              {[
                { key: "mamoplastia", label: "Mamoplastia" },
                { key: "protese", label: "Prótese Mamária" },
                { key: "nodulos", label: "Nódulos" },
                { key: "cancer", label: "Câncer" },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id={item.key}
                    checked={formData.jaFezCirurgia[item.key]}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        jaFezCirurgia: {
                          ...formData.jaFezCirurgia,
                          [item.key]: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor={item.key} className="text-base">
                    {item.label}
                  </Label>
                  {formData.jaFezCirurgia[item.key] && (
                    <Input
                      type="text"
                      placeholder="Há quanto tempo?"
                      className="ml-4 w-48 border-2 border-border text-base h-9"
                      value={formData.tempoCirurgia[item.key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tempoCirurgia: {
                            ...formData.tempoCirurgia,
                            [item.key]: e.target.value,
                          },
                        })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Campo de câncer agora depende do checkbox de cirurgia */}
          {formData.jaFezCirurgia.cancer && (
            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <Label htmlFor="especificarCancer" className="text-sm font-bold mb-2 block">
                  ESPECIFICAR LOCAL DO CÂNCER
                </Label>
                <Select
                  value={formData.especificarCancer}
                  onValueChange={(value) => setFormData({ ...formData, especificarCancer: value })}
                >
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mamaDireita">Mama Direita</SelectItem>
                    <SelectItem value="mamaEsquerda">Mama Esquerda</SelectItem>
                    <SelectItem value="ambas">Ambas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="historiaDoenca" className="text-sm font-bold mb-2 block">
              HISTÓRIA DA DOENÇA MAMÁRIA (INCLUINDO CIRURGIA OU BIOPSIA):
            </Label>
            <Textarea
              id="historiaDoenca"
              value={formData.historiaDoenca}
              onChange={(e) => setFormData({ ...formData, historiaDoenca: e.target.value })}
              className="min-h-[200px] border-2 border-border bg-muted/30 text-base"
              placeholder="Descreva o histórico da doença mamária..."
            />
          </div>
        </div>

        <div className="space-y-8 mb-10">
          <Label className="text-sm font-bold block">HISTÓRIA REPRODUTIVA:</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Label htmlFor="numeroGestacoes" className="text-sm font-bold mb-2 block">
                NÚMERO DE GESTAÇÕES
              </Label>
              <Input
                id="numeroGestacoes"
                type="number"
                value={formData.numeroGestacoes}
                onChange={(e) => setFormData({ ...formData, numeroGestacoes: e.target.value })}
                className="border-2 border-border text-center text-base h-12"
              />
            </div>
            <div>
              <Label htmlFor="numeroPartos" className="text-sm font-bold mb-2 block">
                NÚMERO DE PARTOS
              </Label>
              <Input
                id="numeroPartos"
                type="number"
                value={formData.numeroPartos}
                onChange={(e) => setFormData({ ...formData, numeroPartos: e.target.value })}
                className="border-2 border-border text-center text-base h-12"
              />
            </div>
            <div>
              <Label htmlFor="numeroAbortos" className="text-sm font-bold mb-2 block">
                NÚMERO DE ABORTOS
              </Label>
              <Input
                id="numeroAbortos"
                type="number"
                value={formData.numeroAbortos}
                onChange={(e) => setFormData({ ...formData, numeroAbortos: e.target.value })}
                className="border-2 border-border text-center text-base h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="amamentou"
                  checked={formData.historiaReprodutiva.amamentou}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      historiaReprodutiva: { ...formData.historiaReprodutiva, amamentou: checked },
                    })
                  }
                />
                <Label htmlFor="amamentou" className="text-base">
                  Amamentou
                </Label>
              </div>
              {formData.historiaReprodutiva.amamentou && (
                <>
                  <Label htmlFor="dum" className="text-sm font-bold block">
                    DUM
                  </Label>
                  <Input
                    id="dum"
                    type="date"
                    value={formData.dum}
                    onChange={(e) => setFormData({ ...formData, dum: e.target.value })}
                    className="border-2 border-border text-base h-12"
                  />
                </>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="menopausa"
                  checked={formData.historiaReprodutiva.menopausa}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      historiaReprodutiva: { ...formData.historiaReprodutiva, menopausa: checked },
                    })
                  }
                />
                <Label htmlFor="menopausa" className="text-base">
                  Menopausa
                </Label>
              </div>
              {formData.historiaReprodutiva.menopausa && (
                <>
                  <Label htmlFor="tempoMenopausa" className="text-sm font-bold block">
                    Tempo de menopausa
                  </Label>
                  <Input
                    id="tempoMenopausa"
                    value={formData.tempoMenopausa}
                    onChange={(e) => setFormData({ ...formData, tempoMenopausa: e.target.value })}
                    className="border-2 border-border text-base h-12"
                  />
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hormonio"
                  checked={formData.historiaReprodutiva.hormonio}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      historiaReprodutiva: { ...formData.historiaReprodutiva, hormonio: checked },
                    })
                  }
                />
                <Label htmlFor="hormonio" className="text-base">
                  Hormônio
                </Label>
              </div>
              {formData.historiaReprodutiva.hormonio && (
                <>
                  <Label htmlFor="tempoHormonio" className="text-sm font-bold block">
                    Tempo com hormônio
                  </Label>
                  <Input
                    id="tempoHormonio"
                    value={formData.tempoHormonio}
                    onChange={(e) => setFormData({ ...formData, tempoHormonio: e.target.value })}
                    className="border-2 border-border text-base h-12"
                  />
                </>
              )}
            </div>
            
          </div>
        </div>

        {/* Sessão História Familiar */}
        <div className="space-y-8 mb-10">
          <Label className="text-sm font-bold block">HISTÓRIA FAMILIAR:</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label htmlFor="alguemComCancer" className="text-sm font-bold mb-2 block">
                Alguém com câncer de mama na família?
              </Label>
              <Select
                value={formData.alguemComCancer}
                onValueChange={(value) => setFormData({ ...formData, alguemComCancer: value })}
              >
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.alguemComCancer === "sim" && (
              <div>
                <Label htmlFor="parentescoCancer" className="text-sm font-bold mb-2 block">
                  Parentesco
                </Label>
                <Input
                  id="parentescoCancer"
                  value={formData.parentescoCancer}
                  onChange={(e) => setFormData({ ...formData, parentescoCancer: e.target.value })}
                  className="border-2 border-border text-base h-12"
                />
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">EXAME FÍSICO</h2>
          {/* Indicada movido para Canvas A conforme solicitado pelo usuário */}

          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-semibold mb-2">Canvas A</h4>
              <BreastMarkingCanvas ref={breastCanvasARef} side="both" />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-bold mb-1 block">Massa na mama?</Label>
                  <Select
                    value={formData.exameFisicoA.massa}
                    onValueChange={(value) => setFormData({ ...formData, exameFisicoA: { ...formData.exameFisicoA, massa: value } })}
                  >
                    <SelectTrigger className="w-full h-10 text-base">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-bold mb-1 block">Indicada</Label>
                  <Select
                    value={formData.indicada}
                    onValueChange={(value) => setFormData({ ...formData, indicada: value })}
                  >
                    <SelectTrigger className="w-full h-10 text-base">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paciente">Paciente</SelectItem>
                      <SelectItem value="medico">Médico</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Canvas B</h4>
              <BreastMarkingCanvas ref={breastCanvasBRef} side="both" />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-bold mb-1 block">Alteração na pele?</Label>
                  <Select
                    value={formData.exameFisicoB.alteracaoPele}
                    onValueChange={(value) => setFormData({ ...formData, exameFisicoB: { ...formData.exameFisicoB, alteracaoPele: value } })}
                  >
                    <SelectTrigger className="w-full h-10 text-base">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coracao">Coloração vermelha</SelectItem>
                      <SelectItem value="verruga">Verruga ou sinais</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.exameFisicoB.alteracaoPele === 'outros' && (
                    <Input
                      placeholder="Descrever alteração na pele"
                      value={formData.exameFisicoB.alteracaoPeleDetalhe || ''}
                      onChange={(e) => setFormData({ ...formData, exameFisicoB: { ...formData.exameFisicoB, alteracaoPeleDetalhe: e.target.value } })}
                      className="mt-2 w-full border-2 border-border h-10"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-bold mb-1 block">Alteração do mamilo</Label>
                  <Select
                    value={formData.exameFisicoB.alteracaoMamilo}
                    onValueChange={(value) => setFormData({ ...formData, exameFisicoB: { ...formData.exameFisicoB, alteracaoMamilo: value } })}
                  >
                    <SelectTrigger className="w-full h-10 text-base">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retração">Retração</SelectItem>
                      <SelectItem value="espessamento">Espessamento</SelectItem>
                      <SelectItem value="erosao">Erosão</SelectItem>
                      <SelectItem value="coloracao">Coloração vermelha</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.exameFisicoB.alteracaoMamilo === 'outros' && (
                    <Input
                      placeholder="Descrever alteração do mamilo"
                      value={formData.exameFisicoB.alteracaoMamiloDetalhe || ''}
                      onChange={(e) => setFormData({ ...formData, exameFisicoB: { ...formData.exameFisicoB, alteracaoMamiloDetalhe: e.target.value } })}
                      className="mt-2 w-full border-2 border-border h-10"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Fatores de risco</h4>
              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="fuma_local"
                    checked={formData.habitos.fuma}
                    onCheckedChange={(checked) => setFormData({ ...formData, habitos: { ...formData.habitos, fuma: checked } })}
                  />
                  <Label htmlFor="fuma_local" className="text-base">Fuma?</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bebe_local"
                    checked={formData.habitos.bebe}
                    onCheckedChange={(checked) => setFormData({ ...formData, habitos: { ...formData.habitos, bebe: checked } })}
                  />
                  <Label htmlFor="bebe_local" className="text-base">Bebe?</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="exercicio_local"
                    checked={formData.habitos.atividadeEsportiva}
                    onCheckedChange={(checked) => setFormData({ ...formData, habitos: { ...formData.habitos, atividadeEsportiva: checked } })}
                  />
                  <Label htmlFor="exercicio_local" className="text-base">Fez exercício físico?</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="alimentacao_local"
                    checked={formData.habitos.alimentacaoSaudavel}
                    onCheckedChange={(checked) => setFormData({ ...formData, habitos: { ...formData.habitos, alimentacaoSaudavel: checked } })}
                  />
                  <Label htmlFor="alimentacao_local" className="text-base">Alimentação saudável</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autoexame_local"
                    checked={formData.habitos.autoExame}
                    onCheckedChange={(checked) => setFormData({ ...formData, habitos: { ...formData.habitos, autoExame: checked } })}
                  />
                  <Label htmlFor="autoexame_local" className="text-base">Realiza auto-exame?</Label>
                </div>
              </div>
            </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto mt-8 justify-end">
          <Button
            onClick={handleSave}
            variant="outline-primary-bold"
            className="text-base px-6 py-6 gap-2 w-1/2 md:w-auto justify-center"
          >
            <Save className="h-5 w-5" />
            SALVAR
          </Button>
          <Button
            onClick={handleDownload}
            variant="ghost"
            size="lg"
            className="border-2 border-transparent bg-secondary text-secondary-foreground text-base px-6 py-6 gap-2 hover:bg-primary hover:text-primary-foreground w-1/2 md:w-auto justify-center"
          >
            <Download className="h-5 w-5" />
            DOWNLOAD
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Button onClick={scrollToTop} variant="link" className="text-base">
            Voltar ao início
          </Button>
        </div>

      </main>
    </div>
  )
}