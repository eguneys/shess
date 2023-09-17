import './style.css'
import './theme.css'
import './kiwen-suwi.css'

class Shess {

  static init = (): Shess => {

  let ss = document.createElement('shess')

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

    return new Shess(ss)
  }

  constructor(readonly el: HTMLElement) {}

  flip() {

  }
}

function main(el: HTMLElement) {

  let ss = Shess.init()
  el.appendChild(ss.el)

  document.addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key === 'f') {
      ss.flip()
    }
  })
}

main(document.getElementById('app')!)