import type { Server } from 'bun'

import { GameManager } from './game/game'
import { WebSocketHandler } from './ws-handler'

const gameManager = new GameManager()
const webSocketHandler = new WebSocketHandler(gameManager)

const server: Server = Bun.serve({
  port: process.env.PORT || 1234,

  fetch(req, server) {
    if (server.upgrade(req)) {
      return
    }

    const url = new URL(req.url)
    if (url.pathname === '/' || !url.pathname.includes('.')) {
      return new Response(Bun.file('src/client/app.html'))
    }
    return new Response(Bun.file(`src/client${url.pathname}`))
  },

  websocket: {
    open: webSocketHandler.handleOpen.bind(webSocketHandler),
    message: webSocketHandler.handleMessage.bind(webSocketHandler),
    close: webSocketHandler.handleClose.bind(webSocketHandler),
    drain: webSocketHandler.handleDrain.bind(webSocketHandler),
  },
})

console.log(`Server running at http://localhost:${server.port}`)
