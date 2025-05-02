
/** The service class which maintain features list */
/**
 * Imports
 */
import { FeatureDetails } from '../interfaces/featuresDetails';
import { Features } from '../types/feature';

export class FeatureConfig {

    /**
     * Details of existing feature flags
     */
    details: { [Value in Features]?: FeatureDetails} = {};

    /**
     * Feature status map
     */
    public get features(): {[Value in Features]?: boolean } {
        const result: {[Value in Features]?: boolean} = {};
        for (const key of Object.keys(this.details)) {
            result[key] = this.details[key].enabled;
        }
        return result;
    }

}

/**
 * Feature service to manage features specific flags in the code
 */
export class FeatureService {
    // Share Instance
    private static instance: FeatureService;

    public config: FeatureConfig = new FeatureConfig();

    /**
     * @description Static getter for share instance
     * @return DBManager
     */
    public static get shared(): FeatureService {
        return this.instance || (this.instance = new this());
    }

    constructor() {
        this.configure();
    }

    configure() {
        // Adding details of LocalPostInsight features
        this.config.details.LocalPostInsight = {
            enabled: true,
            createDate: '2020-08-11',
            details: 'Display post insight from google'
        };
    }

    public get features(): {[Value in Features]?: boolean } {
        return this.config.features;
    }
}

