"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const health_1 = __importDefault(require("./routes/health"));
const chat_1 = __importDefault(require("./routes/chat"));
const audit_1 = __importDefault(require("./routes/audit"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: ['https://trustchat.dev', 'https://www.trustchat.dev', 'http://localhost:3000'] }));
app.use(express_1.default.json());
app.use('/health', health_1.default);
app.use('/chat', chat_1.default);
app.post('/audit', audit_1.default);
const server = app.listen(config_1.CONFIG.PORT, () => {
    console.log(`trustchat-backend listening on port ${config_1.CONFIG.PORT}`);
});
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
