import {Schema, model, Model}  from 'mongoose'

const PostSchema  = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: Schema.Types.String,
        required: true,
        trim: true,
    },
    mediaIds: [
        {
            type: Schema.Types.String
        }
    ]
}, {
    timestamps: true,
})

PostSchema.index({content: "text"});

/**
 * @type {Model}
 */
const Post = model("Post", PostSchema);

export default Post;