import './style.css'
import './theme.css'
import './kiwen-suwi.css'

interface UserEx {
  flip: () => void;
}

class Shess implements UserEx {

  static init = (): Shess => {
  
    let ss = document.createElement('shess')
  
    let ranks = document.createElement('ranks')
    let ux_ranks: UserEx[] = '12345678'.split('').map((r: string) => {
      let s = document.createElement('rank')
      let t = document.createTextNode(r)
      s.appendChild(t)
  
      ranks.appendChild(s)
  
      const flip = () => {
        switch (r) {
          case "1": { r = "8" } break;
          case "2": { r = "7" } break;
          case "3": { r = "6" } break;
          case "4": { r = "5" } break;
          case "5": { r = "4" } break;
          case "6": { r = "3" } break;
          case "7": { r = "2" } break;
          case "8": { r = "1" } break;
        }
  
        t.textContent = r
      }
  
      return {
        flip
      }
  
    })
  
    let files = document.createElement('files')
    let ux_files = 'abcdefgh'.split('').map((f: string) => {
      let s = document.createElement('file')
      let t = document.createTextNode(f)
      s.appendChild(t)
      files.appendChild(s)
  
      const flip = () => {
        switch (f) {
          case "a": { f = "h" } break;
          case "b": { f = "g" } break;
          case "c": { f = "f" } break;
          case "d": { f = "e" } break;
          case "e": { f = "d" } break;
          case "f": { f = "c" } break;
          case "g": { f = "b" } break;
          case "h": { f = "a" } break;
        }
  
        t.textContent = f
      }
      return {
        flip
      }
    })
  
    let board = document.createElement('board')
  
  
    ss.appendChild(files)
    ss.appendChild(ranks)
    ss.appendChild(board)

    const flip = () => {
      ux_files.forEach(_ => _.flip())
      ux_ranks.forEach(_ => _.flip())
    }

    let ux = {
      flip
    }

    return new Shess(ss, ux)
  }

  constructor(readonly el: HTMLElement, readonly ux: UserEx) {}

  flip() {
    this.ux.flip()

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