const mongoose = require('mongoose');

const logout = async (req, res, { userModel }) => {
  try {
    const UserPassword = mongoose.model(userModel + 'Password');

    // const token = req.cookies[`token_${cloud._id}`];

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract the token

    // Check if req.admin exists (set by isValidAuthToken middleware)
    if (req.admin && req.admin._id) {
      if (token)
        await UserPassword.findOneAndUpdate(
          { user: req.admin._id },
          { $pull: { loggedSessions: token } },
          {
            new: true,
          }
        ).exec();
      else
        await UserPassword.findOneAndUpdate(
          { user: req.admin._id },
          { loggedSessions: [] },
          {
            new: true,
          }
        ).exec();
    }

    return res.json({
      success: true,
      result: {},
      message: 'Successfully logout',
    });
  } catch (error) {
    // Even if logout fails, return success to allow user to proceed
    return res.json({
      success: true,
      result: {},
      message: 'Successfully logout',
    });
  }
};

module.exports = logout;
