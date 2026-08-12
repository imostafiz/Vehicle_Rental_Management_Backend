import Joi from 'joi';

export const createVehicleSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  plate_number: Joi.string().trim().max(50).required(),
  category: Joi.string().trim().max(100).required(),
  daily_rate: Joi.number().positive().precision(2).required(),
});

export const updateVehicleSchema = Joi.object({
  name: Joi.string().trim().max(255),
  plate_number: Joi.string().trim().max(50),
  category: Joi.string().trim().max(100),
  daily_rate: Joi.number().positive().precision(2),
}).min(1);
