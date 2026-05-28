console.log('LinkedIn Games Solver Loaded');

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const delayBetweenEvents = 70;

const mouseDownUp = async (node) => {
    if (node) node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await sleep(10);
    if (node) node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
}

const solverBlueprintGamePuzzle = async (answer) => {

    const inp = document.querySelector('.pinpoint__input');

    if (!inp || inp.value) return;

    inp.value = answer;

    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));

    await sleep(delayBetweenEvents);

    document.querySelector('.pinpoint__submit-btn')?.click();
}

const solverCrossClimbGamePuzzle = async (answer) => {

    document.querySelectorAll(".crossclimb__guess__inner").forEach((el, idx) => {

        const inps = el.querySelectorAll("input");
        const ans = answer[idx].word;

        inps.forEach((inp, idx) => {

            if (inp.value) return;

            inp.value = ans[idx];

            inp.dispatchEvent(new Event("input", { bubbles: true }));
            inp.dispatchEvent(new Event("change", { bubbles: true }));
        });
    });
}

const overrideXhr = (window, callback) => {

    const _open = window.XMLHttpRequest.prototype.open;

    window.XMLHttpRequest.prototype.open = function (method, requestUrl) {

        this.addEventListener('load', () => {

            if (!requestUrl.includes("voyagerIdentityDashGames."))
                return;

            callback({
                responseText: this.responseText,
                requestUrl
            });
        });

        return _open.apply(this, arguments);
    };
};

overrideXhr(window, async (data) => {

    const response_data = JSON.parse(data.responseText);

    if (!response_data?.included?.[0])
        return;

    const gamePuzzle = response_data.included[0].gamePuzzle;

    if (!gamePuzzle)
        return;

    const gameName = Object.keys(gamePuzzle)
        .find(key => gamePuzzle[key] !== null);

    switch (gameName) {

        case "blueprintGamePuzzle":

            await solverBlueprintGamePuzzle(
                gamePuzzle.blueprintGamePuzzle.solutions[0]
            );

            break;

        case "crossClimbGamePuzzle":

            await solverCrossClimbGamePuzzle(
                gamePuzzle.crossClimbGamePuzzle.rungs
            );

            break;
    }
});
