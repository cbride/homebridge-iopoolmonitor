import { LatestMeasureModel } from './latestMeasureModel.js';
import { AdviceModel } from './adviseModel.js';

export interface PoolModel {
    id: string;
    title: string;
    latestMeasure: LatestMeasureModel;
    mode: string;
    hasAnActionRequired: boolean;
    advice: AdviceModel;
  }