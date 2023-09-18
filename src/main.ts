import './style.css'
import './theme.css'
import './kiwen-suwi.css'

interface UserEx {
  init: () => void;
  flip: () => void;
  random: () => void;
  shake: () => void;
  snap: () => void;
}

class Shess implements UserEx {

  static init = (): Shess => {

    const Anims = new AnimationManager()
    const Drags = new DragManager()
  
    let ss = document.createElement('shess')
    ss.classList.add('is2d')
  
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
        init() {},
        flip,
        random() {},
        shake() {},
        snap() {}
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


      return {
        init() {},
        flip,
        random() {},
        shake() {},
        snap() {}
      }
    })
  
    let board = document.createElement('board')
  

    let pieces = 'RNBQKBNRPPPPPPPPrnbqkbnrpppppppp'
    //pieces = 'R'
    let ux_pieces: UserEx[] = pieces.split('').map((p: string) => {
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


      let _pos: [number, number] = [0, 0],
        _scale = 1,
        _angle = 0

      const _transform = () => {
        pce.style.transform = `translate(${_pos[0] * 800}%, ${_pos[1] * 800}%) \
        scale(${_scale}) \
        rotate(${_angle}rad)`
      }

      const translate = (pos: [number, number]) => {
        _pos = pos
        _transform()
      }

      const scale = (s: number) => {
        _scale = s
        _transform()
      }

      const rotate = (r: number) => {
        _angle = r
        _transform()
      }

      const scale_angle = (sr: [number, number]) => {
        _scale = sr[0]
        _angle = sr[1]
        _transform()
      }

      const lerp_10 = (end: [number, number]) => {
        Anims.cancel()
        let a = 0.3
        let t: [number, number] = [
          _pos[0] * (1- a) + end[0] * a, 
          _pos[1] * (1 - a) + end[1] * a]
        translate(t)
      }


      const t60 = (end: [number, number]) => {
       Anims.pos({
               start: _pos,
               end,
               dur: 0.26,
               update: translate
             })
      }
      

      const t20 = (end: [number, number]) => {
       Anims.pos({
               start: _pos,
               end,
               dur: 0.16,
               update: translate
             })
      }
      
      const s10 = () => {
        Anims.pos({
          start: [_scale, _angle],
          end: [_scale, _angle + h_pi],
          dur: 0.6,
          twist: (a: number) => Math.sin(a * h_pi),
          update: scale_angle
        })
      }


      Drags.push({
        q_pos: () => [_pos[0] + 0.5/8, _pos[1] + 0.5/8],
        on_click: function (_pos: [number, number]): void {
          _pos = [_pos[0] - 0.5/ 8, _pos[1] - 0.5/8]
          console.log(role)
        },
        on_hover: function (_pos: [number, number]): void {
          _pos = [_pos[0] - 0.5/ 8, _pos[1] - 0.5/8]
          //console.log(role)
        },
        on_down: function (_pos: [number, number]): void {
          _pos = [_pos[0] - 0.5/ 8, _pos[1] - 0.5/8]
          t20(_pos)
        },
        on_drag: function (_pos: [number, number]): void {
          _pos = [_pos[0] - 0.5/ 8, _pos[1] - 0.5/8]
          lerp_10(_pos)
        },
        on_drop: function (_pos: [number, number]): void {
          _pos = [_pos[0] - 0.5/ 8, _pos[1] - 0.5/8]
        }
      })

      board.appendChild(pce)

      const init = () => {
        random()
      }

      const flip = () => {
        t60([7/8 - _pos[0], 7/8 - _pos[1]])
      }

      const random = () => {
        t20([Math.random() * (1 - 1/8), Math.random() * (1 - 1/8)])
      }

      const shake = () => {
        s10()
      }

      const snap_1h8 = (v: number) => {
        let dx = v % (1/8)

        if (dx < 1/8 - dx) {
          return v - dx
        } else {
          return v + 1/8 - dx
        }
        return v + Math.min(dx, 1/8 - dx)
      }

      const snap = () => {
        t20([snap_1h8(_pos[0]), snap_1h8(_pos[1])])
      }

      return {
        init,
        flip,
        random,
        shake,
        snap
      }
     })


  
    ss.appendChild(files)
    ss.appendChild(ranks)
    ss.appendChild(board)

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


    const on_mouse_move = (_p: [number, number]) => { Drags.move = _p }
    const on_mouse_down = (_p: [number, number]) => { Drags.down = _p }
    const on_mouse_up = (_p: [number, number]) => { Drags.up = _p }

    document.addEventListener('mousemove', (ev: MouseEvent) => on_mouse_move(norm_ev_position(ev)))
    document.addEventListener('mousedown', (ev: MouseEvent) => on_mouse_down(norm_ev_position(ev)))
    document.addEventListener('mouseup', (ev: MouseEvent) => on_mouse_up(norm_ev_position(ev)))

    const init = () => {
      ux_files.forEach(_ => _.init())
      ux_ranks.forEach(_ => _.init())
      ux_pieces.forEach(_ => _.init())
      on_bounds()
    }

    const flip = () => {
      Anims.imm_end()
      ux_files.forEach(_ => _.flip())
      ux_ranks.forEach(_ => _.flip())
      ux_pieces.forEach(_ => _.flip())
    }

    const random = () => {
      ux_files.forEach(_ => _.random())
      ux_ranks.forEach(_ => _.random())
      ux_pieces.forEach(_ => _.random())
    }

    const shake = () => {
      ux_files.forEach(_ => _.shake())
      ux_ranks.forEach(_ => _.shake())
      ux_pieces.forEach(_ => _.shake())
    }

    const snap = () => {
      ux_files.forEach(_ => _.snap())
      ux_ranks.forEach(_ => _.snap())
      ux_pieces.forEach(_ => _.snap())
    }

    let ux = {
      init,
      flip,
      random,
      shake,
      snap
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

  random() {
    this.ux.random()
  }

  shake() {
    this.ux.shake()
  }


  snap() {
    this.ux.snap()
  }
}

const pi = Math.PI
const pi2 = pi * 2
const h_pi = pi / 2
const hh_pi = pi / 4

type PosCb = {
  start: [number, number],
  end: [number, number],
  dur: number,
  twist?: (a: number) => number,
  update: (pos: [number, number]) => void,
  _value?: [number, number, number, number, number],
}

type DragCb = {
  q_pos: () => [number, number],
  on_click: (pos: [number, number]) => void,
  on_hover: (pos: [number, number]) => void,
  on_down: (pos: [number, number]) => void,
  on_drag: (pos: [number, number]) => void,
  on_drop: (pos: [number, number]) => void
}

class DragManager {

  _down?: [number, number]
  _move?: [number, number]
  _up?: [number, number]

  d?: DragCb

  set down(d: [number, number]) {
    this._up = undefined
    this._down = d

    const dd = this.ds.find((dd) => distance(dd.q_pos(), d) < 1/16)
    if (!dd) {
      return
    }

    this.d = dd
    this.d.on_down(d)

    setTimeout(() => {

      if (this._up) {
        dd.on_click(this._up)
        this._move = undefined
        this._down = undefined
        this.d = undefined
      } else if (this._move) {
        dd.on_drag(this._move)
      }
    }, 120)
  }

  set move(m: [number, number]) {
    this._move = m
    if (this.d) {
      this.d.on_drag(m)
    } else {
      let dd = this.ds.find((dd) => distance(dd.q_pos(), m) < 1/16)
      if (dd) {
        dd.on_hover(m)
      }
    }
  }

  set up(u: [number, number]) {
    if (this.d) {
      this.d.on_drop(u)
    }
    this._up = u
    this._move = undefined
    this._down = undefined
    this.d = undefined
  }

  ds: DragCb[] = []


  push(d: DragCb) {
    this.ds.push(d)
  }
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

            if (v.twist) {
              alpha = v.twist(alpha)
            }

            v._value[2] = v.end[0] * alpha + v.start[0] * (1 - alpha)
            v._value[3] = v.end[1] * alpha + v.start[1] * (1 - alpha)

          }
        })

      },
      render(alpha: number) {
        self.ps.forEach(v =>
          v.update([
            v._value![2] * alpha + v._value![0] * (1 - alpha),
            v._value![3] * alpha + v._value![1] * (1 - alpha)]))


            if (self.ps[0]) {
              //console.log(self.ps[0]._value)
            }
        self.ps = self.ps.filter(v => v._value![4] < v.dur)
        if (self.ps.length == 0) {
          setTimeout(() => { if (self.ps.length == 0) { self.gaffer_cancel?.() }})
        }
      }
    }
  }


  imm_end() {
    this.ps.forEach(v => {
      v.update(v.end)
    })
    this.gaffer_cancel?.()
    this.ps = []
    this.gaffer_cancel = undefined
  }

  cancel() {
    this.gaffer_cancel?.()
    this.ps = []
    this.gaffer_cancel = undefined
  }

  pause() {
    this.gaffer_cancel?.()
  }

  resume() {
    if (this.ps.length > 0) {
      this.gaffer_cancel?.()
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

function distance(a: [number, number], b: [number, number]) {
  let x = a[0], y = a[1]
  let x2 = b[0], y2 = b[1]

  let dx = x2 - x, dy = y2 - y
  return Math.sqrt(dx * dx + dy * dy)
}



function main(el: HTMLElement) {

  let ss = Shess.init()
  el.appendChild(ss.el)

  document.addEventListener('keydown', (ev: KeyboardEvent) => {
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
  })

  ss.init()
}

main(document.getElementById('app')!)
