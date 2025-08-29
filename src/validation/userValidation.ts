
const Joi = require('joi');

export const registerJoiSchema = Joi.object({
    user_name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(2).required(),
    confirm_password: Joi.string().min(2).required(),
})