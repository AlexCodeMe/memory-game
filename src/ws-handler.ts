import type { ServerWebSocket } from 'bun'
import type { GameManager } from './game/game'

export class WebSocketHandler {
  private gameManager: GameManager

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager
  }

  handleOpen(ws: ServerWebSocket) {
    console.log('client connected')
  }

  handleMessage(ws: ServerWebSocket, message: string) {
    console.log('message received on server')
    const data = JSON.parse(message)
    switch (data.type) {
      case 'join':
        this.gameManager.addPlayer(ws, data.username, data.boardSize)
        break
      case 'move':
        this.gameManager.handleMove(ws, data.position)
        break
      default:
        console.log('unknown message type', data.type)
    }
    console.log('message processed on server')
  }

  handleClose(ws: ServerWebSocket) {
    this.gameManager.removePlayer(ws)
    console.log('a client disconnected')
  }

  handleDrain(ws: ServerWebSocket) {
    console.log('websocket drained')
  }
}
