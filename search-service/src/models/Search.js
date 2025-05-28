const mongoose = require('mongoose');

const searchPostSchema = new mongoose.Schema({
    postId: {
        type: String,
        unique: true,
        required: true
    },
    userId: {
        type: String,
        index: true,
        required: true
    },
    content: {
        type : String,
        required: true
    },
    createdAt: {
        type : Date,
        default: Date.now
    }
},
{
    timestamps: true
});

searchPostSchema.index({content : "text"});
searchPostSchema.index({createdAt: -1});

const SearchPost = mongoose.model("SearchPost",searchPostSchema);

module.exports = SearchPost;