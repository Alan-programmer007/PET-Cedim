import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { lerSessao } from '@/lib/auth';

// O middleware já valida a sessão, mas cada rota refaz a verificação: middleware
// não é fronteira de segurança suficiente sozinho.
async function exigirSessao(req) {
  const sessao = await lerSessao(req);
  return sessao ? null : NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
}

export async function GET(req) {
  const semSessao = await exigirSessao(req);
  if (semSessao) return semSessao;

  try {
    const anamneses = await prisma.anamnese.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Reconstruct the original object format expected by the frontend
    const registros = anamneses.map(a => ({
      ...a.data,
      id: a.id,
      imagem: a.imagem,
      imagemMamaA: a.imagemMamaA,
      imagemMamaB: a.imagemMamaB,
      createdAt: a.createdAt
    }));

    return NextResponse.json(registros, { status: 200 });
  } catch (err) {
    console.error('Erro ao buscar anamneses:', err);
    return NextResponse.json({ error: 'Erro ao buscar anamneses' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const semSessao = await exigirSessao(req);
  if (semSessao) return semSessao;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    await prisma.anamnese.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    // P2025 = o Prisma não encontrou o registro pedido
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Anamnese não encontrada' }, { status: 404 });
    }
    console.error('Erro ao deletar anamnese:', err);
    return NextResponse.json({ error: 'Erro ao deletar anamnese' }, { status: 500 });
  }
}
