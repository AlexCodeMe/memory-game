import ws from '../scripts/ws.js'

class MemoryGame extends HTMLElement {
  constructor() {
    super()
    this._mode = 'init'
    this._board = []
    this._currentPlayer = 0
    this._playerNumber = 0
    this._revealedTiles = new Map() // position : emoji
    this._isProcessingMove = false
  }

  connectedCallback() {
    this.render()
    this.addEventListeners()
  }

  addEventListeners() {
    if (this._mode === 'init') {
      const form = this.querySelector('.username-form')
      form.addEventListener('submit', this.handleUsernameSubmit.bind(this))
    }
  }

  handleUsernameSubmit(event) {
    event.preventDefault()
    const usernameInput = this.querySelector('input[name="username"]')
    const boardSizeInput = this.querySelector('select[name="boardSize"]')
    const username = usernameInput.value.trim()
    const boardSize = boardSizeInput.value

    if (username) {
      ws.send(JSON.stringify({ type: 'join', username, boardSize }))
      this._mode = 'waiting'
      this.render()
    }
  }

  handleServerMessage(message) {
    console.log('handleServerMessage', message)
    switch (message.type) {
      case 'waiting':
        this._mode = 'waiting'
        break
      case 'game_start':
        this._mode = 'playing'
        this._board = message.board
        this._playerNumber = message.playerNumber
        this._currentPlayer = 0
        break
      case 'reveal':
        this.revealTile(message.position, message.emoji)
        break
      case 'hide':
        this.hideTiles(message.positions)
        break
      case 'next_turn':
        this._currentPlayer = message.currentPlayer
        break
      case 'match':
        this.handleMatch(message.positions, message.currentPlayer)
        break
      case 'game_over':
        this.handleGameOver(message.winner, message.scores)
        break
      case 'opponent_left':
        this.handleOpponentLeft()
        break
    }
    this.render()
  }

  revealTile(position, emoji) {
    console.log('revealing tile', position, emoji)
    const tile = this.querySelector(`.tile[data-position="${position}"]`)
    if (tile) {
      tile.textContent = emoji
      tile.classList.add('revealed')
    }
  }

  hideTiles(positions) {
    positions.forEach((position) => {
      const tile = this.querySelector(`.tile[data-position="${position}"]`)
      if (tile) {
        tile.textContent = ''
        tile.classList.remove('revealed')
      }
    })
  }

  handleMatch(positions, currentPlayer) {
    positions.forEach((position) => {
      const tile = this.querySelector(`.tile[data-position="${position}"]`)
      if (tile) {
        tile.classList.add('matched')
        tile.classList.add(`player-${currentPlayer}-match`)
      }
    })
    this._currentPlayer = currentPlayer
  }

  handleGameOver(winner, scores) {
    this._mode = 'game_over'
    this._winner = winner
    this._scores = scores
  }

  handleOpponentLeft() {
    this._mode = 'opponent_left'
  }

  handleTileClick(tile) {
    const isCurrentPlayer = this._currentPlayer === this._playerNumber
    
    if (isCurrentPlayer && !this._isProcessingMove) {
      const position = Number.parseInt(tile.dataset.position)
      if (!tile.classList.contains('revealed') && !tile.classList.contains('matched')) {
        this._isProcessingMove = true
        ws.send(JSON.stringify({ type: 'move', position }))
        setTimeout(() => {
          this._isProcessingMove = false
        }, 1000)
      }
    }
  }

  render() {
    switch (this._mode) {
      case 'init':
        this.renderInit()
        break
      case 'waiting':
        this.renderWaiting()
        break
      case 'playing':
        this.renderPlaying()
        break
      case 'game_over':
        this.renderGameOver()
        break
      case 'opponent_left':
        this.renderOpponentLeft()
        break
    }
  }

  renderInit() {
    this.innerHTML = /*html*/ `
      <div class='name-input'>
        <h2>Enter your username</h2>
        <form class='username-form'>
          <div class='form-field'>
            <input 
              type='text' 
              name='username' 
              placeholder='Username' 
              required />
          </div>
          <div class='form-field'>
            <label for="boardSize">Board Size:</label>
            <select name='boardSize'>
              <option value="4">4x4 (8 pairs)</option>
              <option value="6">6x6 (18 pairs)</option>
              <option value="8">8x8 (32 pairs)</option>
              <option value="16" selected>16x16 (128 pairs)</option>
            </select>
          </div>
          <button type='submit'>Join Game</button>
        </form>
      </div>
    `
  }

  renderWaiting() {
    this.innerHTML = /*html*/ `
      <div class="waiting">
        <h2>Waiting for an opponent...</h2>
        <p>You'll be matched with another player soon.</p>
      </div>
    `
  }

  renderPlaying() {
    const isCurrentPlayer = this._currentPlayer === this._playerNumber
    const boardSize = Math.sqrt(this._board.length)
    console.log('renderPlaying', {
      currentPlayer: this._currentPlayer,
      playerNumber: this._playerNumber,
      isCurrentPlayer,
      boardSize,
    })
    // Only re-render if the board doesn't exist
    if (!this.querySelector('.game-board')) {
      this.innerHTML = /*html*/ `
        <div class="game-board" style="grid-template-columns: repeat(${boardSize}, 1fr); --board-size: ${boardSize}">
          ${this._board
            .map(
              (emoji, index) => /*html*/ `
            <div class="tile" data-position="${index}"></div>
          `
            )
            .join('')}
        </div>
        <div class="current-player">
          ${isCurrentPlayer ? "It's your turn" : "Opponent's turn"}
        </div>
      `

      // Add click listeners only once
      this.querySelectorAll('.tile').forEach((tile) => {
        tile.addEventListener('click', () => this.handleTileClick(tile))
      })
    } else {
      // Just update the turn indicator
      const turnIndicator = this.querySelector('.current-player')
      if (turnIndicator) {
        turnIndicator.textContent = isCurrentPlayer
          ? "It's your turn"
          : "Opponent's turn"
      }
    }
  }

  renderGameOver() {
    this.innerHTML = /*html*/ `
      <div class="game-over">
        <h2>Game Over</h2>
        <p>Winner: ${this._winner}</p>
        <div class="scores">
          ${Object.entries(this._scores)
            .map(
              ([player, score]) => `
            <div class="score">
              <strong>${player}:</strong> ${score}
            </div>
          `
            )
            .join('')}
        </div>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `
  }

  renderOpponentLeft() {
    this.innerHTML = /*html*/ `
      <div class="opponent-left">
        <h2>Opponent Left</h2>
        <p>Your opponent has left the game.</p>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `
  }
}

customElements.define('memory-game', MemoryGame)
