const Post = require("../models/postModel");
const User = require("../models/userModels");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/errorModel");

//Create a Post
//POST : api/posts
//PROTECTED
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return next(
        new HttpError("Fill in all fields and choose thumbnail", 422)
      );
    }
    const { thumbnail } = req.files;
    if (thumbnail.size > 5000000 ) {
      return next(
        new HttpError("Thumbnail too big. File should be less than 5mb")
      );
    }
    const filename = thumbnail.name;
    const splittedFileName = filename.split(".");
    const newFileName =
      splittedFileName[0] +
      uuid() +
      "." +
      splittedFileName[splittedFileName.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "/uploads", newFileName),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            creator: req.user.id,
            thumbnail: newFileName,
          });
          if (!newPost) {
            return next(new HttpError("Post couldn't be created", 422));
          }
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

//Get all Post
//GET : api/posts
//UNPROTECTED
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAy: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//Get Single Post
//GET : api/posts/:id
//UNPROTECTED
const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found", 404));
    }
    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//Get Post By Category
//Get : api/posts/categories/:category
//UNPROTECTED
const getCatPosts = async (req, res, next) => {
  try {
    const {category} = req.params;
    const catPosts = await Post.find({category}).sort({createdAt: -1});
    if (!catPosts) {
      return next(new HttpError("Post not found", 404));
    }
    res.status(200).json(catPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//Get USER/AUTHOR POST
//Get : api/posts/users/:id
//UNPROTECTED
const getUserPosts = async (req, res, next) => {
  try {
    const {id} = req.params;
    const posts = await Post.find({creator: id}).sort({createdAt: -1});
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//EDIT POST
//PATCH : api/posts/:id
//PROTECTED
const editPost = async (req, res, next) => {
  try {
    let fileName;
    let newFileName;
    let updatedPost;
    const postId = req.params.id;
    let { title, category, description } = req.body;

    if (!title || !category || description.length < 12) {
      return next(new HttpError("Fill in all fields", 422));
    }
    const oldPost = await Post.findById(postId);
    if(req.user.id == oldPost.creator) {
        if (!req.files) {
          updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description }, { new: true });
          res.status(200).json(updatedPost);
        } else {
            fs.unlink(path.join(__dirname, '..', '/uploads', oldPost.thumbnail), async (err) => {
              if (err) {
                return next(new HttpError(err));
              }
              const { thumbnail } = req.files;
              if (thumbnail.size > 200000) {
                return next(new HttpError("Thumbnail too big. Should be less than 2mb"));
              }
              fileName = thumbnail.name;
              const splittedFileName = fileName.split(".");
              newFileName = splittedFileName[0] + uuid() + "." + splittedFileName[splittedFileName.length - 1];
              thumbnail.mv(path.join(__dirname, "..", "/uploads", newFileName), async (err) => {
                if (err) {
                  return next(new HttpError(err));
                }
                updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description, thumbnail: newFileName }, { new: true });
                if (!updatedPost) {
                  return next(new HttpError("Couldn't update post", 400));
                }
                res.status(200).json(updatedPost);
              });
            });
        }
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};




//DELETE POST
//DELETE : api/posts/:id
//PROTECTED
const deletePost = async (req, res, next) => {
  try{
    const postId = req.params.id;
    if(!postId){
      return next(new HttpError("Post unavailable", 400))
    }
    const post = await Post.findById(postId);
    const fileName = post?.thumbnail;
    if(req.user.id == post.creator){
      fs.unlink(path.join(__dirname, '..', '/uploads', fileName), async (err)=>{
        if(err){
          return next(new HttpError(err))
        }else{
          await Post.findByIdAndDelete(postId);
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser?.posts -1;
          await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})
          res.json(`Post ${postId} deleted successfully`)
        }
      })
    }else{
      return next(new HttpError("Post couldn't be deleted", 403))
    }
  }
  catch (error){
    return next(new HttpError(error));
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  getCatPosts,
  getUserPosts,
  editPost,
  deletePost,
};
