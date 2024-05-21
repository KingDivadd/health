"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require('jsonwebtoken');
const constants_1 = require("./constants");
const gen_token = (payload, jwt_useful_life = constants_1.jwt_lifetime || '') => {
    return jwt.sign(payload, constants_1.jwt_secret, {
        expiresIn: jwt_useful_life
    });
};
exports.default = gen_token;
//# sourceMappingURL=generateToken.js.map