(() => {
  const INITIAL_BALANCE = 1000;
  const balanceElements = document.querySelectorAll("[data-balance]");
  let balance = INITIAL_BALANCE;

  const formatNumber = (value) => new Intl.NumberFormat("cs-CZ").format(value);
  const renderBalance = () => {
    balanceElements.forEach((element) => {
      element.textContent = formatNumber(balance);
    });
    document.querySelectorAll("[data-chip-group]").forEach((group) => {
      group.querySelectorAll("[data-chip]").forEach((button) => {
        button.disabled = Number(button.dataset.chip) > balance;
      });
    });
    const rouletteSpin = document.querySelector("[data-spin]");
    if (rouletteSpin) rouletteSpin.disabled = rouletteBusy || !rouletteBet || rouletteStake > balance;
    const deal = document.querySelector("[data-deal]");
    if (deal) deal.disabled = blackjackActive || balance < 10;
    const slotsSpin = document.querySelector("[data-slots-spin]");
    if (slotsSpin) slotsSpin.disabled = slotsBusy || balance < 10;
  };

  const setMessage = (element, message, kind = "") => {
    element.textContent = message;
    element.dataset.state = kind;
  };

  const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const rouletteOrder = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const numberGrid = document.querySelector(".number-grid");
  const rouletteBets = document.querySelectorAll("[data-roulette-bet]");
  const rouletteMessage = document.querySelector("[data-roulette-message]");
  const rouletteStakeDisplay = document.querySelector("[data-roulette-stake]");
  const spinButton = document.querySelector("[data-spin]");
  const wheel = document.querySelector(".roulette-wheel");
  const wheelResult = document.querySelector("[data-wheel-result]");
  const rouletteHistory = document.querySelector(".history-list");
  let rouletteStake = 10;
  let rouletteBet = null;
  let rouletteBusy = false;
  let wheelRotation = 0;

  const sectorSize = 360 / rouletteOrder.length;
  const gradientStops = rouletteOrder.map((number, index) => {
    const color = number === 0 ? "#11845d" : redNumbers.has(number) ? "#bd244b" : "#14131a";
    return `${color} ${(index * sectorSize).toFixed(3)}deg ${((index + 1) * sectorSize).toFixed(3)}deg`;
  });
  wheel.style.background = `conic-gradient(from ${(-sectorSize / 2).toFixed(3)}deg, ${gradientStops.join(", ")})`;
  const renderWheelPockets = () => {
    wheel.querySelectorAll(".wheel-pocket").forEach((pocket) => pocket.remove());
    const radius = wheel.clientWidth * 0.365;
    rouletteOrder.forEach((number, index) => {
      const pocket = document.createElement("span");
      const angle = index * sectorSize;
      pocket.className = `wheel-pocket${number === 0 ? " green" : redNumbers.has(number) ? " red" : " black"}`;
      pocket.textContent = String(number);
      pocket.setAttribute("aria-hidden", "true");
      pocket.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)`;
      wheel.append(pocket);
    });
  };
  renderWheelPockets();
  window.addEventListener("resize", renderWheelPockets);

  for (let number = 0; number <= 36; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `number-button ${number === 0 ? "zero" : redNumbers.has(number) ? "red" : "black"}`;
    button.dataset.rouletteBet = "number";
    button.dataset.number = String(number);
    button.textContent = String(number);
    button.setAttribute("aria-label", `Vsadit virtuálně na číslo ${number}`);
    button.setAttribute("aria-pressed", "false");
    numberGrid.append(button);
  }

  const clearRouletteSelection = () => {
    document.querySelectorAll("[data-roulette-bet]").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
  };

  const selectRouletteBet = (button) => {
    if (rouletteBusy) return;
    if (rouletteStake > balance) {
      setMessage(rouletteMessage, "Na tuto sázku nemáš dost virtuálních kreditů.");
      return;
    }
    clearRouletteSelection();
    rouletteBet = {
      type: button.dataset.rouletteBet,
      number: button.dataset.number === undefined ? null : Number(button.dataset.number)
    };
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
    spinButton.disabled = false;
    const target = rouletteBet.type === "number" ? `číslo ${rouletteBet.number}` : (rouletteBet.type === "red" ? "červenou" : "černou");
    setMessage(rouletteMessage, `Tip: ${target}. Potvrď roztočení.`);
  };

  rouletteBets.forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectRouletteBet(button));
  });
  numberGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-roulette-bet]");
    if (button) selectRouletteBet(button);
  });

  document.querySelector('[data-chip-group="roulette"]').addEventListener("click", (event) => {
    const button = event.target.closest("[data-chip]");
    if (!button || button.disabled || rouletteBusy) return;
    rouletteStake = Number(button.dataset.chip);
    document.querySelectorAll('[data-chip-group="roulette"] [data-chip]').forEach((chip) => chip.classList.toggle("is-selected", chip === button));
    rouletteStakeDisplay.textContent = formatNumber(rouletteStake);
    if (rouletteBet && rouletteStake > balance) {
      rouletteBet = null;
      spinButton.disabled = true;
      clearRouletteSelection();
      setMessage(rouletteMessage, "Na tuto sázku nemáš dost virtuálních kreditů.");
    }
  });

  const rouletteColor = (number) => number === 0 ? "green" : redNumbers.has(number) ? "red" : "black";

  spinButton.addEventListener("click", () => {
    if (!rouletteBet || rouletteBusy || rouletteStake > balance) return;
    rouletteBusy = true;
    spinButton.disabled = true;
    balance -= rouletteStake;
    renderBalance();
    setMessage(rouletteMessage, "Kolo se točí…");
    const result = Math.floor(Math.random() * 37);
    const resultIndex = rouletteOrder.indexOf(result);
    wheelRotation += 720 + (360 - resultIndex * sectorSize);
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
    window.setTimeout(() => {
      const color = rouletteColor(result);
      wheelResult.textContent = String(result);
      wheelResult.style.color = color === "red" ? "#ff92ba" : color === "green" ? "#8ff0ca" : "#fff";
      const won = rouletteBet.type === "number"
        ? result === rouletteBet.number
        : color === rouletteBet.type;
      if (won) {
        const payout = rouletteBet.type === "number" ? rouletteStake * 36 : rouletteStake * 2;
        balance += payout;
        renderBalance();
        setMessage(rouletteMessage, `Padlo ${result} (${color === "red" ? "červená" : color === "black" ? "černá" : "zelená"}) — výhra ${formatNumber(payout)} kreditů!`, "win");
      } else {
        setMessage(rouletteMessage, `Padlo ${result} (${color === "red" ? "červená" : color === "black" ? "černá" : "zelená"}). Tentokrát bez výhry.`, "loss");
      }
      const historyItem = document.createElement("li");
      historyItem.className = color;
      historyItem.textContent = String(result);
      historyItem.setAttribute("aria-label", `${result}, ${color === "red" ? "červená" : color === "black" ? "černá" : "zelená"}`);
      rouletteHistory.prepend(historyItem);
      while (rouletteHistory.children.length > 8) rouletteHistory.lastElementChild.remove();
      rouletteBet = null;
      rouletteBusy = false;
      clearRouletteSelection();
      renderBalance();
      spinButton.disabled = true;
    }, 1050);
  });

  const blackjackMessage = document.querySelector("[data-blackjack-message]");
  const dealerHandElement = document.querySelector("[data-dealer-hand]");
  const playerHandElement = document.querySelector("[data-player-hand]");
  const dealerScoreElement = document.querySelector("[data-dealer-score]");
  const playerScoreElement = document.querySelector("[data-player-score]");
  const dealButton = document.querySelector("[data-deal]");
  const hitButton = document.querySelector("[data-hit]");
  const standButton = document.querySelector("[data-stand]");
  let blackjackStake = 10;
  let deck = [];
  let playerHand = [];
  let dealerHand = [];
  let blackjackActive = false;
  let hideDealerCard = false;

  document.querySelector('[data-chip-group="blackjack"]').addEventListener("click", (event) => {
    const button = event.target.closest("[data-chip]");
    if (!button || button.disabled || blackjackActive) return;
    blackjackStake = Number(button.dataset.chip);
    document.querySelectorAll('[data-chip-group="blackjack"] [data-chip]').forEach((chip) => chip.classList.toggle("is-selected", chip === button));
  });

  const newDeck = () => {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    deck = suits.flatMap((suit) => ranks.map((rank) => ({ suit, rank })));
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
    }
  };

  const handScore = (hand) => {
    let score = 0;
    let aces = 0;
    hand.forEach(({ rank }) => {
      if (rank === "A") {
        score += 11;
        aces += 1;
      } else {
        score += ["J", "Q", "K"].includes(rank) ? 10 : Number(rank);
      }
    });
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const drawCard = (hand) => hand.push(deck.pop());

  const renderHand = (element, hand, hideSecond = false) => {
    element.replaceChildren();
    hand.forEach((card, index) => {
      const node = document.createElement("div");
      if (hideSecond && index === 1) {
        node.className = "playing-card hidden-card";
        node.textContent = "✳";
      } else {
        const redSuit = ["♥", "♦"].includes(card.suit);
        node.className = `playing-card${redSuit ? " red-suit" : ""}`;
        const top = document.createElement("span");
        top.textContent = `${card.rank}${card.suit}`;
        const center = document.createElement("span");
        center.className = "card-center";
        center.textContent = card.suit;
        const bottom = document.createElement("span");
        bottom.className = "card-bottom";
        bottom.textContent = `${card.rank}${card.suit}`;
        node.append(top, center, bottom);
      }
      element.append(node);
    });
  };

  const renderHands = () => {
    renderHand(playerHandElement, playerHand);
    renderHand(dealerHandElement, dealerHand, hideDealerCard);
    playerScoreElement.textContent = playerHand.length ? String(handScore(playerHand)) : "—";
    dealerScoreElement.textContent = dealerHand.length ? (hideDealerCard ? "?" : String(handScore(dealerHand))) : "—";
  };

  const finishBlackjack = (message, result) => {
    blackjackActive = false;
    hideDealerCard = false;
    renderHands();
    hitButton.disabled = true;
    standButton.disabled = true;
    dealButton.disabled = balance < 10;
    setMessage(blackjackMessage, message, result);
    renderBalance();
  };

  dealButton.addEventListener("click", () => {
    if (blackjackActive || blackjackStake > balance) {
      setMessage(blackjackMessage, "Na tuto hru nemáš dost virtuálních kreditů.");
      return;
    }
    balance -= blackjackStake;
    renderBalance();
    newDeck();
    playerHand = [];
    dealerHand = [];
    blackjackActive = true;
    hideDealerCard = true;
    drawCard(playerHand);
    drawCard(dealerHand);
    drawCard(playerHand);
    drawCard(dealerHand);
    renderHands();
    dealButton.disabled = true;
    hitButton.disabled = false;
    standButton.disabled = false;
    const playerNatural = handScore(playerHand) === 21;
    const dealerNatural = handScore(dealerHand) === 21;
    if (playerNatural || dealerNatural) {
      hideDealerCard = false;
      renderHands();
      if (playerNatural && dealerNatural) {
        balance += blackjackStake;
        finishBlackjack("Oba máte blackjack — sázka se vrací.", "push");
      } else if (playerNatural) {
        const payout = blackjackStake * 2.5;
        balance += payout;
        finishBlackjack(`Blackjack! Vrací se sázka a výhra ${formatNumber(payout - blackjackStake)} kreditů.`, "win");
      } else {
        finishBlackjack("Dealer má blackjack. Kolo prohráváš.", "loss");
      }
    } else {
      setMessage(blackjackMessage, "Chceš další kartu, nebo zůstaneš?");
    }
  });

  hitButton.addEventListener("click", () => {
    if (!blackjackActive) return;
    drawCard(playerHand);
    renderHands();
    const score = handScore(playerHand);
    if (score > 21) finishBlackjack(`Máš ${score} — přetaženo. Dealer vyhrává.`, "loss");
    else if (score === 21) {
      setMessage(blackjackMessage, "Máš 21. Můžeš ještě stát.");
      hitButton.disabled = true;
    } else setMessage(blackjackMessage, `Máš ${score}. Další karta, nebo stát?`);
  });

  standButton.addEventListener("click", () => {
    if (!blackjackActive) return;
    hideDealerCard = false;
    while (handScore(dealerHand) < 17) drawCard(dealerHand);
    renderHands();
    const playerScore = handScore(playerHand);
    const dealerScore = handScore(dealerHand);
    if (dealerScore > 21 || playerScore > dealerScore) {
      balance += blackjackStake * 2;
      finishBlackjack(`Vyhráváš! Ty ${playerScore}, dealer ${dealerScore}.`, "win");
    } else if (playerScore === dealerScore) {
      balance += blackjackStake;
      finishBlackjack(`Remíza — sázka se vrací. Oba máte ${playerScore}.`, "push");
    } else finishBlackjack(`Dealer vyhrává ${dealerScore} ku ${playerScore}.`, "loss");
  });

  const slotSymbols = ["✦", "7", "♦", "♠", "✿"];
  const reels = document.querySelectorAll("[data-reel]");
  const slotsSpinButton = document.querySelector("[data-slots-spin]");
  const slotsMessage = document.querySelector("[data-slots-message]");
  let slotsBusy = false;

  slotsSpinButton.addEventListener("click", () => {
    const stake = 10;
    if (slotsBusy) return;
    if (balance < stake) {
      setMessage(slotsMessage, "Došly virtuální kredity. Obnov stránku pro nové demo.");
      return;
    }
    slotsBusy = true;
    slotsSpinButton.disabled = true;
    balance -= stake;
    renderBalance();
    setMessage(slotsMessage, "Reely se točí…");
    let ticks = 0;
    const animation = window.setInterval(() => {
      reels.forEach((reel) => {
        reel.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      });
      ticks += 1;
      if (ticks >= 9) {
        window.clearInterval(animation);
        const result = Array.from(reels, () => slotSymbols[Math.floor(Math.random() * slotSymbols.length)]);
        result.forEach((symbol, index) => { reels[index].textContent = symbol; });
        const counts = result.reduce((map, symbol) => map.set(symbol, (map.get(symbol) || 0) + 1), new Map());
        const maxMatches = Math.max(...counts.values());
        if (maxMatches === 3) {
          const payout = stake * 10;
          balance += payout;
          setMessage(slotsMessage, `Jackpot! ${result.join(" ")} — výhra ${payout} kreditů.`, "win");
        } else if (maxMatches === 2) {
          const payout = stake * 2;
          balance += payout;
          setMessage(slotsMessage, `Dva stejné symboly — vrací se ${payout} kreditů.`, "win");
        } else setMessage(slotsMessage, "Tentokrát bez shody. Zkus další roztočení.");
        slotsBusy = false;
        slotsSpinButton.disabled = balance < stake;
        renderBalance();
      }
    }, 95);
  });

  renderBalance();
  dealButton.disabled = false;
  hitButton.disabled = true;
  standButton.disabled = true;
  slotsSpinButton.disabled = false;
})();
