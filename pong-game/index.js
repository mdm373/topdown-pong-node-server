module.exports = (gameConfig)=> {

    let joinIndex = 0;
    const getNewPlayerIndex = function(){
        return joinIndex++;
    };
    const matchMaker = (()=> {
        let players = [];
        let queuedPlayers = [];
        let sessions = [];
        const getSessionDetailsForPlayer = (player)=>{
            return sessions.find((session)=>{
                return session.players.indexOf(player) >= 0;
            });
        };

        return {
            handlePlayerJoined : (player) =>{
                players.push(player);
                queuedPlayers.push(player);
                console.log("player count is: " + players.length);
                if(queuedPlayers.length === 2){
                    const session =require('./pong-game-session')(queuedPlayers[0], queuedPlayers[1], gameConfig);
                    const sessionDetails = {
                        players :  [queuedPlayers[0], queuedPlayers[1]],
                        session
                    };
                    sessions.push(sessionDetails);
                    queuedPlayers = [];
                    session.init();
                }
            },
            handleBallBounce : (player, direction)=>{
                const sessionDetails = getSessionDetailsForPlayer(player);
                if(sessionDetails){
                    sessionDetails.session.handleBallBounce(player, direction);
                }
            },
            handlePlayerMove : (player, playerType, requestType) =>{
                const sessionDetails = getSessionDetailsForPlayer(player);
                if(sessionDetails){
                    sessionDetails.session.handlePlayerMove(player, playerType, requestType);
                }
            },
            handlePlayerLeft : (player) => {
                const index = players.indexOf(player);
                if(index >=0){
                    players.splice(index, 1);
                }
                const queueIndex = queuedPlayers.indexOf(player);
                if(index >=0){
                    queuedPlayers.splice(queueIndex, 1);
                }
                const sessionDetails = getSessionDetailsForPlayer(player);
                if(sessionDetails){
                    for(const sessionPlayer of sessionDetails.players){
                        if(sessionPlayer !== player){
                            sessionPlayer.kickOut();
                        }
                    }
                    sessionDetails.session.handlePlayerExit(player);
                    sessionDetails.session.term();
                    sessions.splice(sessions.indexOf(sessionDetails, 1));
                }
            }
        };
    })();

    return (sendMessages, closeConnection) => {
        const player = {
            startGameAs : (playerIndex)=>{
                sendMessages([{id:"session-start", playerIndex}]);
            },
            updateState : (state)=>{
                sendMessages( [ {id : "update-state", state} ] )
            },
            kickOut : () =>{
                closeConnection();
            }
        };
        return {

            handleConnectionOpened : () =>{
                player.id = getNewPlayerIndex();
            },
            handleMessagesReceived : (messages) => {
                for(const message of messages){
                    if(message.id === 'join-game'){
                        matchMaker.handlePlayerJoined(player);
                    } else if(message.id === 'ball-bounce') {
                        const direction = message.direction;
                        matchMaker.handleBallBounce(player, direction);
                    } else if(message.id ==="player-move") {
                        matchMaker.handlePlayerMove(player, message.playerType, message.requestType);
                    }
                }

            },
            handleConnectionClosed : () => {
                matchMaker.handlePlayerLeft(player);
            }
        };

    };
};