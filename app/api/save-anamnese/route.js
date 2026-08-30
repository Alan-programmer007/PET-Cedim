import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const dataToSave = await req.json();
    
    if (!dataToSave || !dataToSave.id) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
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
    console.error('Erro ao salvar anamnese:', err);
    return NextResponse.json({ error: 'Erro ao salvar anamnese no banco de dados', details: err.message }, { status: 500 });
  }
}
