class Header extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    this.render()
  }

  updatePlayers(player, opponent) {
    const playersBox = this.querySelector('.header__players-box')
    playersBox.innerHTML = /*html*/ `
              <div>${player}</div>
              <div>vs</div>
              <div>${opponent}</div>
    `
  }

  render() {
    this.innerHTML = /*html*/ `
            <header class='header-component'>
                <h1>Memory Game</h1>
                <div class='header__players-box'></div>
            </header>
    `
  }
}

customElements.define('header-component', Header)
