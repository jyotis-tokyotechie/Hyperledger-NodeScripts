var express = require('express');
var router = express.Router();
var igxtransaction = require('../api/igxtransaction');

router.post('/testing',igxtransaction.transSetdata )
router.post('/testing1',igxtransaction.transgetdata )

router.post('/testing2',igxtransaction.transgetHistorydata)

module.exports = router;






























