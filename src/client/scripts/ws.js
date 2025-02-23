const ws = new WebSocket(`ws://${window.location.host}`)

ws.onopen = () => {
  console.log('connection success')
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  // game
  const gameComponent = document.querySelector('memory-game')
  if (gameComponent) {
    gameComponent.handleServerMessage(message)
  }

  // header
  const headerComponent = document.querySelector('header-component')
  if (headerComponent && message.type === 'game_start') {
    headerComponent.updatePlayers(message.player, message.opponent)
  }
}

export default ws
