const newGameButton = document.querySelector('.js-new-game-button');
const playerCardsContainer = document.querySelector('.js-player-cards-container');
const chipCountContainer = document.querySelector('.js-chip-count-container');
const potContainer = document.querySelector('.js-pot-container');
const betArea = document.querySelector('.js-bet-area');
const betSlider = document.querySelector('#bet-amount');
const betSliderValue = document.querySelector ('.js-slider-value');
const betButton = document.querySelector ('.js-bet-button');


let {
    deckId,
    playerCards,
    playerChips,
    computerChips,
    pot
} = getInitialState();

function getInitialState(){
    return {
        deckId : null,
        playerCards : [],
        playerChips : 100,
        computerChips : 100,
        pot : 0
    }
}

function initialize (){({
    deckId,playerCards, playerChips = 100, computerChips = 100, pot} = getInitialState());}

function canBet(){
    return playerCards.length === 2 && playerChips > 0 && pot === 0;
}

function renderSlider () {
    if (canBet()){
        betArea.classList.remove('invisible');
        betSlider.setAttribute('max',playerChips);
        betSliderValue.innerText = betSlider.value;
    } else {
        betArea.classList.add('invisible');
    }
}

function renderPlayerCards(){
    let html='';

    for(let card of playerCards){
        html += `<img src="${card.image}" alt="${card.code}" />`;
    }

    playerCardsContainer.innerHTML=html;
}

function renderChips() {
    chipCountContainer.innerHTML =`
        <div class="chip-count">Player chips: ${playerChips}</div>
        <div class="chip-count">Computer chips: ${computerChips}</div>`;}

function renderPot(){
    potContainer.innerHTML = `
        <div class="chip-count">Pot: ${pot}</div>`;
}

function render(){
    renderPlayerCards();
    renderChips();
    renderPot();
    renderSlider ();
}

function drawAndRenderPlayerCards(){
    if (deckId== null)return;
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
        .then(data => data.json())
        .then(function(response){
            playerCards = response.cards;
            render();
        });
}

function startGame() {
    initialize();
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
        .then(data => data.json())
        .then(function(response){
            deckId=response.deck_id;
            drawAndRenderPlayerCards();
        });
}

function bet(){
    const betValue=Number(betSlider.value);
    pot+= betValue;
    playerChips-=betValue;
    render();
}



newGameButton.addEventListener('click', startGame);
betSlider.addEventListener('change', render);
betButton.addEventListener('click', bet);
initialize();
render();