"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PortfolioSchema = new mongoose_1.Schema({
    assets: { type: [String], required: true },
    window_days: { type: Number, required: true },
    constraints: {
        min_asset_weight: { type: Number, required: true },
        max_asset_weight: { type: Number, required: true },
        risk_free_rate: { type: Number, required: false }
    }
});
const Portfolio = (0, mongoose_1.model)('Portfolio', PortfolioSchema);
exports.default = Portfolio;
