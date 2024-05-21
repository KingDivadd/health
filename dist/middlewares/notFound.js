"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notFound = (req, res, next) => {
    res.status(404).json({ err: "Page not found, check url and try again" });
    next();
};
exports.default = notFound;
//# sourceMappingURL=notFound.js.map