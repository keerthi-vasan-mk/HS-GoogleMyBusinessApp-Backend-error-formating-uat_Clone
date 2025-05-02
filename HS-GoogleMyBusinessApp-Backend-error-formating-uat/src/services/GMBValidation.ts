/** GMB Data type validation */
import * as Joi from '@hapi/joi';
import { typeValidationSchema } from '../utils/Validation';
import { GMBDate, GMBTime, GMBTimeInterval, GMBLocalPostOffer, GMBLocalPostEvent } from '../interfaces/gmb';

export const GMBDateValidationSchema: Joi.Schema = typeValidationSchema<GMBDate>({
    year: Joi.number().required(),
    month: Joi.number().required(),
    day: Joi.number().required(),
});

export const GMBTimeValidationSchema: Joi.Schema = typeValidationSchema<GMBTime>({
    hours: Joi.number().required(),
    minutes: Joi.number().required(),
    seconds: Joi.number(),
    nanos: Joi.number(),
});

export const GMBTimeIntervalValidator: Joi.Schema = typeValidationSchema<GMBTimeInterval>({
    startDate: GMBDateValidationSchema.required(),
    startTime: GMBTimeValidationSchema,
    endDate: GMBDateValidationSchema.required(),
    endTime: GMBTimeValidationSchema
});

export const GMBLocalPostEventValidation: Joi.Schema = typeValidationSchema<GMBLocalPostEvent>({
    title: Joi.string().required(),
    schedule: GMBTimeIntervalValidator
});

export const GMBLocalPostOfferValidation: Joi.Schema = typeValidationSchema<GMBLocalPostOffer>({
    couponCode: Joi.string(),
    redeemOnlineUrl: Joi.string(),
    termsConditions: Joi.string()
});

