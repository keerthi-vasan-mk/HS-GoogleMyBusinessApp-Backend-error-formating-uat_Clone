import { FeatureService } from '../../../src/services/FeatureService';

describe('Feature Services', () => {
    it('should create default feature service', () => {
        expect(FeatureService.shared).toBeDefined();
    });

    it('should return true for local post insight feature', () => {
        expect(FeatureService.shared.features.LocalPostInsight).toEqual(true);
    });
});