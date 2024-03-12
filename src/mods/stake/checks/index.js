exports.checkContentExistence = (id, contents) => {
    const index = contents.findIndex(content => content.id === id);
    if (index !== -1) {
        return { success: true, data: contents[index], message: "", index };
    }
    return { success: false, data: {}, message: "Content not found", index };
}


exports.insufficientBalance = (sender, content, balanceOf) => {
    if ((balanceOf[sender] ?? 0) < content.amount) {
        return "INSUFFICIENT BALANCE"
    } else {
        return null
    }
}



exports.staked = (sender, content) => {
    if (content.subscribers.contains(sender)) {
        return "ALREADY_STAKED";
    } else {
        return null
    }
}