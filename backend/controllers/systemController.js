
const systemService = require('../services/systemServiceBackend');

const resetTransactionalData = async (req, res, next) => {
    try {
        const result = await systemService.resetTransactionalData();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { resetTransactionalData };
