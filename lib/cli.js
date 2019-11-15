const program = require('commander')
const path = require('path')
const commands = ['debug', 'migrate', 'start', 'help', 'test', 'translate', 'init']

process.env.HEARTH_SERVER_PATH = process.env.HEARTH_SERVER_PATH || path.join(process.cwd(), 'server')

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
