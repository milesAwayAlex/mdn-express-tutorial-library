var mongoose = require("mongoose");
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var AuthorSchema = new Schema({
    first_name: { type: String, required: true, maxlength: 100 },
    family_name: { type: String, required: true, maxlength: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date },
});

// virtual for author's full name
AuthorSchema.virtual("name").get(function () {
    return this.family_name + ", " + this.first_name;
});

// virtual for author's lifespan
AuthorSchema.virtual("lifespan").get(function () {
    return (
        this.date_of_death.getYear() - this.date_of_birth.getYear()
    ).toString();
});

//virtual for author's URL
AuthorSchema.virtual("url").get(function () {
    return "/catalog/author/" + this._id;
});

AuthorSchema.virtual("lifespan_formatted").get(function () {
    let birth = this.date_of_birth
        ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(
              DateTime.DATE_MED
          )
        : "unknown";
    let death = this.date_of_death
        ? DateTime.fromJSDate(this.date_of_death).toLocaleString(
              DateTime.DATE_MED
          )
        : "present/unknown";
    return birth + " - " + death;
});

// export model
module.exports = mongoose.model("Author", AuthorSchema);
