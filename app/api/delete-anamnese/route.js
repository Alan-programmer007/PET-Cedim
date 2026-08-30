import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID não informado' }), { status: 400 });
    }
    const filePath = path.join(process.cwd(), 'public', 'anamneses', `${id}.jpg`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: 'Arquivo não encontrado' }), { status: 404 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro ao deletar imagem', details: err.message }), { status: 500 });
  }
}
