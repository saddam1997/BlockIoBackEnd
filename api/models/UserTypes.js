module.exports = {
  autoCreatedAt: false,
  autoUpdatedAt: false,
    identity: 'UserTypes',
    attributes: {
        user: {
            model: 'User'
        },
        userType: {
            type: 'string'
        }
    }
}
