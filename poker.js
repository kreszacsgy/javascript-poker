const newGameButton = document.querySelector('.js-new-game-button');
const potContainer = document.querySelector('.js-pot-container');

const playerCardsContainer = document.querySelector('.js-player-cards-container');
const playerChipContainer = document.querySelector('.js-player-chip-container');
const playerStatusContainer= document.querySelector('.js-player-status-container');
const betArea = document.querySelector('.js-bet-area');
const betSlider = document.querySelector('#bet-amount');
const betSliderValue = document.querySelector ('.js-slider-value');
const betButton = document.querySelector ('.js-bet-button');

const betPotButton = document.querySelector(".js-betpot");
const bet25Button = document.querySelector(".js-bet25");
const bet50Button = document.querySelector(".js-bet50");

const computerCardsContainer = document.querySelector('.js-computer-cards-container');
const computerChipContainer = document.querySelector('.js-computer-chip-container');
const computerStatusContainer= document.querySelector('.js-computer-status-container');
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
    playerStatus,       //játékos státuszinformációja (győzött vesztett, döntetlen, bedobta)
    computerChips,      //gép zsetonjai
    computerBets,       //gép licitje ebben a körben
    computerStatus,     //számítógép státuszinformációja
    playerBetPlaced,    //játékos már licitált
    pot                 //kassza
    timeoutIds,         //setTimout ID lista
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
        playerStatus:"",
        computerChips : 100,
        computerBets:0,
        computerStatus: "",
        playerBetPlaced:false,
        pot : 0
    }
}

//Állapotmenedzsment TODO: új leosztás indításánál ezeket az értékeket érdemes
//frissíteni
//deckId=null;
//playerBets= 0;
//computerBets=0;
//playerCards = [];
//computerCards=[];
//computerAction=null;
//playerBetPlaced=false;
//playerStatus = "",
//computerStatus = "";
//computerAction = "";
// Gyakorlatilag mindent resetelünk, kivéve a zsetonállást.

function initialize (){
    for (let id of timeoutIds){
        clearTimeout(id);
    }
    ({
        deckId,
        playerCards,
        computerCards,
        communityCards,
        computerAction,
        playerChips,
        playerBets,
        playerStatus,
        computerChips,
        computerBets,
        computerStatus,
        playerBetPlaced,
        pot,
        timeoutIds
    } = getInitialState());
        // A bet slider állapota csak a DOM-ban van rögzítve Hozzuk alapértelmezésbe.
        betSlider.value = 1;
        // Feltételezzük, hogy később az alapértelmezett értékeket máshol renderelni fogjuk,
        //ezért a slider értékét itt nem kell renderelni
    }

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
        html += `<img src="${card.image}" alt="${card.code}" class="card-image"/>`;
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

function renderStatusInfo(){
    playerStatusContainer.innerHTML=playerStatus;
    computerStatusContainer.innerHTML=computerStatus;
}

function render(){
    renderAllCards();
    renderChips();
    renderPot();
    renderSlider();
    renderAction();
    renderStatusInfo();
}

async function drawPlayerCards(){
    if (deckId== null)return;
    const data = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
    const response = await data.json();
    playerCards = response.cards;
    
}

function postBlinds(){
    playerChips-=1;
    playerBets+=1;
    computerChips-=2;
    computerBets+=2;
    pot+=3;
    render();
}

async function startHand(){
    postBlinds(); //vaktétek adminisztrálása
    const data = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
    const response= await data.json();
    deckId=response.deck_id;
    await drawPlayerCards();
    render();
}

function startGame() {
    initialize();
    startHand();
}

function endHand(winner=null){
    const id = setTimeout(()=> {
            if (computerAction === ACTIONS.Fold){
                playerChips+= pot;
                pot=0;
            } else  if (winner=== STATUS.Player){
                playerChips+= pot;
                pot=0;
            }else if (winner === STATUS.Computer){
                computerChips+=pot;
                pot=0;
            } else if(winner === STATUS.Draw){
                playerChips+=playerBets;
                computerChips+=computerBets;
                pot=0;
            }
           
            render();

    },2000);
    timeoutIds.push(id);
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

const SHOWDOWN_API_PREFIX = "https://api.pokerapi.dev/v1/winner/texas_holdem";
function cardsToString(cards){
    return cards.map(x=> x.code[0]==='0'?'1'+ x.code:x.code).toString();
}
async function getWinner(){
    const cc = cardsToString(communityCards);
    const pc0 = cardsToString(playerCards);
    const pc1 = cardsToString(computerCards);
    const data = await fetch (`${SHOWDOWN_API_PREFIX}?cc=${cc}&pc[]=${pc0}&pc[]=${pc1}`);
    const response = await data.json();
    const winners = response.winners;
    if( winners.length === 2){
        return STATUS.Draw;
    } else if (winners [0].cards === pc0){
        return STATUS.Player;
    } else{
        return STATUS.Computer;
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

async function computerMoveAfterBet(){
    const data = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
    const response = await data.json();
    if(pot === 4){
        computerAction = ACTIONS.Check;
    }
    else if (shouldComputerCall(response.cards)) {
        computerAction = ACTIONS.Call;
    }
    else {
        computerAction = ACTIONS.Fold;
    }
    if(computerAction === ACTIONS.Call){
        computerAction='Call';
        computerCards = response.cards;
        const difference=playerBets-computerBets;
        computerChips -= difference;
        computerBets += difference;
        pot+=difference;
    }

    if(computerAction === ACTIONS.Check || computerAction == ACTIONS.Call){
        computerCards = response.cards;
        render();
        const winner= await showdown();
        if (winner=== STATUS.Player){
           playerStatus=STATUS.Player;
        } else if (winner === STATUS.Computer){
           computerStatus = STATUS.Computer; 
        } else if (winner === STATUS.Draw){
            playerStatus = STATUS.Draw;
            computerStatus = STATUS.Draw;
        }
        endHand(winner);
    } else { // ComputerFolded
        playerStatus = STATUS.Player;
        
        render();
        endHand();
    }
   
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

function getPlayerPotBet(){
    let difference = computerBets - playerBets;
    return Math.min(playerChips, pot + 2*difference);
}

function setSliderValue(percentage){
    let betSize =null;
    if (typeof percentage === 'number'){
        betSize = Math.floor(playerChips * percentage/100);
    } else {
        betSize = getPlayerPotBet();
    }

    betSlider.value = betSize;
    render();
}


newGameButton.addEventListener('click', startGame);
betSlider.addEventListener('change', render);
betSlider.addEventListener('input', render);
betPotButton.addEventListener('click', () => setSliderValue());
bet25Button.addEventListener('click', () => setSliderValue(25));
bet50Button.addEventListener('click', () => setSliderValue(50));

betButton.addEventListener('click', bet);
initialize();
render();