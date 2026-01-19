const mongoose = require('mongoose');

module.exports = async function listAdmins(req, res) {
  try {
    const Admin = mongoose.model('Admin');

    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.items || 10, 10);
    const skip = page * limit - limit;
    const { sortBy = 'created', sortValue = -1 } = req.query;

    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
    const searchQuery = req.query.q;

    let searchFilter = {};
    if (fieldsArray.length > 0 && searchQuery) {
      searchFilter = {
        $or: fieldsArray.map(field => ({
          [field]: { $regex: new RegExp(searchQuery, 'i') }
        }))
      };
    }

    const query = {
      removed: false,
      ...searchFilter
    };

    const [result, count] = await Promise.all([
      Admin.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortValue })
        .populate('roles')
        .exec(),
      Admin.countDocuments(query)
    ]);

    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    return res.status(200).json({
      success: true,
      result,
      pagination,
      message: count > 0 ? 'Successfully found all documents' : 'Collection is Empty'
    });
  } catch (error) {
    console.error('List admins error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving admins',
      error: error.message
    });
  }
};
