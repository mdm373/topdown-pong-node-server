module.exports = (pollPeriod) =>{
    let openClientHandlers = [],
        closedClientHandlers = [],
        pollTimer = undefined;

    const processMessagesReceived = ()=>{
        for(const clientHandlerEntry of openClientHandlers){
            const messages = clientHandlerEntry.messages;
            if(messages.length > 0){
                clientHandlerEntry.clientHandler.handleMessagesReceived(messages);
                clientHandlerEntry.messages = [];
            }
        }
    };
    const shutdownClosedHandlers = ()=> {
        if(closedClientHandlers.length > 0){
            for(const closedClientHandler of closedClientHandlers){
                closedClientHandler.handleConnectionClosed();
                const handler = openClientHandlers.find( (clientHandlerDetails) => {
                    return clientHandlerDetails.clientHandler === closedClientHandler;
                });
                if(handler){
                    openClientHandlers.splice(openClientHandlers.indexOf(handler), 1);
                }
            }
            closedClientHandlers = [];
        }
    };
    const startPossiblePolling = ()=> {
        if(openClientHandlers.length === 1 && pollTimer === undefined){
            console.log("A client handler is active, polling started");
            pollTimer = setInterval(()=>{
                processMessagesReceived();
                shutdownClosedHandlers();
                if(openClientHandlers.length === 0){
                    console.log("No client handlers are active, polling stopped");
                    clearInterval(pollTimer);
                    pollTimer = undefined;
                }
            }, pollPeriod);
        }
    };
    return {
        openClientHandler : (clientHandler) => {
            const messages = [];
            const clientHandlerEntry = { clientHandler, messages };
            openClientHandlers.push(clientHandlerEntry);
            clientHandler.handleConnectionOpened();
            startPossiblePolling();
        },
        pushMessage : (clientHandler, message)=>{
            const handler = openClientHandlers.find( (clientHandlerDetails) => {
                return clientHandlerDetails.clientHandler === clientHandler;
            });
            if(handler){
                handler.messages.push(message);
            }
        },
        closeClientHandler : (handler) => {
            closedClientHandlers.push(handler);
        },
        isOpen : (handler) => {
            return closedClientHandlers.indexOf(handler) < 0;
        }
    };
};