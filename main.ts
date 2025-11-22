namespace userconfig {
    export const ARCADE_SCREEN_WIDTH = 240
    export const ARCADE_SCREEN_HEIGHT = 180
}

class Chunk {
    blocks: number[][][]

    constructor() {
        this.fill(1)
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                for (let z = 0; z < 4; z++) {
                    this.blocks[x][y][z] = randint(1, 14)
                }
            }
        }
        this.blocks[0][0][0] = 0
    }
    
    fill(x: number) {
        this.blocks = [
            [
                [x, x, x, x],
                [x, x, x, x],
                [x, x, x, x],
                [x, x, x, x],],
            [
                [x, x, x, x],
                [x, x, x, x],
                [x, x, x, x],
                [x, x, x, x],],
            [
                [x, x, x, x],
                [x, x, x, x],
                [x, x, x, x],
                [x, x, x, x],],
            [
                [x, x, x, x],
                [x, x, x, x],
                [x, x, x, x],
                [x, x, x, x],],]
    }

    block_at(vec: number[]) {
        return this.blocks[vec[0]][vec[1]][vec[2]]
    }

    destroy_at(vec: number[]) {
        this.blocks[vec[0]][vec[1]][vec[2]] = 0
    }
}

class Player {
    pos: number[]

    forward: number[]
    right: number[]
    up: number[]

    constructor() {
        this.pos = [0, 0, 0]
        this.forward = [0, 0, 1]
        this.right = [-1, 0, 0]
        this.up = [0, 1, 0]
    }
}

function add_vec(vec1: number[], vec2: number[]) {
    let new_vec = [vec1[0] + vec2[0], vec1[1] + vec2[1], vec1[2] + vec2[2]]
    return new_vec
}

function invert_vec(vec: number[]) {
    let new_vec = [vec[0] * -1, vec[1] * -1, vec[2] * -1,]
    return new_vec
}

function constrain_vec(vec: number[], constraint = 4) {
    let new_vec = [(vec[0] + constraint) % constraint,
                   (vec[1] + constraint) % constraint,
                   (vec[2] + constraint) % constraint]
    return new_vec
}

function draw_quad(target: Image, face: string, bound_rect: number[], size: number, color: number) {
    let l = bound_rect[0]
    let t = bound_rect[1]
    let r = bound_rect[2]
    let b = bound_rect[3]
    let x = (r-l)/size
    let y = (b-t)/size
    let li = l+x
    let ti = t+y
    let ri = r-x
    let bi = b-y

    let new_img = image.create(screen.width, screen.height)
    if (face == "top") {
        new_img.fillPolygon4(l, t, r, t, ri, ti, li, ti, color)
    } else if (face == "bottom") {
        new_img.fillPolygon4(li, bi, ri, bi, r, b, l, b, color)
    } else if (face == "left") {
        new_img.fillPolygon4(l, t, li, ti, li, bi, l, b, color)
    } else if (face == "right") {
        new_img.fillPolygon4(ri, ti, r, t, r, b, ri, bi, color)
    } else if (face == "back") {
        new_img.fillRect(li, ti, Math.ceil(ri-li), Math.ceil(bi-ti), color)
    }
    target.drawTransparentImage(new_img, 0, 0)
}

function recalc_bounds(old_bounds: number[], size: number) {
    let l = old_bounds[0]
    let t = old_bounds[1]
    let r = old_bounds[2]
    let b = old_bounds[3]
    let x = (r - l) / size
    let y = (b - t) / size
    let li = l + x
    let ti = t + y
    let ri = r - x
    let bi = b - y
    let new_bounds = [li, ti, ri, bi]
    return new_bounds
}

function recalc_bounds_right(old_bounds: number[], size: number) {
    let l = old_bounds[0]
    let t = old_bounds[1]
    let r = old_bounds[2]
    let b = old_bounds[3]
    let x = (r - l) / size
    let y = (b - t) / size
    let li = l + x
    let ti = t + y
    let ri = r - x
    let bi = b - y
    // [r-2x, t, 2r-l-2x, b]
    let new_bounds = [ri-x, t, (r-l)+ri-x, b]
    return new_bounds
}

function recalc_bounds_inner_right(old_bounds: number[], size: number) {
    let l = old_bounds[0]
    let t = old_bounds[1]
    let r = old_bounds[2]
    let b = old_bounds[3]
    let x = (r - l) / size
    let y = (b - t) / size
    let li = l + x
    let ti = t + y
    let ri = r - x
    let bi = b - y
    // [r-2x, t, 2r-l-2x, b]
    let new_bounds = [li-x, ti, ri, bi]
    return new_bounds
}

function render_around(target: Image, player: Player, chunk: Chunk, mask: Chunk, pos: number[], bounds: number[], size: number) {
    let back_color = chunk.block_at(constrain_vec(add_vec(pos, player.forward)))
    draw_quad(target, "back", bounds, size, back_color)
    let floor_color = chunk.block_at(constrain_vec(add_vec(pos, invert_vec(player.up))))
    draw_quad(target, "bottom", bounds, size, floor_color)
    let ceiling_color = chunk.block_at(constrain_vec(add_vec(pos, player.up)))
    draw_quad(target, "top", bounds, size, ceiling_color)
    let left_color = chunk.block_at(constrain_vec(add_vec(pos, invert_vec(player.right))))
    draw_quad(target, "left", bounds, size, left_color)
    let right_color = chunk.block_at(constrain_vec(add_vec(pos, player.right)))
    draw_quad(target, "right", bounds, size, right_color)
}

function render_recurse(target: Image, step: number, player: Player, chunk: Chunk, mask: Chunk, pos: number[], bounds: number[], size: number) {
    if (step >= 4) return
    if (mask.block_at(pos) == 0) return
    mask.destroy_at(pos)
    let pos_forward = constrain_vec(add_vec(pos, player.forward))
    if (chunk.block_at(pos_forward) == 0) {
        let inner_bounds = recalc_bounds(bounds, size)
        render_recurse(target, step + 1, player, chunk, mask, pos_forward, inner_bounds, size)
    }
    let pos_right = constrain_vec(add_vec(pos, player.right))
    if (chunk.block_at(pos_right) == 0) {
        let right_bounds = recalc_bounds_right(bounds, size)
        render_recurse_right(target, step + 1, player, chunk, mask, pos_right, right_bounds, size)
    }
    render_around(target, player, chunk, mask, pos, bounds, size)
}

function render_recurse_right(target: Image, step: number, player: Player, chunk: Chunk, mask: Chunk, pos: number[], bounds: number[], size: number) {
    if (step >= 11) return
    if (mask.block_at(pos) == 0) return
    mask.destroy_at(pos)
    let pos_forward = constrain_vec(add_vec(pos, player.forward))
    if (chunk.block_at(pos_forward) == 0) {
        let inner_bounds = recalc_bounds_inner_right(bounds, size)
        render_recurse_right(target, step + 1, player, chunk, mask, pos_forward, inner_bounds, size)
    }
    let pos_right = constrain_vec(add_vec(pos, player.right))
    if (chunk.block_at(pos_right) == 0) {
        let right_bounds = recalc_bounds_right(bounds, size)
        render_recurse_right(target, step + 1, player, chunk, mask, pos_right, right_bounds, size)
    }
    render_around(target, player, chunk, mask, pos, bounds, size)
}


function render(player: Player, chunk: Chunk, target: Image) {
    target.fill(0)
    let mask = new Chunk()
    mask.fill(1)
    mask.destroy_at(player.pos)
    const pos_forward = constrain_vec(add_vec(player.pos, player.forward))
    const first_size = 12
    const size = 6
    const bounds = [0, 0, screen.width, screen.height]
    if (chunk.block_at(pos_forward) == 0) {
        let inner_bounds = recalc_bounds(bounds, first_size)
        render_recurse(target, 0, player, chunk, mask, pos_forward, inner_bounds, size)
    }
    render_around(target, player, chunk, mask, player.pos, bounds, first_size)
}

function animate_background(direction: String, old_image: Image, new_image: Image) {
    let combo_image = image.create(old_image.width + new_image.width, Math.max(old_image.height, new_image.height))
    if (direction == "right") {
        combo_image.drawTransparentImage(old_image, 0, 0)
        combo_image.drawTransparentImage(new_image, old_image.width, 0)
        let scroll = 0
        const scroll_per = 10
        while (scroll < screen.width) {
            scroll += scroll_per
            if (scroll > screen.width) scroll = screen.width
            scene.backgroundImage().drawImage(combo_image, 0, 0)
            combo_image.scroll(-scroll_per, 0)
            pause(1)
        }
    } else if (direction == "left") {
        combo_image.drawTransparentImage(new_image, 0, 0)
        combo_image.drawTransparentImage(old_image, new_image.width, 0)
        let scroll = 0
        const scroll_per = 10
        while (-scroll < screen.width) {
            scroll -= scroll_per
            if (-scroll > screen.width) scroll = -screen.width
            scene.backgroundImage().drawImage(combo_image, -screen.width, 0)
            combo_image.scroll(scroll_per, 0)
            pause(1)
        }
    }
}

function main() {
    let player = new Player()
    let chunk = new Chunk()
    render(player, chunk, scene.backgroundImage())

    // break block in front
    controller.A.onEvent(ControllerButtonEvent.Pressed, function() {
        chunk.destroy_at(constrain_vec(add_vec(player.pos, player.forward)))
        render(player, chunk, scene.backgroundImage())
    })

    // step forward
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        let pos_forward = constrain_vec(add_vec(player.pos, player.forward))
        if (chunk.block_at(pos_forward) == 0) {
            player.pos = pos_forward
            render(player, chunk, scene.backgroundImage())
        }
    })

    let buffer_old = image.create(screen.width, screen.height)
    let buffer_new = image.create(screen.width, screen.height)
    // turn right
    controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
        render(player, chunk, buffer_old)
        let new_right = invert_vec(player.forward)
        player.forward = player.right
        player.right = new_right

        render(player, chunk, buffer_new)
        animate_background("right", buffer_old, buffer_new)
        render(player, chunk, scene.backgroundImage())
    })
    // turn left
    controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
        render(player, chunk, buffer_old)
        let new_right = player.forward
        player.forward = invert_vec(player.right)
        player.right = new_right

        render(player, chunk, buffer_new)
        animate_background("left", buffer_old, buffer_new)
        render(player, chunk, scene.backgroundImage())
    })
}

main()