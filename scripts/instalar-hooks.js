// Aponta o core.hooksPath para .githooks, de forma que o hook de pre-commit funcione
// sem instalação manual. Rodado pelo "prepare" do package.json, após o npm install.
//
// Escrito em Node, e não como comando de shell, porque o npm executa os scripts pelo cmd.exe
// no Windows, onde `|| true` não existe e um `git config` que falhe derrubaria o npm install.
const { execSync } = require('node:child_process')

try {
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' })
  console.log('hooks instalados: core.hooksPath -> .githooks')
} catch {
  // Sem repositório git (download de zip, por exemplo): seguir sem instalar.
  console.log('hooks não instalados: este diretório não parece ser um repositório git')
}
