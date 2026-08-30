const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const anamneses = [
    {
      id: "teste-1",
      data: {
        nome: "Maria Silva",
        telefone: "(11) 99999-1111",
        cidade: "São Paulo",
        dataNascimento: "1980-05-15",
        motivo: "Rotina",
        exame: "2026-07-09",
        idExamesAnteriores: "ID-1234",
        aproveitarExames: "sim",
        jaFezMamo: "sim",
        sintomas: { dor: false, massa: true, secrecao: false },
        corSecrecao: "",
        especifiqueSintomas: "",
        jaFezCirurgia: { mamoplastia: false, protese: false, nodulos: false, cancer: false },
        cancer: "nao",
        especificarCancer: "",
        historiaDoenca: "Nenhuma alteração prévia.",
        numeroGestacoes: "2",
        numeroPartos: "2",
        numeroAbortos: "0",
        historiaReprodutiva: { amamentou: true, menopausa: false, hormonio: false },
        dum: "2026-06-25",
        tempoMenopausa: "",
        tempoHormonio: "",
        alguemComCancer: "nao",
        parentescoCancer: "",
        habitos: { fuma: false, bebe: true, atividadeEsportiva: true, alimentacaoSaudavel: true, autoExame: true }
      },
      imagem: null,
      imagemMamaA: null,
      imagemMamaB: null
    },
    {
      id: "teste-2",
      data: {
        nome: "Ana Souza",
        telefone: "(11) 98888-2222",
        cidade: "Campinas",
        dataNascimento: "1965-08-20",
        motivo: "Acompanhamento",
        exame: "2026-07-08",
        idExamesAnteriores: "ID-5678",
        aproveitarExames: "sim",
        jaFezMamo: "sim",
        sintomas: { dor: true, massa: false, secrecao: false },
        corSecrecao: "",
        especifiqueSintomas: "",
        jaFezCirurgia: { mamoplastia: false, protese: true, nodulos: false, cancer: false },
        cancer: "nao",
        especificarCancer: "",
        historiaDoenca: "Prótese inserida em 2015.",
        numeroGestacoes: "1",
        numeroPartos: "1",
        numeroAbortos: "0",
        historiaReprodutiva: { amamentou: true, menopausa: true, hormonio: true },
        dum: "",
        tempoMenopausa: "5 anos",
        tempoHormonio: "3 anos",
        alguemComCancer: "sim",
        parentescoCancer: "Mãe",
        habitos: { fuma: false, bebe: false, atividadeEsportiva: false, alimentacaoSaudavel: true, autoExame: true }
      },
      imagem: null,
      imagemMamaA: null,
      imagemMamaB: null
    },
    {
      id: "teste-3",
      data: {
        nome: "Juliana Santos",
        telefone: "(21) 97777-3333",
        cidade: "Rio de Janeiro",
        dataNascimento: "1992-02-10",
        motivo: "Primeira vez",
        exame: "2026-07-10",
        idExamesAnteriores: "",
        aproveitarExames: "nao",
        jaFezMamo: "nao",
        sintomas: { dor: false, massa: false, secrecao: false },
        corSecrecao: "",
        especifiqueSintomas: "",
        jaFezCirurgia: { mamoplastia: false, protese: false, nodulos: false, cancer: false },
        cancer: "nao",
        especificarCancer: "",
        historiaDoenca: "",
        numeroGestacoes: "0",
        numeroPartos: "0",
        numeroAbortos: "0",
        historiaReprodutiva: { amamentou: false, menopausa: false, hormonio: true },
        dum: "2026-06-20",
        tempoMenopausa: "",
        tempoHormonio: "1 ano",
        alguemComCancer: "nao",
        parentescoCancer: "",
        habitos: { fuma: true, bebe: true, atividadeEsportiva: false, alimentacaoSaudavel: false, autoExame: false }
      },
      imagem: null,
      imagemMamaA: null,
      imagemMamaB: null
    }
  ];

  for (const anamnese of anamneses) {
    await prisma.anamnese.upsert({
      where: { id: anamnese.id },
      update: {},
      create: anamnese,
    });
  }

  console.log("Registros teste criados com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
