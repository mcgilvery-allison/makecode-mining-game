for (let i = 0; i < screen.width; i++) {
    for (let j = 0; j < screen.height; j++) {
        let color = randint(0, 15)
        scene.backgroundImage().setPixel(i, j, color)
    }
}