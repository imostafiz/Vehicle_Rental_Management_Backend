import Joi from 'joi';

const statuses = ['booked', 'ongoing', 'completed', 'cancelled'];

export const createRentalSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required(),
  customer_name: Joi.string().trim().max(255).required(),
  customer_phone: Joi.string().trim().max(50).required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
});

export const updateRentalSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive(),
  customer_name: Joi.string().trim().max(255),
  customer_phone: Joi.string().trim().max(50),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso(),
  status: Joi.string().valid(...statuses),
}).min(1);
