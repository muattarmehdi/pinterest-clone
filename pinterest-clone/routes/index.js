var express = require("express");
var router = express.Router();

const userModel = require("./users");
const postModel = require("./post");

const passport = require("passport");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

const upload = require("./multer");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/login", function (req, res, next) {
  res.render("login", { error: req.flash("error") });
});

router.get("/feed", function (req, res, next) {
  res.render("feed");
});

router.post(
  "/upload",
  isLoggedIn,
  upload.single("file"),
  async function (req, res, next) {
    if (!req.file) {
      return res.status(404).send("No file uploaded.");
    }
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const post = await postModel.create({
      postImage: req.file.filename,
      postText: req.body.text,
      user: user._id,
    });

    user.posts.push(post._id);
    await user.save();
    res.send("successful upload");
  }
);

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("posts");
  res.render("profile", { user });
});

router.post("/register", function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullName: req.body.fullName,
  });

  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res) {}
);

router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

module.exports = router;
