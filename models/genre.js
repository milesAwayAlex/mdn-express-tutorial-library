var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var GenreSchema = new Schema({
    name: { type: String, required: true, minlength: 3, maxlength: 100 },
});

// virtual for Genre URL

GenreSchema.virtual("url").get(function () {
    return "/catalog/genre/" + this._id;
});

// export model
module.exports = mongoose.model("Genre", GenreSchema);
