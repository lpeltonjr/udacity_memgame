const diamondIcon	= '<i class="fa fa-diamond"></i>';
const planeIcon		= '<i class="fa fa-paper-plane-o"></i>'; 
const anchorIcon	= '<i class="fa fa-anchor"></i>';
const boltIcon		= '<i class="fa fa-bolt"></i>';
const cubeIcon		= '<i class="fa fa-cube"></i>';
const leafIcon		= '<i class="fa fa-leaf"></i>';
const bicycleIcon	= '<i class="fa fa-bicycle"></i>';
const bombIcon		= '<i class="fa fa-bomb"></i>';

const cardContent	= [diamondIcon, planeIcon, anchorIcon, boltIcon, cubeIcon, leafIcon, bicycleIcon, bombIcon];

const CARD_QUANT	= 16;

//	reference to object representing unmatched card visible on the deck
let pendingCard = null;

//	states defined for an object representing a card on the deck
const HIDDEN	= 0;
const PENDING	= 1;
const MATCHED	= 2;



//***********************************************************************************
//***********************************************************************************
//
//	Event handlers
//
//***********************************************************************************
//***********************************************************************************
//	updates the time display in the scoreboard every second
function oneSecUpdate() {

	scoreObj.clockUpdate();
}

//	given an event, returns a reference to the card object corresponding to the HTML card
//	which is the event target
function pertinentCardObj(event) {

	let currCardObj = null;

	for (let i = 0; i < deckObj.cards.length; i++)
	{
		if (deckObj.cards[i].deckAssoc === event.target)
		{
			currCardObj = deckObj.cards[i];
		}
	}

	return currCardObj;
}

//	flips open a hidden card in response to a click
function openCard(event) {

	let currCardObj = pertinentCardObj(event);

	if (currCardObj !== null)
	{
		currCardObj.revealCard();
	}
	
	scoreObj.movesUpdate();
}

//	returns a card to HIDDEN with class "card" (only) at the end
//	of the mismatched animation
function shutCard(event) {

	let currCardObj = pertinentCardObj(event);

	if (currCardObj !== null)
	{
		currCardObj.state = HIDDEN;
		event.target.className = "card";
		event.target.removeEventListener("animationend", shutCard);
	}
}

//	calls a card object's method to test for a match at the end of
//	that card's flip-open animation
function testCard(event) {

	let currCardObj = pertinentCardObj(event);

	if (currCardObj !== null)
	{
		currCardObj.matchCard();
		event.target.removeEventListener("animationend", testCard);
		
		//	if all cards are matched, the game is over
		if (deckObj.gameOver() === true)
		{
			//	stop the clock and don't let any further clicks update the moves counter
			scoreObj.freezeBoard();
			//	animate the cards one last time, setting up to display the closing message
			deckObj.lastAnimation();
		}
	}
}

//	this reloads the page, effectively restarting the game
function resetGame(event) {
	document.location.reload();
}

//	this is the very end of the game
function showClosingMessage(event) {

	event.target.removeEventListener("animationend", showClosingMessage);
	
	document.querySelector(".deck").remove();
	document.querySelector(".score-panel").remove();
	document.querySelector(".final-info").classList.toggle("invisible", false);
}

//***********************************************************************************
//***********************************************************************************
//
//	Constructor funtions:	card, deck
//
//***********************************************************************************
//***********************************************************************************
function ScoreBoard() {
	
	this.moves = 0;
	this.movesElement = null;
	
	this.startTime = 0;
	this.elapsedTime = 0;
	//	create a reference to the clock string in the HTML scoreboard section
	this.timeElement = null;
	
	//	every game starts with a 3-star rating
	this.starRating = 3;
	//	default:	any game with bestMoves or fewer moves will receive a 3-star rating
	this.bestMoves = 30;
	//	default:	between bestMoves and secBestMoves, game will receive a 2-star rating;
	//				less than secBestMoves, game gets a 1-star rating
	this.secBestMoves = 40;
	
	//	this method updates the HTML star field in the scoreboard so that it represents
	//	the value of this.starRating
	this.ratingUpdate = function () {
		
		//	obtain an array consisting of references to each star element in the HTML
		let starRef = document.querySelector(".stars");
		const starArray = Array.from(starRef.children);
		
		//	starting from the left, fill-in as many stars as our starRating indicates;
		//	the remaining stars will be open
		let lclRating = this.starRating;
		for (let i = 0; i < starArray.length; i++)
		{
			if (lclRating)
			{
				starArray[i].firstElementChild.className = "fa fa-star";
				lclRating--;
			}
			else
			{
				starArray[i].firstElementChild.className = "fa fa-star-o";
			}
		}
	};
	
	//	this method is called externally to decrement the star rating
	this.demerit = function () {
		
		if (this.starRating > 1)
		{
			this.starRating--;
			this.ratingUpdate();
		}
	};
	

	
	//	this is called every 1 second from event handler "oneSecUpdate()"
	this.clockUpdate = function () {

		//	don't update the clock until necessary quantities have been initialized
		if (this.timeElement !== null)
		{
			//	obtain the number of milliseconds since the first move (click)
			this.elapsedTime = new Date().getTime() - this.startTime;
	
			//	feed that into a date creator, which will give us some date in 1970 at time
			//	00:00:00 -- we don't care about the calendar portion, just the clock portion
			const tempDate = new Date();
			tempDate.setTime(this.elapsedTime);
	
			//	use the built-in methods of the Date object to format the elapsed time for display
			//	on the scoreboard, then update the clock display; note that UTC time must be requested
			//	or the local offset from 00:00:00 will be returned
			this.timeElement.textContent = tempDate.getUTCHours().toString().padStart(2, '0') + ':' + tempDate.getUTCMinutes().toString().padStart(2, '0') + ':' + tempDate.getUTCSeconds().toString().padStart(2, '0');
		}
	};
	
	//	this must be called on any game move to ensure the clock is running
	this.startClock = function () {

		if (this.timeElement === null)
		{
			this.startTime = new Date().getTime();
			this.timeElement = document.querySelector(".timeclock");
		}
	};

	//	this method is called whenever a card is clicked
	this.movesUpdate = function () {

		if (this.movesElement !== null)
		{
			//	increment the move count and its display
			this.moves++;
			this.movesElement.textContent = this.moves.toString();
			//	call the method to start the clock on every move; it will only do something on the first move
			this.startClock();
			
			if ((this.moves === (this.bestMoves + 1)) && (this.starRating === 3))
			{
				this.demerit();
			}
			
			else if ((this.moves === (this.secBestMoves + 1)) && (this.starRating === 2))
			{
				this.demerit();
			}
		}
	};

	//	this will prevent any further updates to the displayed number of moves or the displayed time
	this.freezeBoard = function () {
		
		this.timeElement = null;
		this.movesElement = null;
	};
	
	//	this will reset the clock display and prevent any updates until the first subsequent
	//	move of the game
	this.initClock = function () {

		if (this.timeElement !== null)
		{
			this.timeElement.textContent = "00:00:00";
			this.timeElement = null;
		}
	};
	
	this.initScoreboard = function () {
		
		this.initClock();
		this.moves = 0;
		if (this.movesElement === null)
		{
			this.movesElement = document.querySelector(".move-num");
		}
		this.movesElement.textContent = this.moves.toString();
		
		//	when the restart icon is clicked, the game will be restarted via function resetGame()
		document.querySelector(".restart").addEventListener("click", resetGame);
		
		this.ratingUpdate();
	};
	
}

//	represents an individual card on the deck; each card contains a reference to an HTML
//	card element ("deckAssoc"); the HTML elements are in the fixed order of their appearance
//	in the HTML source; the card object references are contained in a fixed array within
//	the deck object; references to the HTML elements are shuffled and then assigned to the card
//	objects
function Card() {

	//	*****************************************************************************
	//	card properties
	//	*****************************************************************************
	//	reference associating this object with 1 of 16 HTML card items
	this.deckAssoc = null;
	//	string containing innerHTML for the HTML card element referenced by "deckAssoc"	
	this.visibleCard = "";
	//	by default, every card is hidden
	this.state = HIDDEN;
	//	reference to the card object containing an identical "visibleCard" property; that is, the
	//	card object that is the match to this; storing this on initialization saves processor time
	//	during execution, since no looping is required to locate the matching card
	this.pairedCard = null;

	//	*****************************************************************************
	//	card methods
	//	*****************************************************************************
	
	this.shutCard = function () {

		//	ensure this method won't do anything or blow anything up if called unexpectedly
		if ((this.deckAssoc !== null) && (this.state !== HIDDEN))
		{
			//	we're going to run an animation to close the card; final processing occurs at "animationend"
			//	note that shutCard does not refer to this method
			this.deckAssoc.addEventListener("animationend", shutCard);
			//	launch the animation by associating the HTML card with ".close" class in the stylesheet
			this.deckAssoc.className = "card close";
			return true;
		}
		return false;
	};

	this.revealCard = function () {
		
		//	ensure this method won't do anything or blow anything up if called unexpectedly
		if ((this.deckAssoc !== null) && (this.state === HIDDEN))
		{
			//	we're going to run an animation to open the card; when it is complete, a decision is to be
			//	made regarding whether the card has matched another open card; the decision will be processed
			//	by the testCard event handler, using method "matchCard" below
			this.deckAssoc.addEventListener("animationend", testCard);
			//	launch the animation by associating the HTML card with ".open" class in the stylesheet
			this.deckAssoc.className = "card open";
			//	the card state is PENDING until a determination is made whether there's a match
			this.state = PENDING;
			return true;
		}
		return false;
	};
	
	this.matchCard = function () {
		
		//	examine the state of the card whose property is an identical innerHTML string; if it
		//	is open, awaiting a match, then this is the match!
		if (this.pairedCard.state === PENDING)
		{
			//	launch the match animation for this card via the class ".match" in the stylesheet;
			//	there's no real reason to do anything at animationend, because the card will remain
			//	shown until the end of the game, and styling in the .match class need not be changed
			this.deckAssoc.className = "card match";
			this.state = MATCHED;

			//	launch the match animation for the matching card, also
			this.pairedCard.deckAssoc.className = "card match";
			this.pairedCard.state = MATCHED;

			//	remove the object reference in this global variable; it stored a reference to the
			//	visible card awaiting a match
			pendingCard = null;
		}

		//	otherwise, this is a mismatch or the first card of a pair
		else
		{
			//	if there's no reference to a pending card (either because this is the first move
			//	of the game or because the last card resulted in a match), then this becomes
			//	the pending card
			if (pendingCard === null)
			{
				pendingCard = this;
			}

			//	otherwise, there is another card visible; close both cards with the mismatch
			//	animation
			else
			{
				pendingCard.shutCard();
				this.shutCard();
				pendingCard = null;
			}
		}
	};


	//	this method is for use on initialization or reinitialization to hide a card
	//	without using the mismatch animation
	this.hideCard = function () {

		if (this.deckAssoc !== null)
		{
			this.deckAssoc.className = "card";
			return true;
		}
		return false;
	};	
}

//	this is the deck object, for containing the cards
function Deck() {
	
	//	*****************************************************************************
	//	deck properties
	//	*****************************************************************************
	//	sets size of the deck
	this.quantity = CARD_QUANT;

	//	this array of card objects represents the individual cards
	this.cards = [];
	
	//	*****************************************************************************
	//	deck methods
	//	*****************************************************************************
	
	//	this is called at game's end
	this.lastAnimation = function () {
		
		let i;
		
		//	run the match animation on all cards, setting up to display the
		//	closing message when the last card's animation is complete
		for (i = 0; i < this.cards.length; i++)
		{
			this.cards[i].deckAssoc.className = "card rematch";
		}
		i--;
		this.cards[i].deckAssoc.addEventListener("animationend", showClosingMessage);
	};
	
	//	this method returns true when all cards have been matched
	this.gameOver = function () {
		
		let result = true;

		for (let i = 0; i < this.cards.length; i++)
		{
			if (this.cards[i].state !== MATCHED)
			{
				result = false;
			}
		}
		
		return result;
	};

	//	hides all cards without animation
	this.hideAllCards = function () {

		for (let i = 0; i < this.cards.length; i++)
		{
			this.cards[i].hideCard();
		}
	};

	//	NOTE that this.createDeck must have been executed before this.shuffleDeck is called !!!!!
	this.shuffleDeck = function () {
	
		let fixdSeq = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
		let randSeq = [];
		let ridx;

		//	this implements the Fisher-Yates shuffle, adapted from a JavaScript fragment on
		//	Wikipedia; at the end, randSeq[] is a randomized copy of fixdSeq[]
		//	create a randomly ordered array of card indices
		while (fixdSeq.length !== 0) {
			ridx = Math.floor(fixdSeq.length * Math.random());
			randSeq.push(fixdSeq[ridx]);
			fixdSeq.splice(ridx, 1);
		}
		
		//console.log(randSeq);
		
		//	extract the HTML card items as an array of references
		const htmlCardRefs = document.querySelectorAll(".card");
		
		//	use the random indices to bind the JavaScript card objects to the HTML cards
		for (let i = 0; i < this.quantity; i++)
		{
			this.cards[i].deckAssoc = htmlCardRefs[(randSeq[i])];
			//	the HTML content of each card in the HTML source is meaningless because it gets
			//	replaced here
			this.cards[i].deckAssoc.innerHTML = this.cards[i].visibleCard;
			this.cards[i].state = HIDDEN;
			//	when a card is clicked, it will be opened using the openCard event handler
			this.cards[i].deckAssoc.addEventListener("click", openCard);
		}

		//	ensure all the cards are styled as hidden (".card" as the only class)
		this.hideAllCards();
		//	perform whatever other global initializations are required before game play
		pendingCard = null;
	};
	
	this.createDeck = function () {

		//	don't allow creating the deck twice!
		if (this.cards.length === 0)
		{
			for (let i = 0; i < this.quantity; i++) {

				//	create a JavaScript card object and push its reference onto the 
				//	"cards" array, which is property of this deck object
				this.cards.push(new Card());
	
				//	if this is the 2nd card of a matched pair
				if (i >= (this.quantity / 2))
				{
					//	assign innerHTML content (the fontsAwesome icon) to this card
					this.cards[i].visibleCard = cardContent[(i - (this.quantity / 2))];
					//	set the paired relationship between cards having with the same content;
					//	must set it when both cards in the pair exist
					this.cards[i].pairedCard = this.cards[(i - (this.quantity / 2))];
					this.cards[i].pairedCard.pairedCard = this.cards[i];
				}
				//	if this is the first card of a matched pair
				else
				{
					//	assign innerHTML to the card object
					this.cards[i].visibleCard = cardContent[i];
				}
			}
		}		
	};
}


//***********************************************************************************
//***********************************************************************************
//
//	script procedure -- execution starts here
//
//***********************************************************************************
//***********************************************************************************

let scoreObj = new ScoreBoard();
scoreObj.initScoreboard();
//	start a timer which calls oneSecUpdate() every second, for updating the clock display
scoreObj.timeHandle = window.setInterval(oneSecUpdate, 1000);

//	create the deck; create the cards inside it; shuffle the deck; let event handlers
//	do the rest
let deckObj = new Deck();
deckObj.createDeck();
deckObj.shuffleDeck();



