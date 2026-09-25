import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { lerSessao } from '@/lib/auth';

// Campos que o servidor exige para aceitar uma anamnese.
//
// ⚠️ PROVISÓRIO: hoje só o nome é exigido, porque uma ficha clínica sem identificação da
// paciente não é aproveitável. A lista definitiva depende da definição do protocolo pela
// orientação do projeto — ver o Quadro 6 do relatório técnico e o item D4 de MELHORIAS.md.
// Para exigir mais campos, basta acrescentá-los aqui.
const CAMPOS_OBRIGATORIOS = [
  { campo: 'nome', rotulo: 'Nome' },
];

export async function POST(req) {
  const sessao = await lerSessao(req);
  if (!sessao) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const dataToSave = await req.json();

    if (!dataToSave || !dataToSave.id) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    const faltando = CAMPOS_OBRIGATORIOS
      .filter(({ campo }) => !String(dataToSave[campo] ?? '').trim())
      .map(({ rotulo }) => rotulo);

    if (faltando.length > 0) {
      return NextResponse.json(
        { error: `Preencha os campos obrigatórios: ${faltando.join(', ')}` },
        { status: 400 }
      );
    }

    const { id, imagem, imagemMamaA, imagemMamaB, ...restData } = dataToSave;

    await prisma.anamnese.create({
      data: {
        id: id,
        data: restData,
        imagem: imagem || null,
        imagemMamaA: imagemMamaA || null,
        imagemMamaB: imagemMamaB || null,
      }
    });

    return NextResponse.json({ success: true, message: 'Anamnese salva com sucesso' }, { status: 200 });
  } catch (err) {
    // P2002 = violação de restrição única; aqui significa id repetido
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma anamnese com este identificador' }, { status: 409 });
    }
    // O detalhe do erro fica no servidor: a mensagem do Prisma expõe caminhos e estrutura interna
    console.error('Erro ao salvar anamnese:', err);
    return NextResponse.json({ error: 'Erro ao salvar anamnese no banco de dados' }, { status: 500 });
  }
}
