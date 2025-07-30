import mongoose, { Schema, Document, model } from "mongoose";

interface Constraints {
  min_asset_weight: number;
  max_asset_weight: number;
  risk_free_rate?: number | null;
}

interface PortfolioDocument extends Document {
    assets: string[];
    window_days : number; 
    constraints: Constraints;
    username: string;
}

const PortfolioSchema = new Schema<PortfolioDocument>({
    assets: { type: [String], required: true },
    window_days: { type: Number, required: true },
    constraints: {
        min_asset_weight: { type: Number, required: true },
        max_asset_weight: { type: Number, required: true },
        risk_free_rate: { type: Number, required: false }
    },
    username: { type: String, required: true }
});

const Portfolio = model<PortfolioDocument>('Portfolio', PortfolioSchema);


export default Portfolio;
