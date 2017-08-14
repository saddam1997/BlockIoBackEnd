/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var bcrypt = require('bcrypt');
module.exports = {
  schema: true,
  autoCreatedAt: false,
  autoUpdatedAt: false,
attributes: {
     email: {
       type: 'string',
       email: true,
       required: true,
       unique: true
     },
     password: {
       type: 'string'
     },
     balance: {
       type: 'float',
       defaultsTo: 0.00
     },
     userTypes: {
                 collection: 'UserTypes',
                 via: 'user',
                 defaultsTo: [{"userType":"normaluser"}]
     },
     userAddresses: {
                 collection: 'UserAddresses',
                 via: 'user',
                 defaultsTo: [{"userAddress":""}]
     },
     encryptedPassword: {
          type: 'string'
        },
        // We don't wan't to send back encrypted password either
        toJSON: function () {
          var obj = this.toObject();
          delete obj.encryptedPassword;
          return obj;
    }
},
beforeCreate : function (values, next) {
   bcrypt.genSalt(10, function (err, salt) {
     if(err) return next(err);
     bcrypt.hash(values.password, salt, function (err, hash) {
       if(err) return next(err);
       values.encryptedPassword = hash;
       next();
     })
   })
 },

 comparePassword : function (password, user, cb) {
   bcrypt.compare(password, user.encryptedPassword, function (err, match) {

     if(err) {
       console.log(" cb(err).. findOne.authenticated called.........");
       cb(err);
     }
     if(match) {
       cb(null, true);
     } else {
        console.log(" cb(else).. findOne.authenticated called.........");
       cb(err);
     }
   })
}
};
