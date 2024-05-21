"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function convertedDatetime(milliseconds) {
    let currentDateInMillis;
    if (milliseconds) {
        currentDateInMillis = typeof milliseconds === 'string' ? parseFloat(milliseconds) : milliseconds;
    }
    else {
        currentDateInMillis = new Date().getTime();
    }
    return currentDateInMillis;
}
exports.default = convertedDatetime;
//# sourceMappingURL=currrentDateTime.js.map