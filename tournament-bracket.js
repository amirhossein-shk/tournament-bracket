function tournamentBracket(userConfig) {
    const config = {
        targetId: 'tournament-bracket',
        distance: 42,
        ...userConfig,
    }

    let round = config.matches.round1?.length * 2;
    let roundIdNumber = 1;
    const container = document.getElementById(config.targetId);

    const flexContainer = document.createElement("div");
    flexContainer.className = "tournament-bracket-container";

    container.appendChild(flexContainer);

    function computeSpaceAroundPositions(column, items) {
        if (items.length === 0) return [];

        const totalItemsHeight = 94 * items.length;
        const freeSpace = column.offsetHeight - totalItemsHeight;

        return (freeSpace / items.length);
    }


    const createPlayerTemplate = (player, className, isWinner) => {
        const element = document.createElement("div");

        const avatarAndNameContainerElement = document.createElement("div");

        const avatarElement = document.createElement("img");
        avatarElement.className = "avatar";
        avatarElement.src = player.avatarUrl && player.avatarUrl !== "" ? player.avatarUrl : "./images/avatar.png";
        avatarAndNameContainerElement.appendChild(avatarElement);

        const nameElement = document.createElement("div");
        nameElement.className = "name";
        nameElement.textContent = player.name;
        avatarAndNameContainerElement.appendChild(nameElement);

        avatarAndNameContainerElement.className = "avatar-and-name-container";
        element.appendChild(avatarAndNameContainerElement);

        const scoreElement = document.createElement("div");
        scoreElement.className = "score";
        scoreElement.textContent = player.score;
        element.appendChild(scoreElement);

        const winnerClassName = isWinner && "player-winner";
        element.classList.add("tournament-bracket-player", className);
        winnerClassName && element.classList.add(winnerClassName);

        element.style.minWidth = config.width + "px";

        return element;
    }

    const generateTemplate = (matches, roundNumber) => {
        const column = document.createElement('div');
        column.className = "tournament-bracket-column";
        column.style.gap = config.distance + "px";

        const matchDivs = matches.map((item, index) => {
            const div = document.createElement('div');
            div.id = item.matchId;
            div.className = 'match-container';

            const vsElement = document.createElement("div");
            vsElement.className = "player-vs";
            vsElement.textContent = "VS";
            div.appendChild(vsElement);

            const firstPlayer = createPlayerTemplate(item.players[0], "tournament-bracket-first-player", item.players[0].score > item.players[1].score || (!item.players[0].score && !item.players[1].score) || (item.players[0].score === "-" && item.players[1].score === "-"));
            const secondPlayer = createPlayerTemplate(item.players[1], "tournament-bracket-second-player", item.players[1].score > item.players[0].score || (!item.players[0].score && !item.players[1].score) || (item.players[0].score === "-" && item.players[1].score === "-"));

            div.appendChild(firstPlayer);
            div.appendChild(secondPlayer);

            if (matches.length > 1) {
                let distance = config.distance * roundNumber;
                if (document.querySelector("#" + config.targetId + " .tournament-bracket-column")) {
                    distance = computeSpaceAroundPositions(document.querySelector("#" + config.targetId + " .tournament-bracket-column"), matches);
                }
                const element = document.createElement("div");
                element.style.height = distance + "px";
                element.style.width = config.width + 24 + "px";
                element.style.position = "absolute";
                element.style.top = (index+1)%2 === 0 ? "unset" : "46px";
                element.style.bottom = (index+1)%2 === 0 ? "46px" : "unset";
                element.style.left = config.width / 2 + "px";
                element.style.borderTop = (index+1)%2 === 0 ? "none" : "1px solid white";
                element.style.borderBottom = (index+1)%2 === 0 ? "1px solid white" : "none";
                element.style.borderRight = "1px solid white";
                element.style.borderBottomRightRadius = (index+1)%2 === 0 ? "5px" : "0px";
                element.style.borderTopRightRadius = (index+1)%2 === 0 ? "0px" : "5px";
                element.style.zIndex = "-1";
                div.appendChild(element);
            }

            return div;
        });

        matchDivs.reduce((parent, div) => (parent.appendChild(div), parent), column);
        flexContainer.appendChild(column);
    }

    const generateNextRound = (currentRound) => {
        return Array.from({ length: currentRound }).map(() => ({
            matchId: 'match-' + Math.random().toString(36).substr(2, 5),
            players: [
                {
                    name: "-",
                    avatarUrl: "",
                    score: "-",
                },
                {
                    name: "-",
                    avatarUrl: "",
                    score: "-",
                },

            ]
        }));
    }

    const calculateRounds = () => {
        while (round >= 2) {
            if (round%2 !== 0) {
                alert("round number must be an odd number")
                return;
            }

            const width = 122;
            const height = 94;
            const cardWidth = 196;
            const cardHeight = 416;

            round /= 2;

            const matches = config.matches["round" + roundIdNumber]?.length ? config.matches["round" + roundIdNumber] : generateNextRound(round);
            generateTemplate(matches, roundIdNumber);

            roundIdNumber++;

            calculateRounds();
        }
    }

    const init = () => {
        calculateRounds()
    }

    return {
        init
    }
}
