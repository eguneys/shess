import './style.css'
import './theme.css'
import './kiwen-suwi.css'

import { Shess, INITIAL_FEN } from './shess'

function main(el: HTMLElement) {

  let ss = Shess.init()
  el.appendChild(ss.el)

  ss.pull_arrows(ac => {
    //console.log(ac.circles)
  })

  ss.pull_fen(fen => {
    //console.log(fen)
  })

  ss.dests({ 'a2': ['a3', 'a4'], 'b2': ['b3', 'b4' ] })

  document.addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key === '2') {
      ss.fen('8/8/2k5/8/P2P4/8/8/7K b - - 0 1')
    }
    if (ev.key === ' ') {
      ss.fen(INITIAL_FEN)
      ev.preventDefault()
      return false
    }
    if (ev.key === 'f') {
      ss.flip()
    }
    if (ev.key === 'r') {
      ss.random()
    }
    if (ev.key === 's') {
      ss.shake()
    }
    if (ev.key === 'e') {
      ss.snap()
    }
    if (ev.key === 'q') {
      ss.clear()
    }
  })

  ss.init()
}

main(document.getElementById('app')!)
