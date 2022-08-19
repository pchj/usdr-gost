const express = require('express');
const _ = require('lodash-checkit');
const path = require('path');
const { sendPassCode } = require('../lib/email');

const router = express.Router({ mergeParams: true });
const {
    getUser,
    getAccessToken,
    createAccessToken,
    incrementAccessTokenUses,
    markAccessTokenUsed,
} = require('../db');

// NOTE(mbroussard): previously we allowed 2 uses to accommodate automated email systems that prefetch
// links. Now, we send login links through a clientside redirect instead so this should not be necessary.
const MAX_ACCESS_TOKEN_USES = 1;

// the validation URL is sent in the authentication email:
//     http://localhost:3000/api/sessions/?passcode=97fa7091-77ae-4905-b62e-97a7b4699abd
//
router.get('/', async (req, res) => {
    const { passcode } = req.query;
    if (passcode) {
        if (process.env.NODE_ENV === 'test') {
            // reverted code change here: https://github.com/usdigitalresponse/usdr-gost/commit/3926582cf6e644c6f5ef029653afba828843c9b0#diff-ecce826cf8cbf1d020c07a6c345d0d7931488478a19821da68a979f4b74556f0R25
            const token = await getAccessToken(passcode);
            if (!token) {
                res.redirect(`/#/login?message=${encodeURIComponent('Invalid access token')}`);
            } else if (new Date() > token.expires) {
                res.redirect(
                    `/#/login?message=${encodeURIComponent('Access token has expired')}`,
                );
            } else if (token.used) {
                res.redirect(`/#/login?message=${encodeURIComponent(
                    'Login link has already been used - please re-submit your email address',
                )}`);
            } else {
                const uses = await incrementAccessTokenUses(passcode);
                if (uses > 1) {
                    await markAccessTokenUsed(passcode);
                }
                res.cookie('userId', token.user_id, { signed: true });
                res.redirect(process.env.WEBSITE_DOMAIN || '/');
            }
        } else {
            res.sendFile(path.join(__dirname, '../../static/login_redirect.html'));
        }
    } else if (req.signedCookies && req.signedCookies.userId) {
        const user = await getUser(req.signedCookies.userId);
        res.json({ user });
    } else {
        res.json({ message: 'No session' });
    }
});

router.post('/init', async (req, res) => {
    const WEBSITE_DOMAIN = process.env.WEBSITE_DOMAIN || '';
    const { passcode, redirectTo } = req.body;
    if (!passcode) {
        res.redirect(`${WEBSITE_DOMAIN}/#/login?message=${encodeURIComponent('Invalid access token')}`);
        return;
    }

    const token = await getAccessToken(passcode);
    if (!token) {
        res.redirect(`${WEBSITE_DOMAIN}/#/login?message=${encodeURIComponent('Invalid access token')}`);
    } else if (new Date() > token.expires) {
        res.redirect(
            `${WEBSITE_DOMAIN}/#/login?message=${encodeURIComponent('Access token has expired')}`,
        );
    } else if (token.used) {
        res.redirect(`${WEBSITE_DOMAIN}/#/login?message=${encodeURIComponent(
            'Login link has already been used - please re-submit your email address',
        )}`);
    } else {
        const uses = await incrementAccessTokenUses(passcode);
        if (uses >= MAX_ACCESS_TOKEN_USES) {
            await markAccessTokenUsed(passcode);
        }
        let destination = WEBSITE_DOMAIN || '/';
        if (redirectTo) {
            destination += `#?redirect_to=${redirectTo}`;
        }
        res.cookie('userId', token.user_id, { signed: true });
        res.redirect(destination);
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('userId');
    res.json({});
});

// eslint-disable-next-line consistent-return
router.post('/', async (req, res, next) => {
    if (!req.body.email) {
        res.statusMessage = 'No Email Address provided';
        return res.sendStatus(400);
    }
    const email = req.body.email.toLowerCase();
    if (!_.isEmail(email)) {
        res.statusMessage = 'Invalid Email Address';
        return res.sendStatus(400);
    }
    const { redirectTo } = req.body;
    try {
        const passcode = await createAccessToken(email);
        const apiDomain = process.env.API_DOMAIN || req.headers.origin;
        await sendPassCode(email, passcode, apiDomain, redirectTo);
        res.json({
            success: true,
            message: `Email sent to ${email}. Check your inbox`,
        });
    } catch (e) {
        if (e.message.match(/User .* not found/)) {
            res.json({
                success: false,
                message: e.message,
            });
        } else {
            next(e);
        }
    }
});

module.exports = router;
