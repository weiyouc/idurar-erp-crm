const mongoose = require('mongoose');

module.exports = async function updateAdmin(req, res) {
  try {
    const Admin = mongoose.model('Admin');
    const { id } = req.params;

    const allowedFields = [
      'name',
      'surname',
      'email',
      'enabled',
      'roles',
      'department',
      'approvalAuthority'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const result = await Admin.findOneAndUpdate(
      { _id: id, removed: false },
      { $set: updates },
      { new: true }
    ).populate('roles');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `No admin found by this id: ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: `Admin updated: ${id}`
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update admin',
      error: error.message
    });
  }
};
