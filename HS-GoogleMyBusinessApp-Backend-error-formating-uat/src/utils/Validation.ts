/** Data Validation */
import * as Joi from '@hapi/joi';

/**
 * Application Specific type definition of Joi base validation schema
 */
export type ValidationSchema = Joi.AnySchema | Joi.AnySchema[];
export type TypeValidationRules<T> = {[K in keyof T]?: ValidationSchema};

/**
 * Type abstraction function over Joi schema object. This method create typescript base type validation over Joi.Schema object
 * @param schemaValidationOptions schema Joi validation rules based on type key
 */
export function typeValidationSchema<T>(schemaValidationOptions: TypeValidationRules<T>): Joi.Schema {
  return Joi.object(schemaValidationOptions);
}
