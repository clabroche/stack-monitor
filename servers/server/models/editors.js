const commandExists = require("command-exists").sync

const codeArgsBuilder = ({ link, command, cwd, line, column }) => (
  `${command} ${link ? `--goto ${link}${line ? `:${line}${column ? `:${column}` : ''}` : ''}` : ''} ${cwd}`
)
const intellijArgsBuilder = ({ link, command, cwd, line, column }) => {
  return `${command} ${cwd}  ${column ? `--column ${column}` : ''} ${line ? `--line ${line}` : ''}  ${link}`
}
const editors = {
  code: {
    commands: ['code', 'code-insiders'],
    args: codeArgsBuilder
  },
  cursor: {
    commands: ['cursor'],
    args: codeArgsBuilder
  },
  intellij: {
    commands: ['idea'],
    args: intellijArgsBuilder
  },
  androidstudio: {
    commands: ['android-studio'],
    args: intellijArgsBuilder
  },
  sublime: {
    commands: ['subl'],
    args: ({ link, command, cwd, line, column }) => (
      link 
        ? `${command} ${link ? `${link}${line ? `:${line}${column ? `:${column}`: ''}`: ''}` : ''}`
        : `${command} ${cwd}`
    )
  }
}

module.exports.allEditors =  Object.keys(editors)
module.exports.availableEditors = module.exports.allEditors
  .filter(key => editors[key].commands.find((command) => commandExists(command)))

module.exports.getCommandLine = (editorLabel, {cwd = '.', link = '', line = 0, column = 0} = {}) => {
  const editor = editors[editorLabel]
  if (!editor) return null
  const command = editor.commands.find((command) => commandExists(command))
  if (command) {
    return editor.args({cwd, command, line, column, link})
  }
  return
}
