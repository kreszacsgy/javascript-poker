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
const communityCardsContainer= document.querySelector('.js-community-cards');


let {
    deckId,             
    playerCards,        //játékos lapjai
    computerCards,      //számítógáp lapjai
    communityCards,     //közös lapok
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
        communityCards: [],
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
        communityCards,
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
    renderCardsInContainer(communityCards,communityCardsContainer);
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

function endHand(winner=null){
        setTimeout(()=> {
            if (computerAction === 'Fold'){
                //TODO:felsorolt típus kell az akcióknak
                playerChips+= pot;
                pot=0;
            } else  if (winner=== 'Player'){
                playerChips+= pot;
                pot=0;
            }else if (winner ==='Computer'){
                computerChips+=pot;
                pot=0;
            } else if(winner ==='Draw'){
                playerChips+=playerBets;
                computerChips+=computerBets;
                pot=0;
            }
            deckId=null;
            playerBets= 0;
            computerBets=0;
            playerCards = [];
            computerCards=[];
            computerAction=null;
            playerBetPlaced=false;
            render();

        },2000);
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

const SHOWDOWN_API_PREFIX = "https://api.pokerapi.dev/v1/winner/texas_holdem?";
function cardsToString(cards){
    return cards.map(x=> x.code[0]==='0'? '1'+canBet.code:x.code).toString();
}
async function getWinner(){
    const cc = cardsToString(communityCards);
    const pc0 = cardsToString(playerCards);
    const pc1 = cardsToString(computerCards);
    const data = await fetch (`${SHOWDOWN_API_PREFIX};cc=${cc}&pc[]=${pc0}&pc[]=${pc1}`);
    const response = await data.json();
    const winners = response.winners;
    if( winners.length === 2){
        return 'Draw'; // TODO: felsorolt típus
    } else if (winners [0].cards === pc0){
        return 'Player';
    } else{
        return 'Computer';
    }
}

async function showdown (){
    const data = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=5`);
    const response = await data.json();
    communityCards = response.cards;
    render();
    const winner= await getWinner();
    return winner;
}

function computerMoveAfterBet(){
    if (deckId== null)return;
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
        .then(data => data.json())
        .then(async function(response){
            if(pot === 4){
                computerAction ='Check';
            }
            else if (shouldComputerCall(response.cards)) {
                computerAction ='Call';
            }
            else {
                computerAction = 'Fold';
            }
            if(computerAction = 'Call'){
                computerAction='Call';
                computerCards = response.cards;
                const difference=playerBets-computerBets;
                computerChips -= difference;
                computerBets += difference;
                pot+=difference;
            }

            if(computerAction === 'Check' || computerAction == 'Call'){
                computerCards = response.cards;
                render();
                const winner= await showdown();
                console.log(winner);
               endHand(winner);
            } else {
                render();
                endHand();
            }
            
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