exports.stringToHex = function (str) {
    let hex = "";
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i).toString(16);
        hex += charCode.padStart(2, '0'); // Ensure each byte is represented by two characters
    }
    return `0x${hex}`;
}