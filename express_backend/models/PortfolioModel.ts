import mongoose, { Schema, Document, model } from "mongoose";

interface Constraints {
  maxWeightedRisk: number;
  minWeightedRisk: number;
  summedWeights: number;
}

export interface Portfolio extends Document {
  assets: string[];
  risk: number;
  constraints: Constraints;
  window: number;
}

const ConstraintsSchema = new Schema<Constraints>({
  maxWeightedRisk: { type: Number, required: true },
  minWeightedRisk: { type: Number, required: true },
  summedWeights: { type: Number, required: true },
});

const PortfolioSchema = new Schema<Portfolio>({
  assets: { type: [String], required: true },
  risk: { type: Number, required: true },
  constraints: { type: ConstraintsSchema, required: true },
  window: { type: Number, required: true },
});

const Portfolio = model<Portfolio>('Portfolio', PortfolioSchema);

export default Portfolio;
