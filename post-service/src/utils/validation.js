import Joi from 'joi';
export const postCreateSchema = Joi.object({
    content: Joi.string().min(3).max(5000).required(),
    mediaIds: Joi.array().items(Joi.string()).optional()
})