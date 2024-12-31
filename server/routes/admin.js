const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const SongRequest = require('../models/SongRequest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET; // Accessing the environment variable

// router.get('/admin', (req, res) => {
//     res.send("Hello from admin route!");
// });

const adminLayout = '../views/layouts/admin';

/**
 * 
 * Check Login
*/
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}


/**
 * GET /
 * Admin - Login Page
*/
router.get('/admin', async (req, res) => {
    try {
        const locals = {
            title: "Admin",
            description: "StrumSpace "
        }

        res.render('admin/index', { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});

/**
 * POST /
 * Admin - Check Login
*/
router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            // return res.status(401).json({ message: 'Invalid credentials' });
            const locals = {
                title: "StrumSpace-Error",
                description: ""
            }
            res.render('invalid', { locals });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // return res.status(401).json({ message: 'Invalid credentials' });
            const locals = {
                title: "StrumSpace-Error",
                description: ""
            }
            res.render('invalid', { locals });
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/dashboard');

    } catch (error) {
        console.log(error);
    }
});

/**
 * GET /
 * Admin Dashboard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: 'Dashboard',
            description: 'StrumSpace '
        }

        const data = await Post.find();
        res.render('admin/dashboard', {
            locals,
            data,
            layout: adminLayout
        });

    } catch (error) {
        console.log(error);
    }

});

/**
 * GET /
 * Admin - Create New Post
*/
router.get('/add-post', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: 'Add Post',
            description: 'StrumSpace '
        }

        const data = await Post.find();
        res.render('admin/add-post', {
            locals,
            layout: adminLayout
        });

    } catch (error) {
        console.log(error);
    }

});


/**
 * POST /
 * Admin - Create New Post
*/
router.post('/add-post', authMiddleware, async (req, res) => {
    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                embed: req.body.embed,
                body: req.body.body
            });

            await Post.create(newPost);
            res.redirect('/dashboard');
        } catch (error) {
            console.log(error);
        }

    } catch (error) {
        console.log(error);
    }
});

/**
 * GET /
 * Admin - Create New Post
*/
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {

        const locals = {
            title: "Edit Post",
            description: "Free NodeJs User Management System",
        };

        const data = await Post.findOne({ _id: req.params.id });

        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout
        })

    } catch (error) {
        console.log(error);
    }

});


/**
 * PUT /
 * Admin - Create New Post
*/
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try {

        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            embed: req.body.embed,
            updatedAt: Date.now()
        });

        res.redirect(`/edit-post/${req.params.id}`);

    } catch (error) {
        console.log(error);
    }

});




/**
 * POST /
 * Admin - Register
*/
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({ username, password: hashedPassword });
            res.status(201).json({ message: 'User Created', user });
        } catch (error) {
            if (error.code === 11000) {
                res.status(409).json({ message: 'User already in use' });
            }
            res.status(500).json({ message: 'Internal server error' })
        }

    } catch (error) {
        console.log(error);
    }
});

/**
 * DELETE /
 * Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

    try {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }

});

/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    //res.json({ message: 'Logout successful.'});
    res.redirect('/');
});

// Route to display requested songs
router.get('/song-requests', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: 'Requested Songs',
            description: 'List of songs requested by users'
        };

        // Fetch all song requests from the database
        const songRequests = await SongRequest.find().sort({ createdAt: -1 });

        // Render the SongRequest.ejs view with the fetched data
        res.render('admin/SongRequest', {
            locals,
            songRequests,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
        res.redirect('/dashboard');
    }
});

/**
 * POST /
 * Admin - Delete Song Request
 */
router.post('/delete-song/:id', async (req, res) => {
    try {
        await SongRequest.findByIdAndDelete(req.params.id);
        res.redirect('/song-requests'); 
    } catch (error) {
        console.log(error);
    }
});


module.exports = router;