exports.checkContentValidity = (data) => {
    if (!data.title) {
        return "Invalid title";
    } else if (!data.content) {
        return "Invalid content"
    } else if (data.amount === null || data.amount === undefined) {
        return "Invalid amount"
    }
    else if (!data.type) {
        return "Invalid type"
    }
    else if (!data.date) {
        return "Invalid date"
    } else {
        return null
    }

}