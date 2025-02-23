import type { ServerWebSocket } from 'bun'
import { Player } from './player'
import { GameRoom } from './room'

export class GameManager {
  private players: Map<ServerWebSocket, Player> = new Map()
  private rooms: GameRoom[] = []

  addPlayer(ws: ServerWebSocket, username: string, boardSize: number) {
    const player = new Player(ws, username)
    this.players.set(ws, player)

    let availableRoom = this.rooms.find(
      (room) => room.players.length < 2 && room.getSize === boardSize
    )

    if (!availableRoom) {
      availableRoom = new GameRoom(boardSize)
      this.rooms.push(availableRoom)
      player.send({ type: 'waiting' })
    }

    availableRoom.addPlayer(player)
  }

  removePlayer(ws: ServerWebSocket) {
    const player = this.players.get(ws)
    if (player) {
      const room = this.rooms.find((r) => r.players.includes(player))
      if (room) {
        room.removePlayer(player)
        if (room.players.length === 0) {
          this.rooms = this.rooms.filter((r) => r !== room)
        }
      }
      this.players.delete(ws)
    }
  }

  handleMove(ws: ServerWebSocket, position: number) {
    const player = this.players.get(ws)
    if (player) {
      const room = this.rooms.find((r) => r.players.includes(player))
      if (room) {
        room.handleMove(player, position)
      }
    }
  }
}
