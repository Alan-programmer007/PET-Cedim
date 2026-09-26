const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Credenciais que já estiveram publicadas no README e permanecem no histórico do repositório.
// Servem apenas para o ambiente local; em produção o seed se recusa a usá-las.
const EMAIL_LOCAL = 'petsdcedim@gmail.com';
const SENHA_LOCAL = '1234567cedim';

// Senhas que nunca podem valer em produção: a publicada e o marcador do .env.example.
const SENHAS_PROIBIDAS = [SENHA_LOCAL, 'TROQUE_ESTA_SENHA'];

// O docker-compose repassa ${SEED_EMAIL} mesmo quando a variável não existe no host, entregando
// string vazia. Tratar vazio como ausente é o que impede o fallback silencioso para as credenciais
// publicadas em uma implantação real.
// `aparar` só para o e-mail: senha se guarda exatamente como veio, porque o login compara o que a
// pessoa digita com o que foi gravado — aparar aqui criaria uma senha diferente da configurada.
function variavel(nome, { aparar = false } = {}) {
  const valor = process.env[nome];
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  return aparar ? valor.trim() : valor;
}

function credenciais() {
  const email = variavel('SEED_EMAIL', { aparar: true });
  const senha = variavel('SEED_PASSWORD');
  const ehProducao = process.env.NODE_ENV === 'production';

  if (!ehProducao) {
    if (email && senha) return { email, senha };
    console.warn(
      '[seed] AVISO: usando as credenciais locais publicadas no repositório. ' +
        'Defina SEED_EMAIL e SEED_PASSWORD para qualquer ambiente acessível por terceiros.'
    );
    return { email: email || EMAIL_LOCAL, senha: senha || SENHA_LOCAL };
  }

  // Em produção, faltar variável é erro: seguir adiante criaria o administrador com a senha que
  // está publicada. É preferível falhar e deixar a implantação reverter.
  const faltando = [!email && 'SEED_EMAIL', !senha && 'SEED_PASSWORD'].filter(Boolean);
  if (faltando.length > 0) {
    throw new Error(
      `${faltando.join(' e ')} não definida(s). Em produção o seed não usa as credenciais ` +
        'publicadas no repositório. Defina as variáveis no .env do servidor e suba novamente.'
    );
  }

  // Só a senha é segredo; o e-mail é nome de usuário. Manter petsdcedim@gmail.com como conta do
  // administrador é legítimo, desde que a senha seja outra — por isso aqui só se avisa.
  if (SENHAS_PROIBIDAS.includes(senha)) {
    throw new Error(
      'SEED_PASSWORD é a senha publicada no repositório ou o marcador do .env.example. Nenhuma das ' +
        'duas pode valer em produção. Escolha outra.'
    );
  }

  if (email === EMAIL_LOCAL) {
    console.warn(
      `[seed] AVISO: ${EMAIL_LOCAL} é o e-mail publicado no repositório. Como identificador não é ` +
        'segredo, segue permitido — mas a senha precisa ser própria, e é.'
    );
  }

  return { email, senha };
}

async function main() {
  const { email, senha } = credenciais();

  const existente = await prisma.user.findUnique({ where: { email } });

  if (existente) {
    // O seed nunca troca a senha de quem já existe: rodar de novo não é caminho de rotação.
    // Para trocar, apague o usuário e rode outra vez, ou altere a senha pela aplicação.
    console.log(`Usuário administrador (${email}) já existe. Pulando criação.`);
    return;
  }

  const usuario = await prisma.user.create({
    data: { email, password: await bcrypt.hash(senha, 10) }
  });
  console.log(`Usuário administrador criado com sucesso: ${usuario.email}`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
