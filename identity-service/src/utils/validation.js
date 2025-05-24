const Joi = require('joi');


const validationRegistration = (data) => {
    const schema = Joi.object({
        userName : Joi.string().min(3).max(50).required(),
        password: Joi.string().min(5).max(40).required(),
        email : Joi.string().email().required()
    })

    return schema.validate(data);
}

const validationLogin = (data) => {
    const schema = Joi.object({
        userName: Joi.string().min(3).max(50).required(),
        password : Joi.string().min(5).max(40).required()
    })
    return schema.validate(data);
}
module.exports = {validationRegistration,validationLogin}