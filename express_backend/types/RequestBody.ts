
interface Constraints {
  maxWeightedRisk: number;
  minWeightedRisk: number;
  summedWeights: number;
}

export default interface RequestBody {
  assets: string[];
  risk: Number;
  constraints: Constraints;
  window: Number;
};