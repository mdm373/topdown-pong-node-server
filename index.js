/*
process.on('uncaughtException', function(err) {
    console.error("Error, Uncaught Exception: : " + err);
});
*/

const gameConfig = {
    paddleSpeed : .6,
    startSpeedRange : .1,
    startSpeedMin:  .2,
    frameInterval : 20
};
const serverConfig = {
    endDelim : "__GMMSND",
    startDelim : "__GMMSST",
    pollPeriod : 100,
    host : "0.0.0.0",
    port : 1337
};
const clientHandler = require('./pong-game')(gameConfig);
require('./rundot-message-tcp-server')(clientHandler, serverConfig);



