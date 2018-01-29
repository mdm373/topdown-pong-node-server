
const pongState = require('./pong-game-state');
const ball = require('./pong-game-ball');

const getCurrentSeconds = ()=> {
    const hrTime = process.hrtime();
    return hrTime[0] + hrTime[1] / 1000000000;
};

const getCurrentWinner = (state)=> {
    let winner = 0;
    if (state.ball.position.x <= 0 ) {
        winner = 2;
    } else if (state.ball.position.x >= 1) {
        winner = 1;
    }
    return winner;
};

const updateBallPhysics = (ballState, dt)=> {
    if (ballState.bounceDir === ball.dir.LEFT && ballState.speed.x < 0) {
       ballState.speed.x = -ballState.speed.x;
    }  else if (ballState.bounceDir === ball.dir.RIGHT && ballState.speed.x > 0) {
        ballState.speed.x = -ballState.speed.x;
    }  else if (ballState.position.y <= 0 && ballState.speed.y < 0) {
        ballState.speed.y = -ballState.speed.y;
    }  else if (ballState.position.y >= 1 && ballState.speed.y > 0) {
        ballState.speed.y = -ballState.speed.y;
    }
    ballState.bounceDir = ball.dir.NONE;
    ballState.position.x = ballState.position.x + dt*ballState.speed.x;
    ballState.position.y = ballState.position.y + dt*ballState.speed.y;
};

const updatePlayerPosition = (paddleSpeed, state, playerType, dt)=> {
    const increment = paddleSpeed * dt;
    const playerState = pongState.getPlayerState(state, playerType);
    if (playerState.requestDir === pongState.moveRequestType.up ) {
        playerState.position = playerState.position + increment;
    }
    else if(playerState.requestDir === pongState.moveRequestType.down) {
        playerState.position = playerState.position - increment;
    }
    playerState.position = Math.min(playerState.position, 1);
    playerState.position = Math.max(playerState.position, 0);
};

const defaultConfig = {
    paddleSpeed : .6,
    startSpeedRange : .1,
    startSpeedMin:  .2,
    frameInterval : 5
};
const getDefaultedConfig = (inConfig)=>{
    return {
        paddleSpeed: inConfig.paddleSpeed ? inConfig.paddleSpeed : defaultConfig.paddleSpeed,
        startSpeedRange: inConfig.startSpeedRange ? inConfig.startSpeedRange : defaultConfig.startSpeedRange,
        startSpeedMin: inConfig.startSpeedMin ? inConfig.startSpeedMin : defaultConfig.startSpeedMin
    }
};

module.exports = (playerOne, playerTwo, config = getDefaultedConfig(defaultConfig))=> {
    let sessionTimer = undefined;
    let lastFrameTime = undefined;
    let dt = undefined;
    let state = {};

    const broadcastStateUpdate = ()=>{
        playerOne.updateState(state);
        playerTwo.updateState(state);
    };

    const getRandomSpeedFactor = function() {
        const sign = Math.random() > .5 ? -1 : 1;
        const factor = Math.random() * config.startSpeedRange * sign;
        return factor + (config.startSpeedMin * sign);
    };

    const resetState = (playerOneScore, playerTwoScore, playerOnePosition, playerTwoPosition)=> {
        state = pongState.getDefaultState(playerOneScore, playerTwoScore, playerOnePosition, playerTwoPosition);
        state.ball.speed = {y : getRandomSpeedFactor(), x : getRandomSpeedFactor()};
        broadcastStateUpdate();
    };

    const updateDt = ()=> {
        const currentTime = getCurrentSeconds();
        dt = (currentTime - lastFrameTime);
        lastFrameTime = currentTime;
    };

    const updateSession = ()=> {
        updateDt();
        const winner = getCurrentWinner(state);
        if(winner > 0){
            const playerOneScore = winner === 1 ? state.playerOne.score+1 : state.playerOne.score;
            const playerTwoScore = winner === 2 ? state.playerTwo.score+1 : state.playerTwo.score;
            resetState(playerOneScore, playerTwoScore, state.playerOne.position, state.playerTwo.position)
        }
        else {
            const newState = pongState.getStateCopy(state);
            updateBallPhysics(newState.ball, dt);
            updatePlayerPosition(config.paddleSpeed, newState, pongState.playerType.one, dt);
            updatePlayerPosition(config.paddleSpeed, newState, pongState.playerType.two, dt);
            if (pongState.isDirty(state, newState)) {
                broadcastStateUpdate();
            }
            state = newState;
        }
    };

    return {
        init : ()=>{
            playerOne.startGameAs(pongState.playerType.one);
            playerTwo.startGameAs(pongState.playerType.two);
            lastFrameTime = getCurrentSeconds();
            resetState(0, 0, .5, .5);
            sessionTimer = setInterval(updateSession, config.frameInterval);
        },
        term : () =>{
            if(sessionTimer){
                clearInterval(sessionTimer);
                sessionTimer = undefined;
            }
        },
        handleBallBounce : (player, direction) => {
          if(player === playerOne){
              state.ball.bounceDir = direction;
          }
        },
        handlePlayerMove : (player, playerType, requestType)=>{
            if(player === playerOne && playerType === pongState.playerType.one ||
                player === playerTwo && playerType === pongState.playerType.two ){
                pongState.updatePlayerStateForRequest(state, playerType, requestType);
            }
        },
        handlePlayerExit : (exitingPlayer) =>{

        }
    }
};