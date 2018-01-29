module.exports = (toFreeze) =>{
    const frozen = Object.assign({}, toFreeze);
    Object.freeze(frozen);
    return frozen;
};