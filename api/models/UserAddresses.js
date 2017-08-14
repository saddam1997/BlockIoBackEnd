module.exports = {
  
  autoCreatedAt: false,
  autoUpdatedAt: false,
    identity: 'UserAddresses',
    attributes: {
        user: {
            model: 'User'
        },
        label: {
            type: 'string'
        },
        userAddress: {
            type: 'string'
        }
    }
}
