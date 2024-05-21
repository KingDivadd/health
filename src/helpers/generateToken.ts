const jwt = require('jsonwebtoken');
import { jwt_secret, jwt_lifetime } from "./constants";

interface JwtPayload {
    [key: string]: string | any;
}

const gen_token = (payload: JwtPayload, jwt_useful_life: string = jwt_lifetime || '') => {
    return jwt.sign(payload, jwt_secret, {
        expiresIn: jwt_useful_life
    });
}

export default gen_token;
