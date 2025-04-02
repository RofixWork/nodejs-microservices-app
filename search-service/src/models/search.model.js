import {Schema, model, Model} from 'mongoose';

const SearchSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: Schema.Types.String,
        required: true,
        trim: true,
    }
}, {timestamps: true})

SearchSchema.index({postId: 1, userId: 1}, {unique: true})
SearchSchema.index({content: "text"});
SearchSchema.index({createdAt: -1})

/**
 * @type {Model}
 */
const Search = model('Search', SearchSchema);

export default Search;