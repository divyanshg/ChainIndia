const mongoose = require("mongoose");

module.exports = () => {
    mongoose.connect(process.env.SRV, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error: "));
    db.once("open", function () {
        console.log("Connected successfully");
    });
    return db;
};