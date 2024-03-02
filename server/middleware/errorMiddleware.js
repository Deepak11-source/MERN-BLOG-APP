//Unsupported 404 routes
const notFound = (req, res, next) => {
    const error = new Error("Not Found - " + req.originalUrl);
    res.status(404);
    next(error);
};

//Middleware to handle Error
const errorHandler = (error, req, res, next) => {
    if(res.headersSent) {
        return next(error);
    }
    res.status(error.status || 500).json({message: error.message || "An unknown error occured"})
}

module.exports = {notFound, errorHandler}