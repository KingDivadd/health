"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const handleDatabaseError = (error, req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (error instanceof Error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
    console.log('good to go');
    next();
});
exports.default = handleDatabaseError;
//# sourceMappingURL=databaseUnavailable.js.map