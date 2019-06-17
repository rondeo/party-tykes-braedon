const async = require('async');
//const localStorage = require('localStorage');
var PageSchema = require('./../../../models/pages');

module.exports.showAllPages = async (req, res, next) => {
    const pages = await PageSchema.find({ user_id : req.session.userid });
    res.render('pages/all-pages', { pages , request_url : 'manage_pages', user: req.session.name, email: req.session.email, role: req.session.role });
}

module.exports.addPage = async (req, res, next) => {
    const slugFest = await PageSchema.find({});
    const slugNames = slugFest.map((val, key) => val.PageSlug);

    res.render('pages/add-page', { mySlugs: slugNames, request_url : 'add_page', user: req.session.name, email: req.session.email, role: req.session.role, user_id: req.session.userid });
}

module.exports.postPage = (req, res, next) => {
    const pages = new PageSchema({
        user_id: req.body.user_id,
        name: req.body.name,
        PageSlug: req.body.PageSlug,
        content: req.body.content,
    });

    async.parallel({
        one(callback) {
            pages.save(((error, data) => {
                if (error) { callback(error); }
                // req.flash('pagesMessage', 'Page added');
            }));
        },
        two(callback) {
            req.flash('success_msg', 'Page added successfully !');
            res.redirect('/cms/all-pages');
        },
    }, (err, results) => { });
}

module.exports.getEditPage = async (req, res, next) => {
    const page = await PageSchema.findById(req.params.id);
    console.log('INSIDE PAGE EDITING : ', page);
    res.render('pages/edit-page', { page , user: req.session.name, email: req.session.email,  request_url : 'manage_pages', role: req.session.role });
}

module.exports.postEditPage = (req, res, next) => {
    PageSchema.findByIdAndUpdate(req.params.id, req.body, (err) => {
        if (err) { console.log(err); }
        req.flash('success_msg', 'Page updated successfully !');
        res.redirect('/cms/all-pages');
    });
}

module.exports.deletePage = (req, res, next) => {
    PageSchema.findByIdAndRemove(req.params.id, (err) => {
        if (err) return next(err);
        req.flash('success_msg', 'Page deleted successfully !');
        res.redirect('/cms/all-pages');
    });
}

module.exports.togglePageStatus = (req, res, next) => {
    PageSchema.findOne({ PageSlug: 'test-slug' }, (err, page) => {
        res.render('pages/test-slug', { page, name: page.name, pageContent: page.content });
    });
}