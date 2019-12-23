const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');

const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed to login',
    successRedirect: '/',
    successFlash: 'You are now logged in'
});



exports.logout = (req, res)=>{
    req.logout();
    req.flash('success', 'You are now logged out')
    res.redirect('/');
};


exports.isLoggedIn = (req,res, next)=>{
    if(req.isAuthenticated()){
        next();
        return;
    }
    req.flash('error', 'Oops you must be logged in');
    res.redirect('/login');
};




exports.update = async (req,res)=>{
    const user = await User.findOne({ 
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
     });
     if(!user){
        req.flash('error', 'password reset token is invalid or has expired');
        return res.redirect('/login');
    };

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'your password has been reset, you are now logged in');
    res.redirect('/');

};