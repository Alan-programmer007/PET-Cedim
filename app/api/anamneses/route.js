import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
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
    console.error('Erro ao deletar anamnese:', err);
    return NextResponse.json({ error: 'Erro ao deletar anamnese' }, { status: 500 });
  }
}
