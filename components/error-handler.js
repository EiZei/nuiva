'use strict';

module.exports = function(err, res) {
    res.status(err.status || 500);
    if (process.env === 'development') {
            res.render('error', {
                message: err.message,
                error: err
            });
    } else {
        res.render('error', {
            message: err.message,
            error: err
        });
    }
};