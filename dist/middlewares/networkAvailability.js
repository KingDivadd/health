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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
const checknetworkAvailability = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        dns_1.default.resolve('www.google.com', (err) => {
            if (err) {
                return res.status(503).json({ error: 'Network unavailable, check network connection and try again' });
            }
            else {
                next();
            }
        });
    }
    catch (error) {
        // Error occurred while checking network status
        console.error('Error checking network availability:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = checknetworkAvailability;
//# sourceMappingURL=networkAvailability.js.map