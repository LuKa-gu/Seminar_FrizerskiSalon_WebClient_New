var express = require('express');
var router = express.Router();

// Seznam poti, ki ustrezajo imenom predlog
const routes = [
    '/',
    '/login',
    '/signup',
    '/dashboard',
    '/delovniki',
    '/storitve',
    '/termini'
];

// Funkcija, ki obravnava zahteve za te poti
const renderView = (req, res) => {
    // Odstranimo začetni '/' in ga uporabimo kot ime predloge
    const viewName = req.path === '/' ? 'index' : req.path.slice(1);
    res.render(viewName);
};

// Z zanko ustvarimo vse poti (generične)
routes.forEach(route => {
    router.get(route, renderView);
});

module.exports = router;
