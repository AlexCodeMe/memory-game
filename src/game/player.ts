import type { ServerWebSocket } from 'bun'

export class Player {
  ws: ServerWebSocket
  username: string
  score = 0

  constructor(ws: ServerWebSocket, username: string) {
    this.ws = ws
    this.username = username
  }

  send(data: any) {
    this.ws.send(JSON.stringify(data))
  }
}
