"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readableDate = void 0;
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
function readableDate(milliseconds) {
    const date = new Date(milliseconds);
    const month = date.toLocaleString("default", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();
    let hour = date.getHours() - 1;
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // 12-hour clock
    return `${month} ${day}, ${year} ${hour}:${minute}:${second} ${ampm}`;
}
exports.readableDate = readableDate;
//# sourceMappingURL=currrentDateTime.js.map