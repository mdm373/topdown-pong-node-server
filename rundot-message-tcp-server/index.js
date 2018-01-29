const getServerListener = require('./server-listener');
const cloneMerge = require('./utility/object-clone-merge');
const defaultConfig = require('./utility/object-get-frozen')({
    endDelim : String.fromCharCode(3),
    startDelim : String.fromCharCode(2),
    pollPeriod : 100,
    host : "0.0.0.0",
    port : 1337
});

module.exports = (processorFactory, config)=>{
    const defaultedConfig = cloneMerge(defaultConfig, config);
    const server = require('net').createServer({}, getServerListener(processorFactory, defaultedConfig));
    const port = defaultedConfig.port;
    const host = defaultedConfig.host;
    server.listen( {port, host}, ()=>{
        console.log("run-dot message tcp server up and running on port " + port);
    });
};
