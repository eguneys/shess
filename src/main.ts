import './style.css'
import './theme.css'
import './kiwen-suwi.css'

function app(el: HTMLElement) {

  let ss = document.createElement('shess')
  el.appendChild(ss)

  let ranks = document.createElement('ranks')
  '12345678'.split('').forEach((r: string) => {
    let s = document.createElement('rank')
    let t = document.createTextNode(r)
    s.appendChild(t)

    ranks.appendChild(s)
  })

  let files = document.createElement('files')
  'abcdefgh'.split('').map((f: string) => {
    let s = document.createElement('file')
    let t = document.createTextNode(f)
    s.appendChild(t)
    files.appendChild(s)
  })

  let board = document.createElement('board')

  ss.appendChild(files)
  ss.appendChild(ranks)
  ss.appendChild(board)


}

app(document.getElementById('app')!)