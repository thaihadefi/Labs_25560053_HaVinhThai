const customerService = require('../services/customer.service');

exports.getOrderHistory = async (req, res, next) => {
  try {
    const history = await customerService.getOrderHistory(Number(req.params.id));
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
