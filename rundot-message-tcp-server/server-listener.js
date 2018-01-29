const cloneMerge = require('./utility/object-clone-merge');
const clientHandlerTemplate = require('./client-handler');
const sendTerminator = String.fromCharCode(10);


module.exports= (clientHandlerFactory, config) =>{
    const clientHandlersManager = require('./client-handler-manager')(config.pollPeriod);
    const trimLength = config.endDelim.length;
    const getClientHandler = (socket) =>{
        let clientHandler = undefined;
        const sendMessagesToClient = (messages) => {
            if(clientHandlersManager.isOpen(clientHandler) && messages.length > 0){
                let outBuffer = "";
                for(const message of messages){
                    outBuffer += config.startDelim + JSON.stringify(message) + config.endDelim;
                }
                socket.write(outBuffer + sendTerminator);
            }
        };
        const closeClientConnection = () => {
          if(clientHandlersManager.isOpen(clientHandler)){
              clientHandlersManager.closeClientHandler(clientHandler);
              socket.destroy();
          }
        };
        clientHandler = cloneMerge(clientHandlerTemplate, clientHandlerFactory(sendMessagesToClient, closeClientConnection));
        return clientHandler;
    };
    return (socket) => {
        socket.setEncoding("utf8");
        const clientHandler = getClientHandler(socket);
        clientHandlersManager.openClientHandler(clientHandler);

        {
            let inBuffer = "";
            socket.on('data', data => {
                inBuffer = inBuffer + data;
                if (inBuffer.endsWith(config.endDelim)) {
                    const messagesData = inBuffer.split(config.startDelim);
                    for (const messageData of messagesData) {
                        if (messageData.length > 0) {
                            const trimmedData = messageData.substr(0, messageData.length - trimLength);
                            inBuffer = "";
                            const message = JSON.parse(trimmedData);
                            clientHandlersManager.pushMessage(clientHandler, message);
                        }
                    }
                }
            });
        }

        socket.on('close', ()=>{
            clientHandlersManager.closeClientHandler(clientHandler);
        });

        socket.on('error', (error) =>{
            if(error.code !== "ECONNRESET"){
                console.error("Error from socket: " + JSON.stringify(error));
            }
        });

    };
};