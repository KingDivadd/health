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
const uuid_1 = require("uuid");
const generateToken_1 = __importDefault(require("./generateToken"));
const prisma_1 = require("./prisma");
const jwt = require('jsonwebtoken');
class RedisFunc {
    constructor() {
        this.redisCallStore = (user_id, availability, useful_time) => __awaiter(this, void 0, void 0, function* () {
            try {
                const uuid = (0, uuid_1.v4)();
                const token = (0, generateToken_1.default)({ availability });
                yield prisma_1.redis_client.set(`${user_id}`, JSON.stringify(token), 'EX', 3600);
                return user_id;
            }
            catch (err) {
                console.error('Error in redisAuthStore:', err);
                throw err;
            }
        });
        this.redisStore = ({ user, life_time }) => __awaiter(this, void 0, void 0, function* () {
            try {
                const uuid = (0, uuid_1.v4)();
                const token = (0, generateToken_1.default)({ user });
                if (life_time) {
                    yield prisma_1.redis_client.set(`${uuid}`, JSON.stringify(token), 'EX', life_time / 1000);
                }
                else {
                    yield prisma_1.redis_client.set(`${uuid}`, JSON.stringify(token));
                }
                return uuid;
            }
            catch (err) {
                console.error('Error in redisAuthStore:', err);
                throw err;
            }
        });
        this.redisSignupStore = (user) => __awaiter(this, void 0, void 0, function* () {
            try {
                const uuid = (0, uuid_1.v4)();
                const token = (0, generateToken_1.default)({ user });
                yield prisma_1.redis_client.set(`${uuid}`, JSON.stringify(token));
                return uuid;
            }
            catch (err) {
                console.error('Error in redisAuthStore:', err);
                throw err;
            }
        });
        this.redisAuthStore = (user, useful_time) => __awaiter(this, void 0, void 0, function* () {
            try {
                const uuid = (0, uuid_1.v4)();
                const token = (0, generateToken_1.default)({ user });
                yield prisma_1.redis_client.set(`${uuid}`, JSON.stringify(token), 'EX', useful_time);
                return uuid;
            }
            catch (err) {
                console.error('Error in redisAuthStore:', err);
                throw err;
            }
        });
        this.redisOtpStore = (email, sent_otp, status, useful_time) => __awaiter(this, void 0, void 0, function* () {
            try {
                const token = (0, generateToken_1.default)({ email, sent_otp, status });
                yield prisma_1.redis_client.set(`${email}`, JSON.stringify(token), 'EX', useful_time);
            }
            catch (err) {
                console.error('Error in redisOtpStore:', err);
                throw err;
            }
        });
        this.redisOtpUpdate = (email, status) => __awaiter(this, void 0, void 0, function* () {
            try {
                const token = (0, generateToken_1.default)({ email, status });
                yield prisma_1.redis_client.set(`${email}`, JSON.stringify(token), 'EX', 60 * 60);
            }
            catch (err) {
                console.error('Error in redisOtpStore:', err);
                throw err;
            }
        });
        this.redisOtpVerificationStatus = (status) => __awaiter(this, void 0, void 0, function* () {
            try {
                const uuid = (0, uuid_1.v4)();
                yield prisma_1.redis_client.set(`${uuid}`, status);
                return uuid;
            }
            catch (err) {
                console.error('Error in redisStore:', err);
                throw err;
            }
        });
        this.redisDataDelete = (uuid) => __awaiter(this, void 0, void 0, function* () {
            try {
                const remove_data = yield prisma_1.redis_client.del(uuid);
                return remove_data;
            }
            catch (err) {
                console.error('Error in redisDataDelete:', err);
                throw err;
            }
        });
        this.redisValueUpdate = (uuid, user, useful_time) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data_exist = yield prisma_1.redis_client.get(`${uuid}`);
                if (!data_exist) {
                    this.redisAuthStore(user, useful_time);
                }
                else {
                    const token = (0, generateToken_1.default)({ user });
                    const update_redis = yield prisma_1.redis_client.set(`${uuid}`, JSON.stringify(token), 'EX', useful_time);
                    return uuid;
                }
            }
            catch (err) {
                console.error('Error in redis data update : ', err);
                throw err;
            }
        });
    }
}
exports.default = new RedisFunc;
//# sourceMappingURL=redisFunc.js.map