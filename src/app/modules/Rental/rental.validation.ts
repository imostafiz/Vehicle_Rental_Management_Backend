import Joi from 'joi';

const statuses = ['booked', 'ongoing', 'completed', 'cancelled'];

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const createRentalSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required(),
  customer_name: Joi.string().trim().max(255).required(),
  customer_phone: Joi.string().trim().max(50).required(),
  start_date: Joi.string().pattern(datePattern).required(),
  end_date: Joi.string().pattern(datePattern).required(),
});

export const updateRentalSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive(),
  customer_name: Joi.string().trim().max(255),
  customer_phone: Joi.string().trim().max(50),
  start_date: Joi.string().pattern(datePattern),
  end_date: Joi.string().pattern(datePattern),
  status: Joi.string().valid(...statuses),
}).min(1);
