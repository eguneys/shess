import './style.css'
import './theme.css'
import './kiwen-suwi.css'

interface UserEx {
  init: () => void;
  flip: () => void;
}


class Shess implements UserEx {

  static init = (): Shess => {

    const Anims = new AnimationManager()
  
    let ss = document.createElement('shess')
    ss.classList.add('is2d')
  
    let ranks = document.createElement('ranks')
    let ux_ranks: UserEx[] = '12345678'.split('').map((r: string) => {
      let s = document.createElement('rank')
      let t = document.createTextNode(r)
      s.appendChild(t)
  
      ranks.appendChild(s)
  
      const init = () => {}

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
        init,
        flip
      }
  
    })
  
    let files = document.createElement('files')
    let ux_files: UserEx[] = 'abcdefgh'.split('').map((f: string) => {
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


      const init = () => {}
      return {
        init,
        flip
      }
    })
  
    let board = document.createElement('board')
  


    let ux_pieces: UserEx[] = 'RNBQKBNRPPPPPPPPrnbqkbnrpppppppp'.split('').map((p: string) => {
      let color = p.toUpperCase() === p ? 'white' : 'black'
      let role = 'pawn'
      switch (p.toUpperCase()) {
        case "R": { role = "rook" } break;
        case "N": { role = "knight" } break;
        case "B": { role = "bishop" } break;
        case "Q": { role = "queen" } break;
        case "K": { role = "king" } break;
        case "P": { role = "pawn" } break;
      }

      let pce = document.createElement('piece')

      pce.classList.add(color, role)



      let _pos: [number, number] = [0, 0]
      const translate = (pos: [number, number]) => {
        _pos = pos
        pce.style.transform = `translate(${pos[0] * 700}%, ${pos[1] * 700}%)`
      }

      Anims.pos({
        start: _pos,
        end: [Math.random(), Math.random()],
        dur: 0.6,
        update: translate
      })

      board.appendChild(pce)

      const init = () => {
        translate([Math.random(), Math.random()])
      }

      const flip = () => {
      }

      return {
        init,
        flip
      }
     })


  
    ss.appendChild(files)
    ss.appendChild(ranks)
    ss.appendChild(board)

    const flip = () => {
      ux_files.forEach(_ => _.flip())
      ux_ranks.forEach(_ => _.flip())
    }

    let bounds: DOMRect;

    const on_bounds = () => {
      bounds = board.getBoundingClientRect()
    }
    on_bounds()
    
    window.addEventListener('resize', on_bounds)
    window.addEventListener('scroll', on_bounds)

    
    function norm_ev_position(ev: MouseEvent): [number, number] {
      return [(ev.clientX - bounds.left) / bounds.width, (ev.clientY - bounds.top) / bounds.height]
    }

    const on_mouse_move = (_p: [number, number]) => {

    }

    document.addEventListener('mousemove', (ev: MouseEvent) => on_mouse_move(norm_ev_position(ev)))

    const init = () => {
      ux_files.forEach(_ => _.init())
      ux_ranks.forEach(_ => _.init())
      ux_pieces.forEach(_ => _.init())
      on_bounds()
    }

    let ux = {
      init,
      flip
    }


    return new Shess(ss, ux)
  }

  constructor(readonly el: HTMLElement, readonly ux: UserEx) {}

  init() {
    this.ux.init()
  }

  flip() {
    this.ux.flip()
  }
}

type PosCb = {
  start: [number, number],
  end: [number, number],
  dur: number,
  update: (pos: [number, number]) => void,
  _value?: [number, number, number, number, number],
}

const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

class AnimationManager {

  gaffer_cancel?: () => void

  ps: PosCb[] = []

  pos(t: PosCb) {
    t.start = [t.start[0], t.start[1]]
    t.end = [t.end[0], t.end[1]]
    t._value = [t.start[0], t.start[1], t.start[0], t.start[1], 0]
    this.ps.push(t)

    if (this.ps.length === 1) {
      this.resume()
    }
  }

  _g = () => {
    let self = this
    return {
      integrate(_t: number, dt: number) {
        self.ps.forEach(v => {
          if (v._value) {
            v._value[0] = v._value[2]
            v._value[1] = v._value[3]
            v._value[4] = v._value[4] + dt

            let alpha = ease(v._value[4] / v.dur)

            v._value[2] = v.end[0] * alpha - v.start[0] * (1 - alpha)
            v._value[3] = v.end[1] * alpha - v.start[1] * (1 - alpha)
          }
        })

      },
      render(alpha: number) {
        self.ps.forEach(v =>
          v.update([
            v._value![2] * alpha + v._value![0] * (1 - alpha),
            v._value![3] * alpha + v._value![1] * (1 - alpha)]))

        self.ps = self.ps.filter(v => v._value![4] < v.dur)
      }
    }
  }


  imm_end() {
    this.ps.forEach(v => {
      v.update(v.end)
    })
    this.gaffer_cancel?.()
    this.ps = []
  }

  cancel() {
    this.gaffer_cancel?.()
    this.ps = []
  }

  pause() {
    this.gaffer_cancel?.()
  }

  resume() {
    if (this.ps.length > 0) {
      this.gaffer_cancel = gaffer_loop(this._g())
    }
  }
}

/* https://gafferongames.com/post/fix_your_timestep/ */
type Gaffer = {
  integrate: (t: number, dt: number) => void,
  render: (alpha: number) => void
}

function gaffer_loop(g: Gaffer) {
  let t = 0
  let dt = 0.01

  let current_time: number | undefined
  let accumulator = 0

  let raf_id: number

  function step(new_time: number) {
    new_time /= 1000
    let frame_time = new_time - (current_time ?? new_time - dt)
    if (frame_time > 0.25) {
      frame_time = 0.25
    }
    current_time = new_time
    accumulator += frame_time

    while (accumulator >= dt) {
      g.integrate(t, dt)
      t += dt
      accumulator -= dt
    }

    const alpha = accumulator / dt

    g.render(alpha)

    raf_id = requestAnimationFrame(step)
  }
  raf_id = requestAnimationFrame(step)


  return () => {
    cancelAnimationFrame(raf_id)
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

  ss.init()
}

main(document.getElementById('app')!)
