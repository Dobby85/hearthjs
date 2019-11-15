const program = require('commander')
const path = require('path')
const commands = ['debug', 'migrate', 'start', 'help', 'test', 'translate', 'init']

process.env.HEARTH_SERVER_PATH = process.env.HEARTH_SERVER_PATH || path.join(process.cwd(), 'server')

const projectCommand = require(path.join(process.env.HEARTH_SERVER_PATH, 'commands'))

for (let i = 0; i < projectCommand.length; i++) {
  if (projectCommand[i].name === undefined) {
    console.error('You must add a name to your command')
    process.exit(1)
  }

  if (projectCommand[i].description === undefined) {
    console.error('You must add a description to your command')
    process.exit(1)
  }

  if (projectCommand[i].path === undefined) {
    console.error('You must add an executable path to your command')
    process.exit(1)
  }

  if (commands.indexOf(projectCommand[i].name) !== -1) {
    console.error(`A command names ${projectCommand[i].name} already exists, please choose another name`)
    process.exit(1)
  }

  program.command(projectCommand[i].name, projectCommand[i].description, { executableFile: projectCommand[i].path })
  commands.push(projectCommand[i].name)
}

program
  .command('test', 'Run all application tests', { executableFile: path.join(__dirname, 'cli/test') })
  .command('debug', 'Launch application with debug', { executableFile: path.join(__dirname, 'cli/debug') })
  .command('start', 'Launch application without debug', { executableFile: path.join(__dirname, 'cli/start') })
  .command('migrate', 'Migrate your database in <mode> env', { executableFile: path.join(__dirname, 'cli/migrate') })
  .command('translate', 'Find all translation key', { executableFile: path.join(__dirname, 'cli/translate') })
  .command('init', 'Init an hearthjs project', { executableFile: path.join(__dirname, 'cli/init') })
  .on('command:*', (command) => {
    const firstCommand = command[0]
    if (commands.indexOf(firstCommand) === -1) {
      console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '))
      process.exit(1)
    }
  })
  .parse(process.argv)
