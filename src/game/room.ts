import { emojis as emojiconst } from '../lib/constants'
import type { Player } from './player'

export class GameRoom {
  players: Player[] = []
  private board: string[] = []
  private revealedTiles: Set<number> = new Set()
  private currentPlayerIndex = 0
  private firstMove: number | null = null
  private secondMove: number | null = null
  private boardSize: number

  constructor(boardSize: number = 6) {
    this.boardSize = boardSize
    this.initializeBoard()
  }

  get getSize(): number {
    return this.boardSize
  }

  addPlayer(player: Player) {
    if (this.players.length < 2) {
      this.players.push(player)
      if (this.players.length === 2) {
        this.startGame()
      }
    }
  }

  removePlayer(player: Player) {
    this.players = this.players.filter((p) => p !== player)
    if (this.players.length === 1) {
      this.players[0].send({ type: 'opponent_left' })
    }
  }

  startGame() {
    this.players.forEach((player, index) => {
      player.send({
        type: 'game_start',
        playerNumber: index,
        player: player.username,
        opponent: this.players[1 - index].username,
        board: this.board,
      })
    })
    this.nextTurn()
  }

  handleMove(player: Player, position: number) {
    if (
      player !== this.players[this.currentPlayerIndex] ||
      this.revealedTiles.has(position)
    ) {
      return
    }

    if (this.firstMove === null) {
      // First tile of the turn
      this.firstMove = position
      this.revealedTiles.add(position)
      this.revealTile(position)
    } else if (this.secondMove === null) {
      // Second tile of the turn
      this.secondMove = position
      this.revealedTiles.add(position)
      this.revealTile(position)

      // Check for match
      setTimeout(() => {
        if (this.board[this.firstMove!] === this.board[this.secondMove!]) {
          // Match found
          player.score++
          this.players.forEach((p) => {
            p.send({
              type: 'match',
              positions: [this.firstMove, this.secondMove],
              currentPlayer: this.currentPlayerIndex,
            })
          })
          // Current player continues their turn
        } else {
          // No match
          this.revealedTiles.delete(this.firstMove!)
          this.revealedTiles.delete(this.secondMove!)
          this.hideTiles([this.firstMove!, this.secondMove!])
          // Switch to other player
          this.currentPlayerIndex = 1 - this.currentPlayerIndex
          this.players.forEach((p) => {
            p.send({ type: 'next_turn', currentPlayer: this.currentPlayerIndex })
          })
        }
        // Reset moves for next turn
        this.firstMove = null
        this.secondMove = null

        if (this.isGameOver()) {
          this.endGame()
        }
      }, 1000)
    }
  }

  private initializeBoard() {
    const emojis = emojiconst.slice(0, (this.boardSize * this.boardSize) / 2)
    const shuffled = this.shuffleArray([...emojis, ...emojis]).slice(
      0,
      this.boardSize * this.boardSize
    )
    this.board = shuffled
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  private revealTile(position: number) {
    this.players.forEach((player) =>
      player.send({ type: 'reveal', position, emoji: this.board[position] })
    )
  }

  private hideTiles(positions: number[]) {
    this.players.forEach((player) => {
      player.send({ type: 'hide', positions })
    })
  }

  private nextTurn() {
    this.currentPlayerIndex = 1 - this.currentPlayerIndex
    this.players.forEach((player) => {
      player.send({ type: 'next_turn', currentPlayer: this.currentPlayerIndex })
    })
  }

  private isGameOver() {
    return this.revealedTiles.size === this.board.length
  }

  private endGame() {
    const winner =
      this.players[0].score > this.players[1].score
        ? this.players[0]
        : this.players[1]
    this.players.forEach((player) => {
      player.send({
        type: 'game_over',
        winner: winner.username,
        scores: {
          [this.players[0].username]: this.players[0].score,
          [this.players[1].username]: this.players[1].score,
        },
      })
    })
  }
}
