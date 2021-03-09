const express = require('express');
const router = express.Router();

router.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});
router.get('/create-meeting', (req, res)=>{
    res.sendFile(__dirname+'/create-meeting.html');
});
router.get('/join-meeting', (req, res)=>{
    res.sendFile(__dirname+'/join-meeting.html');
});
router.post('/create-meeting-act', (req, res, next) => {
    res.render('dsdsd');
})

module.exports = router;