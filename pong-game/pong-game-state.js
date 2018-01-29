
const getPlayerStateCopy = (playerState)=> {
    return {
        position : playerState.position,
        requestDir : playerState.requestDir,
        score : playerState.score
    }
};
const getBallStateCopy = (ballState) => {
    return {
        position : {x : ballState.position.x, y : ballState.position.y},
        speed : {x : ballState.speed.x, y : ballState.speed.y},
        bounceDir : ballState.bounceDir
    };
};
const isPlayerStateDirty = (playerStateA, playerStateB) => {
    return playerStateA.position  !== playerStateB.position;
};
const isBallStateDirty = (ballStateA, ballStateB) => {
    return ballStateA.position.x  !== ballStateB.position.x || ballStateA.position.y  !== ballStateB.position.y;
};
const playerType = { one : 1, two : 2};
const moveRequestType = {up : 1, down : -1, none : 0};
const getPlayerState = (state, aPlayerType) => {
    return aPlayerType === playerType.one ? state.playerOne : state.playerTwo;
};


module.exports = {
    playerType,
    moveRequestType,
    getPlayerState,
    getStateCopy : (state) => {
        return {
            playerOne : getPlayerStateCopy(state.playerOne),
            playerTwo : getPlayerStateCopy(state.playerTwo),
            ball : getBallStateCopy(state.ball)
        }
    },
    getDefaultState : (playerOneScore, playerTwoScore, playerOnePosition, playerTwoPosition) => {
        return {
            playerOne: {
                position:  playerOnePosition,
                requestDir : moveRequestType.none,
                score : playerOneScore
            },
            playerTwo : {
                position:  playerTwoPosition,
                requestDir : moveRequestType.none,
                score : playerTwoScore
            },
            ball : {
                position : {x:.5, y:.5}
            }
        };
    },
    updatePlayerStateForRequest : (state, playerType, requestDir) => {
        const playerState = getPlayerState(state, playerType);
        playerState.requestDir = requestDir;
    },
    isDirty : (stateA, stateB) => {
        return isPlayerStateDirty(stateA.playerTwo, stateB.playerTwo) ||
            isPlayerStateDirty(stateA.playerOne, stateB.playerOne) ||
            isBallStateDirty(stateA.ball, stateB.ball);
    }
};