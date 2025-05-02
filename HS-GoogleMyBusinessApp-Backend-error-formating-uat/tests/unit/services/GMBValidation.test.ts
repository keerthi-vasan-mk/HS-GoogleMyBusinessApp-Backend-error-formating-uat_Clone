/** Test for GMB Type validation */
import { GMBTimeInterval } from '../../../src/interfaces/gmb';
import { GMBTimeIntervalValidator, GMBLocalPostOfferValidation, GMBLocalPostEventValidation } from '../../../src/services/GMBValidation';
const validTimeInterval: GMBTimeInterval = {
    startDate: {
        year: 2020,
        month: 9,
        day: 1,
    },
    endDate: {
        year: 2020,
        month: 9,
        day: 5,
    },
    startTime: {
        hours: 8,
        minutes: 15,
    },
    endTime: {
        hours: 14,
        minutes: 59
    }
};
describe('GBMValidation', () => {
    it('should validate proper gmb time-interval with success', () => {
        const subject: any = validTimeInterval;
        const result = GMBTimeIntervalValidator.validate(subject, { abortEarly: false });
        expect(result.error).toBeUndefined();
    });

    it('should validate proper gmb time-interval with failure', () => {
        const subject: any = {
            endDate: {
                year: 2020,
                month: 9,
                day: 'hello',
            },
            startTime: {
                hours: 8,
                minutes: 15,
            },
            endTime: {
                hours: 14,
                minutes: 59
            }
        };
        const result = GMBTimeIntervalValidator.validate(subject, { abortEarly: false });
        expect(result.error).toBeDefined();
    });

    it('should validate gbm post offer data with success', () => {
        const subject: any = {
            couponCode: 'Ax56X@dc',
            redeemOnlineUrl: 'https://my.seite.co.ca/coupon',
            termsConditions: 'T&c'
        };
        const result = GMBLocalPostOfferValidation.validate(subject, { abortEarly: false });
        expect(result.error).toBeUndefined();
    });
    it('should validate gbm post offer data with success', () => {
        const subject: any = {
            redeemOnlineUrl: 'https://my.seite.co.ca/coupon',
            termsConditions: 'T&c'
        };
        const result = GMBLocalPostOfferValidation.validate(subject, { abortEarly: false });
        expect(result.error).toBeUndefined();
    });
    it('should validate gbm post offer data with success with http url', () => {
        const subject: any = {
            couponCode: 'Ax56X@dc',
            redeemOnlineUrl: 'http://ww2.seite.co/coupon?code=x1',
            termsConditions: 'T&c'
        };
        const result = GMBLocalPostOfferValidation.validate(subject, { abortEarly: false });
        expect(result.error).toBeUndefined();
    });
    it('should validate gmb post event data with success', () => {
        const subject: any = {
            title: 'Test Post',
            schedule: validTimeInterval,
        };
        const result = GMBLocalPostEventValidation.validate(subject, { abortEarly: true });
        expect(result.error).toBeUndefined();
    });
    it('should validate gmb post event data with failure', () => {
        const subject: any = {
            schedule: validTimeInterval,
        };
        const result = GMBLocalPostEventValidation.validate(subject, { abortEarly: true });
        expect(result.error).toBeDefined();
    });
});