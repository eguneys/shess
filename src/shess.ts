type Key = string
class HighlightsManager {

  dests: { [key: string]: Key[] } = {}

  selected?: Key
  set_dests?: Key[]
  last_moves?: Key[]

  can_dest(orig: Key, dest: Key) {
    return this.dests[orig]?.includes(dest)
  }

  last_move(last_moves: Key[]) {
    this.clear_last_moves()

    if (last_moves.length > 0) {
      this.last_moves = last_moves
      Squares.add_klass('last-move', last_moves)
    }
  }

  clear_last_moves() {
    if (this.last_moves) {
      Squares.remove_klass('last-move', this.last_moves)
      this.last_moves = undefined
    }
  }

  select_piece(key: string) {
    this.deselect()

    let dests = this.dests[key]
    if (dests) {
      Squares.add_klass('dest', dests)
      this.set_dests = dests
    }

    this.selected = key
    Squares.add_klass('selected', [key])
  }

  deselect() {
    if (this.selected)  {
      Squares.remove_klass('selected', [this.selected])
      this.selected = undefined
    }
    if (this.set_dests) {
      Squares.remove_klass('dest', this.set_dests)
      this.set_dests = undefined
    }
  }

}


class SquareHi {

  static init = (key: string) => {
    let el = document.createElement('square')

    let d = Orients.key_to_coord(key)
    el.style.transform = `translate(${d[0] * 100}%, ${d[1] * 100}%)`

    let cb = {
      key,
      el,
      add_klass(_: string) {
        el.classList.add(_)
      },
      remove_klass(_: string) {

        el.classList.remove(_)
          setTimeout(() => {
            if (el.classList.length === 0 ||
            (el.classList.length === 1 && el.classList.contains('occupied'))) {
              Squares.pop(cb)
            }
          })
      }
    }

    let p = Fens.get_piece_by_key(key)

    if (p) {
      el.classList.add('occupied')
    }

    Squares.push(cb)
  }

  constructor(readonly el: HTMLElement, readonly key: string, readonly on_remove: () => void) {}
}

type SquareCb = {
  key: string,
  el: HTMLElement,
  add_klass: (_: string) => void,
  remove_klass: (_: string) => void
}

class SquareManager {
  
  static init = () => {
    return new SquareManager(Pieces.pieces)
  }

  cbs: SquareCb[] = []

  add_klass(klass: string, keys: string[]) {
    let has_keys = this.cbs.map(_ => _.key)
    let miss_keys = keys.filter(_ => !has_keys.includes(_))

    miss_keys.forEach(_ => SquareHi.init(_))

    this.cbs
    .filter(_ => keys.includes(_.key))
    .forEach(_ => _.add_klass(klass))
  }

  remove_klass(klass: string, keys: string[]) {
    let cbs = this.cbs.filter(_ => keys.includes(_.key))
    cbs.forEach(_ => _.remove_klass(klass))
  }

  push(cb: SquareCb) {
    this.cbs.push(cb)
    this.el.prepend(cb.el)
  }

  pop(cb: SquareCb) {
    let [h] = this.cbs.splice(this.cbs.indexOf(cb), 1)
    h.el.remove()
  }

  constructor(readonly el: HTMLElement) {}
}


class OrientsManager {
  
  key_to_coord(key: string): XY {
    return [this.files.indexOf(key[0]), this.ranks.indexOf(key[1])]
  }
  coord_to_key(coord: XY): string {
    return this.files[coord[0]] + this.ranks[coord[1]]
  }

  get files() {
    let lh = 'abcdefgh'.split('')
    return this.lh.map(i => lh[i - 1])
  }

  get ranks() {
    let lh = '12345678'.split('')
    return this.lh.map(i => lh[i - 1])
  }

  get lh() {
    return this.hl.reverse()
  }

  get hl() {
    return this._hl.slice(0)
  }

  private _hl = [8,7,6,5,4,3,2,1]

  flip() {
    this._hl.reverse()
  }

}


const arr_eq = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1]
const snap_u_coord = (u: [number, number]): [number, number] => [
  Math.max(0, Math.min(7, Math.floor(u[0] / (1/8)))), 
  Math.max(0, Math.min(7, Math.floor(u[1] / (1/8))))]


const get_color_from_modifiers = () => {
  if (Modifiers.ctrl) {
    return 'red'
  } else if (Modifiers.shift) {
    return 'blue'
  } else if (Modifiers.alt) {
    return 'yellow'
  } else {
    return 'green'
  }
}

type DrawCB = {
  on_down: (x: number, y: number) => void,
  on_down_end: (x: number, y: number) => void,
  on_move: (x: number, y: number, x2: number, y2: number) => void
  on_move_end: (x: number, y: number, x2: number, y2: number) => void
}

class DrawManager {

  _down?: [number, number]
  _move?: [number, number]
  _up?: [number, number]

  set down(d: [number, number]) {
    this._up = undefined
    this._down = d

    this.d.on_down(d[0], d[1])
  }

  set move(m: [number, number]) {
    if (!this._down) {
      return
    }
    if (arr_eq(snap_u_coord(this._down), snap_u_coord(m))) {
      return
    }
    this._move = m
    if (this._down && this._move) {
      this.d.on_move(this._down[0], this._down[1], this._move[0], this._move[1])
    }
  }

  set up(u: [number, number]) {
    if (this._down && this._move) {
      this.d.on_move_end(this._down[0], this._down[1], this._move[0], this._move[1])
    } else {
      this.d.on_down_end(u[0], u[1])
    }
    this._up = u
    this._move = undefined
    this._down = undefined
  }

  d!: DrawCB
}


function calculate_arrow_head(x1: number, y1: number, x2: number, y2: number) {

  let dir_x = x2 - x1
  let dir_y = y2 - y1

  let length = Math.sqrt(dir_x * dir_x + dir_y * dir_y)

  let u_dirx = dir_x / length
  let u_diry = dir_y / length

  let w = 1.6

  let p_x = -u_diry * w * 0.66
  let p_y = u_dirx * w * 0.66

  let a = [x2 + p_x, y2 + p_y]
  let b = [x2 - p_x, y2 - p_y]

  let c = [x2 + u_dirx * w, y2 + u_diry * w]

  return `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`
}

type TPull<T> = (cb: (_: T) => void) => void
type XY = [number, number]
type XYXY2 = [number, number, number, number]
type Brush = [string, number]

class Circle {
  static init = (pos: XY, brush: Brush) => {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "100%")
    svg.setAttribute("viewBox", "0 0 100 100")

    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    svg.appendChild(circle)
    circle.setAttribute("fill", 'none')

    function on_update([x1, y1]: number[])  {
      circle.setAttribute("cx", `${x1 * 100}`)
      circle.setAttribute("cy", `${y1 * 100}`)
      circle.setAttribute("r", `${100/16 - 1}`)
    }

    function on_color([color, width]: [string, number]) {
      circle.setAttribute("stroke", color)
      circle.setAttribute("stroke-width", `${width}`)
    }
    on_update(pos)
    on_color(brush)

    const get_export = (): CircleExport => {
      return [pos.map(_ => Math.floor(_ * 8)) as XY, brush[0]]
    }

    return new Circle(svg, get_export)
  }

  get export() {
    return this.get_export()
  }

  constructor(readonly svg: SVGElement, readonly get_export: () => CircleExport) {}
}

class Arrow {

  static init = (pull_pos: XYXY2 | TPull<XYXY2>, pull_brush: Brush | TPull<Brush>) => {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "100%")
    svg.setAttribute("viewBox", "0 0 100 100")

    let line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    svg.appendChild(line)

    let head = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
    svg.appendChild(head)

    function on_update([x1, y1, x2, y2]: number[])  {
      line.setAttribute("x1", `${x1 * 100}`)
      line.setAttribute("y1", `${y1 * 100}`)
      line.setAttribute("x2", `${x2 * 100}`)
      line.setAttribute("y2", `${y2 * 100}`)


      head.setAttribute("points", calculate_arrow_head(x1 * 100, y1 * 100, x2 * 100, y2 * 100))
    }

    function on_color([color, width]: [string, number]) {
      line.setAttribute("stroke", color)
      line.setAttribute("stroke-width", `${width}`)

      head.setAttribute("stroke", color)
      head.setAttribute("stroke-width", `${width}`)
    }

    let _xyxy = [0, 0, 0, 0]
    if (typeof pull_pos === 'function') {
      pull_pos(on_update)
    } else {
      Anims.pos({
        start: [pull_pos[0], pull_pos[1]],
        end: snap_u_coord([pull_pos[0], pull_pos[1]]).map(_ => _/ 8 + 0.5/8) as [number, number],
        dur: 0.26,
        update: (([x, y]) => {
          _xyxy[0] = x
          _xyxy[1] = y

          on_update(_xyxy)
        })
      })
      Anims.pos({
        start: [pull_pos[2], pull_pos[3]],
        end: snap_u_coord([pull_pos[2], pull_pos[3]]).map(_ => _/ 8 + 0.5/8) as [number, number],
        dur: 0.26,
        update: (([x, y]) => {
          _xyxy[2] = x
          _xyxy[3] = y
          on_update(_xyxy)
        })
      })
    }

    if (typeof pull_brush === 'function') {
      pull_brush(on_color)
    } else {
      on_color(pull_brush)
    }


    const get_export = (): ArrowExport => {
      if (typeof pull_pos === 'function' || typeof pull_brush === 'function') {
        return [[0, 0, 0, 0], 'green']
      }
      let xy = snap_u_coord([pull_pos[0], pull_pos[1]])
      let xy2 = snap_u_coord([pull_pos[2], pull_pos[3]])
      return [[...xy, ...xy2], pull_brush[0]]
    }

    return new Arrow(svg, get_export)
  }

  get export() {
    return this.get_export()
  }

  constructor(readonly svg: SVGElement, readonly get_export: () => ArrowExport) {}
}

type ArrowExport = [XYXY2, string]
type CircleExport = [XY, string]

type Fen = string

class ArrowManager {
  
  static init = () => {
    let el = document.createElement('arrows')

    let circle: Circle | undefined

    let in_dom = false
    let on_xy: (_: XYXY2) => void
    let on_brush: (_: Brush) => void
    let arrow = Arrow.init(((cb: (_: XYXY2) => void) => {
      on_xy = cb
     }), ((cb: (_: Brush) => void) => on_brush = cb))
    
     let snap_arrows = new Map<string, Arrow>()
     let snap_circles = new Map<string, Circle>()
    Draws.d = {
      on_down(x, y) {
        if (circle) {
          circle.svg.remove()
        }

        circle = Circle.init([x, y], [get_color_from_modifiers(), 1])
        el.appendChild(circle.svg)
      },
      on_down_end(x: number, y: number) {
        if (circle) {
          let key = snap_u_coord([x, y]).join('-')

          if (snap_circles.has(key)) {
            let a = snap_circles.get(key)!
            a.svg.remove()
            snap_circles.delete(key)
            push_arrows()
          } else {
  
            let a = Circle.init(snap_u_coord([x, y]).map(_ => _/8 + 0.5/8) as XY, [get_color_from_modifiers(), 1.2])
            el.appendChild(a.svg)
            snap_circles.set(key, a)
            push_arrows()
          }
  
          circle.svg.remove()
          circle = undefined
        }
  
      },
      on_move(x, y, x2, y2) {

        if (circle) {
          circle.svg.remove()
          circle = undefined
        }



        if (!in_dom) {
          el.appendChild(arrow.svg)
          in_dom = true
        }
        on_xy?.([x, y, x2, y2])
        on_brush([get_color_from_modifiers(), 1])
      },
      on_move_end(x, y, x2, y2) {
        if (in_dom) {
          arrow.svg.remove()
          in_dom = false
        }

        let key = [...snap_u_coord([x, y]), ...snap_u_coord([x2, y2])].join('-')

        if (snap_arrows.has(key)) {
          let a = snap_arrows.get(key)!
          a.svg.remove()
          snap_arrows.delete(key)
          push_arrows()
        } else {

          let a = Arrow.init([x, y, x2, y2], [get_color_from_modifiers(), 1.21])
          el.appendChild(a.svg)
          snap_arrows.set(key, a)
          push_arrows()
        }

      },
    }

    const on_clear = () => {
      for (let v of snap_circles.values()) {
        v.svg.remove()
      }
      for (let v of snap_arrows.values()) {
        v.svg.remove()
      }
      snap_arrows.clear()

      snap_circles.clear()

      push_arrows()
    }

     
    let res = new ArrowManager(el, on_clear)


    function push_arrows() {
      let arrows = [...snap_arrows.values()].map(_ => _.export)
      let circles = [...snap_circles.values()].map(_ => _.export)

      res.push_arrows({ arrows, circles })
    }

    return res
  }

  pcbs: ((_: AAndC) => void)[] = []


  pull_arrows(cb: (_: AAndC) => void) {
    this.pcbs.push(cb)
  }

  push_arrows(ac: AAndC) {
    this.pcbs.forEach(_ => _(ac))
  }


  clear() {
    this.on_clear()
  }

  constructor(readonly el: HTMLElement, 
    readonly on_clear: () => void) {}
}


class Piece implements UserEx {

  init() {}
  flip() {}
  random(){}
  shake() {}
  snap() {}
  fen(fen: string) { console.log(fen)}
  clear() {}

  static init = (p: string) => {
    let color = p.toUpperCase() === p ? 'white' : 'black'
    let role = 'pawn'
    switch (p.toUpperCase()) {
      case "R": { role = "rook" } break;
      case "N": { role = "knight" } break;
      case "B": { role = "bishop" } break;
      case "Q": { role = "queen" } break;
      case "K": { role = "king" } break;
      case "P": { role = "pawn" } break;
      case "D": { role = "duck" } break;
    }

    let pce = document.createElement('piece')
    pce.classList.add(color, role)

    let pcb: PieceCb;

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

    const scale_angle = (sr: [number, number]) => {
      _scale = sr[0]
      _angle = sr[1]
      _transform()
    }

    const lerp_10 = (end: [number, number]) => {
      Anims.cancel()
      let a = 0.8
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
    

    let _s10: PosCb = {
        start: [_scale, _angle],
        end: [0.9, hhh_pi],
        dur: 0.2,
        update: scale_angle
      }
    const s10 = () => {
      _s10.start = [_scale, _angle]
      Scales.pos(_s10)
    }

    const s10_rev = () => {
      Scales.cancel_one(_s10)
      Scales.pos({
        start: [_scale, _angle],
        end: [1, 0],
        dur: 0.1,
        update: scale_angle
      })
    }

    let q_ch: QCh = () => [p, [Math.ceil((_pos[0] + 0.5/8) * 8), Math.ceil((_pos[1] + 0.5/8) * 8)]]

    let xs_cb = {
      q_ch,
      on_x_hover: function (): void {
        s10()
      },
      on_x_hov_end: function(): void {
        s10_rev()
      },
      on_x_drop: function (): void {
        _on_drop()
      }
    }


    let fs_cb = {
      q_ch,
      translate: function (_pos: [number, number]): void {
        t20(_pos)
      },
      drop() {
        _on_drop()
      }
    }

    let _orig = _pos

    let ds_cb: DragCb = {
      q_pos: () => [_pos[0] + 0.5/8, _pos[1] + 0.5/8],
      on_click: function (_pos: [number, number]): void {
        Anims.cancel()
        t20(snap_u_coord(_pos).map(_ => (_/8)) as XY)
      },
      on_hover: function (_pos: [number, number]): void {
        _pos = [_pos[0] - 0.5/8, _pos[1] - 0.5/8]
      },
      on_down: function (_pos: [number, number]): void {
        let orig = snap_u_coord(_pos)
        _orig = orig
        let key = Orients.coord_to_key(orig)
        _pos = [_pos[0] - 0.5/8, _pos[1] - 0.5/8]
        t20(_pos)

        Highs.select_piece(key)
        pce.classList.add('drag')
      },
      on_drag: function (_pos: [number, number]): void {
        _pos = [_pos[0] - 0.5/8, _pos[1] - 0.5/8]
        lerp_10(_pos)
        Xs.on_drag(xs_cb)
      },
      on_drop: function (_pos: [number, number]): void {
        Anims.cancel()

        let orig = _orig
        let dest = snap_u_coord(_pos)

        Xs.on_drag_end()

        if (Highs.can_dest(Orients.coord_to_key(orig), Orients.coord_to_key(dest))) {
          t20(dest.map(_ => (_/8)) as XY)
          Xs.on_drop(xs_cb)

          Highs.last_move([Orients.coord_to_key(orig), Orients.coord_to_key(dest)])

          Fens.push_fen()
        } else {
          t20(orig.map(_ => (_/8)) as XY)
        }



        pce.classList.remove('drag')
        Highs.deselect()
      }
    }

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
      s10_rev()
    }

    const fen = (_fen: string) => {
      console.log(_fen)
    }

    const _on_drop = () => {
      Xs.pop(xs_cb)
      Fens.pop(fs_cb)
      Drags.pop(ds_cb)
      Pieces.pop(pcb)
    }

    const _on_init = () => {
      Xs.push(xs_cb)
      Fens.push(fs_cb)
      Drags.push(ds_cb)
      Pieces.push(pcb)
    }

    pcb = {
      el: pce,
      init,
      flip,
      random,
      shake,
      snap,
      fen,
      clear() {}
    }

    _on_init()
  }

}



type RCb = {
  el: HTMLElement,
  flip: () => void
}

class RanksManager {

  ps: RCb[] = []

  ranks: HTMLElement

  constructor() {
    this.ranks = document.createElement('ranks')
  }

  push(r: RCb) {
    this.ps.push(r)
    this.ranks.appendChild(r.el)
  }

  flip() {
    this.ps.forEach(_ => _.flip())
  }
}


type FCb = {
  el: HTMLElement,
  flip: () => void
}

class FilesManager {

  ps: FCb[] = []

  files: HTMLElement

  constructor() {
    this.files = document.createElement('files')
  }

  push(r: FCb) {
    this.ps.push(r)
    this.files.appendChild(r.el)
  }

  flip() {
    this.ps.forEach(_ => _.flip())
  }
}


type PieceCb = UserEx & {
  el: HTMLElement
}

class PieceManager implements UserEx {

  recycle: PieceCb[] = []

  ps: PieceCb[] = []

  pieces: HTMLElement

  constructor() { 
    this.pieces = document.createElement('pieces')
  }

  pop(pcb: PieceCb) {

    let i = this.ps.indexOf(pcb)
    if (i > -1) {
      this.pieces.removeChild(pcb.el)
      this.ps.splice(i, 1)
    }
  }

  push(p: PieceCb) {
    this.ps.push(p)
    this.pieces.append(p.el)
  }

  random() {
    this.ps.forEach(_ => _.random())
  }
  shake() {
    this.ps.forEach(_ => _.shake())
  }
  snap() {
    this.ps.forEach(_ => _.snap())
  }
  fen(fen: string) {
    this.ps.forEach(_ => _.fen(fen))
  }

  init() {
    this.ps.forEach(_ => _.init())
  }

  flip() {
    this.ps.forEach(_ => _.flip())
  }

  clear() {}
}

interface UserEx {
  init: () => void;
  flip: () => void;
  random: () => void;
  shake: () => void;
  snap: () => void;
  fen: (fen: string) => void
  clear: () => void
}

export class Shess implements UserEx {

  static init = (): Shess => {

    let ss = document.createElement('shess')
    ss.classList.add('is2d')
    let { ranks } = Ranks
    let { files } = Files
    let { pieces } = Pieces
  
    ss.appendChild(files)
    ss.appendChild(ranks)

    let board = document.createElement('board')
    ss.appendChild(board)

    board.appendChild(pieces)
    board.appendChild(Arrows.el)


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


    const on_mouse_move = (ev: MouseEvent, _p: [number, number]) => { 
      Modifiers.ctrl = ev.ctrlKey
      Modifiers.alt= ev.altKey
      Modifiers.shift = ev.shiftKey

      Drags.move = _p 
      Draws.move = _p;
    }
    const on_mouse_down = (ev: MouseEvent, _p: [number, number]) => { 
      Modifiers.ctrl = ev.ctrlKey
      Modifiers.alt= ev.altKey
      Modifiers.shift = ev.shiftKey
      if (ev.button === 0) {
        Arrows.clear()
        Drags.down = _p 
      } else {
        Draws.down = _p; 
      }
    }
    const on_mouse_up = (_ev: MouseEvent, _p: [number, number]) => { 
      Drags.up = _p 
      Draws.up = _p; 
    }

    document.addEventListener('mousemove', (ev: MouseEvent) => on_mouse_move(ev, norm_ev_position(ev)))
    document.addEventListener('mousedown', (ev: MouseEvent) => on_mouse_down(ev, norm_ev_position(ev)))
    document.addEventListener('mouseup', (ev: MouseEvent) => on_mouse_up(ev, norm_ev_position(ev)))
    document.addEventListener('contextmenu', (ev: MouseEvent) => ev.preventDefault())

    '12345678'.split('').map((r: string) => {
      let s = document.createElement('rank')
      let t = document.createTextNode(r)
      s.appendChild(t)
  
 
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

      Ranks.push({
        el: s,
        flip
      })
  
    })
  
    'abcdefgh'.split('').map((f: string) => {
      let s = document.createElement('file')
      let t = document.createTextNode(f)
      s.appendChild(t)

  
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

      Files.push({
        el: s,
        flip
      })
    })
  
  

    /*
    let pieces = 'RNBQKBNRPPPPPPPPrnbqkbnrpppppppp'
    //pieces = 'R'
    pieces.split('').map((p: string) => Piece.init(p))
    */

    const init = () => {
      Pieces.init()
      on_bounds()
    }

    const flip = () => {
      Anims.imm_end()
      Orients.flip()
      Files.flip()
      Ranks.flip()
      Pieces.flip()
    }

    const random = () => { 
      Pieces.random()
    }

    const shake = () => { 
      Pieces.shake()
    }

    const snap = () => {
      Pieces.snap()
     }

    const fen = (fen: string) => {
      Fens.fen(fen)
    }
    const clear = () => {
      Arrows.clear()
    }

    let ux = {
      init,
      flip,
      random,
      shake,
      snap,
      fen,
      clear
    }


    return new Shess(ss, ux)
  }

  constructor(readonly el: HTMLElement, readonly ux: UserEx) {}


  last_move(lm: Key[]) {
    Highs.last_move(lm)
  }

  dests(dests: { [key: string]: string[] }) {
    Highs.dests = dests
  }

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

  fen(fen: string) {
    this.ux.fen(fen)
  }

  clear() {
    this.ux.clear()
  }


  pull_arrows(cb: (_: AAndC) => void) {
    Arrows.pull_arrows(cb)
  }


  pull_fen(cb: (_: Fen) => void) {
    Fens.pull_fen(cb)
  }

}

//type PullT<T> = (cb: (_: T) => void) => void
type AAndC = { arrows: ArrowExport[], circles: CircleExport[] }

type QCh = () => [string, [number, number]]

type XCb = {
  q_ch: () => [string, [number, number]],
  on_x_hover: () => void,
  on_x_drop: () => void
  on_x_hov_end: () => void
}

class CaptureManager {
  
  ps: XCb[] = []

  _hovering?: XCb;

  pop(p: XCb) {
    let i = this.ps.indexOf(p)
    if (i > -1) {
      this.ps.splice(i, 1)
    }
  }

  push(p: XCb) {
    this.ps.push(p)
  }

  on_drag_end() {
    if (this._hovering) {
      this._hovering.on_x_hov_end()
      this._hovering = undefined
    }
  }

  on_drag(p: XCb) {
    let _hovering;

    for (let x of this.ps) {
      if (x === p) { continue }

      if (distance(p.q_ch()[1], x.q_ch()[1]) < 0.5) {
        _hovering = x
        break;
      }
    }

    if (_hovering) {
      if (this._hovering) {
        if (this._hovering != _hovering) {
          this._hovering.on_x_hov_end()
          this._hovering = _hovering
          this._hovering.on_x_hover()
        }
      } else {
        this._hovering = _hovering
        this._hovering.on_x_hover()
      }
    } else {
      if (this._hovering) {
        this._hovering.on_x_hov_end()
        this._hovering = undefined
      }
    }
  }

  on_drop(p: XCb) {
    for (let x of this.ps) {
      if (x === p) { continue }

      if (distance(p.q_ch()[1], x.q_ch()[1]) < 0.5) {
        x.on_x_drop()
        break;
      }
    }

  }


}

type FenCb = {
  q_ch: () => [string, [number, number]],
  translate: (p: [number, number]) => void
  drop: () => void
}

class FenManager {

  pfbs: ((_: Fen) => void)[] = []


  get_piece_by_key(key: Key) {
    return this.ps.find(_ => {
      let _key = _.q_ch()[1]
      _key = [_key[0] - 1, _key[1] - 1]
      return arr_eq(_key, Orients.key_to_coord(key))
    })
  }


  pull_fen(cb: (_: Fen) => void) {
    this.pfbs.push(cb)
  }

  push_fen() {
    this.pfbs.forEach(_ => _(this.get_fen()))
  }


  get_fen() {

    let { hl, lh } = Orients;

    let res: string[] = []

    let chs = this.ps.map(_ => _.q_ch())

    hl.forEach(ri => {
      let rr = ''
      let ss = 0
      lh.forEach(fi => {
        let ch = chs.find(_ => arr_eq(_[1], [fi, ri]))

        if (ch) {
          let spaces = ss === 0 ? '' : ss
          rr += spaces + ch[0]
          ss = 0
        } else {
          ss++;
        }
      })
      let spaces = ss === 0 ? '' : ss
      res.push(rr + spaces)
    })


    return res.join('/')
  }


  ps: FenCb[] = []


  pop(p: FenCb) {
    let i = this.ps.indexOf(p)
    if (i > -1) {
      this.ps.splice(i, 1)
    }
  }


  push(p: FenCb) {
    this.ps.push(p)
  }

  fen(fen: string) {

    let { hl, lh } = Orients;

    let needs: [string, [number, number]][] = []

    let [pieces] = fen.split(' ')

    pieces.split('/').forEach((ps: string, irank: number) => {
      let ifile = 0
      for (let ch of ps) {

        if ('RNBQKPrnbqkp'.includes(ch)) {

          needs.push([ch, [lh[ifile], hl[irank]]])

          ifile += 1
        } else if ('12345678'.includes(ch)) {
          ifile += parseInt(ch)
        }
      }
    })


    if (false && !needs.find(_ => _[0] === 'd')) {
      needs.push(['d', [4, 4]])
    }

    let moves: [FenCb, [string, [number, number]]][] = []

    let has = this.ps.slice(0)

    let miss = needs.filter(n => {
      let i = has.findIndex(h => h.q_ch()[0] === n[0])
      if (i === -1) {
        return true
      } else {
        has.splice(i, 1)
        return false
      }
    })

    miss.forEach(_ => Piece.init(_[0]))

    has = this.ps.slice(0)

    let run_again = true
    while (run_again) {
      run_again = false

      let has_mins = needs.map(n => {

        let p_min = has[0], min = 88

        has.forEach((_) => {
          let e = _.q_ch()
          if (n[0] === e[0]) {
            let v = distance(n[1], e[1])
            if (v < min) {
              min = v
              p_min = _
            }
          }
        })

        return {n, p_min, min }
      })

      has_mins.sort((a, b) => a.min - b.min)

      has_mins.forEach(({n, p_min }) => {
        let i = has.indexOf(p_min)
        if (i > -1) {
          let i2 = needs.indexOf(n)
          needs.splice(i2, 1)
          has.splice(i, 1)
          moves.push([p_min, n])
        } else {
          run_again = true
        }
      })
    }

    let xtras = has

    xtras.forEach(_ => _.drop())

    moves.forEach(([p, n]) => {

      let pos = [Math.floor((n[1][0] - 1)) / 8, Math.floor((n[1][1] - 1)) / 8] as XY
      p.translate(pos)
    })
  }
}


const pi = Math.PI
//const h_pi = pi / 2
//const hh_pi = pi / 4
const hhh_pi = pi / 6

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
      if (!this._move) {
        this.d.on_click(u)
      } else {
        this.d.on_drop(u)
      }
    }
    this._up = u
    this._move = undefined
    this._down = undefined
    this.d = undefined
  }

  ds: DragCb[] = []



  pop(p: DragCb) {
    let i = this.ds.indexOf(p)
    if (i > -1) {
      this.ds.splice(i, 1)
    }
  }

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
        let outs = self.ps.filter(v => v._value![4] >= v.dur)

        outs.forEach(v =>
          v.update([v.end[0], v.end[1]]))

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

  cancel_one(p: PosCb) {
    let i = this.ps.indexOf(p)
    if (i > -1) {
      p.update(p.end)
      this.ps.splice(i, 1)
    }
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

type Modifiers = {
  ctrl: boolean,
  shift: boolean,
  alt: boolean
}
const Modifiers: Modifiers = { ctrl: false, alt: false, shift: false}

const Draws = new DrawManager()
const Scales = new AnimationManager()
const Anims = new AnimationManager()
const Drags = new DragManager()
const Fens = new FenManager()
const Xs = new CaptureManager()

const Ranks = new RanksManager()
const Files = new FilesManager()
const Pieces = new PieceManager()
const Orients = new OrientsManager()

const Arrows = ArrowManager.init()
const Squares = SquareManager.init()
const Highs = new HighlightsManager()

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

