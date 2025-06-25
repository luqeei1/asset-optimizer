"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ConstraintsSchema = new mongoose_1.Schema({
    maxWeightedRisk: { type: Number, required: true },
    minWeightedRisk: { type: Number, required: true },
    summedWeights: { type: Number, required: true },
});
const PortfolioSchema = new mongoose_1.Schema({
    assets: { type: [String], required: true },
    risk: { type: Number, required: true },
    constraints: { type: ConstraintsSchema, required: true },
    window: { type: Number, required: true },
});
const Portfolio = (0, mongoose_1.model)('Portfolio', PortfolioSchema);
exports.default = Portfolio;
