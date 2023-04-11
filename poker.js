const newGameButton = document.querySelector('.js-new-game-button');
const potContainer = document.querySelector('.js-pot-container');
const betArea = document.querySelector('.js-bet-area');
const betSlider = document.querySelector('#bet-amount');
const betSliderValue = document.querySelector ('.js-slider-value');
const betButton = document.querySelector ('.js-bet-button');
const playerCardsContainer = document.querySelector('.js-player-cards-container');
const playerChipContainer = document.querySelector('.js-player-chip-container');
const computerCardsContainer = document.querySelector('.js-computer-cards-container');
const computerChipContainer = document.querySelector('.js-computer-chip-container');
const computerActionContainer= document.querySelector('.js-computer-action');



let {
    deckId,             
    playerCards,        //játékos lapjai
    computerCards,      //számítógáp lapjai
    computerAction,     //játékos cselekedete (call, fold)
    playerChips,        //játékos zsetonjai
    playerBets,         //játékos licitje ebben a körben
    computerChips,      //gép zsetonjai
    computerBets,       // gép licitje ebben a körben
    playerBetPlaced,    //játékos már licitált
    pot                 //kassza
} = getInitialState();

function getInitialState(){
    return {
        deckId : null,
        playerCards : [],
        computerCards:[],
        computerAction: null,
        playerChips : 100,
        playerBets: 0,
        computerChips : 100,
        computerBets:0,
        playerBetPlaced:false,
        pot : 0
    }
}

function initialize (){
    ({
        deckId,
        playerCards,
        computerCards,
        computerAction,
        playerChips,
        playerBets,
        computerChips,
        computerBets,
        playerBetPlaced,
        pot} = getInitialState());}

function canBet(){
    return playerCards.length === 2 && playerChips > 0 && playerBetPlaced === false;
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

function renderCardsInContainer(cards, container){
    let html='';

    for(let card of cards){
        html += `<img src="${card.image}" alt="${card.code}" />`;
    }

    container.innerHTML=html;
}

function renderAllCards(){
    renderCardsInContainer(playerCards, playerCardsContainer);
    renderCardsInContainer(computerCards, computerCardsContainer);
}


function renderChips() {
    playerChipContainer.innerHTML =`
        <div class="chip-count">Játékos: ${playerChips} zseton</div>`;
    computerChipContainer.innerHTML =`
        <div class="chip-count">Számítógép: ${computerChips} zseton</div>`;}

function renderPot(){
    potContainer.innerHTML = `
        <div class="chip-count">Pot: ${pot}</div>`;
}

function renderAction(){
    
    computerActionContainer.innerHTML=computerAction ?? "";
}

function render(){
    renderAllCards();
    renderChips();
    renderPot();
    renderSlider();
    renderAction();
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

function postBlinds(){
    playerChips-=1;
    playerBets+=1;
    computerChips-=2;
    computerBets+=2;
    pot+=3;
    render();
}

function startHand(){
    postBlinds(); //vaktétek adminisztrálása
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
        .then(data => data.json())
        .then(function(response){
            deckId=response.deck_id;
            drawAndRenderPlayerCards();})
}

function startGame() {
    initialize();
    startHand();
    }

function shouldComputerCall(computerCards){
    if (computerCards.length !=2) return false;
    const card1Code= computerCards[0].code;
    const card2Code= computerCards[1].code;
    const card1Value=card1Code[0];
    const card2Value=card2Code[0];
    const card1Suit=card1Code[1];
    const card2Suit=card2Code[1];
    return card1Value == card2Value ||
           ['0','J','K','Q','A'].includes(card1Value)||
           ['0','J','K','Q','A'].includes(card2Value)||
           (card1Suit==card2Suit && Math.abs(Number(card1Value)-Number(card2Value))<=2);
}

function computerMoveAfterBet(){
    if (deckId== null)return;
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
        .then(data => data.json())
        .then(function(response){
            if(pot===4){
                computerAction='Check';
                computerCards = response.cards;
            }else if(shouldComputerCall(response.cards)){
                computerAction='Call';
                computerCards = response.cards;
                const difference=playerBets-computerBets;
                computerChips -= difference;
                computerBets += difference;
                pot+=difference;
            } else {
                computerAction='Fold';
            }
            render();
        });
}

function bet(){
    const betValue=Number(betSlider.value);
    pot+= betValue;
    playerChips-=betValue;
    playerBetPlaced=true;
    playerBets+=betValue;
    render();
    computerMoveAfterBet();
}



newGameButton.addEventListener('click', startGame);
betSlider.addEventListener('change', render);
betButton.addEventListener('click', bet);
initialize();
render();