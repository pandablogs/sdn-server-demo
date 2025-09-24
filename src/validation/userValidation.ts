
const Joi = require('joi');

export const registerJoiSchema = Joi.object({
    username: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(2).required(),
    confirm_password: Joi.string().min(2).required(),
})